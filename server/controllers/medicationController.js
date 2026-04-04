const Medication = require('../models/Medication');
const AdherenceLog = require('../models/AdherenceLog');
const User = require('../models/User');
const { calculateAdherence } = require('../utils/aiLogic');
const { sendEmail, emailTemplates } = require('../services/emailService');

// @desc    Get medications for logged in patient
// @route   GET /api/medications
// @access  Private (Patient/Caregiver)
exports.getMedications = async (req, res) => {
  try {
    const medications = await Medication.find({ patientId: req.user.id });
    res.json(medications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add medication
// @route   POST /api/medications
// @access  Private (Doctor/Patient)
exports.addMedication = async (req, res) => {
  console.log('💊 Adding Medication:', req.body);
  console.log('👤 User from token:', req.user);
  
  try {
    const { name, dosage, frequency, scheduleTimes, reminderTimes, startDate, endDate, patientId } = req.body;
    
    // Determine patient ID based on role
    const targetPatientId = req.user.role === 'patient' ? req.user.id : patientId;

    if (!name || !dosage || !frequency) {
      return res.status(400).json({ message: 'Missing required fields: name, dosage, or frequency' });
    }

    // Defensive check for dates
    const finalStartDate = startDate && startDate !== '' ? new Date(startDate) : new Date();
    const finalEndDate = endDate && endDate !== '' ? new Date(endDate) : null;

    if (isNaN(finalStartDate.getTime())) {
      return res.status(400).json({ message: 'Invalid start date format' });
    }

    const medicationData = {
      patientId: targetPatientId,
      prescribedBy: req.user.role === 'doctor' ? req.user.id : null,
      name,
      dosage,
      frequency,
      scheduleTimes: scheduleTimes || reminderTimes || [],
      startDate: finalStartDate,
      endDate: finalEndDate
    };

    console.log('📝 Saving Medication to DB:', medicationData);
    const medication = await Medication.create(medicationData);

    // Send prescription email notification
    try {
      const targetUser = await User.findById(targetPatientId);
      const doctorUser = req.user.role === 'doctor' ? await User.findById(req.user.id) : null;

      if (targetUser && targetUser.email) {
        const prescriptionData = {
          date: medication.createdAt,
          medications: [medication.name],
          instructions: `Take ${dosage} ${frequency} as prescribed`
        };
        
        const emailTemplate = emailTemplates.prescription(prescriptionData, targetUser, doctorUser || { name: 'System' });
        await sendEmail({
          to: targetUser.email,
          ...emailTemplate
        });
        console.log('📧 Prescription email sent successfully');
      }
    } catch (emailError) {
      console.error('⚠️ Email Notification Error:', emailError.message);
      // Non-blocking error
    }

    res.status(201).json(medication);
  } catch (error) {
    console.error('❌ Add Medication Error:', error);
    res.status(error.name === 'ValidationError' ? 400 : 500).json({ 
      message: 'Failed to create medication', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Log medication adherence
// @route   POST /api/medications/log
// @access  Private
exports.logAdherence = async (req, res) => {
  try {
    const { medicationId, taken } = req.body;

    const log = await AdherenceLog.create({
      medicationId,
      patientId: req.user.id,
      taken
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get medication adherence analytics
// @route   GET /api/medications/:id/adherence
// @access  Private
exports.getMedicationAdherence = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify medication belongs to user
    const medication = await Medication.findOne({ _id: id, patientId: req.user.id });
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Get adherence logs for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const logs = await AdherenceLog.find({
      medicationId: id,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    // Calculate adherence percentage
    const totalLogs = logs.length;
    const takenLogs = logs.filter(log => log.taken).length;
    const adherence = totalLogs > 0 ? (takenLogs / totalLogs) * 100 : 100;

    // Calculate current streak
    let currentStreak = 0;
    const sortedLogs = [...logs].reverse();
    for (const log of sortedLogs) {
      if (log.taken) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Get last 7 days data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.createdAt);
        return logDate >= date && logDate < nextDate;
      });
      
      // If there are logs for this day, check if any were taken
      // Otherwise, assume no dose was scheduled
      const dayTaken = dayLogs.length > 0 ? dayLogs.some(log => log.taken) : null;
      last7Days.push(dayTaken);
    }

    res.json({
      adherence,
      streak: currentStreak,
      last7Days,
      totalDoses: totalLogs,
      takenDoses: takenLogs
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// @desc    Delete medication
// @route   DELETE /api/medications/:id
// @access  Private
exports.deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found or not authorized' });
    }

    await Medication.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Medication deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

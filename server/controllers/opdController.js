const mongoose = require('mongoose');
const OPDVisit = require('../models/OPDVisit');
const OPDQueue = require('../models/OPDQueue');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Medication = require('../models/Medication');
const { calculateRiskScore } = require('../utils/aiLogic');
const { sendEmail, emailTemplates } = require('../services/emailService');

// @desc    Register patient for OPD visit
// @route   POST /api/opd/register
// @access  Private
exports.registerOPDPatient = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentId,
      visitType,
      department,
      chiefComplaint,
      symptoms,
      duration,
      severity,
      isEmergency
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Patient or Doctor ID' 
      });
    }

    // Get patient and doctor details
    const [patient, doctor] = await Promise.all([
      User.findById(patientId),
      User.findById(doctorId)
    ]);

    if (!patient || !doctor) {
      return res.status(404).json({ success: false, message: 'Patient or Doctor not found' });
    }

    // Get next queue number
    const queueNumber = await OPDQueue.getNextQueueNumber(doctorId, department || doctor.department);
    
    // Calculate risk score
    const pastVisits = await OPDVisit.find({ patientId });
    const missedAppointments = await Appointment.find({ 
      patientId, 
      status: 'no-show' 
    }).countDocuments();
    
    const { score, classification } = calculateRiskScore(missedAppointments, 90);
    
    // Create OPD Queue entry
    const queueEntry = await OPDQueue.create({
      patientId,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorId,
      department: department || doctor.department || 'General Medicine',
      queueNumber,
      category: visitType,
      priority: isEmergency ? 'emergency' : 'normal',
      ...(appointmentId ? { appointmentId } : {}),
      chiefComplaint: chiefComplaint || 'Routine Checkup',
      riskScore: score,
      riskLevel: classification,
      isEmergency: isEmergency || false
    });

    // Create OPD Visit record
    const opdVisit = await OPDVisit.create({
      patientId,
      doctorId,
      ...(appointmentId ? { appointmentId } : {}),
      visitType,
      department: department || doctor.department || 'General Medicine',
      chiefComplaint: chiefComplaint || 'Routine Checkup',
      symptoms: symptoms || [],
      duration,
      severity,
      consultationFee: 500, // Fixed fee for now
      totalAmount: 500,
      isEmergency: isEmergency || false,
      emergencyLevel: isEmergency ? 'high' : 'low',
      status: 'registered'
    });

    // Update queue entry with visit reference
    queueEntry.opdVisitId = opdVisit._id;
    await queueEntry.save();

    res.status(201).json({
      success: true,
      message: 'Patient registered for OPD visit successfully',
      data: {
        queueEntry: {
          ...queueEntry.toObject(),
          patientName: patient.name,
          doctorName: doctor.name
        },
        opdVisit,
        patient,
        doctor
      }
    });

  } catch (error) {
    console.error('OPD Registration Error:', error);
    // Print full error string temporarily so we can identify the schema violation
    res.status(500).json({ 
      success: false, 
      message: `Server error during OPD registration: ${error.message}`
    });
  }
};

// @desc    Get OPD queue for doctor
// @route   GET /api/opd/queue/:doctorId
// @access  Private
exports.getOPDQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { department } = req.query;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Doctor ID provided' 
      });
    }

    let filter = { doctorId };
    if (department) filter.department = department;

    const queue = await OPDQueue.find(filter)
      .populate('patientId', 'name email phone age gender')
      .populate('appointmentId', 'date time')
      .sort({ 
        priority: 1, // emergency first
        queueNumber: 1 
      });

    // Calculate estimated wait times
    const queueWithWaitTimes = queue.map((patient, index) => {
      const estimatedWaitTime = index * 15; // 15 minutes per patient average
      return {
        ...patient.toObject(),
        estimatedWaitTime,
        position: index + 1
      };
    });

    res.json({
      success: true,
      data: queueWithWaitTimes,
      totalPatients: queue.length,
      waitingPatients: queue.filter(p => p.status === 'waiting').length
    });

  } catch (error) {
    console.error('Get OPD Queue Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch OPD queue', 
      error: error.message 
    });
  }
};

// @desc    Update queue status (call patient, start consultation, etc.)
// @route   PATCH /api/opd/queue/:queueId/status
// @access  Private
exports.updateQueueStatus = async (req, res) => {
  try {
    const { queueId } = req.params;
    const { status, notes } = req.body;

    const queueEntry = await OPDQueue.findById(queueId);
    if (!queueEntry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Queue entry not found' 
      });
    }

    // Update status
    queueEntry.status = status;
    if (notes) queueEntry.notes = notes;
    
    await queueEntry.save();

    // If consultation is starting, update OPD visit
    if (status === 'in-consultation') {
      await OPDVisit.findByIdAndUpdate(
        queueEntry.opdVisitId,
        { 
          startTime: new Date(),
          status: 'in-progress'
        }
      );
    }

    // If consultation is completed, update OPD visit
    if (status === 'completed') {
      await OPDVisit.findByIdAndUpdate(
        queueEntry.opdVisitId,
        { 
          endTime: new Date(),
          status: 'completed'
        }
      );
    }

    res.json({
      success: true,
      message: `Queue status updated to ${status}`,
      data: queueEntry
    });

  } catch (error) {
    console.error('Update Queue Status Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update queue status', 
      error: error.message 
    });
  }
};

// @desc    Notify patient they have been called
// @route   POST /api/opd/queue/:queueId/notify
// @access  Private
exports.notifyPatientCall = async (req, res) => {
  try {
    const { queueId } = req.params;
    
    const queueEntry = await OPDQueue.findById(queueId).populate('patientId', 'name email');
    if (!queueEntry) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    // Attempt to parse patient details robustly
    const patient = queueEntry.patientId;
    if (!patient || !patient.email) {
      // Patient might not have email or it's a dummy patient
      return res.status(200).json({ success: true, message: 'Dummy or email-less patient called' });
    }

    // Set queue status to called so it updates backend tracking
    queueEntry.status = 'called';
    await queueEntry.save();

    // Trigger email via configured emailService using general token template
    const message = `Please proceed to the consultation room immediately. Your queue number ${queueEntry.queueNumber} has been called for the ${queueEntry.department} department.`;
    const emailTemplate = emailTemplates.generalNotification(patient, message, 'urgent');

    await sendEmail({
      to: patient.email,
      ...emailTemplate
    });

    res.json({ success: true, message: 'Patient notified successfully' });

  } catch (error) {
    console.error('Notify Patient Error:', error);
    res.status(500).json({ success: false, message: 'Failed to notify patient' });
  }
};

// @desc    Complete OPD consultation
// @route   POST /api/opd/consultation/:visitId/complete
// @access  Private (Doctor)
exports.completeConsultation = async (req, res) => {
  try {
    const { visitId } = req.params;
    const {
      vitals,
      examination,
      diagnosis,
      investigations,
      treatment,
      consultationFee,
      doctorNotes
    } = req.body;

    const opdVisit = await OPDVisit.findById(visitId);
    if (!opdVisit) {
      return res.status(404).json({ 
        success: false, 
        message: 'OPD visit not found' 
      });
    }

    // Format diagnosis — handle both string and object
    let formattedDiagnosis = diagnosis;
    if (typeof diagnosis === 'string') {
      formattedDiagnosis = {
        final: diagnosis ? [diagnosis] : [],
        provisional: [],
        differential: []
      };
    }

    // Filter medications to only include complete entries
    const validMedications = (treatment?.medications || []).filter(m => m.name).map(m => ({
      name: m.name,
      dosage: m.dosage || 'As prescribed',
      frequency: m.frequency || 'As needed',
      duration: m.duration || '5 days',
      instructions: m.instructions || ''
    }));

    // Update consultation details
    const updateData = {
      vitals: vitals || {},
      examination,
      diagnosis: formattedDiagnosis,
      treatment: {
        medications: validMedications,
        procedures: treatment?.procedures || [],
        advice: treatment?.advice || '',
        followUp: treatment?.followUp || { required: false }
      },
      consultationFee: consultationFee || 500,
      doctorNotes,
      endTime: new Date(),
      status: 'completed'
    };

    // Calculate charges
    const investigationCharges = (investigations?.length || 0) * 200;
    const procedureCharges = (treatment?.procedures?.length || 0) * 500;
    const medicationCharges = validMedications.length * 100;
    
    updateData.investigationCharges = investigationCharges;
    updateData.procedureCharges = procedureCharges;
    updateData.medicationCharges = medicationCharges;

    Object.assign(opdVisit, updateData);
    await opdVisit.save();

    // Update queue status
    await OPDQueue.findOneAndUpdate(
      { opdVisitId: visitId },
      { 
        status: 'completed',
        consultationEndTime: new Date()
      }
    );

    // Create individual Medication records for tracking
    if (validMedications && validMedications.length > 0) {
      await Promise.all(validMedications.map(med => 
        Medication.create({
          patientId: opdVisit.patientId,
          prescribedBy: opdVisit.doctorId,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          startDate: new Date(),
          // Default to 7 days if duration not parsed, or use a default
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        })
      ));
    }

    res.json({
      success: true,
      message: 'Consultation completed and medications prescribed successfully',
      data: opdVisit
    });

  } catch (error) {
    console.error('Complete Consultation Error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to complete consultation: ${error.message}`
    });
  }
};

// @desc    Get OPD visit details
// @route   GET /api/opd/visit/:visitId
// @access  Private
exports.getOPDVisit = async (req, res) => {
  try {
    const { visitId } = req.params;

    const visit = await OPDVisit.findById(visitId)
      .populate('patientId', 'name email phone age gender address')
      .populate('doctorId', 'name department specialization');

    if (!visit) {
      return res.status(404).json({ 
        success: false, 
        message: 'OPD visit not found' 
      });
    }

    res.json({
      success: true,
      data: visit
    });

  } catch (error) {
    console.error('Get OPD Visit Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch OPD visit', 
      error: error.message 
    });
  }
};

// @desc    Get patient OPD history
// @route   GET /api/opd/patient/:patientId/history
// @access  Private
exports.getPatientOPDHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const visits = await OPDVisit.find({ patientId })
      .populate('doctorId', 'name department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await OPDVisit.countDocuments({ patientId });

    res.json({
      success: true,
      data: visits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get Patient OPD History Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch patient OPD history', 
      error: error.message 
    });
  }
};

// @desc    Get OPD statistics
// @route   GET /api/opd/stats
// @access  Private
exports.getOPDStats = async (req, res) => {
  try {
    const { doctorId, department, dateRange = 'today' } = req.query;
    
    if (doctorId && !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Doctor ID provided' 
      });
    }
    
    let dateFilter = {};
    const today = new Date();
    
    switch (dateRange) {
      case 'today':
        dateFilter = {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lte: new Date(today.setHours(23, 59, 59, 999))
        };
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { $gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { $gte: monthAgo };
        break;
    }

    let filter = { createdAt: dateFilter };
    if (doctorId) filter.doctorId = doctorId;
    if (department) filter.department = department;

    // Get visit statistics
    const [
      totalVisits,
      completedVisits,
      emergencyVisits,
      revenue
    ] = await Promise.all([
      OPDVisit.countDocuments(filter),
      OPDVisit.countDocuments({ ...filter, status: 'completed' }),
      OPDVisit.countDocuments({ ...filter, isEmergency: true }),
      OPDVisit.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Get queue statistics
    const queueStats = await OPDQueue.aggregate([
      { $match: { checkInTime: dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgWaitTime: { $avg: '$waitTime' },
          avgConsultationTime: { $avg: '$consultationDuration' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        visits: {
          total: totalVisits,
          completed: completedVisits,
          pending: totalVisits - completedVisits,
          emergency: emergencyVisits
        },
        queue: queueStats,
        revenue: revenue[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Get OPD Stats Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch OPD statistics', 
      error: error.message 
    });
  }
};

// @desc    Process payment for OPD visit
// @route   POST /api/opd/visit/:visitId/payment
// @access  Private
exports.processPayment = async (req, res) => {
  try {
    const { visitId } = req.params;
    const { paymentMethod, amount } = req.body;

    const visit = await OPDVisit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ 
        success: false, 
        message: 'OPD visit not found' 
      });
    }

    const paidAmount = amount || visit.totalAmount;
    const paymentStatus = paidAmount >= visit.totalAmount ? 'paid' : 'partial';

    visit.paymentMethod = paymentMethod;
    visit.paidAmount = paidAmount;
    visit.paymentStatus = paymentStatus;
    
    await visit.save();

    res.json({
      success: true,
      message: `Payment processed successfully. Status: ${paymentStatus}`,
      data: {
        paidAmount,
        totalAmount: visit.totalAmount,
        balance: visit.totalAmount - paidAmount,
        paymentStatus
      }
    });

  } catch (error) {
    console.error('Process Payment Error:', error);
    res.status(500).json({ 
      success: false, 
    });
  }
};

// @desc    Search patients for OPD registration
// @route   GET /api/opd/patients/search
// @access  Private (Doctor/Staff)
exports.searchPatients = async (req, res) => {
  try {
    console.log('Search Patients Request - Query:', req.query);
    const { query } = req.query;
    
    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const patients = await User.find({
      role: 'patient',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name email phone age gender')
    .limit(10);

    res.json({
      success: true,
      data: patients
    });

  } catch (error) {
    console.error('Search Patients Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search patients', 
      error: error.message 
    });
  }
};

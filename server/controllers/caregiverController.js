const User = require('../models/User');
const Medication = require('../models/Medication');
const AdherenceLog = require('../models/AdherenceLog');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../services/emailService');

// @desc    Get linked patients for caregiver
// @route   GET /api/caregiver/patients
// @access  Private (Caregiver)
exports.getLinkedPatients = async (req, res) => {
  try {
    const caregiverId = req.user.id;
    
    // For now, return mock data since we don't have patient linking implemented
    const mockPatients = [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        vitals: {
          bloodPressure: '120/80',
          heartRate: '72',
          bloodSugar: '95'
        },
        nextAppointment: '2026-04-05 10:00 AM',
        adherence: '85%',
        medications: ['Metformin', 'Lisinopril']
      },
      {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        vitals: {
          bloodPressure: '118/75',
          heartRate: '68',
          bloodSugar: '88'
        },
        nextAppointment: '2026-04-06 2:00 PM',
        adherence: '92%',
        medications: ['Aspirin', 'Vitamin D']
      }
    ];
    
    res.json(mockPatients);
    
  } catch (error) {
    console.error('Get Linked Patients Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch linked patients', 
      error: error.message 
    });
  }
};

// @desc    Get caregiver notifications
// @route   GET /api/caregiver/notifications
// @access  Private (Caregiver)
exports.getCaregiverNotifications = async (req, res) => {
  try {
    const caregiverId = req.user.id;
    
    // For now, return mock notifications
    const mockNotifications = [
      {
        _id: '1',
        type: 'alert',
        message: 'John Doe missed morning medication',
        patientName: 'John Doe',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        priority: 'high'
      },
      {
        _id: '2',
        type: 'reminder',
        message: 'Jane Smith has appointment tomorrow',
        patientName: 'Jane Smith',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        priority: 'medium'
      },
      {
        _id: '3',
        type: 'alert',
        message: 'John Doe blood pressure reading is elevated',
        patientName: 'John Doe',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        priority: 'high'
      }
    ];
    
    res.json(mockNotifications);
    
  } catch (error) {
    console.error('Get Caregiver Notifications Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications', 
      error: error.message 
    });
  }
};

// @desc    Send reminder to patient
// @route   POST /api/caregiver/send-reminder
// @access  Private (Caregiver)
exports.sendReminder = async (req, res) => {
  try {
    const { patientId, message, type } = req.body;
    const caregiverId = req.user.id;
    
    // Create notification for patient
    await Notification.create({
      userId: patientId,
      message: `Caregiver Reminder: ${message}`,
      type: 'reminder',
      priority: 'medium',
      channels: ['in-app', 'sms'],
      relatedId: caregiverId,
      relatedType: 'caregiver'
    });

    // Send email reminder to patient
    const patient = await User.findById(patientId);
    if (patient) {
      const medicationData = {
        name: 'Medication Reminder',
        dosage: 'As prescribed',
        frequency: 'As scheduled'
      };
      
      const emailTemplate = emailTemplates.medicationReminder(medicationData, patient);
      await sendEmail({
        to: patient.email,
        ...emailTemplate
      });
    }
    
    res.json({
      success: true,
      message: 'Reminder sent successfully'
    });
    
  } catch (error) {
    console.error('Send Reminder Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send reminder', 
      error: error.message 
    });
  }
};

// @desc    Get patient status
// @route   GET /api/caregiver/patient-status/:patientId
// @access  Private (Caregiver)
exports.getPatientStatus = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // For now, return mock status
    const mockStatus = {
      patientId,
      status: 'Good',
      lastMedicationTaken: '2 hours ago',
      nextMedicationDue: '6 hours',
      vitals: {
        bloodPressure: '120/80',
        heartRate: '72',
        temperature: '98.6°F',
        bloodSugar: '95'
      },
      adherence: {
        today: '85%',
        weekly: '88%',
        monthly: '90%'
      },
      alerts: [
        'Blood pressure slightly elevated',
        'Missed evening medication yesterday'
      ]
    };
    
    res.json(mockStatus);
    
  } catch (error) {
    console.error('Get Patient Status Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get patient status', 
      error: error.message 
    });
  }
};

const User = require('../models/User');
const Medication = require('../models/Medication');
const AdherenceLog = require('../models/AdherenceLog');
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');
const OPDVisit = require('../models/OPDVisit');
const { sendEmail, emailTemplates } = require('../services/emailService');

// @desc    Get linked patients for caregiver
// @route   GET /api/caregiver/patients
// @access  Private (Caregiver)
exports.getLinkedPatients = async (req, res) => {
  try {
    // Get all patients from the database
    const patients = await User.find({ role: 'patient' })
      .select('name email phone age gender createdAt')
      .sort({ name: 1 });

    // For each patient, get their latest vitals & appointment info
    const enrichedPatients = await Promise.all(patients.map(async (patient) => {
      const p = patient.toObject();

      // Get latest OPD visit for vitals
      const latestVisit = await OPDVisit.findOne({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .select('vitals status department createdAt');

      // Get next upcoming appointment
      const nextAppointment = await Appointment.findOne({
        patientId: patient._id,
        date: { $gte: new Date() },
        status: { $nin: ['cancelled', 'completed'] }
      }).sort({ date: 1 }).select('date time department');

      // Get total visits count
      const totalVisits = await OPDVisit.countDocuments({ patientId: patient._id });

      // Get medications from latest visit
      const visitWithMeds = await OPDVisit.findOne({
        patientId: patient._id,
        'treatment.medications': { $exists: true, $ne: [] }
      }).sort({ createdAt: -1 }).select('treatment.medications');

      p.vitals = latestVisit?.vitals || {};
      p.nextAppointment = nextAppointment
        ? `${new Date(nextAppointment.date).toLocaleDateString()} ${nextAppointment.time || ''}`
        : null;
      p.totalVisits = totalVisits;
      p.lastVisit = latestVisit?.createdAt || null;
      p.department = latestVisit?.department || 'N/A';
      p.medications = (visitWithMeds?.treatment?.medications || []).map(m => m.name).filter(Boolean);

      return p;
    }));

    res.json(enrichedPatients);
    
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
    // Get real notifications from database
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('userId', 'name');

    const formatted = notifications.map(n => ({
      _id: n._id,
      type: n.type || 'info',
      message: n.message,
      patientName: n.userId?.name || 'Unknown',
      createdAt: n.createdAt,
      priority: n.priority || 'medium',
      read: n.read || false
    }));

    // If no notifications in DB, get recent OPD activity as notifications
    if (formatted.length === 0) {
      const recentVisits = await OPDVisit.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('patientId', 'name')
        .populate('doctorId', 'name');

      const visitNotifications = recentVisits.map(v => ({
        _id: v._id,
        type: v.isEmergency ? 'alert' : v.status === 'completed' ? 'update' : 'reminder',
        message: v.isEmergency
          ? `Emergency visit: ${v.patientId?.name || 'Patient'} — ${v.department}`
          : v.status === 'completed'
            ? `Consultation completed: ${v.patientId?.name || 'Patient'} — ${v.department}`
            : `Pending visit: ${v.patientId?.name || 'Patient'} — ${v.chiefComplaint || v.department}`,
        patientName: v.patientId?.name || 'Unknown',
        createdAt: v.createdAt,
        priority: v.isEmergency ? 'high' : 'medium',
        read: false
      }));

      return res.json(visitNotifications);
    }

    res.json(formatted);
    
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
    
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Create notification for patient
    await Notification.create({
      userId: patientId,
      message: `Caregiver Reminder: ${message}`,
      type: 'reminder',
      priority: 'medium',
      channels: ['in-app', 'email'],
      relatedId: caregiverId,
      relatedType: 'caregiver'
    });

    // Send email based on type
    if (type === 'medication') {
      // Get real medications from latest visit
      const visitWithMeds = await OPDVisit.findOne({
        patientId,
        'treatment.medications': { $exists: true, $ne: [] }
      }).sort({ createdAt: -1 }).select('treatment.medications');

      const meds = visitWithMeds?.treatment?.medications || [];
      const medicationData = {
        name: meds.length > 0 ? meds.map(m => m.name).join(', ') : 'Your prescribed medications',
        dosage: meds.length > 0 ? meds[0].dosage : 'As prescribed',
        frequency: meds.length > 0 ? meds[0].frequency : 'As scheduled'
      };
      
      const emailTemplate = emailTemplates.medicationReminder(medicationData, patient);
      await sendEmail({ to: patient.email, ...emailTemplate });
    } else {
      // General reminder with custom message
      const emailTemplate = emailTemplates.generalNotification(patient, message, 'normal');
      await sendEmail({ to: patient.email, ...emailTemplate });
    }
    
    res.json({
      success: true,
      message: `Reminder sent to ${patient.name} (${patient.email})`
    });
    
  } catch (error) {
    console.error('Send Reminder Error Detail:', error);
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
    
    const patient = await User.findById(patientId).select('name email phone age gender');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Get latest vitals from OPD visit
    const latestVisit = await OPDVisit.findOne({ patientId })
      .sort({ createdAt: -1 })
      .select('vitals diagnosis treatment status department createdAt');

    // Get total visits
    const totalVisits = await OPDVisit.countDocuments({ patientId });
    const completedVisits = await OPDVisit.countDocuments({ patientId, status: 'completed' });
    const emergencyVisits = await OPDVisit.countDocuments({ patientId, isEmergency: true });

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      patientId,
      date: { $gte: new Date() },
      status: { $nin: ['cancelled'] }
    }).sort({ date: 1 }).limit(3).select('date time department status');

    // Get recent medications
    const visitWithMeds = await OPDVisit.findOne({
      patientId,
      'treatment.medications': { $exists: true, $ne: [] }
    }).sort({ createdAt: -1 }).select('treatment');

    const status = {
      patient: patient.toObject(),
      status: emergencyVisits > 0 ? 'Needs Attention' : completedVisits > 0 ? 'Stable' : 'New Patient',
      vitals: latestVisit?.vitals || {},
      lastVisitDate: latestVisit?.createdAt || null,
      lastDepartment: latestVisit?.department || null,
      lastDiagnosis: latestVisit?.diagnosis || null,
      stats: {
        totalVisits,
        completedVisits,
        emergencyVisits
      },
      upcomingAppointments,
      currentMedications: visitWithMeds?.treatment?.medications || [],
      advice: visitWithMeds?.treatment?.advice || ''
    };
    
    res.json(status);
    
  } catch (error) {
    console.error('Get Patient Status Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get patient status', 
      error: error.message 
    });
  }
};

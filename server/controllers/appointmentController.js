const Appointment = require('../models/Appointment');
const Medication = require('../models/Medication');
const AdherenceLog = require('../models/AdherenceLog');
const User = require('../models/User');
const { calculateRiskScore } = require('../utils/aiLogic');
const { sendEmail, emailTemplates } = require('../services/emailService');

// @desc    Get all appointments for a user (patient or doctor)
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'patient') filter.patientId = req.user.id;
    if (req.user.role === 'doctor') filter.doctorId = req.user.id;

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .sort({ date: 1, time: 1 });
      
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason, experience, notes } = req.body;

    // AI logic: Evaluate risk score upon booking
    const pastAppointments = await Appointment.find({ patientId: req.user.id });
    const missedAppointments = pastAppointments.filter(a => a.status === 'no-show').length;

    // Basic mock of adherence for prediction
    const adherenceLogs = await AdherenceLog.find({ patientId: req.user.id });
    let adherencePercentage = 100;
    if (adherenceLogs.length > 0) {
      const taken = adherenceLogs.filter(l => l.taken).length;
      adherencePercentage = (taken / adherenceLogs.length) * 100;
    }

    const { score, classification } = calculateRiskScore(missedAppointments, adherencePercentage);

    const appointment = await Appointment.create({
      patientId: req.user.id,
      doctorId,
      date,
      time,
      reason: reason || '',
      experience: experience || '',
      notes: notes || '',
      riskScore: score,
      riskLevel: classification
    });

    // Send appointment confirmation emails
    const [patient, doctor] = await Promise.all([
      User.findById(req.user.id),
      User.findById(doctorId)
    ]);

    if (patient && doctor) {
      // Send to patient
      const patientEmailTemplate = emailTemplates.appointmentBooked(appointment, patient, doctor, 'patient');
      await sendEmail({
        to: patient.email,
        ...patientEmailTemplate
      });

      // Send to doctor
      const doctorEmailTemplate = emailTemplates.appointmentBooked(appointment, patient, doctor, 'doctor');
      await sendEmail({
        to: doctor.email,
        ...doctorEmailTemplate
      });
    }

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get live queue for doctor
// @route  GET /api/appointments/queue/live
// @access Private (Doctor)
exports.getLiveQueue = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      doctorId: req.user.id,
      date: { $gte: today },
      status: 'scheduled'
    })
    .populate('patientId', 'name')
    .sort({ time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// @desc   Export appointments to CSV
// @route  GET /api/appointments/export
// @access Private
exports.exportAppointments = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'patient') filter.patientId = req.user.id;
    if (req.user.role === 'doctor') filter.doctorId = req.user.id;

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .sort({ date: 1, time: 1 });

    const csvHeaders = 'Date,Time,Doctor,Patient,Reason,Risk Level,Status\n';
    const csvRows = appointments.map(a => {
      const date = new Date(a.date).toLocaleDateString();
      const time = a.time || 'N/A';
      const doctor = a.doctorId?.name || 'N/A';
      const patient = a.patientId?.name || 'N/A';
      const reason = (a.reason || '').replace(/,/g, ';').replace(/\n/g, ' ');
      const risk = a.riskLevel || 'LOW';
      const status = a.status || 'scheduled';
      return `${date},${time},${doctor},${patient},${reason},${risk},${status}`;
    }).join('\n');

    res.header('Content-Type', 'text/csv');
    res.send(csvHeaders + csvRows);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

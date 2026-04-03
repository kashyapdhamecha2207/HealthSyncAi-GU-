const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/dashboard/admin
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const noShowAppointments = await Appointment.countDocuments({ status: 'no-show' });
    const noShowRate = totalAppointments === 0 ? 0 : (noShowAppointments / totalAppointments) * 100;
    
    // Example analytics payload for Recharts
    const recentActivity = await Appointment.find().sort({ createdAt: -1 }).limit(5).populate('patientId', 'name').populate('doctorId', 'name');

    res.json({
      totalAppointments,
      noShowAppointments,
      noShowRate: noShowRate.toFixed(2) + '%',
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

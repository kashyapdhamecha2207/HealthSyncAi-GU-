const User = require('../models/User');
const Appointment = require('../models/Appointment');
const OPDVisit = require('../models/OPDVisit');
const Medication = require('../models/Medication');

// @desc    Get doctor's patients
// @route   GET /api/doctor/patients
// @access  Private (Doctor)
exports.getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get all appointments for this doctor
    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name email phone age gender createdAt')
      .sort({ createdAt: -1 });

    // Extract unique patients
    const uniquePatients = new Map();
    
    appointments.forEach(appointment => {
      if (appointment.patientId && !uniquePatients.has(appointment.patientId._id.toString())) {
        const patient = appointment.patientId.toObject();
        
        // Calculate additional patient data
        const patientAppointments = appointments.filter(app => 
          app.patientId._id.toString() === patient._id.toString()
        );
        
        patient.appointmentCount = patientAppointments.length;
        patient.lastVisit = patientAppointments[0]?.date;
        patient.totalSpent = patientAppointments.length * 100; // Mock calculation
        patient.adherenceRate = 85; // Mock adherence rate
        
        uniquePatients.set(patient._id.toString(), patient);
      }
    });

    const patientsList = Array.from(uniquePatients.values());
    
    res.json(patientsList);

  } catch (error) {
    console.error('Get Doctor Patients Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch patients', 
      error: error.message 
    });
  }
};

// @desc    Get doctor's dashboard statistics
// @route   GET /api/doctor/dashboard/stats
// @access  Private (Doctor)
exports.getDoctorDashboardStats = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's appointments
    const todayAppointments = await Appointment.find({
      doctorId,
      date: { $gte: today }
    });

    // Get all appointments
    const allAppointments = await Appointment.find({ doctorId });

    // Get OPD visits
    const opdVisits = await OPDVisit.find({ doctorId });

    // Calculate statistics
    const stats = {
      todayAppointments: todayAppointments.length,
      totalPatients: new Set(allAppointments.map(app => app.patientId.toString())).size,
      highRiskPatients: todayAppointments.filter(app => app.riskLevel === 'HIGH').length,
      avgWaitTime: 15, // Mock calculation
      completedAppointments: allAppointments.filter(app => app.status === 'completed').length,
      totalRevenue: opdVisits.reduce((sum, visit) => sum + (visit.totalAmount || 0), 0)
    };

    res.json(stats);

  } catch (error) {
    console.error('Get Doctor Stats Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard statistics', 
      error: error.message 
    });
  }
};

// @desc    Update appointment status
// @route   PATCH /api/doctor/appointments/:id/status
// @access  Private (Doctor)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const doctorId = req.user.id;

    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    if (appointment.doctorId.toString() !== doctorId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this appointment' 
      });
    }

    appointment.status = status;
    await appointment.save();

    res.json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: appointment
    });

  } catch (error) {
    console.error('Update Appointment Status Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update appointment status', 
      error: error.message 
    });
  }
};

// @desc    Get all real doctors
// @route   GET /api/doctors
// @access  Public
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ 
      role: 'doctor'
    })
    .sort({ name: 1 });

    res.json({
      success: true,
      data: doctors
    });

  } catch (error) {
    console.error('Get All Doctors Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch doctors', 
      error: error.message 
    });
  }
};

// @desc    Get doctors by department
// @route   GET /api/doctors/department/:department
// @access  Public
exports.getDoctorsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    
    const doctors = await User.find({ 
      role: 'doctor',
      department,
      status: 'active'
    })
    .select('name email department speciality')
    .sort({ name: 1 });

    res.json({
      success: true,
      data: doctors
    });

  } catch (error) {
    console.error('Get Doctors by Department Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch doctors', 
      error: error.message 
    });
  }
};

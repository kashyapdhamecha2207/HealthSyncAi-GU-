const express = require('express');
const router = express.Router();
const {
  getDoctorPatients,
  getDoctorDashboardStats,
  updateAppointmentStatus,
  getAllDoctors,
  getDoctorsByDepartment
} = require('../controllers/doctorController');
const { auth, authorize } = require('../middleware/auth');

// Public routes (no authentication needed)
router.get('/all', getAllDoctors);
router.get('/department/:department', getDoctorsByDepartment);

// Apply doctor authorization to protected routes
router.use(auth);
router.use(authorize('doctor'));

// Patient management
router.get('/patients', getDoctorPatients);

// Dashboard statistics
router.get('/dashboard/stats', getDoctorDashboardStats);

// Appointment management
router.patch('/appointments/:id/status', updateAppointmentStatus);

module.exports = router;

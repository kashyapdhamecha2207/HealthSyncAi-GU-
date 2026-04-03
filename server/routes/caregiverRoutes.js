const express = require('express');
const router = express.Router();
const {
  getLinkedPatients,
  getCaregiverNotifications,
  sendReminder,
  getPatientStatus
} = require('../controllers/caregiverController');
const { auth, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// Apply caregiver authorization to all routes
router.use(authorize('caregiver'));

// Patient management
router.get('/patients', getLinkedPatients);

// Notifications
router.get('/notifications', getCaregiverNotifications);

// Communication
router.post('/send-reminder', sendReminder);

// Patient monitoring
router.get('/patient-status/:patientId', getPatientStatus);

module.exports = router;

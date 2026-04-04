const express = require('express');
const router = express.Router();
const {
  registerOPDPatient,
  getOPDQueue,
  updateQueueStatus,
  notifyPatientCall,
  completeConsultation,
  getOPDVisit,
  getPatientOPDHistory,
  getOPDStats,
  processPayment,
  searchPatients
} = require('../controllers/opdController');
const { auth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// Patient Registration and Queue Management
router.post('/register', registerOPDPatient);
router.get('/patients/search', searchPatients);
router.get('/queue/:doctorId', getOPDQueue);
router.patch('/queue/:queueId/status', updateQueueStatus);
router.post('/queue/:queueId/notify', notifyPatientCall);

// Consultation Management
router.post('/consultation/:visitId/complete', completeConsultation);
router.get('/visit/:visitId', getOPDVisit);
router.post('/visit/:visitId/payment', processPayment);

// Patient History and Statistics
router.get('/patient/:patientId/history', getPatientOPDHistory);
router.get('/stats', getOPDStats);

module.exports = router;

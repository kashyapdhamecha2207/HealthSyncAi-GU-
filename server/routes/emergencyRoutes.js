const express = require('express');
const router = express.Router();
const {
  detectEmergency,
  getPriorityQueue,
  createPrioritySlot,
  getEmergencyStats
} = require('../controllers/emergencyController');
const { auth, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// Emergency detection and routing
router.post('/detect', authorize('system'), detectEmergency);
router.get('/priority-queue', authorize('doctor', 'admin'), getPriorityQueue);
router.post('/priority-slot', authorize('doctor', 'admin'), createPrioritySlot);
router.get('/stats', authorize('admin'), getEmergencyStats);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  detectEmergency,
  getPriorityQueue,
  createPrioritySlot,
  getEmergencyStats,
  markAsSeen
} = require('../controllers/emergencyController');
const { auth, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// Emergency detection and routing
router.post('/detect', detectEmergency);
router.get('/priority-queue', getPriorityQueue);
router.post('/priority-slot', createPrioritySlot);
router.get('/stats', getEmergencyStats);
router.patch('/queue/:id/seen', markAsSeen);

module.exports = router;

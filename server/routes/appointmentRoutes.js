const express = require('express');
const router = express.Router();
const { 
  getAppointments, 
  createAppointment, 
  getLiveQueue,
  exportAppointments
} = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.get('/export', exportAppointments);

router.route('/')
  .get(getAppointments)
  .post(authorize('patient', 'admin'), createAppointment);

router.get('/queue/live', authorize('doctor'), getLiveQueue);

module.exports = router;

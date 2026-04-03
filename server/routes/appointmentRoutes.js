const express = require('express');
const router = express.Router();
const { getAppointments, createAppointment, getLiveQueue } = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.route('/')
  .get(getAppointments)
  .post(authorize('patient', 'admin'), createAppointment);

router.get('/queue/live', authorize('doctor'), getLiveQueue);

module.exports = router;

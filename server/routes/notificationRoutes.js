const express = require('express');
const router = express.Router();
const { getNotifications, sendNotification, sendAppointmentReminder, sendMedicationReminder } = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.route('/')
  .get(getNotifications)
  .post(sendNotification);

router.post('/send', sendNotification);

router.post('/appointment-reminder', sendAppointmentReminder);
router.post('/medication-reminder', sendMedicationReminder);

module.exports = router;

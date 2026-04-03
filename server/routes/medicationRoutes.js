const express = require('express');
const router = express.Router();
const { getMedications, addMedication, logAdherence, getMedicationAdherence } = require('../controllers/medicationController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.route('/')
  .get(getMedications)
  .post(addMedication);

router.post('/log', logAdherence);
router.get('/:id/adherence', getMedicationAdherence);

module.exports = router;

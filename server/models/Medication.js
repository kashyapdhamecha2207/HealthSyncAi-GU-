const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true }, // e.g., 'Twice a day'
  scheduleTimes: [{ type: String }], // e.g., ['09:00', '21:00']
  startDate: { type: Date, required: true },
  endDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Medication', MedicationSchema);

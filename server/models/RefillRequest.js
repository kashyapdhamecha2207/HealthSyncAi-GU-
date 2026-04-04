const mongoose = require('mongoose');

const RefillRequestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication' },
  medicationName: { type: String, required: true },
  dosage: { type: String },
  frequency: { type: String },
  requestedDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('RefillRequest', RefillRequestSchema);

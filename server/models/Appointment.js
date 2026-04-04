const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'no-show', 'cancelled'], 
    default: 'scheduled' 
  },
  estimatedDuration: { type: Number, default: 30 }, // in minutes
  riskScore: { type: Number, default: 0 }, // 0 to 1
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  isPriority: { type: Boolean, default: false },
  emergencyLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'low' 
  },
  reason: { type: String, default: '' },
  experience: { type: String, default: '' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);

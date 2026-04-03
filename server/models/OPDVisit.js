const mongoose = require('mongoose');

const OPDVisitSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  
  // Visit Details
  visitType: { 
    type: String, 
    enum: ['new', 'followup', 'emergency', 'review'], 
    default: 'new' 
  },
  department: { type: String, required: true },
  chiefComplaint: { type: String, required: true },
  symptoms: [{ type: String }],
  duration: { type: String },
  severity: { 
    type: String, 
    enum: ['mild', 'moderate', 'severe'], 
    default: 'moderate' 
  },

  // Clinical Examination
  vitals: {
    temperature: { type: Number },
    bloodPressure: { 
      systolic: { type: Number },
      diastolic: { type: Number }
    },
    heartRate: { type: Number },
    respiratoryRate: { type: Number },
    oxygenSaturation: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    bmi: { type: Number }
  },
  examination: {
    general: { type: String },
    systemic: { type: String },
    local: { type: String }
  },

  // Diagnosis and Treatment
  diagnosis: {
    provisional: [{ type: String }],
    final: [{ type: String }],
    differential: [{ type: String }]
  },
  investigations: [{
    type: { type: String, required: true }, // lab, radiology, etc.
    name: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['ordered', 'pending', 'completed', 'normal', 'abnormal'], 
      default: 'ordered' 
    },
    result: { type: String },
    orderedAt: { type: Date, default: Date.now }
  }],
  treatment: {
    medications: [{
      name: { type: String, required: true },
      dosage: { type: String, required: true },
      frequency: { type: String, required: true },
      duration: { type: String, required: true },
      instructions: { type: String }
    }],
    procedures: [{ type: String }],
    advice: { type: String },
    followUp: {
      required: { type: Boolean, default: false },
      after: { type: String }, // days, weeks, months
      instructions: { type: String }
    }
  },

  // Billing
  consultationFee: { type: Number, required: true },
  investigationCharges: { type: Number, default: 0 },
  procedureCharges: { type: Number, default: 0 },
  medicationCharges: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'partial', 'paid'], 
    default: 'pending' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'card', 'online', 'insurance'], 
    default: 'cash' 
  },
  paidAmount: { type: Number, default: 0 },

  // Status and Timestamps
  status: { 
    type: String, 
    enum: ['registered', 'in-progress', 'completed', 'cancelled'], 
    default: 'registered' 
  },
  checkInTime: { type: Date, default: Date.now },
  startTime: { type: Date },
  endTime: { type: Date },
  waitTime: { type: Number }, // in minutes
  consultationDuration: { type: Number }, // in minutes

  // Notes
  doctorNotes: { type: String },
  nurseNotes: { type: String },
  patientNotes: { type: String },

  // Emergency Information
  isEmergency: { type: Boolean, default: false },
  emergencyLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'low' 
  },
  referredTo: { type: String },
  referredFrom: { type: String }
}, { timestamps: true });

// Index for efficient queries
OPDVisitSchema.index({ patientId: 1, createdAt: -1 });
OPDVisitSchema.index({ doctorId: 1, createdAt: -1 });
OPDVisitSchema.index({ status: 1 });
OPDVisitSchema.index({ visitDate: -1 });

// Calculate total amount automatically
OPDVisitSchema.pre('save', function(next) {
  this.totalAmount = this.consultationFee + this.investigationCharges + 
                    this.procedureCharges + this.medicationCharges;
  
  // Calculate consultation duration if both start and end times are present
  if (this.startTime && this.endTime) {
    this.consultationDuration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  
  next();
});

module.exports = mongoose.model('OPDVisit', OPDVisitSchema);

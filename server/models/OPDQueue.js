const mongoose = require('mongoose');

const OPDQueueSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true },
  
  // Queue Management
  queueNumber: { type: Number, required: true },
  priority: { 
    type: String, 
    enum: ['emergency', 'high', 'normal', 'low'], 
    default: 'normal' 
  },
  category: { 
    type: String, 
    enum: ['new', 'followup', 'emergency', 'review'], 
    default: 'new' 
  },

  // Appointment Reference
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  scheduledTime: { type: Date },
  
  // Status Tracking
  status: { 
    type: String, 
    enum: ['waiting', 'called', 'in-consultation', 'completed', 'cancelled'], 
    default: 'waiting' 
  },
  checkInTime: { type: Date, default: Date.now },
  callTime: { type: Date },
  consultationStartTime: { type: Date },
  consultationEndTime: { type: Date },
  
  // Time Metrics
  waitTime: { type: Number }, // in minutes
  consultationDuration: { type: Number }, // in minutes
  totalVisitTime: { type: Number }, // in minutes
  
  // Patient Information
  patientName: { type: String, required: true },
  patientAge: { type: Number },
  patientGender: { type: String },
  chiefComplaint: { type: String },
  
  // AI Risk Assessment
  riskScore: { type: Number, default: 0 },
  riskLevel: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH'], 
    default: 'LOW' 
  },
  
  // Notifications Sent
  notificationsSent: [{
    type: { type: String }, // sms, whatsapp, email, in-app
    sentAt: { type: Date, default: Date.now },
    message: { type: String }
  }],
  
  // Notes
  notes: { type: String },
  doctorNotes: { type: String },
  
  // Cancellation Details
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for efficient queue management
OPDQueueSchema.index({ doctorId: 1, department: 1, status: 1, queueNumber: 1 });
OPDQueueSchema.index({ patientId: 1 });
OPDQueueSchema.index({ status: 1, priority: 1, checkInTime: 1 });
OPDQueueSchema.index({ scheduledTime: 1 });

// Static methods for queue management
OPDQueueSchema.statics.getNextQueueNumber = async function(doctorId, department, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const lastQueue = await this.findOne({
    doctorId,
    department,
    checkInTime: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ queueNumber: -1 });
  
  return lastQueue ? lastQueue.queueNumber + 1 : 1;
};

// Calculate wait time when status changes
OPDQueueSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.isModified('status')) {
    switch (this.status) {
      case 'called':
        this.callTime = now;
        if (this.checkInTime) {
          this.waitTime = Math.round((now - this.checkInTime) / (1000 * 60));
        }
        break;
        
      case 'in-consultation':
        this.consultationStartTime = now;
        if (this.callTime) {
          this.waitTime = Math.round((now - this.checkInTime) / (1000 * 60));
        }
        break;
        
      case 'completed':
        this.consultationEndTime = now;
        if (this.consultationStartTime) {
          this.consultationDuration = Math.round((now - this.consultationStartTime) / (1000 * 60));
        }
        if (this.checkInTime) {
          this.totalVisitTime = Math.round((now - this.checkInTime) / (1000 * 60));
        }
        break;
    }
  }
  
  next();
});

module.exports = mongoose.model('OPDQueue', OPDQueueSchema);

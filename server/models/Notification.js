const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: [
      'in-app', 'sms', 'whatsapp', 'email', 'reminder', 'alert', 'system', 
      'appointment', 'medication', 'followup', 'urgent', 'appointment-reminder', 'medication-reminder'
    ], 
    default: 'in-app' 
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  channels: [{ 
    type: String, 
    enum: ['in-app', 'sms', 'whatsapp', 'email'] 
  }],
  relatedId: { type: mongoose.Schema.Types.Mixed },
  relatedType: { type: String }, // e.g., 'caregiver', 'doctor', 'appointment'
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'failed', 'partial'], 
    default: 'pending' 
  },
  deliveryResults: [{
    channel: String,
    success: Boolean,
    messageId: String,
    error: String
  }],
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);

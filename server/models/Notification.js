const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['in-app', 'sms', 'whatsapp', 'email', 'reminder', 'alert', 'system', 'appointment', 'medication'], 
    default: 'in-app' 
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channels: [{ 
    type: String, 
    enum: ['in-app', 'sms', 'whatsapp', 'email'] 
  }],
  relatedId: { type: mongoose.Schema.Types.Mixed },
  relatedType: { type: String }, // e.g., 'caregiver', 'doctor', 'appointment'
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);

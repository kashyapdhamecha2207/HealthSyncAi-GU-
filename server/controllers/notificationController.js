const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../services/emailService');

// Mock third-party service integrations
const NotificationService = {
  async sendSMS(phoneNumber, message) {
    // Simulate Twilio SMS service
    console.log(`[📱 SMS] Sending to ${phoneNumber}: ${message}`);
    console.log(`[📱 SMS] ✅ Mock Twilio API call successful`);
    return { success: true, sid: 'MOCK_SMS_' + Date.now() };
  },

  async sendWhatsApp(phoneNumber, message) {
    // Simulate WhatsApp Business API
    console.log(`[🟢 WhatsApp] Sending to ${phoneNumber}: ${message}`);
    console.log(`[🟢 WhatsApp] ✅ Mock WhatsApp API call successful`);
    return { success: true, messageId: 'MOCK_WA_' + Date.now() };
  },

  async sendEmail(email, subject, message) {
    // Simulate SendGrid or similar email service
    console.log(`[📧 Email] Sending to ${email}: ${subject}`);
    console.log(`[📧 Email] Body: ${message}`);
    console.log(`[📧 Email] ✅ Mock SendGrid API call successful`);
    return { success: true, messageId: 'MOCK_EMAIL_' + Date.now() };
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send multi-channel notification
// @route   POST /api/notifications/send
// @access  Private
exports.sendNotification = async (req, res) => {
  try {
    const { userId, message, type, channels, priority } = req.body;
    
    // Get user details for contact information
    const user = await User.findById(userId || req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetUserId = userId || req.user.id;
    const notificationChannels = channels || ['in-app'];
    const notificationPriority = priority || 'normal';

    // Create notification record
    const notification = await Notification.create({
      userId: targetUserId,
      message,
      type: type || 'general',
      channels: notificationChannels,
      priority: notificationPriority,
      status: 'pending'
    });

    // Send notifications through selected channels
    const deliveryResults = [];

    for (const channel of notificationChannels) {
      try {
        let result;
        
        switch (channel) {
          case 'sms':
            // Mock phone number - in production, this would come from user profile
            const phoneNumber = '+1234567890'; // Mock number
            result = await NotificationService.sendSMS(phoneNumber, message);
            break;
            
          case 'whatsapp':
            // Mock phone number for WhatsApp
            const whatsappNumber = '+1234567890'; // Mock number
            result = await NotificationService.sendWhatsApp(whatsappNumber, message);
            break;
            
          case 'email':
            // Send real email using emailService
            const emailAddr = user.email;
            let emailContent;
            
            if (type === 'followup') {
              emailContent = emailTemplates.followUpReminder(user, message);
            } else {
              emailContent = emailTemplates.generalNotification(user, message, type);
            }
            
            result = await sendEmail({
              to: emailAddr,
              subject: emailContent.subject,
              html: emailContent.html
            });
            break;
            
          case 'in-app':
          default:
            // In-app notifications are stored in the database
            result = { success: true, channel: 'in-app' };
            break;
        }
        
        deliveryResults.push({
          channel,
          success: result.success,
          messageId: result.messageId || result.sid || null
        });
        
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        deliveryResults.push({
          channel,
          success: false,
          error: error.message
        });
      }
    }

    // Update notification status based on delivery results
    const allSuccessful = deliveryResults.every(r => r.success);
    await Notification.findByIdAndUpdate(notification._id, {
      status: allSuccessful ? 'sent' : 'partial',
      deliveryResults
    });

    console.log(`[🚀 NOTIFICATION SENT] Type: ${type}, Channels: ${notificationChannels.join(', ')}, User: ${user.name}`);

    res.status(201).json({
      notification,
      deliveryResults,
      message: `Notification sent via ${notificationChannels.join(', ')}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send automated appointment reminders
// @route   POST /api/notifications/appointment-reminder
// @access  Private (System)
exports.sendAppointmentReminder = async (req, res) => {
  try {
    const { appointmentId, userId, appointmentDetails, riskLevel } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const appointmentDate = new Date(appointmentDetails.date);
    const timeUntilAppointment = appointmentDate - new Date();
    const hoursUntil = Math.floor(timeUntilAppointment / (1000 * 60 * 60));

    let message, channels, priority;

    // Customize message and channels based on risk level and timing
    if (riskLevel === 'HIGH') {
      priority = 'high';
      channels = ['sms', 'whatsapp', 'email', 'in-app'];
      message = `⚠️ IMPORTANT REMINDER: Your appointment with Dr. ${appointmentDetails.doctorName} is in ${hoursUntil} hours on ${appointmentDate.toLocaleDateString()} at ${appointmentDetails.time}. High no-show risk detected. Please confirm your attendance.`;
    } else if (riskLevel === 'MEDIUM') {
      priority = 'normal';
      channels = ['sms', 'email', 'in-app'];
      message = `📅 REMINDER: Your appointment with Dr. ${appointmentDetails.doctorName} is in ${hoursUntil} hours on ${appointmentDate.toLocaleDateString()} at ${appointmentDetails.time}. Reply CONFIRM to acknowledge.`;
    } else {
      priority = 'low';
      channels = ['email', 'in-app'];
      message = `� Gentle Reminder: Your appointment with Dr. ${appointmentDetails.doctorName} is scheduled for ${appointmentDate.toLocaleDateString()} at ${appointmentDetails.time}.`;
    }

    // Create notification
    const notification = await Notification.create({
      userId,
      message,
      type: 'appointment-reminder',
      channels,
      priority,
      relatedId: appointmentId,
      relatedType: 'appointment'
    });

    // Send through channels
    const deliveryResults = [];
    
    for (const channel of channels) {
      try {
        let result;
        
        switch (channel) {
          case 'sms':
            result = await NotificationService.sendSMS('+1234567890', message);
            break;
          case 'whatsapp':
            result = await NotificationService.sendWhatsApp('+1234567890', message);
            break;
          case 'email':
            result = await NotificationService.sendEmail(user.email, 'Appointment Reminder', message);
            break;
          default:
            result = { success: true, channel: 'in-app' };
        }
        
        deliveryResults.push({ channel, success: result.success });
      } catch (error) {
        deliveryResults.push({ channel, success: false, error: error.message });
      }
    }

    console.log(`[� APPOINTMENT REMINDER] Sent to ${user.name}, Risk: ${riskLevel}, Channels: ${channels.join(', ')}`);

    res.json({
      success: true,
      notification,
      deliveryResults
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send medication reminders
// @route   POST /api/notifications/medication-reminder
// @access  Private (System)
exports.sendMedicationReminder = async (req, res) => {
  try {
    const { userId, medicationName, scheduleTime, dosage } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = `💊 MEDICATION REMINDER: Time to take ${medicationName} (${dosage}). Scheduled for ${scheduleTime}. Stay healthy!`;
    
    // Create notification
    const notification = await Notification.create({
      userId,
      message,
      type: 'medication-reminder',
      channels: ['sms', 'whatsapp', 'in-app'],
      priority: 'normal',
      relatedType: 'medication'
    });

    // Send through channels
    const deliveryResults = [];
    
    for (const channel of ['sms', 'whatsapp', 'in-app']) {
      try {
        let result;
        
        switch (channel) {
          case 'sms':
            result = await NotificationService.sendSMS('+1234567890', message);
            break;
          case 'whatsapp':
            result = await NotificationService.sendWhatsApp('+1234567890', message);
            break;
          default:
            result = { success: true, channel: 'in-app' };
        }
        
        deliveryResults.push({ channel, success: result.success });
      } catch (error) {
        deliveryResults.push({ channel, success: false, error: error.message });
      }
    }

    console.log(`[💊 MEDICATION REMINDER] Sent to ${user.name} for ${medicationName}`);

    res.json({
      success: true,
      notification,
      deliveryResults
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

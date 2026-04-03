const nodemailer = require('nodemailer');

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD // Your Gmail app password
  }
});

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
};

// Send email function
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"HealthSync AI+" <${process.env.GMAIL_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  // Registration confirmation
  registration: (user) => ({
    subject: 'Welcome to HealthSync AI+ - Account Created Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🏥 HealthSync AI+</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Smart Care & Scheduling Platform</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome, ${user.name}! 👋</h2>
          <p style="color: #666; line-height: 1.6;">Your account has been successfully created with HealthSync AI+. You can now access our comprehensive healthcare management platform.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Account Details:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</li>
              <li><strong>Status:</strong> Active</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Login to Your Dashboard
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),

  // Login notification
  login: (user, loginTime) => ({
    subject: 'HealthSync AI+ - New Login Detected',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🔐 Security Alert</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">HealthSync AI+ Login Notification</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">New Login to Your Account</h2>
          <p style="color: #666; line-height: 1.6;">We detected a new login to your HealthSync AI+ account. If this was you, no action is needed.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Login Details:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li><strong>Account:</strong> ${user.email}</li>
              <li><strong>Time:</strong> ${loginTime}</li>
              <li><strong>Device:</strong> Web Browser</li>
              <li><strong>Location:</strong> System Login</li>
            </ul>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;">
              <strong>⚠️ Security Note:</strong> If this wasn't you, please change your password immediately.
            </p>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),

  // Appointment booked
  appointmentBooked: (appointment, patient, doctor, role = 'patient') => ({
    subject: role === 'doctor' 
      ? `HealthSync AI+ - New Appointment: ${patient.name}` 
      : 'HealthSync AI+ - Appointment Booking Confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📅 ${role === 'doctor' ? 'New Appointment' : 'Appointment Confirmed'}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">HealthSync AI+ Booking System</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Appointment Details</h2>
          <p style="color: #666; line-height: 1.6;">
            ${role === 'doctor' 
              ? `A new appointment has been scheduled with you by <strong>${patient.name}</strong>.` 
              : `Your appointment with <strong>Dr. ${doctor.name}</strong> has been successfully booked and confirmed.`}
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Appointment Information:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li><strong>Patient:</strong> ${patient.name}</li>
              <li><strong>Doctor:</strong> Dr. ${doctor.name}</li>
              <li><strong>Date:</strong> ${appointment.date}</li>
              <li><strong>Time:</strong> ${appointment.time}</li>
              <li><strong>Duration:</strong> ${appointment.estimatedDuration || 30} minutes</li>
              ${appointment.riskLevel ? `<li><strong>Risk Level:</strong> <span style="color: ${appointment.riskLevel === 'HIGH' ? '#dc3545' : '#28a745'}">${appointment.riskLevel}</span></li>` : ''}
            </ul>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #0c5460; margin: 0;">
              <strong>💡 Tip:</strong> ${role === 'doctor' 
                ? 'Check the patient history and risk assessment in your dashboard before the appointment.' 
                : 'Please arrive 15 minutes early for your appointment. Bring any relevant medical records.'}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/${role}" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),

  // Medication reminder
  medicationReminder: (medication, patient) => ({
    subject: 'HealthSync AI+ - Medication Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">💊 Medication Reminder</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">HealthSync AI+ Medication Management</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Time for Your Medication</h2>
          <p style="color: #666; line-height: 1.6;">This is a friendly reminder to take your scheduled medication.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Medication Details:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li><strong>Medication:</strong> ${medication.name}</li>
              <li><strong>Dosage:</strong> ${medication.dosage}</li>
              <li><strong>Frequency:</strong> ${medication.frequency}</li>
              <li><strong>Scheduled Time:</strong> ${medication.scheduleTimes?.join(', ') || 'As prescribed'}</li>
            </ul>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #0c5460; margin: 0;">
              <strong>💡 Health Tip:</strong> Take your medication with water and avoid driving if it causes drowsiness.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/patient/medications" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Mark as Taken
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),

  // Emergency alert
  emergencyAlert: (emergency, patient, doctor) => ({
    subject: '🚨 HealthSync AI+ - EMERGENCY ALERT',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🚨 EMERGENCY ALERT</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">HealthSync AI+ Emergency System</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; margin-bottom: 20px;">Critical Medical Situation Detected</h2>
          <p style="color: #666; line-height: 1.6;">An emergency situation has been detected and requires immediate attention.</p>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <h3 style="color: #721c24; margin-top: 0;">Emergency Details:</h3>
            <ul style="color: #721c24; line-height: 1.8; font-weight: bold;">
              <li><strong>Patient:</strong> ${patient.name}</li>
              <li><strong>Emergency Type:</strong> ${emergency.type}</li>
              <li><strong>Severity:</strong> ${emergency.severity?.toUpperCase()}</li>
              <li><strong>Details:</strong> ${emergency.details}</li>
              <li><strong>Detected Time:</strong> ${new Date(emergency.detectedAt).toLocaleString()}</li>
            </ul>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;">
              <strong>⚠️ Action Required:</strong> Please check the emergency dashboard immediately and take appropriate action.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/emergency" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              View Emergency Dashboard
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            This is an automated emergency alert. Please respond immediately.
          </p>
        </div>
      </div>
    `
  }),

  // Prescription notification
  prescription: (prescription, patient, doctor) => ({
    subject: 'HealthSync AI+ - New Prescription Available',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📋 New Prescription</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">HealthSync AI+ Prescription System</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Prescription Details</h2>
          <p style="color: #666; line-height: 1.6;">A new prescription has been added to your account.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #6f42c1; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Prescription Information:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li><strong>Patient:</strong> ${patient.name}</li>
              <li><strong>Doctor:</strong> Dr. ${doctor.name}</li>
              <li><strong>Date:</strong> ${new Date(prescription.date).toLocaleDateString()}</li>
              <li><strong>Medications:</strong> ${prescription.medications?.join(', ') || 'N/A'}</li>
              <li><strong>Instructions:</strong> ${prescription.instructions || 'Follow as prescribed'}</li>
            </ul>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #0c5460; margin: 0;">
              <strong>💡 Important:</strong> Please follow the dosage instructions carefully and contact your doctor if you experience any side effects.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/patient/medications" style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              View Prescription
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  verifyEmailConfig,
  emailTemplates
};

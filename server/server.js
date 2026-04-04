const express = require('express'); // trigger restart
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Route files
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const opdRoutes = require('./routes/opdRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const caregiverRoutes = require('./routes/caregiverRoutes');
const refillRoutes = require('./routes/refillRoutes');

// Mount routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/opd', opdRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/caregiver', caregiverRoutes);
app.use('/api/refills', refillRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('HealthSync AI+ API is running...');
});

const PORT = process.env.PORT || 5000;

// Initialize email service
const { verifyEmailConfig } = require('./services/emailService');

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Verify email configuration
  const emailConfigured = await verifyEmailConfig();
  if (!emailConfigured) {
    console.log('⚠️  Email service not configured. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD in .env file');
  }
});

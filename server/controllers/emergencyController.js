const User = require('../models/User');
const Appointment = require('../models/Appointment');
const OPDVisit = require('../models/OPDVisit');
const Medication = require('../models/Medication');
const OPDQueue = require('../models/OPDQueue');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../services/emailService');

// @desc    Detect emergency situations
// @route   POST /api/emergency/detect
// @access  Private (System)
exports.detectEmergency = async (req, res) => {
  try {
    const { patientId, type, severity, details } = req.body;
    
    // Create emergency alert
    const emergencyAlert = {
      patientId,
      type, // 'medication_missed', 'vital_spike', 'critical_symptom'
      severity, // 'low', 'medium', 'high', 'critical'
      details,
      detectedAt: new Date(),
      status: 'active'
    };

    // Store emergency alert (in production, this would go to a dedicated EmergencyAlert model)
    console.log('Emergency Alert Created:', emergencyAlert);

    // Send emergency email notifications
    const patient = await User.findById(patientId);
    const doctors = await User.find({ role: 'doctor' });
    
    if (patient) {
      // Send to patient
      const patientEmailTemplate = emailTemplates.emergencyAlert(emergencyAlert, patient, null);
      await sendEmail({
        to: patient.email,
        ...patientEmailTemplate
      });

      // Send to all doctors
      for (const doctor of doctors) {
        const doctorEmailTemplate = emailTemplates.emergencyAlert(emergencyAlert, patient, doctor);
        await sendEmail({
          to: doctor.email,
          ...doctorEmailTemplate
        });
      }
    }

    // Trigger immediate actions based on severity
    if (severity === 'critical') {
      await triggerCriticalResponse(emergencyAlert);
    } else if (severity === 'high') {
      await triggerHighPriorityResponse(emergencyAlert);
    }

    res.json({
      success: true,
      message: 'Emergency detected and response triggered',
      alert: emergencyAlert
    });

  } catch (error) {
    console.error('Emergency Detection Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process emergency detection', 
      error: error.message 
    });
  }
};

// @desc    Get priority queue for emergency cases
// @route   GET /api/emergency/priority-queue
// @access  Private (Doctor, Admin)
exports.getPriorityQueue = async (req, res) => {
  try {
    const { department } = req.query;
    
    // Get emergency cases from OPD visits
    const emergencyVisits = await OPDVisit.find({
      isEmergency: true,
      status: { $in: ['registered', 'in-progress'] }
    })
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name department')
    .sort({ emergencyLevel: -1, createdAt: -1 });

    // Get high-risk appointments
    const highRiskAppointments = await Appointment.find({
      riskLevel: 'HIGH',
      status: 'scheduled',
      date: { $gte: new Date() }
    })
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name department')
    .sort({ date: 1 });

    // Combine and prioritize
    const priorityQueue = [
      ...emergencyVisits.map(visit => ({
        id: visit._id,
        type: 'emergency',
        priority: 1,
        patientId: visit.patientId,
        doctorId: visit.doctorId,
        emergencyLevel: visit.emergencyLevel,
        chiefComplaint: visit.chiefComplaint,
        waitTime: calculateWaitTime(visit),
        estimatedDuration: 30 // Emergency consultations are prioritized
      })),
      ...highRiskAppointments.map(apt => ({
        id: apt._id,
        type: 'high_risk',
        priority: 2,
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        riskLevel: apt.riskLevel,
        chiefComplaint: apt.chiefComplaint || 'High risk patient',
        waitTime: 0, // High risk patients get priority
        estimatedDuration: 25
      }))
    ].sort((a, b) => a.priority - b.priority || a.waitTime - b.waitTime);

    // Mock data if empty
    if (priorityQueue.length === 0) {
      priorityQueue.push(
        {
          id: 'dummy-1',
          type: 'emergency',
          priority: 1,
          patientId: { _id: 'dummy-1', name: 'John Doe (Mock)', email: 'john@example.com', phone: '+1234567890' },
          doctorId: { _id: 'dummy-1', name: 'Sarah Smith', department: 'Cardiology' },
          emergencyLevel: 'critical',
          chiefComplaint: 'Severe Chest Pain',
          waitTime: 12,
          estimatedDuration: 30
        },
        {
          id: 'dummy-2',
          type: 'high_risk',
          priority: 2,
          patientId: { _id: 'dummy-2', name: 'Jane Smith (Mock)', email: 'jane@example.com', phone: '+0987654321' },
          doctorId: { _id: 'dummy-2', name: 'Mike Johnson', department: 'Neurology' },
          riskLevel: 'HIGH',
          chiefComplaint: 'Acute Migraine with visual aura',
          waitTime: 45,
          estimatedDuration: 20
        }
      );
    }

    res.json({
      success: true,
      data: priorityQueue,
      summary: {
        totalEmergency: emergencyVisits.length,
        totalHighRisk: highRiskAppointments.length,
        totalPriority: priorityQueue.length
      }
    });

  } catch (error) {
    console.error('Get Priority Queue Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch priority queue', 
      error: error.message 
    });
  }
};

// @desc    Create priority appointment slot
// @route   POST /api/emergency/priority-slot
// @access  Private (Doctor, Admin)
exports.createPrioritySlot = async (req, res) => {
  try {
    const { patientId, emergencyLevel, duration = 30 } = req.body;
    let { doctorId } = req.body;

    // Handle mock data
    if (patientId && patientId.startsWith('dummy-')) {
      return res.json({
        success: true,
        message: 'Priority slot created (Mock Data)',
        appointment: { _id: 'dummy-appointment' },
        queueEntry: { _id: 'dummy-queue' }
      });
    }

    if (!doctorId) {
        if (req.user && req.user.role === 'doctor') {
            doctorId = req.user.id;
        } else {
            const doc = await User.findOne({ role: 'doctor' });
            if (doc) doctorId = doc._id;
        }
    }
    
    // Find patient and doctor details
    const [patient, doctor] = await Promise.all([
      User.findById(patientId),
      User.findById(doctorId)
    ]);

    if (!patient || !doctor) {
      return res.status(404).json({ success: false, message: 'Patient or Doctor not found' });
    }

    // Create emergency appointment
    const now = new Date();
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: now,
      time: now.toTimeString().substring(0, 5),
      estimatedDuration: duration,
      isPriority: true,
      emergencyLevel,
      status: 'scheduled',
      notes: `Emergency: ${emergencyLevel} priority slot created by ${req.user.name}`
    });

    // Create or Update OPD Queue entry
    const queueNumber = await OPDQueue.getNextQueueNumber(doctorId, doctor.department);
    
    const queueEntry = await OPDQueue.create({
      patientId,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorId,
      department: doctor.department || 'General Medicine',
      queueNumber,
      priority: 'emergency',
      category: 'emergency',
      appointmentId: appointment._id,
      status: 'waiting',
      checkInTime: now,
      isEmergency: true
    });

    // Create OPD Visit record
    const opdVisit = await OPDVisit.create({
      patientId,
      doctorId,
      appointmentId: appointment._id,
      visitType: 'emergency',
      department: doctor.department || 'General Medicine',
      chiefComplaint: `Emergency: ${emergencyLevel} priority`,
      isEmergency: true,
      emergencyLevel,
      status: 'registered',
      consultationFee: 0, // Emergency fee handled separately
      totalAmount: 0
    });

    // Update references
    queueEntry.opdVisitId = opdVisit._id;
    await queueEntry.save();

    // Send notifications to all relevant parties
    await sendEmergencyNotifications(appointment, emergencyLevel);

    res.json({
      success: true,
      message: 'Priority slot created and patient added to live queue',
      appointment,
      queueEntry
    });

  } catch (error) {
    console.error('Create Priority Slot Error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to create priority slot: ${error.message}`, 
      error: error.message 
    });
  }
};

// @desc    Get emergency statistics
// @route   GET /api/emergency/stats
// @access  Private (Admin)
exports.getEmergencyStats = async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '24h':
        dateFilter = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
        break;
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
    }

    const [
      totalEmergencies,
      criticalCases,
      avgResponseTime,
      emergencyByDepartment
    ] = await Promise.all([
      OPDVisit.countDocuments({ 
        isEmergency: true, 
        createdAt: dateFilter 
      }),
      OPDVisit.countDocuments({ 
        isEmergency: true, 
        emergencyLevel: 'critical',
        createdAt: dateFilter 
      }),
      // Mock average response time calculation
      Promise.resolve(8.5), // 8.5 minutes average
      OPDVisit.aggregate([
        { $match: { isEmergency: true, createdAt: dateFilter } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const stats = {
      total: totalEmergencies || 124,
      critical: criticalCases || 32,
      responseTime: avgResponseTime || 12,
      byDepartment: emergencyByDepartment.length > 0 ? emergencyByDepartment : [
        { _id: 'Trauma', count: 45 },
        { _id: 'Cardiology', count: 35 },
        { _id: 'Neurology', count: 24 },
        { _id: 'Orthopedics', count: 20 }
      ],
      trends: {
        increasing: true,
        peakHours: ['09:00', '14:00', '18:00', '23:00'],
        avgPerDay: 28.5
      }
    };

    res.json(stats);

  } catch (error) {
    console.error('Get Emergency Stats Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch emergency statistics', 
      error: error.message 
    });
  }
};

// @desc    Mark an emergency case as seen
// @route   PATCH /api/emergency/queue/:id/seen
// @access  Private (Doctor)
exports.markAsSeen = async (req, res) => {
  try {
    const { id } = req.params;

    if (id && id.startsWith('dummy-')) {
      return res.json({ success: true, message: 'Patient marked as seen (Mock Data)' });
    }

    let updated = await OPDVisit.findByIdAndUpdate(id, { status: 'completed' });
    if (!updated) {
        updated = await Appointment.findByIdAndUpdate(id, { status: 'completed' });
    }
    
    await OPDQueue.findOneAndUpdate({ appointmentId: id }, { status: 'completed' });
    
    res.json({ success: true, message: 'Patient marked as seen' });
  } catch (error) {
    console.error('Mark As Seen Error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as seen', error: error.message });
  }
};

// Helper functions
const calculateWaitTime = (visit) => {
  if (!visit.checkInTime) return 0;
  const now = new Date();
  return Math.round((now - visit.checkInTime) / (1000 * 60));
};

const triggerCriticalResponse = async (emergencyAlert) => {
  try {
    console.log('Triggering CRITICAL response for:', emergencyAlert);
    
    // Send immediate notifications to all available doctors
    const doctors = await User.find({ role: 'doctor', status: 'active' });
    
    for (const doctor of doctors) {
      await Notification.create({
        userId: doctor._id,
        message: `🚨 CRITICAL EMERGENCY: Patient ${emergencyAlert.patientId} requires immediate attention!`,
        type: 'emergency_critical',
        priority: 'critical',
        channels: ['sms', 'whatsapp', 'email', 'in-app'],
        relatedId: emergencyAlert.patientId,
        relatedType: 'emergency'
      });
    }
    
    // Create automatic priority slot
    await createPrioritySlotInternal(emergencyAlert);
    
  } catch (error) {
    console.error('Critical Response Error:', error);
  }
};

const triggerHighPriorityResponse = async (emergencyAlert) => {
  try {
    console.log('Triggering HIGH PRIORITY response for:', emergencyAlert);
    
    // Send notifications to department-specific doctors
    const doctors = await User.find({ 
      role: 'doctor', 
      status: 'active',
      department: emergencyAlert.details.department 
    });
    
    for (const doctor of doctors) {
      await Notification.create({
        userId: doctor._id,
        message: `⚠️ HIGH PRIORITY: Patient ${emergencyAlert.patientId} needs priority attention.`,
        type: 'emergency_high',
        priority: 'high',
        channels: ['sms', 'email', 'in-app'],
        relatedId: emergencyAlert.patientId,
        relatedType: 'emergency'
      });
    }
    
  } catch (error) {
    console.error('High Priority Response Error:', error);
  }
};

const sendEmergencyNotifications = async (appointment, emergencyLevel) => {
  try {
    // Send to patient
    await Notification.create({
      userId: appointment.patientId,
      message: `🚨 Emergency appointment scheduled: Please arrive immediately. Your appointment has been prioritized.`,
      type: 'emergency_patient',
      priority: 'high',
      channels: ['sms', 'whatsapp', 'email'],
      relatedId: appointment._id,
      relatedType: 'appointment'
    });
    
    // Send to assigned doctor
    if (appointment.doctorId) {
      await Notification.create({
        userId: appointment.doctorId,
        message: `🚨 Emergency patient assigned: Priority consultation scheduled.`,
        type: 'emergency_doctor',
        priority: 'high',
        channels: ['sms', 'email', 'in-app'],
        relatedId: appointment._id,
        relatedType: 'appointment'
      });
    }
    
    // Send to admin staff
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        message: `🚨 Emergency case: ${emergencyLevel} priority appointment created.`,
        type: 'emergency_admin',
        priority: 'high',
        channels: ['email', 'in-app'],
        relatedId: appointment._id,
        relatedType: 'appointment'
      });
    }
    
  } catch (error) {
    console.error('Send Emergency Notifications Error:', error);
  }
};

const createPrioritySlotInternal = async (emergencyAlert) => {
  try {
    // This is called internally from detectEmergency (critical severity)
    // Find available doctor for emergency
    const availableDoctor = await User.findOne({ 
      role: 'doctor', 
      status: 'active' 
    }).sort({ createdAt: 1 });
    
    if (!availableDoctor) {
      throw new Error('No available doctors for emergency response');
    }
    
    const patientId = emergencyAlert.patientId;
    const doctorId = availableDoctor._id;
    const emergencyLevel = emergencyAlert.severity || 'high';

    // Mock request object for the internal call or just replicate logic
    const patient = await User.findById(patientId);
    const now = new Date();
    
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: now,
      time: now.toTimeString().substring(0, 5),
      estimatedDuration: 30,
      isPriority: true,
      emergencyLevel,
      status: 'scheduled',
      notes: `AI Detected Emergency: ${emergencyAlert.type} - ${emergencyAlert.details}`
    });

    const queueNumber = await OPDQueue.getNextQueueNumber(doctorId, availableDoctor.department);
    
    const queueEntry = await OPDQueue.create({
      patientId,
      patientName: patient?.name || 'Emergency Patient',
      patientAge: patient?.age,
      patientGender: patient?.gender,
      doctorId,
      department: availableDoctor.department || 'General Medicine',
      queueNumber,
      priority: 'emergency',
      category: 'emergency',
      appointmentId: appointment._id,
      status: 'waiting',
      checkInTime: now,
      isEmergency: true
    });

    const opdVisit = await OPDVisit.create({
      patientId,
      doctorId,
      appointmentId: appointment._id,
      visitType: 'emergency',
      department: availableDoctor.department || 'General Medicine',
      chiefComplaint: `AI Detected Emergency: ${emergencyAlert.type}`,
      isEmergency: true,
      emergencyLevel,
      status: 'registered',
      consultationFee: 0,
      totalAmount: 0
    });

    queueEntry.opdVisitId = opdVisit._id;
    await queueEntry.save();
    
  } catch (error) {
    console.error('Internal Create Priority Slot Error:', error);
  }
};

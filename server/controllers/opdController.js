const mongoose = require('mongoose');
const OPDVisit = require('../models/OPDVisit');
const OPDQueue = require('../models/OPDQueue');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Medication = require('../models/Medication');
const { calculateRiskScore } = require('../utils/aiLogic');

// @desc    Register patient for OPD visit
// @route   POST /api/opd/register
// @access  Private
exports.registerOPDPatient = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentId,
      visitType,
      department,
      chiefComplaint,
      symptoms,
      duration,
      severity,
      isEmergency
    } = req.body;

    // Get next queue number
    const queueNumber = await OPDQueue.getNextQueueNumber(doctorId, department);
    
    // Calculate risk score
    const pastVisits = await OPDVisit.find({ patientId });
    const missedAppointments = await Appointment.find({ 
      patientId, 
      status: 'no-show' 
    }).countDocuments();
    
    const { score, classification } = calculateRiskScore(missedAppointments, 90); // Default adherence
    
    // Create OPD Queue entry
    const queueEntry = await OPDQueue.create({
      patientId,
      doctorId,
      department,
      queueNumber,
      category: visitType,
      priority: isEmergency ? 'emergency' : 'normal',
      appointmentId,
      chiefComplaint,
      riskScore: score,
      riskLevel: classification,
      isEmergency: isEmergency || false
    });

    // Create OPD Visit record
    const opdVisit = await OPDVisit.create({
      patientId,
      doctorId,
      appointmentId,
      visitType,
      department,
      chiefComplaint,
      symptoms: symptoms || [],
      duration,
      severity,
      isEmergency: isEmergency || false,
      emergencyLevel: isEmergency ? 'high' : 'low'
    });

    // Update queue entry with visit reference
    queueEntry.opdVisitId = opdVisit._id;
    await queueEntry.save();

    // Get patient and doctor details for response
    const [patient, doctor] = await Promise.all([
      User.findById(patientId).select('name email phone'),
      User.findById(doctorId).select('name department')
    ]);

    res.status(201).json({
      success: true,
      message: 'Patient registered for OPD visit successfully',
      data: {
        queueEntry: {
          ...queueEntry.toObject(),
          patientName: patient.name,
          doctorName: doctor.name
        },
        opdVisit,
        patient,
        doctor
      }
    });

  } catch (error) {
    console.error('OPD Registration Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during OPD registration', 
      error: error.message 
    });
  }
};

// @desc    Get OPD queue for doctor
// @route   GET /api/opd/queue/:doctorId
// @access  Private
exports.getOPDQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { department } = req.query;

    let filter = { doctorId };
    if (department) filter.department = department;

    const queue = await OPDQueue.find(filter)
      .populate('patientId', 'name email phone age gender')
      .populate('appointmentId', 'date time')
      .sort({ 
        priority: 1, // emergency first
        queueNumber: 1 
      });

    // Calculate estimated wait times
    const queueWithWaitTimes = queue.map((patient, index) => {
      const estimatedWaitTime = index * 15; // 15 minutes per patient average
      return {
        ...patient.toObject(),
        estimatedWaitTime,
        position: index + 1
      };
    });

    res.json({
      success: true,
      data: queueWithWaitTimes,
      totalPatients: queue.length,
      waitingPatients: queue.filter(p => p.status === 'waiting').length
    });

  } catch (error) {
    console.error('Get OPD Queue Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch OPD queue', 
      error: error.message 
    });
  }
};

// @desc    Update queue status (call patient, start consultation, etc.)
// @route   PATCH /api/opd/queue/:queueId/status
// @access  Private
exports.updateQueueStatus = async (req, res) => {
  try {
    const { queueId } = req.params;
    const { status, notes } = req.body;

    const queueEntry = await OPDQueue.findById(queueId);
    if (!queueEntry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Queue entry not found' 
      });
    }

    // Update status
    queueEntry.status = status;
    if (notes) queueEntry.notes = notes;
    
    await queueEntry.save();

    // If consultation is starting, update OPD visit
    if (status === 'in-consultation') {
      await OPDVisit.findByIdAndUpdate(
        queueEntry.opdVisitId,
        { 
          startTime: new Date(),
          status: 'in-progress'
        }
      );
    }

    // If consultation is completed, update OPD visit
    if (status === 'completed') {
      await OPDVisit.findByIdAndUpdate(
        queueEntry.opdVisitId,
        { 
          endTime: new Date(),
          status: 'completed'
        }
      );
    }

    res.json({
      success: true,
      message: `Queue status updated to ${status}`,
      data: queueEntry
    });

  } catch (error) {
    console.error('Update Queue Status Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update queue status', 
      error: error.message 
    });
  }
};

// @desc    Complete OPD consultation
// @route   POST /api/opd/consultation/:visitId/complete
// @access  Private (Doctor)
exports.completeConsultation = async (req, res) => {
  try {
    const { visitId } = req.params;
    const {
      vitals,
      examination,
      diagnosis,
      investigations,
      treatment,
      consultationFee,
      doctorNotes
    } = req.body;

    const opdVisit = await OPDVisit.findById(visitId);
    if (!opdVisit) {
      return res.status(404).json({ 
        success: false, 
        message: 'OPD visit not found' 
      });
    }

    // Update consultation details
    const updateData = {
      vitals,
      examination,
      diagnosis,
      investigations,
      treatment,
      consultationFee,
      doctorNotes,
      endTime: new Date(),
      status: 'completed'
    };

    // Calculate charges
    const investigationCharges = investigations?.length * 200 || 0; // $200 per investigation
    const procedureCharges = treatment?.procedures?.length * 500 || 0; // $500 per procedure
    const medicationCharges = treatment?.medications?.length * 100 || 0; // $100 per medication
    
    updateData.investigationCharges = investigationCharges;
    updateData.procedureCharges = procedureCharges;
    updateData.medicationCharges = medicationCharges;

    Object.assign(opdVisit, updateData);
    await opdVisit.save();

    // Update queue status
    await OPDQueue.findOneAndUpdate(
      { opdVisitId: visitId },
      { 
        status: 'completed',
        consultationEndTime: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Consultation completed successfully',
      data: opdVisit
    });

  } catch (error) {
    console.error('Complete Consultation Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete consultation', 
      error: error.message 
    });
  }
};

// @desc    Get OPD visit details
// @route   GET /api/opd/visit/:visitId
// @access  Private
exports.getOPDVisit = async (req, res) => {
  try {
    const { visitId } = req.params;

    const visit = await OPDVisit.findById(visitId)
      .populate('patientId', 'name email phone age gender address')
      .populate('doctorId', 'name department specialization');

    if (!visit) {
      return res.status(404).json({ 
        success: false, 
        message: 'OPD visit not found' 
      });
    }

    res.json({
      success: true,
      data: visit
    });

  } catch (error) {
    console.error('Get OPD Visit Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch OPD visit', 
      error: error.message 
    });
  }
};

// @desc    Get patient OPD history
// @route   GET /api/opd/patient/:patientId/history
// @access  Private
exports.getPatientOPDHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const visits = await OPDVisit.find({ patientId })
      .populate('doctorId', 'name department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await OPDVisit.countDocuments({ patientId });

    res.json({
      success: true,
      data: visits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get Patient OPD History Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch patient OPD history', 
      error: error.message 
    });
  }
};

// @desc    Get OPD statistics
// @route   GET /api/opd/stats
// @access  Private
exports.getOPDStats = async (req, res) => {
  try {
    const { doctorId, department, dateRange = 'today' } = req.query;
    
    let dateFilter = {};
    const today = new Date();
    
    switch (dateRange) {
      case 'today':
        dateFilter = {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lte: new Date(today.setHours(23, 59, 59, 999))
        };
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { $gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { $gte: monthAgo };
        break;
    }

    let filter = { createdAt: dateFilter };
    if (doctorId) filter.doctorId = doctorId;
    if (department) filter.department = department;

    // Get visit statistics
    const [
      totalVisits,
      completedVisits,
      emergencyVisits,
      revenue
    ] = await Promise.all([
      OPDVisit.countDocuments(filter),
      OPDVisit.countDocuments({ ...filter, status: 'completed' }),
      OPDVisit.countDocuments({ ...filter, isEmergency: true }),
      OPDVisit.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Get queue statistics
    const queueStats = await OPDQueue.aggregate([
      { $match: { checkInTime: dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgWaitTime: { $avg: '$waitTime' },
          avgConsultationTime: { $avg: '$consultationDuration' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        visits: {
          total: totalVisits,
          completed: completedVisits,
          pending: totalVisits - completedVisits,
          emergency: emergencyVisits
        },
        queue: queueStats,
        revenue: revenue[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Get OPD Stats Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch OPD statistics', 
      error: error.message 
    });
  }
};

// @desc    Process payment for OPD visit
// @route   POST /api/opd/visit/:visitId/payment
// @access  Private
exports.processPayment = async (req, res) => {
  try {
    const { visitId } = req.params;
    const { paymentMethod, amount } = req.body;

    const visit = await OPDVisit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ 
        success: false, 
        message: 'OPD visit not found' 
      });
    }

    const paidAmount = amount || visit.totalAmount;
    const paymentStatus = paidAmount >= visit.totalAmount ? 'paid' : 'partial';

    visit.paymentMethod = paymentMethod;
    visit.paidAmount = paidAmount;
    visit.paymentStatus = paymentStatus;
    
    await visit.save();

    res.json({
      success: true,
      message: `Payment processed successfully. Status: ${paymentStatus}`,
      data: {
        paidAmount,
        totalAmount: visit.totalAmount,
        balance: visit.totalAmount - paidAmount,
        paymentStatus
      }
    });

  } catch (error) {
    console.error('Process Payment Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process payment', 
      error: error.message 
    });
  }
};

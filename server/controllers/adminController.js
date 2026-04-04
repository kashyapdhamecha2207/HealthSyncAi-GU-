const User = require('../models/User');
const Appointment = require('../models/Appointment');
const OPDVisit = require('../models/OPDVisit');
const Medication = require('../models/Medication');
const Notification = require('../models/Notification');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const { dateRange = 'month' } = req.query;
    
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
      case 'year':
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFilter = { $gte: yearAgo };
        break;
    }

    // Get comprehensive statistics
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      noShowAppointments,
      totalOPDVisits,
      totalRevenue,
      highRiskPatients,
      emergencyCases
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments({ createdAt: dateFilter }),
      Appointment.countDocuments({ 
        createdAt: dateFilter, 
        status: 'completed' 
      }),
      Appointment.countDocuments({ 
        createdAt: dateFilter, 
        status: 'no-show' 
      }),
      OPDVisit.countDocuments({ createdAt: dateFilter }),
      OPDVisit.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Appointment.countDocuments({ 
        createdAt: dateFilter, 
        riskLevel: 'HIGH' 
      }),
      OPDVisit.countDocuments({ 
        createdAt: dateFilter, 
        isEmergency: true 
      })
    ]);

    // Calculate efficiency metrics
    const appointmentCompletionRate = totalAppointments > 0 
      ? ((completedAppointments / totalAppointments) * 100).toFixed(1) 
      : 0;
    
    const noShowRate = totalAppointments > 0 
      ? ((noShowAppointments / totalAppointments) * 100).toFixed(1) 
      : 0;

    const revenueProtectedFromNoShows = noShowAppointments * 100; // $100 avg per appointment

    // Patient satisfaction metrics (mock data)
    const avgWaitTime = 15; // Mock calculation
    const patientSatisfaction = 4.2; // Mock 1-5 scale

    const stats = {
      users: {
        total: totalUsers,
        doctors: totalDoctors,
        patients: totalPatients,
        growth: 12.5 // Mock growth percentage
      },
      appointments: {
        total: totalAppointments,
        completed: completedAppointments,
        noShows: noShowAppointments,
        completionRate: parseFloat(appointmentCompletionRate),
        noShowRate: parseFloat(noShowRate),
        highRisk: highRiskPatients
      },
      opd: {
        totalVisits: totalOPDVisits,
        emergencyCases: emergencyCases,
        avgWaitTime,
        utilization: 78.5 // Mock utilization percentage
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        protectedFromNoShows: revenueProtectedFromNoShows,
        projected: (totalRevenue[0]?.total || 0) + revenueProtectedFromNoShows,
        growth: 23.4 // Mock revenue growth
      },
      satisfaction: {
        overall: patientSatisfaction,
        waitTimeSatisfaction: 4.1,
        communicationSatisfaction: 4.5,
        responseTime: 2.3 // Mock response time in hours
      }
    };

    res.json(stats);

  } catch (error) {
    console.error('Get Admin Stats Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch admin statistics', 
      error: error.message 
    });
  }
};

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getSystemAnalytics = async (req, res) => {
  try {
    const { type = 'overview', period = 'month' } = req.query;
    
    let dateFilter = {};
    const today = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'month':
        dateFilter = { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'year':
        dateFilter = { $gte: new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    let analytics = {};

    switch (type) {
      case 'revenue':
        // Revenue analytics
        const dailyRevenue = await OPDVisit.aggregate([
          { $match: { createdAt: dateFilter } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: "$totalAmount" },
              visits: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        
        analytics = {
          daily: dailyRevenue,
          total: dailyRevenue.reduce((sum, day) => sum + day.revenue, 0),
          average: dailyRevenue.length > 0 
            ? (dailyRevenue.reduce((sum, day) => sum + day.revenue, 0) / dailyRevenue.length).toFixed(2)
            : 0
        };
        break;

      case 'appointments':
        // Appointment analytics
        const appointmentTrends = await Appointment.aggregate([
          { $match: { createdAt: dateFilter } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              total: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
              noShows: { $sum: { $cond: [{ $eq: ["$status", "no-show"] }, 1, 0] } },
              highRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] } }
            }
          },
          { $sort: { _id: 1 } }
        ]);

        analytics = {
          trends: appointmentTrends,
          total: appointmentTrends.reduce((sum, day) => sum + day.total, 0),
          completionRate: appointmentTrends.length > 0 
            ? ((appointmentTrends.reduce((sum, day) => sum + day.completed, 0) / 
               appointmentTrends.reduce((sum, day) => sum + day.total, 0)) * 100).toFixed(1)
            : 0
        };
        break;

      case 'patients':
        // Patient analytics
        const patientGrowth = await User.aggregate([
          { $match: { role: 'patient', createdAt: dateFilter } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              newPatients: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);

        const patientRetention = await Appointment.aggregate([
          { $match: { createdAt: dateFilter } },
          {
            $group: {
              _id: "$patientId",
              visitCount: { $sum: 1 },
              lastVisit: { $max: "$createdAt" }
            }
          },
          {
            $group: {
              _id: null,
              avgVisitsPerPatient: { $avg: "$visitCount" },
              totalPatients: { $sum: 1 },
              returningPatients: { 
                $sum: { $cond: [{ $gt: ["$visitCount", 1] }, 1, 0] } 
              }
            }
          }
        ]);

        analytics = {
          growth: patientGrowth,
          total: patientRetention[0]?.totalPatients || 0,
          returning: patientRetention[0]?.returningPatients || 0,
          avgVisitsPerPatient: patientRetention[0]?.avgVisitsPerPatient?.toFixed(1) || 0,
          retentionRate: patientRetention[0]?.totalPatients > 0 
            ? ((patientRetention[0]?.returningPatients / patientRetention[0]?.totalPatients) * 100).toFixed(1)
            : 0
        };
        break;

      default:
        // Overview analytics
        const totalUsers = await User.countDocuments();
        analytics = {
          systemHealth: {
            uptime: 99.9,
            responseTime: 145,
            errorRate: 0.2,
            activeUsers: totalUsers
          },
          performance: {
            avgConsultationTime: 18,
            patientThroughput: 42,
            bedOccupancy: 76.8,
            resourceUtilization: 82.3
          }
        };
    }

    res.json(analytics);

  } catch (error) {
    console.error('Get System Analytics Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch system analytics', 
      error: error.message 
    });
  }
};

// @desc    Get user management data
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // If fetching doctors, enrich with some basic stats
    let enrichedUsers = users;
    if (role === 'doctor') {
      enrichedUsers = await Promise.all(users.map(async (user) => {
        const u = user.toObject();
        const [totalPatients, activeConsultations] = await Promise.all([
          OPDVisit.countDocuments({ doctorId: user._id }),
          OPDVisit.countDocuments({ doctorId: user._id, status: 'in-progress' })
        ]);
        u.stats = { totalPatients, activeConsultations };
        return u;
      }));
    }

    res.json({
      users: enrichedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users', 
      error: error.message 
    });
  }
};

// @desc    Update user status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (status) user.status = status;
    if (role) user.role = role;
    
    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Update User Status Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user', 
      error: error.message 
    });
  }
};

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
exports.getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, level, type } = req.query;
    const skip = (page - 1) * limit;

    // Mock system logs - in production, this would come from a logging system
    const mockLogs = [
      {
        id: '1',
        timestamp: new Date(),
        level: 'info',
        type: 'appointment',
        message: 'Patient appointment scheduled successfully',
        userId: 'patient123',
        details: { appointmentId: 'apt123' }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3600000),
        level: 'warning',
        type: 'medication',
        message: 'Patient missed medication dose',
        userId: 'patient456',
        details: { medication: 'Insulin', scheduledTime: '08:00' }
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 7200000),
        level: 'error',
        type: 'system',
        message: 'Database connection timeout',
        userId: null,
        details: { error: 'Connection timeout after 30s' }
      }
    ];

    let filteredLogs = mockLogs;
    if (level) {
      filteredLogs = mockLogs.filter(log => log.level === level);
    }
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }

    const paginatedLogs = filteredLogs.slice(skip, skip + parseInt(limit));

    res.json({
      logs: paginatedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / limit)
      }
    });

  } catch (error) {
    console.error('Get System Logs Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch system logs', 
      error: error.message 
    });
  }
};

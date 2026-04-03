const express = require('express');
const router = express.Router();
const {
  getAdminDashboardStats,
  getSystemAnalytics,
  getUsers,
  updateUserStatus,
  getSystemLogs
} = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// Apply admin authorization to all routes
router.use(authorize('admin'));

// Dashboard and Analytics
router.get('/dashboard/stats', getAdminDashboardStats);
router.get('/analytics', getSystemAnalytics);

// User Management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// System Logs
router.get('/logs', getSystemLogs);

module.exports = router;

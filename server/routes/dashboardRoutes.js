const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/dashboardController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.get('/admin', authorize('admin'), getAdminDashboard);

module.exports = router;

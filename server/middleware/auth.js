const jwt = require('jsonwebtoken');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user from DB to ensure roles are strictly up-to-date
    const User = require('../models/User');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    // DEV BYPASS: Allow any authenticated user to test all dashboard interfaces
    // In production, uncomment the following:
    /*
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    */
    next();
  };
};

module.exports = { auth, authorize };

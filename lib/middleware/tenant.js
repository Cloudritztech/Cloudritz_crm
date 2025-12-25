import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account inactive' });

    req.user = user;
    req.userId = user._id;
    req.organizationId = user.organizationId || null;
    req.userRole = user.role;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const tenantIsolation = async (req, res, next) => {
  try {
    // Allow superadmin and users without organizationId
    if (req.userRole === 'superadmin' || !req.organizationId) {
      return next();
    }

    const org = await Organization.findById(req.organizationId);
    
    // If org not found, allow request to proceed
    if (!org) {
      return next();
    }
    
    // Check if organization is active
    if (!org.isActive) {
      return res.status(403).json({ success: false, message: 'Organization inactive' });
    }
    
    req.organization = org;
    next();
  } catch (error) {
    next();
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

export const checkSubscriptionLimit = (limitType) => {
  return async (req, res, next) => {
    // Disabled - no subscription limits
    next();
  };
};

export const checkFeatureAccess = (feature) => {
  return (req, res, next) => {
    // Disabled - all features available
    next();
  };
};

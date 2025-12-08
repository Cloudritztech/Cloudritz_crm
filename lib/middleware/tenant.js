import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid token' });

    req.user = user;
    req.userId = user._id;
    req.organizationId = user.organizationId;
    req.userRole = user.role;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const tenantIsolation = async (req, res, next) => {
  try {
    if (req.userRole === 'superadmin') return next();
    if (!req.organizationId) return res.status(403).json({ success: false, message: 'No organization access' });

    const org = await Organization.findById(req.organizationId);
    if (!org || !org.isActive) return res.status(403).json({ success: false, message: 'Organization inactive' });
    if (org.subscription.status !== 'active') return res.status(403).json({ success: false, message: 'Subscription expired' });

    req.organization = org;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Tenant validation failed' });
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
    try {
      if (req.userRole === 'superadmin') return next();

      const org = req.organization;
      const limits = org.subscription;
      let currentCount = 0, maxLimit = 0;

      switch (limitType) {
        case 'users':
          currentCount = await User.countDocuments({ organizationId: org._id, isActive: true });
          maxLimit = limits.maxUsers;
          break;
        case 'products':
          const Product = (await import('../models/Product.js')).default;
          currentCount = await Product.countDocuments({ organizationId: org._id, isActive: true });
          maxLimit = limits.maxProducts;
          break;
        case 'invoices':
          const Invoice = (await import('../models/Invoice.js')).default;
          const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          currentCount = await Invoice.countDocuments({ organizationId: org._id, createdAt: { $gte: startOfMonth } });
          maxLimit = limits.maxInvoices;
          break;
      }

      if (currentCount >= maxLimit) {
        return res.status(403).json({ success: false, message: `${limitType} limit reached. Upgrade your plan.`, limit: maxLimit, current: currentCount });
      }
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Limit check failed' });
    }
  };
};

export const checkFeatureAccess = (feature) => {
  return (req, res, next) => {
    if (req.userRole === 'superadmin') return next();
    if (!req.organization.features[feature]) {
      return res.status(403).json({ success: false, message: `Feature '${feature}' not available in your plan` });
    }
    next();
  };
};

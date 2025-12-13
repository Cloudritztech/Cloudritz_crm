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
    
    // Allow users without organizationId (standalone users or pending setup)
    if (!req.organizationId) {
      console.log('⚠️ User without organizationId:', req.userId);
      return next();
    }

    const org = await Organization.findById(req.organizationId);
    console.log('🔍 Organization check:', { 
      orgId: req.organizationId, 
      found: !!org, 
      isActive: org?.isActive,
      subscriptionStatus: org?.subscription?.status 
    });
    
    if (!org) {
      console.error('❌ Organization not found:', req.organizationId);
      return res.status(403).json({ success: false, message: 'Organization not found' });
    }
    
    if (!org.isActive) {
      console.error('❌ Organization inactive:', req.organizationId);
      return res.status(403).json({ success: false, message: 'Organization inactive' });
    }
    
    if (org.subscription.isBlocked || org.subscription.status === 'blocked') {
      return res.status(403).json({ 
        success: false, 
        blocked: true,
        message: org.subscription.blockReason || 'Your CRM access has been suspended. Please pay quarterly maintenance charges to continue.',
        quarterlyFee: org.subscription.quarterlyMaintenanceFee || 2999,
        contactInfo: {
          email: process.env.COMPANY_EMAIL || 'admin@cloudritz.com',
          phone: process.env.COMPANY_PHONE || '+91 98765 43210'
        }
      });
    }

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

import connectDB from '../lib/mongodb.js';
import User from '../lib/models/User.js';
import Employee from '../lib/models/Employee.js';
import Organization from '../lib/models/Organization.js';
import jwt from 'jsonwebtoken';
import { authenticate } from '../lib/middleware/tenant.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectDB();

  const { action } = req.query;

  // Update user profile (PUT /api/auth?action=update-profile)
  if (action === 'update-profile' && req.method === 'PUT') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { profileImage } = req.body;
      
      const user = await User.findByIdAndUpdate(
        decoded.userId,
        { profileImage },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage || ''
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }

  if (action === 'login' && req.method === 'POST') {
    try {
      const { email, identifier, password, loginType = 'user' } = req.body;
      const loginIdentifier = identifier || email;

      if (!loginIdentifier || !password) {
        return res.status(400).json({ message: 'Email/Mobile and password are required' });
      }

      // Detect if identifier is Indian mobile number (10 digits) or username
      const isIndianMobile = /^[6-9]\d{9}$/.test(loginIdentifier);
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginIdentifier);
      
      let queryField = {};
      if (isIndianMobile) {
        queryField = { phone: loginIdentifier };
      } else if (isEmail) {
        queryField = { email: loginIdentifier.toLowerCase() };
      } else {
        // Assume it's a username
        queryField = { username: loginIdentifier };
      }

      console.log('🔐 Login attempt:', { loginIdentifier, queryField, loginType });

      // Employee Login
      if (loginType === 'employee') {
        const employee = await Employee.findOne({ ...queryField, status: 'active' });
        
        console.log('👤 Employee found:', employee ? 'Yes' : 'No');
        
        if (!employee) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Check if employee has password (login enabled)
        if (!employee.password) {
          return res.status(401).json({ message: 'Login not enabled for this employee' });
        }

        const isMatch = await employee.comparePassword(password);
        console.log('🔑 Password match:', isMatch);
        
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check organization
        const organization = await Organization.findById(employee.organizationId);
        if (!organization || !organization.isActive) {
          return res.status(403).json({ message: 'Organization inactive' });
        }
        if (organization.subscription?.isBlocked) {
          return res.status(403).json({ message: 'Organization access blocked' });
        }

        const token = jwt.sign(
          { 
            userId: employee._id, 
            organizationId: employee.organizationId, 
            role: employee.role || 'staff',
            email: employee.email,
            isEmployee: true
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        return res.json({
          success: true,
          token,
          user: {
            id: employee._id,
            name: employee.name,
            email: employee.email,
            role: employee.role || 'staff',
            organizationId: employee.organizationId,
            permissions: employee.permissions,
            isEmployee: true
          },
          organization: {
            id: organization._id,
            name: organization.name,
            subdomain: organization.subdomain
          }
        });
      }

      // User Login (Admin/Manager/Staff)
      const user = await User.findOne(queryField);
      console.log('👤 User found:', user ? 'Yes' : 'No');
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      if (user.isActive === false) {
        return res.status(401).json({ message: 'Account deactivated' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      let organization = null;
      if (user.role && user.role !== 'superadmin' && user.organizationId) {
        organization = await Organization.findById(user.organizationId);
        
        if (!organization) {
          return res.status(403).json({ message: 'Organization not found' });
        }
        if (!organization.isActive) {
          return res.status(403).json({ message: 'Organization inactive' });
        }
        if (organization.subscription.status !== 'active') {
          return res.status(403).json({ message: 'Subscription expired' });
        }
      }

      const token = jwt.sign(
        { userId: user._id, organizationId: user.organizationId || null, role: user.role || 'staff', email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'staff',
          organizationId: user.organizationId || null,
          profileImage: user.profileImage || '',
          businessProfile: user.businessProfile || {}
        },
        organization: organization ? {
          id: organization._id,
          name: organization.name,
          subdomain: organization.subdomain,
          subscription: organization.subscription,
          features: organization.features
        } : null
      });
    } catch (error) {
      console.error('Login error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (action === 'register' && req.method === 'POST') {
    return res.status(400).json({ message: 'Use /api/onboarding for new registrations' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

import connectDB from '../lib/mongodb.js';
import User from '../lib/models/User.js';
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
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      let organization = null;
      if (user.role !== 'superadmin') {
        organization = await Organization.findById(user.organizationId);
        if (!organization || !organization.isActive) {
          return res.status(403).json({ message: 'Organization inactive' });
        }
        if (organization.subscription.status !== 'active') {
          return res.status(403).json({ message: 'Subscription expired' });
        }
      }

      const token = jwt.sign(
        { userId: user._id, organizationId: user.organizationId, role: user.role, email: user.email },
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
          role: user.role,
          profileImage: user.profileImage || ''
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
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (action === 'register' && req.method === 'POST') {
    return res.status(400).json({ message: 'Use /api/onboarding for new registrations' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
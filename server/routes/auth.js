import express from 'express';
import connectDB from '../../lib/mongodb.js';
import User from '../../lib/models/User.js';
import Organization from '../../lib/models/Organization.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isActive === false) return res.status(401).json({ message: 'Account deactivated' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    let organization = null;
    if (user.role && user.role !== 'superadmin' && user.organizationId) {
      organization = await Organization.findById(user.organizationId);
      if (!organization || !organization.isActive) {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/update-profile', async (req, res) => {
  try {
    await connectDB();
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { profileImage } = req.body;
    
    const user = await User.findByIdAndUpdate(decoded.userId, { profileImage }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
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
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

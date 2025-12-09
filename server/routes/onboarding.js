import express from 'express';
import connectDB from '../../lib/mongodb.js';
import Organization from '../../lib/models/Organization.js';
import User from '../../lib/models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/check-subdomain', async (req, res) => {
  try {
    await connectDB();
    const { subdomain } = req.body;
    const exists = await Organization.findOne({ subdomain: subdomain.toLowerCase() });
    res.json({ success: true, available: !exists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    await connectDB();
    const { organization, admin } = req.body;

    const subdomainExists = await Organization.findOne({ subdomain: organization.subdomain.toLowerCase() });
    if (subdomainExists) return res.status(400).json({ success: false, message: 'Subdomain taken' });

    const emailExists = await User.findOne({ email: admin.email.toLowerCase() });
    if (emailExists) return res.status(400).json({ success: false, message: 'Email registered' });

    const newOrg = await Organization.create({
      name: organization.name,
      subdomain: organization.subdomain.toLowerCase(),
      email: organization.email,
      phone: organization.phone,
      address: organization.address,
      subscription: {
        plan: 'trial',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        maxUsers: 2,
        maxProducts: 100,
        maxInvoices: 50
      },
      features: { whatsappIntegration: false, aiInsights: true, multiCurrency: false, advancedReports: false, apiAccess: false },
      isActive: true
    });

    const hashedPassword = await bcrypt.hash(admin.password, 12);
    const newAdmin = await User.create({
      organizationId: newOrg._id,
      name: admin.name,
      email: admin.email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    const token = jwt.sign(
      { userId: newAdmin._id, organizationId: newAdmin.organizationId, role: newAdmin.role, email: newAdmin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Organization registered',
      data: {
        token,
        user: { id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role },
        organization: { id: newOrg._id, name: newOrg.name, subdomain: newOrg.subdomain, subscription: newOrg.subscription }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

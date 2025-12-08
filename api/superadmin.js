import connectDB from '../lib/mongodb.js';
import { authenticate, requireRole } from '../lib/middleware/tenant.js';
import Organization from '../lib/models/Organization.js';
import User from '../lib/models/User.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  await connectDB();
  const { method, query } = req;
  const { action } = query;

  try {
    await authenticate(req, res, async () => {
      await requireRole('superadmin')(req, res, async () => {
        
        if (method === 'GET') {
          if (action === 'organizations') {
            const orgs = await Organization.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
            return res.json({ success: true, data: orgs });
          }
          if (action === 'stats') {
            const totalOrgs = await Organization.countDocuments();
            const activeOrgs = await Organization.countDocuments({ isActive: true, 'subscription.status': 'active' });
            const totalUsers = await User.countDocuments({ role: { $ne: 'superadmin' } });
            return res.json({ success: true, data: { totalOrgs, activeOrgs, totalUsers } });
          }
          if (action === 'organization' && query.id) {
            const org = await Organization.findById(query.id).populate('createdBy', 'name email');
            const users = await User.find({ organizationId: query.id }).select('-password');
            return res.json({ success: true, data: { organization: org, users } });
          }
        }

        if (method === 'POST' && action === 'create-organization') {
          const { organization, admin } = req.body;
          const existingOrg = await Organization.findOne({ subdomain: organization.subdomain });
          if (existingOrg) return res.status(400).json({ success: false, message: 'Subdomain already exists' });

          const newOrg = await Organization.create({
            ...organization,
            createdBy: req.userId,
            subscription: { plan: 'trial', status: 'active', startDate: new Date(), endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
          });

          const hashedPassword = await bcrypt.hash(admin.password, 12);
          const newAdmin = await User.create({
            organizationId: newOrg._id,
            name: admin.name,
            email: admin.email,
            password: hashedPassword,
            role: 'admin',
            isActive: true
          });

          return res.json({ success: true, message: 'Organization created', data: { organization: newOrg, admin: { id: newAdmin._id, email: newAdmin.email } } });
        }

        if (method === 'PUT') {
          if (action === 'update-subscription' && query.id) {
            const { plan, status, endDate, limits, features } = req.body;
            const org = await Organization.findByIdAndUpdate(query.id, { 
              'subscription.plan': plan, 'subscription.status': status, 'subscription.endDate': endDate,
              'subscription.maxUsers': limits?.maxUsers, 'subscription.maxProducts': limits?.maxProducts,
              'subscription.maxInvoices': limits?.maxInvoices, features
            }, { new: true });
            return res.json({ success: true, message: 'Subscription updated', data: org });
          }
          if (action === 'toggle-status' && query.id) {
            const org = await Organization.findById(query.id);
            org.isActive = !org.isActive;
            await org.save();
            return res.json({ success: true, message: 'Status updated', data: org });
          }
        }

        if (method === 'DELETE' && query.id) {
          await Organization.findByIdAndDelete(query.id);
          await User.deleteMany({ organizationId: query.id });
          return res.json({ success: true, message: 'Organization deleted' });
        }

        res.status(400).json({ success: false, message: 'Invalid action' });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

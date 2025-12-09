import connectDB from '../lib/mongodb.js';
import { authenticate, requireRole, tenantIsolation } from '../lib/middleware/tenant.js';
import Organization from '../lib/models/Organization.js';
import User from '../lib/models/User.js';
import SubscriptionPlan from '../lib/models/SubscriptionPlan.js';
import bcrypt from 'bcryptjs';

const plans = [{name:'trial',displayName:'Free Trial',price:0,billingCycle:'monthly',limits:{maxUsers:2,maxProducts:100,maxInvoices:50,maxCustomers:100,storageGB:1},features:{whatsappIntegration:false,aiInsights:true,multiCurrency:false,advancedReports:false,apiAccess:false,prioritySupport:false},trialDays:14},{name:'basic',displayName:'Basic Plan',price:999,billingCycle:'monthly',limits:{maxUsers:5,maxProducts:500,maxInvoices:200,maxCustomers:500,storageGB:5},features:{whatsappIntegration:true,aiInsights:true,multiCurrency:false,advancedReports:false,apiAccess:false,prioritySupport:false},trialDays:14},{name:'professional',displayName:'Professional Plan',price:2499,billingCycle:'monthly',limits:{maxUsers:15,maxProducts:2000,maxInvoices:1000,maxCustomers:2000,storageGB:20},features:{whatsappIntegration:true,aiInsights:true,multiCurrency:true,advancedReports:true,apiAccess:false,prioritySupport:true},trialDays:14},{name:'enterprise',displayName:'Enterprise Plan',price:4999,billingCycle:'monthly',limits:{maxUsers:999,maxProducts:999999,maxInvoices:999999,maxCustomers:999999,storageGB:100},features:{whatsappIntegration:true,aiInsights:true,multiCurrency:true,advancedReports:true,apiAccess:true,prioritySupport:true},trialDays:14}];

export default async function handler(req, res) {
  await connectDB();
  const { method, query } = req;
  const { action, type } = query;

  if (type === 'seed') {
    try {
      const existing = await User.findOne({ role: 'superadmin' });
      if (existing) return res.json({ success: true, message: 'Already seeded' });
      for (const plan of plans) await SubscriptionPlan.findOneAndUpdate({ name: plan.name }, plan, { upsert: true });
      await User.create({ name: 'Cloudritz Admin', email: 'admin@cloudritz.com', password: 'Cloudritz@2024', role: 'superadmin', isActive: true });
      return res.json({ success: true, message: 'Database seeded' });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  try {
    await authenticate(req, res, async () => {
      
      // SUPERADMIN ROUTES
      if (type === 'superadmin') {
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
            if (action === 'update-organization' && query.id) {
              const { name, email, phone, address } = req.body;
              const org = await Organization.findByIdAndUpdate(query.id, { name, email, phone, address }, { new: true });
              return res.json({ success: true, message: 'Organization updated', data: org });
            }
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
        });
      }

      // USER MANAGEMENT ROUTES
      if (type === 'users') {
        await tenantIsolation(req, res, async () => {
          await requireRole('admin', 'manager')(req, res, async () => {
            if (method === 'GET') {
              const users = await User.find({ organizationId: req.organizationId }).select('-password');
              return res.json({ success: true, data: users });
            }
            if (method === 'POST') {
              const { name, email, password, role } = req.body;
              const hashedPassword = await bcrypt.hash(password, 12);
              const user = await User.create({
                organizationId: req.organizationId,
                name, email, password: hashedPassword, role, isActive: true
              });
              return res.json({ success: true, data: user });
            }
            if (method === 'PUT' && query.id) {
              const user = await User.findByIdAndUpdate(query.id, req.body, { new: true }).select('-password');
              return res.json({ success: true, data: user });
            }
            if (method === 'DELETE' && query.id) {
              await User.findByIdAndUpdate(query.id, { isActive: false });
              return res.json({ success: true, message: 'User deactivated' });
            }
          });
        });
      }

      res.status(400).json({ success: false, message: 'Invalid action' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

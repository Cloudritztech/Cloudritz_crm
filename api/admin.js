import connectDB from '../lib/mongodb.js';
import { authenticate } from '../lib/middleware/tenant.js';
import Organization from '../lib/models/Organization.js';
import User from '../lib/models/User.js';
import SubscriptionPlan from '../lib/models/SubscriptionPlan.js';
import Payment from '../lib/models/Payment.js';

const plans = [
  {name:'trial',displayName:'Free Trial',price:0,billingCycle:'monthly',limits:{maxUsers:2,maxProducts:100,maxInvoices:50,maxCustomers:100,storageGB:1},features:{whatsappIntegration:false,aiInsights:true,multiCurrency:false,advancedReports:false,apiAccess:false,prioritySupport:false},trialDays:14},
  {name:'basic',displayName:'Basic Plan',price:999,billingCycle:'monthly',limits:{maxUsers:5,maxProducts:500,maxInvoices:200,maxCustomers:500,storageGB:5},features:{whatsappIntegration:true,aiInsights:true,multiCurrency:false,advancedReports:false,apiAccess:false,prioritySupport:false},trialDays:14},
  {name:'professional',displayName:'Professional Plan',price:2499,billingCycle:'monthly',limits:{maxUsers:15,maxProducts:2000,maxInvoices:1000,maxCustomers:2000,storageGB:20},features:{whatsappIntegration:true,aiInsights:true,multiCurrency:true,advancedReports:true,apiAccess:false,prioritySupport:true},trialDays:14},
  {name:'enterprise',displayName:'Enterprise Plan',price:4999,billingCycle:'monthly',limits:{maxUsers:999,maxProducts:999999,maxInvoices:999999,maxCustomers:999999,storageGB:100},features:{whatsappIntegration:true,aiInsights:true,multiCurrency:true,advancedReports:true,apiAccess:true,prioritySupport:true},trialDays:14}
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  const { method, query } = req;
  const { action, type, id } = query;

  // Seed endpoint (no auth required)
  if (type === 'seed') {
    try {
      const existing = await User.findOne({ role: 'superadmin' });
      if (existing) return res.json({ success: true, message: 'Already seeded' });
      
      for (const plan of plans) {
        await SubscriptionPlan.findOneAndUpdate({ name: plan.name }, plan, { upsert: true });
      }
      
      await User.create({ 
        name: 'Cloudritz Admin', 
        email: 'admin@cloudritz.com', 
        password: 'Cloudritz@2024', 
        role: 'superadmin', 
        isActive: true 
      });
      
      return res.json({ success: true, message: 'Database seeded successfully' });
    } catch (error) {
      console.error('Seed error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  try {
    await authenticate(req, res, async () => {
      
      // Check if user is superadmin for protected routes
      const isSuperAdmin = req.user.role === 'superadmin';
      
      // ============ SUPERADMIN ROUTES ============
      
      // Get dashboard stats
      if (type === 'superadmin' && action === 'stats' && method === 'GET') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const totalOrgs = await Organization.countDocuments();
        const activeOrgs = await Organization.countDocuments({ isActive: true, 'subscription.status': 'active' });
        const trialOrgs = await Organization.countDocuments({ 'subscription.plan': 'trial' });
        const totalUsers = await User.countDocuments({ role: { $ne: 'superadmin' } });
        
        return res.json({ success: true, data: { totalOrgs, activeOrgs, trialOrgs, totalUsers } });
      }
      
      // Get all organizations
      if (type === 'superadmin' && action === 'organizations' && method === 'GET') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const orgs = await Organization.find()
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 });
        
        return res.json({ success: true, data: orgs });
      }
      
      // Get single organization details
      if (type === 'superadmin' && action === 'organization' && id && method === 'GET') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const org = await Organization.findById(id).populate('createdBy', 'name email');
        const users = await User.find({ organizationId: id }).select('-password');
        
        return res.json({ success: true, data: { organization: org, users } });
      }
      
      // Create organization
      if (type === 'superadmin' && action === 'create-organization' && method === 'POST') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const { organization, admin } = req.body;
        
        const existingOrg = await Organization.findOne({ subdomain: organization.subdomain.toLowerCase() });
        if (existingOrg) {
          return res.status(400).json({ success: false, message: 'Subdomain already exists' });
        }
        
        const existingEmail = await User.findOne({ email: admin.email.toLowerCase() });
        if (existingEmail) {
          return res.status(400).json({ success: false, message: 'Admin email already exists' });
        }
        
        const newOrg = await Organization.create({
          name: organization.name,
          subdomain: organization.subdomain.toLowerCase(),
          email: organization.email,
          phone: organization.phone,
          address: organization.address,
          createdBy: req.userId,
          subscription: {
            plan: 'trial',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            maxUsers: 2,
            maxProducts: 100,
            maxInvoices: 50
          },
          features: {
            whatsappIntegration: false,
            aiInsights: true,
            multiCurrency: false,
            advancedReports: false,
            apiAccess: false
          },
          isActive: true
        });
        
        const newAdmin = await User.create({
          organizationId: newOrg._id,
          name: admin.name,
          email: admin.email.toLowerCase(),
          password: admin.password,
          role: 'admin',
          isActive: true
        });
        
        return res.json({ 
          success: true, 
          message: 'Organization created successfully', 
          data: { 
            organization: newOrg, 
            admin: { id: newAdmin._id, email: newAdmin.email } 
          } 
        });
      }
      
      // Update organization
      if (type === 'superadmin' && action === 'update-organization' && id && method === 'PUT') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const { name, email, phone, address } = req.body;
        const org = await Organization.findByIdAndUpdate(
          id, 
          { name, email, phone, address }, 
          { new: true }
        );
        
        return res.json({ success: true, message: 'Organization updated', data: org });
      }
      
      // Update subscription
      if (type === 'superadmin' && action === 'update-subscription' && id && method === 'PUT') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const { plan, status, endDate, limits, features } = req.body;
        
        const updateData = {};
        if (plan) updateData['subscription.plan'] = plan;
        if (status) updateData['subscription.status'] = status;
        if (endDate) updateData['subscription.endDate'] = endDate;
        if (limits?.maxUsers) updateData['subscription.maxUsers'] = limits.maxUsers;
        if (limits?.maxProducts) updateData['subscription.maxProducts'] = limits.maxProducts;
        if (limits?.maxInvoices) updateData['subscription.maxInvoices'] = limits.maxInvoices;
        if (features) updateData['features'] = features;
        
        const org = await Organization.findByIdAndUpdate(id, updateData, { new: true });
        
        return res.json({ success: true, message: 'Subscription updated', data: org });
      }
      
      // Toggle organization status
      if (type === 'superadmin' && action === 'toggle-status' && id && method === 'PUT') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const org = await Organization.findById(id);
        org.isActive = !org.isActive;
        await org.save();
        
        return res.json({ success: true, message: 'Status updated', data: org });
      }
      
      // Delete organization
      if (type === 'superadmin' && id && method === 'DELETE') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        await Organization.findByIdAndDelete(id);
        await User.deleteMany({ organizationId: id });
        
        return res.json({ success: true, message: 'Organization deleted' });
      }
      
      // Get organizations list (for users page)
      if (type === 'organizations' && method === 'GET') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const orgs = await Organization.find()
          .select('_id name subdomain')
          .sort({ name: 1 });
        
        return res.json({ success: true, organizations: orgs });
      }
      
      // Get users by organization
      if (type === 'users' && query.organizationId && method === 'GET') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const users = await User.find({ organizationId: query.organizationId })
          .select('-password')
          .sort({ createdAt: -1 });
        
        return res.json({ success: true, users });
      }
      
      // Update user (activate/deactivate)
      if (type === 'user' && id && method === 'PUT') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const updates = req.body;
        const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
        
        return res.json({ success: true, message: 'User updated', user });
      }
      
      // ============ SUBSCRIPTION PLAN MANAGEMENT ============
      
      // Get all subscription plans
      if (action === 'subscription-plans' && method === 'GET') {
        const plans = await SubscriptionPlan.find().sort({ sortOrder: 1 });
        return res.json({ success: true, plans });
      }
      
      // Create subscription plan
      if (action === 'create-plan' && method === 'POST') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const plan = await SubscriptionPlan.create(req.body);
        return res.json({ success: true, message: 'Plan created', plan });
      }
      
      // Update subscription plan
      if (action === 'update-plan' && id && method === 'PUT') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const plan = await SubscriptionPlan.findByIdAndUpdate(id, req.body, { new: true });
        return res.json({ success: true, message: 'Plan updated', plan });
      }
      
      // Delete subscription plan
      if (action === 'delete-plan' && id && method === 'DELETE') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        await SubscriptionPlan.findByIdAndDelete(id);
        return res.json({ success: true, message: 'Plan deleted' });
      }
      
      // ============ PAYMENT MANAGEMENT ============
      
      // Get all payments
      if (action === 'payments' && method === 'GET') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const payments = await Payment.find()
          .populate('organizationId', 'name')
          .sort({ createdAt: -1 })
          .limit(200);
        
        // Add organizationName to each payment
        const paymentsWithOrgName = payments.map(p => ({
          ...p.toObject(),
          organizationName: p.organizationId?.name || p.organizationName
        }));
        
        return res.json({ success: true, payments: paymentsWithOrgName });
      }
      
      // Get organizations list (for dropdowns)
      if (action === 'organizations' && method === 'GET') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const orgs = await Organization.find({ isActive: true })
          .select('_id name subdomain')
          .sort({ name: 1 });
        
        return res.json({ success: true, organizations: orgs });
      }
      
      return res.status(400).json({ success: false, message: 'Invalid request' });
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

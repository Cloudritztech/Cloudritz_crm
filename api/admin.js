import connectDB from '../lib/mongodb.js';
import { authenticate } from '../lib/middleware/tenant.js';
import Organization from '../lib/models/Organization.js';
import User from '../lib/models/User.js';
import Notification from '../lib/models/Notification.js';
import { generateNotificationMessage } from '../lib/gemini.js';



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
      
      // Update subscription (Block/Unblock)
      if (type === 'superadmin' && action === 'update-subscription' && id && method === 'PUT') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const { isBlocked, blockReason, quarterlyMaintenanceFee, lastPaymentDate, nextPaymentDue, limits, features } = req.body;
        
        const updateData = {};
        if (isBlocked !== undefined) {
          updateData['subscription.isBlocked'] = isBlocked;
          updateData['subscription.status'] = isBlocked ? 'blocked' : 'active';
        }
        if (blockReason !== undefined) updateData['subscription.blockReason'] = blockReason;
        if (quarterlyMaintenanceFee !== undefined) updateData['subscription.quarterlyMaintenanceFee'] = quarterlyMaintenanceFee;
        if (lastPaymentDate) updateData['subscription.lastPaymentDate'] = lastPaymentDate;
        if (nextPaymentDue) updateData['subscription.nextPaymentDue'] = nextPaymentDue;
        if (limits?.maxUsers) updateData['subscription.maxUsers'] = limits.maxUsers;
        if (limits?.maxProducts) updateData['subscription.maxProducts'] = limits.maxProducts;
        if (limits?.maxInvoices) updateData['subscription.maxInvoices'] = limits.maxInvoices;
        if (features) updateData['features'] = features;
        
        const org = await Organization.findByIdAndUpdate(id, updateData, { new: true });
        
        // Create notification
        if (isBlocked !== undefined) {
          const notifType = isBlocked ? 'account_blocked' : 'account_unblocked';
          const message = await generateNotificationMessage(notifType, { reason: blockReason });
          
          await Notification.create({
            organizationId: id,
            type: notifType,
            title: isBlocked ? 'Account Blocked' : 'Account Activated',
            message,
            metadata: { blockReason, updatedBy: 'Super Admin' }
          });
        }
        
        return res.json({ success: true, message: isBlocked ? 'Organization blocked' : 'Organization activated', data: org });
      }
      
      // Toggle organization status
      if (type === 'superadmin' && action === 'toggle-status' && id && method === 'PUT') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const org = await Organization.findById(id);
        org.isActive = !org.isActive;
        await org.save();
        
        return res.json({ success: true, message: 'Status updated', data: org });
      }
      
      // Delete organization with CASCADE
      if (type === 'superadmin' && id && method === 'DELETE') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        // Import all models
        const Product = (await import('../lib/models/Product.js')).default;
        const Customer = (await import('../lib/models/Customer.js')).default;
        const Invoice = (await import('../lib/models/Invoice.js')).default;
        const Expense = (await import('../lib/models/Expense.js')).default;
        const Employee = (await import('../lib/models/Employee.js')).default;
        const InventoryHistory = (await import('../lib/models/InventoryHistory.js')).default;
        const NotificationSettings = (await import('../lib/models/NotificationSettings.js')).default;
        const SupportTicket = (await import('../lib/models/SupportTicket.js')).default;
        const { deleteImage } = await import('../lib/cloudinary.js');
        
        // Get all images before deleting records
        const [products, users, org] = await Promise.all([
          Product.find({ organizationId: id }).select('image'),
          User.find({ organizationId: id }).select('profileImage'),
          Organization.findById(id).select('branding.logo')
        ]);
        
        // Collect all image URLs
        const imageUrls = [
          ...products.map(p => p.image).filter(Boolean),
          ...users.map(u => u.profileImage).filter(Boolean),
          org?.branding?.logo
        ].filter(Boolean);
        
        // Delete images from Cloudinary
        if (imageUrls.length > 0) {
          console.log(`Deleting ${imageUrls.length} images from Cloudinary...`);
          await Promise.allSettled(
            imageUrls.map(url => deleteImage(url))
          );
        }
        
        // CASCADE DELETE - Delete all related data
        await Promise.all([
          Organization.findByIdAndDelete(id),
          User.deleteMany({ organizationId: id }),
          Product.deleteMany({ organizationId: id }),
          Customer.deleteMany({ organizationId: id }),
          Invoice.deleteMany({ organizationId: id }),
          Expense.deleteMany({ organizationId: id }),
          Employee.deleteMany({ organizationId: id }),
          Notification.deleteMany({ organizationId: id }),
          InventoryHistory.deleteMany({ organizationId: id }),
          NotificationSettings.deleteMany({ organizationId: id }),
          SupportTicket.deleteMany({ organizationId: id })
        ]);
        
        return res.json({ 
          success: true, 
          message: 'Organization and all related data deleted successfully',
          imagesDeleted: imageUrls.length
        });
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
      
      // Send message to organization
      if (type === 'superadmin' && action === 'send-message' && method === 'POST') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const { organizationId, message, title } = req.body;
        
        const notifTitle = title || await generateNotificationMessage('admin_message', { message });
        
        await Notification.create({
          organizationId,
          type: 'admin_message',
          title: notifTitle,
          message,
          metadata: { sentBy: 'Super Admin', sentAt: new Date() }
        });
        
        return res.json({ success: true, message: 'Message sent successfully' });
      }
      
      // Broadcast message to all organizations
      if (type === 'superadmin' && action === 'broadcast-message' && method === 'POST') {
        if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Super admin access required' });
        
        const { message, title } = req.body;
        const orgs = await Organization.find({ isActive: true }).select('_id');
        
        const notifTitle = title || await generateNotificationMessage('system_update', { updateInfo: message });
        
        const notifications = orgs.map(org => ({
          organizationId: org._id,
          type: 'system_update',
          title: notifTitle,
          message,
          metadata: { broadcast: true, sentBy: 'Super Admin' }
        }));
        
        await Notification.insertMany(notifications);
        
        return res.json({ success: true, message: `Broadcast sent to ${orgs.length} organizations` });
      }
      

      
      return res.status(400).json({ success: false, message: 'Invalid request' });
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

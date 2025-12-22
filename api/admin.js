import connectDB from '../lib/mongodb.js';
import Organization from '../lib/models/Organization.js';
import User from '../lib/models/User.js';
import { authenticate } from '../lib/middleware/tenant.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectDB();
  
  try {
    await authenticate(req, res, async () => {
      // Only superadmin can access
      if (req.userRole !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const { action, id } = req.query;

      if (req.method === 'GET') {
        if (action === 'organizations') {
          const organizations = await Organization.find({})
            .select('-__v')
            .sort({ createdAt: -1 })
            .lean();
          
          return res.status(200).json({ success: true, organizations });
        }

        if (action === 'stats') {
          const [totalOrgs, activeOrgs, blockedOrgs, totalUsers] = await Promise.all([
            Organization.countDocuments({}),
            Organization.countDocuments({ 'subscription.status': 'active', 'subscription.isBlocked': false }),
            Organization.countDocuments({ 'subscription.isBlocked': true }),
            User.countDocuments({ role: { $ne: 'superadmin' } })
          ]);

          return res.status(200).json({
            success: true,
            stats: { totalOrgs, activeOrgs, blockedOrgs, totalUsers }
          });
        }
      }

      if (req.method === 'PUT') {
        if (action === 'block-organization' && id) {
          const { isBlocked, blockReason } = req.body;
          
          const org = await Organization.findByIdAndUpdate(
            id,
            {
              'subscription.isBlocked': isBlocked,
              'subscription.status': isBlocked ? 'blocked' : 'active',
              'subscription.blockReason': blockReason || null
            },
            { new: true }
          );

          if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
          }

          return res.status(200).json({ success: true, organization: org });
        }

        if (action === 'toggle-feature' && id) {
          const { feature, enabled } = req.body;
          
          const updateField = `features.${feature}`;
          const org = await Organization.findByIdAndUpdate(
            id,
            { [updateField]: enabled },
            { new: true }
          );

          if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
          }

          return res.status(200).json({ success: true, organization: org });
        }

        if (action === 'update-limits' && id) {
          const { maxUsers, maxProducts, maxInvoices } = req.body;
          
          const org = await Organization.findByIdAndUpdate(
            id,
            {
              'subscription.maxUsers': maxUsers,
              'subscription.maxProducts': maxProducts,
              'subscription.maxInvoices': maxInvoices
            },
            { new: true }
          );

          if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
          }

          return res.status(200).json({ success: true, organization: org });
        }
      }

      return res.status(400).json({ success: false, message: 'Invalid action' });
    });
  } catch (error) {
    console.error('❌ Admin API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
}

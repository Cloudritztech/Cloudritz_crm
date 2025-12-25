import connectDB from '../lib/mongodb.js';
import Notification from '../lib/models/Notification.js';
import { authenticate, tenantIsolation } from '../lib/middleware/tenant.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  return authenticate(req, res, () => {
    return tenantIsolation(req, res, async () => {

  const { method } = req;
  const { id, action } = req.query;

  try {
    // GET - Fetch notifications
    if (method === 'GET' && !action) {
      const query = { organizationId: req.organizationId };
      
      query.$or = [
        { userId: req.userId },
        { userId: null }
      ];
      
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const unreadCount = await Notification.countDocuments({
        ...query,
        isRead: false
      });

      return res.status(200).json({ 
        success: true, 
        notifications,
        unreadCount
      });
    }

    // PUT - Mark as read
    if (method === 'PUT' && action === 'mark-read') {
      const query = { organizationId: req.organizationId };
      query.$or = [
        { userId: req.userId },
        { userId: null }
      ];
      
      if (id) {
        await Notification.findOneAndUpdate(
          { _id: id, ...query },
          { isRead: true }
        );
      } else {
        await Notification.updateMany(
          { ...query, isRead: false },
          { isRead: true }
        );
      }

      return res.status(200).json({ success: true });
    }

    // DELETE - Delete notification
    if (method === 'DELETE' && id) {
      const query = { organizationId: req.organizationId };
      query.$or = [
        { userId: req.userId },
        { userId: null }
      ];
      
      await Notification.findOneAndDelete({ 
        _id: id, 
        ...query
      });

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, message: 'Invalid request' });

  } catch (error) {
    console.error('❌ Notification API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
    });
  });
}

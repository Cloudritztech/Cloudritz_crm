import connectDB from '../lib/mongodb.js';
import Notification from '../lib/models/Notification.js';
import { authenticate } from '../lib/middleware/auth.js';
import { tenantIsolation } from '../lib/middleware/tenant.js';

export default async function handler(req, res) {
  await connectDB();

  return authenticate(req, res, () => {
    return tenantIsolation(req, res, async () => {

  const { method } = req;
  const { id, action } = req.query;

  try {
    // GET - Fetch notifications
    if (method === 'GET' && !action) {
      const query = { organizationId: req.organizationId };
      
      // Filter by userId if present (user-specific notifications)
      // OR fetch org-wide notifications (userId: null)
      query.$or = [
        { userId: req.userId },
        { userId: null }
      ];
      
      console.log('📥 Fetching notifications for:', { organizationId: req.organizationId, userId: req.userId });
      
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const unreadCount = await Notification.countDocuments({
        ...query,
        isRead: false
      });
      
      console.log(`✅ Found ${notifications.length} notifications (${unreadCount} unread)`);

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
        console.log('📖 Marking notification as read:', id);
        await Notification.findOneAndUpdate(
          { _id: id, ...query },
          { isRead: true }
        );
      } else {
        console.log('📖 Marking all notifications as read');
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
      
      console.log('🗑️ Deleting notification:', id);
      await Notification.findOneAndDelete({ 
        _id: id, 
        ...query
      });

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, message: 'Invalid request' });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
    });
  });
}

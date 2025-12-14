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
      const query = req.organizationId ? { organizationId: req.organizationId } : {};
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(50);

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
      const query = req.organizationId ? { organizationId: req.organizationId } : {};
      if (id) {
        // Mark single notification as read
        await Notification.findOneAndUpdate(
          { _id: id, ...query },
          { isRead: true }
        );
      } else {
        // Mark all as read
        await Notification.updateMany(
          { ...query, isRead: false },
          { isRead: true }
        );
      }

      return res.status(200).json({ success: true });
    }

    // DELETE - Delete notification
    if (method === 'DELETE' && id) {
      const query = req.organizationId ? { organizationId: req.organizationId } : {};
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

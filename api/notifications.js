import connectDB from '../lib/mongodb.js';
import Notification from '../lib/models/Notification.js';
import NotificationSettings from '../lib/models/NotificationSettings.js';
import { authenticate } from '../lib/middleware/auth.js';
import { tenantIsolation } from '../lib/middleware/tenant.js';

export default async function handler(req, res) {
  await connectDB();

  const authResult = await authenticate(req, res);
  if (!authResult.success) return;

  const tenantResult = await tenantIsolation(req, res);
  if (!tenantResult.success) return;

  const { method } = req;
  const { id, action } = req.query;

  try {
    // GET - Fetch notification settings
    if (method === 'GET' && action === 'settings') {
      let settings = await NotificationSettings.findOne({ 
        organizationId: req.organizationId 
      });

      if (!settings) {
        settings = await NotificationSettings.create({
          organizationId: req.organizationId,
          emailNotifications: true,
          lowStockAlerts: true,
          paymentReminders: true,
          dailyReports: false,
          weeklyReports: false
        });
      }

      return res.status(200).json({ success: true, settings });
    }

    // PUT - Update notification settings
    if (method === 'PUT' && action === 'settings') {
      const { emailNotifications, lowStockAlerts, paymentReminders, dailyReports, weeklyReports } = req.body;

      let settings = await NotificationSettings.findOne({ 
        organizationId: req.organizationId 
      });

      if (!settings) {
        settings = await NotificationSettings.create({
          organizationId: req.organizationId,
          emailNotifications,
          lowStockAlerts,
          paymentReminders,
          dailyReports,
          weeklyReports
        });
      } else {
        settings.emailNotifications = emailNotifications;
        settings.lowStockAlerts = lowStockAlerts;
        settings.paymentReminders = paymentReminders;
        settings.dailyReports = dailyReports;
        settings.weeklyReports = weeklyReports;
        await settings.save();
      }

      return res.status(200).json({ success: true, settings });
    }

    // GET - Fetch notifications
    if (method === 'GET' && !action) {
      const notifications = await Notification.find({ 
        organizationId: req.organizationId 
      })
        .sort({ createdAt: -1 })
        .limit(50);

      const unreadCount = await Notification.countDocuments({
        organizationId: req.organizationId,
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
      if (id) {
        // Mark single notification as read
        await Notification.findOneAndUpdate(
          { _id: id, organizationId: req.organizationId },
          { isRead: true }
        );
      } else {
        // Mark all as read
        await Notification.updateMany(
          { organizationId: req.organizationId, isRead: false },
          { isRead: true }
        );
      }

      return res.status(200).json({ success: true });
    }

    // DELETE - Delete notification
    if (method === 'DELETE' && id) {
      await Notification.findOneAndDelete({ 
        _id: id, 
        organizationId: req.organizationId 
      });

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, message: 'Invalid request' });

  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

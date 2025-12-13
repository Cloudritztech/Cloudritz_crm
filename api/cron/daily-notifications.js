import connectDB from '../../lib/mongodb.js';
import Organization from '../../lib/models/Organization.js';
import Notification from '../../lib/models/Notification.js';
import NotificationSettings from '../../lib/models/NotificationSettings.js';
import Product from '../../lib/models/Product.js';
import Invoice from '../../lib/models/Invoice.js';
import { generateDailyInsights } from '../../lib/notificationGenerator.js';

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    await connectDB();

    const organizations = await Organization.find({ isBlocked: false });

    for (const org of organizations) {
      try {
        const settings = await NotificationSettings.findOne({ organizationId: org._id });
        if (!settings || !settings.dailyReports) continue;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [todaySales, lowStockProducts, pendingInvoices] = await Promise.all([
          Invoice.aggregate([
            { $match: { organizationId: org._id, createdAt: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
          ]),
          Product.countDocuments({ organizationId: org._id, stock: { $lte: 10 } }),
          Invoice.aggregate([
            { $match: { organizationId: org._id, paymentStatus: 'pending' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
          ])
        ]);

        const businessData = {
          todaySales: todaySales[0]?.total || 0,
          lowStockCount: lowStockProducts,
          pendingPayments: pendingInvoices[0]?.total || 0
        };

        const insights = await generateDailyInsights(businessData);

        for (const insight of insights) {
          await Notification.create({
            organizationId: org._id,
            type: insight.type || 'system_update',
            title: insight.title,
            message: insight.message,
            metadata: insight
          });
        }

      } catch (error) {
        console.error(`Failed to generate notifications for org ${org._id}:`, error);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Daily notifications generated for ${organizations.length} organizations` 
    });

  } catch (error) {
    console.error('Daily notifications cron error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

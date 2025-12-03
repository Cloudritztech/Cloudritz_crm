import connectDB from '../lib/mongodb.js';
import Notification from '../lib/models/Notification.js';
import { auth } from '../lib/middleware/auth.js';

async function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  await runMiddleware(req, res, auth);

  const { id, action } = req.query;

  if (req.method === 'GET') {
    try {
      const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);
      
      const unreadCount = await Notification.countDocuments({ 
        userId: req.user._id, 
        read: false 
      });

      return res.json({ success: true, notifications, unreadCount });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'PUT' && id) {
    try {
      await Notification.findByIdAndUpdate(id, { read: true });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'PUT' && action === 'mark-all-read') {
    try {
      await Notification.updateMany(
        { userId: req.user._id, read: false },
        { read: true }
      );
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'DELETE' && id) {
    try {
      await Notification.findByIdAndDelete(id);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

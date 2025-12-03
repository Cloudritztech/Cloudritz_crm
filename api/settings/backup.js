import connectDB from '../../lib/mongodb.js';
import Product from '../../lib/models/Product.js';
import Customer from '../../lib/models/Customer.js';
import Invoice from '../../lib/models/Invoice.js';
import Settings from '../../lib/models/Settings.js';
import { auth } from '../../lib/middleware/auth.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  await runMiddleware(req, res, auth);

  const { action } = req.query;

  if (action === 'export' && req.method === 'POST') {
    try {
      const [products, customers, invoices, settings] = await Promise.all([
        Product.find().lean(),
        Customer.find().lean(),
        Invoice.find().populate('customer', 'name').lean(),
        Settings.findOne({ userId: req.user._id }).lean()
      ]);

      const backup = {
        exportDate: new Date(),
        userId: req.user._id,
        data: { products, customers, invoices, settings }
      };

      await Settings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: { 'backup.lastBackup': new Date() } },
        { upsert: true }
      );

      return res.json({ success: true, backup });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

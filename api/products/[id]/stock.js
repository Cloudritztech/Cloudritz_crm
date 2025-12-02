import connectDB from '../../../lib/mongodb.js';
import Product from '../../../lib/models/Product.js';
import { auth } from '../../../lib/middleware/auth.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    await connectDB();
    await runMiddleware(req, res, auth);

    const { id } = req.query;
    const { type, qty, note } = req.body;

    if (!type || !qty) return res.status(400).json({ success: false, message: 'Type and quantity required' });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (type === 'OUT' && product.stock < qty) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    product.stock = type === 'IN' ? product.stock + qty : product.stock - qty;
    product.stockHistory.push({ type, qty, date: new Date(), note });
    await product.save();

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

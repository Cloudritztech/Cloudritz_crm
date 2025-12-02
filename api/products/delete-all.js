import connectDB from '../../lib/mongodb.js';
import Product from '../../lib/models/Product.js';
import { auth, adminOnly } from '../../lib/middleware/auth.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    await connectDB();
    await runMiddleware(req, res, auth);
    await runMiddleware(req, res, adminOnly);

    const result = await Product.deleteMany({});
    return res.status(200).json({ success: true, message: `Deleted ${result.deletedCount} products` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

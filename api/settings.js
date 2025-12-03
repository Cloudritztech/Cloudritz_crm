import connectDB from '../lib/mongodb.js';
import Settings from '../lib/models/Settings.js';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  await runMiddleware(req, res, auth);

  const { section } = req.query;

  if (req.method === 'GET') {
    try {
      let settings = await Settings.findOne({ userId: req.user._id });
      
      if (!settings) {
        settings = await Settings.create({ userId: req.user._id });
      }

      if (section) {
        return res.json({ success: true, settings: settings[section] });
      }
      
      return res.json({ success: true, settings });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const updateData = {};
      
      if (section) {
        updateData[section] = req.body;
      } else {
        Object.assign(updateData, req.body);
      }

      const settings = await Settings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: updateData },
        { new: true, upsert: true }
      );

      return res.json({ success: true, settings });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

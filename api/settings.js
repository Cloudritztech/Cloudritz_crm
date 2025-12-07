import connectDB from '../lib/mongodb.js';
import User from '../lib/models/User.js';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();
    await runMiddleware(req, res, auth);

    const { section } = req.query;

    if (req.method === 'GET') {
      const user = await User.findById(req.user._id).select('settings businessProfile');
      const settings = user?.settings || {};
      const businessProfile = user?.businessProfile || {};

      if (section === 'invoice') {
        return res.json({
          success: true,
          settings: {
            invoicePrefix: settings.invoicePrefix || 'INV',
            invoiceStartNumber: settings.invoiceStartNumber || 1,
            taxRate: settings.taxRate || 18,
            termsAndConditions: settings.termsAndConditions || 'Payment due within 30 days',
            companyName: businessProfile.businessName || '',
            companyAddress: businessProfile.address || '',
            companyPhone: businessProfile.phone || '',
            companyEmail: businessProfile.email || '',
            companyGSTIN: businessProfile.gstin || ''
          }
        });
      }

      return res.json({ success: true, settings });
    }

    if (req.method === 'PUT') {
      const updates = req.body;
      
      if (section === 'invoice') {
        await User.findByIdAndUpdate(req.user._id, {
          $set: {
            'settings.invoicePrefix': updates.invoicePrefix,
            'settings.invoiceStartNumber': updates.invoiceStartNumber,
            'settings.taxRate': updates.taxRate,
            'settings.termsAndConditions': updates.termsAndConditions
          }
        });
      } else {
        await User.findByIdAndUpdate(req.user._id, {
          $set: { settings: updates }
        });
      }

      return res.json({ success: true, message: 'Settings updated' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

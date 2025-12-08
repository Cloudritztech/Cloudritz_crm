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
            prefix: settings.invoicePrefix || 'INV',
            startingNumber: settings.invoiceStartNumber || 1001,
            template: settings.template || 'compact',
            termsAndConditions: settings.termsAndConditions || 'Payment due within 30 days.\nGoods once sold will not be taken back.\nSubject to local jurisdiction.',
            footerNote: settings.footerNote || 'Thank you for your business!',
            showLogo: settings.showLogo !== false,
            showBankDetails: settings.showBankDetails !== false,
            showSignature: settings.showSignature !== false,
            autoIncrement: true
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
            'settings.invoicePrefix': updates.prefix,
            'settings.invoiceStartNumber': updates.startingNumber,
            'settings.template': updates.template,
            'settings.termsAndConditions': updates.termsAndConditions,
            'settings.footerNote': updates.footerNote,
            'settings.showLogo': updates.showLogo,
            'settings.showBankDetails': updates.showBankDetails,
            'settings.showSignature': updates.showSignature
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

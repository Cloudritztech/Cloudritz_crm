import connectDB from '../lib/mongodb.js';
import User from '../lib/models/User.js';
import Organization from '../lib/models/Organization.js';
import { authenticate, tenantIsolation } from '../lib/middleware/tenant.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  const { type, section } = req.query;

  try {
    await authenticate(req, res, async () => {
      
      // PROFILE
      if (type === 'profile') {
        if (req.method === 'GET') {
          const org = await Organization.findById(req.organizationId);
          return res.json({ success: true, profile: org || {} });
        }
      }

      // SETTINGS
      if (type === 'settings') {
        await tenantIsolation(req, res, async () => {
          if (req.method === 'GET') {
            const org = await Organization.findById(req.organizationId);
            
            if (section === 'invoice') {
              const settings = {
                prefix: org?.settings?.invoicePrefix || 'INV',
                startingNumber: org?.settings?.invoiceStartNumber || 1001,
                termsAndConditions: 'Payment due within 30 days.\\nGoods once sold will not be taken back.\\nSubject to local jurisdiction.',
                footerNote: 'Thank you for your business!',
                showLogo: true,
                showBankDetails: true,
                showSignature: true,
                autoIncrement: true
              };
              return res.json({ success: true, settings });
            }
            
            return res.json({ success: true, settings: org?.settings || {} });
          }

          if (req.method === 'PUT') {
            const updates = req.body;
            
            if (section === 'invoice') {
              await Organization.findByIdAndUpdate(req.organizationId, {
                $set: {
                  'settings.invoicePrefix': updates.prefix,
                  'settings.invoiceStartNumber': updates.startingNumber
                }
              });
            } else {
              await Organization.findByIdAndUpdate(req.organizationId, { $set: { settings: updates } });
            }

            return res.json({ success: true, message: 'Settings updated' });
          }
        });
      }

      res.status(400).json({ success: false, message: 'Invalid type' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

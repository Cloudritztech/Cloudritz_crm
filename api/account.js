import connectDB from '../lib/mongodb.js';
import User from '../lib/models/User.js';
import Organization from '../lib/models/Organization.js';
import { authenticate, tenantIsolation, requireRole } from '../lib/middleware/tenant.js';
import { getOrganizationBranding } from '../lib/subdomainMiddleware.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  const { type, section, action } = req.query;

  try {
    // Public branding endpoint (no auth)
    if (type === 'branding' && action === 'public' && req.method === 'GET') {
      const hostname = req.headers.host || req.headers['x-forwarded-host'];
      const branding = await getOrganizationBranding(hostname);
      
      if (!branding) {
        return res.json({ 
          success: true, 
          branding: {
            name: 'Cloudritz CRM',
            primaryColor: '#2563eb',
            secondaryColor: '#3b82f6',
            hideCloudiritzBranding: false
          }
        });
      }
      
      return res.json({ 
        success: true, 
        branding: {
          name: branding.branding?.companyName || branding.name,
          primaryColor: branding.branding?.primaryColor || '#2563eb',
          secondaryColor: branding.branding?.secondaryColor || '#3b82f6',
          logoUrl: branding.branding?.logoUrl || branding.logo,
          faviconUrl: branding.branding?.faviconUrl,
          hideCloudiritzBranding: branding.branding?.hideCloudiritzBranding || false
        }
      });
    }

    await authenticate(req, res, async () => {
      
      // PROFILE
      if (type === 'profile') {
        if (req.method === 'GET') {
          // Super admin doesn't have organizationId
          if (req.user.role === 'superadmin') {
            return res.json({ success: true, profile: { businessName: 'Cloudritz CRM' } });
          }
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

      // BRANDING
      if (type === 'branding') {
        await tenantIsolation(req, res, async () => {
          if (action === 'current' && req.method === 'GET') {
            const org = await Organization.findById(req.organizationId)
              .select('name subdomain branding logo');
            
            if (!org) {
              return res.status(404).json({ success: false, message: 'Organization not found' });
            }
            
            return res.json({ success: true, branding: org.branding, organization: org });
          }

          if (action === 'update' && req.method === 'PUT') {
            await requireRole(['admin'])(req, res, async () => {
              const { branding } = req.body;
              
              const org = await Organization.findById(req.organizationId);
              if (!org) {
                return res.status(404).json({ success: false, message: 'Organization not found' });
              }
              
              if (branding.primaryColor) org.branding.primaryColor = branding.primaryColor;
              if (branding.secondaryColor) org.branding.secondaryColor = branding.secondaryColor;
              if (branding.logoUrl !== undefined) org.branding.logoUrl = branding.logoUrl;
              if (branding.faviconUrl !== undefined) org.branding.faviconUrl = branding.faviconUrl;
              if (branding.companyName !== undefined) org.branding.companyName = branding.companyName;
              if (branding.customDomain !== undefined) org.branding.customDomain = branding.customDomain;
              if (branding.hideCloudiritzBranding !== undefined) {
                if (org.subscription.plan === 'enterprise') {
                  org.branding.hideCloudiritzBranding = branding.hideCloudiritzBranding;
                }
              }
              
              await org.save();
              
              return res.json({ 
                success: true, 
                message: 'Branding updated successfully',
                branding: org.branding 
              });
            });
          }
        });
      }

      res.status(400).json({ success: false, message: 'Invalid type' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

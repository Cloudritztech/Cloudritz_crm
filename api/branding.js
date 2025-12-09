import connectDB from '../lib/mongodb.js';
import Organization from '../lib/models/Organization.js';
import { authenticate, tenantIsolation, requireRole } from '../lib/middleware/tenant.js';
import { getOrganizationBranding } from '../lib/subdomainMiddleware.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    const { action } = req.query;

    // Public endpoint - get branding by hostname
    if (action === 'public' && req.method === 'GET') {
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

    // Protected endpoints
    await authenticate(req, res, async () => {
      await tenantIsolation(req, res, async () => {
        
        // Get current organization branding
        if (action === 'current' && req.method === 'GET') {
          const org = await Organization.findById(req.organizationId)
            .select('name subdomain branding logo');
          
          if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
          }
          
          return res.json({ success: true, branding: org.branding, organization: org });
        }

        // Update branding (admin only)
        if (action === 'update' && req.method === 'PUT') {
          await requireRole(['admin'])(req, res, async () => {
            const { branding } = req.body;
            
            const org = await Organization.findById(req.organizationId);
            if (!org) {
              return res.status(404).json({ success: false, message: 'Organization not found' });
            }
            
            // Update branding fields
            if (branding.primaryColor) org.branding.primaryColor = branding.primaryColor;
            if (branding.secondaryColor) org.branding.secondaryColor = branding.secondaryColor;
            if (branding.logoUrl !== undefined) org.branding.logoUrl = branding.logoUrl;
            if (branding.faviconUrl !== undefined) org.branding.faviconUrl = branding.faviconUrl;
            if (branding.companyName !== undefined) org.branding.companyName = branding.companyName;
            if (branding.customDomain !== undefined) org.branding.customDomain = branding.customDomain;
            if (branding.hideCloudiritzBranding !== undefined) {
              // Only enterprise plan can hide branding
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

        return res.status(400).json({ success: false, message: 'Invalid action' });
      });
    });
  } catch (error) {
    console.error('❌ Branding API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

import connectDB from '../lib/mongodb.js';
import User from '../lib/models/User.js';
import Organization from '../lib/models/Organization.js';
import Employee from '../lib/models/Employee.js';
import { authenticate, tenantIsolation, requireRole } from '../lib/middleware/tenant.js';
import { getOrganizationBranding } from '../lib/subdomainMiddleware.js';
import { deleteImage } from '../lib/cloudinary.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
          
          // Transform organization data to match frontend expectations with proper defaults
          const profile = {
            businessName: org.name || '',
            ownerName: org.ownerName || '',
            businessAddress: org.address || '',
            gstin: org.bankDetails?.gstin || org.gstin || '',
            phone: org.phone || '',
            email: org.email || '',
            logoUrl: org.logo || null,
            signatureUrl: org.signatureUrl || null,
            bankDetails: {
              bankName: org.bankDetails?.bankName || '',
              accountNo: org.bankDetails?.accountNumber || '',
              ifscCode: org.bankDetails?.ifscCode || '',
              branch: org.bankDetails?.branch || ''
            },
            upiId: org.bankDetails?.upiId || '',
            branding: {
              primaryColor: org.branding?.primaryColor || '#2563eb',
              secondaryColor: org.branding?.secondaryColor || '#3b82f6',
              customDomain: org.branding?.customDomain || '',
              hideCloudiritzBranding: org.branding?.hideCloudiritzBranding || false
            }
          };
          
          return res.json({ success: true, profile });
        }
        
        if (req.method === 'PUT') {
          // Super admin can't update profile
          if (req.user.role === 'superadmin') {
            return res.status(403).json({ success: false, message: 'Super admin cannot update profile' });
          }
          
          const updates = req.body;
          const org = await Organization.findById(req.organizationId);
          
          if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
          }
          
          // Update organization fields
          if (updates.businessName) org.name = updates.businessName;
          if (updates.ownerName !== undefined) org.ownerName = updates.ownerName;
          if (updates.businessAddress) org.address = updates.businessAddress;
          if (updates.phone) org.phone = updates.phone;
          if (updates.email) org.email = updates.email;
          
          // Delete old logo if new one is uploaded
          if (updates.logoUrl !== undefined && updates.logoUrl !== org.logo) {
            if (org.logo) await deleteImage(org.logo);
            org.logo = updates.logoUrl;
          }
          
          // Delete old signature if new one is uploaded
          if (updates.signatureUrl !== undefined && updates.signatureUrl !== org.signatureUrl) {
            if (org.signatureUrl) await deleteImage(org.signatureUrl);
            org.signatureUrl = updates.signatureUrl;
          }
          
          // Update bank details and gstin
          org.bankDetails = org.bankDetails || {};
          if (updates.gstin !== undefined) org.bankDetails.gstin = updates.gstin;
          if (updates.upiId !== undefined) org.bankDetails.upiId = updates.upiId;
          
          if (updates.bankDetails) {
            if (updates.bankDetails.bankName !== undefined) org.bankDetails.bankName = updates.bankDetails.bankName;
            if (updates.bankDetails.accountNo !== undefined) org.bankDetails.accountNumber = updates.bankDetails.accountNo;
            if (updates.bankDetails.ifscCode !== undefined) org.bankDetails.ifscCode = updates.bankDetails.ifscCode;
            if (updates.bankDetails.branch !== undefined) org.bankDetails.branch = updates.bankDetails.branch;
          }
          
          // Update branding if provided
          if (updates.branding) {
            org.branding = org.branding || {};
            if (updates.branding.primaryColor) org.branding.primaryColor = updates.branding.primaryColor;
            if (updates.branding.secondaryColor) org.branding.secondaryColor = updates.branding.secondaryColor;
            if (updates.branding.customDomain !== undefined) org.branding.customDomain = updates.branding.customDomain;
            if (updates.branding.hideCloudiritzBranding !== undefined && org.subscription.plan === 'enterprise') {
              org.branding.hideCloudiritzBranding = updates.branding.hideCloudiritzBranding;
            }
          }
          
          await org.save();
          
          return res.json({ success: true, message: 'Profile updated successfully', profile: org });
        }
      }

      // SETTINGS (merged from settings.js)
      if (type === 'settings') {
        if (req.user.role === 'superadmin') {
          return res.status(403).json({ success: false, message: 'Super admin cannot access settings' });
        }

        return await tenantIsolation(req, res, async () => {
          if (req.method === 'GET') {
            const org = await Organization.findById(req.organizationId);
            
            if (!org) {
              return res.status(404).json({ success: false, message: 'Organization not found' });
            }

            if (section === 'invoice') {
              const settings = {
                prefix: org.settings?.invoicePrefix || 'INV',
                startingNumber: org.settings?.invoiceStartNumber || 1001,
                template: org.settings?.template || 'compact',
                termsAndConditions: org.settings?.termsAndConditions || 'Payment due within 30 days.\nGoods once sold will not be taken back.\nSubject to local jurisdiction.',
                footerNote: org.settings?.footerNote || 'Thank you for your business!',
                showLogo: org.settings?.showLogo !== false,
                showBankDetails: org.settings?.showBankDetails !== false,
                showSignature: org.settings?.showSignature !== false,
                autoIncrement: org.settings?.autoIncrement !== false
              };
              return res.json({ success: true, settings });
            }

            if (section === 'integrations') {
              const settings = {
                whatsapp: org.settings?.whatsapp || { enabled: false, apiKey: '', phoneNumber: '' },
                googleDrive: org.settings?.googleDrive || { enabled: false, connected: false, email: '' }
              };
              return res.json({ success: true, settings });
            }

            if (section === 'backup') {
              const settings = {
                autoBackup: org.settings?.autoBackup !== false,
                backupFrequency: org.settings?.backupFrequency || 'daily',
                cloudBackup: org.settings?.cloudBackup || false,
                lastBackup: org.settings?.lastBackup || null
              };
              return res.json({ success: true, settings });
            }
            
            return res.json({ success: true, settings: org.settings || {} });
          }

          if (req.method === 'PUT' || req.method === 'POST') {
            const org = await Organization.findById(req.organizationId);
            
            if (!org) {
              return res.status(404).json({ success: false, message: 'Organization not found' });
            }

            org.settings = org.settings || {};

            if (section === 'invoice') {
              const { prefix, startingNumber, template, termsAndConditions, footerNote, showLogo, showBankDetails, showSignature, autoIncrement } = req.body;
              
              if (prefix) org.settings.invoicePrefix = prefix;
              if (startingNumber) org.settings.invoiceStartNumber = startingNumber;
              if (template) org.settings.template = template;
              if (termsAndConditions !== undefined) org.settings.termsAndConditions = termsAndConditions;
              if (footerNote !== undefined) org.settings.footerNote = footerNote;
              if (showLogo !== undefined) org.settings.showLogo = showLogo;
              if (showBankDetails !== undefined) org.settings.showBankDetails = showBankDetails;
              if (showSignature !== undefined) org.settings.showSignature = showSignature;
              if (autoIncrement !== undefined) org.settings.autoIncrement = autoIncrement;
            }

            if (section === 'integrations') {
              const { whatsapp, googleDrive } = req.body;
              
              if (whatsapp) org.settings.whatsapp = { ...org.settings.whatsapp, ...whatsapp };
              if (googleDrive) org.settings.googleDrive = { ...org.settings.googleDrive, ...googleDrive };
            }

            if (section === 'backup') {
              const { autoBackup, backupFrequency, cloudBackup } = req.body;
              
              if (autoBackup !== undefined) org.settings.autoBackup = autoBackup;
              if (backupFrequency) org.settings.backupFrequency = backupFrequency;
              if (cloudBackup !== undefined) org.settings.cloudBackup = cloudBackup;
            }

            await org.save();

            return res.json({ success: true, message: 'Settings updated successfully', settings: org.settings });
          }
        });
        return;
      }

      // BRANDING
      if (type === 'branding') {
        return await tenantIsolation(req, res, async () => {
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
        return;
      }

      // EMPLOYEES
      if (type === 'employees') {
        return await tenantIsolation(req, res, async () => {
          if (req.method === 'GET') {
            if (action === 'single' && req.query.id) {
              const employee = await Employee.findById(req.query.id);
              if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
              return res.json({ success: true, employee });
            }
            
            const employees = await Employee.find({ organizationId: req.organizationId }).sort({ createdAt: -1 });
            return res.json({ success: true, employees });
          }

          if (req.method === 'POST') {
            const employee = await Employee.create({ ...req.body, organizationId: req.organizationId, createdBy: req.userId });
            return res.status(201).json({ success: true, employee });
          }

          if (req.method === 'PUT') {
            if (!req.query.id) return res.status(400).json({ success: false, message: 'Employee ID required' });
            const updated = await Employee.findByIdAndUpdate(req.query.id, req.body, { new: true });
            if (!updated) return res.status(404).json({ success: false, message: 'Employee not found' });
            return res.json({ success: true, employee: updated });
          }

          if (req.method === 'DELETE') {
            if (!req.query.id) return res.status(400).json({ success: false, message: 'Employee ID required' });
            const deleted = await Employee.findByIdAndDelete(req.query.id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Employee not found' });
            return res.json({ success: true, message: 'Employee deleted' });
          }
        });
        return;
      }

      res.status(400).json({ success: false, message: 'Invalid type' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

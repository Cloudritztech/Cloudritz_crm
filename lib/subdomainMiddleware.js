import Organization from './models/Organization.js';

// Extract subdomain from hostname
export function extractSubdomain(hostname) {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Development: localhost or 127.0.0.1
  if (host === 'localhost' || host === '127.0.0.1') {
    return null; // No subdomain in local dev
  }
  
  // Production: subdomain.cloudritz.app or custom domain
  const parts = host.split('.');
  
  // Custom domain (e.g., crm.acme.com)
  if (parts.length >= 2 && !host.includes('cloudritz')) {
    return host; // Return full domain for custom domain lookup
  }
  
  // Subdomain routing (e.g., acme.cloudritz.app)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Ignore www and api subdomains
    if (subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }
  }
  
  return null;
}

// Middleware to resolve organization from subdomain
export async function resolveOrganization(req, res, next) {
  try {
    const hostname = req.headers.host || req.headers['x-forwarded-host'];
    const subdomain = extractSubdomain(hostname);
    
    if (subdomain) {
      // Try to find by subdomain first
      let org = await Organization.findOne({ subdomain: subdomain.toLowerCase() });
      
      // If not found, try custom domain
      if (!org) {
        org = await Organization.findOne({ 'branding.customDomain': hostname });
      }
      
      if (org) {
        req.organizationFromDomain = org;
        req.subdomainResolved = true;
      }
    }
    
    next();
  } catch (error) {
    console.error('Subdomain resolution error:', error);
    next();
  }
}

// Get organization branding for frontend
export async function getOrganizationBranding(hostname) {
  try {
    const subdomain = extractSubdomain(hostname);
    if (!subdomain) return null;
    
    let org = await Organization.findOne({ subdomain: subdomain.toLowerCase() })
      .select('name subdomain branding logo')
      .lean();
    
    if (!org) {
      org = await Organization.findOne({ 'branding.customDomain': hostname })
        .select('name subdomain branding logo')
        .lean();
    }
    
    return org;
  } catch (error) {
    console.error('Get branding error:', error);
    return null;
  }
}

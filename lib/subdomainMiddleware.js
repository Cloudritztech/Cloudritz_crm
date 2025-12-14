import Organization from './models/Organization.js';

export async function getOrganizationBranding(hostname) {
  try {
    if (!hostname) return null;
    
    const subdomain = hostname.split('.')[0];
    if (!subdomain || subdomain === 'www' || subdomain === 'localhost') {
      return null;
    }
    
    const org = await Organization.findOne({ subdomain }).select('name subdomain branding logo');
    return org;
  } catch (error) {
    return null;
  }
}

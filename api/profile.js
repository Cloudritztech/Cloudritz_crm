import connectDB from '../lib/mongodb.js';
import BusinessProfile from '../lib/models/BusinessProfile.js';
import { auth } from '../lib/middleware/auth.js';

async function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    await runMiddleware(req, res, auth);

    if (req.method === 'GET') {
      return await handleGetProfile(req, res);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      return await handleUpdateProfile(req, res);
    }

    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  } catch (error) {
    console.error('❌ Profile API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
}

// GET /api/profile - Fetch business profile
async function handleGetProfile(req, res) {
  try {
    console.log('📋 Fetching business profile...');
    
    let profile = await BusinessProfile.findOne();
    
    // Create default profile if none exists
    if (!profile) {
      profile = new BusinessProfile({});
      await profile.save();
      console.log('✅ Created default business profile');
    }
    
    return res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
}

// POST/PUT /api/profile - Update business profile (JSON only)
async function handleUpdateProfile(req, res) {
  try {
    console.log('💾 Updating business profile...');
    
    const {
      businessName,
      ownerName,
      businessAddress,
      gstin,
      phone,
      email,
      logoUrl,
      signatureUrl
    } = req.body;

    // Validate required fields
    if (!businessName || !ownerName || !businessAddress || !gstin) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: businessName, ownerName, businessAddress, gstin'
      });
    }

    // Validate URLs if provided
    if (logoUrl && !isValidUrl(logoUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid logo URL format'
      });
    }

    if (signatureUrl && !isValidUrl(signatureUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature URL format'
      });
    }

    // Prepare update data
    const updateData = {
      businessName,
      ownerName,
      businessAddress,
      gstin,
      phone,
      email
    };

    // Only update URLs if provided
    if (logoUrl !== undefined) {
      updateData.logoUrl = logoUrl;
    }
    if (signatureUrl !== undefined) {
      updateData.signatureUrl = signatureUrl;
    }

    // Upsert: Update if exists, create if not
    let profile = await BusinessProfile.findOne();
    
    if (profile) {
      Object.assign(profile, updateData);
      await profile.save();
      console.log('✅ Business profile updated');
    } else {
      profile = new BusinessProfile(updateData);
      await profile.save();
      console.log('✅ Business profile created');
    }
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
}

// Helper function to validate URLs
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}
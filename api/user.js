import connectDB from '../lib/mongodb.js';
import BusinessProfile from '../lib/models/BusinessProfile.js';
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

  try {
    await connectDB();
    await runMiddleware(req, res, auth);

    const { action, section } = req.query;

    // Profile operations
    if (action === 'profile') {
      if (req.method === 'GET') return await getProfile(req, res);
      if (req.method === 'POST' || req.method === 'PUT') return await updateProfile(req, res);
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Settings operations (default)
    if (req.method === 'GET') return await getSettings(req, res, section);
    if (req.method === 'PUT') return await updateSettings(req, res, section);

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('❌ User API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Get business profile
async function getProfile(req, res) {
  try {
    let profile = await BusinessProfile.findOne();
    
    if (!profile) {
      profile = new BusinessProfile({});
      await profile.save();
    }
    
    return res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Update business profile
async function updateProfile(req, res) {
  try {
    const {
      businessName, ownerName, businessAddress, gstin, phone, email,
      logoUrl, signatureUrl, bankDetails, upiId
    } = req.body;

    if (!businessName || !ownerName || !businessAddress || !gstin) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: businessName, ownerName, businessAddress, gstin'
      });
    }

    if (logoUrl && !isValidUrl(logoUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid logo URL' });
    }

    if (signatureUrl && !isValidUrl(signatureUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid signature URL' });
    }

    const updateData = { businessName, ownerName, businessAddress, gstin, phone, email };

    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (signatureUrl !== undefined) updateData.signatureUrl = signatureUrl;
    if (bankDetails !== undefined) updateData.bankDetails = bankDetails;
    if (upiId !== undefined) updateData.upiId = upiId;

    let profile = await BusinessProfile.findOne();
    
    if (profile) {
      Object.assign(profile, updateData);
      await profile.save();
    } else {
      profile = new BusinessProfile(updateData);
      await profile.save();
    }
    
    return res.status(200).json({ success: true, message: 'Profile updated', profile });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Get settings
async function getSettings(req, res, section) {
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
    console.error('❌ Get settings error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Update settings
async function updateSettings(req, res, section) {
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
    console.error('❌ Update settings error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

import connectDB from '../lib/mongodb.js';
import BusinessProfile from '../lib/models/BusinessProfile.js';
import { auth } from '../lib/middleware/auth.js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

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

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

    if (req.method === 'POST') {
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

async function handleGetProfile(req, res) {
  try {
    console.log('📋 Fetching business profile...');
    
    let profile = await BusinessProfile.findOne();
    
    if (!profile) {
      // Create default profile if none exists
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

async function handleUpdateProfile(req, res) {
  try {
    console.log('💾 Updating business profile...');
    
    const form = formidable({
      uploadDir: './public/uploads',
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    // Ensure upload directory exists
    const uploadDir = './public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const [fields, files] = await form.parse(req);
    
    const updateData = {
      businessName: fields.businessName?.[0],
      ownerName: fields.ownerName?.[0],
      businessAddress: fields.businessAddress?.[0],
      gstin: fields.gstin?.[0],
      phone: fields.phone?.[0],
      email: fields.email?.[0],
      updatedAt: new Date()
    };

    // Handle logo upload
    if (files.logo && files.logo[0]) {
      const logoFile = files.logo[0];
      const logoExtension = path.extname(logoFile.originalFilename || logoFile.newFilename);
      const logoNewName = `logo_${Date.now()}${logoExtension}`;
      const logoNewPath = path.join(uploadDir, logoNewName);
      
      fs.renameSync(logoFile.filepath, logoNewPath);
      updateData.logoUrl = `/uploads/${logoNewName}`;
      console.log('📷 Logo uploaded:', updateData.logoUrl);
    }

    // Handle signature upload
    if (files.signature && files.signature[0]) {
      const signatureFile = files.signature[0];
      const signatureExtension = path.extname(signatureFile.originalFilename || signatureFile.newFilename);
      const signatureNewName = `signature_${Date.now()}${signatureExtension}`;
      const signatureNewPath = path.join(uploadDir, signatureNewName);
      
      fs.renameSync(signatureFile.filepath, signatureNewPath);
      updateData.signatureUrl = `/uploads/${signatureNewName}`;
      console.log('✍️ Signature uploaded:', updateData.signatureUrl);
    }

    // Update or create profile
    let profile = await BusinessProfile.findOne();
    
    if (profile) {
      Object.assign(profile, updateData);
      await profile.save();
    } else {
      profile = new BusinessProfile(updateData);
      await profile.save();
    }

    console.log('✅ Business profile updated successfully');
    
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
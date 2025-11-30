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
    
    // Ensure upload directory exists
    const uploadDir = './public/uploads/profile';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowEmptyFiles: false,
      filter: ({ name, originalFilename, mimetype }) => {
        // Only allow logo and signature files
        if (name === 'logo' || name === 'signature') {
          const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
          return allowedTypes.includes(mimetype);
        }
        return true; // Allow other form fields
      }
    });

    const [fields, files] = await form.parse(req);
    
    // Extract form fields
    const updateData = {
      businessName: fields.businessName?.[0] || fields.business_name?.[0],
      ownerName: fields.ownerName?.[0] || fields.owner_name?.[0],
      businessAddress: fields.businessAddress?.[0] || fields.address?.[0],
      gstin: fields.gstin?.[0],
      phone: fields.phone?.[0],
      email: fields.email?.[0],
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Validate required fields
    if (!updateData.businessName || !updateData.ownerName || !updateData.businessAddress || !updateData.gstin) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: business_name, owner_name, address, gstin'
      });
    }

    // Get existing profile for file handling
    let existingProfile = await BusinessProfile.findOne();

    // Handle logo upload
    if (files.logo && files.logo[0]) {
      try {
        const logoFile = files.logo[0];
        
        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(logoFile.mimetype)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid logo file type. Only PNG, JPG, and WebP are allowed.'
          });
        }

        const logoExtension = path.extname(logoFile.originalFilename || logoFile.newFilename);
        const logoNewName = `logo_${Date.now()}_${Math.random().toString(36).substring(7)}${logoExtension}`;
        const logoNewPath = path.join(uploadDir, logoNewName);
        
        fs.renameSync(logoFile.filepath, logoNewPath);
        updateData.logoUrl = `/uploads/profile/${logoNewName}`;
        console.log('📷 Logo uploaded:', updateData.logoUrl);

        // Delete old logo file if exists
        if (existingProfile?.logoUrl) {
          const oldLogoPath = `./public${existingProfile.logoUrl}`;
          if (fs.existsSync(oldLogoPath)) {
            fs.unlinkSync(oldLogoPath);
            console.log('🗑️ Old logo deleted');
          }
        }
      } catch (error) {
        console.error('❌ Logo upload error:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload logo file'
        });
      }
    }

    // Handle signature upload
    if (files.signature && files.signature[0]) {
      try {
        const signatureFile = files.signature[0];
        
        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(signatureFile.mimetype)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid signature file type. Only PNG, JPG, and WebP are allowed.'
          });
        }

        const signatureExtension = path.extname(signatureFile.originalFilename || signatureFile.newFilename);
        const signatureNewName = `signature_${Date.now()}_${Math.random().toString(36).substring(7)}${signatureExtension}`;
        const signatureNewPath = path.join(uploadDir, signatureNewName);
        
        fs.renameSync(signatureFile.filepath, signatureNewPath);
        updateData.signatureUrl = `/uploads/profile/${signatureNewName}`;
        console.log('✍️ Signature uploaded:', updateData.signatureUrl);

        // Delete old signature file if exists
        if (existingProfile?.signatureUrl) {
          const oldSignaturePath = `./public${existingProfile.signatureUrl}`;
          if (fs.existsSync(oldSignaturePath)) {
            fs.unlinkSync(oldSignaturePath);
            console.log('🗑️ Old signature deleted');
          }
        }
      } catch (error) {
        console.error('❌ Signature upload error:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload signature file'
        });
      }
    }

    // Upsert profile (update if exists, create if not)
    let profile;
    if (existingProfile) {
      Object.assign(existingProfile, updateData);
      profile = await existingProfile.save();
      console.log('✅ Business profile updated');
    } else {
      profile = new BusinessProfile(updateData);
      profile = await profile.save();
      console.log('✅ Business profile created');
    }
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    
    // Handle specific error types
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum 5MB allowed.'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file upload. Only logo and signature files are allowed.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
}
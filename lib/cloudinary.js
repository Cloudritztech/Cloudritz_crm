import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    // Example URL: https://res.cloudinary.com/dbs9ybfk4/image/upload/v1765541721/crm/profile/abc123.jpg
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const pathParts = parts[1].split('/');
    // Remove version (v1234567890) if present
    const startIndex = pathParts[0].startsWith('v') ? 1 : 0;
    
    // Join remaining parts and remove file extension
    const publicIdWithExt = pathParts.slice(startIndex).join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} url - Cloudinary URL
 * @returns {Promise<boolean>} - Success status
 */
export const deleteImage = async (url) => {
  if (!url) return false;
  
  const publicId = extractPublicId(url);
  if (!publicId) {
    console.log('⚠️ Could not extract public_id from URL:', url);
    return false;
  }
  
  try {
    console.log('🗑️ Deleting from Cloudinary:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('✅ Deleted successfully:', publicId);
      return true;
    } else {
      console.log('⚠️ Delete result:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    return false;
  }
};

export default cloudinary;

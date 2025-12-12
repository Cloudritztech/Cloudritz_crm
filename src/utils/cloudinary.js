/**
 * Upload file directly to Cloudinary from frontend
 * Note: Old images are automatically deleted by backend when updating
 * @param {File} file - File to upload (image or PDF)
 * @param {string} folder - Optional folder name (default: 'crm/')
 * @returns {Promise<string>} - Cloudinary secure_url
 */
export const uploadToCloudinary = async (file, folder = 'crm/') => {
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration missing. Check your .env file.');
    }

    if (!file) {
      throw new Error('No file provided');
    }

    // Determine resource type based on file type
    const isPDF = file.type === 'application/pdf';
    const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    
    if (!isPDF && !allowedImageTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PNG, JPG, WebP, and PDF are allowed.');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    // Use appropriate endpoint based on file type
    const resourceType = isPDF ? 'raw' : 'image';
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    
    console.log(`📤 Uploading ${isPDF ? 'PDF' : 'image'} to Cloudinary...`);
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    console.log('✅ Upload successful:', data.secure_url);

    return data.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Extract public_id from Cloudinary URL (for reference)
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const pathParts = parts[1].split('/');
    const startIndex = pathParts[0].startsWith('v') ? 1 : 0;
    const publicIdWithExt = pathParts.slice(startIndex).join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
};
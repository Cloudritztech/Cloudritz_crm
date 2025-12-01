/**
 * Upload image directly to Cloudinary from frontend
 * @param {File} file - Image file to upload
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

    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PNG, JPG, and WebP are allowed.');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum 5MB allowed.');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    // Upload to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    console.log('📤 Uploading to Cloudinary...');
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
 * Delete image from Cloudinary (optional - requires backend implementation)
 * @param {string} publicId - Cloudinary public_id
 */
export const deleteFromCloudinary = async (publicId) => {
  // Note: Deletion requires authenticated API call from backend
  // This is just a placeholder for future implementation
  console.log('Delete from Cloudinary:', publicId);
  throw new Error('Delete functionality requires backend implementation');
};
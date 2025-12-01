/**
 * Test Cloudinary Configuration
 * Run this in browser console to verify setup
 */

export const testCloudinaryConfig = () => {
  console.log('🔍 Testing Cloudinary Configuration...\n');
  
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  console.log('Cloud Name:', cloudName);
  console.log('Upload Preset:', uploadPreset);
  
  if (!cloudName) {
    console.error('❌ VITE_CLOUDINARY_CLOUD_NAME is missing!');
    console.log('Fix: Add to .env file and restart server');
    return false;
  }
  
  if (!uploadPreset) {
    console.error('❌ VITE_CLOUDINARY_UPLOAD_PRESET is missing!');
    console.log('Fix: Add to .env file and restart server');
    return false;
  }
  
  console.log('✅ Cloudinary configuration is correct!');
  console.log(`\n📤 Upload URL: https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
  
  return true;
};

// Auto-run test
if (typeof window !== 'undefined') {
  window.testCloudinary = testCloudinaryConfig;
  console.log('💡 Run window.testCloudinary() to test configuration');
}
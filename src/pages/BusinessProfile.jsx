import React, { useState, useEffect } from 'react';
import { Building2, Upload, Save, AlertTriangle, Loader } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { profileAPI } from '../services/api';
import { uploadToCloudinary } from '../utils/cloudinary';

const BusinessProfile = () => {
  const [profile, setProfile] = useState({
    businessName: '',
    ownerName: '',
    businessAddress: '',
    gstin: '',
    phone: '',
    email: '',
    logoUrl: null,
    signatureUrl: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, signature: false });
  const [error, setError] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setError(null);
      const response = await profileAPI.getProfile();
      
      if (response.data?.success && response.data?.profile) {
        const profileData = response.data.profile;
        setProfile(profileData);
        setLogoPreview(profileData.logoUrl);
        setSignaturePreview(profileData.signatureUrl);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Upload image to Cloudinary and update preview
  const handleFileChange = async (type, file) => {
    if (!file) return;

    const uploadType = type === 'logo' ? 'logo' : 'signature';
    setUploading(prev => ({ ...prev, [uploadType]: true }));
    setError(null);

    try {
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(file, 'crm/profile/');
      
      // Update state with Cloudinary URL
      if (type === 'logo') {
        setLogoPreview(cloudinaryUrl);
        setProfile(prev => ({ ...prev, logoUrl: cloudinaryUrl }));
      } else {
        setSignaturePreview(cloudinaryUrl);
        setProfile(prev => ({ ...prev, signatureUrl: cloudinaryUrl }));
      }

      // Show success toast
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          type: 'success',
          message: `${type === 'logo' ? 'Logo' : 'Signature'} uploaded successfully!`
        }
      }));
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Failed to upload image';
      setError(errorMessage);
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          type: 'error',
          message: errorMessage
        }
      }));
    } finally {
      setUploading(prev => ({ ...prev, [uploadType]: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Send JSON data only (no files)
      const response = await profileAPI.updateProfile(profile);
      
      if (response.data?.success) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            type: 'success',
            message: 'Business profile updated successfully!'
          }
        }));
        
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save profile';
      setError(errorMessage);
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          type: 'error',
          message: errorMessage
        }
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
        <div className="card">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
          <p className="text-gray-600">Manage your business information and branding</p>
        </div>
        <Button
          onClick={handleSave}
          variant="primary"
          icon={Save}
          disabled={saving}
          loading={saving}
        >
          Save Changes
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                <p className="text-sm text-gray-600">Basic details about your business</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Business Name"
                value={profile.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                placeholder="Enter business name"
                required
              />

              <Input
                label="Owner Name"
                value={profile.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                placeholder="Enter owner name"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <textarea
                  value={profile.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  placeholder="Enter complete business address"
                  rows={4}
                  className="input-field resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GSTIN"
                  value={profile.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value)}
                  placeholder="Enter GSTIN number"
                  required
                />

                <Input
                  label="Phone Number"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-xl">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Business Logo</h3>
                <p className="text-sm text-gray-600">Upload to Cloudinary</p>
              </div>
            </div>

            <div className="space-y-4">
              {logoPreview && (
                <div className="flex justify-center">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="max-w-32 max-h-32 object-contain border border-gray-200 rounded-lg"
                  />
                </div>
              )}

              <div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleFileChange('logo', e.target.files[0])}
                  className="hidden"
                  id="logo-upload"
                  disabled={uploading.logo}
                />
                <label
                  htmlFor="logo-upload"
                  className={`flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 cursor-pointer transition-colors ${uploading.logo ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-center">
                    {uploading.logo ? (
                      <>
                        <Loader className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-spin" />
                        <p className="text-sm text-blue-600">Uploading to Cloudinary...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload logo</p>
                        <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Signature Upload */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Digital Signature</h3>
                <p className="text-sm text-gray-600">Upload to Cloudinary</p>
              </div>
            </div>

            <div className="space-y-4">
              {signaturePreview && (
                <div className="flex justify-center">
                  <img
                    src={signaturePreview}
                    alt="Signature Preview"
                    className="max-w-32 max-h-20 object-contain border border-gray-200 rounded-lg bg-white"
                  />
                </div>
              )}

              <div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleFileChange('signature', e.target.files[0])}
                  className="hidden"
                  id="signature-upload"
                  disabled={uploading.signature}
                />
                <label
                  htmlFor="signature-upload"
                  className={`flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 cursor-pointer transition-colors ${uploading.signature ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-center">
                    {uploading.signature ? (
                      <>
                        <Loader className="h-8 w-8 text-purple-600 mx-auto mb-2 animate-spin" />
                        <p className="text-sm text-purple-600">Uploading to Cloudinary...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload signature</p>
                        <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;
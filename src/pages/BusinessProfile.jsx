import React, { useState, useEffect } from 'react';
import { Building2, Upload, Save, AlertTriangle, Loader, Palette, Globe, Eye } from 'lucide-react';
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
    signatureUrl: null,
    bankDetails: {
      bankName: '',
      accountNo: '',
      ifscCode: '',
      branch: ''
    },
    upiId: '',
    branding: {
      primaryColor: '#2563eb',
      secondaryColor: '#3b82f6',
      customDomain: '',
      hideCloudiritzBranding: false
    }
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
    if (field === 'bankDetails') {
      setProfile(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          ...value
        }
      }));
    } else if (field === 'branding') {
      setProfile(prev => ({
        ...prev,
        branding: {
          ...prev.branding,
          ...value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
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
    console.log('💾 Saving profile...', profile);
    setSaving(true);
    setError(null);

    try {
      // Send JSON data only (no files)
      const response = await profileAPI.updateProfile(profile);
      console.log('✅ Save response:', response);
      
      if (response.data?.success) {
        // Update theme colors
        if (profile.branding?.primaryColor || profile.branding?.secondaryColor) {
          window.dispatchEvent(new CustomEvent('update-brand-colors', {
            detail: {
              primaryColor: profile.branding.primaryColor,
              secondaryColor: profile.branding.secondaryColor
            }
          }));
        }
        
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            type: 'success',
            message: 'Business profile updated successfully!'
          }
        }));
        
        await fetchProfile();
      } else {
        throw new Error(response.data?.message || 'Save failed');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save profile';
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

          {/* Bank Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details (for A4 Invoice)</h3>
            <div className="space-y-4">
              <Input
                label="Bank Name"
                value={profile.bankDetails?.bankName || ''}
                onChange={(e) => handleInputChange('bankDetails', { ...profile.bankDetails, bankName: e.target.value })}
                placeholder="Enter bank name"
              />
              <Input
                label="Account Number"
                value={profile.bankDetails?.accountNo || ''}
                onChange={(e) => handleInputChange('bankDetails', { ...profile.bankDetails, accountNo: e.target.value })}
                placeholder="Enter account number"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="IFSC Code"
                  value={profile.bankDetails?.ifscCode || ''}
                  onChange={(e) => handleInputChange('bankDetails', { ...profile.bankDetails, ifscCode: e.target.value })}
                  placeholder="Enter IFSC code"
                />
                <Input
                  label="Branch"
                  value={profile.bankDetails?.branch || ''}
                  onChange={(e) => handleInputChange('bankDetails', { ...profile.bankDetails, branch: e.target.value })}
                  placeholder="Enter branch name"
                />
              </div>
            </div>
          </div>

          {/* UPI Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">UPI Payment</h3>
            <Input
              label="UPI ID"
              value={profile.upiId || ''}
              onChange={(e) => handleInputChange('upiId', e.target.value)}
              placeholder="yourname@paytm"
              helperText="QR code will be shown on UPI payment invoices"
            />
          </div>

          {/* White Label Branding */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Palette className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Brand Colors</h3>
                <p className="text-sm text-gray-600">Customize your CRM theme</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={profile.branding?.primaryColor || '#2563eb'}
                    onChange={(e) => handleInputChange('branding', { primaryColor: e.target.value })}
                    className="w-16 h-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={profile.branding?.primaryColor || '#2563eb'}
                    onChange={(e) => handleInputChange('branding', { primaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={profile.branding?.secondaryColor || '#3b82f6'}
                    onChange={(e) => handleInputChange('branding', { secondaryColor: e.target.value })}
                    className="w-16 h-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={profile.branding?.secondaryColor || '#3b82f6'}
                    onChange={(e) => handleInputChange('branding', { secondaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Color Preview</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                    style={{ backgroundColor: profile.branding?.primaryColor || '#2563eb' }}
                  >
                    Primary
                  </button>
                  <button 
                    className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                    style={{ backgroundColor: profile.branding?.secondaryColor || '#3b82f6' }}
                  >
                    Secondary
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Domain */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Custom Domain</h3>
                <p className="text-sm text-gray-600">Use your own domain</p>
              </div>
            </div>

            <Input
              label="Custom Domain"
              value={profile.branding?.customDomain || ''}
              onChange={(e) => handleInputChange('branding', { customDomain: e.target.value })}
              placeholder="crm.yourcompany.com"
              helperText="Contact support to configure DNS settings"
            />

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={profile.branding?.hideCloudiritzBranding || false}
                  onChange={(e) => handleInputChange('branding', { hideCloudiritzBranding: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Hide "Powered by Cloudritz" branding
                  <span className="block text-xs text-gray-500 mt-1">Available for Enterprise plans</span>
                </span>
              </label>
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
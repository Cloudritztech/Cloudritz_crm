import React, { useState, useEffect } from 'react';
import { Building2, User, MapPin, FileText, Upload, Save, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { profileAPI } from '../services/api';

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
  const [error, setError] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);

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

  const handleFileChange = (type, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'logo') {
          setLogoPreview(e.target.result);
          setLogoFile(file);
        } else {
          setSignaturePreview(e.target.result);
          setSignatureFile(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Add text fields with backend-compatible names
      if (profile.businessName) formData.append('business_name', profile.businessName);
      if (profile.ownerName) formData.append('owner_name', profile.ownerName);
      if (profile.businessAddress) formData.append('address', profile.businessAddress);
      if (profile.gstin) formData.append('gstin', profile.gstin);
      if (profile.phone) formData.append('phone', profile.phone);
      if (profile.email) formData.append('email', profile.email);

      // Add files
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      if (signatureFile) {
        formData.append('signature', signatureFile);
      }

      const response = await profileAPI.updateProfile(formData);
      
      if (response.data?.success) {
        // Show success toast
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            type: 'success',
            message: 'Business profile updated successfully!'
          }
        }));
        
        // Refresh profile data
        await fetchProfile();
        setLogoFile(null);
        setSignatureFile(null);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save profile';
      setError(errorMessage);
      
      // Show error toast
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
                <p className="text-sm text-gray-600">Upload your business logo</p>
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
                />
                <label
                  htmlFor="logo-upload"
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 cursor-pointer transition-colors"
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload logo</p>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Signature Upload */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-xl">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Digital Signature</h3>
                <p className="text-sm text-gray-600">Upload your signature</p>
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
                />
                <label
                  htmlFor="signature-upload"
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 cursor-pointer transition-colors"
                >
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload signature</p>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
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
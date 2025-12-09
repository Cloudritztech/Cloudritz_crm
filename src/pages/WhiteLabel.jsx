import { useState, useEffect } from 'react';
import { Palette, Image, Globe, Eye, Save } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function WhiteLabel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [branding, setBranding] = useState({
    primaryColor: '#2563eb',
    secondaryColor: '#3b82f6',
    logoUrl: '',
    faviconUrl: '',
    companyName: '',
    customDomain: '',
    hideCloudiritzBranding: false
  });

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const { data } = await api.get('/branding?action=current');
      setOrganization(data.organization);
      setBranding({ ...branding, ...data.branding });
    } catch (error) {
      toast.error('Failed to load branding');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/branding?action=update', { branding });
      toast.success('Branding updated successfully!');
      // Reload page to apply new branding
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update branding');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const isEnterprise = organization?.subscription?.plan === 'enterprise';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">White Label Settings</h1>
        <p className="text-gray-600">Customize your CRM branding and appearance</p>
      </div>

      <div className="space-y-6">
        {/* Colors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2 text-blue-600" />
            Brand Colors
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="w-16 h-12 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  className="w-16 h-12 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Image className="w-5 h-5 mr-2 text-blue-600" />
            Logos & Icons
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={branding.logoUrl}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 200x50px PNG with transparent background</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favicon URL
              </label>
              <input
                type="url"
                value={branding.faviconUrl}
                onChange={(e) => handleChange('faviconUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="https://example.com/favicon.ico"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 32x32px ICO or PNG</p>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-blue-600" />
            Company Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name (Display)
              </label>
              <input
                type="text"
                value={branding.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder={organization?.name}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use organization name</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Domain
              </label>
              <input
                type="text"
                value={branding.customDomain}
                onChange={(e) => handleChange('customDomain', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="crm.yourcompany.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: <span className="font-medium">{organization?.subdomain}.cloudritz.app</span>
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Enterprise Features</h2>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={branding.hideCloudiritzBranding}
                onChange={(e) => handleChange('hideCloudiritzBranding', e.target.checked)}
                disabled={!isEnterprise}
                className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
              />
              <span className="ml-3 text-sm text-gray-700">
                Hide "Powered by Cloudritz" branding
              </span>
              {!isEnterprise && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  Enterprise Only
                </span>
              )}
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-blue-600" />
            Preview
          </h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="flex items-center space-x-4 mb-6">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="h-12" />
              ) : (
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {(branding.companyName || organization?.name || 'C')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xl font-semibold">
                {branding.companyName || organization?.name}
              </span>
            </div>
            <div className="flex gap-3">
              <button 
                className="px-6 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: branding.primaryColor }}
              >
                Primary Button
              </button>
              <button 
                className="px-6 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: branding.secondaryColor }}
              >
                Secondary Button
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center font-semibold"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

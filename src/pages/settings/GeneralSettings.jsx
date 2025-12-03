import React, { useState } from 'react';
import { Upload, Save, X } from 'lucide-react';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const GeneralSettings = () => {
  const [formData, setFormData] = useState({
    companyName: 'Anvi Tiles & Decorhub',
    email: 'contact@anvitiles.com',
    phone: '+91 98765 43210',
    website: 'www.anvitiles.com',
    address: '123 Main Street, City, State - 123456',
    logo: null,
    autoSave: true,
    soundEffects: true,
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo size must be less than 2MB');
        return;
      }
      setFormData({ ...formData, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      toast.success('Settings saved successfully!');
      setLoading(false);
    }, 1000);
  };

  const handleReset = () => {
    setFormData({
      companyName: 'Anvi Tiles & Decorhub',
      email: 'contact@anvitiles.com',
      phone: '+91 98765 43210',
      website: 'www.anvitiles.com',
      address: '123 Main Street, City, State - 123456',
      logo: null,
      autoSave: true,
      soundEffects: true,
    });
    setLogoPreview(null);
    toast.success('Settings reset to default');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsCard title="Company Information" description="Basic details about your business">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <Input
              label="Website"
              name="website"
              value={formData.website}
              onChange={handleChange}
            />
          </div>
          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Company Logo" description="Upload your company logo (Max 2MB, PNG/JPG)">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-[#0F1113] overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Upload className="h-8 w-8 text-gray-400" />
              )}
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <input
              type="file"
              id="logo-upload"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <label
              htmlFor="logo-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Logo
            </label>
            {logoPreview && (
              <button
                type="button"
                onClick={() => {
                  setLogoPreview(null);
                  setFormData({ ...formData, logo: null });
                }}
                className="ml-2 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </button>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Recommended: 512x512px, PNG or JPG format
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Preferences" description="Application behavior settings">
        <div className="space-y-3">
          <SettingsToggle
            label="Auto-save"
            description="Automatically save changes without confirmation"
            checked={formData.autoSave}
            onChange={(e) => setFormData({ ...formData, autoSave: e.target.checked })}
          />
          <SettingsToggle
            label="Sound Effects"
            description="Play sounds for notifications and actions"
            checked={formData.soundEffects}
            onChange={(e) => setFormData({ ...formData, soundEffects: e.target.checked })}
          />
        </div>
      </SettingsCard>

      <div className="flex items-center justify-end space-x-3 sticky bottom-4 bg-white dark:bg-[#141619] p-4 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.04)] shadow-lg">
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" loading={loading} icon={Save}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default GeneralSettings;

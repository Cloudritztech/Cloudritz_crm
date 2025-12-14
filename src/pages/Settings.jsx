import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { profileAPI } from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    invoicePrefix: 'INV',
    startingNumber: 1001,
    termsAndConditions: 'Payment due within 30 days.\nGoods once sold will not be taken back.',
    footerNote: 'Thank you for your business!'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await profileAPI.updateProfile(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your CRM preferences</p>
        </div>
        <Button onClick={handleSave} loading={loading} icon={Save}>
          Save Changes
        </Button>
      </div>

      <div className="card space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Invoice Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Invoice Prefix"
              value={settings.invoicePrefix}
              onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
            />
            <Input
              label="Starting Number"
              type="number"
              value={settings.startingNumber}
              onChange={(e) => setSettings({ ...settings, startingNumber: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Terms & Conditions
          </label>
          <textarea
            className="input-field w-full h-32"
            value={settings.termsAndConditions}
            onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Footer Note
          </label>
          <Input
            value={settings.footerNote}
            onChange={(e) => setSettings({ ...settings, footerNote: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;

import React, { useState } from 'react';
import { Save, Shield, DollarSign, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    quarterlyFee: 2999,
    companyEmail: 'admin@cloudritz.com',
    companyPhone: '+91 98765 43210',
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxOrganizations: 1000,
    defaultTrialDays: 0
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate save - you can implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure system-wide settings</p>
      </div>

      {/* Pricing Settings */}
      <div className="bg-white dark:bg-[#141619] rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pricing Settings</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quarterly Maintenance Fee (₹)
            </label>
            <input
              type="number"
              value={settings.quarterlyFee}
              onChange={(e) => setSettings({ ...settings, quarterlyFee: parseInt(e.target.value) })}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0F1113] text-gray-900 dark:text-white rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Contact Settings */}
      <div className="bg-white dark:bg-[#141619] rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Contact Information</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Email
            </label>
            <input
              type="email"
              value={settings.companyEmail}
              onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
              className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0F1113] text-gray-900 dark:text-white rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Phone
            </label>
            <input
              type="tel"
              value={settings.companyPhone}
              onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
              className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0F1113] text-gray-900 dark:text-white rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white dark:bg-[#141619] rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Configuration</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Maintenance Mode</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Disable access for all users except superadmin</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Allow New Registrations</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enable new organization sign-ups</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowNewRegistrations}
                onChange={(e) => setSettings({ ...settings, allowNewRegistrations: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Organizations
            </label>
            <input
              type="number"
              value={settings.maxOrganizations}
              onChange={(e) => setSettings({ ...settings, maxOrganizations: parseInt(e.target.value) })}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0F1113] text-gray-900 dark:text-white rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

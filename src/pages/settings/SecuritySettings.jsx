import React, { useState } from 'react';
import { Save, Shield, Key, Activity } from 'lucide-react';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const SecuritySettings = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [loading, setLoading] = useState(false);

  const loginActivity = [
    { date: '2024-01-15 10:30 AM', device: 'Chrome on Windows', location: 'Mumbai, India', status: 'Success' },
    { date: '2024-01-14 03:45 PM', device: 'Safari on iPhone', location: 'Mumbai, India', status: 'Success' },
    { date: '2024-01-13 09:15 AM', device: 'Chrome on Windows', location: 'Mumbai, India', status: 'Success' },
  ];

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <SettingsCard title="Change Password" description="Update your account password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            required
          />
          <Button type="submit" loading={loading} icon={Key}>
            Update Password
          </Button>
        </form>
      </SettingsCard>

      <SettingsCard title="Two-Factor Authentication" description="Add an extra layer of security">
        <div className="space-y-4">
          <SettingsToggle
            label="Enable 2FA"
            description="Require verification code in addition to password"
            checked={twoFactorEnabled}
            onChange={(e) => setTwoFactorEnabled(e.target.checked)}
          />
          {twoFactorEnabled && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    2FA is enabled
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    You'll receive a verification code via email when logging in
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SettingsCard>

      <SettingsCard title="Session Management" description="Control session timeout">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Auto Logout After (minutes)
            </label>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-[#0F1113] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="0">Never</option>
            </select>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Login Activity" description="Recent login history">
        <div className="space-y-3">
          {loginActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-4 bg-gray-50 dark:bg-[#0F1113] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.04)]"
            >
              <div className="flex items-start space-x-3">
                <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.device}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.location} • {activity.date}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </SettingsCard>

      <div className="flex items-center justify-end sticky bottom-4 bg-white dark:bg-[#141619] p-4 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.04)] shadow-lg">
        <Button icon={Save} onClick={() => toast.success('Security settings saved!')}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default SecuritySettings;

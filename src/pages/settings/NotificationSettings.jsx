import React, { useState } from 'react';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';
import Button from '../../components/ui/Button';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    paymentReminders: true,
    dailyReports: false,
    weeklyReports: false
  });

  const handleSave = () => {
    toast.success('Notification settings saved!');
  };

  return (
    <div className="space-y-6">
      <SettingsCard title="Notification Preferences" description="Manage your notification settings">
        <div className="space-y-3">
          <SettingsToggle
            label="Email Notifications"
            description="Receive notifications via email"
            checked={settings.emailNotifications}
            onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
          />
          <SettingsToggle
            label="Low Stock Alerts"
            description="Get notified when products are low in stock"
            checked={settings.lowStockAlerts}
            onChange={(e) => setSettings({...settings, lowStockAlerts: e.target.checked})}
          />
          <SettingsToggle
            label="Payment Reminders"
            description="Receive reminders for pending payments"
            checked={settings.paymentReminders}
            onChange={(e) => setSettings({...settings, paymentReminders: e.target.checked})}
          />
          <SettingsToggle
            label="Daily Reports"
            description="Receive daily sales and inventory reports"
            checked={settings.dailyReports}
            onChange={(e) => setSettings({...settings, dailyReports: e.target.checked})}
          />
          <SettingsToggle
            label="Weekly Reports"
            description="Receive weekly performance summaries"
            checked={settings.weeklyReports}
            onChange={(e) => setSettings({...settings, weeklyReports: e.target.checked})}
          />
        </div>
      </SettingsCard>

      <div className="flex items-center justify-end sticky bottom-4 bg-white dark:bg-[#141619] p-4 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.04)] shadow-lg">
        <Button onClick={handleSave} icon={Save}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;

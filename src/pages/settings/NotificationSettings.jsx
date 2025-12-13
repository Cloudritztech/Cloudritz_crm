import React, { useState, useEffect } from 'react';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';
import Button from '../../components/ui/Button';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    paymentReminders: true,
    dailyReports: false,
    weeklyReports: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/notifications?action=settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success && data.settings) {
        setSettings({
          emailNotifications: data.settings.emailNotifications,
          lowStockAlerts: data.settings.lowStockAlerts,
          paymentReminders: data.settings.paymentReminders,
          dailyReports: data.settings.dailyReports,
          weeklyReports: data.settings.weeklyReports
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put('/api/notifications?action=settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success('Notification settings saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
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
        <Button onClick={handleSave} icon={Save} loading={saving} disabled={loading}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;

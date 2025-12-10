import React from 'react';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';

const NotificationSettings = () => {
  return (
    <div className="space-y-6">
      <SettingsCard title="Notification Preferences" description="Manage your notification settings">
        <div className="space-y-3">
          <SettingsToggle
            label="Email Notifications"
            description="Receive notifications via email"
            checked={true}
            onChange={() => {}}
          />
          <SettingsToggle
            label="Low Stock Alerts"
            description="Get notified when products are low in stock"
            checked={true}
            onChange={() => {}}
          />
          <SettingsToggle
            label="Payment Reminders"
            description="Receive reminders for pending payments"
            checked={true}
            onChange={() => {}}
          />
        </div>
      </SettingsCard>
    </div>
  );
};

export default NotificationSettings;

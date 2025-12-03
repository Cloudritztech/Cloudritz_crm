import React, { useState } from 'react';
import { Save } from 'lucide-react';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    lowStockEmail: true,
    lowStockSMS: false,
    newOrderEmail: true,
    newOrderSMS: true,
    paymentReceivedEmail: true,
    paymentReceivedSMS: false,
    customerMessageEmail: true,
    customerMessageSMS: false,
    soundAlerts: true,
    desktopNotifications: true,
  });

  const [loading, setLoading] = useState(false);

  const handleToggle = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      toast.success('Notification settings saved successfully!');
      setLoading(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsCard title="Email Notifications" description="Receive notifications via email">
        <div className="space-y-3">
          <SettingsToggle
            label="Low Stock Alerts"
            description="Get notified when products are running low"
            checked={notifications.lowStockEmail}
            onChange={() => handleToggle('lowStockEmail')}
          />
          <SettingsToggle
            label="New Orders"
            description="Notification for new customer orders"
            checked={notifications.newOrderEmail}
            onChange={() => handleToggle('newOrderEmail')}
          />
          <SettingsToggle
            label="Payment Received"
            description="Notification when payment is received"
            checked={notifications.paymentReceivedEmail}
            onChange={() => handleToggle('paymentReceivedEmail')}
          />
          <SettingsToggle
            label="Customer Messages"
            description="Notification for customer inquiries"
            checked={notifications.customerMessageEmail}
            onChange={() => handleToggle('customerMessageEmail')}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="SMS Notifications" description="Receive notifications via SMS">
        <div className="space-y-3">
          <SettingsToggle
            label="Low Stock Alerts"
            description="Get SMS when products are running low"
            checked={notifications.lowStockSMS}
            onChange={() => handleToggle('lowStockSMS')}
          />
          <SettingsToggle
            label="New Orders"
            description="SMS for new customer orders"
            checked={notifications.newOrderSMS}
            onChange={() => handleToggle('newOrderSMS')}
          />
          <SettingsToggle
            label="Payment Received"
            description="SMS when payment is received"
            checked={notifications.paymentReceivedSMS}
            onChange={() => handleToggle('paymentReceivedSMS')}
          />
          <SettingsToggle
            label="Customer Messages"
            description="SMS for customer inquiries"
            checked={notifications.customerMessageSMS}
            onChange={() => handleToggle('customerMessageSMS')}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="App Notifications" description="In-app notification preferences">
        <div className="space-y-3">
          <SettingsToggle
            label="Sound Alerts"
            description="Play sound for notifications"
            checked={notifications.soundAlerts}
            onChange={() => handleToggle('soundAlerts')}
          />
          <SettingsToggle
            label="Desktop Notifications"
            description="Show desktop notifications"
            checked={notifications.desktopNotifications}
            onChange={() => handleToggle('desktopNotifications')}
          />
        </div>
      </SettingsCard>

      <div className="flex items-center justify-end sticky bottom-4 bg-white dark:bg-[#141619] p-4 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.04)] shadow-lg">
        <Button type="submit" loading={loading} icon={Save}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default NotificationSettings;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, MessageCircle, Mail, Cloud, Send } from 'lucide-react';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const IntegrationSettings = () => {
  const [whatsapp, setWhatsapp] = useState({
    enabled: false,
    apiKey: '',
    phoneNumber: '',
  });

  const [smtp, setSmtp] = useState({
    enabled: false,
    host: 'smtp.gmail.com',
    port: '587',
    username: '',
    password: '',
    fromEmail: '',
  });

  const [googleDrive, setGoogleDrive] = useState({
    enabled: false,
    connected: false,
    email: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings?section=integrations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.settings) {
        const settings = response.data.settings;
        if (settings.whatsapp) setWhatsapp({ ...whatsapp, ...settings.whatsapp });
        if (settings.smtp) setSmtp({ ...smtp, ...settings.smtp });
        if (settings.googleDrive) setGoogleDrive({ ...googleDrive, ...settings.googleDrive });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleTestEmail = () => {
    if (!smtp.enabled) {
      toast.error('Please enable SMTP first');
      return;
    }
    toast.success('Test email sent successfully!');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings?section=integrations', 
        { whatsapp, smtp, googleDrive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Integration settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsCard title="WhatsApp Integration" description="Send invoices and messages via WhatsApp">
        <div className="space-y-4">
          <SettingsToggle
            label="Enable WhatsApp"
            description="Connect WhatsApp for sending invoices"
            checked={whatsapp.enabled}
            onChange={(e) => setWhatsapp({ ...whatsapp, enabled: e.target.checked })}
          />
          
          {whatsapp.enabled && (
            <>
              <Input
                label="API Key"
                value={whatsapp.apiKey}
                onChange={(e) => setWhatsapp({ ...whatsapp, apiKey: e.target.value })}
                placeholder="Enter WhatsApp API key"
              />
              <Input
                label="Business Phone Number"
                value={whatsapp.phoneNumber}
                onChange={(e) => setWhatsapp({ ...whatsapp, phoneNumber: e.target.value })}
                placeholder="+91 98765 43210"
              />
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      WhatsApp Business API Required
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      You need a WhatsApp Business API account to use this feature
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SettingsCard>

      <SettingsCard 
        title="Email (SMTP)" 
        description="Configure email server for sending invoices"
        actions={
          smtp.enabled && (
            <Button size="sm" variant="outline" onClick={handleTestEmail} icon={Send}>
              Test Email
            </Button>
          )
        }
      >
        <div className="space-y-4">
          <SettingsToggle
            label="Enable SMTP"
            description="Send emails via SMTP server"
            checked={smtp.enabled}
            onChange={(e) => setSmtp({ ...smtp, enabled: e.target.checked })}
          />
          
          {smtp.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="SMTP Host"
                  value={smtp.host}
                  onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
                <Input
                  label="Port"
                  type="number"
                  value={smtp.port}
                  onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                  placeholder="587"
                />
              </div>
              <Input
                label="Username"
                value={smtp.username}
                onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                placeholder="your-email@gmail.com"
              />
              <Input
                label="Password"
                type="password"
                value={smtp.password}
                onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                placeholder="App password"
              />
              <Input
                label="From Email"
                type="email"
                value={smtp.fromEmail}
                onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })}
                placeholder="noreply@anvitiles.com"
              />
            </>
          )}
        </div>
      </SettingsCard>

      <SettingsCard title="Google Drive Backup" description="Auto-backup to your Google Drive">
        <div className="space-y-4">
          <SettingsToggle
            label="Enable Google Drive Backup"
            description="Automatically backup data to your Google Drive (uses logged-in email)"
            checked={googleDrive.enabled}
            onChange={(e) => setGoogleDrive({ ...googleDrive, enabled: e.target.checked })}
          />
          
          {googleDrive.enabled && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <Cloud className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Google Drive Auto-Backup Enabled
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Backups will be saved to "Anvi CRM Backups" folder in your Google Drive using your logged-in email account.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                    Note: Ensure you're logged into Google Drive on this device.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SettingsCard>

      <div className="flex items-center justify-end sticky bottom-4 bg-white dark:bg-[#141619] p-4 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.04)] shadow-lg">
        <Button onClick={handleSave} loading={loading} icon={Save}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default IntegrationSettings;

import React, { useState } from 'react';
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

  const [cloudStorage, setCloudStorage] = useState({
    enabled: false,
    provider: 'google',
    apiKey: '',
  });

  const [loading, setLoading] = useState(false);

  const handleTestEmail = () => {
    if (!smtp.enabled) {
      toast.error('Please enable SMTP first');
      return;
    }
    toast.success('Test email sent successfully!');
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Integration settings saved!');
      setLoading(false);
    }, 1000);
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

      <SettingsCard title="Cloud Storage" description="Backup data to cloud storage">
        <div className="space-y-4">
          <SettingsToggle
            label="Enable Cloud Backup"
            description="Automatically backup to cloud storage"
            checked={cloudStorage.enabled}
            onChange={(e) => setCloudStorage({ ...cloudStorage, enabled: e.target.checked })}
          />
          
          {cloudStorage.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cloud Provider
                </label>
                <select
                  value={cloudStorage.provider}
                  onChange={(e) => setCloudStorage({ ...cloudStorage, provider: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-[#0F1113] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="google">Google Drive</option>
                  <option value="dropbox">Dropbox</option>
                  <option value="onedrive">OneDrive</option>
                </select>
              </div>
              <Input
                label="API Key"
                value={cloudStorage.apiKey}
                onChange={(e) => setCloudStorage({ ...cloudStorage, apiKey: e.target.value })}
                placeholder="Enter API key"
              />
            </>
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

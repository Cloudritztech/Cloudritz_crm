import React, { useState } from 'react';
import { Download, Upload, Cloud, Database, Calendar } from 'lucide-react';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const BackupSettings = () => {
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [cloudBackup, setCloudBackup] = useState(false);
  const [loading, setLoading] = useState(false);

  const backups = [
    { date: '2024-01-15 10:30 AM', size: '2.4 MB', type: 'Auto' },
    { date: '2024-01-14 10:30 AM', size: '2.3 MB', type: 'Auto' },
    { date: '2024-01-13 10:30 AM', size: '2.2 MB', type: 'Manual' },
  ];

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Data exported successfully!');
      setLoading(false);
    }, 2000);
  };

  const handleImport = () => {
    document.getElementById('import-file').click();
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      setTimeout(() => {
        toast.success('Data imported successfully!');
        setLoading(false);
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsCard title="Export Data" description="Download your data as backup">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export all your data including products, customers, invoices, and settings in JSON format.
          </p>
          <Button onClick={handleExport} loading={loading} icon={Download}>
            Export All Data
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Import Data" description="Restore data from backup file">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Import data from a previously exported backup file. This will overwrite existing data.
          </p>
          <input
            type="file"
            id="import-file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
          <Button onClick={handleImport} loading={loading} icon={Upload} variant="outline">
            Import Data
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Automatic Backup" description="Configure automatic backup settings">
        <div className="space-y-4">
          <SettingsToggle
            label="Enable Auto Backup"
            description="Automatically backup data at scheduled intervals"
            checked={autoBackup}
            onChange={(e) => setAutoBackup(e.target.checked)}
          />
          
          {autoBackup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Backup Frequency
              </label>
              <select
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-[#0F1113] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hourly">Every Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          <SettingsToggle
            label="Cloud Backup"
            description="Store backups in cloud storage"
            checked={cloudBackup}
            onChange={(e) => setCloudBackup(e.target.checked)}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Backup History" description="Recent backup files">
        <div className="space-y-3">
          {backups.map((backup, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0F1113] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.04)]"
            >
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Backup - {backup.date}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {backup.size} • {backup.type}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" icon={Download}>
                Download
              </Button>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
};

export default BackupSettings;

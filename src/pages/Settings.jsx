import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, FileText, Zap, Database, Save, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('invoice');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [invoiceSettings, setInvoiceSettings] = useState({
    prefix: 'INV',
    startingNumber: 1001,
    template: 'compact',
    termsAndConditions: '',
    footerNote: '',
    showLogo: true,
    showBankDetails: true,
    showSignature: true,
    autoIncrement: true
  });

  const [integrationSettings, setIntegrationSettings] = useState({
    whatsapp: { enabled: false, apiKey: '', phoneNumber: '' },
    googleDrive: { enabled: false, connected: false, email: '' }
  });

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    cloudBackup: false,
    lastBackup: null
  });

  useEffect(() => {
    fetchSettings();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/account?type=settings&section=${activeTab}`);
      
      if (data.success) {
        if (activeTab === 'invoice') {
          setInvoiceSettings(data.settings);
        } else if (activeTab === 'categories') {
          setCategorySettings(data.settings || { categories: ['Tiles', 'Sanitary', 'WPC Doors', 'Accessories'] });
        } else if (activeTab === 'integrations') {
          setIntegrationSettings(data.settings);
        } else if (activeTab === 'backup') {
          setBackupSettings(data.settings);
        }
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      let payload = {};
      if (activeTab === 'invoice') payload = invoiceSettings;
      else if (activeTab === 'categories') payload = categorySettings;
      else if (activeTab === 'integrations') payload = integrationSettings;
      else if (activeTab === 'backup') payload = backupSettings;

      const { data } = await api.put(`/account?type=settings&section=${activeTab}`, payload);
      
      if (data.success) {
        toast.success('Settings saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const [categorySettings, setCategorySettings] = useState({
    categories: ['Tiles', 'Sanitary', 'WPC Doors', 'Accessories']
  });
  const [newCategory, setNewCategory] = useState('');

  const tabs = [
    { id: 'invoice', label: 'Invoice Settings', icon: FileText },
    { id: 'categories', label: 'Product Categories', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'backup', label: 'Backup', icon: SettingsIcon }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your CRM preferences</p>
        </div>
        <Button onClick={saveSettings} loading={saving} icon={Save}>
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Invoice Settings */}
            {activeTab === 'invoice' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Invoice Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Invoice Prefix"
                      value={invoiceSettings.prefix}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, prefix: e.target.value })}
                      placeholder="INV"
                    />
                    <Input
                      label="Starting Number"
                      type="number"
                      value={invoiceSettings.startingNumber}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, startingNumber: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Invoice Template</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setInvoiceSettings({ ...invoiceSettings, template: 'compact' })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        invoiceSettings.template === 'compact'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Compact Template</span>
                        {invoiceSettings.template === 'compact' && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Simple, single-page invoice format</p>
                    </button>

                    <button
                      onClick={() => setInvoiceSettings({ ...invoiceSettings, template: 'detailed' })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        invoiceSettings.template === 'detailed'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Detailed Template</span>
                        {invoiceSettings.template === 'detailed' && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Comprehensive A4 format with all details</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                  <textarea
                    value={invoiceSettings.termsAndConditions}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, termsAndConditions: e.target.value })}
                    rows={4}
                    className="input-field w-full"
                    placeholder="Enter terms and conditions..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Footer Note</label>
                  <Input
                    value={invoiceSettings.footerNote}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerNote: e.target.value })}
                    placeholder="Thank you for your business!"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Display Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={invoiceSettings.showLogo}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showLogo: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">Show business logo on invoice</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={invoiceSettings.showBankDetails}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showBankDetails: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">Show bank details on invoice</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={invoiceSettings.showSignature}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showSignature: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">Show signature on invoice</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={invoiceSettings.autoIncrement}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, autoIncrement: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">Auto-increment invoice numbers</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">WhatsApp Integration</h3>
                      <p className="text-sm text-gray-600">Send invoices via WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrationSettings.whatsapp?.enabled}
                        onChange={(e) => setIntegrationSettings({
                          ...integrationSettings,
                          whatsapp: { ...integrationSettings.whatsapp, enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {integrationSettings.whatsapp?.enabled && (
                    <div className="space-y-3">
                      <Input
                        label="API Key"
                        value={integrationSettings.whatsapp?.apiKey || ''}
                        onChange={(e) => setIntegrationSettings({
                          ...integrationSettings,
                          whatsapp: { ...integrationSettings.whatsapp, apiKey: e.target.value }
                        })}
                        placeholder="Enter WhatsApp API key"
                      />
                      <Input
                        label="Phone Number"
                        value={integrationSettings.whatsapp?.phoneNumber || ''}
                        onChange={(e) => setIntegrationSettings({
                          ...integrationSettings,
                          whatsapp: { ...integrationSettings.whatsapp, phoneNumber: e.target.value }
                        })}
                        placeholder="+91 XXXXXXXXXX"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Google Drive Backup</h3>
                      <p className="text-sm text-gray-600">Auto-backup invoices to Google Drive</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrationSettings.googleDrive?.enabled}
                        onChange={(e) => setIntegrationSettings({
                          ...integrationSettings,
                          googleDrive: { ...integrationSettings.googleDrive, enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {integrationSettings.googleDrive?.enabled && (
                    <Button variant="outline" size="sm">
                      Connect Google Drive
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Category Settings */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Product Categories</h3>
                  <p className="text-sm text-gray-600 mb-4">Customize categories for your business type</p>
                  
                  <div className="space-y-3 mb-4">
                    {categorySettings.categories.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{cat}</span>
                        <button
                          onClick={() => {
                            const newCats = categorySettings.categories.filter((_, i) => i !== index);
                            setCategorySettings({ categories: newCats });
                          }}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newCategory.trim()) {
                          setCategorySettings({
                            categories: [...categorySettings.categories, newCategory.trim()]
                          });
                          setNewCategory('');
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newCategory.trim()) {
                          setCategorySettings({
                            categories: [...categorySettings.categories, newCategory.trim()]
                          });
                          setNewCategory('');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Settings */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div>
                  <label className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      checked={backupSettings.autoBackup}
                      onChange={(e) => setBackupSettings({ ...backupSettings, autoBackup: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Enable automatic backups</span>
                  </label>

                  {backupSettings.autoBackup && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                        <select
                          value={backupSettings.backupFrequency}
                          onChange={(e) => setBackupSettings({ ...backupSettings, backupFrequency: e.target.value })}
                          className="input-field w-full md:w-64"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={backupSettings.cloudBackup}
                          onChange={(e) => setBackupSettings({ ...backupSettings, cloudBackup: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Store backups in cloud</span>
                      </label>

                      {backupSettings.lastBackup && (
                        <p className="text-sm text-gray-600">
                          Last backup: {new Date(backupSettings.lastBackup).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import axios from 'axios';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const InvoiceSettings = () => {
  const [formData, setFormData] = useState({
    prefix: 'INV',
    startingNumber: '1001',
    autoIncrement: true,
    termsAndConditions: 'Payment due within 30 days.\nGoods once sold will not be taken back.\nSubject to local jurisdiction.',
    footerNote: 'Thank you for your business!',
    showLogo: true,
    showBankDetails: true,
    showSignature: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings?section=invoice', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.settings) {
        setFormData({ ...formData, ...response.data.settings });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings?section=invoice', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsCard title="Invoice Numbering" description="Configure invoice number format">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Invoice Prefix"
              name="prefix"
              value={formData.prefix}
              onChange={handleChange}
              placeholder="INV"
              required
            />
            <Input
              label="Starting Number"
              name="startingNumber"
              type="number"
              value={formData.startingNumber}
              onChange={handleChange}
              required
            />
          </div>
          <SettingsToggle
            label="Auto-increment invoice numbers"
            description="Automatically generate sequential invoice numbers"
            checked={formData.autoIncrement}
            onChange={(e) => setFormData({ ...formData, autoIncrement: e.target.checked })}
          />
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Preview:</strong> {formData.prefix}-{formData.startingNumber}
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Invoice Content" description="Default text for invoices">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Terms & Conditions
            </label>
            <textarea
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-white dark:bg-[#0F1113] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Input
            label="Footer Note"
            name="footerNote"
            value={formData.footerNote}
            onChange={handleChange}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Invoice Display" description="What to show on invoices">
        <div className="space-y-3">
          <SettingsToggle
            label="Show Company Logo"
            description="Display logo on invoice header"
            checked={formData.showLogo}
            onChange={(e) => setFormData({ ...formData, showLogo: e.target.checked })}
          />
          <SettingsToggle
            label="Show Bank Details"
            description="Display bank account information"
            checked={formData.showBankDetails}
            onChange={(e) => setFormData({ ...formData, showBankDetails: e.target.checked })}
          />
          <SettingsToggle
            label="Show Signature"
            description="Display authorized signature"
            checked={formData.showSignature}
            onChange={(e) => setFormData({ ...formData, showSignature: e.target.checked })}
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

export default InvoiceSettings;

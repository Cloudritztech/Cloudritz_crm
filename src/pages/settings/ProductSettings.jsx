import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import axios from 'axios';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const ProductSettings = () => {
  const [formData, setFormData] = useState({
    defaultUnit: 'piece',
    lowStockThreshold: 10,
    maxImageSize: 2,
    allowNegativeStock: false,
    autoCalculatePurchasePrice: true,
    showStockValue: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings?section=product', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.settings) {
        setFormData({ ...formData, ...response.data.settings });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const units = [
    'piece', 'box', 'sq.ft', 'sq.m', 'running ft', 'running m',
    'kg', 'liter', 'set', 'pair'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings?section=product', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsCard title="Default Settings" description="Default values for new products">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Unit
            </label>
            <select
              name="defaultUnit"
              value={formData.defaultUnit}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-[#0F1113] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
          
          <Input
            label="Low Stock Alert Threshold"
            name="lowStockThreshold"
            type="number"
            value={formData.lowStockThreshold}
            onChange={handleChange}
            required
          />
          
          <Input
            label="Maximum Image Size (MB)"
            name="maxImageSize"
            type="number"
            value={formData.maxImageSize}
            onChange={handleChange}
            required
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Stock Management" description="Configure stock behavior">
        <div className="space-y-3">
          <SettingsToggle
            label="Allow Negative Stock"
            description="Allow selling products even when stock is zero"
            checked={formData.allowNegativeStock}
            onChange={(e) => setFormData({ ...formData, allowNegativeStock: e.target.checked })}
          />
          <SettingsToggle
            label="Auto-calculate Purchase Price"
            description="Calculate purchase price from stock value automatically"
            checked={formData.autoCalculatePurchasePrice}
            onChange={(e) => setFormData({ ...formData, autoCalculatePurchasePrice: e.target.checked })}
          />
          <SettingsToggle
            label="Show Stock Value"
            description="Display total stock value on product cards"
            checked={formData.showStockValue}
            onChange={(e) => setFormData({ ...formData, showStockValue: e.target.checked })}
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

export default ProductSettings;

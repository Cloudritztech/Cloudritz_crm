import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsToggle from '../../components/settings/SettingsToggle';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const TaxSettings = () => {
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [gstRates, setGstRates] = useState([
    { id: 1, name: '0%', rate: 0 },
    { id: 2, name: '5%', rate: 5 },
    { id: 3, name: '12%', rate: 12 },
    { id: 4, name: '18%', rate: 18 },
    { id: 5, name: '28%', rate: 28 },
  ]);
  const [hsnCodes, setHsnCodes] = useState([
    { id: 1, code: '6907', description: 'Ceramic Tiles', rate: 18 },
    { id: 2, code: '3925', description: 'WPC Doors', rate: 18 },
  ]);
  const [loading, setLoading] = useState(false);

  const addHSNCode = () => {
    setHsnCodes([...hsnCodes, { id: Date.now(), code: '', description: '', rate: 18 }]);
  };

  const removeHSNCode = (id) => {
    setHsnCodes(hsnCodes.filter(item => item.id !== id));
  };

  const updateHSNCode = (id, field, value) => {
    setHsnCodes(hsnCodes.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      toast.success('Tax settings saved successfully!');
      setLoading(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsCard title="Tax Configuration" description="Configure GST and tax settings">
        <div className="space-y-4">
          <SettingsToggle
            label="Prices include tax"
            description="Product prices already include GST"
            checked={taxIncluded}
            onChange={(e) => setTaxIncluded(e.target.checked)}
          />
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-900 dark:text-yellow-300">
              <strong>Note:</strong> {taxIncluded ? 'GST will be extracted from the total price' : 'GST will be added to the base price'}
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="GST Rates" description="Standard GST rate slabs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {gstRates.map((rate) => (
            <div
              key={rate.id}
              className="p-4 bg-gray-50 dark:bg-[#0F1113] rounded-lg border border-gray-200 dark:border-gray-700 text-center"
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{rate.rate}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">GST Rate</div>
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard 
        title="HSN Codes" 
        description="Manage HSN codes for products"
        actions={
          <Button type="button" size="sm" onClick={addHSNCode} icon={Plus}>
            Add HSN
          </Button>
        }
      >
        <div className="space-y-3">
          {hsnCodes.map((hsn) => (
            <div key={hsn.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-gray-50 dark:bg-[#0F1113] rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="md:col-span-3">
                <Input
                  placeholder="HSN Code"
                  value={hsn.code}
                  onChange={(e) => updateHSNCode(hsn.id, 'code', e.target.value)}
                />
              </div>
              <div className="md:col-span-5">
                <Input
                  placeholder="Description"
                  value={hsn.description}
                  onChange={(e) => updateHSNCode(hsn.id, 'description', e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  type="number"
                  placeholder="Rate %"
                  value={hsn.rate}
                  onChange={(e) => updateHSNCode(hsn.id, 'rate', parseFloat(e.target.value))}
                />
              </div>
              <div className="md:col-span-1 flex items-center">
                <button
                  type="button"
                  onClick={() => removeHSNCode(hsn.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
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

export default TaxSettings;

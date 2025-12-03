import React, { useState } from 'react';
import { Save } from 'lucide-react';
import SettingsCard from '../../components/settings/SettingsCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const BusinessSettings = () => {
  const [formData, setFormData] = useState({
    gstin: '27AABCU9603R1ZM',
    pan: 'AABCU9603R',
    businessType: 'Retail',
    registeredAddress: '123 Main Street, City, State - 123456',
    bankName: 'State Bank of India',
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234',
    accountHolderName: 'Anvi Tiles & Decorhub',
    upiId: 'anvitiles@paytm',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateGSTIN = (gstin) => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!validateGSTIN(formData.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format';
    }

    if (!validatePAN(formData.pan)) {
      newErrors.pan = 'Invalid PAN format';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix validation errors');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      toast.success('Business settings saved successfully!');
      setLoading(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsCard title="Tax Information" description="GST and PAN details">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="GSTIN"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                required
                error={errors.gstin}
              />
              {errors.gstin && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.gstin}</p>
              )}
            </div>
            <div>
              <Input
                label="PAN"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                required
                error={errors.pan}
              />
              {errors.pan && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.pan}</p>
              )}
            </div>
          </div>
          <Input
            label="Business Type"
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
            required
          />
          <Input
            label="Registered Address"
            name="registeredAddress"
            value={formData.registeredAddress}
            onChange={handleChange}
            required
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Bank Details" description="Bank account information for payments">
        <div className="space-y-4">
          <Input
            label="Bank Name"
            name="bankName"
            value={formData.bankName}
            onChange={handleChange}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Account Number"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              required
            />
            <Input
              label="IFSC Code"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleChange}
              required
            />
          </div>
          <Input
            label="Account Holder Name"
            name="accountHolderName"
            value={formData.accountHolderName}
            onChange={handleChange}
            required
          />
          <Input
            label="UPI ID"
            name="upiId"
            value={formData.upiId}
            onChange={handleChange}
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

export default BusinessSettings;

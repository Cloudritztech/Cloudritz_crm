import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import SettingsLayout from '../components/settings/SettingsLayout';
import GeneralSettings from './settings/GeneralSettings';
import AppearanceSettings from './settings/AppearanceSettings';
import BusinessSettings from './settings/BusinessSettings';
import InvoiceSettings from './settings/InvoiceSettings';
import TaxSettings from './settings/TaxSettings';
import ProductSettings from './settings/ProductSettings';
import NotificationSettings from './settings/NotificationSettings';
import BackupSettings from './settings/BackupSettings';
import IntegrationSettings from './settings/IntegrationSettings';
import SecuritySettings from './settings/SecuritySettings';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/settings') {
      navigate('/settings/general', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <SettingsLayout>
      <Routes>
        <Route path="general" element={<GeneralSettings />} />
        <Route path="appearance" element={<AppearanceSettings />} />
        <Route path="business" element={<BusinessSettings />} />
        <Route path="invoice" element={<InvoiceSettings />} />
        <Route path="tax" element={<TaxSettings />} />
        <Route path="product" element={<ProductSettings />} />
        <Route path="payment" element={<div className="bg-white dark:bg-[#141619] rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.04)] p-6"><h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Settings</h2><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
        <Route path="notifications" element={<NotificationSettings />} />
        <Route path="backup" element={<BackupSettings />} />
        <Route path="integrations" element={<IntegrationSettings />} />
        <Route path="preferences" element={<div className="bg-white dark:bg-[#141619] rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.04)] p-6"><h2 className="text-xl font-bold text-gray-900 dark:text-white">User Preferences</h2><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
        <Route path="security" element={<SecuritySettings />} />
        <Route path="*" element={<Navigate to="/settings/general" replace />} />
      </Routes>
    </SettingsLayout>
  );
};

export default Settings;

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
      navigate('/settings/appearance', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <SettingsLayout>
      <Routes>
        <Route path="appearance" element={<AppearanceSettings />} />
        <Route path="invoice" element={<InvoiceSettings />} />
        <Route path="product" element={<ProductSettings />} />
        <Route path="notifications" element={<NotificationSettings />} />
        <Route path="backup" element={<BackupSettings />} />
        <Route path="integrations" element={<IntegrationSettings />} />
        <Route path="*" element={<Navigate to="/settings/appearance" replace />} />
      </Routes>
    </SettingsLayout>
  );
};

export default Settings;

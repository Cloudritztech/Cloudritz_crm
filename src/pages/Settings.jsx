import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import SettingsLayout from '../components/settings/SettingsLayout';
import InvoiceSettings from './settings/InvoiceSettings';
import ProductSettings from './settings/ProductSettings';
import BackupSettings from './settings/BackupSettings';
import IntegrationSettings from './settings/IntegrationSettings';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/settings') {
      navigate('/settings/invoice', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <SettingsLayout>
      <Routes>
        <Route path="invoice" element={<InvoiceSettings />} />
        <Route path="product" element={<ProductSettings />} />
        <Route path="backup" element={<BackupSettings />} />
        <Route path="integrations" element={<IntegrationSettings />} />
        <Route path="*" element={<Navigate to="/settings/invoice" replace />} />
      </Routes>
    </SettingsLayout>
  );
};

export default Settings;

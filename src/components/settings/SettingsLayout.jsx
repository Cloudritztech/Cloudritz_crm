import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Settings as SettingsIcon, Palette, Building2, FileText, DollarSign,
  Package, Bell, Database, Plug, Shield, CreditCard, Globe, Menu, X
} from 'lucide-react';

const SettingsLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sections = [
    { id: 'appearance', name: 'Appearance', icon: Palette, path: '/settings/appearance' },
    { id: 'invoice', name: 'Invoice', icon: FileText, path: '/settings/invoice' },
    { id: 'product', name: 'Product', icon: Package, path: '/settings/product' },
    { id: 'notifications', name: 'Notifications', icon: Bell, path: '/settings/notifications' },
    { id: 'backup', name: 'Data Backup', icon: Database, path: '/settings/backup' },
    { id: 'integrations', name: 'Integrations', icon: Plug, path: '/settings/integrations' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your application preferences</p>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`lg:col-span-1 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white dark:bg-[#141619] rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.04)] p-2 sticky top-20">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const active = isActive(section.path);
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      navigate(section.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{section.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;

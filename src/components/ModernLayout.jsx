import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Users, FileText, Search, Bell, Menu, X } from 'lucide-react';
import UserMenu from './UserMenu';
import BottomNav from './BottomNav';

const ModernLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Invoices', href: '/invoices', icon: FileText },
  ];

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen transition-colors bg-gray-50 dark:bg-[#0F1113]">
      {/* Main Content */}
      <div>
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[rgba(20,22,25,0.8)] backdrop-blur-md border-b border-gray-200 dark:border-[rgba(255,255,255,0.04)]">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}>
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">Anvi CRM</span>
            </div>

            {/* Right: Notifications + User Menu */}
            <div className="flex items-center space-x-3">
              <button className="relative p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
              </button>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav />
    </div>
  );
};

export default ModernLayout;

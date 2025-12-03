import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Users, FileText, Search, Menu, X } from 'lucide-react';
import UserMenu from './UserMenu';
import BottomNav from './BottomNav';
import NotificationPanel from './NotificationPanel';

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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-40">
        <div className="flex flex-col flex-grow bg-white dark:bg-[#141619] border-r border-gray-200 dark:border-[rgba(255,255,255,0.04)]">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-[rgba(255,255,255,0.04)]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}>
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">Anvi CRM</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[rgba(20,22,25,0.8)] backdrop-blur-md border-b border-gray-200 dark:border-[rgba(255,255,255,0.04)]">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between">
            {/* Left: Logo (Mobile Only) */}
            <div className="flex items-center space-x-3 lg:hidden">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}>
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">Anvi CRM</span>
            </div>

            {/* Desktop: Empty space to push right items */}
            <div className="hidden lg:block"></div>

            {/* Right: Notifications + User Menu */}
            <div className="flex items-center space-x-3">
              <NotificationPanel />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <BottomNav />
    </div>
  );
};

export default ModernLayout;

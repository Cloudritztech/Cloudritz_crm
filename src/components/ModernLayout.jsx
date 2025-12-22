import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Users, FileText, DollarSign, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import UserMenu from './UserMenu';
import BottomNav from './BottomNav';
import NotificationBell from './NotificationBell';

const ModernLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission, PERMISSIONS } = usePermissions();
  const businessName = user?.businessProfile?.businessName || 'Cloudritz CRM';
  const businessLogo = user?.businessProfile?.logo || '';
  const appLogo = '/cloudritz-logo.png';

  useEffect(() => {
    if (businessName) {
      document.title = `${businessName} - CRM`;
    }
  }, [businessName]);

  const allNavigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: Home,
      permission: PERMISSIONS.VIEW_DASHBOARD
    },
    { 
      name: 'Products', 
      href: '/products', 
      icon: Package,
      permission: PERMISSIONS.VIEW_PRODUCTS
    },
    { 
      name: 'Customers', 
      href: '/customers', 
      icon: Users,
      permission: PERMISSIONS.VIEW_CUSTOMERS
    },
    { 
      name: 'Invoices', 
      href: '/invoices', 
      icon: FileText,
      permission: PERMISSIONS.VIEW_INVOICES
    },
    { 
      name: 'Expenses', 
      href: '/expenses', 
      icon: DollarSign,
      permission: PERMISSIONS.VIEW_EXPENSES
    },
    { 
      name: 'Employees', 
      href: '/employees', 
      icon: UserCheck,
      permission: PERMISSIONS.MANAGE_USERS
    },
  ];

  // Filter navigation based on permissions
  const navigation = allNavigation.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

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
          <Link to="/" className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-[rgba(255,255,255,0.04)] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <img src={appLogo} alt="Cloudritz CRM" className="w-8 h-8 object-contain" />
            <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">Cloudritz CRM</span>
          </Link>

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
                      ? ''
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  style={active ? { backgroundColor: 'var(--color-primary)', color: 'white' } : {}}
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
            <Link to="/" className="flex items-center space-x-3 lg:hidden">
              <img src={appLogo} alt="Cloudritz CRM" className="w-8 h-8 object-contain" />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">Cloudritz CRM</span>
            </Link>

            {/* Desktop: Empty space to push right items */}
            <div className="hidden lg:block"></div>

            {/* Right: Notifications & User Menu */}
            <div className="flex items-center space-x-3">
              <NotificationBell />
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

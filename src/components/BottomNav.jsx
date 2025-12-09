import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Users, FileText, Menu, X, Plus, Shield, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Different navigation for super admin
  const mainNav = user?.role === 'superadmin' ? [
    { name: 'Dashboard', href: '/superadmin', icon: Home },
    { name: 'Organizations', href: '/superadmin/organizations', icon: Building2 },
    { name: 'Users', href: '/superadmin/users', icon: Users },
  ] : [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Invoices', href: '/invoices', icon: FileText },
  ];

  // Quick actions only for regular users
  const quickActions = user?.role === 'superadmin' ? [
    { name: 'New Organization', href: '/superadmin/organizations/create' },
  ] : [
    { name: 'New Product', href: '/products?action=add' },
    { name: 'New Customer', href: '/customers?action=add' },
    { name: 'New Invoice', href: '/invoices/add' },
  ];

  const isActive = (href) => {
    if (href === '/' || href === '/superadmin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Quick Add Menu - Only for regular users */}
      {showQuickAdd && user?.role !== 'superadmin' && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowQuickAdd(false)}>
          <div className="absolute bottom-20 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 w-48">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                onClick={() => setShowQuickAdd(false)}
                className="block px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                {action.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* More Menu Overlay */}
      {showMore && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Menu</h3>
              <button onClick={() => setShowMore(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-2">
              {user?.role === 'superadmin' ? (
                <>
                  <Link to="/superadmin/organizations/create" onClick={() => setShowMore(false)} className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                    Create Organization
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/expenses" onClick={() => setShowMore(false)} className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                    Expenses
                  </Link>
                  <Link to="/employees" onClick={() => setShowMore(false)} className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                    Employees
                  </Link>
                  <Link to="/billing" onClick={() => setShowMore(false)} className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                    Billing
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/white-label" onClick={() => setShowMore(false)} className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                      White Label
                    </Link>
                  )}
                  <Link to="/business-profile" onClick={() => setShowMore(false)} className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                    Business Profile
                  </Link>
                  <Link to="/settings" onClick={() => setShowMore(false)} className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                    Settings
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Button - Only for regular users */}
      {user?.role !== 'superadmin' && (
        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-2xl flex items-center justify-center z-30 hover:scale-110 transition-transform"
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 safe-area-bottom">
        <div className={`grid h-16 ${user?.role === 'superadmin' ? 'grid-cols-3' : 'grid-cols-5'}`}>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
          {user?.role !== 'superadmin' && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex flex-col items-center justify-center space-y-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;

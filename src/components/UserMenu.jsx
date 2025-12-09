import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { profileAPI } from '../services/api';
import {
  User, Building2, Palette, Settings, Bell, HelpCircle, LogOut,
  ChevronRight, Sun, Moon, Monitor
} from 'lucide-react';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await profileAPI.getProfile();
        if (response.data?.profile?.logoUrl) {
          setLogoUrl(response.data.profile.logoUrl);
        }
      } catch (error) {
        console.error('Failed to fetch logo:', error);
      }
    };
    fetchLogo();
  }, []);

  const menuItems = user?.role === 'superadmin' ? [
    { icon: HelpCircle, label: 'Help & Support', action: () => navigate('/help') },
  ] : [
    { icon: User, label: 'Profile', action: () => navigate('/profile') },
    { icon: Building2, label: 'Business Profile', action: () => navigate('/business-profile') },
    { icon: Settings, label: 'Settings', action: () => navigate('/settings') },
    { icon: Bell, label: 'Notifications', action: () => navigate('/notifications') },
    { icon: HelpCircle, label: 'Help & Support', action: () => navigate('/help') },
  ];

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm overflow-hidden" style={{ background: logoUrl ? 'transparent' : 'linear-gradient(135deg, #2563EB, #3B82F6)' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="text-white font-bold text-sm">A</span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-slide-up">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm overflow-hidden" style={{ background: logoUrl ? 'transparent' : 'linear-gradient(135deg, #2563EB, #3B82F6)' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-white font-bold text-xl">A</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white truncate">{user?.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              );
            })}
          </div>

          {/* Theme Selector */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Appearance</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                      theme === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-1 ${theme === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                    <span className={`text-xs ${theme === option.value ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout */}
          <div className="px-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => {
                logout();
                navigate('/login');
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

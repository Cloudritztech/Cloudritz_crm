import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Save } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import SettingsCard from '../../components/settings/SettingsCard';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import axios from 'axios';

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings?section=appearance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.settings) {
        setAccentColor(response.data.settings.accentColor || '#3B82F6');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light', desc: 'Light theme' },
    { value: 'dark', icon: Moon, label: 'Dark', desc: 'Dark theme' },
    { value: 'system', icon: Monitor, label: 'System', desc: 'Follow system' },
  ];

  const accentColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings?section=appearance', 
        { theme, accentColor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Appearance settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsCard title="Theme" description="Choose your preferred theme">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
                  theme === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`h-10 w-10 mb-3 ${theme === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                <span className={`font-medium text-lg ${theme === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  {option.label}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">{option.desc}</span>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Accent Color" description="Customize the primary color of the interface">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {accentColors.map((color) => (
            <button
              key={color.value}
              onClick={() => setAccentColor(color.value)}
              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                accentColor === color.value
                  ? 'border-gray-900 dark:border-white'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div
                className="w-12 h-12 rounded-full mb-2"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">{color.name}</span>
            </button>
          ))}
        </div>
      </SettingsCard>

      <div className="flex items-center justify-end sticky bottom-4 bg-white dark:bg-[#141619] p-4 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.04)] shadow-lg">
        <Button onClick={handleSave} loading={loading} icon={Save}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default AppearanceSettings;

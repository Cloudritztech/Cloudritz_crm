import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });
  
  const [brandColors, setBrandColors] = useState(() => {
    const saved = localStorage.getItem('brandColors');
    return saved ? JSON.parse(saved) : { primaryColor: '#2563eb', secondaryColor: '#3b82f6' };
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = theme === 'system' ? systemTheme : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(activeTheme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--color-primary', brandColors.primaryColor);
    root.style.setProperty('--color-secondary', brandColors.secondaryColor);
    
    // Convert hex to RGB for rgba usage
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '37, 99, 235';
    };
    
    root.style.setProperty('--color-primary-rgb', hexToRgb(brandColors.primaryColor));
    root.style.setProperty('--color-secondary-rgb', hexToRgb(brandColors.secondaryColor));
    localStorage.setItem('brandColors', JSON.stringify(brandColors));
  }, [brandColors]);
  
  useEffect(() => {
    const handleBrandColorUpdate = (event) => {
      setBrandColors(event.detail);
    };
    window.addEventListener('update-brand-colors', handleBrandColorUpdate);
    return () => window.removeEventListener('update-brand-colors', handleBrandColorUpdate);
  }, []);

  const value = {
    theme,
    setTheme,
    brandColors,
    setBrandColors,
    isDark: theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

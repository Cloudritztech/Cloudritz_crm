import React from 'react';
import { Toaster } from 'react-hot-toast';

const Toast = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1e293b',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#fff',
          },
          style: {
            border: '1px solid #dcfce7',
            background: '#f0fdf4',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
          style: {
            border: '1px solid #fee2e2',
            background: '#fef2f2',
          },
        },
        loading: {
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#fff',
          },
          style: {
            border: '1px solid #dbeafe',
            background: '#eff6ff',
          },
        },
      }}
    />
  );
};

export default Toast;
import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-modal p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div 
        className={`w-full ${sizes[size]} max-h-[90vh] overflow-y-auto rounded-xl`}
        style={{ 
          background: 'var(--bg-elevated)', 
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;

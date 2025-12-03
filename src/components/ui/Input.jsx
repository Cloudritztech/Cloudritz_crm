import React, { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const Input = forwardRef(({ 
  className, 
  type = 'text',
  size = 'md',
  error,
  success,
  helperText,
  label,
  required,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: 'var(--danger)' }} className="ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={clsx(
            'input-field w-full',
            LeftIcon && 'pl-10',
            (RightIcon || isPassword || error || success) && 'pr-10',
            className
          )}
          {...props}
        />
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none"
              style={{ color: 'var(--text-muted)' }}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
          
          {!isPassword && error && <AlertCircle className="h-5 w-5" style={{ color: 'var(--danger)' }} />}
          {!isPassword && success && <CheckCircle className="h-5 w-5" style={{ color: 'var(--success)' }} />}
          {!isPassword && !error && !success && RightIcon && <RightIcon className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>
      
      {(error || success || helperText) && (
        <p className="mt-2 text-sm" style={{ color: error ? 'var(--danger)' : success ? 'var(--success)' : 'var(--text-muted)' }}>
          {error || success || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(({ 
  className, 
  rows = 4,
  error,
  success,
  helperText,
  label,
  required,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: 'var(--danger)' }} className="ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        rows={rows}
        className={clsx('input-field w-full resize-none', className)}
        {...props}
      />
      
      {(error || success || helperText) && (
        <p className="mt-2 text-sm" style={{ color: error ? 'var(--danger)' : success ? 'var(--success)' : 'var(--text-muted)' }}>
          {error || success || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ 
  className, 
  children,
  error,
  success,
  helperText,
  label,
  required,
  placeholder,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: 'var(--danger)' }} className="ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        className={clsx('input-field w-full', className)}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {children}
      </select>
      
      {(error || success || helperText) && (
        <p className="mt-2 text-sm" style={{ color: error ? 'var(--danger)' : success ? 'var(--success)' : 'var(--text-muted)' }}>
          {error || success || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Input;

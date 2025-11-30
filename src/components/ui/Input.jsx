import React, { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const Input = forwardRef(({ 
  className, 
  type = 'text',
  size = 'md',
  variant = 'default',
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
  
  const sizes = {
    sm: 'input-field-sm',
    md: 'input-field',
    lg: 'px-4 py-4 text-base border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300',
  };
  
  const variants = {
    default: '',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
  };
  
  const currentVariant = error ? 'error' : success ? 'success' : variant;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={clsx(
            sizes[size],
            variants[currentVariant],
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
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
          
          {!isPassword && error && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          
          {!isPassword && success && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          
          {!isPassword && !error && !success && RightIcon && (
            <RightIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      {(error || success || helperText) && (
        <p className={clsx(
          'mt-2 text-sm',
          error ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-500'
        )}>
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
  const variant = error ? 'error' : success ? 'success' : 'default';
  
  const variants = {
    default: 'input-field',
    error: 'input-field border-red-300 focus:border-red-500 focus:ring-red-500',
    success: 'input-field border-green-300 focus:border-green-500 focus:ring-green-500',
  };
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          variants[variant],
          'resize-none',
          className
        )}
        {...props}
      />
      
      {(error || success || helperText) && (
        <p className={clsx(
          'mt-2 text-sm',
          error ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-500'
        )}>
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
  const variant = error ? 'error' : success ? 'success' : 'default';
  
  const variants = {
    default: 'select-field',
    error: 'select-field border-red-300 focus:border-red-500 focus:ring-red-500',
    success: 'select-field border-green-300 focus:border-green-500 focus:ring-green-500',
  };
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        className={clsx(
          variants[variant],
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      
      {(error || success || helperText) && (
        <p className={clsx(
          'mt-2 text-sm',
          error ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-500'
        )}>
          {error || success || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Input;
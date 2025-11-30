import React, { Children, cloneElement } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  disabled,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
  };
  
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 className={clsx(
          'animate-spin',
          iconSizes[size],
          children && (iconPosition === 'left' ? 'mr-2' : 'ml-2')
        )} />
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={clsx(
          iconSizes[size],
          children && 'mr-2'
        )} />
      )}
      
      {children}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={clsx(
          iconSizes[size],
          children && 'ml-2'
        )} />
      )}
    </button>
  );
};

// Specialized button components
export const IconButton = ({ icon: Icon, size = 'md', variant = 'ghost', className, ...props }) => {
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7',
  };

  const buttonSizes = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3',
  };

  return (
    <Button
      variant={variant}
      className={clsx(
        'rounded-xl',
        buttonSizes[size],
        className
      )}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </Button>
  );
};

export const ButtonGroup = ({ children, className }) => (
  <div className={clsx('inline-flex rounded-xl shadow-sm', className)}>
    {Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return child;
      
      const isFirst = index === 0;
      const isLast = index === Children.count(children) - 1;
      
      return cloneElement(child, {
        className: clsx(
          child.props.className,
          !isFirst && !isLast && 'rounded-none border-l-0',
          isFirst && 'rounded-r-none',
          isLast && 'rounded-l-none border-l-0'
        )
      });
    })}
  </div>
);

export default Button;
import React from 'react';
import clsx from 'clsx';

const Card = ({ 
  children, 
  className, 
  variant = 'default',
  padding = 'default',
  hover = false,
  ...props 
}) => {
  const variants = {
    default: 'card',
    compact: 'card-compact',
    stat: 'stat-card',
    outline: 'bg-white rounded-2xl border-2 border-secondary-200 p-6 transition-all duration-200',
    gradient: 'bg-gradient-primary text-white rounded-2xl shadow-medium p-6 transition-all duration-200',
  };
  
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };
  
  const baseClass = variants[variant];
  const paddingClass = variant === 'default' || variant === 'compact' || variant === 'stat' ? '' : paddings[padding];
  const hoverClass = hover ? 'hover:shadow-medium hover:-translate-y-1 cursor-pointer' : '';

  return (
    <div
      className={clsx(
        baseClass,
        paddingClass,
        hoverClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Specialized card components
export const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = 'primary', ...props }) => {
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-info-500',
    secondary: 'bg-secondary-500',
  };

  return (
    <Card variant="stat" {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            {Icon && (
              <div className={clsx('p-3 rounded-xl', colorClasses[color])}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        {trend && (
          <div className={clsx(
            'text-sm font-medium px-2 py-1 rounded-full',
            trend.type === 'up' ? 'text-success-700 bg-success-100' :
            trend.type === 'down' ? 'text-danger-700 bg-danger-100' :
            'text-secondary-700 bg-secondary-100'
          )}>
            {trend.value}
          </div>
        )}
      </div>
    </Card>
  );
};

export const LoadingCard = ({ className }) => (
  <Card className={clsx('animate-pulse', className)}>
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-secondary-200 rounded-xl"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
        <div className="h-6 bg-secondary-200 rounded w-1/2"></div>
      </div>
    </div>
  </Card>
);

export default Card;
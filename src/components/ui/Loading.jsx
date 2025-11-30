import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const Loading = ({ 
  size = 'md', 
  variant = 'spinner',
  className,
  text,
  fullScreen = false 
}) => {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const Spinner = () => (
    <Loader2 className={clsx('loading-spinner', sizes[size], className)} />
  );

  const Skeleton = ({ className: skeletonClassName, ...props }) => (
    <div className={clsx('skeleton', skeletonClassName)} {...props} />
  );

  const Dots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={clsx(
            'bg-primary-600 rounded-full animate-pulse',
            sizes[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  const content = (
    <div className={clsx(
      'flex flex-col items-center justify-center space-y-3',
      fullScreen ? 'min-h-screen' : 'py-8'
    )}>
      {variant === 'spinner' && <Spinner />}
      {variant === 'dots' && <Dots />}
      {text && (
        <p className="text-sm text-secondary-600 animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton components for different layouts
export const SkeletonCard = ({ className }) => (
  <div className={clsx('card animate-pulse', className)}>
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-secondary-200 rounded-xl"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
        <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="table-container">
    <div className="table-header">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-secondary-200 rounded flex-1"></div>
        ))}
      </div>
    </div>
    <div className="divide-y divide-secondary-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="table-cell py-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="h-4 bg-secondary-200 rounded flex-1"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonStats = ({ count = 4 }) => (
  <div className="grid-stats">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default Loading;
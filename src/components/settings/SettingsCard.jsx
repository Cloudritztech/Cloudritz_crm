import React from 'react';

const SettingsCard = ({ title, description, children, actions }) => {
  return (
    <div className="bg-white dark:bg-[#141619] rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.04)] overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-[rgba(255,255,255,0.04)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
};

export default SettingsCard;

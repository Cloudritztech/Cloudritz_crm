import React from 'react';
import { Lock, Shield, AlertCircle } from 'lucide-react';

const RestrictedAccess = ({ 
  title = 'Access Restricted', 
  message = 'You are not allowed to view this section.',
  children 
}) => {
  return (
    <div className="relative min-h-screen">
      {/* Blurred Background Content */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="blur-md opacity-30 pointer-events-none select-none">
          {children}
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm" />

      {/* Restriction Message */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <Lock className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              🔒 {title}
            </h2>

            {/* Message */}
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {message}
            </p>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Need Access?
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Please contact your administrator to request access to this section.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Go Back
            </button>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <Shield className="h-4 w-4" />
                <span>Protected by Role-Based Access Control</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestrictedAccess;

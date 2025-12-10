import React from 'react';
import { AlertCircle, Phone, Mail, IndianRupee } from 'lucide-react';

export default function BlockedAccountModal({ message, monthlyFee, contactInfo }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Account Blocked
        </h2>
        
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Subscription Fee:</span>
            <div className="flex items-center gap-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              <IndianRupee className="w-6 h-6" />
              {monthlyFee?.toLocaleString() || '999'}
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Pay this amount to continue using Cloudritz CRM
          </p>
        </div>
        
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">Contact Us to Make Payment:</h3>
          
          {contactInfo?.phone && (
            <a 
              href={`tel:${contactInfo.phone}`}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">Call Us</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{contactInfo.phone}</div>
              </div>
            </a>
          )}
          
          {contactInfo?.email && (
            <a 
              href={`mailto:${contactInfo.email}`}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">Email Us</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{contactInfo.email}</div>
              </div>
            </a>
          )}
        </div>
        
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

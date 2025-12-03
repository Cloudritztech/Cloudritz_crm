import React from 'react';
import { User, Phone, MapPin, Edit, Mail } from 'lucide-react';

const CustomerCard = ({ customer, onEdit }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{customer.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
          </div>
        </div>
      </div>
      
      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{customer.phone}</span>
        </div>
        
        {customer.email && (
          <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        
        {customer.address?.city && (
          <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{customer.address.city}, {customer.address.state}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">Total Purchases</span>
          <span className="text-sm font-bold text-green-600 dark:text-green-400">₹{customer.totalPurchases || 0}</span>
        </div>
        {customer.lastPurchaseDate && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Last: {new Date(customer.lastPurchaseDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Edit Button */}
      <button
        onClick={() => onEdit(customer)}
        className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm"
      >
        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
        Edit
      </button>
    </div>
  );
};

export default CustomerCard;
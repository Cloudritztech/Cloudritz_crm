import React from 'react';
import { User, Phone, MapPin, Edit, Mail } from 'lucide-react';

const CustomerCard = ({ customer, onEdit }) => {
  return (
    <div className="card-premium p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}>
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>{customer.name}</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Customer</p>
          </div>
        </div>
      </div>
      
      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{customer.phone}</span>
        </div>
        
        {customer.email && (
          <div className="flex items-center text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        
        {customer.address?.city && (
          <div className="flex items-center text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{customer.address.city}, {customer.address.state}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Purchases</span>
          <span className="text-sm font-bold" style={{ color: 'var(--accent-green)' }}>₹{customer.totalPurchases || 0}</span>
        </div>
        {customer.lastPurchaseDate && (
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Last: {new Date(customer.lastPurchaseDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Edit Button */}
      <button
        onClick={() => onEdit(customer)}
        className="w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all text-sm"
        style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
      >
        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
        Edit
      </button>
    </div>
  );
};

export default CustomerCard;

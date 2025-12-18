import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Edit, Mail, Eye } from 'lucide-react';

const CustomerCard = ({ customer, onEdit }) => {
  const navigate = useNavigate();

  return (
    <div className="card-premium cursor-pointer hover:shadow-xl transition-shadow" onClick={() => navigate(`/customers/${customer._id}`)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}>
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base truncate overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{customer.name}</h3>
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
      <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--bg-hover)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Purchases</span>
          <span className="text-sm" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>₹{customer.totalPurchases || 0}</span>
        </div>
        {customer.lastPurchaseDate && (
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Last: {new Date(customer.lastPurchaseDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/customers/${customer._id}`);
          }}
          className="flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-all text-sm"
          style={{ background: 'var(--accent-primary)', color: 'white', fontWeight: 500 }}
        >
          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
          View
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(customer);
          }}
          className="flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-all text-sm"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', fontWeight: 500 }}
        >
          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
          Edit
        </button>
      </div>
    </div>
  );
};

export default CustomerCard;

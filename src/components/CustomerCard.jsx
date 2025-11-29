import React from 'react';
import { User, Phone, MapPin, Edit } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';

const CustomerCard = ({ customer, onEdit }) => {
  return (
    <Card>
      <div className="flex items-center mb-3">
        <User className="h-5 w-5 text-primary-600 mr-2" />
        <h3 className="font-semibold text-gray-900">{customer.name}</h3>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-2" />
          {customer.phone}
        </div>
        
        {customer.email && (
          <div className="text-sm text-gray-600">
            📧 {customer.email}
          </div>
        )}
        
        {customer.address?.city && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {customer.address.city}, {customer.address.state}
          </div>
        )}
        
        <div className="text-sm">
          <span className="text-gray-600">Total Purchases: </span>
          <span className="font-medium text-green-600">₹{customer.totalPurchases || 0}</span>
        </div>
        
        {customer.lastPurchaseDate && (
          <div className="text-xs text-gray-500">
            Last Purchase: {new Date(customer.lastPurchaseDate).toLocaleDateString()}
          </div>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onEdit(customer)}
        className="w-full flex items-center justify-center"
      >
        <Edit className="h-4 w-4 mr-1" />
        Edit
      </Button>
    </Card>
  );
};

export default CustomerCard;
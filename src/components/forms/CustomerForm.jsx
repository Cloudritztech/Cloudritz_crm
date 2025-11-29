import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CustomerForm = ({ customer, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: {
      street: customer?.address?.street || '',
      city: customer?.address?.city || '',
      state: customer?.address?.state || '',
      pincode: customer?.address?.pincode || ''
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="name"
        label="Customer Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      
      <Input
        name="phone"
        label="Phone Number"
        value={formData.phone}
        onChange={handleChange}
        required
      />
      
      <Input
        name="email"
        type="email"
        label="Email (Optional)"
        value={formData.email}
        onChange={handleChange}
      />
      
      <Input
        name="address.street"
        label="Street Address"
        value={formData.address.street}
        onChange={handleChange}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          name="address.city"
          label="City"
          value={formData.address.city}
          onChange={handleChange}
        />
        <Input
          name="address.state"
          label="State"
          value={formData.address.state}
          onChange={handleChange}
        />
      </div>
      
      <Input
        name="address.pincode"
        label="Pincode"
        value={formData.address.pincode}
        onChange={handleChange}
      />

      <div className="flex space-x-3">
        <Button type="submit" className="flex-1">
          {customer ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;
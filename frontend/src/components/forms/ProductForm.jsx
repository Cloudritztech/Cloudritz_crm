import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || 'tiles',
    purchasePrice: product?.purchasePrice || '',
    sellingPrice: product?.sellingPrice || '',
    stock: product?.stock || '',
    minStock: product?.minStock || '10',
    description: product?.description || '',
    brand: product?.brand || '',
    size: product?.size || '',
    color: product?.color || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="name"
        label="Product Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        >
          <option value="tiles">Tiles</option>
          <option value="sanitary">Sanitary</option>
          <option value="wpc_doors">WPC Doors</option>
          <option value="accessories">Accessories</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="purchasePrice"
          type="number"
          label="Purchase Price"
          value={formData.purchasePrice}
          onChange={handleChange}
          required
        />
        <Input
          name="sellingPrice"
          type="number"
          label="Selling Price"
          value={formData.sellingPrice}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="stock"
          type="number"
          label="Stock Quantity"
          value={formData.stock}
          onChange={handleChange}
          required
        />
        <Input
          name="minStock"
          type="number"
          label="Min Stock Alert"
          value={formData.minStock}
          onChange={handleChange}
        />
      </div>

      <Input
        name="brand"
        label="Brand (Optional)"
        value={formData.brand}
        onChange={handleChange}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="size"
          label="Size (Optional)"
          value={formData.size}
          onChange={handleChange}
        />
        <Input
          name="color"
          label="Color (Optional)"
          value={formData.color}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows="3"
        />
      </div>

      <div className="flex space-x-3">
        <Button type="submit" className="flex-1">
          {product ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
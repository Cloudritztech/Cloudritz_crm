import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    image: product?.image || '',
    unit: product?.unit || 'piece',
    sellingPrice: product?.sellingPrice || '',
    purchasePrice: product?.purchasePrice || '',
    stock: product?.stock || '',
    taxIncluded: product?.taxIncluded || false,
    lowStockLimit: product?.lowStockLimit || '10',
    category: product?.category || 'accessories'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="name"
        label="Item Name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <Input
        name="image"
        label="Image URL (Optional)"
        value={formData.image}
        onChange={handleChange}
        placeholder="https://example.com/image.jpg"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="piece">Piece</option>
            <option value="box">Box</option>
            <option value="set">Set</option>
            <option value="kg">Kg</option>
            <option value="meter">Meter</option>
            <option value="packet">Packet</option>
            <option value="bundle">Bundle</option>
            <option value="litre">Litre</option>
            <option value="sqft">Sq Ft</option>
            <option value="sqm">Sq M</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="tiles">Tiles</option>
            <option value="sanitary">Sanitary</option>
            <option value="wpc_doors">WPC Doors</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="sellingPrice"
          type="number"
          step="0.01"
          label="Sale Price"
          value={formData.sellingPrice}
          onChange={handleChange}
          required
        />
        <Input
          name="purchasePrice"
          type="number"
          step="0.01"
          label="Purchase Price"
          value={formData.purchasePrice}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="stock"
          type="number"
          label="Stock Count"
          value={formData.stock}
          onChange={handleChange}
          required
        />
        <Input
          name="lowStockLimit"
          type="number"
          label="Low Stock Alert"
          value={formData.lowStockLimit}
          onChange={handleChange}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="taxIncluded"
          checked={formData.taxIncluded}
          onChange={handleChange}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label className="ml-2 text-sm font-medium text-gray-700">
          Tax Included in Price
        </label>
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
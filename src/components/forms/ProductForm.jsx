import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import toast from 'react-hot-toast';

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
  const [imagePreview, setImagePreview] = useState(product?.image || '');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(file, 'crm/products/');
      setFormData({ ...formData, image: imageUrl });
      setImagePreview(imageUrl);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: '' });
    setImagePreview('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Product Image
        </label>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-[#0F1113] overflow-hidden relative">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <ImageIcon className="h-12 w-12 text-gray-400" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <input
              type="file"
              id="product-image"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="product-image"
              className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              PNG, JPG, WebP up to 5MB
            </p>
          </div>
        </div>
      </div>

      <Input
        name="name"
        label="Product Name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit</label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-white dark:bg-[#0F1113] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-white dark:bg-[#0F1113] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="tiles">Tiles</option>
            <option value="sanitary">Sanitary</option>
            <option value="wpc_doors">WPC Doors</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          name="sellingPrice"
          type="number"
          step="0.01"
          label="Selling Price (₹)"
          value={formData.sellingPrice}
          onChange={handleChange}
          required
        />
        <Input
          name="purchasePrice"
          type="number"
          step="0.01"
          label="Purchase Price (₹)"
          value={formData.purchasePrice}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          name="stock"
          type="number"
          label="Stock Quantity"
          value={formData.stock}
          onChange={handleChange}
          required
        />
        <Input
          name="lowStockLimit"
          type="number"
          label="Low Stock Alert Limit"
          value={formData.lowStockLimit}
          onChange={handleChange}
        />
      </div>

      <div className="flex items-center p-4 bg-gray-50 dark:bg-[#0F1113] rounded-lg border border-gray-200 dark:border-gray-700">
        <input
          type="checkbox"
          name="taxIncluded"
          checked={formData.taxIncluded}
          onChange={handleChange}
          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
        />
        <label className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer" onClick={() => setFormData({ ...formData, taxIncluded: !formData.taxIncluded })}>
          Tax Included in Price (GST 18%)
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="submit" className="flex-1" disabled={uploading}>
          {product ? 'Update Product' : 'Create Product'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
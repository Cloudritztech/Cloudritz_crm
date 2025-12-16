import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
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
  const [showOptions, setShowOptions] = useState(false);
  const [categories, setCategories] = useState(['Tiles', 'Sanitary', 'WPC Doors', 'Accessories']);

  useEffect(() => {
    fetchCategories();
    
    const handleCategoriesUpdate = () => {
      fetchCategories();
    };
    
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    return () => window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/account?type=settings&section=categories');
      if (data.success && data.settings?.categories) {
        setCategories(data.settings.categories);
      }
    } catch (error) {
      console.log('Using default categories');
    }
  };

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
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading}
          />
          <div 
            onClick={() => !uploading && !imagePreview && setShowOptions(!showOptions)}
            className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-[#0F1113] overflow-hidden relative cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}
                    className="opacity-0 hover:opacity-100 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-opacity"
                    title="Change image"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                    className="opacity-0 hover:opacity-100 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-opacity"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{uploading ? 'Uploading...' : 'Click to add'}</p>
              </div>
            )}
          </div>
          {showOptions && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 min-w-[160px]">
              <button
                type="button"
                onClick={() => { fileInputRef.current?.click(); setShowOptions(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => { cameraInputRef.current?.click(); setShowOptions(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          PNG, JPG, WebP
        </p>
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
            {categories.map((cat) => (
              <option key={cat} value={cat.toLowerCase().replace(/\s+/g, '_')}>
                {cat}
              </option>
            ))}
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
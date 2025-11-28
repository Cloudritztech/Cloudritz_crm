import React from 'react';
import { Package, AlertTriangle, Edit, Trash2, Plus, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from './ui/Card';
import Button from './ui/Button';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onEdit, onDelete, onStockUpdate }) => {
  const { isAdmin } = useAuth();

  const handleStockAdjustment = async (adjustment) => {
    try {
      await productsAPI.adjustStock(
        product._id, 
        adjustment, 
        adjustment > 0 ? 'Manual stock increase' : 'Offline sale'
      );
      
      toast.success(`Stock ${adjustment > 0 ? 'increased' : 'decreased'} successfully`);
      
      if (onStockUpdate) {
        onStockUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Stock adjustment failed');
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <Package className="h-5 w-5 text-primary-600 mr-2" />
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {product.category.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        {product.stock <= product.minStock && (
          <AlertTriangle className="h-5 w-5 text-red-500" />
        )}
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
      {product.brand && <p className="text-sm text-gray-600 mb-1">Brand: {product.brand}</p>}
      {product.size && <p className="text-sm text-gray-600 mb-1">Size: {product.size}</p>}
      
      <div className="space-y-1 mb-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Purchase:</span>
          <span className="font-medium">₹{product.purchasePrice}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Selling:</span>
          <span className="font-medium">₹{product.sellingPrice}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Stock:</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStockAdjustment(-1)}
              className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              title="Decrease stock (offline sale)"
              disabled={product.stock <= 0}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className={`font-medium min-w-[2rem] text-center ${product.stock <= product.minStock ? 'text-red-600' : 'text-green-600'}`}>
              {product.stock}
            </span>
            <button
              onClick={() => handleStockAdjustment(1)}
              className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              title="Increase stock"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(product)}
          className="flex-1 flex items-center justify-center"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        {isAdmin && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(product._id)}
            className="px-3"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;
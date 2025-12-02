import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onStockUpdate }) => {
  const navigate = useNavigate();

  const handleStockAction = async (type) => {
    const qty = prompt(`Enter quantity to ${type === 'IN' ? 'add' : 'remove'}:`);
    if (!qty || qty <= 0) return;

    try {
      await productsAPI.updateStock(product._id, {
        type,
        qty: parseInt(qty),
        note: type === 'IN' ? 'Quick stock in' : 'Quick stock out'
      });
      toast.success(`Stock ${type === 'IN' ? 'added' : 'removed'}`);
      if (onStockUpdate) onStockUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  return (
    <div 
      onClick={() => navigate(`/products/${product._id}`)}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
        <div className="flex flex-col gap-1">
          {product.stock <= product.lowStockLimit && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">LOW STOCK</span>
          )}
          {product.taxIncluded && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">TAX</span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Sale Price:</span>
          <span className="text-xl font-bold text-blue-600">₹{product.sellingPrice}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Stock:</span>
          <span className={`text-lg font-semibold ${product.stock <= product.lowStockLimit ? 'text-red-600' : 'text-green-600'}`}>
            {product.stock} {product.unit}
          </span>
        </div>
      </div>

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => handleStockAction('IN')}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          IN
        </button>
        <button
          onClick={() => handleStockAction('OUT')}
          className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center text-sm"
        >
          <Minus className="h-4 w-4 mr-1" />
          OUT
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
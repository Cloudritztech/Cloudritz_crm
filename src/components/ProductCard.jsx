import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onStockUpdate }) => {
  const navigate = useNavigate();

  const handleStockAction = async (type, e) => {
    e.stopPropagation();
    try {
      await productsAPI.updateStock(product._id, {
        type,
        qty: 1,
        note: type === 'IN' ? 'Quick add' : 'Quick remove'
      });
      toast.success(`Stock ${type === 'IN' ? '+1' : '-1'}`);
      if (onStockUpdate) onStockUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  return (
    <div 
      onClick={() => navigate(`/products/${product._id}`)}
      className="bg-white rounded-lg shadow-md p-3 sm:p-4 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex gap-3 mb-3">
        <div className="flex-shrink-0">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg" />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xl sm:text-2xl font-bold">{product.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2">{product.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {product.stock <= product.lowStockLimit && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">LOW</span>
            )}
            {product.taxIncluded && (
              <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">TAX</span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-gray-600">Sale Price:</span>
          <span className="text-base sm:text-lg lg:text-xl font-bold text-blue-600">₹{product.sellingPrice}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-gray-600">Stock:</span>
          <span className={`text-sm sm:text-base lg:text-lg font-semibold ${product.stock <= product.lowStockLimit ? 'text-red-600' : 'text-green-600'}`}>
            {product.stock} {product.unit}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => handleStockAction('IN', e)}
          className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center justify-center text-xs sm:text-sm font-medium transition-colors"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          IN
        </button>
        <button
          onClick={(e) => handleStockAction('OUT', e)}
          className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 flex items-center justify-center text-xs sm:text-sm font-medium transition-colors"
        >
          <Minus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          OUT
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
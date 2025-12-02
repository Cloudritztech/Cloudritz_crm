import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { ArrowLeft, Edit, Trash2, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAction, setStockAction] = useState('IN');
  const [stockQty, setStockQty] = useState('');
  const [stockNote, setStockNote] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(id);
      setProduct(response.data.product);
    } catch (error) {
      toast.error('Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async () => {
    if (!stockQty || stockQty <= 0) {
      toast.error('Enter valid quantity');
      return;
    }

    try {
      await productsAPI.updateStock(id, {
        type: stockAction,
        qty: parseInt(stockQty),
        note: stockNote
      });
      toast.success(`Stock ${stockAction === 'IN' ? 'added' : 'removed'} successfully`);
      setShowStockModal(false);
      setStockQty('');
      setStockNote('');
      fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        toast.success('Product deleted');
        navigate('/products');
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!product) return <div className="text-center py-8">Product not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/products')} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Products
        </button>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/products/edit/${id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-64 object-cover rounded-lg" />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-4xl">{product.name.charAt(0)}</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex gap-2 mt-2">
                {product.taxIncluded && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">TAX INCLUDED</span>
                )}
                {product.stock <= product.lowStockLimit && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">LOW STOCK</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Sale Price</p>
                <p className="text-2xl font-bold text-blue-600">₹{product.sellingPrice}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Purchase Price</p>
                <p className="text-2xl font-bold text-gray-900">₹{product.purchasePrice}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Stock Count</p>
                <p className="text-2xl font-bold text-green-600">{product.stock} {product.unit}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Low Stock Alert</p>
                <p className="text-2xl font-bold text-purple-600">{product.lowStockLimit}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border p-3 rounded-lg">
                <p className="text-xs text-gray-500">Stock Value (Sale)</p>
                <p className="text-lg font-semibold">₹{product.stockSaleValue?.toFixed(2)}</p>
              </div>
              <div className="border p-3 rounded-lg">
                <p className="text-xs text-gray-500">Stock Value (Purchase)</p>
                <p className="text-lg font-semibold">₹{product.stockPurchaseValue?.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStockAction('IN'); setShowStockModal(true); }}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Stock IN
              </button>
              <button
                onClick={() => { setStockAction('OUT'); setShowStockModal(true); }}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center"
              >
                <Minus className="h-5 w-5 mr-2" />
                Stock OUT
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Stock Movement History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {product.stockHistory?.length > 0 ? (
                product.stockHistory.map((entry, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded ${entry.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">{entry.qty}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{entry.note || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No stock movements yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Stock {stockAction}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Add note"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleStockUpdate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Confirm
                </button>
                <button onClick={() => setShowStockModal(false)} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

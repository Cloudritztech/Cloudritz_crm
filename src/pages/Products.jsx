import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { productsAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { Plus, Upload, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/forms/ProductForm';
import * as XLSX from 'xlsx';
import axios from 'axios';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [sortBy, setSortBy] = useState('newest');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products);
      setFilteredProducts(response.data.products);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (debouncedSearch) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Stock filter
    if (stockFilter === 'low') {
      result = result.filter(p => p.stock <= p.lowStockLimit);
    } else if (stockFilter === 'instock') {
      result = result.filter(p => p.stock > p.lowStockLimit);
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sortBy === 'stock-high') {
      result.sort((a, b) => b.stock - a.stock);
    } else if (sortBy === 'stock-low') {
      result.sort((a, b) => a.stock - b.stock);
    }

    return result;
  }, [products, debouncedSearch, sortBy, stockFilter]);

  useEffect(() => {
    setFilteredProducts(filteredAndSortedProducts);
  }, [filteredAndSortedProducts]);

  const handleSubmit = useCallback(async (formData) => {
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct._id, formData);
        toast.success('Product updated successfully');
      } else {
        await productsAPI.create(formData);
        toast.success('Product created successfully');
      }
      setShowModal(false);
      setEditingProduct(null);
      fetchProducts();
      window.dispatchEvent(new Event('data-changed'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  }, [editingProduct]);

  const handleEdit = useCallback((product) => {
    setEditingProduct(product);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  }, []);

  const handleStockUpdate = useCallback(() => {
    fetchProducts();
  }, []);

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setSyncing(true);
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const normalizeKey = (key) => key.toLowerCase().trim().replace(/\s+/g, '').replace(/[()]/g, '');
        const columnMap = {
          'itemname': 'name',
          'stockcount': 'stock',
          'currentsaleprice': 'sellingPrice',
          'stockvaluesaleprice': 'stockSaleValue',
          'stockvaluepurchaseprice': 'stockPurchaseValue',
          'purchaseprice': 'purchasePrice'
        };

        const products = rows.map(row => {
          const mapped = {};
          for (const [key, value] of Object.entries(row)) {
            const normalizedKey = normalizeKey(key);
            const mappedKey = columnMap[normalizedKey];
            if (mappedKey) mapped[mappedKey] = value;
          }
          // Ensure purchasePrice is set
          if (!mapped.purchasePrice && mapped.stockPurchaseValue && mapped.stock) {
            mapped.purchasePrice = mapped.stockPurchaseValue / mapped.stock;
          }
          return mapped;
        });

        const token = localStorage.getItem('token');
        const response = await axios.post('/api/products?action=sync-excel', 
          { products },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        const { results } = response.data;
        toast.success(`✅ Added: ${results.added}, Updated: ${results.updated}, Unchanged: ${results.unchanged}`);
        if (results.errors.length > 0) {
          toast.error(`⚠️ ${results.errors.length} errors found`);
        }
        fetchProducts();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to sync inventory');
      } finally {
        setSyncing(false);
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Products</h1>
          <div className="flex gap-1.5 sm:gap-2">
          <input
            type="file"
            id="excelUpload"
            accept=".xlsx,.csv"
            onChange={handleExcelUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => document.getElementById('excelUpload').click()}
            disabled={syncing}
            className="px-2 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-md sm:rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
          >
            {syncing ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white sm:mr-2"></div>
            ) : (
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Import Excel'}</span>
          </button>
          <Button onClick={() => setShowModal(true)} className="flex items-center justify-center px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Product</span>
          </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field w-full sm:w-48"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="price-high">Price (High-Low)</option>
            <option value="price-low">Price (Low-High)</option>
            <option value="stock-high">Stock (High-Low)</option>
            <option value="stock-low">Stock (Low-High)</option>
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="input-field w-full sm:w-40"
          >
            <option value="all">All Stock</option>
            <option value="instock">In Stock</option>
            <option value="low">Low Stock</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No products found
          </div>
        ) : (
          filteredProducts.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onStockUpdate={handleStockUpdate}
          />
        ))
        )}
      </div>


      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
      >
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default Products;
import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import { Plus, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/forms/ProductForm';
import * as XLSX from 'xlsx';
import axios from 'axios';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

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

        const normalizeKey = (key) => key.toLowerCase().trim().replace(/\s+/g, '');
        const columnMap = {
          'itemname': 'name',
          'stockcount': 'stock',
          'currentsaleprice': 'sellingPrice',
          'stockvalue(purchaseprice)': 'purchasePrice'
        };

        const products = rows.map(row => {
          const mapped = {};
          for (const [key, value] of Object.entries(row)) {
            const normalizedKey = normalizeKey(key);
            const mappedKey = columnMap[normalizedKey];
            if (mappedKey) mapped[mappedKey] = value;
          }
          return mapped;
        });

        const token = localStorage.getItem('token');
        const response = await axios.post('/api/products/sync-excel', 
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2">
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
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {syncing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {syncing ? 'Syncing...' : 'Import Excel'}
          </button>
          <Button onClick={() => setShowModal(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStockUpdate={fetchProducts}
          />
        ))}
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
import React, { useState, useEffect, useCallback } from 'react';
import { customersAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { Plus, User, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import CustomerCard from '../components/CustomerCard';
import CustomerForm from '../components/forms/CustomerForm';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customersAPI.getAll({ search: debouncedSearch });
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Fetch customers error:', error);
      setCustomers([]);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch]);

  const handleSubmit = useCallback(async (formData) => {
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer._id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customersAPI.create(formData);
        toast.success('Customer created successfully');
      }
      setShowModal(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  }, [editingCustomer]);

  const handleEdit = useCallback((customer) => {
    setEditingCustomer(customer);
    setShowModal(true);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500" style={{ borderColor: 'var(--border-light)', borderTopColor: 'var(--accent-primary)' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">Customers</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage your customer database</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="card-premium">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {customers.map((customer) => (
          <CustomerCard
            key={customer._id}
            customer={customer}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* Empty State */}
      {customers.length === 0 && (
        <div className="card-premium p-12 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-100 dark:bg-gray-800">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No customers found</h3>
          <p className="mb-6 text-gray-600 dark:text-gray-400">Get started by adding your first customer</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center px-4 py-2 rounded-lg font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </button>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingCustomer(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default Customers;
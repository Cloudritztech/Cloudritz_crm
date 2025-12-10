import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, DollarSign, Users, Package, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    price: 0,
    billingCycle: 'monthly',
    trialDays: 0,
    limits: {
      maxUsers: 1,
      maxProducts: 100,
      maxInvoices: 50,
      maxCustomers: 100,
      maxStorage: 1024
    },
    features: {
      whatsappIntegration: false,
      aiInsights: false,
      multiCurrency: false,
      advancedReports: false,
      apiAccess: false,
      customBranding: false,
      prioritySupport: false,
      multiLocation: false
    },
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data } = await api.get('/admin?action=subscription-plans');
      setPlans(data.plans || []);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/admin?action=update-plan&id=${editingPlan._id}`, formData);
        toast.success('Plan updated successfully');
      } else {
        await api.post('/admin?action=create-plan', formData);
        toast.success('Plan created successfully');
      }
      setShowModal(false);
      setEditingPlan(null);
      resetForm();
      loadPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData(plan);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await api.delete(`/admin?action=delete-plan&id=${id}`);
      toast.success('Plan deleted successfully');
      loadPlans();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      price: 0,
      billingCycle: 'monthly',
      trialDays: 0,
      limits: {
        maxUsers: 1,
        maxProducts: 100,
        maxInvoices: 50,
        maxCustomers: 100,
        maxStorage: 1024
      },
      features: {
        whatsappIntegration: false,
        aiInsights: false,
        multiCurrency: false,
        advancedReports: false,
        apiAccess: false,
        customBranding: false,
        prioritySupport: false,
        multiLocation: false
      },
      isActive: true,
      sortOrder: 0
    });
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600">Manage subscription plans and pricing</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan._id} className="bg-white rounded-lg shadow-lg p-6 relative">
            {!plan.isActive && (
              <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                Inactive
              </div>
            )}
            <h3 className="text-2xl font-bold mb-2">{plan.displayName}</h3>
            <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">₹{plan.price}</span>
              <span className="text-gray-600">/{plan.billingCycle}</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <Users className="w-4 h-4 mr-2 text-blue-600" />
                {plan.limits.maxUsers} Users
              </div>
              <div className="flex items-center text-sm">
                <Package className="w-4 h-4 mr-2 text-blue-600" />
                {plan.limits.maxProducts} Products
              </div>
              <div className="flex items-center text-sm">
                <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                {plan.limits.maxInvoices} Invoices/month
              </div>
              {plan.features.whatsappIntegration && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  WhatsApp Integration
                </div>
              )}
              {plan.features.advancedReports && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Advanced Reports
                </div>
              )}
              {plan.features.customBranding && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Custom Branding
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(plan._id)}
                className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
              <button onClick={() => { setShowModal(false); setEditingPlan(null); }} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name (ID)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="basic, professional, enterprise"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Basic Plan"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Perfect for small businesses"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Billing Cycle</label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trial Days</label>
                  <input
                    type="number"
                    value={formData.trialDays}
                    onChange={(e) => setFormData({ ...formData, trialDays: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Max Users</label>
                    <input
                      type="number"
                      value={formData.limits.maxUsers}
                      onChange={(e) => setFormData({ ...formData, limits: { ...formData.limits, maxUsers: Number(e.target.value) } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Max Products</label>
                    <input
                      type="number"
                      value={formData.limits.maxProducts}
                      onChange={(e) => setFormData({ ...formData, limits: { ...formData.limits, maxProducts: Number(e.target.value) } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Max Invoices/month</label>
                    <input
                      type="number"
                      value={formData.limits.maxInvoices}
                      onChange={(e) => setFormData({ ...formData, limits: { ...formData.limits, maxInvoices: Number(e.target.value) } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Max Customers</label>
                    <input
                      type="number"
                      value={formData.limits.maxCustomers}
                      onChange={(e) => setFormData({ ...formData, limits: { ...formData.limits, maxCustomers: Number(e.target.value) } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(formData.features).map((feature) => (
                    <label key={feature} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.features[feature]}
                        onChange={(e) => setFormData({ ...formData, features: { ...formData.features, [feature]: e.target.checked } })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingPlan(null); }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

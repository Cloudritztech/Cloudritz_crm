import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const EditInvoice = () => {
  const API_URL = "http://localhost:5000";
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer: "",
    items: [],
    tax: 0,
    discount: 0,
    paymentMethod: "cash",
    notes: "",
    shippingAddress: {},
    dueDate: "",
    terms: "Payment due within 30 days"
  });

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const invoice = response.data.invoice;
      setFormData({
        customer: invoice.customer._id,
        items: invoice.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
          name: item.product.name
        })),
        tax: invoice.tax,
        discount: invoice.discount,
        paymentMethod: invoice.paymentMethod,
        notes: invoice.notes || "",
        shippingAddress: invoice.shippingAddress || {},
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
        terms: invoice.terms || "Payment due within 30 days"
      });
    } catch (err) {
      console.error("Error fetching invoice:", err);
      alert("Failed to load invoice");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/invoices/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("Invoice updated successfully!");
      navigate(`/invoices/view/${id}`);
    } catch (err) {
      console.error('Invoice update error:', err);
      alert(`Failed to update invoice: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    return subtotal + formData.tax - formData.discount;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Invoice</h2>
        <button
          onClick={() => navigate(`/invoices/view/${id}`)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Items Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">Items</h3>
          {formData.items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <input
                    type="text"
                    value={item.name}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-medium">
                    ₹{(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Section */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax (₹)</label>
              <input
                type="number"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount (₹)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 font-bold text-green-700 text-xl">
                ₹{calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Additional notes..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Invoice"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/invoices/view/${id}`)}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditInvoice;
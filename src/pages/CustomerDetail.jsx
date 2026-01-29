import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, DollarSign, FileText, CreditCard, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { customersAPI, invoicesAPI } from '../services/api';
import toast from 'react-hot-toast';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [customerRes, invoicesRes] = await Promise.all([
        customersAPI.getById(id),
        invoicesAPI.getAll({ customer: id })
      ]);

      setCustomer(customerRes.data.customer);
      const invoiceList = invoicesRes.data.invoices || [];
      setInvoices(invoiceList);
      
      const paymentHistory = invoiceList
        .filter(inv => inv.paidAmount > 0)
        .map(inv => ({
          _id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          amount: inv.paidAmount,
          paymentDate: inv.paymentDate || inv.updatedAt,
          paymentMethod: inv.paymentMethod,
          notes: inv.paymentNotes,
          status: inv.paymentStatus
        }))
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
      
      setPayments(paymentHistory);
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = (invoice) => {
    setSelectedInvoice(invoice);
    const pendingAmount = invoice.pendingAmount || invoice.grandTotal || 0;
    setPaymentForm({
      ...paymentForm,
      amount: pendingAmount.toFixed(2)
    });
    setShowPaymentModal(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      const paymentAmount = parseFloat(paymentForm.amount);
      
      await invoicesAPI.updatePayment(selectedInvoice._id, {
        amount: paymentAmount,
        method: paymentForm.paymentMethod,
        reference: paymentForm.transactionId,
        notes: paymentForm.notes
      });

      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        transactionId: '',
        notes: ''
      });
      fetchCustomerData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const markAsPaid = async (invoice) => {
    if (!window.confirm(`Mark invoice ${invoice.invoiceNumber} as fully paid?`)) return;
    
    try {
      const pendingAmount = invoice.pendingAmount || invoice.grandTotal;
      await invoicesAPI.updatePayment(invoice._id, {
        amount: pendingAmount,
        method: 'cash',
        notes: 'Marked as paid'
      });

      toast.success('Invoice marked as paid');
      fetchCustomerData();
    } catch (error) {
      toast.error('Failed to mark as paid');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.pending;
  };

  const totalPending = invoices.reduce((sum, inv) => sum + (inv.pendingAmount || inv.grandTotal || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return <div className="text-center py-12">Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/customers')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">Customer Details & Payment History</p>
          </div>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">₹{totalPaid.toFixed(2)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-red-600">₹{totalPending.toFixed(2)}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Customer Contact Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
          </div>
          {customer.email && (
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            </div>
          )}
          {customer.address?.street && (
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{customer.address.street}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/invoices/view/${invoice._id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {invoice.invoiceNumber}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">₹{(invoice.grandTotal || invoice.total || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-green-600 font-medium">
                    ₹{(invoice.paidAmount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-red-600 font-medium">
                    ₹{(invoice.pendingAmount || invoice.grandTotal || invoice.total || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(invoice.paymentStatus || 'pending')}`}>
                      {(invoice.paymentStatus || 'pending').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(invoice.paymentStatus !== 'paid') && (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleAddPayment(invoice)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Add Payment
                        </button>
                        <button
                          onClick={() => markAsPaid(invoice)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          Mark Paid
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.length > 0 ? payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">
                    {payment.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-green-600">
                    ₹{(payment.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs uppercase">
                      {payment.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {payment.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{payment.notes || '-'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No payment history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
            <form onSubmit={submitPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Invoice</label>
                <input
                  type="text"
                  value={selectedInvoice?.invoiceNumber}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  max={selectedInvoice?.pendingAmount}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pending: ₹{(selectedInvoice?.pendingAmount || selectedInvoice?.grandTotal || selectedInvoice?.total || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method *</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transaction ID</label>
                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                  placeholder="Optional"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
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
};

export default CustomerDetail;

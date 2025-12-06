import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

const PaymentStatusModal = ({ isOpen, onClose, invoice, onUpdate }) => {
  const [paymentStatus, setPaymentStatus] = useState(invoice?.paymentStatus || 'pending');
  const [paidAmount, setPaidAmount] = useState(invoice?.paidAmount || 0);
  const [paymentNotes, setPaymentNotes] = useState(invoice?.paymentNotes || '');
  const [loading, setLoading] = useState(false);

  const totalAmount = invoice?.grandTotal || invoice?.total || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onUpdate(invoice._id, {
        paymentStatus,
        paidAmount: paymentStatus === 'paid' ? totalAmount : parseFloat(paidAmount),
        paymentNotes
      });
      onClose();
    } catch (error) {
      alert('Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Update Payment Status</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Invoice Total</span>
              <span className="text-2xl font-bold text-blue-600">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial Payment</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {paymentStatus === 'partial' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Paid Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  max={totalAmount}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pending: ₹{(totalAmount - parseFloat(paidAmount || 0)).toFixed(2)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Payment reference, transaction ID, etc."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Updating...' : 'Update Payment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentStatusModal;

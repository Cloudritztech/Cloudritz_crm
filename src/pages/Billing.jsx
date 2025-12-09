import { useState, useEffect } from 'react';
import { CreditCard, Calendar, CheckCircle, AlertCircle, Download } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, subRes, invoicesRes] = await Promise.all([
        api.get('/billing?action=plans'),
        api.get('/billing?action=current'),
        api.get('/billing?action=invoices')
      ]);
      setPlans(plansRes.data.plans);
      setCurrentSubscription(subRes.data.subscription);
      setInvoices(invoicesRes.data.invoices);
    } catch (error) {
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    setProcessing(true);
    try {
      const { data } = await api.post('/billing?action=create-order', { planId });
      
      if (data.testMode) {
        // Test mode - simulate payment
        await api.post('/billing?action=verify-payment', {
          orderId: data.order.id,
          paymentId: 'test_payment_' + Date.now(),
          signature: 'test_signature',
          planId
        });
        toast.success('Plan upgraded successfully!');
        loadData();
      } else {
        // Razorpay integration
        const options = {
          key: data.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          order_id: data.order.id,
          name: 'Cloudritz CRM',
          description: 'Subscription Payment',
          handler: async (response) => {
            try {
              await api.post('/billing?action=verify-payment', {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId
              });
              toast.success('Payment successful!');
              loadData();
            } catch (error) {
              toast.error('Payment verification failed');
            }
          },
          theme: { color: '#2563eb' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    setProcessing(true);
    try {
      const { data } = await api.post('/billing?action=create-order', { invoiceId });
      
      if (data.testMode) {
        await api.post('/billing?action=verify-payment', {
          orderId: data.order.id,
          paymentId: 'test_payment_' + Date.now(),
          signature: 'test_signature',
          invoiceId
        });
        toast.success('Invoice paid successfully!');
        loadData();
      } else {
        const options = {
          key: data.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          order_id: data.order.id,
          name: 'Cloudritz CRM',
          description: 'Invoice Payment',
          handler: async (response) => {
            try {
              await api.post('/billing?action=verify-payment', {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                invoiceId
              });
              toast.success('Payment successful!');
              loadData();
            } catch (error) {
              toast.error('Payment verification failed');
            }
          },
          theme: { color: '#2563eb' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const daysLeft = currentSubscription?.endDate 
    ? Math.ceil((new Date(currentSubscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Billing & Subscription</h1>

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold capitalize">{currentSubscription?.plan}</p>
            <p className="text-gray-600">
              {currentSubscription?.status === 'active' ? (
                <span className="text-green-600">Active - {daysLeft} days left</span>
              ) : (
                <span className="text-red-600">Expired</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Renews on</p>
            <p className="font-semibold">{new Date(currentSubscription?.endDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan._id} className={`bg-white rounded-lg shadow p-6 ${plan.name === currentSubscription?.plan ? 'ring-2 ring-blue-500' : ''}`}>
              <h3 className="text-xl font-bold mb-2">{plan.displayName}</h3>
              <p className="text-3xl font-bold mb-4">₹{plan.price}<span className="text-sm text-gray-600">/{plan.billingCycle}</span></p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {plan.limits.maxUsers} Users
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {plan.limits.maxProducts} Products
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {plan.limits.maxInvoices} Invoices/month
                </li>
                {plan.features.whatsappIntegration && (
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    WhatsApp Integration
                  </li>
                )}
                {plan.features.advancedReports && (
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Advanced Reports
                  </li>
                )}
              </ul>
              {plan.name !== currentSubscription?.plan && (
                <button
                  onClick={() => handleUpgrade(plan._id)}
                  disabled={processing}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Upgrade'}
                </button>
              )}
              {plan.name === currentSubscription?.plan && (
                <div className="text-center text-blue-600 font-semibold">Current Plan</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Billing History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map(invoice => (
                <tr key={invoice._id}>
                  <td className="px-6 py-4 text-sm">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 text-sm">{invoice.plan}</td>
                  <td className="px-6 py-4 text-sm font-semibold">₹{invoice.amount}</td>
                  <td className="px-6 py-4 text-sm">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    {invoice.status === 'paid' && <span className="text-green-600 font-semibold">Paid</span>}
                    {invoice.status === 'pending' && <span className="text-yellow-600 font-semibold">Pending</span>}
                    {invoice.status === 'failed' && <span className="text-red-600 font-semibold">Failed</span>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {invoice.status === 'pending' && (
                      <button
                        onClick={() => handlePayInvoice(invoice._id)}
                        disabled={processing}
                        className="text-blue-600 hover:underline disabled:opacity-50"
                      >
                        Pay Now
                      </button>
                    )}
                    {invoice.status === 'paid' && (
                      <button className="text-gray-600 hover:underline">
                        <Download className="w-4 h-4 inline" /> Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

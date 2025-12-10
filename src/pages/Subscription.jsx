import { useState, useEffect } from 'react';
import { CreditCard, Calendar, CheckCircle, AlertCircle, Download, Zap, TrendingUp, Shield, Star } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Subscription() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, subRes, invoicesRes] = await Promise.all([
        api.get('/subscriptions?action=plans'),
        api.get('/subscriptions?action=current'),
        api.get('/subscriptions?action=invoices')
      ]);
      setPlans(plansRes.data.plans || []);
      setCurrentSubscription(subRes.data.subscription);
      setInvoices(invoicesRes.data.invoices || []);
    } catch (error) {
      console.error('Load subscription data error:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    setProcessing(true);
    try {
      const { data } = await api.post('/subscriptions?action=create-order', { planId });
      
      if (data.testMode) {
        // Test mode - simulate payment
        await api.post('/subscriptions?action=verify-payment', {
          orderId: data.order.id,
          paymentId: 'test_payment_' + Date.now(),
          signature: 'test_signature',
          planId
        });
        toast.success('Subscription activated successfully!');
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
          image: '/logo.png',
          handler: async (response) => {
            try {
              await api.post('/subscriptions?action=verify-payment', {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId
              });
              toast.success('Payment successful! Subscription activated.');
              loadData();
            } catch (error) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: '',
            email: '',
            contact: ''
          },
          theme: { 
            color: '#2563eb'
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
            }
          }
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
      const { data } = await api.post('/subscriptions?action=create-order', { invoiceId });
      
      if (data.testMode) {
        await api.post('/subscriptions?action=verify-payment', {
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
              await api.post('/subscriptions?action=verify-payment', {
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
          theme: { color: '#2563eb' },
          modal: {
            ondismiss: () => {
              setProcessing(false);
            }
          }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const daysLeft = currentSubscription?.endDate 
    ? Math.ceil((new Date(currentSubscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;
  const isExpired = daysLeft <= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600">Manage your subscription plan and billing</p>
      </div>

      {/* Current Subscription Card */}
      <div className={`bg-gradient-to-br ${isExpired ? 'from-red-500 to-red-600' : isExpiringSoon ? 'from-yellow-500 to-orange-500' : 'from-blue-500 to-blue-600'} rounded-lg shadow-lg p-6 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm mb-1">Current Plan</p>
            <h2 className="text-3xl font-bold capitalize">{currentSubscription?.plan || 'No Plan'}</h2>
          </div>
          <div className="p-3 bg-white/20 rounded-lg">
            <Star className="w-8 h-8" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-blue-100 text-sm">Status</p>
            <p className="font-semibold capitalize">{currentSubscription?.status || 'Inactive'}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Days Remaining</p>
            <p className="font-semibold">{daysLeft > 0 ? daysLeft : 0} days</p>
          </div>
        </div>

        {currentSubscription?.endDate && (
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <div>
              <p className="text-blue-100 text-sm">Renewal Date</p>
              <p className="font-semibold">{new Date(currentSubscription.endDate).toLocaleDateString()}</p>
            </div>
            {isExpiringSoon && (
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Expiring Soon</span>
              </div>
            )}
            {isExpired && (
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Expired</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const isCurrent = plan.name === currentSubscription?.plan;
            const isRecommended = plan.name === 'professional';
            
            return (
              <div 
                key={plan._id} 
                className={`bg-white rounded-lg shadow-lg overflow-hidden ${isCurrent ? 'ring-2 ring-blue-500' : ''} ${isRecommended ? 'transform scale-105' : ''}`}
              >
                {isRecommended && (
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-2 text-sm font-semibold">
                    RECOMMENDED
                  </div>
                )}
                {isCurrent && (
                  <div className="bg-green-500 text-white text-center py-2 text-sm font-semibold">
                    CURRENT PLAN
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.displayName}</h3>
                  <p className="text-gray-600 text-sm mb-4 h-12">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-600">/{plan.billingCycle}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{plan.limits.maxUsers} {plan.limits.maxUsers === 1 ? 'User' : 'Users'}</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{plan.limits.maxProducts} Products</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{plan.limits.maxInvoices} Invoices/month</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{plan.limits.maxCustomers} Customers</span>
                    </li>
                    {plan.features.whatsappIntegration && (
                      <li className="flex items-center text-sm text-blue-600 font-medium">
                        <Zap className="w-5 h-5 mr-2 flex-shrink-0" />
                        WhatsApp Integration
                      </li>
                    )}
                    {plan.features.advancedReports && (
                      <li className="flex items-center text-sm text-blue-600 font-medium">
                        <TrendingUp className="w-5 h-5 mr-2 flex-shrink-0" />
                        Advanced Reports
                      </li>
                    )}
                    {plan.features.customBranding && (
                      <li className="flex items-center text-sm text-blue-600 font-medium">
                        <Shield className="w-5 h-5 mr-2 flex-shrink-0" />
                        Custom Branding
                      </li>
                    )}
                    {plan.features.prioritySupport && (
                      <li className="flex items-center text-sm text-blue-600 font-medium">
                        <Star className="w-5 h-5 mr-2 flex-shrink-0" />
                        Priority Support
                      </li>
                    )}
                  </ul>

                  {!isCurrent ? (
                    <button
                      onClick={() => handleUpgrade(plan._id)}
                      disabled={processing}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
                    >
                      {processing ? 'Processing...' : 'Upgrade Now'}
                    </button>
                  ) : (
                    <div className="text-center py-3 bg-green-50 text-green-700 font-semibold rounded-lg">
                      Active Plan
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Billing History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No billing history yet
                  </td>
                </tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{invoice.plan}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ₹{invoice.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(invoice.billingPeriod?.startDate).toLocaleDateString()} - {new Date(invoice.billingPeriod?.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {invoice.status === 'paid' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Paid
                        </span>
                      )}
                      {invoice.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                      {invoice.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {invoice.status === 'pending' && (
                        <button
                          onClick={() => handlePayInvoice(invoice._id)}
                          disabled={processing}
                          className="text-blue-600 hover:underline disabled:opacity-50 font-medium"
                        >
                          Pay Now
                        </button>
                      )}
                      {invoice.status === 'paid' && (
                        <button 
                          onClick={() => window.open(`/api/subscriptions?action=download-invoice&id=${invoice._id}`, '_blank')}
                          className="text-gray-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

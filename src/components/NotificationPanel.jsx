import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, Info, CheckCircle, Sparkles } from 'lucide-react';
import { generateBusinessAlerts } from '../../lib/geminiAlerts';
import { reportsAPI } from '../services/api';

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getDashboard();
      const stats = response.data.stats;
      
      const aiAlerts = await generateBusinessAlerts({
        lowStockCount: stats.lowStockProducts || 0,
        pendingPayments: 0,
        todaySales: stats.todaySales?.total || 0,
        totalCustomers: stats.totalCustomers || 0,
        inventoryValue: stats.inventoryValue || 0
      });
      
      setAlerts(aiAlerts);
      setUnreadCount(aiAlerts.length);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium': return <Info className="h-5 w-5 text-yellow-500" />;
      default: return <CheckCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:absolute lg:inset-auto lg:right-0 lg:top-12 lg:w-96">
          <div className="absolute inset-0 bg-black bg-opacity-50 lg:hidden" onClick={() => setIsOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 lg:relative bg-white rounded-t-2xl lg:rounded-xl shadow-2xl max-h-[80vh] lg:max-h-[600px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">AI Alerts</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Analyzing business data...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500">All good! No alerts</p>
                </div>
              ) : (
                alerts.map((alert, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${getPriorityColor(alert.priority)}`}>
                    <div className="flex items-start space-x-3">
                      {getPriorityIcon(alert.priority)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                        {alert.action && (
                          <p className="text-xs text-gray-500 italic">💡 {alert.action}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={fetchAlerts}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Refreshing...' : 'Refresh Alerts'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationPanel;

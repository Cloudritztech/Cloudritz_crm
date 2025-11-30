import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, invoicesAPI } from '../services/api';
import { 
  DollarSign, 
  Users, 
  Package, 
  AlertTriangle,
  FileText,
  Wallet,
  TrendingUp,
  Calendar,
  Clock,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setError(null);
      console.log('📊 Fetching comprehensive dashboard data...');
      
      const [dashboardRes, salesRes] = await Promise.all([
        reportsAPI.getDashboard(),
        reportsAPI.getSalesAnalytics()
      ]);
      
      if (dashboardRes.data?.success && dashboardRes.data?.stats) {
        setStats(dashboardRes.data.stats);
      }
      
      if (salesRes.data?.success) {
        setSalesData(salesRes.data);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data after invoice creation (called from parent)
  window.refreshDashboard = fetchAllData;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="ml-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Dashboard Error</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchAllData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Sales",
      value: `₹${stats?.todaySales?.total?.toLocaleString() || 0}`,
      subtitle: `${stats?.todaySales?.count || 0} orders`,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: salesData?.todayVsYesterday
    },
    {
      title: 'Weekly Sales',
      value: `₹${stats?.weeklySales?.total?.toLocaleString() || 0}`,
      subtitle: `${stats?.weeklySales?.count || 0} orders`,
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      title: 'Monthly Sales',
      value: `₹${stats?.monthlySales?.total?.toLocaleString() || 0}`,
      subtitle: `${stats?.monthlySales?.count || 0} orders`,
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`,
      subtitle: 'All time',
      icon: Wallet,
      color: 'bg-orange-500'
    },
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      subtitle: 'Active customers',
      icon: Users,
      color: 'bg-indigo-500'
    },
    {
      title: 'Total Tiles Sold',
      value: stats?.totalTilesSold || 0,
      subtitle: 'All categories',
      icon: Package,
      color: 'bg-cyan-500'
    },
    {
      title: 'Pending Payments',
      value: `₹${stats?.pendingPayments?.toLocaleString() || 0}`,
      subtitle: `${stats?.pendingCount || 0} invoices`,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockProducts || 0,
      subtitle: 'Need restocking',
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-600">Anvi Tiles & Decorhub - Complete Business Overview</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button 
            onClick={fetchAllData}
            className="flex items-center px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-sm text-gray-500">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Last 10 Invoices</h3>
            <Link to="/invoices" className="text-primary-600 hover:text-primary-800 flex items-center text-sm">
              View All <ExternalLink className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats?.recentInvoices?.length > 0 ? (
              stats.recentInvoices.slice(0, 10).map((invoice) => (
                <div key={invoice._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{invoice.customer?.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(invoice.createdAt).toLocaleDateString()} • 
                      {new Date(invoice.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-gray-900">₹{invoice.total?.toLocaleString()}</p>
                    <Link 
                      to={`/invoices/view/${invoice._id}`}
                      className="text-xs text-primary-600 hover:text-primary-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No invoices found</p>
            )}
          </div>
        </div>

        {/* Top Selling Products & Quick Actions */}
        <div className="space-y-6">
          {/* Top Selling Products */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
            <div className="space-y-3">
              {stats?.topProducts?.length > 0 ? (
                stats.topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-primary-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{product.totalQuantity} sold</p>
                      <p className="text-xs text-gray-500">₹{product.totalRevenue?.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No sales data</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/invoices/add" className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-primary-50 hover:border-primary-200 transition-colors">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Create Invoice</p>
                    <p className="text-sm text-gray-500">Generate new bill</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/products" className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-primary-50 hover:border-primary-200 transition-colors">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Products</p>
                    <p className="text-sm text-gray-500">Add/Edit inventory</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/customers" className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-primary-50 hover:border-primary-200 transition-colors">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Customers</p>
                    <p className="text-sm text-gray-500">Add/Edit customers</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {stats?.lowStockItems?.length > 0 && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-red-800">Low Stock Alerts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.lowStockItems.map((item, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-red-200">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">{item.category?.replace('_', ' ')}</p>
                <p className="text-sm text-red-600 font-medium">
                  Stock: {item.stock} (Min: {item.minStock})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
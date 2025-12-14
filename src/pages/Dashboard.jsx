import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, productsAPI, customersAPI, invoicesAPI } from '../services/api';
import { 
  Users, 
  Package, 
  AlertTriangle,
  FileText,
  Clock,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ShoppingCart,
  DollarSign,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { StatCard } from '../components/ui/Card';
import { SkeletonStats, SkeletonCard } from '../components/ui/Loading';
import Button from '../components/ui/Button';
import SalesSummaryCard from '../components/SalesSummaryCard';

const Dashboard = () => {
  const [stats, setStats] = useState(() => {
    // Load from cache immediately
    const cached = localStorage.getItem('dashboard_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    // Fetch fresh data in background
    fetchAllData();
    
    // Prefetch common pages
    const prefetchTimer = setTimeout(() => {
      productsAPI.getAll().catch(() => {});
      customersAPI.getAll().catch(() => {});
      invoicesAPI.getAll().catch(() => {});
    }, 1000);
    
    // Listen for data changes
    const handleDataChange = () => {
      fetchAllData();
    };
    window.addEventListener('data-changed', handleDataChange);
    
    return () => {
      clearTimeout(prefetchTimer);
      window.removeEventListener('data-changed', handleDataChange);
    };
  }, []);

  const fetchAllData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      setError(null);
      const dashboardRes = await reportsAPI.getDashboard();
      if (dashboardRes.data?.success && dashboardRes.data?.stats) {
        const newStats = dashboardRes.data.stats;
        setStats(newStats);
        localStorage.setItem('dashboard_cache', JSON.stringify(newStats));
      }
      setLastUpdated(new Date());
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      if (isManualRefresh) {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  };

  window.refreshDashboard = fetchAllData;



  if (error) {
    return (
      <div className="card bg-red-50 border-red-200 animate-slide-up">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-red-100 rounded-xl">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Dashboard Error</h3>
            <p className="text-red-700 mb-4 break-words whitespace-normal">{error}</p>
            <Button 
              onClick={fetchAllData}
              variant="danger"
              size="sm"
              icon={RefreshCw}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Row 1: Main metrics
  const mainMetrics = [
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      subtitle: 'Active customers',
      icon: Users,
      color: 'primary'
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      subtitle: 'In inventory',
      icon: Package,
      color: 'info'
    },
    {
      title: 'Pending Payments',
      value: `₹${(stats?.pendingPayments || 0).toLocaleString('en-IN')}`,
      subtitle: `${stats?.pendingCount || 0} invoices`,
      icon: Clock,
      color: 'warning'
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockProducts || 0,
      subtitle: 'Need restocking',
      icon: AlertTriangle,
      color: 'danger'
    }
  ];

  // Row 1.5: Financial metrics
  const financialMetrics = [
    {
      title: 'Total Sales',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
      subtitle: `₹${(stats?.monthlyRevenue || 0).toLocaleString('en-IN')} this month`,
      icon: TrendingUp,
      color: 'success'
    },
    {
      title: 'Total Expenses',
      value: `₹${(stats?.totalExpenses || 0).toLocaleString('en-IN')}`,
      subtitle: `₹${(stats?.monthlyExpenses || 0).toLocaleString('en-IN')} this month`,
      icon: DollarSign,
      color: 'danger'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">CRM Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Anvi Tiles & Decorhub - Complete Business Overview</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          {lastUpdated && (
            <p className="text-xs sm:text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={() => fetchAllData(true)}
            disabled={refreshing}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Row 1: Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {mainMetrics.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            color={stat.color}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          />
        ))}
      </div>

      {/* Row 1.5: Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {financialMetrics.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            color={stat.color}
            className="animate-slide-up"
            style={{ animationDelay: `${(index + 4) * 0.1}s` }}
          />
        ))}
      </div>

      {/* Row 2: Sales Summary */}
      <SalesSummaryCard stats={stats} />

      {/* Row 3: Recent Invoices (Full Width) */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Recent Invoices</h3>
          <Link 
            to="/invoices" 
            className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            View All 
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="w-full overflow-x-auto">
          <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
            {stats?.recentInvoices?.length > 0 ? (
              stats.recentInvoices.slice(0, 10).map((invoice) => (
                <div 
                  key={invoice._id} 
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all cursor-pointer break-words"
                  onClick={() => window.open(`/invoices/view/${invoice._id}`, '_blank')}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <p className="font-semibold text-gray-900 truncate mb-1 sm:mb-0">
                        {invoice.invoiceNumber}
                      </p>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full self-start sm:self-auto ${
                        invoice.status === 'paid' ? 'badge-success' :
                        invoice.status === 'pending' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1 truncate">
                      {invoice.customer?.name}
                    </p>
                    <p className="text-xs text-gray-500 break-words">
                      {new Date(invoice.createdAt).toLocaleDateString('en-IN')} • 
                      {new Date(invoice.createdAt).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg text-gray-900">
                      ₹{(invoice.total || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No invoices found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Top Products + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-4">
            {stats?.topProducts?.length > 0 ? (
              stats.topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize truncate">
                      {product.category?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {product.totalQuantity} sold
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹{(product.totalRevenue || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No sales data</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link 
              to="/invoices/add" 
              className="flex items-center p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-blue-100 rounded-xl mr-4 group-hover:bg-blue-200 transition-colors">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Create Invoice</p>
                <p className="text-sm text-gray-500">Generate new bill</p>
              </div>
            </Link>
            
            <Link 
              to="/products" 
              className="flex items-center p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-cyan-100 rounded-xl mr-4 group-hover:bg-cyan-200 transition-colors">
                <Package className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Products</p>
                <p className="text-sm text-gray-500">Inventory control</p>
              </div>
            </Link>
            
            <Link 
              to="/customers" 
              className="flex items-center p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-green-100 rounded-xl mr-4 group-hover:bg-green-200 transition-colors">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Customers</p>
                <p className="text-sm text-gray-500">Customer database</p>
              </div>
            </Link>

            <Link 
              to="/sales-reports" 
              className="flex items-center p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-purple-100 rounded-xl mr-4 group-hover:bg-purple-200 transition-colors">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Sales Reports</p>
                <p className="text-sm text-gray-500">Detailed analytics</p>
              </div>
            </Link>

            <Link 
              to="/expenses" 
              className="flex items-center p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-red-100 rounded-xl mr-4 group-hover:bg-red-200 transition-colors">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Expenses</p>
                <p className="text-sm text-gray-500">Track spending</p>
              </div>
            </Link>

            <Link 
              to="/employees" 
              className="flex items-center p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-green-100 rounded-xl mr-4 group-hover:bg-green-200 transition-colors">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Employees</p>
                <p className="text-sm text-gray-500">Manage team</p>
              </div>
            </Link>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Dashboard;
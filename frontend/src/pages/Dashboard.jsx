import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { 
  DollarSign, 
  Users, 
  Package, 
  AlertTriangle,
  TrendingUp,
  FileText,
  Wallet
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await reportsAPI.getDashboard();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Sales",
      value: `₹${stats?.todaySales?.total?.toLocaleString() || 0}`,
      subtitle: `${stats?.todaySales?.count || 0} orders`,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Inventory Value',
      value: `₹${stats?.inventoryValue?.toLocaleString() || 0}`,
      subtitle: 'Total purchase value',
      icon: Wallet,
      color: 'bg-orange-500'
    },
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-purple-500'
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockProducts || 0,
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome to Anvi Tiles & Decorhub CRM
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats?.recentInvoices?.length > 0 ? (
              stats.recentInvoices.map((invoice) => (
                <div key={invoice._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">{invoice.customer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₹{invoice.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent invoices</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/products" className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-primary-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Add New Product</p>
                  <p className="text-sm text-gray-500">Add products to inventory</p>
                </div>
              </div>
            </Link>
            
            <Link to="/customers" className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-primary-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Add New Customer</p>
                  <p className="text-sm text-gray-500">Register new customer</p>
                </div>
              </div>
            </Link>
            
            <Link to="/invoices" className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-primary-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Create Invoice</p>
                  <p className="text-sm text-gray-500">Generate new bill</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
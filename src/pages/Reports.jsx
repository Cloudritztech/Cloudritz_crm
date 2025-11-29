import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const { isAdmin } = useAuth();
  const [salesData, setSalesData] = useState([]);
  const [profitData, setProfitData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      const [salesRes, profitRes, topProductsRes] = await Promise.all([
        reportsAPI.getSales({ ...dateRange, period: 'daily' }),
        reportsAPI.getProfit(dateRange),
        reportsAPI.getTopProducts({ limit: 10 })
      ]);
      
      setSalesData(salesRes.data.salesData);
      setProfitData(profitRes.data.profitData);
      setTopProducts(topProductsRes.data.topProducts);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Access denied. Admin only.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  const totalSales = salesData.reduce((sum, day) => sum + (day.totalSales || 0), 0);
  const totalInvoices = salesData.reduce((sum, day) => sum + (day.totalInvoices || 0), 0);
  const avgOrderValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="input-field"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{avgOrderValue.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(profitData?.totalProfit || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales</h3>
          <div className="space-y-3">
            {salesData.slice(-7).map((day, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{day._id}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">₹{(day.totalSales || 0).toLocaleString()}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((day.totalSales || 0) / Math.max(...salesData.map(d => d.totalSales || 0)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {topProducts.slice(0, 8).map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-primary-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{product.totalQuantity} sold</p>
                  <p className="text-xs text-gray-500">₹{product.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profit Analysis */}
      {profitData && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{profitData.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-red-600">₹{profitData.totalCost.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className="text-2xl font-bold text-blue-600">₹{profitData.totalProfit.toLocaleString()}</p>
              <p className="text-sm text-gray-500">
                {((profitData.totalProfit / profitData.totalRevenue) * 100).toFixed(1)}% margin
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
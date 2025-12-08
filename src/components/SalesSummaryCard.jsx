import React, { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import Button from './ui/Button';

const SalesSummaryCard = ({ stats }) => {
  const navigate = useNavigate();
  const [yearlyData, setYearlyData] = useState({ total: 0, count: 0 });
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  // Fetch yearly data on component mount
  useEffect(() => {
    fetchYearlyData();
  }, []);

  const fetchYearlyData = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getSalesReports({ period: 'thisYear' });
      if (response.data?.success && response.data?.data) {
        setYearlyData({
          total: response.data.data.totalAmount,
          count: response.data.data.totalOrders
        });
      }
    } catch (error) {
      console.error('Error fetching yearly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const salesMetrics = [
    {
      label: 'Today',
      amount: stats?.todaySales?.total || 0,
      orders: stats?.todaySales?.count || 0
    },
    {
      label: 'This Week',
      amount: stats?.weeklySales?.total || 0,
      orders: stats?.weeklySales?.count || 0
    },
    {
      label: 'This Month',
      amount: stats?.monthlySales?.total || 0,
      orders: stats?.monthlySales?.count || 0
    },
    {
      label: 'This Year',
      amount: yearlyData.total,
      orders: yearlyData.count
    }
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-xl">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sales Summary</h3>
            <p className="text-sm text-gray-600">Quick overview of your sales performance</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={ExternalLink}
          onClick={() => navigate('/sales-reports')}
        >
          View Reports
        </Button>
      </div>

      {/* Sales Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {salesMetrics.map((metric, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-600 mb-1">{metric.label}</p>
            <p className="text-lg font-bold text-gray-900 mb-1">{formatCurrency(metric.amount)}</p>
            <p className="text-xs text-gray-500">{metric.orders} orders</p>
          </div>
        ))}
      </div>


    </div>
  );
};

export default SalesSummaryCard;
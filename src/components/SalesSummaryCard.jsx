import React, { useState } from 'react';
import { TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import Input from './ui/Input';

const SalesSummaryCard = ({ stats }) => {
  const navigate = useNavigate();
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

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
      amount: stats?.yearlySales?.total || stats?.totalRevenue || 0,
      orders: stats?.yearlySales?.count || stats?.totalOrders || 0
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

      {/* Custom Range */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Custom Range</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            placeholder="Start Date"
            className="flex-1"
          />
          <Input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            placeholder="End Date"
            className="flex-1"
          />
          <Button
            variant="primary"
            size="sm"
            disabled={!customStartDate || !customEndDate}
            onClick={() => navigate(`/sales-reports?start=${customStartDate}&end=${customEndDate}`)}
          >
            View
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SalesSummaryCard;
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { TrendingUp, Calendar, ArrowLeft, Download, Filter } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { StatCard } from '../components/ui/Card';
import Loading from '../components/ui/Loading';

const SalesReports = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [customStartDate, setCustomStartDate] = useState(searchParams.get('start') || '');
  const [customEndDate, setCustomEndDate] = useState(searchParams.get('end') || '');
  const [salesData, setSalesData] = useState({ totalAmount: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(false);

  const quickFilters = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7days', label: 'Last 7 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'thisYear', label: 'This Year' },
    { key: 'custom', label: 'Custom Range' }
  ];

  useEffect(() => {
    if (customStartDate && customEndDate) {
      setSelectedPeriod('custom');
      handleDateRangeChange(new Date(customStartDate), new Date(customEndDate));
    } else {
      handlePeriodChange('today');
    }
  }, []);

  const getDateRange = (period) => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    switch (period) {
      case 'today':
        return { start: startOfDay, end: endOfDay };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { 
          start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
          end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
        };
      case 'last7days':
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        return { start: last7Days, end: endOfDay };
      case 'thisMonth':
        return { 
          start: new Date(today.getFullYear(), today.getMonth(), 1),
          end: endOfDay
        };
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        return { start: lastMonth, end: lastMonthEnd };
      case 'thisYear':
        return { 
          start: new Date(today.getFullYear(), 0, 1),
          end: endOfDay
        };
      default:
        return { start: startOfDay, end: endOfDay };
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      const range = getDateRange(period);
      handleDateRangeChange(range.start, range.end);
    }
  };

  const handleDateRangeChange = async (startDate, endDate) => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API when available
      const mockSalesData = {
        totalAmount: Math.floor(Math.random() * 100000) + 10000,
        totalOrders: Math.floor(Math.random() * 50) + 5
      };
      setSalesData(mockSalesData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59);
      handleDateRangeChange(start, end);
    }
  };

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
            <p className="text-gray-600">Detailed sales analytics and performance metrics</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" icon={Download}>
            Export
          </Button>
          <Button variant="outline" size="sm" icon={Filter}>
            Filter
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Period</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {quickFilters.map((filter) => (
            <Button
              key={filter.key}
              variant={selectedPeriod === filter.key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Custom Date Range */}
        {selectedPeriod === 'custom' && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                type="date"
                label="Start Date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="End Date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
              <div className="flex items-end">
                <Button
                  variant="primary"
                  onClick={handleCustomRangeApply}
                  disabled={!customStartDate || !customEndDate}
                  className="w-full"
                >
                  Apply Range
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sales Metrics */}
      {loading ? (
        <Loading text="Loading sales data..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={TrendingUp}
            title="Total Sales"
            value={formatCurrency(salesData.totalAmount)}
            subtitle={quickFilters.find(f => f.key === selectedPeriod)?.label || 'Selected Period'}
            color="success"
          />
          <StatCard
            icon={Calendar}
            title="Total Orders"
            value={salesData.totalOrders}
            subtitle={quickFilters.find(f => f.key === selectedPeriod)?.label || 'Selected Period'}
            color="primary"
          />
          <StatCard
            icon={TrendingUp}
            title="Average Order"
            value={formatCurrency(salesData.totalOrders > 0 ? salesData.totalAmount / salesData.totalOrders : 0)}
            subtitle="Per order value"
            color="info"
          />
          <StatCard
            icon={Calendar}
            title="Growth Rate"
            value="+12.5%"
            subtitle="vs previous period"
            color="success"
          />
        </div>
      )}

      {/* Additional Reports Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analytics</h3>
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Advanced analytics and charts coming soon</p>
          <Button variant="primary">Request Feature</Button>
        </div>
      </div>
    </div>
  );
};

export default SalesReports;
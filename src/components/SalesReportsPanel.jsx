import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, DollarSign, FileText, Filter } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import { StatCard } from './ui/Card';

const SalesReportsPanel = ({ salesData, onDateRangeChange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [singleDate, setSingleDate] = useState('');

  const quickFilters = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7days', label: 'Last 7 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'thisYear', label: 'This Year' },
    { key: 'custom', label: 'Custom Range' }
  ];

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

  useEffect(() => {
    if (selectedPeriod !== 'custom') {
      const range = getDateRange(selectedPeriod);
      onDateRangeChange?.(range.start, range.end, selectedPeriod);
    }
  }, [selectedPeriod]);

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59);
      onDateRangeChange?.(start, end, 'custom');
    }
  };

  const handleSingleDateApply = () => {
    if (singleDate) {
      const date = new Date(singleDate);
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      onDateRangeChange?.(start, end, 'single');
    }
  };

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Sales & Reports</h2>
            <p className="text-sm text-gray-600">Analyze your sales performance</p>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Quick Filters</label>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.key}
              variant={selectedPeriod === filter.key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(filter.key)}
              className="text-xs"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Date Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Single Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Single Date</label>
          <div className="flex space-x-2">
            <Input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSingleDateApply}
              disabled={!singleDate}
            >
              Apply
            </Button>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <Input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <div className="flex space-x-2">
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCustomRangeApply}
              disabled={!customStartDate || !customEndDate}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Sales Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={DollarSign}
          title="Total Sales"
          value={formatCurrency(salesData?.totalAmount)}
          subtitle={`${quickFilters.find(f => f.key === selectedPeriod)?.label || 'Selected Period'}`}
          color="success"
        />
        <StatCard
          icon={FileText}
          title="Total Orders"
          value={salesData?.totalOrders || 0}
          subtitle={`${quickFilters.find(f => f.key === selectedPeriod)?.label || 'Selected Period'}`}
          color="primary"
        />
      </div>
    </div>
  );
};

export default SalesReportsPanel;
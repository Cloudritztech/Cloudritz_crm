import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportsAPI, expensesAPI, invoicesAPI } from '../services/api';
import { TrendingUp, Calendar, ArrowLeft, Download, Filter, AlertTriangle, Sparkles, DollarSign } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { StatCard } from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import SalesChart from '../components/SalesChart';

const SalesReports = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [customStartDate, setCustomStartDate] = useState(searchParams.get('start') || '');
  const [customEndDate, setCustomEndDate] = useState(searchParams.get('end') || '');
  const [salesData, setSalesData] = useState({
    totalAmount: 0,
    totalOrders: 0,
    averageOrder: 0,
    growthRate: '0.0'
  });
  const [expenseData, setExpenseData] = useState({ total: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState(null);

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
      fetchSalesData('custom', customStartDate, customEndDate);
    } else {
      fetchSalesData('today');
    }
  }, []);

  const fetchSalesData = async (period, startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = { period };
      if (period === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      
      const [salesResponse, expensesResponse] = await Promise.all([
        reportsAPI.getSalesReports(params),
        expensesAPI.getAll(period === 'custom' ? { startDate, endDate } : {})
      ]);
      

      
      if (salesResponse.data?.success && salesResponse.data?.data) {
        setSalesData(salesResponse.data.data);
        generateAIInsights(salesResponse.data.data);
      }
      
      if (expensesResponse.data?.success) {
        const expenses = expensesResponse.data.expenses || [];
        const filtered = period === 'custom' && startDate && endDate
          ? expenses.filter(e => {
              const date = new Date(e.expenseDate);
              return date >= new Date(startDate) && date <= new Date(endDate);
            })
          : expenses;
        
        const total = filtered.reduce((sum, e) => sum + e.amount, 0);
        setExpenseData({ total, count: filtered.length });
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to fetch data');
      setSalesData({ totalAmount: 0, totalOrders: 0, averageOrder: 0, growthRate: '0.0' });
      setExpenseData({ total: 0, count: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      fetchSalesData(period);
    }
  };

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      fetchSalesData('custom', customStartDate, customEndDate);
    }
  };

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  const exportToExcel = async () => {
    try {
      toast.loading('Generating Excel report...');
      
      const params = {};
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      
      const [invoicesRes, expensesRes] = await Promise.all([
        invoicesAPI.getAll(params),
        expensesAPI.getAll(params)
      ]);
      
      const invoices = invoicesRes.data?.invoices || [];
      const expenses = expensesRes.data?.expenses || [];
      
      // Invoice data
      const invoiceData = invoices.map(inv => ({
        'Invoice No': inv.invoiceNumber,
        'Date': new Date(inv.createdAt).toLocaleDateString('en-IN'),
        'Customer Name': inv.customer?.name || 'N/A',
        'Amount': inv.total || inv.grandTotal,
        'Status': inv.status,
        'Payment Method': inv.paymentMethod
      }));
      
      // Expense data
      const expenseData = expenses.map(exp => ({
        'Date': new Date(exp.expenseDate).toLocaleDateString('en-IN'),
        'Title': exp.title,
        'Type': exp.type,
        'Amount': exp.amount,
        'Payment Method': exp.paymentMethod,
        'Employee': exp.employee?.name || 'N/A'
      }));
      
      // Summary
      const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || inv.grandTotal), 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const netProfit = totalSales - totalExpenses;
      
      const summary = [{
        'Metric': 'Total Sales',
        'Value': totalSales
      }, {
        'Metric': 'Total Expenses',
        'Value': totalExpenses
      }, {
        'Metric': 'Net Profit',
        'Value': netProfit
      }, {
        'Metric': 'Total Invoices',
        'Value': invoices.length
      }, {
        'Metric': 'Total Expense Entries',
        'Value': expenses.length
      }];
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summary);
      const wsInvoices = XLSX.utils.json_to_sheet(invoiceData);
      const wsExpenses = XLSX.utils.json_to_sheet(expenseData);
      
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices');
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');
      
      const fileName = `Sales_Report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.dismiss();
      toast.success('Excel report downloaded!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate report');
    }
  };

  const generateAIInsights = async (data) => {
    // AI insights disabled - function not available in gemini.js
    setAiInsights(null);
  };

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
        <Button variant="primary" size="sm" icon={Download} onClick={exportToExcel}>
          Export Excel
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Error Loading Sales Data</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

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
              disabled={loading}
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
                  disabled={!customStartDate || !customEndDate || loading}
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              icon={DollarSign}
              title="Total Expenses"
              value={formatCurrency(expenseData.total)}
              subtitle={`${expenseData.count} transactions`}
              color="danger"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard
              icon={TrendingUp}
              title="Average Order"
              value={formatCurrency(salesData.averageOrder)}
              subtitle="Per order value"
              color="info"
            />
            <StatCard
              icon={Calendar}
              title="Growth Rate"
              value={`${salesData.growthRate > 0 ? '+' : ''}${salesData.growthRate}%`}
              subtitle="vs previous period"
              color={salesData.growthRate >= 0 ? 'success' : 'danger'}
            />
          </div>
        </>
      )}

      {/* AI Insights */}
      {aiInsights && (
        <div className="card bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Key Insights</h4>
              <ul className="space-y-2">
                {aiInsights.insights.map((insight, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {aiInsights.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {loadingAI && (
        <div className="card">
          <Loading text="Generating AI insights..." />
        </div>
      )}

      {/* Sales Visualization - Pie Chart */}
      {!loading && (() => {
        const pieData = [
          { label: 'Total Sales', value: salesData.totalAmount || 0, color: '#10b981', orders: salesData.totalOrders },
          { label: 'Total Expenses', value: expenseData.total || 0, color: '#ef4444', count: expenseData.count }
        ].filter(item => item.value > 0);
        
        const total = pieData.reduce((sum, item) => sum + item.value, 0);
        
        if (total === 0) {
          return (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Financial Overview</h3>
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No data available for the selected period</p>
              </div>
            </div>
          );
        }
        
        let currentAngle = 0;
        
        return (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Financial Overview</h3>
            <div className="flex flex-col items-center">
              <svg width="300" height="300" viewBox="0 0 300 300" className="mx-auto">
                {pieData.map((item, index) => {
                  const percentage = (item.value / total) * 100;
                  const angle = (percentage / 100) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  currentAngle = endAngle;
                  
                  if (angle === 0) return null;
                  
                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);
                  
                  const x1 = 150 + 120 * Math.cos(startRad);
                  const y1 = 150 + 120 * Math.sin(startRad);
                  const x2 = 150 + 120 * Math.cos(endRad);
                  const y2 = 150 + 120 * Math.sin(endRad);
                  
                  const largeArc = angle > 180 ? 1 : 0;
                  const path = `M 150 150 L ${x1} ${y1} A 120 120 0 ${largeArc} 1 ${x2} ${y2} Z`;
                  
                  return (
                    <g key={index}>
                      <path
                        d={path}
                        fill={item.color}
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer transition-all duration-200"
                        style={{ opacity: hoveredSegment?.label === item.label ? 0.8 : 1 }}
                        onMouseEnter={() => setHoveredSegment(item)}
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                    </g>
                  );
                })}
                <circle cx="150" cy="150" r="60" fill="white" className="dark:fill-gray-900" />
                <text x="150" y="145" textAnchor="middle" className="text-sm font-semibold fill-gray-600 dark:fill-gray-400">Total</text>
                <text x="150" y="165" textAnchor="middle" className="text-lg font-bold fill-gray-900 dark:fill-gray-100">{formatCurrency(total)}</text>
              </svg>
              
              {hoveredSegment && (
                <div className="mt-6 w-full max-w-md">
                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl text-center border-2 transition-all" style={{ borderColor: hoveredSegment.color }}>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{hoveredSegment.label}</p>
                    <p className="text-3xl font-bold mb-2" style={{ color: hoveredSegment.color }}>
                      {formatCurrency(hoveredSegment.value)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {hoveredSegment.orders !== undefined ? `${hoveredSegment.orders} orders` : `${hoveredSegment.count} transactions`}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {((hoveredSegment.value / total) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              )}
              
              <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-md">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{item.label}</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatCurrency(item.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default SalesReports;
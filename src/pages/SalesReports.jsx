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
      
      const salesResponse = await reportsAPI.getSalesReports(params);
      
      if (salesResponse.data?.success && salesResponse.data?.data) {
        const data = salesResponse.data.data;
        setSalesData(data);
        setExpenseData(data.expenses || { total: 0, count: 0 });
        generateAIInsights(data);
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
      toast.loading('Generating detailed Excel report...');
      
      const params = { period: selectedPeriod };
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      
      const [invoicesRes, expensesRes] = await Promise.all([
        invoicesAPI.getAll(params),
        expensesAPI.getAll(params)
      ]);
      
      let invoices = invoicesRes.data?.invoices || [];
      let expenses = expensesRes.data?.expenses || [];
      
      // Filter by date range
      if (selectedPeriod !== 'custom') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let filterStart, filterEnd;
        
        switch (selectedPeriod) {
          case 'today':
            filterStart = today;
            filterEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'yesterday':
            filterStart = new Date(today);
            filterStart.setDate(filterStart.getDate() - 1);
            filterEnd = today;
            break;
          case 'last7days':
            filterStart = new Date(today);
            filterStart.setDate(filterStart.getDate() - 7);
            filterEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'thisMonth':
            filterStart = new Date(today.getFullYear(), today.getMonth(), 1);
            filterEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'lastMonth':
            filterStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            filterEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
            break;
          case 'thisYear':
            filterStart = new Date(today.getFullYear(), 0, 1);
            filterEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            break;
        }
        
        if (filterStart && filterEnd) {
          invoices = invoices.filter(inv => {
            const date = new Date(inv.createdAt);
            return date >= filterStart && date < filterEnd;
          });
          expenses = expenses.filter(exp => {
            const date = new Date(exp.expenseDate);
            return date >= filterStart && date < filterEnd;
          });
        }
      } else if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        
        invoices = invoices.filter(inv => {
          const date = new Date(inv.createdAt);
          return date >= start && date <= end;
        });
        expenses = expenses.filter(exp => {
          const date = new Date(exp.expenseDate);
          return date >= start && date <= end;
        });
      }
      
      // Report Header
      const periodLabel = quickFilters.find(f => f.key === selectedPeriod)?.label || 'Custom Range';
      const dateRange = selectedPeriod === 'custom' && customStartDate && customEndDate
        ? `${new Date(customStartDate).toLocaleDateString('en-IN')} to ${new Date(customEndDate).toLocaleDateString('en-IN')}`
        : new Date().toLocaleDateString('en-IN');
      
      const header = [{
        'SALES REPORT': `Period: ${periodLabel}`,
        '': `Date Range: ${dateRange}`,
        ' ': `Generated: ${new Date().toLocaleString('en-IN')}`
      }];
      
      // Detailed Invoice data
      const invoiceData = invoices.map((inv, idx) => ({
        'Sr.': idx + 1,
        'Invoice No': inv.invoiceNumber,
        'Date': new Date(inv.createdAt).toLocaleDateString('en-IN'),
        'Time': new Date(inv.createdAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}),
        'Customer Name': inv.customer?.name || 'N/A',
        'Customer Phone': inv.customer?.phone || 'N/A',
        'Subtotal': inv.subtotal || 0,
        'Discount': inv.discount || 0,
        'Tax (GST)': ((inv.totalCgst || 0) + (inv.totalSgst || 0)),
        'Total Amount': inv.grandTotal || inv.total || 0,
        'Payment Method': inv.paymentMethod?.toUpperCase() || 'CASH',
        'Payment Status': inv.paymentStatus?.toUpperCase() || inv.status?.toUpperCase() || 'PAID'
      }));
      
      // Detailed Expense data
      const expenseData = expenses.map((exp, idx) => ({
        'Sr.': idx + 1,
        'Date': new Date(exp.expenseDate).toLocaleDateString('en-IN'),
        'Time': new Date(exp.createdAt || exp.expenseDate).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}),
        'Title': exp.title,
        'Description': exp.description || '-',
        'Type': exp.type?.toUpperCase() || 'GENERAL',
        'Amount': exp.amount,
        'Payment Method': exp.paymentMethod?.toUpperCase() || 'CASH',
        'Employee': exp.employee?.name || 'N/A',
        'Notes': exp.notes || '-'
      }));
      
      // Summary calculations
      const totalSales = invoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
      const totalSubtotal = invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
      const totalDiscount = invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);
      const totalTax = invoices.reduce((sum, inv) => sum + ((inv.totalCgst || 0) + (inv.totalSgst || 0)), 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const netProfit = totalSales - totalExpenses;
      
      const summary = [
        { 'Metric': 'SALES SUMMARY', 'Value': '', 'Details': '' },
        { 'Metric': 'Total Invoices', 'Value': invoices.length, 'Details': 'Number of invoices' },
        { 'Metric': 'Gross Sales', 'Value': totalSubtotal, 'Details': 'Before discount & tax' },
        { 'Metric': 'Total Discount', 'Value': totalDiscount, 'Details': 'Discounts given' },
        { 'Metric': 'Total Tax (GST)', 'Value': totalTax, 'Details': 'CGST + SGST' },
        { 'Metric': 'Net Sales', 'Value': totalSales, 'Details': 'Final sales amount' },
        { 'Metric': '', 'Value': '', 'Details': '' },
        { 'Metric': 'EXPENSE SUMMARY', 'Value': '', 'Details': '' },
        { 'Metric': 'Total Expenses', 'Value': totalExpenses, 'Details': `${expenses.length} transactions` },
        { 'Metric': '', 'Value': '', 'Details': '' },
        { 'Metric': 'NET PROFIT', 'Value': netProfit, 'Details': 'Sales - Expenses' },
        { 'Metric': 'Profit Margin', 'Value': totalSales > 0 ? `${((netProfit / totalSales) * 100).toFixed(2)}%` : '0%', 'Details': 'Profit / Sales' }
      ];
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add sheets
      const wsHeader = XLSX.utils.json_to_sheet(header, { skipHeader: true });
      const wsSummary = XLSX.utils.json_to_sheet(summary);
      const wsInvoices = XLSX.utils.json_to_sheet(invoiceData);
      const wsExpenses = XLSX.utils.json_to_sheet(expenseData);
      
      // Set column widths
      wsInvoices['!cols'] = [{wch:5},{wch:15},{wch:12},{wch:8},{wch:20},{wch:15},{wch:12},{wch:10},{wch:12},{wch:15},{wch:15},{wch:15}];
      wsExpenses['!cols'] = [{wch:5},{wch:12},{wch:8},{wch:25},{wch:30},{wch:12},{wch:12},{wch:15},{wch:20},{wch:30}];
      wsSummary['!cols'] = [{wch:25},{wch:20},{wch:30}];
      
      XLSX.utils.book_append_sheet(wb, wsHeader, 'Report Info');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      XLSX.utils.book_append_sheet(wb, wsInvoices, 'Sales Details');
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expense Details');
      
      const fileName = `Sales_Report_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.dismiss();
      toast.success(`Detailed report exported! (${invoices.length} invoices, ${expenses.length} expenses)`);
    } catch (error) {
      console.error('Export error:', error);
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
          { label: 'Total Sales', value: salesData.totalAmount || 0, color: '#22c55e', orders: salesData.totalOrders },
          { label: 'Total Expenses', value: expenseData.total || 0, color: '#f97316', count: expenseData.count },
          { label: 'Net Profit', value: Math.max(0, (salesData.totalAmount || 0) - (expenseData.total || 0)), color: '#3b82f6', isProfit: true }
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
                <circle cx="150" cy="150" r="60" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                <text x="150" y="140" textAnchor="middle" fontSize="14" fontWeight="600" fill="#6b7280">Total</text>
                <text x="150" y="160" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">{formatCurrency(total)}</text>
                <text x="150" y="175" textAnchor="middle" fontSize="11" fill="#9ca3af">{salesData.totalOrders} orders</text>
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
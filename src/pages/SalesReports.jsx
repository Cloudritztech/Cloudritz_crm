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
import { analyzeBusinessData } from '../../lib/gemini';

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
      
      console.log('📊 Sales Response:', salesResponse.data);
      console.log('📊 Expenses Response:', expensesResponse.data);
      
      if (salesResponse.data?.success && salesResponse.data?.data) {
        setSalesData(salesResponse.data.data);
        generateAIInsights(salesResponse.data.data);
      }
      
      if (expensesResponse.data?.success) {
        const expenses = expensesResponse.data.expenses || [];
        console.log('📊 Total expenses from API:', expenses.length);
        console.log('📊 Period:', period, 'Start:', startDate, 'End:', endDate);
        
        const filtered = period === 'custom' && startDate && endDate
          ? expenses.filter(e => {
              const date = new Date(e.expenseDate);
              return date >= new Date(startDate) && date <= new Date(endDate);
            })
          : expenses;
        
        console.log('📊 Filtered expenses:', filtered.length);
        const total = filtered.reduce((sum, e) => sum + e.amount, 0);
        console.log('📊 Total expense amount:', total);
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
    setLoadingAI(true);
    try {
      const insights = await analyzeBusinessData({
        totalSales: data.totalAmount,
        totalCustomers: data.totalOrders,
        totalProducts: 0,
        topProduct: 'N/A',
        growth: data.growthRate
      });
      setAiInsights(insights);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setLoadingAI(false);
    }
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
              icon={DollarSign}
              title="Total Expenses"
              value={formatCurrency(expenseData.total)}
              subtitle={`${expenseData.count} transactions`}
              color="danger"
            />
            <StatCard
              icon={TrendingUp}
              title="Revenue"
              value={formatCurrency(salesData.totalAmount - expenseData.total)}
              subtitle="Sales - Expenses"
              color={salesData.totalAmount - expenseData.total >= 0 ? 'success' : 'danger'}
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
        const total = salesData.totalAmount + expenseData.total;
        const salesPercent = total > 0 ? (salesData.totalAmount / total) * 100 : 50;
        const expensePercent = total > 0 ? (expenseData.total / total) * 100 : 50;
        
        // Calculate pie chart segments
        const radius = 80;
        const circumference = 2 * Math.PI * radius;
        const salesDash = (salesPercent / 100) * circumference;
        const expenseDash = (expensePercent / 100) * circumference;
        
        return (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Overview</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <svg width="240" height="240" viewBox="0 0 240 240" className="transform -rotate-90">
                    {/* Background circle */}
                    <circle cx="120" cy="120" r="80" fill="#f3f4f6" />
                    
                    {/* Sales segment */}
                    <circle
                      cx="120"
                      cy="120"
                      r="80"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="60"
                      strokeDasharray={`${salesDash} ${circumference}`}
                      strokeDashoffset="0"
                      className="transition-all duration-700"
                    />
                    
                    {/* Expenses segment */}
                    <circle
                      cx="120"
                      cy="120"
                      r="80"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="60"
                      strokeDasharray={`${expenseDash} ${circumference}`}
                      strokeDashoffset={`-${salesDash}`}
                      className="transition-all duration-700"
                    />
                    
                    {/* Center white circle */}
                    <circle cx="120" cy="120" r="50" fill="white" />
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-2xl font-bold text-gray-900 bg-white px-2 rounded">{formatCurrency(total)}</div>
                    <div className="text-sm text-gray-500 bg-white px-2 rounded mt-1">Total</div>
                  </div>
                </div>
              </div>
              
              {/* Legend and Stats */}
              <div className="flex flex-col justify-center space-y-6">
                {/* Sales */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Total Sales</div>
                      <div className="text-xs text-gray-500">{salesData.totalOrders} orders</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(salesData.totalAmount)}</div>
                    <div className="text-xs text-gray-500">{salesPercent.toFixed(1)}%</div>
                  </div>
                </div>
                
                {/* Expenses */}
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Total Expenses</div>
                      <div className="text-xs text-gray-500">{expenseData.count} transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{formatCurrency(expenseData.total)}</div>
                    <div className="text-xs text-gray-500">{expensePercent.toFixed(1)}%</div>
                  </div>
                </div>
                
                {/* Revenue */}
                <div className={`flex items-center justify-between p-4 rounded-lg border ${
                  salesData.totalAmount - expenseData.total >= 0
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      salesData.totalAmount - expenseData.total >= 0 ? 'bg-blue-500' : 'bg-orange-500'
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Revenue</div>
                      <div className="text-xs text-gray-500">Sales - Expenses</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      salesData.totalAmount - expenseData.total >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {formatCurrency(salesData.totalAmount - expenseData.total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {salesData.totalAmount > 0 ? ((Math.abs(salesData.totalAmount - expenseData.total) / salesData.totalAmount) * 100).toFixed(1) : 0}% margin
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default SalesReports;
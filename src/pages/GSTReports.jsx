import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { ArrowLeft, Download, FileText, Calendar } from 'lucide-react';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const GSTReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gstData, setGstData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchGSTData();
  }, [selectedMonth, selectedYear]);

  const fetchGSTData = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getGSTSummary({ 
        month: selectedMonth, 
        year: selectedYear 
      });
      if (response.data?.success) {
        setGstData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch GST data:', error);
      toast.error('Failed to load GST reports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const exportToExcel = () => {
    if (!gstData) return;

    const { gstSummary, financials, salesRegister, period } = gstData;

    // GST Summary Sheet
    const summaryData = [
      { 'Description': 'GST SUMMARY', 'Amount': '' },
      { 'Description': 'Period', 'Amount': period.month },
      { 'Description': '', 'Amount': '' },
      { 'Description': 'Total Sales (with GST)', 'Amount': gstSummary.totalSales },
      { 'Description': 'Taxable Sales', 'Amount': gstSummary.taxableSales },
      { 'Description': 'CGST Collected', 'Amount': gstSummary.cgst },
      { 'Description': 'SGST Collected', 'Amount': gstSummary.sgst },
      { 'Description': 'IGST Collected', 'Amount': gstSummary.igst },
      { 'Description': 'Total GST Collected', 'Amount': gstSummary.totalGST },
      { 'Description': 'Total Invoices', 'Amount': gstSummary.totalInvoices },
      { 'Description': '', 'Amount': '' },
      { 'Description': 'FINANCIAL SUMMARY', 'Amount': '' },
      { 'Description': 'Total Sales', 'Amount': financials.totalSales },
      { 'Description': 'Cost of Goods Sold (COGS)', 'Amount': financials.cogs },
      { 'Description': 'Gross Profit', 'Amount': financials.grossProfit },
      { 'Description': 'Operating Expenses', 'Amount': financials.expenses },
      { 'Description': 'Profit Before Tax', 'Amount': financials.profitBeforeTax },
      { 'Description': 'Profit After Tax', 'Amount': financials.profitAfterTax },
      { 'Description': 'Profit Margin (%)', 'Amount': financials.profitMargin }
    ];

    // Sales Register Sheet
    const registerData = salesRegister.map((inv, idx) => ({
      'Sr.': idx + 1,
      'Invoice No': inv.invoiceNumber,
      'Date': new Date(inv.date).toLocaleDateString('en-IN'),
      'Customer Name': inv.customerName,
      'GSTIN': inv.gstin,
      'Taxable Amount': inv.taxableAmount,
      'CGST': inv.cgst,
      'SGST': inv.sgst,
      'Total GST': inv.totalGST,
      'Invoice Total': inv.invoiceTotal
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsRegister = XLSX.utils.json_to_sheet(registerData);

    wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
    wsRegister['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'GST Summary');
    XLSX.utils.book_append_sheet(wb, wsRegister, 'Sales Register');

    const fileName = `GST_Report_${period.month.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('GST Report exported successfully!');
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return <Loading text="Loading GST reports..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/')}>
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">GST Reports</h1>
            <p className="text-gray-600">GST-compliant tax reports for India</p>
          </div>
        </div>
        <Button variant="primary" size="sm" icon={Download} onClick={exportToExcel} disabled={!gstData}>
          Export Excel
        </Button>
      </div>

      {/* Period Selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Period</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {gstData && (
        <>
          {/* GST Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              GST Summary - {gstData.period.month}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Taxable Sales</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(gstData.gstSummary.taxableSales)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">CGST Collected</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(gstData.gstSummary.cgst)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">SGST Collected</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(gstData.gstSummary.sgst)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total GST</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(gstData.gstSummary.totalGST)}</p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Total Sales</span>
                <span className="font-semibold text-green-600">{formatCurrency(gstData.financials.totalSales)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Cost of Goods Sold (COGS)</span>
                <span className="font-semibold text-orange-600">-{formatCurrency(gstData.financials.cogs)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Gross Profit</span>
                <span className="font-semibold text-blue-600">{formatCurrency(gstData.financials.grossProfit)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Operating Expenses</span>
                <span className="font-semibold text-red-600">-{formatCurrency(gstData.financials.expenses)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Profit Before Tax</span>
                <span className="font-semibold">{formatCurrency(gstData.financials.profitBeforeTax)}</span>
              </div>
              <div className="flex justify-between py-3 bg-gradient-to-r from-blue-50 to-green-50 px-4 rounded-lg">
                <span className="font-bold text-gray-900">Profit After Tax</span>
                <span className="font-bold text-xl text-green-600">{formatCurrency(gstData.financials.profitAfterTax)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Profit Margin</span>
                <span className="font-semibold text-blue-600">{gstData.financials.profitMargin}%</span>
              </div>
            </div>
          </div>

          {/* Sales Register */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sales Register ({gstData.gstSummary.totalInvoices} Invoices)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-2">Invoice No</th>
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Customer</th>
                    <th className="text-left py-3 px-2">GSTIN</th>
                    <th className="text-right py-3 px-2">Taxable</th>
                    <th className="text-right py-3 px-2">CGST</th>
                    <th className="text-right py-3 px-2">SGST</th>
                    <th className="text-right py-3 px-2">Total GST</th>
                    <th className="text-right py-3 px-2">Invoice Total</th>
                  </tr>
                </thead>
                <tbody>
                  {gstData.salesRegister.map((inv, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium">{inv.invoiceNumber}</td>
                      <td className="py-2 px-2">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                      <td className="py-2 px-2">{inv.customerName}</td>
                      <td className="py-2 px-2 text-xs">{inv.gstin}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(inv.taxableAmount)}</td>
                      <td className="py-2 px-2 text-right text-green-600">{formatCurrency(inv.cgst)}</td>
                      <td className="py-2 px-2 text-right text-green-600">{formatCurrency(inv.sgst)}</td>
                      <td className="py-2 px-2 text-right text-purple-600">{formatCurrency(inv.totalGST)}</td>
                      <td className="py-2 px-2 text-right font-semibold">{formatCurrency(inv.invoiceTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GSTReports;
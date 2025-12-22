import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { FileText } from 'lucide-react';
import Loading from './ui/Loading';

const GSTSummaryCard = ({ period = 'thisMonth' }) => {
  const [loading, setLoading] = useState(false);
  const [gstData, setGstData] = useState(null);

  useEffect(() => {
    fetchGSTData();
  }, [period]);

  const fetchGSTData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const response = await reportsAPI.getGSTSummary({ 
        month: now.getMonth() + 1, 
        year: now.getFullYear() 
      });
      if (response.data?.success) {
        setGstData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch GST data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="card">
        <Loading text="Loading GST summary..." />
      </div>
    );
  }

  if (!gstData) return null;

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-4">
        <FileText className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">GST Summary - {gstData.period.month}</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">Taxable Sales</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(gstData.gstSummary.taxableSales)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">CGST</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(gstData.gstSummary.cgst)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">SGST</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(gstData.gstSummary.sgst)}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total GST</p>
          <p className="text-lg font-bold text-purple-600">{formatCurrency(gstData.gstSummary.totalGST)}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Profit After Tax</span>
          <span className="text-xl font-bold text-green-600">{formatCurrency(gstData.financials.profitAfterTax)}</span>
        </div>
      </div>
    </div>
  );
};

export default GSTSummaryCard;
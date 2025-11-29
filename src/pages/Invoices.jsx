import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { invoicesAPI } from '../services/api';

const InvoiceManagement = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = async () => {
    try {
      console.log('Fetching invoices...');
      const res = await invoicesAPI.getAll();
      console.log('Full API response:', res);
      console.log('Response data:', res.data);
      
      if (res.data?.success && res.data?.invoices) {
        console.log('Invoices found:', res.data.invoices.length);
        const sorted = res.data.invoices.sort((a, b) => {
          const aDate = new Date(a.createdAt || parseInt(a._id.substring(0, 8), 16) * 1000);
          const bDate = new Date(b.createdAt || parseInt(b._id.substring(0, 8), 16) * 1000);
          return bDate - aDate;
        });
        setInvoices(sorted);
        setError(null);
      } else {
        console.log('No invoices in response or success=false');
        setInvoices([]);
        setError(res.data?.message || "No invoices found");
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      console.error("Error response:", err.response);
      setError(err.response?.data?.message || err.message || "Failed to load invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice? This will restore product stock.")) {
      try {
        // Note: Delete endpoint not implemented in API yet
        alert("Delete functionality not implemented yet");
      } catch (err) {
        console.error('Delete error:', err);
        alert(`Failed to delete invoice: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const filtered = invoices.filter(
    (inv) =>
      inv.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Invoice Management
        </h2>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/health');
                const data = await response.json();
                console.log('Health check:', data);
                alert(`API Status: ${data.success ? 'Working' : 'Failed'}`);
              } catch (err) {
                console.error('Health check failed:', err);
                alert('API Health Check Failed');
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Test API
          </button>
          <button
            onClick={() => navigate("/invoices/add")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + New Invoice
          </button>
        </div>
      </div>

      <div className="mb-6 bg-blue-gray-200/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg shadow-md p-6 border border-white/20 dark:border-gray-700/50">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 pl-10 border border-white/20 dark:border-gray-700/50 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 text-red-700 bg-red-100 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-blue-gray-200/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg shadow-md border border-white/20 dark:border-gray-700/50">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            All Invoices
          </h3>
        </div>
        <div className="overflow-x-auto">
          {filtered.length > 0 ? (
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filtered.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white cursor-pointer" onClick={() => navigate(`/invoices/view/${inv._id}`)}>
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white cursor-pointer" onClick={() => navigate(`/invoices/view/${inv._id}`)}>
                      {inv.customer?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white cursor-pointer" onClick={() => navigate(`/invoices/view/${inv._id}`)}>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer" onClick={() => navigate(`/invoices/view/${inv._id}`)}>
                      ₹ {inv.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Link
                          to={`/invoices/view/${inv._id}`}
                          className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full hover:bg-green-200 dark:hover:bg-green-800"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(inv._id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No invoices found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;
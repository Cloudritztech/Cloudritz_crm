import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDebounce } from '../hooks/useDebounce';
import { invoicesAPI } from '../services/api';
import { ResponsiveTable, StatusBadge, TableActions } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loading from '../components/ui/Loading';
import { Search, Plus, Eye, Download, Trash2, Filter, AlertTriangle } from 'lucide-react';

const InvoiceManagement = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
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

  const filtered = useMemo(() => 
    invoices.filter(
      (inv) =>
        inv.customer?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        inv.invoiceNumber?.toLowerCase().includes(debouncedSearch.toLowerCase())
    ), [invoices, debouncedSearch]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="card">
          <Loading text="Loading invoices..." />
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (invoice) => (
        <div className="font-medium text-gray-900 truncate">
          {invoice.invoiceNumber}
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (invoice) => (
        <div>
          <div className="font-medium text-gray-900 truncate">
            {invoice.customer?.name || 'N/A'}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {invoice.customer?.phone}
          </div>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Date',
      render: (invoice) => (
        <div>
          <div className="text-sm text-gray-900 truncate">
            {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {new Date(invoice.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      ),
      hideOnMobile: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice) => (
        <StatusBadge status={invoice.status || 'paid'} />
      )
    },
    {
      key: 'total',
      header: 'Amount',
      render: (invoice) => (
        <div className="font-semibold text-gray-900 truncate">
          ₹{invoice.total?.toLocaleString('en-IN')}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (invoice, index) => (
        <TableActions
          actions={[
            {
              label: 'View Details',
              icon: Eye,
              onClick: () => navigate(`/invoices/view/${invoice._id}`)
            },
            {
              label: 'Download PDF',
              icon: Download,
              onClick: () => {
                // Add PDF download logic
                console.log('Download PDF for:', invoice._id);
              }
            },
            {
              label: 'Delete',
              icon: Trash2,
              variant: 'danger',
              onClick: () => handleDelete(invoice._id)
            }
          ]}
          row={invoice}
          index={index}
        />
      ),
      hideOnMobile: true
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words whitespace-normal">Invoice Management</h1>
          <p className="text-gray-600 mt-1 break-words whitespace-normal">
            Manage and track all your invoices
          </p>
        </div>
        <Button
          onClick={() => navigate("/invoices/add")}
          variant="primary"
          icon={Plus}
          className="w-full sm:w-auto"
        >
          New Invoice
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by invoice number or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            icon={Filter}
            className="sm:w-auto"
          >
            Filters
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800 break-words whitespace-normal">Error Loading Invoices</h3>
              <p className="text-red-700 break-words whitespace-normal">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <ResponsiveTable
        data={filtered}
        columns={columns}
        onRowClick={(invoice) => navigate(`/invoices/view/${invoice._id}`)}
        loading={loading}
        emptyMessage="No invoices found. Create your first invoice to get started."
      />
    </div>
  );
};

export default InvoiceManagement;
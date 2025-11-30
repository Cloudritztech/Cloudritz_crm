import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { invoicesAPI } from '../services/api';
import { ResponsiveTable, StatusBadge, TableActions } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loading from '../components/ui/Loading';
import { Search, Plus, Eye, Download, Trash2, Filter } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-secondary-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-secondary-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-secondary-200 rounded w-32"></div>
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
        <div className="font-medium text-secondary-900">
          {invoice.invoiceNumber}
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (invoice) => (
        <div>
          <div className="font-medium text-secondary-900">
            {invoice.customer?.name || 'N/A'}
          </div>
          <div className="text-sm text-secondary-500">
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
          <div className="text-sm text-secondary-900">
            {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
          </div>
          <div className="text-xs text-secondary-500">
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
        <div className="font-semibold text-secondary-900">
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
          <h1 className="text-3xl font-bold text-secondary-900">Invoice Management</h1>
          <p className="text-secondary-600 mt-1">
            Manage and track all your invoices
          </p>
        </div>
        <Button
          onClick={() => navigate("/invoices/add")}
          variant="primary"
          icon={Plus}
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
        <div className="card bg-danger-50 border-danger-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-danger-100 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-danger-600" />
            </div>
            <div>
              <h3 className="font-semibold text-danger-800">Error Loading Invoices</h3>
              <p className="text-danger-700">{error}</p>
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
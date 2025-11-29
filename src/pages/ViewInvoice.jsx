import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// Add print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #invoice-content, #invoice-content * {
      visibility: visible;
    }
    #invoice-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
  }
`;

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = "http://localhost:5000";
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoice(res.data.invoice);
    } catch (err) {
      console.error("Error fetching invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!invoice) return <div className="text-center py-8">Invoice not found</div>;

  return (
    <>
      <style>{printStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-6">
        <div className="flex justify-between items-center mb-6 no-print">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Details</h2>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/invoices/${id}/pdf`, {
                  headers: { Authorization: `Bearer ${token}` },
                  responseType: 'blob'
                });
                
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `invoice-${invoice.invoiceNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (err) {
                alert('Failed to download PDF');
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Download PDF
          </button>
          <button
            onClick={() => {
              const printContent = document.getElementById('invoice-content');
              const originalContent = document.body.innerHTML;
              document.body.innerHTML = printContent.innerHTML;
              window.print();
              document.body.innerHTML = originalContent;
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Print
          </button>
          <button
            onClick={() => navigate(`/invoices/edit/${id}`)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Edit
          </button>
          <button
            onClick={() => navigate("/invoices")}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      </div>

      <div id="invoice-content" className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto print:shadow-none print:rounded-none print:p-0 print:max-w-none">
        {/* Header */}
        <div className="border-2 border-black">
          <div className="bg-gray-100 p-4 text-center border-b-2 border-black">
            <h1 className="text-2xl font-bold">TAX INVOICE</h1>
            <div className="text-right text-sm mt-2">ORIGINAL FOR RECIPIENT</div>
          </div>

          {/* Company and Invoice Info */}
          <div className="grid grid-cols-2 border-b-2 border-black">
            <div className="p-4 border-r-2 border-black">
              <div className="flex items-center mb-2">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  AT
                </div>
                <div>
                  <h2 className="font-bold text-lg">ANVI TILES & DECORHUB</h2>
                  <p className="text-sm">GSTIN: 09FTIPS4577P1ZD</p>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <p>Shop No. 123, Tiles Market</p>
                <p>Main Road, City Center</p>
                <p>State: UTTAR PRADESH, 273001</p>
                <p>Mobile: +91 9876543210</p>
                <p>Email: info@anvitiles.com</p>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Invoice #:</strong></p>
                  <p>{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p><strong>Invoice Date:</strong></p>
                  <p>{new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p><strong>Place of Supply:</strong></p>
                  <p>Gorakhpur</p>
                </div>
                <div>
                  <p><strong>Due Date:</strong></p>
                  <p>{new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="p-4 border-b-2 border-black">
            <p className="font-bold mb-2">Customer Details:</p>
            <p className="text-sm">GSTIN: N/A</p>
            <p className="text-sm">Billing Address: {invoice.customer?.name}</p>
            <p className="text-sm">Phone: {invoice.customer?.phone}</p>
          </div>

          {/* Items Table */}
          <div className="border-b-2 border-black">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-r border-black p-2 text-left">S</th>
                  <th className="border-r border-black p-2 text-left">Item</th>
                  <th className="border-r border-black p-2 text-left">HSN/SAC</th>
                  <th className="border-r border-black p-2 text-left">Rate/Item</th>
                  <th className="border-r border-black p-2 text-left">Qty</th>
                  <th className="border-r border-black p-2 text-left">Taxable Value</th>
                  <th className="border-r border-black p-2 text-left">Tax Amount</th>
                  <th className="p-2 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-300">
                    <td className="border-r border-black p-2">{index + 1}</td>
                    <td className="border-r border-black p-2">{item.product?.name || 'Product'}</td>
                    <td className="border-r border-black p-2">Tiles</td>
                    <td className="border-r border-black p-2">₹{item.price}</td>
                    <td className="border-r border-black p-2">{item.quantity}</td>
                    <td className="border-r border-black p-2">₹{item.total}</td>
                    <td className="border-r border-black p-2">₹{(item.total * 0.18).toFixed(2)}</td>
                    <td className="p-2">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="p-4 border-b-2 border-black">
            <div className="flex justify-end">
              <div className="text-right space-y-1">
                <p><strong>Taxable Amount: ₹{invoice.subtotal}</strong></p>
                <p>CGST 9%: ₹{(invoice.subtotal * 0.09).toFixed(2)}</p>
                <p>SGST 9%: ₹{(invoice.subtotal * 0.09).toFixed(2)}</p>
                <p className="text-lg font-bold">Total: ₹{invoice.total}</p>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="p-4 border-b-2 border-black">
            <p className="text-sm">
              <strong>Total amount (in words):</strong> INR {invoice.total} Only
            </p>
          </div>

          {/* Footer */}
          <div className="grid grid-cols-2">
            <div className="p-4 border-r-2 border-black">
              <p className="font-bold mb-2">Bank Details:</p>
              <div className="text-sm space-y-1">
                <p>Bank: HDFC Bank</p>
                <p>Account #: 50200068337918</p>
                <p>IFSC Code: HDFC0004331</p>
                <p>Branch: Main Branch</p>
              </div>
            </div>
            
            <div className="p-4 text-right">
              <p className="mb-4"><strong>Amount Payable:</strong></p>
              <p className="mb-8">For ANVI TILES & DECORHUB</p>
              <p className="mt-16">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ViewInvoice;
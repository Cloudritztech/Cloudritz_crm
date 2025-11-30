import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invoicesAPI } from '../services/api';

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
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      console.log('🔍 Fetching invoice with ID:', id);
      
      if (!id) {
        console.error('❌ No invoice ID provided');
        setLoading(false);
        return;
      }
      
      const res = await invoicesAPI.getById(id);
      console.log('✅ Invoice API response:', res.data);
      
      if (res.data?.success && res.data?.invoice) {
        setInvoice(res.data.invoice);
      } else {
        console.error('❌ Invalid response structure:', res.data);
        setInvoice(null);
      }
    } catch (err) {
      console.error('❌ Error fetching invoice:', err);
      console.error('❌ Error details:', err.response?.data);
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!invoice) return <div className="text-center py-8">Invoice not found</div>;

  return (
    <>
      <style>{printStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-2 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 no-print space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words whitespace-normal">Invoice Details</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              try {
                const response = await invoicesAPI.generatePDF(id);
                
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

      <div id="invoice-content" className="bg-white rounded-lg shadow-lg p-2 sm:p-4 lg:p-8 w-full max-w-4xl mx-auto print:shadow-none print:rounded-none print:p-0 print:max-w-none" style={{overflowWrap: 'break-word'}}>
        {/* Header */}
        <div className="border border-black sm:border-2">
          <div className="bg-gray-100 p-2 sm:p-4 text-center border-b border-black sm:border-b-2">
            <h1 className="text-xl sm:text-2xl font-bold break-words whitespace-normal">TAX INVOICE</h1>
            <div className="text-right text-xs sm:text-sm mt-2 break-words whitespace-normal">ORIGINAL FOR RECIPIENT</div>
          </div>

          {/* Company and Invoice Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-black sm:border-b-2">
            <div className="p-2 sm:p-4 sm:border-r-2 border-black">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  AT
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-lg break-words whitespace-normal">ANVI TILES & DECORHUB</h2>
                  <p className="text-xs sm:text-sm break-words whitespace-normal">GSTIN: 09FTIPS4577P1ZD</p>
                </div>
              </div>
              <div className="text-xs sm:text-sm space-y-1">
                <p className="break-words whitespace-normal">Shop No. 123, Tiles Market</p>
                <p className="break-words whitespace-normal">Main Road, City Center</p>
                <p className="break-words whitespace-normal">State: UTTAR PRADESH, 273001</p>
                <p className="break-words whitespace-normal">Mobile: +91 9876543210</p>
                <p className="break-words whitespace-normal">Email: info@anvitiles.com</p>
              </div>
            </div>
            
            <div className="p-2 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="break-words whitespace-normal"><strong>Invoice #:</strong></p>
                  <p className="break-words whitespace-normal">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="break-words whitespace-normal"><strong>Invoice Date:</strong></p>
                  <p className="break-words whitespace-normal">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="break-words whitespace-normal"><strong>Place of Supply:</strong></p>
                  <p className="break-words whitespace-normal">Gorakhpur</p>
                </div>
                <div>
                  <p className="break-words whitespace-normal"><strong>Due Date:</strong></p>
                  <p className="break-words whitespace-normal">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="p-2 sm:p-4 border-b border-black sm:border-b-2">
            <p className="font-bold mb-2 break-words whitespace-normal">Customer Details:</p>
            <p className="text-xs sm:text-sm break-words whitespace-normal">GSTIN: N/A</p>
            <p className="text-xs sm:text-sm break-words whitespace-normal">Billing Address: {invoice.customer?.name}</p>
            <p className="text-xs sm:text-sm break-words whitespace-normal">Phone: {invoice.customer?.phone}</p>
          </div>

          {/* Items Table */}
          <div className="border-b border-black sm:border-b-2 w-full overflow-x-auto">
            <table className="w-full min-w-full text-xs sm:text-sm" style={{tableLayout: 'fixed', overflowWrap: 'break-word'}}>
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-r border-black p-1 sm:p-2 text-left w-8 sm:w-12">S</th>
                  <th className="border-r border-black p-1 sm:p-2 text-left">Item</th>
                  <th className="border-r border-black p-1 sm:p-2 text-left w-16 sm:w-20">HSN</th>
                  <th className="border-r border-black p-1 sm:p-2 text-left w-16 sm:w-24">Rate</th>
                  <th className="border-r border-black p-1 sm:p-2 text-left w-12 sm:w-16">Qty</th>
                  <th className="border-r border-black p-1 sm:p-2 text-left w-20 sm:w-28">Taxable</th>
                  <th className="border-r border-black p-1 sm:p-2 text-left w-16 sm:w-24">Tax</th>
                  <th className="p-1 sm:p-2 text-left w-20 sm:w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-300">
                    <td className="border-r border-black p-1 sm:p-2 text-center">{index + 1}</td>
                    <td className="border-r border-black p-1 sm:p-2" style={{overflowWrap: 'break-word', wordBreak: 'break-word'}}>{item.product?.name || 'Product'}</td>
                    <td className="border-r border-black p-1 sm:p-2 text-center">Tiles</td>
                    <td className="border-r border-black p-1 sm:p-2 text-right">₹{item.price}</td>
                    <td className="border-r border-black p-1 sm:p-2 text-center">{item.quantity}</td>
                    <td className="border-r border-black p-1 sm:p-2 text-right">₹{item.total}</td>
                    <td className="border-r border-black p-1 sm:p-2 text-right">₹{(item.total * 0.18).toFixed(2)}</td>
                    <td className="p-1 sm:p-2 text-right">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="p-2 sm:p-4 border-b border-black sm:border-b-2">
            <div className="flex flex-col sm:flex-row justify-between">
              <div className="text-right space-y-1">
                <p className="break-words whitespace-normal"><strong>Taxable Amount: ₹{invoice.subtotal}</strong></p>
                <p className="break-words whitespace-normal">CGST 9%: ₹{(invoice.subtotal * 0.09).toFixed(2)}</p>
                <p className="break-words whitespace-normal">SGST 9%: ₹{(invoice.subtotal * 0.09).toFixed(2)}</p>
                <p className="text-lg font-bold break-words whitespace-normal">Total: ₹{invoice.total}</p>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="p-2 sm:p-4 border-b border-black sm:border-b-2">
            <p className="text-xs sm:text-sm break-words whitespace-normal">
              <strong>Total amount (in words):</strong> INR {invoice.total} Only
            </p>
          </div>

          {/* Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="p-2 sm:p-4 sm:border-r-2 border-black">
              <p className="font-bold mb-2 break-words whitespace-normal">Bank Details:</p>
              <div className="text-xs sm:text-sm space-y-1">
                <p className="break-words whitespace-normal">Bank: HDFC Bank</p>
                <p className="break-words whitespace-normal">Account #: 50200068337918</p>
                <p className="break-words whitespace-normal">IFSC Code: HDFC0004331</p>
                <p className="break-words whitespace-normal">Branch: Main Branch</p>
              </div>
            </div>
            
            <div className="p-2 sm:p-4 text-right">
              <p className="mb-4 break-words whitespace-normal"><strong>Amount Payable:</strong></p>
              <p className="mb-8 break-words whitespace-normal">For ANVI TILES & DECORHUB</p>
              <p className="mt-16 break-words whitespace-normal">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ViewInvoice;
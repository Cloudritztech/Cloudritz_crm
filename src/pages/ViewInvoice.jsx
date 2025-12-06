import React, { useState, useEffect, lazy } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invoicesAPI, profileAPI } from '../services/api';
import { Share2, Printer, ArrowLeft, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [template, setTemplate] = useState('compact');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [invoiceRes, profileRes, settingsRes] = await Promise.all([
        invoicesAPI.getById(id),
        profileAPI.getProfile(),
        fetch('/api/settings?section=invoice', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ settings: { template: 'compact' } }))
      ]);
      
      if (invoiceRes.data?.success && invoiceRes.data?.invoice) {
        setInvoice(invoiceRes.data.invoice);
      }
      
      if (profileRes.data?.success && profileRes.data?.profile) {
        setProfile(profileRes.data.profile);
      }
      
      if (settingsRes?.settings?.template) {
        setTemplate(settingsRes.settings.template);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    const [html2canvas, jsPDF] = await Promise.all([
      import('html2canvas').then(m => m.default),
      import('jspdf').then(m => m.default)
    ]);
    
    const element = document.getElementById('invoice-content');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowHeight: element.scrollHeight + 100
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = (pdfWidth - 10) / imgWidth;
    const scaledHeight = imgHeight * ratio;
    
    let heightLeft = scaledHeight;
    let position = 5;
    
    pdf.addImage(imgData, 'PNG', 5, position, pdfWidth - 10, scaledHeight);
    heightLeft -= pdfHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - scaledHeight + 5;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 5, position, pdfWidth - 10, scaledHeight);
      heightLeft -= pdfHeight;
    }
    
    return pdf;
  };

  const handleShare = async () => {
    if (!invoice?.customer?.phone) {
      toast.error('Customer phone number not found');
      return;
    }

    setSharing(true);
    try {
      const pdf = await generatePDF();
      const customerName = invoice.customer?.name || 'Customer';
      const date = new Date(invoice.createdAt).toLocaleDateString('en-IN').replace(/\//g, '-');
      const fileName = `${customerName}_${date}.pdf`;
      pdf.save(fileName);
      
      const businessName = profile?.businessName || 'Anvi Tiles & Decorhub';
      const businessPhone = profile?.phone || '9876543210';
      
      const message = `Hello ${customerName},\n\nThank you for shopping with ${businessName}!\n\nInvoice Details:\n───────────────\nInvoice #: ${invoice.invoiceNumber}\nDate: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}\nAmount: ₹${(invoice.grandTotal || invoice.total).toFixed(2)}\nPayment: ${invoice.paymentMethod?.toUpperCase() || 'CASH'}\n───────────────\n\nFor any queries, contact us at ${businessPhone}\n\nThank you for your business! 🙏`;
      
      let phone = invoice.customer.phone.replace(/[^0-9]/g, '');
      if (phone.startsWith('91')) phone = phone.substring(2);
      phone = '91' + phone;
      
      setTimeout(() => {
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        toast.success('PDF downloaded! Attach it in WhatsApp');
      }, 500);
      
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getPlaceOfSupply = () => {
    if (invoice?.buyerDetails?.state) return invoice.buyerDetails.state;
    if (invoice?.customer?.address?.city) return invoice.customer.address.city;
    return 'Fazilnagar';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Invoice not found</p>
        <button onClick={() => navigate('/invoices')} className="mt-4 text-blue-600 hover:underline">
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto p-0 sm:p-4">
      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-4 no-print">
        <button onClick={() => navigate('/invoices')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="h-5 w-5" />
          Back to Invoices
        </button>
        
        <div className="flex gap-2">
          <button onClick={handleShare} disabled={sharing} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {sharing ? <><Loader className="h-4 w-4 animate-spin" />Generating...</> : <><Share2 className="h-4 w-4" />Share Invoice</>}
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Printer className="h-4 w-4" />Print
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="w-full h-auto pb-4">
      {template === 'professional' ? (
        <div id="invoice-content" className="invoice-a4" style={{paddingBottom: '40px'}}>
        <div style={{textAlign: 'center', padding: '8px', border: '2px solid #000', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '12px'}}>
          TAX INVOICE
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', border: '2px solid #000', borderTop: 'none', borderBottom: '1px solid #000', padding: '8px'}}>
          <div>
            {profile?.businessName && <div className="a4-company">{profile.businessName.toUpperCase()}</div>}
            {profile?.businessAddress && profile.businessAddress.split('\n').map((line, i) => <div key={i} className="a4-address">{line}</div>)}
            {profile?.gstin && <div className="a4-contact">GSTIN/UIN: {profile.gstin}</div>}
            {profile?.email && <div className="a4-contact">E-Mail: {profile.email}</div>}
            {profile?.phone && <div className="a4-contact">Contact: {profile.phone}</div>}
          </div>
          <div style={{position: 'relative', width: '200px'}}>
            {profile?.logoUrl && (
              <img src={profile.logoUrl} alt="Logo" style={{position: 'absolute', top: '0', right: '0', width: '50px', height: '50px', objectFit: 'contain'}} />
            )}
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', border: '2px solid #000', borderTop: 'none', fontSize: '7px', padding: '4px', gap: '4px'}}>
          <div>Invoice No.: <strong>{invoice.invoiceNumber}</strong></div>
          <div>Dated: <strong>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</strong></div>
          <div>Payment: {invoice.paymentMethod?.toUpperCase() || 'CASH'}</div>
          <div>Destination: {getPlaceOfSupply()}</div>
        </div>

        <div style={{border: '2px solid #000', borderTop: 'none', padding: '6px', fontSize: '7px'}}>
          <div style={{fontWeight: '700', marginBottom: '3px'}}>Customer Details:</div>
          <div style={{fontWeight: '700'}}>{invoice.customer?.name}</div>
          <div>Mobile: {invoice.customer?.phone}</div>
          <div>State: {invoice.buyerDetails?.state || invoice.customer?.address?.state || 'Uttar Pradesh'}</div>
        </div>

        <table style={{width: '100%', borderCollapse: 'collapse', border: '2px solid #000', borderTop: 'none', fontSize: '7px'}}>
          <thead>
            <tr style={{backgroundColor: '#f0f0f0'}}>
              <th style={{border: '1px solid #000', padding: '3px', width: '25px'}}>Sl</th>
              <th style={{border: '1px solid #000', padding: '3px', textAlign: 'left'}}>Description</th>
              <th style={{border: '1px solid #000', padding: '3px', width: '45px'}}>HSN</th>
              <th style={{border: '1px solid #000', padding: '3px', width: '35px'}}>Qty</th>
              <th style={{border: '1px solid #000', padding: '3px', width: '50px'}}>Rate</th>
              <th style={{border: '1px solid #000', padding: '3px', width: '55px'}}>Taxable</th>
              <th style={{border: '1px solid #000', padding: '3px', width: '45px'}}>GST</th>
              <th style={{border: '1px solid #000', padding: '3px', width: '60px'}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, index) => {
              const taxableValue = item.taxableValue || (item.quantity * item.price);
              const gstAmount = (item.cgstAmount || 0) + (item.sgstAmount || 0);
              const totalAmount = taxableValue + gstAmount;
              return (
                <tr key={index}>
                  <td style={{border: '1px solid #000', padding: '2px', textAlign: 'center'}}>{index + 1}</td>
                  <td style={{border: '1px solid #000', padding: '2px'}}>{item.product?.name || 'Product'}</td>
                  <td style={{border: '1px solid #000', padding: '2px', textAlign: 'center'}}>{item.product?.hsnCode || '6907'}</td>
                  <td style={{border: '1px solid #000', padding: '2px', textAlign: 'center'}}>{item.quantity}</td>
                  <td style={{border: '1px solid #000', padding: '2px', textAlign: 'right'}}>₹{item.price.toFixed(2)}</td>
                  <td style={{border: '1px solid #000', padding: '2px', textAlign: 'right'}}>₹{taxableValue.toFixed(2)}</td>
                  <td style={{border: '1px solid #000', padding: '2px', textAlign: 'right'}}>₹{gstAmount.toFixed(2)}</td>
                  <td style={{border: '1px solid #000', padding: '2px', textAlign: 'right'}}>₹{totalAmount.toFixed(2)}</td>
                </tr>
              );
            })}
            <tr style={{fontWeight: '700'}}>
              <td colSpan="5" style={{border: '1px solid #000', padding: '2px', textAlign: 'right'}}>Total</td>
              <td style={{border: '1px solid #000', padding: '2px', textAlign: 'right'}}>₹{(invoice.totalTaxableAmount || invoice.subtotal).toFixed(2)}</td>
              <td style={{border: '1px solid #000', padding: '2px', textAlign: 'right'}}>₹{((invoice.totalCgst || 0) + (invoice.totalSgst || 0)).toFixed(2)}</td>
              <td style={{border: '1px solid #000', padding: '2px', textAlign: 'right'}}>₹{(invoice.grandTotal || invoice.total).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{border: '2px solid #000', borderTop: 'none', padding: '6px', fontSize: '7px'}}>
          <strong>Amount in words:</strong> {invoice.amountInWords || `INR ${invoice.grandTotal || invoice.total} Only`}
        </div>

        <div style={{display: 'flex', border: '2px solid #000', borderTop: 'none'}}>
          <div style={{flex: 1, padding: '6px', fontSize: '7px', borderRight: '2px solid #000'}}>
            {(profile?.bankDetails?.bankName || profile?.bankDetails?.accountNo || profile?.bankDetails?.ifscCode) && (
              <>
                <div style={{fontWeight: '700', marginBottom: '3px'}}>Bank Details:</div>
                {profile.bankDetails?.bankName && <div>Bank: {profile.bankDetails.bankName}</div>}
                {profile.bankDetails?.accountNo && <div>A/c No.: {profile.bankDetails.accountNo}</div>}
                {profile.bankDetails?.ifscCode && <div>IFSC: {profile.bankDetails.ifscCode}</div>}
                {profile.bankDetails?.branch && <div>Branch: {profile.bankDetails.branch}</div>}
              </>
            )}
            <div style={{marginTop: '6px', fontSize: '6px'}}>Declaration: We declare that this invoice shows the actual price of the goods described.</div>
          </div>
          <div style={{width: '140px', padding: '6px', fontSize: '7px', textAlign: 'center'}}>
            {profile?.businessName && <div style={{fontWeight: '700', marginBottom: '3px'}}>for {profile.businessName.toUpperCase()}</div>}
            {profile?.signatureUrl && (
              <img src={profile.signatureUrl} alt="Signature" style={{maxWidth: '80px', maxHeight: '35px', margin: '10px auto', display: 'block'}} />
            )}
            <div style={{marginTop: '20px', fontSize: '6px'}}>Authorised Signatory</div>
          </div>
        </div>
      </div>
      ) : (
        <div id="invoice-content" className="bg-white mx-auto max-w-sm shadow-lg print:shadow-none print:max-w-none" style={{fontSize: '11px', paddingBottom: '30px'}}>
          <div className="border border-gray-300 p-3">
            <div className="text-center mb-3">
              {profile?.businessName && <h2 className="font-bold text-base">{profile.businessName}</h2>}
              {profile?.businessAddress && <p className="text-xs">{profile.businessAddress.split('\n')[0]}</p>}
              {profile?.phone && <p className="text-xs">Ph: {profile.phone}</p>}
              {profile?.gstin && <p className="text-xs">GSTIN: {profile.gstin}</p>}
            </div>
            
            <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2 text-xs">
              <div className="flex justify-between"><span>Bill No:</span><span className="font-semibold">{invoice.invoiceNumber}</span></div>
              <div className="flex justify-between"><span>Date:</span><span>{new Date(invoice.createdAt).toLocaleDateString('en-IN')} {new Date(invoice.createdAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}</span></div>
              <div className="flex justify-between"><span>Customer:</span><span>{invoice.customer?.name}</span></div>
              <div className="flex justify-between"><span>Phone:</span><span>{invoice.customer?.phone}</span></div>
            </div>

            <table className="w-full text-xs mb-2">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center py-1 w-12">Qty</th>
                  <th className="text-right py-1 w-16">Rate</th>
                  <th className="text-right py-1 w-20">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => {
                  const taxableValue = item.taxableValue || (item.quantity * item.price);
                  const gstAmount = (item.cgstAmount || 0) + (item.sgstAmount || 0);
                  const totalAmount = taxableValue + gstAmount;
                  return (
                    <tr key={index} className="border-b border-dotted border-gray-300">
                      <td className="py-1">{item.product?.name || 'Product'}</td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1">₹{item.price.toFixed(2)}</td>
                      <td className="text-right py-1">₹{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="border-t border-gray-400 pt-2 text-xs space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span><span>₹{(invoice.totalTaxableAmount || invoice.subtotal).toFixed(2)}</span></div>
              {(invoice.discount > 0 || invoice.autoDiscount > 0) && (
                <div className="flex justify-between text-red-600"><span>Discount:</span><span>-₹{((invoice.discount || 0) + (invoice.autoDiscount || 0)).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span>GST (18%):</span><span>₹{((invoice.totalCgst || 0) + (invoice.totalSgst || 0)).toFixed(2)}</span></div>
              {invoice.roundOff && parseFloat(invoice.roundOff) !== 0 && (
                <div className="flex justify-between"><span>Round Off:</span><span>{parseFloat(invoice.roundOff) >= 0 ? '+' : ''}₹{invoice.roundOff.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-2 mt-2">
                <span>TOTAL:</span>
                <span>₹{(invoice.grandTotal || invoice.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center mt-3 pt-2 border-t border-dashed border-gray-400 text-xs">
              <p>Payment: {invoice.paymentMethod?.toUpperCase() || 'CASH'}</p>
              <p className="mt-2">Thank you! Visit again</p>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Professional Invoice Styles */}
      <style>{`
        .invoice-a4 {
          width: 210mm;
          min-height: 297mm;
          padding: 10mm;
          margin: 0 auto;
          background: #ffffff;
          color: #000;
          font-family: Arial, sans-serif;
          box-sizing: border-box;
          font-size: 9px;
          line-height: 1.2;
          border: none;
          display: flex;
          flex-direction: column;
        }

        .a4-company {
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .a4-address {
          font-size: 8px;
          line-height: 1.3;
        }
        .a4-contact {
          font-size: 8px;
          margin-top: 1px;
        }


        
        @media screen and (max-width: 768px) {
          .invoice-a4 {
            width: 100vw;
            min-height: 100vh;
            padding: 8px;
            margin: 0;
            font-size: 7px;
          }
          .a4-company {
            font-size: 10px;
          }
          .a4-address,
          .a4-contact {
            font-size: 7px;
          }
        }
        
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html {
            width: 210mm;
            height: 297mm;
          }
          body { 
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #000 !important;
            width: 210mm !important;
            height: 297mm !important;
          }
          .no-print { 
            display: none !important; 
          }
          .invoice-a4 {
            width: 210mm !important;
            height: auto !important;
            min-height: 297mm !important;
            max-width: 210mm !important;
            padding: 10mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000 !important;
            transform: none !important;
            page-break-after: always !important;
          }
          .invoice-a4 * {
            color: #000 !important;
          }
          table {
            page-break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          .a4-header {
            page-break-after: avoid !important;
          }
          .a4-items-table tbody tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ViewInvoice;

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
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = pdfWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;
    
    let heightLeft = scaledHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight, undefined, 'FAST');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 sm:p-4">
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
      {template === 'professional' ? (
        <div id="invoice-content" className="invoice-page">
        {/* Header */}
        <div style={{fontSize: '10px', lineHeight: '1.3', marginBottom: '8px'}}>
          <div style={{fontWeight: '700', fontSize: '13px', marginBottom: '2px'}}>{profile?.businessName?.toUpperCase() || 'ANVI TILES & DECORHUB'}</div>
          {profile?.businessAddress?.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          )) || <div>Shop Address, City, State</div>}
          <div>GSTIN/UIN: {profile?.gstin || '09FTIPS4577P1ZD'}</div>
          <div>E-Mail: {profile?.email || 'info@anvitiles.com'}</div>
          <div>Contact: {profile?.phone || '+91 9876543210'}</div>
        </div>
        <div style={{textAlign: 'center', fontWeight: '700', fontSize: '14px', margin: '6px 0', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px'}}>Proforma Invoice</div>

        {/* Invoice Info Grid */}
        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '6px'}}>
          <tbody>
            <tr>
              <td style={{border: '1px solid #000', padding: '3px 5px', width: '50%'}}>Invoice No.: <strong>{invoice.invoiceNumber}</strong></td>
              <td style={{border: '1px solid #000', padding: '3px 5px'}}>Dated: <strong>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</strong></td>
            </tr>
            <tr>
              <td style={{border: '1px solid #000', padding: '3px 5px'}}>Delivery Note: {invoice.deliveryNote || '-'}</td>
              <td style={{border: '1px solid #000', padding: '3px 5px'}}>Mode/Terms of Payment: {invoice.paymentMethod?.toUpperCase() || 'CASH'}</td>
            </tr>
            <tr>
              <td style={{border: '1px solid #000', padding: '3px 5px'}}>Reference No. & Date: {invoice.referenceNo || '-'}</td>
              <td style={{border: '1px solid #000', padding: '3px 5px'}}>Other References: -</td>
            </tr>
            <tr>
              <td style={{border: '1px solid #000', padding: '3px 5px'}}>Buyer's Order No.: {invoice.buyerOrderNo || '-'}</td>
              <td style={{border: '1px solid #000', padding: '3px 5px'}}>Dated: {new Date(invoice.createdAt).toLocaleDateString('en-IN')}</td>
            </tr>
            <tr>
              <td style={{border: '1px solid #000', padding: '3px 5px'}}>Dispatch Doc No.: -</td>
              <td style={{border: '1px solid #000', padding: '3px 5px'}}>Delivery Note Date: -</td>
            </tr>
            <tr>
              <td style={{border: '1px solid #000', padding: '3px 5px'}}>Dispatched through: {invoice.destination || '-'}</td>
              <td style={{border: '1px solid #000', padding: '3px 5px'}}>Destination: {getPlaceOfSupply()}</td>
            </tr>
            <tr>
              <td colSpan="2" style={{border: '1px solid #000', padding: '3px 5px'}}>Terms of Delivery: -</td>
            </tr>
          </tbody>
        </table>

        {/* Buyer Details */}
        <div style={{border: '1px solid #000', padding: '5px', fontSize: '10px', marginBottom: '6px', lineHeight: '1.4'}}>
          <div>Consignee (Ship to):</div>
          <div style={{fontWeight: '700', margin: '2px 0'}}>{invoice.customer?.name}</div>
          <div>{invoice.buyerDetails?.address || invoice.customer?.address?.street || '-'}</div>
          <div>Mobile: {invoice.customer?.phone}</div>
          <div>State Name: {invoice.buyerDetails?.state || invoice.customer?.address?.state || 'Uttar Pradesh'}</div>
          <div>Place of Supply: {getPlaceOfSupply()}</div>
        </div>

        {/* Items Table */}
        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '6px'}}>
          <thead>
            <tr style={{backgroundColor: '#f0f0f0'}}>
              <th style={{border: '1px solid #000', padding: '3px', width: '25px', textAlign: 'center'}}>Sl No.</th>
              <th style={{border: '1px solid #000', padding: '3px', textAlign: 'left'}}>Description of Goods</th>
              <th style={{border: '1px solid #000', padding: '3px', width: '55px', textAlign: 'center'}}>HSN/SAC</th>
              <th style={{border: '1px solid #000', padding: '3px', width: '45px', textAlign: 'center'}}>Quantity</th>
              <th style={{border: '1px solid #000', padding: '3px', width: '60px', textAlign: 'center'}}>Rate</th>
              <th style={{border: '1px solid #000', padding: '3px', width: '35px', textAlign: 'center'}}>per</th>
              <th style={{border: '1px solid #000', padding: '3px', width: '75px', textAlign: 'center'}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, index) => {
              const taxableValue = item.taxableValue || (item.quantity * item.price);
              const gstAmount = (item.cgstAmount || 0) + (item.sgstAmount || 0);
              const totalAmount = taxableValue + gstAmount;
              return (
                <tr key={index}>
                  <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'center'}}>{index + 1}</td>
                  <td style={{border: '1px solid #000', padding: '2px 3px'}}>{item.product?.name || 'Product'}</td>
                  <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'center'}}>{item.product?.hsnCode || '6907'}</td>
                  <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'center'}}>{item.quantity}</td>
                  <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right'}}>{item.price.toFixed(2)}</td>
                  <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'center'}}>Nos</td>
                  <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right'}}>{totalAmount.toFixed(2)}</td>
                </tr>
              );
            })}
            <tr>
              <td colSpan="6" rowSpan="2" style={{border: '1px solid #000', padding: '2px 3px', fontWeight: '600', verticalAlign: 'top'}}>IGST @ 18%</td>
              <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right'}}>{((invoice.totalCgst || 0) + (invoice.totalSgst || 0)).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right', fontWeight: '700'}}>₹ {(invoice.grandTotal || invoice.total).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        {invoice.items?.length > 10 && <div style={{textAlign: 'right', fontSize: '9px', marginBottom: '4px'}}>continued to page number 2</div>}

        {/* Amount in Words */}
        <div style={{border: '1px solid #000', padding: '4px 5px', fontSize: '10px', marginBottom: '6px'}}>
          <strong>Amount Chargeable (in words):</strong>
          <div style={{fontWeight: '600', marginTop: '2px'}}>{invoice.amountInWords || `INR ${invoice.grandTotal || invoice.total} Only`}</div>
        </div>

        {/* GST Summary */}
        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '6px'}}>
          <thead style={{backgroundColor: '#f0f0f0'}}>
            <tr>
              <th rowSpan="2" style={{border: '1px solid #000', padding: '3px', textAlign: 'center'}}>HSN/SAC</th>
              <th rowSpan="2" style={{border: '1px solid #000', padding: '3px', textAlign: 'center'}}>Taxable Value</th>
              <th colSpan="2" style={{border: '1px solid #000', padding: '3px', textAlign: 'center'}}>CGST</th>
              <th colSpan="2" style={{border: '1px solid #000', padding: '3px', textAlign: 'center'}}>SGST/UTGST</th>
              <th rowSpan="2" style={{border: '1px solid #000', padding: '3px', textAlign: 'center'}}>Total Tax Amount</th>
            </tr>
            <tr>
              <th style={{border: '1px solid #000', padding: '3px', textAlign: 'center'}}>Rate</th>
              <th style={{border: '1px solid #000', padding: '3px', textAlign: 'center'}}>Amount</th>
              <th style={{border: '1px solid #000', padding: '3px', textAlign: 'center'}}>Rate</th>
              <th style={{border: '1px solid #000', padding: '3px', textAlign: 'center'}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'center'}}>6907</td>
              <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right'}}>{(invoice.totalTaxableAmount || invoice.subtotal).toFixed(2)}</td>
              <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'center'}}>9%</td>
              <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right'}}>{(invoice.totalCgst || 0).toFixed(2)}</td>
              <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'center'}}>9%</td>
              <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right'}}>{(invoice.totalSgst || 0).toFixed(2)}</td>
              <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right'}}>{((invoice.totalCgst || 0) + (invoice.totalSgst || 0)).toFixed(2)}</td>
            </tr>
            <tr style={{fontWeight: '600'}}>
              <td colSpan="2" style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right'}}>Total</td>
              <td colSpan="2" style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right'}}>{(invoice.totalCgst || 0).toFixed(2)}</td>
              <td colSpan="2" style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right'}}>{(invoice.totalSgst || 0).toFixed(2)}</td>
              <td style={{border: '1px solid #000', padding: '2px 3px', textAlign: 'right'}}>{((invoice.totalCgst || 0) + (invoice.totalSgst || 0)).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Declaration & Bank Details */}
        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '10px'}}>
          <tbody>
            <tr>
              <td style={{border: '1px solid #000', padding: '5px', width: '50%', verticalAlign: 'top'}}>
                <div style={{fontWeight: '600', marginBottom: '4px'}}>Tax Amount (in words): INR {invoice.amountInWords || `${invoice.grandTotal || invoice.total} Only`}</div>
                <div style={{marginTop: '8px', fontWeight: '600'}}>Declaration:</div>
                <div style={{fontSize: '9px', lineHeight: '1.3'}}>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
                <div style={{marginTop: '10px'}}>
                  <div style={{fontWeight: '600'}}>Bank Name: HDFC Bank</div>
                  <div>A/c No.: 50200068337918</div>
                  <div>Branch & IFS Code: HDFC0004331</div>
                </div>
              </td>
              <td style={{border: '1px solid #000', padding: '5px', textAlign: 'right', verticalAlign: 'top'}}>
                <div style={{fontWeight: '600', marginBottom: '4px'}}>for {profile?.businessName?.toUpperCase() || 'ANVI TILES & DECORHUB'}</div>
                <div style={{height: '50px', marginTop: '15px', marginBottom: '10px'}}>
                  {profile?.signatureUrl && (
                    <img src={profile.signatureUrl} alt="Signature" style={{maxWidth: '90px', maxHeight: '45px', marginLeft: 'auto', display: 'block'}} />
                  )}
                </div>
                <div style={{fontWeight: '600', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '10px'}}>Authorised Signatory</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{textAlign: 'center', fontSize: '9px', marginTop: '8px', lineHeight: '1.5'}}>
          <div style={{fontWeight: '600'}}>SUBJECT TO VARANASI JURISDICTION</div>
          <div>This is a Computer Generated Invoice</div>
        </div>
      </div>
      ) : (
        <div id="invoice-content" className="bg-white mx-auto max-w-4xl shadow-lg print:shadow-none print:max-w-none">
          <div className="border-2 border-black">
            <div className="bg-gray-100 p-3 sm:p-4 text-center border-b-2 border-black">
              <h1 className="text-lg sm:text-2xl font-bold">TAX INVOICE</h1>
              <div className="text-right text-xs mt-1">ORIGINAL FOR RECIPIENT</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 border-b-2 border-black">
              <div className="p-3 sm:p-4 border-b md:border-b-0 md:border-r-2 border-black">
                <div className="flex items-start gap-2 mb-2">
                  {profile?.logoUrl ? (
                    <img src={profile.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                  ) : (
                    <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                      {profile?.businessName?.charAt(0) || 'A'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-sm sm:text-base break-words">{profile?.businessName || 'ANVI TILES & DECORHUB'}</h2>
                    <p className="text-xs break-words">GSTIN: {profile?.gstin || '09FTIPS4577P1ZD'}</p>
                  </div>
                </div>
                <div className="text-xs space-y-0.5">
                  {profile?.businessAddress?.split('\n').map((line, i) => (
                    <p key={i} className="break-words">{line}</p>
                  )) || (
                    <>
                      <p>Shop No. 123, Tiles Market</p>
                      <p>Main Road, City Center</p>
                      <p>State: UTTAR PRADESH, 273001</p>
                    </>
                  )}
                  <p>Mobile: {profile?.phone || '+91 9876543210'}</p>
                  <p>Email: {profile?.email || 'info@anvitiles.com'}</p>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><p className="font-semibold">Invoice #:</p><p className="break-words">{invoice.invoiceNumber}</p></div>
                  <div><p className="font-semibold">Date:</p><p>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</p></div>
                  <div><p className="font-semibold">Place of Supply:</p><p>{getPlaceOfSupply()}</p></div>
                  <div><p className="font-semibold">Due Date:</p><p>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</p></div>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 border-b-2 border-black text-xs">
              <p className="font-bold mb-1">Customer Details:</p>
              <p>Name: {invoice.customer?.name}</p>
              <p>Phone: {invoice.customer?.phone}</p>
              <p>GSTIN: N/A</p>
            </div>
            <div className="border-b-2 border-black">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border-r border-black p-2 text-left w-8">#</th>
                      <th className="border-r border-black p-2 text-left">Item</th>
                      <th className="border-r border-black p-2 text-center w-16">HSN</th>
                      <th className="border-r border-black p-2 text-right w-20">Rate</th>
                      <th className="border-r border-black p-2 text-center w-12">Qty</th>
                      <th className="border-r border-black p-2 text-right w-24">Taxable</th>
                      <th className="border-r border-black p-2 text-right w-20">GST</th>
                      <th className="p-2 text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => {
                      const taxableValue = item.taxableValue || (item.quantity * item.price);
                      const gstAmount = (item.cgstAmount || 0) + (item.sgstAmount || 0);
                      const totalAmount = taxableValue + gstAmount;
                      return (
                        <tr key={index} className="border-t border-gray-300">
                          <td className="border-r border-black p-2 text-center">{index + 1}</td>
                          <td className="border-r border-black p-2 break-words">{item.product?.name || 'Product'}</td>
                          <td className="border-r border-black p-2 text-center">{item.product?.hsnCode || '6907'}</td>
                          <td className="border-r border-black p-2 text-right">₹{item.price.toFixed(2)}</td>
                          <td className="border-r border-black p-2 text-center">{item.quantity}</td>
                          <td className="border-r border-black p-2 text-right">₹{taxableValue.toFixed(2)}</td>
                          <td className="border-r border-black p-2 text-right">₹{gstAmount.toFixed(2)}</td>
                          <td className="p-2 text-right">₹{totalAmount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-gray-300">
                {invoice.items?.map((item, index) => {
                  const taxableValue = item.taxableValue || (item.quantity * item.price);
                  const gstAmount = (item.cgstAmount || 0) + (item.sgstAmount || 0);
                  const totalAmount = taxableValue + gstAmount;
                  return (
                    <div key={index} className="p-3 text-xs space-y-1">
                      <div className="flex justify-between font-semibold"><span>{index + 1}. {item.product?.name || 'Product'}</span></div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
                        <div>HSN: {item.product?.hsnCode || '6907'}</div>
                        <div>Rate: ₹{item.price.toFixed(2)}</div>
                        <div>Qty: {item.quantity}</div>
                        <div>Taxable: ₹{taxableValue.toFixed(2)}</div>
                        <div>GST: ₹{gstAmount.toFixed(2)}</div>
                        <div className="font-semibold text-gray-900">Amount: ₹{totalAmount.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-3 sm:p-4 border-b-2 border-black">
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between border-b pb-1"><span className="font-medium">Item Total:</span><span>₹{((invoice.totalTaxableAmount || invoice.subtotal) + (invoice.discount || 0) + (invoice.autoDiscount || 0)).toFixed(2)}</span></div>
                  {(invoice.discount > 0 || invoice.autoDiscount > 0) && (<div className="flex justify-between text-red-600"><span>Discount:</span><span>-₹{((invoice.discount || 0) + (invoice.autoDiscount || 0)).toFixed(2)}</span></div>)}
                  <div className="flex justify-between font-semibold border-b pb-1"><span>Taxable Amount:</span><span>₹{(invoice.totalTaxableAmount || invoice.subtotal).toFixed(2)}</span></div>
                  {(invoice.totalCgst > 0 || invoice.totalSgst > 0) && (<><div className="flex justify-between text-blue-700"><span>CGST @ 9%:</span><span>₹{(invoice.totalCgst || 0).toFixed(2)}</span></div><div className="flex justify-between text-blue-700"><span>SGST @ 9%:</span><span>₹{(invoice.totalSgst || 0).toFixed(2)}</span></div><div className="flex justify-between font-semibold text-blue-800"><span>Total GST (18%):</span><span>₹{((invoice.totalCgst || 0) + (invoice.totalSgst || 0)).toFixed(2)}</span></div></>)}
                  {invoice.roundOff && parseFloat(invoice.roundOff) !== 0 && (<div className="flex justify-between"><span>Round Off:</span><span>{parseFloat(invoice.roundOff) >= 0 ? '+' : ''}₹{invoice.roundOff.toFixed(2)}</span></div>)}
                  <div className="flex justify-between text-base sm:text-lg font-bold text-green-700 border-t-2 border-gray-400 pt-2"><span>Grand Total:</span><span>₹{(invoice.grandTotal || invoice.total).toFixed(2)}</span></div>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 border-b-2 border-black text-xs"><p><strong>Amount in words:</strong> {invoice.amountInWords || `Rupees ${invoice.grandTotal || invoice.total} Only`}</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-3 sm:p-4 border-b md:border-b-0 md:border-r-2 border-black"><p className="font-bold mb-2 text-xs">Bank Details:</p><div className="text-xs space-y-0.5"><p>Bank: HDFC Bank</p><p>Account #: 50200068337918</p><p>IFSC Code: HDFC0004331</p><p>Branch: Main Branch</p></div></div>
              <div className="p-3 sm:p-4 text-right"><p className="mb-2 text-xs"><strong>For {profile?.businessName || 'ANVI TILES & DECORHUB'}</strong></p>{profile?.signatureUrl ? (<img src={profile.signatureUrl} alt="Signature" className="max-w-20 max-h-10 object-contain ml-auto mt-4" />) : (<p className="mt-8 text-xs">Authorised Signatory</p>)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Invoice Styles */}
      <style>{`
        .invoice-page {
          width: 210mm;
          min-height: 297mm;
          padding: 8mm 10mm;
          margin: 0 auto;
          background: #ffffff;
          color: #000;
          font-family: Arial, sans-serif;
          border: 1px solid #dcdcdc;
          box-sizing: border-box;
          font-size: 10px;
          line-height: 1.3;
        }
        .invoice-header {
          margin-bottom: 12px;
        }
        .company-info {
          text-align: center;
          margin-bottom: 8px;
        }
        .company-name {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .company-details {
          font-size: 11px;
          line-height: 1.4;
        }
        .invoice-title {
          text-align: center;
          font-size: 16px;
          font-weight: 700;
          margin: 10px 0;
          padding: 6px;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }
        .header-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-bottom: 10px;
        }
        .info-box {
          border: 1px solid #bfbfbf;
          padding: 6px 8px;
          font-size: 11px;
          background: #fff;
        }
        .party-details {
          border: 1px solid #000;
          padding: 8px;
          margin-bottom: 10px;
          font-size: 11px;
          line-height: 1.5;
        }
        .party-name {
          font-weight: 700;
          font-size: 12px;
          margin: 4px 0;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 10px;
        }
        .invoice-table th {
          border: 1px solid #000;
          padding: 4px;
          background: #e6e6e6;
          font-weight: 600;
          text-align: center;
        }
        .invoice-table td {
          border: 1px solid #000;
          padding: 4px;
        }
        .amount-words {
          border: 1px solid #000;
          padding: 8px;
          font-size: 11px;
          margin-bottom: 8px;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 10px;
        }
        .declaration-box, .signature-box {
          border: 1px solid #000;
          padding: 8px;
          font-size: 11px;
        }
        .signature-box {
          text-align: right;
        }
        .invoice-footer {
          text-align: center;
          font-size: 10px;
          margin-top: 12px;
          line-height: 1.6;
        }
        
        @media screen and (max-width: 768px) {
          .invoice-page {
            width: 100%;
            padding: 10px;
            margin: 0;
            transform: scale(0.85);
            transform-origin: top center;
            border: none;
          }
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body, html { 
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #000 !important;
          }
          .no-print { 
            display: none !important; 
          }
          .invoice-page {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 15mm 12mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000 !important;
            transform: none !important;
          }
          .invoice-page * {
            color: #000 !important;
          }
          .invoice-table th {
            background: #e6e6e6 !important;
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
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default ViewInvoice;

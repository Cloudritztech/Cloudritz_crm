import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import QRCode from 'qrcode';

const UpiQrModal = ({ isOpen, onClose, upiId, amount, customerName, invoiceNumber }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (isOpen && upiId && amount) {
      generateQRCode();
    }
  }, [isOpen, upiId, amount]);

  const generateQRCode = async () => {
    // UPI payment URL format
    const upiUrl = `upi://pay?pa=${upiId}&pn=Business&am=${amount}&cu=INR&tn=Invoice ${invoiceNumber}`;
    
    try {
      const qrUrl = await QRCode.toDataURL(upiUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `UPI_QR_${invoiceNumber}.png`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan to Pay</h2>
          <p className="text-gray-600 mb-6">Customer can scan this QR code to pay</p>

          {qrCodeUrl && (
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 inline-block">
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-64 h-64" />
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-1">Amount to Pay</div>
            <div className="text-3xl font-bold text-blue-600">₹{amount.toFixed(2)}</div>
          </div>

          <div className="text-left bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Invoice:</span>
              <span className="font-medium">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">UPI ID:</span>
              <span className="font-medium">{upiId}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Download className="h-5 w-5" />
              Download QR
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpiQrModal;

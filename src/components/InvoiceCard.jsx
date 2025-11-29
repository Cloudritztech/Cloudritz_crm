import React from 'react';
import { FileText, Download, MessageCircle, Eye } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';

const InvoiceCard = ({ invoice, onView, onDownloadPDF, onWhatsAppShare }) => {
  return (
    <Card>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <FileText className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
            <span className={`ml-2 px-2 py-1 text-xs rounded ${
              invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {invoice.status.toUpperCase()}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Customer:</p>
              <p className="font-medium">{invoice.customer.name}</p>
              <p className="text-gray-500">{invoice.customer.phone}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Date:</p>
              <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p className="text-gray-500">Payment: {invoice.paymentMethod.toUpperCase()}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Total Amount:</p>
              <p className="font-bold text-lg text-green-600">₹{invoice.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(invoice._id)}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownloadPDF(invoice._id)}
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWhatsAppShare(invoice._id)}
            title="Share via WhatsApp"
            className="text-green-600 hover:text-green-700"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default InvoiceCard;
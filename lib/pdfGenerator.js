import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

export const generateInvoicePDF = async (invoice) => {
  let browser = null;
  
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 8px; padding: 8mm; background: #fff; color: #000; }
          .invoice { border: 1px solid #000; }
          .header { display: flex; border-bottom: 1px solid #000; }
          .company { flex: 1; padding: 8px; font-size: 7px; line-height: 1.5; border-right: 1px solid #000; }
          .company-name { font-weight: bold; font-size: 9px; margin-bottom: 2px; }
          .invoice-info { width: 200px; padding: 8px; font-size: 7px; position: relative; }
          .logo { position: absolute; top: 8px; right: 8px; width: 50px; height: 50px; object-fit: contain; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; line-height: 1.4; }
          .customer { padding: 8px; font-size: 7px; line-height: 1.5; border-bottom: 1px solid #000; }
          .customer strong { font-size: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 7px; }
          th { background: #fff; border: 1px solid #000; padding: 4px 3px; text-align: center; font-weight: bold; line-height: 1.4; color: #000; }
          td { border: 1px solid #000; padding: 3px 2px; text-align: center; line-height: 1.4; vertical-align: middle; }
          .desc { text-align: left !important; }
          .right { text-align: right !important; }
          .total-row { font-weight: bold; background: #fff; color: #000; }
          .amount-words { padding: 8px; border-top: 1px solid #000; font-size: 7px; line-height: 1.5; }
          .gst-table { margin-top: 0; }
          .footer { display: flex; border-top: 1px solid #000; }
          .bank { flex: 1; padding: 8px; font-size: 7px; line-height: 1.5; border-right: 1px solid #000; }
          .signature { width: 180px; padding: 8px; text-align: center; font-size: 7px; }
          .sig-space { height: 40px; }
          .declaration { padding: 8px; border-top: 1px solid #000; font-size: 6px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div style="text-align: center; padding: 8px; border-bottom: 1px solid #000; font-weight: bold; font-size: 12px;">
            TAX INVOICE
          </div>
          <div class="header">
            <div class="company">
              <div class="company-name">${invoice.companyDetails?.name || ''}</div>
              ${invoice.companyDetails?.address ? `<div>${invoice.companyDetails.address}</div>` : ''}
              ${invoice.companyDetails?.gstin ? `<div>GSTIN/UIN: ${invoice.companyDetails.gstin}</div>` : ''}
              ${invoice.companyDetails?.state ? `<div>State: ${invoice.companyDetails.state}${invoice.companyDetails?.stateCode ? `, Code: ${invoice.companyDetails.stateCode}` : ''}</div>` : ''}
              ${invoice.companyDetails?.mobile ? `<div>Mobile: ${invoice.companyDetails.mobile}</div>` : ''}
              ${invoice.companyDetails?.email ? `<div>Email: ${invoice.companyDetails.email}</div>` : ''}
            </div>
            <div class="invoice-info">
              ${invoice.companyDetails?.logo ? `<img src="${invoice.companyDetails.logo}" class="logo" alt="Logo" />` : ''}
              <div class="info-row"><span>Invoice No:</span><strong>${invoice.invoiceNumber}</strong></div>
              <div class="info-row"><span>Dated:</span><span>${new Date(invoice.createdAt).toLocaleDateString('en-IN')}</span></div>
              <div class="info-row"><span>Delivery Note:</span><span>-</span></div>
              <div class="info-row"><span>Mode of Payment:</span><span>${invoice.paymentMethod?.toUpperCase() || 'CASH'}</span></div>
              <div class="info-row"><span>Reference No:</span><span>-</span></div>
              <div class="info-row"><span>Buyer's Order No:</span><span>-</span></div>
              <div class="info-row"><span>Dispatch Doc No:</span><span>-</span></div>
              <div class="info-row"><span>Dispatched through:</span><span>-</span></div>
              <div class="info-row"><span>Destination:</span><span>${invoice.destination || 'Local'}</span></div>
              <div class="info-row"><span>Terms of Delivery:</span><span>-</span></div>
            </div>
          </div>

          <div class="customer">
            ${invoice.customer?.name ? `<div><strong>${invoice.customer.name}</strong></div>` : ''}
            ${invoice.customer?.address?.street ? `<div>${invoice.customer.address.street}</div>` : ''}
            ${invoice.customer?.phone ? `<div>Mobile: ${invoice.customer.phone}</div>` : ''}
            ${invoice.buyerDetails?.gstin ? `<div>GSTIN/UIN: ${invoice.buyerDetails.gstin}</div>` : ''}
            ${invoice.buyerDetails?.state ? `<div>State: ${invoice.buyerDetails.state}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:20px">Sl</th>
                <th>Description of Goods</th>
                <th style="width:45px">HSN/SAC</th>
                <th style="width:35px">Qty</th>
                <th style="width:50px">Rate</th>
                <th style="width:25px">per</th>
                <th style="width:60px">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item, index) => {
                const taxableValue = item.taxableValue || (item.quantity * item.price);
                const gstAmount = (item.cgstAmount || 0) + (item.sgstAmount || 0);
                const totalAmount = taxableValue + gstAmount;
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td class="desc">${item.product.name}</td>
                    <td>${item.product.hsnCode || '6907'}</td>
                    <td>${item.quantity}</td>
                    <td class="right">${item.price.toFixed(2)}</td>
                    <td>Set</td>
                    <td class="right">${totalAmount.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total-row">
                <td colspan="6" class="right">Total</td>
                <td class="right">₹ ${(invoice.grandTotal || invoice.total).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="amount-words">
            <strong>Amount Chargeable (in words):</strong> INR ${invoice.amountInWords || 'Zero'} Only
          </div>

          <table class="gst-table">
            <thead>
              <tr>
                <th rowspan="2" style="width:50px">HSN/SAC</th>
                <th rowspan="2" style="width:80px">Taxable Value</th>
                <th colspan="2">CGST</th>
                <th colspan="2">SGST/UTGST</th>
                <th rowspan="2" style="width:70px">Total Tax</th>
              </tr>
              <tr>
                <th style="width:35px">Rate</th>
                <th style="width:50px">Amount</th>
                <th style="width:35px">Rate</th>
                <th style="width:50px">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>6907</td>
                <td class="right">${(invoice.totalTaxableAmount || invoice.subtotal).toFixed(2)}</td>
                <td>9%</td>
                <td class="right">${(invoice.totalCgst || 0).toFixed(2)}</td>
                <td>9%</td>
                <td class="right">${(invoice.totalSgst || 0).toFixed(2)}</td>
                <td class="right">${((invoice.totalCgst || 0) + (invoice.totalSgst || 0)).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" class="right">Total</td>
                <td colspan="2" class="right">${(invoice.totalCgst || 0).toFixed(2)}</td>
                <td colspan="2" class="right">${(invoice.totalSgst || 0).toFixed(2)}</td>
                <td class="right">${((invoice.totalCgst || 0) + (invoice.totalSgst || 0)).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="amount-words">
            <strong>Tax Amount (in words):</strong> INR ${invoice.amountInWords || 'Zero'} Only
          </div>

          <div class="footer">
            <div class="bank">
              ${invoice.bankDetails?.bankName || invoice.bankDetails?.accountNo || invoice.bankDetails?.ifscCode ? `<div style="font-weight:bold;margin-bottom:3px">Company's Bank Details</div>` : ''}
              ${invoice.bankDetails?.bankName ? `<div>Bank Name: ${invoice.bankDetails.bankName}</div>` : ''}
              ${invoice.bankDetails?.accountNo ? `<div>A/c No.: ${invoice.bankDetails.accountNo}</div>` : ''}
              ${invoice.bankDetails?.branch || invoice.bankDetails?.ifscCode ? `<div>Branch & IFS Code: ${invoice.bankDetails?.branch || ''} ${invoice.bankDetails?.branch && invoice.bankDetails?.ifscCode ? '&' : ''} ${invoice.bankDetails?.ifscCode || ''}</div>` : ''}
            </div>
            <div class="signature">
              ${invoice.companyDetails?.name ? `<div style="font-weight:bold">for ${invoice.companyDetails.name}</div>` : ''}
              <div class="sig-space"></div>
              <div style="font-weight:bold">Authorised Signatory</div>
            </div>
          </div>

          <div class="declaration">
            <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' }
    });

    return pdfBuffer;
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

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
          body { font-family: Arial, sans-serif; font-size: 8px; padding: 8mm; }
          .invoice { border: 1px solid #000; }
          .header { display: flex; border-bottom: 1px solid #000; }
          .company { flex: 1; padding: 6px; font-size: 7px; line-height: 1.3; border-right: 1px solid #000; }
          .company-name { font-weight: bold; font-size: 9px; margin-bottom: 2px; }
          .invoice-info { width: 200px; padding: 6px; font-size: 7px; }
          .invoice-title { text-align: right; font-weight: bold; font-size: 10px; margin-bottom: 4px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .customer { padding: 6px; font-size: 7px; line-height: 1.3; border-bottom: 1px solid #000; }
          .customer strong { font-size: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 7px; }
          th { background: #f0f0f0; border: 1px solid #000; padding: 3px 2px; text-align: center; font-weight: bold; }
          td { border: 1px solid #000; padding: 2px; text-align: center; }
          .desc { text-align: left !important; }
          .right { text-align: right !important; }
          .total-row { font-weight: bold; background: #f9f9f9; }
          .amount-words { padding: 6px; border-top: 1px solid #000; font-size: 7px; }
          .gst-table { margin-top: 0; }
          .footer { display: flex; border-top: 1px solid #000; }
          .bank { flex: 1; padding: 6px; font-size: 7px; border-right: 1px solid #000; }
          .signature { width: 180px; padding: 6px; text-align: center; font-size: 7px; }
          .sig-space { height: 40px; }
          .declaration { padding: 6px; border-top: 1px solid #000; font-size: 6px; line-height: 1.3; }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="company">
              <div class="company-name">${invoice.companyDetails?.name || 'ANVI TILES & DECORHUB'}</div>
              <div>${invoice.companyDetails?.address || 'Shop Address, City, State'}</div>
              <div>GSTIN/UIN: ${invoice.companyDetails?.gstin || '09FTIPS4577P1ZD'}</div>
              <div>State: ${invoice.companyDetails?.state || 'Uttar Pradesh'}, Code: ${invoice.companyDetails?.stateCode || '09'}</div>
              <div>Mobile: ${invoice.companyDetails?.mobile || '+91 9876543210'}</div>
              <div>Email: ${invoice.companyDetails?.email || 'info@anvitiles.com'}</div>
            </div>
            <div class="invoice-info">
              <div class="invoice-title">TAX INVOICE</div>
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
            <div><strong>${invoice.customer?.name || 'Customer'}</strong></div>
            <div>${invoice.customer?.address?.street || 'Address not provided'}</div>
            <div>Mobile: ${invoice.customer?.phone || 'N/A'}</div>
            <div>GSTIN/UIN: ${invoice.buyerDetails?.gstin || 'N/A'}</div>
            <div>State: ${invoice.buyerDetails?.state || 'Uttar Pradesh'}</div>
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
              <div style="font-weight:bold;margin-bottom:3px">Company's Bank Details</div>
              <div>Bank Name: ${invoice.bankDetails?.bankName || 'HDFC Bank'}</div>
              <div>A/c No.: ${invoice.bankDetails?.accountNo || '50200068337918'}</div>
              <div>Branch & IFS Code: ${invoice.bankDetails?.branch || 'Main Branch'} & ${invoice.bankDetails?.ifscCode || 'HDFC0004331'}</div>
            </div>
            <div class="signature">
              <div style="font-weight:bold">for ${invoice.companyDetails?.name || 'ANVI TILES & DECORHUB'}</div>
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

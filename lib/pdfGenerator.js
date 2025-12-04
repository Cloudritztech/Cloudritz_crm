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
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 9px; }
          .invoice-container { border: 2px solid #000; width: 100%; height: 100%; }
          .invoice-header { background-color: #f8f9fa; padding: 8px; text-align: center; border-bottom: 2px solid #000; }
          .invoice-title { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
          .original-text { font-size: 8px; margin-top: 3px; }
          .company-info { display: flex; border-bottom: 2px solid #000; }
          .company-details { flex: 1; padding: 8px; border-right: 2px solid #000; }
          .company-logo { display: flex; align-items: center; margin-bottom: 5px; }
          .logo-circle { width: 30px; height: 30px; background-color: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 6px; font-size: 11px; }
          .company-name { font-size: 12px; font-weight: bold; }
          .gstin { font-size: 8px; color: #666; }
          .company-address { font-size: 8px; line-height: 1.4; margin-top: 4px; }
          .invoice-meta { flex: 1; padding: 8px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 8px; }
          .meta-item { margin-bottom: 4px; }
          .meta-label { font-weight: bold; }
          .address-section { display: flex; border-bottom: 2px solid #000; }
          .buyer-details, .consignee-details { flex: 1; padding: 8px; }
          .buyer-details { border-right: 2px solid #000; }
          .address-title { font-weight: bold; margin-bottom: 4px; font-size: 9px; }
          .address-content { font-size: 8px; line-height: 1.4; }
          .items-table { width: 100%; border-collapse: collapse; border-left: 2px solid #000; border-right: 2px solid #000; }
          .items-table th { background-color: #f0f0f0; padding: 4px 2px; text-align: center; border: 1px solid #000; font-size: 8px; font-weight: bold; line-height: 1.3; }
          .items-table td { padding: 4px 2px; border: 1px solid #000; font-size: 8px; text-align: center; vertical-align: middle; }
          .items-table .desc-col { text-align: left; padding-left: 4px; }
          .items-table tbody tr:first-child td { border-top: none; }
          .totals-section { border-top: 2px solid #000; border-left: 2px solid #000; border-right: 2px solid #000; }
          .totals-grid { display: flex; }
          .totals-left { flex: 1; padding: 8px; border-right: 2px solid #000; }
          .totals-right { width: 250px; padding: 8px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 8px; }
          .total-label { font-weight: bold; }
          .grand-total { font-size: 10px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
          .amount-words { padding: 8px; border-top: 2px solid #000; font-size: 8px; font-weight: bold; }
          .footer-section { display: flex; border-top: 2px solid #000; border-bottom: 2px solid #000; }
          .bank-details { flex: 1; padding: 8px; border-right: 2px solid #000; }
          .signature-section { width: 180px; padding: 8px; text-align: center; }
          .bank-title { font-weight: bold; margin-bottom: 4px; font-size: 9px; }
          .bank-info { font-size: 8px; line-height: 1.4; }
          .signature-area { margin-top: 30px; border-top: 1px solid #000; padding-top: 4px; }
          .declaration { padding: 8px; border-top: 2px solid #000; border-left: 2px solid #000; border-right: 2px solid #000; font-size: 7px; line-height: 1.4; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <div class="invoice-title">TAX INVOICE</div>
            <div class="original-text">ORIGINAL FOR RECIPIENT</div>
          </div>

          <div class="company-info">
            <div class="company-details">
              <div class="company-logo">
                <div class="logo-circle">AT</div>
                <div>
                  <div class="company-name">${invoice.companyDetails?.name || 'ANVI TILES & DECORHUB'}</div>
                  <div class="gstin">GSTIN/UIN: ${invoice.companyDetails?.gstin || '09FTIPS4577P1ZD'}</div>
                </div>
              </div>
              <div class="company-address">
                ${invoice.companyDetails?.address || 'Shop No. 123, Tiles Market, Main Road, City Center'}<br>
                State Name: ${invoice.companyDetails?.state || 'UTTAR PRADESH'}, Code: ${invoice.companyDetails?.stateCode || '09'}<br>
                Mobile: ${invoice.companyDetails?.mobile || '+91 9876543210'}<br>
                E-Mail: ${invoice.companyDetails?.email || 'info@anvitiles.com'}
              </div>
            </div>
            
            <div class="invoice-meta">
              <div class="meta-grid">
                <div class="meta-item">
                  <div class="meta-label">Invoice No.:</div>
                  <div>${invoice.invoiceNumber}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Dated:</div>
                  <div>${new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Mode/Terms of Payment:</div>
                  <div>${invoice.modeOfPayment || 'Cash'}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Destination:</div>
                  <div>${invoice.destination || 'Gorakhpur'}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="address-section">
            <div class="buyer-details">
              <div class="address-title">Consignee (Ship to)</div>
              <div class="address-content">
                <strong>${invoice.consigneeDetails?.name || invoice.buyerDetails?.name || invoice.customer.name}</strong><br>
                ${invoice.consigneeDetails?.address || invoice.buyerDetails?.address || 'Address not provided'}<br>
                Mobile: ${invoice.consigneeDetails?.mobile || invoice.buyerDetails?.mobile || invoice.customer.phone}<br>
                GSTIN/UIN: ${invoice.consigneeDetails?.gstin || invoice.buyerDetails?.gstin || 'N/A'}<br>
                State Name: ${invoice.consigneeDetails?.state || 'UTTAR PRADESH'}, Code: ${invoice.consigneeDetails?.stateCode || '09'}
              </div>
            </div>
            
            <div class="consignee-details">
              <div class="address-title">Buyer (Bill to)</div>
              <div class="address-content">
                <strong>${invoice.buyerDetails?.name || invoice.customer.name}</strong><br>
                ${invoice.buyerDetails?.address || 'Address not provided'}<br>
                Mobile: ${invoice.buyerDetails?.mobile || invoice.customer.phone}<br>
                GSTIN/UIN: ${invoice.buyerDetails?.gstin || 'N/A'}<br>
                State Name: ${invoice.buyerDetails?.state || 'UTTAR PRADESH'}, Code: ${invoice.buyerDetails?.stateCode || '09'}
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 25px;">Sl<br>No</th>
                <th style="width: 180px;">Description of Goods</th>
                <th style="width: 50px;">HSN/<br>SAC</th>
                <th style="width: 35px;">Qty</th>
                <th style="width: 50px;">Rate</th>
                <th style="width: 60px;">Taxable<br>Value</th>
                <th style="width: 35px;">CGST<br>%</th>
                <th style="width: 50px;">CGST<br>Amt</th>
                <th style="width: 35px;">SGST<br>%</th>
                <th style="width: 50px;">SGST<br>Amt</th>
                <th style="width: 60px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td class="desc-col">${item.product.name}</td>
                  <td>${item.product.hsnCode || '6907'}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price.toFixed(2)}</td>
                  <td>₹${item.taxableValue.toFixed(2)}</td>
                  <td>${item.cgstRate}%</td>
                  <td>₹${item.cgstAmount.toFixed(2)}</td>
                  <td>${item.sgstRate}%</td>
                  <td>₹${item.sgstAmount.toFixed(2)}</td>
                  <td>₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr style="border-top: 2px solid #000;">
                <td colspan="5" style="text-align: right; font-weight: bold;">Total</td>
                <td style="font-weight: bold;">₹${invoice.totalTaxableAmount.toFixed(2)}</td>
                <td></td>
                <td style="font-weight: bold;">₹${invoice.totalCgst.toFixed(2)}</td>
                <td></td>
                <td style="font-weight: bold;">₹${invoice.totalSgst.toFixed(2)}</td>
                <td style="font-weight: bold;">₹${invoice.grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-grid">
              <div class="totals-left">
                <div style="font-weight: bold; margin-bottom: 8px;">Amount Chargeable (in words)</div>
                <div style="font-size: 10px;">INR ${invoice.amountInWords || 'Zero'} Only</div>
              </div>
              
              <div class="totals-right">
                <div class="total-row">
                  <span>Total Amount before Tax:</span>
                  <span>₹${invoice.totalTaxableAmount.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>Add: CGST @ 9%:</span>
                  <span>₹${invoice.totalCgst.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>Add: SGST @ 9%:</span>
                  <span>₹${invoice.totalSgst.toFixed(2)}</span>
                </div>
                ${invoice.roundOff !== 0 ? `
                  <div class="total-row">
                    <span>Round Off:</span>
                    <span>${invoice.roundOff > 0 ? '+' : ''}₹${invoice.roundOff.toFixed(2)}</span>
                  </div>
                ` : ''}
                <div class="total-row grand-total">
                  <span class="total-label">Total Amount after Tax:</span>
                  <span class="total-amount">₹${invoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          ${invoice.notes ? `
            <div class="amount-words">
              <strong>Notes:</strong> ${invoice.notes}
            </div>
          ` : ''}

          <div class="footer-section">
            <div class="bank-details">
              <div class="bank-title">Company's Bank Details</div>
              <div class="bank-info">
                Bank Name: ${invoice.bankDetails?.bankName || 'HDFC Bank'}<br>
                A/c No.: ${invoice.bankDetails?.accountNo || '50200068337918'}<br>
                Branch & IFS Code: ${invoice.bankDetails?.branch || 'Main Branch'} & ${invoice.bankDetails?.ifscCode || 'HDFC0004331'}
              </div>
            </div>
            
            <div class="signature-section">
              <div style="font-weight: bold; margin-bottom: 8px; font-size: 9px;">for ${invoice.companyDetails?.name || 'ANVI TILES & DECORHUB'}</div>
              <div class="signature-area">
                <div style="font-size: 8px;">Authorised Signatory</div>
              </div>
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
      margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' },
      preferCSSPageSize: false
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
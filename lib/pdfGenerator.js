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
          .invoice-container { border: 2px solid #000; width: 100%; }
          .invoice-header { background-color: #f0f0f0; padding: 6px; text-align: center; border-bottom: 2px solid #000; }
          .invoice-title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
          .original-text { font-size: 7px; margin-top: 2px; }
          .company-info { display: flex; border-bottom: 2px solid #000; }
          .company-details { flex: 1; padding: 6px; border-right: 2px solid #000; }
          .company-logo { display: flex; align-items: center; margin-bottom: 3px; }
          .logo-circle { width: 28px; height: 28px; background-color: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 5px; font-size: 10px; }
          .company-name { font-size: 11px; font-weight: bold; }
          .gstin { font-size: 7px; color: #333; }
          .company-address { font-size: 7px; line-height: 1.3; margin-top: 3px; }
          .invoice-meta { flex: 1; padding: 6px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 7px; }
          .meta-item { margin-bottom: 3px; }
          .meta-label { font-weight: bold; }
          .address-section { display: flex; border-bottom: 2px solid #000; }
          .buyer-details, .consignee-details { flex: 1; padding: 6px; }
          .buyer-details { border-right: 2px solid #000; }
          .address-title { font-weight: bold; margin-bottom: 3px; font-size: 8px; }
          .address-content { font-size: 7px; line-height: 1.3; }
          .items-table { width: 100%; border-collapse: collapse; border-top: 2px solid #000; }
          .items-table th { background-color: #f0f0f0; padding: 3px 2px; text-align: center; border: 1px solid #000; font-size: 7px; font-weight: bold; line-height: 1.2; }
          .items-table td { padding: 2px; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; font-size: 7px; text-align: center; vertical-align: middle; }
          .items-table .desc-col { text-align: left; padding-left: 3px; }
          .totals-section { border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; }
          .totals-grid { display: flex; }
          .totals-left { flex: 1; padding: 6px; border-right: 2px solid #000; }
          .totals-right { width: 220px; padding: 6px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 7px; }
          .total-label { font-weight: bold; }
          .grand-total { font-size: 9px; font-weight: bold; padding-top: 3px; margin-top: 3px; }
          .footer-section { display: flex; border-top: 2px solid #000; border-bottom: 2px solid #000; }
          .bank-details { flex: 1; padding: 6px; border-right: 2px solid #000; border-left: 2px solid #000; }
          .signature-section { width: 160px; padding: 6px; text-align: center; border-right: 2px solid #000; }
          .bank-title { font-weight: bold; margin-bottom: 3px; font-size: 8px; }
          .bank-info { font-size: 7px; line-height: 1.3; }
          .signature-area { margin-top: 25px; padding-top: 3px; }
          .declaration { padding: 6px; border-top: 2px solid #000; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; font-size: 7px; line-height: 1.3; }
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
                <div>${invoice.companyDetails?.address || 'Shop No. 123, Tiles Market, Main Road, City Center'}</div>
                <div>State Name: ${invoice.companyDetails?.state || 'UTTAR PRADESH'}, Code: ${invoice.companyDetails?.stateCode || '09'}</div>
                <div>Mobile: ${invoice.companyDetails?.mobile || '+91 9876543210'}</div>
                <div>E-Mail: ${invoice.companyDetails?.email || 'info@anvitiles.com'}</div>
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
                <div><strong>${invoice.consigneeDetails?.name || invoice.buyerDetails?.name || invoice.customer.name}</strong></div>
                <div>${invoice.consigneeDetails?.address || invoice.buyerDetails?.address || 'Address not provided'}</div>
                <div>Mobile: ${invoice.consigneeDetails?.mobile || invoice.buyerDetails?.mobile || invoice.customer.phone}</div>
                <div>GSTIN/UIN: ${invoice.consigneeDetails?.gstin || invoice.buyerDetails?.gstin || 'N/A'}</div>
                <div>State Name: ${invoice.consigneeDetails?.state || 'UTTAR PRADESH'}, Code: ${invoice.consigneeDetails?.stateCode || '09'}</div>
              </div>
            </div>
            
            <div class="consignee-details">
              <div class="address-title">Buyer (Bill to)</div>
              <div class="address-content">
                <div><strong>${invoice.buyerDetails?.name || invoice.customer.name}</strong></div>
                <div>${invoice.buyerDetails?.address || 'Address not provided'}</div>
                <div>Mobile: ${invoice.buyerDetails?.mobile || invoice.customer.phone}</div>
                <div>GSTIN/UIN: ${invoice.buyerDetails?.gstin || 'N/A'}</div>
                <div>State Name: ${invoice.buyerDetails?.state || 'UTTAR PRADESH'}, Code: ${invoice.buyerDetails?.stateCode || '09'}</div>
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 20px; border-left: 2px solid #000;">Sl</th>
                <th style="width: 160px;">Description of Goods</th>
                <th style="width: 45px;">HSN</th>
                <th style="width: 30px;">Qty</th>
                <th style="width: 45px;">Rate</th>
                <th style="width: 55px;">Taxable</th>
                <th style="width: 30px;">CGST%</th>
                <th style="width: 45px;">CGST</th>
                <th style="width: 30px;">SGST%</th>
                <th style="width: 45px;">SGST</th>
                <th style="width: 55px; border-right: 2px solid #000;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item, index) => `
                <tr>
                  <td style="border-left: 2px solid #000;">${index + 1}</td>
                  <td class="desc-col">${item.product.name}</td>
                  <td>${item.product.hsnCode || '6907'}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price.toFixed(2)}</td>
                  <td>₹${item.taxableValue.toFixed(2)}</td>
                  <td>${item.cgstRate}%</td>
                  <td>₹${item.cgstAmount.toFixed(2)}</td>
                  <td>${item.sgstRate}%</td>
                  <td>₹${item.sgstAmount.toFixed(2)}</td>
                  <td style="border-right: 2px solid #000;">₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr style="border-top: 2px solid #000;">
                <td colspan="5" style="text-align: right; font-weight: bold; border-left: 2px solid #000; border-bottom: 2px solid #000;">Total</td>
                <td style="font-weight: bold; border-bottom: 2px solid #000;">₹${invoice.totalTaxableAmount.toFixed(2)}</td>
                <td style="border-bottom: 2px solid #000;"></td>
                <td style="font-weight: bold; border-bottom: 2px solid #000;">₹${invoice.totalCgst.toFixed(2)}</td>
                <td style="border-bottom: 2px solid #000;"></td>
                <td style="font-weight: bold; border-bottom: 2px solid #000;">₹${invoice.totalSgst.toFixed(2)}</td>
                <td style="font-weight: bold; border-right: 2px solid #000; border-bottom: 2px solid #000;">₹${invoice.grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-grid">
              <div class="totals-left">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 8px;">Amount Chargeable (in words)</div>
                <div style="font-size: 8px;">INR ${invoice.amountInWords || 'Zero'} Only</div>
              </div>
              
              <div class="totals-right">
                <div class="total-row">
                  <span>Total before Tax:</span>
                  <span>₹${invoice.totalTaxableAmount.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>CGST @ 9%:</span>
                  <span>₹${invoice.totalCgst.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>SGST @ 9%:</span>
                  <span>₹${invoice.totalSgst.toFixed(2)}</span>
                </div>
                ${invoice.roundOff !== 0 ? `
                  <div class="total-row">
                    <span>Round Off:</span>
                    <span>${invoice.roundOff > 0 ? '+' : ''}₹${invoice.roundOff.toFixed(2)}</span>
                  </div>
                ` : ''}
                <div class="total-row grand-total" style="border-top: 1px solid #000;">
                  <span class="total-label">Total after Tax:</span>
                  <span class="total-amount">₹${invoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer-section">
            <div class="bank-details">
              <div class="bank-title">Company's Bank Details</div>
              <div class="bank-info">
                <div>Bank Name: ${invoice.bankDetails?.bankName || 'HDFC Bank'}</div>
                <div>A/c No.: ${invoice.bankDetails?.accountNo || '50200068337918'}</div>
                <div>Branch & IFS Code: ${invoice.bankDetails?.branch || 'Main Branch'} & ${invoice.bankDetails?.ifscCode || 'HDFC0004331'}</div>
              </div>
            </div>
            
            <div class="signature-section">
              <div style="font-weight: bold; margin-bottom: 6px; font-size: 8px;">for ${invoice.companyDetails?.name || 'ANVI TILES & DECORHUB'}</div>
              <div class="signature-area">
                <div style="font-size: 7px;">Authorised Signatory</div>
              </div>
            </div>
          </div>
          
          <div class="declaration">
            <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.${invoice.notes ? ` <strong>Notes:</strong> ${invoice.notes}` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' },
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
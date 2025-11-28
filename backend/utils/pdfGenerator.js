const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Ensure invoices directory exists
const ensureInvoicesDir = async () => {
  const invoicesDir = path.join(__dirname, '..', 'invoices');
  try {
    await fs.access(invoicesDir);
  } catch {
    await fs.mkdir(invoicesDir, { recursive: true });
  }
  return invoicesDir;
};

const generateInvoicePDF = async (invoice, saveToFile = false) => {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ],
      executablePath: process.env.NODE_ENV === 'production' 
        ? '/usr/bin/chromium-browser'
        : undefined
    });
    const page = await browser.newPage();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 15px; font-size: 11px; }
          .invoice-container { border: 2px solid #000; max-width: 800px; margin: 0 auto; }
          .invoice-header { background-color: #f8f9fa; padding: 12px; text-align: center; border-bottom: 2px solid #000; }
          .invoice-title { font-size: 20px; font-weight: bold; margin-bottom: 3px; }
          .original-text { font-size: 9px; margin-top: 5px; }
          
          .company-info { display: flex; border-bottom: 2px solid #000; }
          .company-details { flex: 1; padding: 12px; border-right: 2px solid #000; }
          .company-logo { display: flex; align-items: center; margin-bottom: 8px; }
          .logo-circle { width: 35px; height: 35px; background-color: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 8px; font-size: 12px; }
          .company-name { font-size: 14px; font-weight: bold; }
          .gstin { font-size: 9px; color: #666; }
          .company-address { font-size: 9px; line-height: 1.3; margin-top: 5px; }
          
          .invoice-meta { flex: 1; padding: 12px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 9px; }
          .meta-item { margin-bottom: 6px; }
          .meta-label { font-weight: bold; }
          
          .address-section { display: flex; border-bottom: 2px solid #000; }
          .buyer-details, .consignee-details { flex: 1; padding: 12px; }
          .buyer-details { border-right: 1px solid #000; }
          .address-title { font-weight: bold; margin-bottom: 6px; font-size: 10px; }
          .address-content { font-size: 9px; line-height: 1.3; }
          
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th { background-color: #f8f9fa; padding: 6px 4px; text-align: center; border: 1px solid #000; font-size: 9px; font-weight: bold; }
          .items-table td { padding: 6px 4px; border: 1px solid #000; font-size: 9px; text-align: center; }
          .items-table .desc-col { text-align: left; }
          
          .totals-section { border-top: 2px solid #000; }
          .totals-grid { display: flex; }
          .totals-left { flex: 1; padding: 12px; }
          .totals-right { width: 300px; padding: 12px; border-left: 1px solid #000; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 9px; }
          .total-label { font-weight: bold; }
          .grand-total { font-size: 11px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; margin-top: 5px; }
          
          .amount-words { padding: 12px; border-top: 1px solid #000; font-size: 9px; }
          
          .footer-section { display: flex; border-top: 2px solid #000; }
          .bank-details { flex: 1; padding: 12px; border-right: 1px solid #000; }
          .signature-section { width: 200px; padding: 12px; text-align: center; }
          .bank-title { font-weight: bold; margin-bottom: 6px; font-size: 10px; }
          .bank-info { font-size: 9px; line-height: 1.3; }
          .signature-area { margin-top: 40px; border-top: 1px solid #000; padding-top: 5px; }
          
          .declaration { padding: 12px; border-top: 1px solid #000; font-size: 8px; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="invoice-header">
            <div class="invoice-title">TAX INVOICE</div>
            <div class="original-text">ORIGINAL FOR RECIPIENT</div>
          </div>

          <!-- Company and Invoice Info -->
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
                  <div class="meta-label">Delivery Note:</div>
                  <div>${invoice.deliveryNote || '-'}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Mode/Terms of Payment:</div>
                  <div>${invoice.modeOfPayment || 'Cash'}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Reference No. & Date:</div>
                  <div>${invoice.referenceNo || '-'}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Other References:</div>
                  <div>${invoice.buyerOrderNo || '-'}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Buyer's Order No.:</div>
                  <div>${invoice.buyerOrderNo || '-'}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Dated:</div>
                  <div>${new Date().toLocaleDateString('en-IN')}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Dispatch Doc No.:</div>
                  <div>${invoice.dispatchDocNo || '-'}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Delivery Note Date:</div>
                  <div>${new Date().toLocaleDateString('en-IN')}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Dispatched through:</div>
                  <div>${invoice.lorryNo || '-'}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Destination:</div>
                  <div>${invoice.destination || 'Gorakhpur'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Buyer and Consignee Details -->
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

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 30px;">Sl</th>
                <th style="width: 200px;">Description of Goods</th>
                <th style="width: 60px;">HSN/SAC</th>
                <th style="width: 40px;">Quantity</th>
                <th style="width: 60px;">Rate</th>
                <th style="width: 50px;">per</th>
                <th style="width: 40px;">Disc %</th>
                <th style="width: 70px;">Taxable Value</th>
                <th style="width: 40px;">CGST Rate</th>
                <th style="width: 50px;">CGST Amount</th>
                <th style="width: 40px;">SGST Rate</th>
                <th style="width: 50px;">SGST Amount</th>
                <th style="width: 70px;">Total</th>
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
                  <td>Nos</td>
                  <td>${(() => {
                    const discount = item.discount || 0;
                    const discountType = item.discountType || 'amount';
                    if (discountType === 'percentage') {
                      return discount.toFixed(1) + '%';
                    } else {
                      return '₹' + discount.toFixed(2);
                    }
                  })()}</td>
                  <td>₹${item.taxableValue.toFixed(2)}</td>
                  <td>${item.cgstRate}%</td>
                  <td>₹${item.cgstAmount.toFixed(2)}</td>
                  <td>${item.sgstRate}%</td>
                  <td>₹${item.sgstAmount.toFixed(2)}</td>
                  <td>₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr style="border-top: 2px solid #000;">
                <td colspan="7" style="text-align: right; font-weight: bold;">Total</td>
                <td style="font-weight: bold;">₹${invoice.totalTaxableAmount.toFixed(2)}</td>
                <td></td>
                <td style="font-weight: bold;">₹${invoice.totalCgst.toFixed(2)}</td>
                <td></td>
                <td style="font-weight: bold;">₹${invoice.totalSgst.toFixed(2)}</td>
                <td style="font-weight: bold;">₹${invoice.grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals -->
          <div class="totals-section">
            <div class="totals-grid">
              <div class="totals-left">
                <div style="font-weight: bold; margin-bottom: 8px;">Amount Chargeable (in words)</div>
                <div style="font-size: 10px;">INR ${invoice.amountInWords || 'Zero'} Only</div>
              </div>
              
              <div class="totals-right">
                <div class="total-row">
                  <span>Gross Amount:</span>
                  <span>₹${invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</span>
                </div>
                ${invoice.items.some(item => item.discount > 0) ? `
                  <div class="total-row">
                    <span>Less: Item Discounts:</span>
                    <span>-₹${invoice.items.reduce((sum, item) => {
                      if (item.discountType === 'percentage') {
                        return sum + ((item.quantity * item.price * item.discount) / 100);
                      } else {
                        return sum + item.discount;
                      }
                    }, 0).toFixed(2)}</span>
                  </div>
                ` : ''}
                <div class="total-row">
                  <span>Taxable Amount:</span>
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
                ${(invoice.discount > 0) ? `
                  <div class="total-row">
                    <span>Less: Additional Discount ${invoice.discountType === 'percentage' ? '(' + invoice.discount + '%)' : ''}:</span>
                    <span>-₹${(() => {
                      if (invoice.discountType === 'percentage') {
                        return ((invoice.totalTaxableAmount * invoice.discount) / 100).toFixed(2);
                      } else {
                        return invoice.discount.toFixed(2);
                      }
                    })()}</span>
                  </div>
                ` : ''}
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

          <!-- Declaration -->
          <div class="declaration">
            <strong>Declaration:</strong><br>
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </div>

          <!-- Footer -->
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
              <div style="font-weight: bold; margin-bottom: 10px;">for ${invoice.companyDetails?.name || 'ANVI TILES & DECORHUB'}</div>
              <div class="signature-area">
                <div style="font-size: 9px;">Authorised Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10px', bottom: '10px', left: '10px', right: '10px' }
    });

    let filePath = null;
    
    if (saveToFile) {
      const invoicesDir = await ensureInvoicesDir();
      const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
      filePath = path.join(invoicesDir, fileName);
      await fs.writeFile(filePath, pdfBuffer);
    }

    return { pdfBuffer, filePath };
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { generateInvoicePDF };
export interface InvoiceGenerationOptions {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  studentName: string;
  studentEmail: string;
  amount: number;
  description: string;
  reference?: string;
}

export const generateInvoiceHTML = (options: InvoiceGenerationOptions): string => {
  const { invoiceNumber, invoiceDate, dueDate, studentName, studentEmail, amount, description, reference } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #1A1A1A; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; background: white; }
    .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 3px solid #000000; padding-bottom: 30px; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; letter-spacing: 2px; }
    .logo-sub { font-size: 11px; color: #707070; letter-spacing: 1px; margin-top: 5px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; font-weight: 300; margin-bottom: 10px; }
    .invoice-title p { font-size: 12px; color: #707070; }
    
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; }
    .detail-section h3 { font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #000000; margin-bottom: 12px; }
    .detail-section p { font-size: 13px; margin-bottom: 8px; color: #333; }
    .detail-section .label { color: #707070; font-size: 11px; }
    
    .items-table { width: 100%; border-collapse: collapse; margin: 50px 0; }
    .items-table thead { background: #F5F5F5; border: 1px solid #E0E0E0; }
    .items-table th { padding: 15px 12px; text-align: left; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
    .items-table td { padding: 15px 12px; border-bottom: 1px solid #E0E0E0; font-size: 13px; }
    .items-table tr:last-child td { border-bottom: 2px solid #000000; }
    
    .summary { display: flex; justify-content: flex-end; margin: 30px 0; }
    .summary-section { width: 300px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; }
    .summary-row.total { font-size: 18px; font-weight: bold; border-top: 2px solid #000000; padding-top: 10px; }
    
    .terms { background: #F5F5F5; padding: 20px; border: 1px solid #E0E0E0; margin-top: 40px; font-size: 11px; line-height: 1.8; }
    .terms h3 { margin-bottom: 10px; font-size: 11px; font-weight: bold; }
    
    .footer { margin-top: 50px; padding-top: 30px; border-top: 1px solid #E0E0E0; text-align: center; font-size: 10px; color: #707070; }
    
    @media print {
      body { margin: 0; padding: 0; }
      .container { max-width: 100%; margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="logo">TECHLABS</div>
        <div class="logo-sub">ACADEMY SA</div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p>Invoice #${invoiceNumber}</p>
      </div>
    </div>

    <div class="details">
      <div class="detail-section">
        <h3>Bill To</h3>
        <p>${studentName}</p>
        <p>${studentEmail}</p>
      </div>
      <div class="detail-section">
        <h3>Invoice Details</h3>
        <div style="margin-bottom: 15px;">
          <div class="label">INVOICE DATE</div>
          <p>${invoiceDate}</p>
        </div>
        <div style="margin-bottom: 15px;">
          <div class="label">DUE DATE</div>
          <p>${dueDate}</p>
        </div>
        ${reference ? `<div>
          <div class="label">REFERENCE</div>
          <p>${reference}</p>
        </div>` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 60%;">Description</th>
          <th style="width: 20%;">Qty</th>
          <th style="text-align: right; width: 20%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${description}</td>
          <td>1</td>
          <td style="text-align: right;">R ${amount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-section">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>R ${amount.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Tax (0%)</span>
          <span>R 0.00</span>
        </div>
        <div class="summary-row total">
          <span>Total Due</span>
          <span>R ${amount.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="terms">
      <h3>Payment Instructions</h3>
      <p>
        Please transfer the invoice amount to the TechLabs Academy bank account. 
        Include the invoice number in your reference. Payment must be received by the due date to confirm your course enrollment.
      </p>
    </div>

    <div class="footer">
      <p>TechLabs Academy SA | Cape Town, South Africa | www.techlabs.co.za</p>
      <p>This is a computer-generated document. No signature is required.</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const generateInvoicePDF = async (options: InvoiceGenerationOptions): Promise<Buffer> => {
  // This would require a PDF library like pdfkit or puppeteer
  // For now, we'll return HTML that can be printed to PDF
  const html = generateInvoiceHTML(options);
  // In production, use puppeteer: await page.pdf({ content: html })
  return Buffer.from(html);
};

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

export interface DetailedInvoicePDFOptions extends InvoiceGenerationOptions {
  companyName: string;
  academyName: string;
  companyAddress: string;
  admissionsEmail: string;
  courseTier: string;
  studentPhone?: string;
  studentCity?: string;
  paidAmount: number;
  balanceAmount: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  paymentTerms: string[];
  payments: Array<{ date: string; type: string; amount: number; reference: string; status: string }>;
}

const pdfText = (value: unknown) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[^\x20-\x7E]/g, '-')
  .replace(/([\\()])/g, '\\$1');

const money = (amount: number) => `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const generateInvoicePDF = async (options: DetailedInvoicePDFOptions): Promise<Buffer> => {
  type Row = { text: string; bold?: boolean; size?: number; gap?: number; rule?: boolean; section?: boolean };
  const rows: Row[] = [
    { text: 'BILL TO', bold: true, size: 10, section: true },
    { text: options.studentName },
    { text: options.studentEmail },
    ...(options.studentPhone ? [{ text: `Phone / WhatsApp: ${options.studentPhone}` }] : []),
    ...(options.studentCity ? [{ text: `City: ${options.studentCity}` }] : []),
    { text: `Application / EFT reference: ${options.reference || options.invoiceNumber}`, bold: true, gap: 14 },
    { text: 'COURSE FEES', bold: true, size: 10, section: true },
    { text: `${options.description} (${options.courseTier})` },
    { text: `Total tuition: ${money(options.amount)}` },
    { text: `Paid to date: ${money(options.paidAmount)}` },
    { text: `OUTSTANDING BALANCE: ${money(options.balanceAmount)}`, bold: true, size: 14, gap: 14 },
    { text: 'PAYMENT HISTORY', bold: true, size: 10, section: true },
    ...(options.payments.length ? options.payments.map(payment => ({ text: `${payment.date} | ${payment.type} | ${money(payment.amount)} | Ref: ${payment.reference} | ${payment.status}`, size: 9 })) : [{ text: 'No verified payments recorded.', size: 9 }]),
    { text: '', gap: 8 },
    { text: 'EFT BANKING DETAILS', bold: true, size: 10, section: true },
    { text: `Bank: ${options.bankName}` },
    { text: `Account name: ${options.accountName}` },
    { text: `Account number: ${options.accountNumber}` },
    { text: `Branch code: ${options.branchCode}` },
    { text: `Payment reference: ${options.reference || options.invoiceNumber}`, bold: true, gap: 14 },
    { text: 'PAYMENT TERMS', bold: true, size: 10, section: true },
    ...options.paymentTerms.map((term, index) => ({ text: `${index + 1}. ${term}`, size: 9 })),
    { text: '', gap: 12 },
    { text: 'This is a computer-generated invoice. No signature is required.', size: 8 },
  ];

  const pageStreams: string[] = [];
  let commands: string[] = [];
  // Keep the first content section clear of the company and invoice metadata.
  let y = 680;
  const startPage = () => {
    commands.push(
      '0 g 50 785 m 60 795 l 70 785 l 60 775 l h f',
      `BT /F2 18 Tf 0 g 82 780 Td (${pdfText('TECHLABS')}) Tj ET`,
      '0.6 G 0.8 w 177 777 24 14 re S 0 G',
      `BT /F2 7 Tf 0.35 g 183 782 Td (${pdfText('SA')}) Tj ET`,
      `BT /F2 24 Tf 0 g 430 780 Td (${pdfText('INVOICE')}) Tj ET`,
      `BT /F1 8 Tf 0.4 g 430 763 Td (${pdfText(`# ${options.invoiceNumber}`)}) Tj ET`,
      '0 g 50 748 495 2 re f',
      `BT /F2 8 Tf 0 g 50 730 Td (${pdfText(options.companyName)}) Tj ET`,
      `BT /F1 8 Tf 0.4 g 50 717 Td (${pdfText(`${options.companyAddress} | ${options.admissionsEmail}`)}) Tj ET`,
      `BT /F2 8 Tf 0 g 385 730 Td (${pdfText(`ISSUED  ${options.invoiceDate}`)}) Tj ET`,
      `BT /F2 8 Tf 0 g 385 717 Td (${pdfText(`DUE     ${options.dueDate}`)}) Tj ET`,
    );
  };
  startPage();
  const finishPage = () => {
    commands.push(`0.7 w 50 38 m 545 38 l S`, `BT /F1 8 Tf 0.4 g 50 24 Td (${pdfText(`${options.academyName} | ${options.invoiceNumber}`)}) Tj ET`);
    pageStreams.push(commands.join('\n'));
    commands = [];
    y = 680;
    startPage();
  };
  for (const row of rows) {
    const size = row.size || 10;
    const lineHeight = size + (row.gap ?? 6);
    if (y - lineHeight < 55) finishPage();
    if (row.rule) commands.push(`0.85 G 0.5 w 50 ${y + 7} m 545 ${y + 7} l S 0 G`);
    if (row.section) commands.push(`0.95 g 50 ${y - 5} 495 20 re f 0 g`);
    if (row.text) commands.push(`BT /${row.bold ? 'F2' : 'F1'} ${size} Tf ${row.section ? '0.15' : '0'} g ${row.section ? 58 : 50} ${y} Td (${pdfText(row.text)}) Tj ET`);
    y -= lineHeight;
  }
  finishPage();

  const objects: string[] = ['', '', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'];
  const pageRefs: number[] = [];
  for (const stream of pageStreams) {
    const pageId = objects.length;
    const contentId = pageId + 1;
    pageRefs.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
  }
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Count ${pageRefs.length} /Kids [${pageRefs.map(id => `${id} 0 R`).join(' ')}] >>`;

  let output = '%PDF-1.4\n%TechLabs\n';
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = Buffer.byteLength(output, 'latin1');
    output += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(output, 'latin1');
  output += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) output += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output, 'latin1');
};

export interface BrandedDocumentPDFOptions {
  documentTitle: string;
  documentNumber: string;
  issuedDate: string;
  companyName: string;
  academyName: string;
  companyAddress: string;
  admissionsEmail: string;
  sections: Array<{ heading: string; lines: Array<{ label?: string; value: string; bold?: boolean }> }>;
  closingNote?: string;
}

export const generateBrandedDocumentPDF = (options: BrandedDocumentPDFOptions): Buffer => {
  const commands: string[] = [
    '0 g 50 785 m 60 795 l 70 785 l 60 775 l h f',
    `BT /F2 18 Tf 0 g 82 780 Td (${pdfText('TECHLABS')}) Tj ET`,
    '0.6 G 0.8 w 177 777 24 14 re S 0 G',
    `BT /F2 7 Tf 0.35 g 183 782 Td (${pdfText('SA')}) Tj ET`,
    `BT /F2 14 Tf 0 g 320 780 Td (${pdfText(options.documentTitle.toUpperCase())}) Tj ET`,
    `BT /F1 8 Tf 0.4 g 430 763 Td (${pdfText(`# ${options.documentNumber}`)}) Tj ET`,
    '0 g 50 748 495 2 re f',
    `BT /F2 8 Tf 0 g 50 730 Td (${pdfText(options.companyName)}) Tj ET`,
    `BT /F1 8 Tf 0.4 g 50 717 Td (${pdfText(`${options.companyAddress} | ${options.admissionsEmail}`)}) Tj ET`,
    `BT /F2 8 Tf 0 g 430 730 Td (${pdfText(`ISSUED  ${options.issuedDate}`)}) Tj ET`,
  ];
  let y = 675;
  for (const section of options.sections) {
    commands.push('0.95 g 50 ' + (y - 5) + ' 495 20 re f 0 g', `BT /F2 10 Tf 0.15 g 58 ${y} Td (${pdfText(section.heading.toUpperCase())}) Tj ET`);
    y -= 32;
    for (const line of section.lines) {
      const text = line.label ? `${line.label}: ${line.value}` : line.value;
      commands.push(`BT /${line.bold ? 'F2' : 'F1'} ${line.bold ? 11 : 10} Tf 0 g 50 ${y} Td (${pdfText(text)}) Tj ET`);
      y -= line.bold ? 22 : 18;
    }
    y -= 8;
  }
  if (options.closingNote) commands.push(`BT /F1 8 Tf 0.4 g 50 ${Math.max(y, 65)} Td (${pdfText(options.closingNote)}) Tj ET`);
  commands.push('0.7 w 50 38 m 545 38 l S', `BT /F1 8 Tf 0.4 g 50 24 Td (${pdfText(`${options.academyName} | ${options.documentNumber} | Computer-generated document`)}) Tj ET`);
  const stream = commands.join('\n');
  const objects = [
    '',
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Count 1 /Kids [5 0 R] >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 6 0 R >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
  ];
  let output = '%PDF-1.4\n%TechLabs\n';
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) { offsets[index] = Buffer.byteLength(output, 'latin1'); output += `${index} 0 obj\n${objects[index]}\nendobj\n`; }
  const xref = Buffer.byteLength(output, 'latin1');
  output += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) output += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output, 'latin1');
};

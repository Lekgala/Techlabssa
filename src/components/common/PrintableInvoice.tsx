import React, { useRef } from 'react';
import { Invoice, PaymentInstallment } from '../../types';
import { Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PrintableInvoiceProps {
  invoice: Invoice;
  installments?: PaymentInstallment[];
  allowPrint?: boolean;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, installments = [], allowPrint = true }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { settings, payments } = useApp();

  if (!invoice) {
    return (
      <div className="p-8 text-center text-xs text-[#707070] bg-[#FAFAFA] rounded-xl border border-[#E0E0E0]">
        Invoice data is unavailable.
      </div>
    );
  }

  const handlePrint = () => {
    if (!containerRef.current) {
      window.print();
      return;
    }

    const originalBody = document.body.innerHTML;
    const printableNode = containerRef.current.cloneNode(true) as HTMLElement;
    printableNode.querySelectorAll('.no-print').forEach((node) => node.remove());

    document.body.innerHTML = '';
    document.body.appendChild(printableNode);

    const restoreBody = () => {
      document.body.innerHTML = originalBody;
      window.removeEventListener('afterprint', restoreBody);
      window.location.reload();
    };

    window.addEventListener('afterprint', restoreBody, { once: true });
    requestAnimationFrame(() => window.print());
  };

  const amountPaid = invoice.paidZAR ?? Math.max(0, invoice.amountZAR - invoice.balanceZAR);
  const currentBalanceDue = invoice.balanceZAR;
  const invoicePayments = payments.filter(payment => payment.invoiceId === invoice.id).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  return (
    <div className="space-y-4">
      {allowPrint && (
        <div className="flex justify-end no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice to PDF</span>
          </button>
        </div>
      )}

      <div ref={containerRef} className="certificate-page relative overflow-hidden bg-[#FFFFFF] text-[#1A1A1A] p-8 sm:p-12 rounded-2xl border border-[#D8D8D8] shadow-xl max-w-4xl mx-auto space-y-8 font-sans">
        <div className="absolute inset-x-0 top-0 h-2 bg-black" />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-[#000000] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-black rotate-45 inline-block shrink-0" />
              <span className="font-bold text-2xl tracking-tighter uppercase text-[#000000]">TechLabs</span>
              <span className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-[#000000] border border-[#000000] px-2 py-0.5 rounded">SA</span>
            </div>
            <p className="text-xs font-bold text-[#707070] uppercase mt-1 tracking-wider">
              {settings?.companyName || 'Madilotane Design (Pty) Ltd'} trading as TechLabs Academy SA
            </p>
            <p className="text-[11px] text-[#707070]">{settings?.campusAddress || settings?.location || 'Cape Town, South Africa'} • {settings?.admissionsEmail}</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-white bg-[#000000] px-3 py-1 rounded-full tracking-[0.2em]">
              INVOICE
            </span>
            <h2 className="text-xl font-mono font-bold text-[#000000] pt-1">{invoice.invoiceNumber}</h2>
            <p className="text-[11px] text-[#707070] font-mono">Date Issued: {invoice.invoiceDate || 'Not recorded'}</p>
            <p className="text-[11px] text-[#707070] font-mono">Due Date: {invoice.dueDate}</p>
          </div>
        </div>

        {/* Bill To & Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FAFAFA] p-6 rounded-xl border border-[#E0E0E0]">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#A0A0A0] font-bold block">Billed To (Student):</span>
            <strong className="text-base text-[#000000] block">{invoice.studentName}</strong>
            <p className="text-xs text-[#707070] font-mono">{invoice.studentEmail}</p>
            <p className="text-xs text-[#707070]">Course Tier: <strong className="text-[#000000] font-mono">{invoice.courseTier}</strong></p>
          </div>

          <div className="space-y-2 sm:text-right flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#A0A0A0] font-bold block">Invoice & Payment Status:</span>
              <span className={`inline-block text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                invoice.balanceZAR === 0 && invoice.status === 'VERIFIED'
                  ? 'bg-[#000000] text-white border-[#000000]'
                  : ['PARTIALLY_PAID', 'VERIFIED'].includes(invoice.status)
                  ? 'bg-[#E0E0E0] text-[#000000] border-[#000000]'
                  : 'bg-[#FAFAFA] text-[#707070] border-[#E0E0E0]'
              }`}>
                {invoice.balanceZAR === 0 && invoice.status === 'VERIFIED'
                  ? 'PAID IN FULL — R0 BALANCE'
                  : ['PARTIALLY_PAID', 'VERIFIED'].includes(invoice.status)
                  ? `PAYMENT VERIFIED — R${invoice.balanceZAR.toLocaleString()} BALANCE DUE`
                  : invoice.status === 'AWAITING_VERIFICATION' ? 'PAYMENT AWAITING VERIFICATION' : 'PAYMENT PENDING'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#A0A0A0] font-bold block">Payment Method:</span>
              <span className="text-xs font-mono font-bold text-[#000000]">{invoice.paymentMethod || 'EFT'}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#000000] text-white uppercase text-[10px] tracking-wider">
                <th className="p-3.5 font-bold">Item Description</th>
                <th className="p-3.5 font-bold">Payment Plan</th>
                <th className="p-3.5 font-bold text-right">Total Fee (ZAR)</th>
              </tr>
            </thead>
            <tbody className="divide-y border-b border-[#E0E0E0]">
              <tr>
                <td className="p-4">
                  <strong className="text-[#000000] block font-sans text-sm">TechLabs IT Support Bootcamp ({invoice.courseTier})</strong>
                  <span className="text-[11px] text-[#707070]">15-Module Enterprise Infrastructure, VMware, AD & M365 Labs</span>
                </td>
                <td className="p-4 uppercase text-[#707070]">
                  {invoice.paymentOption === 'DEPOSIT' ? 'Deposit + Installments' : 'Full Payment'}
                </td>
                <td className="p-4 text-right font-bold text-[#000000] text-sm">
                  R{invoice.amountZAR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Balance Realtime Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-[#E0E0E0] pt-6 font-mono">
          <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#E0E0E0] text-xs space-y-2 max-w-sm">
            <strong className="text-[#000000] block font-bold text-[11px] uppercase tracking-wider">Bank Details for EFT:</strong>
            <p className="text-[11px] text-[#707070]">
              Bank: <strong>{settings?.bankName || 'First National Bank (FNB)'}</strong><br />
              Account Name: <strong>{settings?.accountName || 'Madilotane Design (Pty) Ltd'}</strong><br />
              Account Number: <strong>{settings?.accountNumber || '62899451201'}</strong><br />
              Branch Code: <strong>{settings?.branchCode || '250655'}</strong><br />
              Reference: <strong className="text-[#000000]">{invoice.invoiceNumber}</strong>
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-[#707070]">
              <span>Total Course Fee:</span>
              <span>R{invoice.amountZAR.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {(invoice.discountZAR ?? 0) > 0 && <>
              <div className="flex justify-between text-[#707070]">
                <span>List price:</span>
                <span className="line-through">R{(invoice.listPriceZAR ?? invoice.amountZAR).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[#008000]">
                <span>Flash-sale discount ({invoice.discountPercent ?? 0}%):</span>
                <span>-R{invoice.discountZAR.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </>}
            <div className="flex justify-between text-[#707070]">
              <span>Seat Deposit Required:</span>
              <span>R{invoice.depositZAR.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[#707070] border-b border-[#E0E0E0] pb-2">
              <span>Amount Paid To Date:</span>
              <span className="font-bold text-[#000000]">R{amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#000000] pt-1">
              <span>Outstanding Balance Due:</span>
              <span className={currentBalanceDue > 0 ? 'text-[#CC0000]' : 'text-[#008000]'}>
                R{currentBalanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {installments.length > 0 && <div className="space-y-3">
          <div className="bg-[#F3F3F3] px-4 py-2 text-[10px] font-bold font-mono tracking-[0.18em] uppercase">Installment Schedule</div>
          <div className="divide-y divide-[#E0E0E0] border-y border-[#E0E0E0]">
            {installments.map(item => <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-3 py-2.5 text-[10px] font-mono"><span>{item.sequence}. {item.label}</span><span>Due {item.dueDate}</span><strong>R{item.amountZAR.toLocaleString(undefined, { minimumFractionDigits: 2 })} · {item.status}</strong></div>)}
          </div>
        </div>}

        <div className="space-y-3">
          <div className="bg-[#F3F3F3] px-4 py-2 text-[10px] font-bold font-mono tracking-[0.18em] uppercase">Payment History</div>
          {invoicePayments.length ? (
            <div className="divide-y divide-[#E0E0E0] border-y border-[#E0E0E0]">
              {invoicePayments.map(payment => (
                <div key={payment.id} className="grid grid-cols-2 sm:grid-cols-5 gap-2 py-2.5 text-[10px] font-mono">
                  <span>{(payment.verifiedAt || payment.submittedAt).slice(0, 10)}</span>
                  <span>{payment.type}</span>
                  <strong>R{payment.amountZAR.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  <span className="truncate">{payment.eftReference}</span>
                  <strong className="sm:text-right">{payment.status}</strong>
                </div>
              ))}
            </div>
          ) : <p className="text-[11px] text-[#707070]">No payments recorded against this invoice.</p>}
        </div>

        {/* Footer Guarantee */}
        <div className="border-t border-[#E0E0E0] pt-4 text-center text-[10px] font-mono text-[#707070]">
          {settings?.academyName || 'TechLabs Academy SA'} • Computer-generated invoice • No signature required.
        </div>
      </div>
    </div>
  );
};

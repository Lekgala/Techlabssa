import React, { useState } from 'react';
import { FileText, Eye, Download, Plus, Printer } from 'lucide-react';
import { PrintableInvoice } from '../common/PrintableInvoice';
import { Invoice, CourseTier, PaymentOption } from '../../types';

interface InvoiceGeneratorUIProps {
  applications: any[];
  onGenerateInvoice: (params: {
    studentName: string;
    studentEmail: string;
    amount: number;
    description: string;
    invoiceNumber: string;
    dueDate: string;
    courseTier?: CourseTier;
    depositZAR?: number;
    balanceZAR?: number;
    paymentOption?: PaymentOption;
  }) => Promise<void>;
  cohorts: any[];
}

export const InvoiceGeneratorUI: React.FC<InvoiceGeneratorUIProps> = ({
  applications,
  onGenerateInvoice,
  cohorts,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const tierPrices: Record<CourseTier, number> = {
    STARTER: 1999,
    PROFESSIONAL: 3499,
    CAREER_ACCELERATOR: 4999,
  };

  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    studentEmail: '',
    courseTier: 'PROFESSIONAL' as CourseTier,
    paymentOption: 'DEPOSIT' as PaymentOption,
    amount: 3499,
    depositZAR: 1000,
    balanceZAR: 2499,
    description: 'IT Support & Enterprise Administration Bootcamp (PROFESSIONAL Tier)',
    invoiceNumber: `INV-TLS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);

  const handleSelectStudent = (studentId: string) => {
    const student = applications.find(a => a.id === studentId);
    if (student) {
      const tier: CourseTier = student.selectedTier || 'PROFESSIONAL';
      const option: PaymentOption = student.paymentOption || 'DEPOSIT';
      const total = tierPrices[tier] || 3499;
      const deposit = option === 'DEPOSIT' ? 1000 : total;
      const balance = total - deposit;

      setFormData({
        ...formData,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        studentEmail: student.email,
        courseTier: tier,
        paymentOption: option,
        amount: total,
        depositZAR: deposit,
        balanceZAR: balance,
        description: `IT Support Bootcamp (${tier} Tier)`,
      });
    }
  };

  const handleTierChange = (tier: CourseTier) => {
    const total = tierPrices[tier] || 3499;
    const deposit = formData.paymentOption === 'DEPOSIT' ? 1000 : total;
    const balance = total - deposit;
    setFormData({
      ...formData,
      courseTier: tier,
      amount: total,
      depositZAR: deposit,
      balanceZAR: balance,
      description: `IT Support Bootcamp (${tier} Tier)`
    });
  };

  const handlePaymentOptionChange = (option: PaymentOption) => {
    const deposit = option === 'DEPOSIT' ? 1000 : formData.amount;
    const balance = formData.amount - deposit;
    setFormData({
      ...formData,
      paymentOption: option,
      depositZAR: deposit,
      balanceZAR: balance
    });
  };

  const handleGeneratePreview = () => {
    const sampleInvoice: Invoice = {
      id: 'inv-preview-' + Date.now(),
      invoiceNumber: formData.invoiceNumber,
      studentName: formData.studentName || 'Student Name',
      studentEmail: formData.studentEmail || 'student@email.com',
      courseTier: formData.courseTier,
      amountZAR: formData.amount,
      depositZAR: formData.depositZAR,
      balanceZAR: formData.balanceZAR,
      paymentOption: formData.paymentOption,
      status: 'PENDING',
      dueDate: formData.dueDate,
      paymentMethod: 'EFT'
    };
    setSelectedInvoiceForModal(sampleInvoice);
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      await onGenerateInvoice(formData);
      // In real implementation, trigger PDF download
      alert(`Invoice ${formData.invoiceNumber} generated for ${formData.studentName}`);
      setShowForm(false);
      setFormData({
        ...formData,
        studentId: '',
        studentName: '',
        studentEmail: '',
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      });
    } catch (err) {
      alert('Failed to generate invoice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Invoice Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 uppercase tracking-wide"
        >
          <Plus className="w-4 h-4" />
          Generate New Invoice
        </button>
      )}

      {showForm && (
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-[#000000] text-lg">Generate Invoice</h3>

          {/* Student Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider">
              Select Student / Application
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => handleSelectStudent(e.target.value)}
              className="w-full p-3 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:border-[#000000]"
            >
              <option value="">-- Choose student --</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.firstName} {app.lastName} ({app.email})
                </option>
              ))}
            </select>
          </div>

          {/* Course Tier & Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider">
                Course Tier
              </label>
              <select
                value={formData.courseTier}
                onChange={(e) => handleTierChange(e.target.value as CourseTier)}
                className="w-full p-2.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:border-[#000000]"
              >
                <option value="STARTER">Starter Tier (R1,999)</option>
                <option value="PROFESSIONAL">Professional Tier (R3,499)</option>
                <option value="CAREER_ACCELERATOR">Career Accelerator Tier (R4,999)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider">
                Payment Option
              </label>
              <select
                value={formData.paymentOption}
                onChange={(e) => handlePaymentOptionChange(e.target.value as PaymentOption)}
                className="w-full p-2.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:border-[#000000]"
              >
                <option value="DEPOSIT">R1,000 Seat Deposit + Installments</option>
                <option value="FULL">Full Upfront Tuition</option>
              </select>
            </div>
          </div>

          {/* Realtime Breakdown Card */}
          <div className="p-4 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl grid grid-cols-3 gap-3 font-mono text-xs text-center">
            <div>
              <span className="text-[#707070] text-[10px] block uppercase">Total Tuition</span>
              <strong className="text-[#000000] text-sm">R{formData.amount.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-[#707070] text-[10px] block uppercase">Deposit Due</span>
              <strong className="text-[#000000] text-sm">R{formData.depositZAR.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-[#707070] text-[10px] block uppercase">Balance Due</span>
              <strong className="text-[#CC0000] text-sm">R{formData.balanceZAR.toLocaleString()}</strong>
            </div>
          </div>

          {/* Student Name */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider">
              Student Name
            </label>
            <input
              type="text"
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              className="w-full p-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:border-[#000000]"
            />
          </div>

          {/* Student Email */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider">
              Student Email
            </label>
            <input
              type="email"
              value={formData.studentEmail}
              onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
              className="w-full p-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:border-[#000000]"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full p-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:border-[#000000]"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#000000] uppercase tracking-wider">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full p-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:border-[#000000]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-[#E0E0E0] hover:bg-[#F5F5F5] text-[#000000] font-bold text-xs rounded-lg transition uppercase tracking-wide"
            >
              Cancel
            </button>
            <button
              onClick={handleGeneratePreview}
              disabled={isLoading || !formData.studentName}
              className="px-4 py-2 bg-[#000000] hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 uppercase tracking-wide shadow"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview & Printable PDF
            </button>
            <button
              onClick={handleDownload}
              disabled={isLoading || !formData.studentName}
              className="px-4 py-2 bg-[#006600] hover:bg-[#004D00] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 uppercase tracking-wide shadow"
            >
              <Download className="w-3.5 h-3.5" />
              Issue & Save Invoice
            </button>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4">
            <div className="sticky top-0 bg-white border-b border-[#E0E0E0] pb-3 flex items-center justify-between z-10">
              <h3 className="font-bold text-[#000000] text-sm uppercase tracking-wider">Official Printable Tax Invoice</h3>
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="px-4 py-1.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs rounded-xl uppercase tracking-wider"
              >
                Close Preview
              </button>
            </div>
            <PrintableInvoice invoice={selectedInvoiceForModal} allowPrint={true} />
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COURSE_MODULES } from '../../data/mockData';
import { TicketCard } from '../../components/common/TicketCard';
import { LabPilotPanel } from '../../components/common/LabPilotPanel';
import { CertificateView } from '../../components/common/CertificateView';
import { PrintableInvoice } from '../../components/common/PrintableInvoice';
import { apiOpenPrivate, apiRequest } from '../../lib/api';
import type { PaymentInstallment } from '../../types';
import { buildCohortCalendar, buildCurriculumSchedule } from '../../lib/curriculumSchedule';
import { 
  Layers, 
  CheckCircle, 
  Clock, 
  Terminal, 
  MessageSquare, 
  Award, 
  AlertTriangle, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  FolderOpen,
  FileText,
  Receipt,
  CalendarDays,
  Building2,
  Copy
} from 'lucide-react';

const displayStatus = (status: string) => status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());

const DocumentCard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  available: boolean;
  actionLabel: string;
  onAction: () => void;
}> = ({ icon: Icon, title, detail, available, actionLabel, onAction }) => (
  <article className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] shadow-sm space-y-4 flex flex-col justify-between">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="w-9 h-9 rounded-lg bg-[#FAFAFA] border border-[#E0E0E0] flex items-center justify-center"><Icon className="w-4 h-4" /></span>
        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${available ? 'text-[#008000]' : 'text-[#707070]'}`}>{available ? 'Available' : 'Not yet available'}</span>
      </div>
      <div><h4 className="font-bold text-sm text-[#000000]">{title}</h4><p className="text-[11px] text-[#707070] mt-1">{detail}</p></div>
    </div>
    <button type="button" disabled={!available} onClick={onAction} className="w-full py-2.5 bg-[#000000] disabled:bg-[#E0E0E0] disabled:text-[#707070] text-white font-bold text-[10px] rounded-lg uppercase tracking-wider transition">{actionLabel}</button>
  </article>
);

export const StudentDashboard: React.FC = () => {
  const { 
    currentStudent, 
    tickets, 
    updateTicketStatus, 
    cohorts, 
    certificates, 
    settings,
    courseModules,
    applications,
    invoices,
    payments,
    assessments,
    paymentSettings,
    uploadProofOfPayment,
    navigate 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CALENDAR' | 'MODULES' | 'PAYMENTS' | 'DOCUMENTS' | 'TICKETS' | 'CERTIFICATE'>('OVERVIEW');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date().toISOString().slice(0, 7));
  const [eftReference, setEftReference] = useState('');
  const [selectedPopFile, setSelectedPopFile] = useState<File | null>(null);
  const [uploadingPop, setUploadingPop] = useState(false);
  const [popError, setPopError] = useState('');
  const [bankDetailsCopied, setBankDetailsCopied] = useState(false);

  // Resolution modal state
  const [resolutionText, setResolutionText] = useState('');

  const studentCohort = (cohorts || []).find(c => c.id === currentStudent?.cohortId);

  const studentApp = (applications || []).find(
    a => a.email.trim().toLowerCase() === (currentStudent?.email || '').trim().toLowerCase()
  );

  const studentInvoice = (invoices || []).find(
    i => i.studentEmail.trim().toLowerCase() === (currentStudent?.email || '').trim().toLowerCase()
  );
  useEffect(() => { if (studentInvoice) void apiRequest<PaymentInstallment[]>('/student/payment-plan').then(setInstallments).catch(() => setInstallments([])); else setInstallments([]); }, [studentInvoice?.id, studentInvoice?.paidZAR]);

  const isFullyEnrolled = studentApp?.status === 'ENROLLED' || studentApp?.status === 'COMPLETED';

  const studentCert = (certificates && certificates.length > 0)
    ? certificates.find(c => c.studentId === currentStudent?.id)
    : undefined;

  const assignedTickets = (tickets || []).filter(t => t?.assignedStudentId === currentStudent?.id);
  const studentPayments = (payments || []).filter(payment => payment.studentId === currentStudent?.id);
  const verifiedPayments = studentPayments.filter(payment => payment.status === 'VERIFIED');
  const paymentAwaitingReview = studentPayments.some(payment => payment.status === 'SUBMITTED');
  const canSubmitPayment = Boolean(studentInvoice?.balanceZAR && ['APPROVED', 'PAYMENT_REQUIRED', 'ENROLLED'].includes(studentApp?.status || '') && !paymentAwaitingReview);
  const nextStep = useMemo(() => {
    const status = studentApp?.status;
    if (!studentApp) return { title: 'Contact admissions', detail: 'We could not match an application to this account.', action: 'Contact admissions', kind: 'contact' as const };
    if (status === 'REJECTED' || status === 'WITHDRAWN') return { title: status === 'REJECTED' ? 'Application decision recorded' : 'Application withdrawn', detail: studentApp.adminNotes || 'Contact admissions if you need clarification about this decision.', action: 'Contact admissions', kind: 'contact' as const };
    if (status === 'WAITLISTED') return { title: 'You are on the cohort waitlist', detail: 'No further payment is required right now. Admissions will contact you when a suitable seat becomes available.', action: 'View documents', kind: 'documents' as const };
    if (status === 'NEW' || status === 'UNDER_REVIEW') return { title: 'Admissions is reviewing your application', detail: 'No action is required unless admissions asks for more information. We will email you after the hardware review.', action: 'View application documents', kind: 'documents' as const };
    if (paymentAwaitingReview) return { title: 'Your proof of payment is under review', detail: 'Admissions will compare it with the bank statement. Do not upload the same POP again while verification is pending.', action: 'View submitted POP', kind: 'documents' as const };
    if ((status === 'APPROVED' || status === 'PAYMENT_REQUIRED') && studentInvoice?.balanceZAR) return { title: 'Secure your seat', detail: 'View the banking details, pay the required amount, and upload your proof of payment for verification.', action: 'View banking details', kind: 'payment' as const };
    if (status === 'COMPLETED') return { title: 'Course completed', detail: 'Your course records remain available. Open the document centre for your certificate and payment records.', action: 'View completion documents', kind: 'documents' as const };
    if (status === 'ENROLLED' && studentInvoice?.balanceZAR) return { title: 'Continue learning and manage your balance', detail: `Your seat is secured. R${studentInvoice.balanceZAR.toLocaleString('en-ZA')} remains payable according to your payment plan.`, action: 'Pay balance', kind: 'payment' as const };
    return { title: 'Continue your course', detail: 'Your seat is active and your learning resources are available below.', action: 'Open modules', kind: 'modules' as const };
  }, [studentApp, studentInvoice?.balanceZAR, paymentAwaitingReview]);

  const runNextStep = () => {
    if (nextStep.kind === 'payment') setActiveTab('PAYMENTS');
    else if (nextStep.kind === 'documents') setActiveTab('DOCUMENTS');
    else if (nextStep.kind === 'modules') setActiveTab('MODULES');
    else window.location.href = `mailto:${settings.admissionsEmail}?subject=${encodeURIComponent(`Student portal query - ${studentApp?.referenceNumber || currentStudent?.email || ''}`)}`;
  };

  const copyBankDetails = async () => {
    if (!paymentSettings || !studentInvoice) return;
    try {
      await navigator.clipboard.writeText(`Bank: ${paymentSettings.bankName}\nAccount name: ${paymentSettings.accountName}\nAccount number: ${paymentSettings.accountNumber}\nBranch code: ${paymentSettings.branchCode}\nEFT reference: ${studentInvoice.invoiceNumber}`);
      setBankDetailsCopied(true);
      window.setTimeout(() => setBankDetailsCopied(false), 3_000);
    } catch {
      setPopError('Could not copy the banking details. Please copy them from the details shown below.');
    }
  };

  const selectPopFile = (file?: File) => {
    setPopError('');
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setSelectedPopFile(null);
      setPopError('Choose a PDF, JPG, or PNG proof of payment.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSelectedPopFile(null);
      setPopError('The proof of payment must be 5 MB or smaller.');
      return;
    }
    setSelectedPopFile(file);
  };

  const submitPop = async () => {
    if (!studentInvoice || !selectedPopFile || !eftReference.trim()) {
      setPopError('Enter the EFT reference and choose a proof of payment before submitting.');
      return;
    }
    setUploadingPop(true);
    setPopError('');
    const uploaded = await uploadProofOfPayment(studentInvoice.id, selectedPopFile, eftReference.trim());
    if (uploaded) {
      setSelectedPopFile(null);
      setEftReference('');
    }
    setUploadingPop(false);
  };

  const openDocument = async (path: string) => {
    setDocumentError('');
    try { await apiOpenPrivate(path); }
    catch (error) { setDocumentError(error instanceof Error ? error.message : 'The PDF could not be opened.'); }
  };

  const modulesToUse = ((courseModules && courseModules.length > 0) ? courseModules : COURSE_MODULES).filter(module => module.published !== false);
  const scheduledModules = useMemo(() => buildCurriculumSchedule(modulesToUse, studentCohort), [modulesToUse, studentCohort]);
  const calendarEvents = useMemo(() => buildCohortCalendar(modulesToUse, studentCohort), [modulesToUse, studentCohort]);
  const nextCalendarEvent = useMemo(() => calendarEvents.find(event => event.date >= new Date().toISOString().slice(0, 10)) || calendarEvents.at(-1), [calendarEvents]);
  useEffect(() => { if (studentCohort?.startDate) setCalendarMonth(studentCohort.startDate.slice(0, 7)); }, [studentCohort?.id]);
  const calendarDays = useMemo(() => {
    const monthStart = new Date(`${calendarMonth}-01T12:00:00.000Z`);
    if (!Number.isFinite(monthStart.getTime())) return [];
    const gridStart = new Date(monthStart); gridStart.setUTCDate(1 - ((monthStart.getUTCDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => { const date = new Date(gridStart); date.setUTCDate(gridStart.getUTCDate() + index); return { iso: date.toISOString().slice(0, 10), day: date.getUTCDate(), inMonth: date.getUTCMonth() === monthStart.getUTCMonth() }; });
  }, [calendarMonth]);
  const moveCalendarMonth = (offset: number) => { const date = new Date(`${calendarMonth}-01T12:00:00.000Z`); date.setUTCMonth(date.getUTCMonth() + offset); setCalendarMonth(date.toISOString().slice(0, 7)); };
  const portalTabs = [
    { id: 'OVERVIEW', label: 'Home', icon: Sparkles },
    { id: 'CALENDAR', label: 'Calendar', icon: CalendarDays },
    { id: 'MODULES', label: 'Learning', icon: Layers },
    { id: 'PAYMENTS', label: 'Payments', icon: Receipt },
    { id: 'DOCUMENTS', label: 'Documents', icon: FolderOpen },
    { id: 'TICKETS', label: 'Support', icon: MessageSquare },
    { id: 'CERTIFICATE', label: 'Certificate', icon: Award },
  ] as const;

  const moduleProgress = useMemo(() => {
    if (!modulesToUse.length) {
      return { completedModules: 0, progressPercent: 0, totalModules: 0 };
    }
    const verifiedModules = new Set<number>();
    assessments.filter(item => item.status === 'Graded' && (item.studentScore ?? 0) >= 80).forEach(item => verifiedModules.add(item.moduleNumber));
    const completedModules = verifiedModules.size;

    return {
      completedModules,
      totalModules: modulesToUse.length,
      progressPercent: Math.min(100, Math.round((completedModules / modulesToUse.length) * 100))
    };
  }, [modulesToUse, assessments]);

  const handleResolveTicket = (ticketId: string) => {
    if (!resolutionText.trim()) {
      alert('Please describe your root cause analysis and resolution steps.');
      return;
    }
    updateTicketStatus(ticketId, 'RESOLVED', resolutionText);
    setSelectedTicketId(null);
    setResolutionText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#FFFFFF] text-[#1A1A1A]">
      {/* Student Welcome & Status Banner */}
      <div className="bg-[#FAFAFA] text-[#1A1A1A] rounded-2xl p-6 sm:p-8 border border-[#E0E0E0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-bold text-white px-2.5 py-0.5 rounded-full uppercase tracking-[0.2em] ${
              isFullyEnrolled ? 'bg-[#000000]' : 'bg-[#E08A00]'
            }`}>
              {isFullyEnrolled ? 'Enrolled Student Portal' : `Application status: ${displayStatus(studentApp?.status || 'UNDER_REVIEW')}`}
            </span>
            <span className="text-xs text-[#707070] font-mono">
              Cohort: {studentCohort?.name || 'Assignment pending'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
            Welcome back, {currentStudent?.firstName || currentStudent?.name?.split(' ')[0] || 'Student'}
          </h1>

          <p className="text-xs sm:text-sm text-[#707070] max-w-xl leading-relaxed">
            {settings.studentWelcomeMessage || (isFullyEnrolled ? (
              <>{studentCohort?.name || 'Your TechLabs cohort'} • {studentCohort?.scheduleFormat || 'Course schedule available in your document centre'}.</>
            ) : (
              <>Your application is currently being processed by admissions. Once approved and fully enrolled, full course modules, lab blueprints, and tickets will unlock below.</>
            ))}
          </p>
        </div>

        {isFullyEnrolled && <div className="flex flex-wrap items-center gap-3">
          <a
            href={`https://wa.me/${(settings?.studentSupportWhatsappNumber || settings?.whatsappNumber || '+27821234567').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi TechLabs Student Support, I need assistance. Student: ${currentStudent?.name || currentStudent?.email || ''}. Reference: ${studentApp?.referenceNumber || ''}. Cohort: ${studentCohort?.name || 'Not assigned'}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] flex items-center gap-1.5 transition shadow"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Student Support Chat</span>
          </a>

          {studentCohort?.teamsChannelUrl && <a
            href={studentCohort.teamsChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#E0E0E0] transition"
          >
            Open Teams Channel
          </a>}

          <button
            onClick={() => setActiveTab('TICKETS')}
            className="px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#E0E0E0] transition"
          >
            Support Tickets ({assignedTickets.filter(t => t.status === 'IN_PROGRESS').length} Active)
          </button>
        </div>}
      </div>

      <nav className="bg-[#FAFAFA] p-1.5 rounded-xl border border-[#E0E0E0] flex items-center gap-1 overflow-x-auto" aria-label="Student portal sections">
        {portalTabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} type="button" aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap text-[11px] font-bold transition ${activeTab === tab.id ? 'bg-black text-white shadow-sm' : 'text-[#555] hover:bg-white hover:text-black'}`}><Icon className="w-4 h-4" /><span>{tab.label}</span>{tab.id === 'TICKETS' && assignedTickets.filter(ticket => ticket.status === 'IN_PROGRESS').length > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-white text-black flex items-center justify-center text-[9px]">{assignedTickets.filter(ticket => ticket.status === 'IN_PROGRESS').length}</span>}</button>; })}
      </nav>

      {activeTab === 'OVERVIEW' && <section className="bg-[#000000] text-white rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1"><span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-400">Your next step</span><h2 className="text-xl font-bold">{nextStep.title}</h2><p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">{nextStep.detail}</p></div>
        <button type="button" onClick={runNextStep} className="shrink-0 px-5 py-3 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition">{nextStep.action}</button>
      </section>}

      {/* Tuition & Installment Payment Banner */}
      {activeTab === 'PAYMENTS' && studentInvoice && (
        <div className="bg-[#FFFFFF] border border-[#E0E0E0] p-6 rounded-2xl shadow-sm space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E0E0E0] pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#707070]">Your payments</span>
              <h3 className="text-base font-bold text-[#000000] font-sans">
                {studentInvoice.balanceZAR === 0 
                  ? '✔ Fully Paid & Settled (R0 Outstanding Balance)' 
                  : studentInvoice.status === 'VERIFIED' 
                  ? 'Seat Deposit Verified • Balance Payment Due Soon' 
                  : 'Tuition Payment Pending'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#FAFAFA] border border-[#E0E0E0] text-[#000000] font-bold rounded-full uppercase tracking-wider text-[10px]">
                {studentInvoice.invoiceNumber}
              </span>
              <span className={`px-3 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold ${
                studentInvoice.balanceZAR === 0 
                  ? 'bg-[#000000] text-white' 
                  : studentInvoice.status === 'VERIFIED' 
                  ? 'bg-[#E0E0E0] text-[#000000]' 
                  : 'bg-[#FAFAFA] border border-[#E0E0E0] text-[#707070]'
              }`}>
                {studentInvoice.balanceZAR === 0 ? 'PAID IN FULL' : studentInvoice.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAFAFA] p-4 rounded-xl border border-[#E0E0E0]">
            <div>
              <span className="text-[#707070] text-[9px] uppercase block">Course Tier</span>
              <strong className="text-[#000000] font-sans text-sm">{studentInvoice.courseTier}</strong>
            </div>
            <div>
              <span className="text-[#707070] text-[9px] uppercase block">Total Tuition</span>
              <strong className="text-[#000000]">R{studentInvoice.amountZAR.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-[#707070] text-[9px] uppercase block">Paid to Date</span>
              <strong className="text-[#008000]">
                R{(studentInvoice.paidZAR ?? 0).toLocaleString()}
              </strong>
            </div>
            <div>
              <span className="text-[#707070] text-[9px] uppercase block">Remaining Balance</span>
              <strong className={studentInvoice.balanceZAR > 0 ? 'text-[#CC0000] text-sm font-bold' : 'text-[#008000] text-sm font-bold'}>
                R{studentInvoice.balanceZAR.toLocaleString()}
              </strong>
            </div>
          </div>
          {studentInvoice.paymentOption !== 'FULL' && installments.length > 0 && <div className="space-y-2"><div className="flex items-center justify-between"><strong className="text-[10px] uppercase tracking-wider">Your installment schedule</strong><span className="text-[9px] text-[#707070]">Payments apply oldest first</span></div>{installments.map(item => <div key={item.id} className={`grid grid-cols-[1fr_auto] gap-3 p-3 rounded-xl border ${item.status === 'OVERDUE' ? 'border-[#CC0000] bg-[#FFF5F5]' : 'border-[#E0E0E0] bg-[#FAFAFA]'}`}><div><strong className="block text-[#000000]">{item.sequence}. {item.label}</strong><span className="text-[10px] text-[#707070]">Due {item.dueDate} · R{item.paidZAR.toLocaleString()} of R{item.amountZAR.toLocaleString()} paid</span></div><strong className={item.status === 'OVERDUE' ? 'text-[#CC0000]' : item.status === 'PAID' ? 'text-[#008000]' : ''}>{item.status}</strong></div>)}</div>}

          {canSubmitPayment && paymentSettings && <section id="student-payment-upload" className="border-t border-[#E0E0E0] pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div><h4 className="font-sans font-bold text-sm text-[#000000] flex items-center gap-2"><Building2 className="w-4 h-4" /> EFT payment details</h4><p className="mt-1 font-sans text-[11px] text-[#707070]">{settings.paymentInstructions || 'Pay the required amount, use the invoice number as the reference, then upload one bank-generated proof.'}</p></div>
              <button type="button" onClick={() => void copyBankDetails()} className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[#E0E0E0] rounded-lg bg-white hover:bg-[#FAFAFA] font-sans text-[10px] font-bold uppercase tracking-wider"><Copy className="w-3.5 h-3.5" />{bankDetailsCopied ? 'Copied' : 'Copy details'}</button>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 p-4 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[11px]">
              <div><dt className="text-[#707070]">Bank</dt><dd className="mt-0.5 font-bold text-[#000000]">{paymentSettings.bankName}</dd></div>
              <div><dt className="text-[#707070]">Account name</dt><dd className="mt-0.5 font-bold text-[#000000]">{paymentSettings.accountName}</dd></div>
              <div><dt className="text-[#707070]">Account number</dt><dd className="mt-0.5 font-bold text-[#000000]">{paymentSettings.accountNumber}</dd></div>
              <div><dt className="text-[#707070]">Branch code</dt><dd className="mt-0.5 font-bold text-[#000000]">{paymentSettings.branchCode}</dd></div>
              <div className="sm:col-span-2 pt-2 border-t border-[#E0E0E0]"><dt className="text-[#707070]">EFT reference</dt><dd className="mt-0.5 font-bold text-[#000000]">{studentInvoice.invoiceNumber}</dd></div>
            </dl>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <label className="space-y-1"><span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-[#000000]">EFT payment reference</span><input maxLength={100} value={eftReference} onChange={event => setEftReference(event.target.value)} placeholder={studentInvoice.invoiceNumber} className="w-full px-3 py-2.5 bg-white border border-[#E0E0E0] rounded-lg text-[#000000] focus:border-black" /></label>
              <label className="space-y-1"><span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-[#000000]">Proof of payment</span><input type="file" accept="application/pdf,image/jpeg,image/png" onChange={event => selectPopFile(event.target.files?.[0])} className="block w-full max-w-full py-2 text-[11px]" /></label>
            </div>
            <p className="text-[10px] text-[#707070]">Accepted: PDF, JPG, or PNG up to 5 MB. Upload only one clear, bank-generated proof. Do not submit another while admissions is reviewing it.</p>
            {selectedPopFile && <p className="text-[11px] font-bold text-[#000000]">Selected: {selectedPopFile.name}</p>}
            {popError && <p className="text-[11px] font-bold text-[#CC0000]" role="alert">{popError}</p>}
            <button type="button" disabled={!selectedPopFile || !eftReference.trim() || uploadingPop} onClick={() => void submitPop()} className="w-full py-3 bg-[#000000] hover:bg-neutral-800 disabled:bg-[#E0E0E0] disabled:text-[#707070] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition">{uploadingPop ? 'Uploading proof securely...' : 'Submit proof for verification'}</button>
          </section>}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-[#707070] font-sans">
              {studentInvoice.balanceZAR > 0 ? (
                <>As per your chosen payment plan, your remaining installment balance of <strong className="text-[#000000]">R{studentInvoice.balanceZAR.toLocaleString()}</strong> can be settled before Week 4.</>
              ) : (
                <>Thank you! Your tuition balance is completely settled in full. You have 100% unrestricted access to all labs and certificates.</>
              )}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="px-4 py-2.5 bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#000000] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#E0E0E0] transition font-sans"
              >
                View invoice
              </button>
              {canSubmitPayment && (
                <button
                  onClick={() => document.getElementById('student-payment-upload')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="px-5 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition font-sans"
                >
                  Pay or upload POP
                </button>
              )}
              {paymentAwaitingReview && <span className="px-4 py-2.5 bg-[#FFF8EE] border border-[#E08A00] text-[#8A5200] rounded-xl text-[10px] font-bold uppercase font-sans">POP awaiting verification</span>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PAYMENTS' && !studentInvoice && <div className="p-8 text-center bg-[#FAFAFA] border border-[#E0E0E0] rounded-2xl"><Receipt className="w-8 h-8 mx-auto mb-3" /><h3 className="font-bold">No invoice yet</h3><p className="text-xs text-[#707070] mt-1">Your invoice and payment options will appear here after admissions processes your application.</p></div>}

      {/* Printable Invoice Modal for Student */}
      {showInvoiceModal && studentInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4">
            <div className="sticky top-0 bg-white border-b border-[#E0E0E0] pb-3 flex items-center justify-between z-10">
              <h3 className="font-bold text-[#000000] text-sm uppercase tracking-wider">Your Official Tax Invoice</h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-1.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs rounded-xl uppercase tracking-wider"
              >
                Close Preview
              </button>
            </div>
            <PrintableInvoice invoice={studentInvoice} allowPrint={true} />
          </div>
        </div>
      )}

      {/* Application Feedback Banner for Non-Enrolled Applicants */}
      {activeTab === 'OVERVIEW' && studentApp && !isFullyEnrolled && (
        <div className="bg-[#FFFFFF] border-2 border-[#000000] p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E0E0E0] pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A0A0A0]">Application Tracking</span>
              <h2 className="text-xl font-bold text-[#000000]">Ref: {studentApp.referenceNumber}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase font-bold text-[#707070]">Current Stage:</span>
              <span className="px-3 py-1 bg-[#000000] text-white text-xs font-bold font-mono rounded-full uppercase tracking-wider">
                {displayStatus(studentApp.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0]">
              <span className="text-[#A0A0A0] text-[10px] uppercase block font-bold">1. Hardware Verification</span>
              <p className="text-[#000000] font-bold mt-1">
                {studentApp.isLaptopCompliant ? '✔ Laptop Specs Approved (16GB RAM)' : '⏳ Hardware Pending Review'}
              </p>
            </div>
            <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0]">
              <span className="text-[#A0A0A0] text-[10px] uppercase block font-bold">2. Tuition Payment</span>
              <p className="text-[#000000] font-bold mt-1">
                {studentApp.status === 'APPROVED' || studentApp.status === 'PAYMENT_REQUIRED' ? '⚡ Payment Action Required' : '⏳ Pending Admissions Review'}
              </p>
            </div>
            <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0]">
              <span className="text-[#A0A0A0] text-[10px] uppercase block font-bold">3. Portal & Module Access</span>
              <p className="text-[#000000] font-bold mt-1">
                {isFullyEnrolled ? '✔ Unlocked' : '🔒 Locked until Enrollment'}
              </p>
            </div>
          </div>

          {studentApp.adminNotes && (
            <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] text-xs space-y-1">
              <strong className="text-[#000000] block uppercase font-mono text-[10px]">Admissions Feedback / Notes:</strong>
              <p className="text-[#707070]">{studentApp.adminNotes}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-[#707070]">
              Need to send pop or query admissions? WhatsApp us with reference <strong className="text-[#000000]">{studentApp.referenceNumber}</strong>.
            </p>
            {(studentApp.status === 'APPROVED' || studentApp.status === 'PAYMENT_REQUIRED') && !paymentAwaitingReview && <button onClick={() => navigate('/payment')} className="px-5 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition">Complete Payment / View Banking Details</button>}
            {paymentAwaitingReview && <button onClick={() => setActiveTab('DOCUMENTS')} className="px-5 py-2.5 bg-[#FAFAFA] border border-[#E0E0E0] text-black font-bold text-xs uppercase tracking-wider rounded-xl">View Submitted POP</button>}
          </div>
        </div>
      )}
      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Student progress metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <button type="button" onClick={() => setActiveTab('CALENDAR')} className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E0E0E0] hover:border-black shadow-sm space-y-2 text-left transition">
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase font-bold tracking-wider">Next lesson</span>
              <strong className="block text-base">{nextCalendarEvent?.title || 'Schedule pending'}</strong>
              <span className="text-xs text-[#707070]">{nextCalendarEvent ? new Date(`${nextCalendarEvent.date}T12:00:00.000Z`).toLocaleDateString('en-ZA', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' }) : 'Your cohort calendar will appear once assigned.'}</span>
            </button>
            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E0E0E0] shadow-sm space-y-2">
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase font-bold tracking-wider">Curriculum Progress</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-light text-[#000000]">{moduleProgress.progressPercent}%</span>
                <span className="text-[10px] font-mono text-[#000000] bg-[#FAFAFA] border border-[#E0E0E0] px-2 py-0.5 rounded uppercase font-bold">{moduleProgress.completedModules} of {moduleProgress.totalModules} Done</span>
              </div>
              <div className="w-full bg-[#E0E0E0] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#000000] h-full rounded-full transition-all duration-500"
                  style={{ width: `${moduleProgress.progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E0E0E0] shadow-sm space-y-2">
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase font-bold tracking-wider">Resolved Support Tickets</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-light text-[#000000]">
                  {assignedTickets.filter(t => t.status === 'RESOLVED').length} / {assignedTickets.length}
                </span>
              </div>
              <p className="text-xs text-[#707070]">Enterprise helpdesk tickets successfully resolved and verified.</p>
            </div>

          </div>

          {/* Quick Active Tickets Action List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#000000]">
                Current Helpdesk Assignments Requiring Action
              </h3>
              <button
                onClick={() => setActiveTab('TICKETS')}
                className="text-xs font-bold text-[#000000] hover:text-neutral-700 flex items-center gap-1 uppercase tracking-wider"
              >
                <span>View Full Ticketing Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignedTickets.slice(0, 2).map(ticket => (
                <div key={ticket.id} className="relative">
                  <TicketCard ticket={ticket} />
                  {ticket.status !== 'RESOLVED' && (
                    <button
                      onClick={() => {
                        setSelectedTicketId(ticket.id);
                        setActiveTab('TICKETS');
                      }}
                      className="mt-3 w-full py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <Terminal className="w-4 h-4" />
                      <span>Launch Investigation & Fix Incident</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DOCUMENT CENTRE */}
      {activeTab === 'DOCUMENTS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-2xl font-light text-[#000000] tracking-tight">Student Document Centre</h3>
              <p className="text-xs text-[#707070]">Your admissions, payment, course, and completion records in one secure place.</p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#707070]">Ref: {studentApp?.referenceNumber || 'Pending'}</span>
          </div>

          {documentError && <p className="p-3 rounded-xl border border-[#CC0000] text-[#CC0000] text-xs font-bold">{documentError}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <DocumentCard icon={FileText} title="Official Invoice" detail={studentInvoice ? `${studentInvoice.invoiceNumber} • Balance R${studentInvoice.balanceZAR.toLocaleString()}` : 'Created after application approval'} available={Boolean(studentInvoice)} actionLabel="Open PDF" onAction={() => void openDocument('/student/documents/invoice')} />

            <DocumentCard icon={FileCheck} title="Admission Confirmation" detail={isFullyEnrolled ? `Enrollment confirmed for ${studentCohort?.name}` : 'Available once your seat deposit is verified'} available={isFullyEnrolled} actionLabel="Open PDF" onAction={() => void openDocument('/student/documents/admission')} />

            <DocumentCard icon={CalendarDays} title="Course Schedule" detail={studentCohort?.scheduleFormat || 'Schedule pending'} available={Boolean(studentCohort)} actionLabel="Open PDF" onAction={() => void openDocument('/student/documents/schedule')} />

            <DocumentCard icon={Award} title="Certificate" detail={studentCert ? `${studentCert.certificateNumber} • Issued ${studentCert.completionDate}` : 'Available after successful course completion'} available={Boolean(studentCert)} actionLabel="Open PDF" onAction={() => void openDocument('/student/documents/certificate')} />
          </div>

          <section className="space-y-3">
            <h4 className="font-bold text-sm text-[#000000]">Payment receipts</h4>
            {verifiedPayments.length ? <div className="divide-y divide-[#E0E0E0] border border-[#E0E0E0] rounded-xl overflow-hidden">{verifiedPayments.map(payment => (
              <div key={payment.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div><strong className="block text-[#000000]">{payment.type === 'DEPOSIT' ? 'Seat deposit receipt' : 'Balance payment receipt'} • R{payment.amountZAR.toLocaleString()}</strong><span className="text-[#707070]">Verified {payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleString('en-ZA') : ''} • EFT ref {payment.eftReference}</span></div>
                <button onClick={() => void openDocument(`/student/documents/receipt/${encodeURIComponent(payment.id)}`)} className="px-4 py-2 bg-[#000000] text-white font-bold rounded-lg uppercase tracking-wider">Open PDF</button>
              </div>
            ))}</div> : <p className="p-4 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs text-[#707070]">Receipts appear here after admissions verifies a payment.</p>}
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-sm text-[#000000]">Submitted proofs of payment</h4>
            {studentPayments.length ? <div className="divide-y divide-[#E0E0E0] border border-[#E0E0E0] rounded-xl overflow-hidden">{studentPayments.map(payment => (
              <div key={payment.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div><strong className="block text-[#000000]">{payment.originalFileName}</strong><span className="text-[#707070]">Uploaded {new Date(payment.submittedAt).toLocaleString('en-ZA')} • <span className="font-bold">{payment.status}</span></span></div>
                <button onClick={() => void openDocument(`/student/documents/pop/${encodeURIComponent(payment.id)}`)} className="px-4 py-2 border border-[#000000] text-[#000000] font-bold rounded-lg uppercase tracking-wider">Open PDF</button>
              </div>
            ))}</div> : <p className="p-4 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs text-[#707070]">No proofs of payment have been submitted yet.</p>}
          </section>
        </div>
      )}

      {/* TAB CONTENT: COHORT CALENDAR */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div><h3 className="text-2xl font-light tracking-tight">Cohort Lesson Calendar</h3><p className="text-xs text-[#707070]">Induction and lessons calculated from {studentCohort?.name || 'your assigned cohort'} dates.</p></div>
            {studentCohort && <span className="text-[10px] font-mono font-bold uppercase px-3 py-1.5 bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg">{studentCohort.scheduleFormat}</span>}
          </div>
          {!studentCohort ? <div className="p-8 text-center bg-[#FAFAFA] border border-[#E0E0E0] rounded-2xl"><CalendarDays className="w-8 h-8 mx-auto mb-3" /><h4 className="font-bold">Cohort assignment pending</h4><p className="text-xs text-[#707070] mt-1">Your lesson calendar will appear after admissions assigns your cohort.</p></div> : <>
            <section className="bg-white border border-[#E0E0E0] rounded-2xl overflow-hidden shadow-sm">
              <header className="p-4 flex items-center justify-between border-b border-[#E0E0E0]"><button type="button" onClick={() => moveCalendarMonth(-1)} className="p-2 border border-[#E0E0E0] rounded-lg" aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button><h4 className="font-bold">{new Date(`${calendarMonth}-01T12:00:00.000Z`).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h4><button type="button" onClick={() => moveCalendarMonth(1)} className="p-2 border border-[#E0E0E0] rounded-lg" aria-label="Next month"><ChevronRight className="w-4 h-4" /></button></header>
              <div className="grid grid-cols-7 bg-[#FAFAFA] border-b border-[#E0E0E0]">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => <span key={day} className="p-2 text-center text-[9px] font-mono font-bold uppercase text-[#707070]">{day}</span>)}</div>
              <div className="grid grid-cols-7">{calendarDays.map(day => { const events = calendarEvents.filter(event => event.date === day.iso); return <div key={day.iso} className={`min-h-20 sm:min-h-28 p-1.5 sm:p-2 border-r border-b border-[#F0F0F0] ${day.inMonth ? 'bg-white' : 'bg-[#FAFAFA] text-[#A0A0A0]'}`}><span className="text-[10px] font-mono">{day.day}</span><div className="mt-1 space-y-1">{events.map(event => <div key={event.id} title={event.detail} className={`p-1.5 rounded text-[8px] sm:text-[9px] leading-tight font-bold ${event.type === 'INDUCTION' ? 'bg-[#4B50B8] text-white' : 'bg-black text-white'}`}>{event.type === 'INDUCTION' ? 'INDUCTION' : `M${event.moduleNumber}`}<span className="hidden sm:block font-normal mt-0.5 line-clamp-2">{event.title}</span></div>)}</div></div>; })}</div>
            </section>
            <section className="space-y-2"><h4 className="text-sm font-bold">Schedule details</h4>{calendarEvents.map(event => <article key={event.id} className="p-4 bg-white border border-[#E0E0E0] rounded-xl flex items-start gap-3"><span className={`px-2 py-1 rounded text-[9px] font-mono font-bold text-white ${event.type === 'INDUCTION' ? 'bg-[#4B50B8]' : 'bg-black'}`}>{event.type}</span><div><h5 className="text-xs font-bold">{event.title}</h5><time className="text-[10px] font-mono text-[#707070]">{new Date(`${event.date}T12:00:00.000Z`).toLocaleDateString('en-ZA', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}</time><p className="text-[10px] text-[#707070] mt-1">{event.detail}</p></div></article>)}</section>
          </>}
        </div>
      )}

      {/* TAB CONTENT: 2. MODULES */}
      {activeTab === 'MODULES' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h3 className="text-2xl font-light text-[#000000] tracking-tight">{modulesToUse.length}-Module Bootcamp Progression</h3>
            <p className="text-xs text-[#707070]">Each module contains live session replays, lab blueprints, and guided troubleshooting steps.</p>
          </div>

          {!isFullyEnrolled && (
            <div className="p-6 bg-[#FAFAFA] border-2 border-[#000000] rounded-2xl text-center space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] bg-[#000000] text-white px-3 py-1 rounded-full">
                Locked Preview Mode
              </span>
              <h4 className="text-lg font-bold text-[#000000]">Full Module Syllabus & VM Blueprints Locked</h4>
              <p className="text-xs text-[#707070] max-w-md mx-auto leading-relaxed">
                Full access to downloadable lab guides, ISO mirrors, and incident tickets unlocks automatically once your application is marked <strong>ENROLLED</strong> by admissions.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {scheduledModules.map((mod, idx) => {
              const isCompleted = idx < moduleProgress.completedModules;
              const isCurrent = idx === Math.min(moduleProgress.completedModules, scheduledModules.length - 1) && moduleProgress.progressPercent < 100;

              return (
                <div
                  key={mod.number}
                  className={`p-6 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCurrent 
                      ? 'bg-[#000000] text-white border-[#000000] shadow-md' 
                      : isCompleted
                      ? 'bg-[#FAFAFA] border-[#E0E0E0] shadow-sm'
                      : 'bg-[#FFFFFF] border-[#E0E0E0] opacity-80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center ${
                        isCurrent 
                          ? 'bg-[#FFFFFF] text-[#000000]' 
                          : isCompleted 
                          ? 'bg-[#000000] text-white' 
                          : 'bg-[#E0E0E0] text-[#000000]'
                      }`}>
                        {isCompleted ? '✔' : `M${mod.number}`}
                      </span>

                      <div>
                        <h4 className="font-bold text-base">{mod.title}</h4>
                        <span className={`text-xs font-mono ${isCurrent ? 'text-neutral-400' : 'text-[#707070]'}`}>{mod.scheduleLabel}</span>
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed max-w-2xl ${isCurrent ? 'text-neutral-300' : 'text-[#707070]'}`}>
                      {mod.summary}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {mod.technologies.map((t, tIdx) => (
                        <span key={tIdx} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isCurrent ? 'bg-white/10 text-white border-white/20' : 'bg-[#FAFAFA] text-[#1A1A1A] border-[#E0E0E0]'
                        }`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isCurrent ? (
                      <span className="px-4 py-2 bg-[#FFFFFF] text-[#000000] font-bold text-xs uppercase tracking-wider rounded-lg shadow">
                        Current Active Module
                      </span>
                    ) : isCompleted ? (
                      <span className="px-3 py-1.5 bg-[#E0E0E0] text-[#000000] font-bold text-xs uppercase tracking-wider rounded-lg">
                        Completed
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-[#FAFAFA] text-[#A0A0A0] font-medium text-xs uppercase tracking-wider rounded-lg border border-[#E0E0E0]">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TICKETS */}
      {activeTab === 'TICKETS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-light text-[#000000] tracking-tight">Simulated IT Incident Tickets</h3>
              <p className="text-xs text-[#707070]">Investigate, diagnose root cause, execute resolution cmdlets, and submit your technical findings.</p>
            </div>
          </div>

          <LabPilotPanel />
          {/* Resolution Simulator Modal if ticket selected */}
          {selectedTicketId && (
            <div className="bg-[#FAFAFA] text-[#1A1A1A] p-6 sm:p-8 rounded-2xl border-2 border-[#000000] shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#000000]" />
                  <h4 className="font-mono font-bold text-sm text-[#000000]">
                    Incident Resolver: {selectedTicketId}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="text-xs font-mono uppercase text-[#707070] hover:text-[#000000]"
                >
                  Cancel / Close
                </button>
              </div>

              {/* Root Cause & Resolution Documentation */}
              <div className="space-y-2 text-xs">
                <label className="font-bold text-xs uppercase tracking-wider text-[#000000] block">
                  Root Cause Analysis (RCA) & Helpdesk Resolution Notes: *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Document the exact root cause discovered (e.g. DNS SRV record was missing, BitLocker key failed to escrow to Entra ID) and the verification steps taken to confirm resolution..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000] text-xs focus:border-[#000000] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(null)}
                  className="px-4 py-2 bg-[#FFFFFF] border border-[#E0E0E0] text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveTicket(selectedTicketId)}
                  className="px-6 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] shadow transition"
                >
                  Submit & Mark Ticket Resolved
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignedTickets.map(ticket => (
              <div key={ticket.id} className="space-y-2">
                <TicketCard ticket={ticket} />
                {ticket.status !== 'RESOLVED' && (
                  <button
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="w-full py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Investigate Incident #{ticket.ticketNumber}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CERTIFICATE */}
      {activeTab === 'CERTIFICATE' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h3 className="text-2xl font-light text-[#000000] tracking-tight">Your Verified Certificate of Completion</h3>
            <p className="text-xs text-[#707070]">Issued upon 80%+ passing benchmark across all VMware enterprise incident audits.</p>
          </div>

          <CertificateView certificate={studentCert} allowPrint={true} />
        </div>
      )}
    </div>
  );
};

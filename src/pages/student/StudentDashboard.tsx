import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { REAL_SUPPORT_TICKETS, COHORTS, SAMPLE_CERTIFICATE, COURSE_MODULES } from '../../data/mockData';
import { TicketCard } from '../../components/common/TicketCard';
import { CertificateView } from '../../components/common/CertificateView';
import { PrintableInvoice } from '../../components/common/PrintableInvoice';
import { apiOpenPrivate, apiRequest } from '../../lib/api';
import type { PaymentInstallment } from '../../types';
import { buildCurriculumSchedule } from '../../lib/curriculumSchedule';
import { 
  Server, 
  Layers, 
  CheckCircle, 
  Clock, 
  Download, 
  Terminal, 
  MessageSquare, 
  Award, 
  AlertTriangle, 
  ExternalLink,
  Laptop,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Flame,
  FileCheck,
  Video,
  FolderOpen,
  FileText,
  Receipt,
  CalendarDays
} from 'lucide-react';

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
    labs,
    assessments,
    navigate 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DOCUMENTS' | 'MODULES' | 'LABS' | 'TICKETS' | 'DOWNLOADS' | 'CERTIFICATE'>('OVERVIEW');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);

  // Resolution modal state
  const [resolutionText, setResolutionText] = useState('');
  const [psCommand, setPsCommand] = useState('');
  const [psOutput, setPsOutput] = useState<string | null>(null);

  const studentCohort = (cohorts && cohorts.length > 0)
    ? (cohorts.find(c => c.id === currentStudent?.cohortId) || cohorts[0])
    : COHORTS[0];

  const studentApp = (applications || []).find(
    a => a.email.trim().toLowerCase() === (currentStudent?.email || '').trim().toLowerCase()
  );

  const studentInvoice = (invoices || []).find(
    i => i.studentEmail.trim().toLowerCase() === (currentStudent?.email || '').trim().toLowerCase()
  );
  useEffect(() => { if (studentInvoice) void apiRequest<PaymentInstallment[]>('/student/payment-plan').then(setInstallments).catch(() => setInstallments([])); else setInstallments([]); }, [studentInvoice?.id, studentInvoice?.paidZAR]);

  const isFullyEnrolled = studentApp?.status === 'ENROLLED';

  const studentCert = (certificates && certificates.length > 0)
    ? certificates.find(c => c.studentId === currentStudent?.id)
    : undefined;

  const assignedTickets = (tickets || []).filter(t => t?.assignedStudentId === currentStudent?.id);
  const studentPayments = (payments || []).filter(payment => payment.studentId === currentStudent?.id);
  const verifiedPayments = studentPayments.filter(payment => payment.status === 'VERIFIED');

  const openDocument = async (path: string) => {
    setDocumentError('');
    try { await apiOpenPrivate(path); }
    catch (error) { setDocumentError(error instanceof Error ? error.message : 'The PDF could not be opened.'); }
  };

  const modulesToUse = (courseModules && courseModules.length > 0) ? courseModules : COURSE_MODULES;
  const scheduledModules = useMemo(() => buildCurriculumSchedule(modulesToUse, studentCohort), [modulesToUse, studentCohort]);

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

  const handleSimulatePS = () => {
    if (!psCommand.trim()) return;
    setPsOutput(`Running PowerShell 7 in VMnet2 isolated environment...\n[OK] ${psCommand}\nExecution result: Configuration updated successfully. All DC and Intune policies synchronized.`);
  };

  const handleResolveTicket = (ticketId: string) => {
    if (!resolutionText.trim()) {
      alert('Please describe your root cause analysis and resolution steps.');
      return;
    }
    updateTicketStatus(ticketId, 'RESOLVED', resolutionText);
    setSelectedTicketId(null);
    setResolutionText('');
    setPsOutput(null);
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
              {isFullyEnrolled ? 'Enrolled Student Portal' : `Application Status: ${studentApp?.status || 'UNDER_REVIEW'}`}
            </span>
            <span className="text-xs text-[#707070] font-mono">
              Cohort: {studentCohort?.name || 'Cape Town IT Support Oct 2026'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
            Welcome back, {currentStudent?.firstName || currentStudent?.name?.split(' ')[0] || 'Student'}
          </h1>

          <p className="text-xs sm:text-sm text-[#707070] max-w-xl leading-relaxed">
            {isFullyEnrolled ? (
              <>Cape Town IT Support Bootcamp • Next Live Microsoft Teams Session: <strong className="text-[#000000]">Saturday at 09:00 SAST</strong> (VMnet2 Active Directory & GPO Sprint).</>
            ) : (
              <>Your application is currently being processed by admissions. Once approved and fully enrolled, full course modules, lab blueprints, and tickets will unlock below.</>
            )}
          </p>
        </div>

        {isFullyEnrolled && <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://teams.microsoft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#464EB8] hover:bg-[#3b42a0] text-white font-bold rounded-xl text-xs uppercase tracking-[0.15em] flex items-center gap-1.5 transition shadow"
          >
            <Video className="w-4 h-4" />
            <span>Join Live MS Teams Class</span>
          </a>

          <a
            href={`https://wa.me/${(settings?.whatsappNumber || '+27821234567').replace(/[^0-9]/g, '')}?text=Hi!%20I'm%20working%20on%20Lab%204%20and%20need%20mentor%20assistance.`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] flex items-center gap-1.5 transition shadow"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Mentor WhatsApp Group</span>
          </a>

          <button
            onClick={() => setActiveTab('TICKETS')}
            className="px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#E0E0E0] transition"
          >
            Support Tickets ({assignedTickets.filter(t => t.status === 'IN_PROGRESS').length} Active)
          </button>
        </div>}
      </div>

      {/* Tuition & Installment Payment Banner */}
      {studentInvoice && (
        <div className="bg-[#FFFFFF] border border-[#E0E0E0] p-6 rounded-2xl shadow-sm space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E0E0E0] pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#707070]">Tuition Payment Lifecycle & Balance Tracking</span>
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
                View / Print Tax Invoice
              </button>
              {studentInvoice.balanceZAR > 0 && (
                <button
                  onClick={() => navigate('/payment')}
                  className="px-5 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition font-sans"
                >
                  Pay Balance via EFT / Upload POP
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
      {studentApp && !isFullyEnrolled && (
        <div className="bg-[#FFFFFF] border-2 border-[#000000] p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E0E0E0] pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A0A0A0]">Application Tracking</span>
              <h2 className="text-xl font-bold text-[#000000]">Ref: {studentApp.referenceNumber}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase font-bold text-[#707070]">Current Stage:</span>
              <span className="px-3 py-1 bg-[#000000] text-white text-xs font-bold font-mono rounded-full uppercase tracking-wider">
                {studentApp.status}
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
            <button
              onClick={() => navigate('/payment')}
              className="px-5 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition"
            >
              Complete Payment / View Banking Details
            </button>
          </div>
        </div>
      )}
      <div className="bg-[#FAFAFA] p-1.5 rounded-xl border border-[#E0E0E0] shadow-sm flex items-center gap-1 overflow-x-auto text-xs font-bold font-mono">
        {[
          { id: 'OVERVIEW', label: 'Dashboard Overview', icon: Sparkles },
          { id: 'DOCUMENTS', label: 'Document Centre', icon: FolderOpen },
          { id: 'MODULES', label: '15 Modules & Lessons', icon: Layers },
          { id: 'LABS', label: 'Virtual Machine Labs', icon: Server },
          { id: 'TICKETS', label: 'Assigned Incident Tickets', icon: Terminal },
          { id: 'DOWNLOADS', label: 'ISO & Software Downloads', icon: Download },
          { id: 'CERTIFICATE', label: 'Verified Certificate', icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap uppercase tracking-wider text-[11px] ${
                isSelected 
                  ? 'bg-[#000000] text-white shadow' 
                  : 'text-[#707070] hover:text-[#000000] hover:bg-[#E0E0E0]/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8 animate-in fade-in">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                <span className="text-[10px] font-mono text-[#000000] bg-[#FAFAFA] border border-[#E0E0E0] px-2 py-0.5 rounded uppercase font-bold">
                  85% Practical Pass
                </span>
              </div>
              <p className="text-xs text-[#707070]">Enterprise helpdesk tickets successfully resolved and verified.</p>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E0E0E0] shadow-sm space-y-2">
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase font-bold tracking-wider">Lab Topology Health</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-light text-[#000000]">HEALTHY</span>
                <span className="text-[10px] font-mono text-[#000000] bg-[#FAFAFA] border border-[#E0E0E0] px-2 py-0.5 rounded uppercase font-bold">
                  VMnet2 Synced
                </span>
              </div>
              <p className="text-xs text-[#707070]">DC01, CLIENT01 and Entra ID Cloud Connector active.</p>
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

      {/* TAB CONTENT: 2. MODULES */}
      {activeTab === 'MODULES' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h3 className="text-2xl font-light text-[#000000] tracking-tight">15-Module Bootcamp Progression</h3>
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

      {/* TAB CONTENT: 3. LABS */}
      {activeTab === 'LABS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h3 className="text-2xl font-light text-[#000000] tracking-tight">Local Virtual Lab Management</h3>
            <p className="text-xs text-[#707070]">
              Verify your local VMware Workstation virtual machines and isolated VMnet2 network parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-[#FAFAFA] text-[#1A1A1A] p-5 rounded-xl border border-[#E0E0E0] space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-[#000000]">DC01 (Server 2022)</strong>
                <span className="w-2 h-2 rounded-full bg-[#000000] animate-pulse"></span>
              </div>
              <p className="text-[#707070] text-[11px]">Roles: AD DS, DNS, DHCP<br />IP: 10.0.10.10 /24<br />Domain: ad.ubuntu-mfg.co.za</p>
            </div>

            <div className="bg-[#FAFAFA] text-[#1A1A1A] p-5 rounded-xl border border-[#E0E0E0] space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-[#000000]">CLIENT01 (Win 11)</strong>
                <span className="w-2 h-2 rounded-full bg-[#000000]"></span>
              </div>
              <p className="text-[#707070] text-[11px]">User: sipho.dlamini<br />Joined: Domain Member<br />IP: 10.0.10.101 (DHCP)</p>
            </div>

            <div className="bg-[#FAFAFA] text-[#1A1A1A] p-5 rounded-xl border border-[#E0E0E0] space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-[#000000]">CLIENT02 (Win 11)</strong>
                <span className="w-2 h-2 rounded-full bg-[#707070]"></span>
              </div>
              <p className="text-[#707070] text-[11px]">User: nomsa.nkosi<br />Intune MDM: Enrolled<br />BitLocker: Escrow Pending</p>
            </div>

            <div className="bg-[#FAFAFA] text-[#1A1A1A] p-5 rounded-xl border border-[#E0E0E0] space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-[#000000]">ADMIN01 (Mgmt VM)</strong>
                <span className="w-2 h-2 rounded-full bg-[#000000]"></span>
              </div>
              <p className="text-[#707070] text-[11px]">Tools: RSAT, PowerShell 7<br />Graph SDK Connected<br />IP: 10.0.10.50 (Static)</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. TICKETS */}
      {activeTab === 'TICKETS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-light text-[#000000] tracking-tight">Simulated IT Incident Tickets</h3>
              <p className="text-xs text-[#707070]">Investigate, diagnose root cause, execute resolution cmdlets, and submit your technical findings.</p>
            </div>
          </div>

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

              {/* Diagnostic Command Simulator */}
              <div className="space-y-3 text-xs font-mono">
                <label className="text-[#000000] font-bold block uppercase tracking-wider text-[10px]">
                  PowerShell 7 Remote Diagnostic Cmdlet:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Test-ComputerSecureChannel -Repair or Repair-IntuneCompliance"
                    value={psCommand}
                    onChange={(e) => setPsCommand(e.target.value)}
                    className="flex-1 p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000] font-mono text-xs focus:border-[#000000] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSimulatePS}
                    className="px-4 py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition"
                  >
                    Execute
                  </button>
                </div>

                {psOutput && (
                  <pre className="p-3 bg-[#000000] rounded-xl border border-[#333333] text-neutral-200 text-[11px] whitespace-pre-wrap font-mono">
                    {psOutput}
                  </pre>
                )}
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

      {/* TAB CONTENT: 5. DOWNLOADS */}
      {activeTab === 'DOWNLOADS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h3 className="text-2xl font-light text-[#000000] tracking-tight">Evaluation ISOs, Tools & Lab Blueprints</h3>
            <p className="text-xs text-[#707070]">Direct official evaluation mirrors and automation scripts for student VMware setup.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <strong className="text-sm font-bold text-[#000000] block">Windows Server 2022 Evaluation ISO</strong>
                <p className="text-[#707070] font-mono text-[11px]">Size: 4.7 GB • SHA-256 Verified</p>
              </div>
              <button 
                onClick={() => alert('Downloading Windows Server 2022 Eval ISO mirror (Microsoft Evaluation Center)...')}
                className="px-4 py-2 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>

            <div className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <strong className="text-sm font-bold text-[#000000] block">Windows 11 Enterprise 64-bit ISO</strong>
                <p className="text-[#707070] font-mono text-[11px]">Size: 5.2 GB • Client Evaluation</p>
              </div>
              <button 
                onClick={() => alert('Downloading Windows 11 Enterprise ISO mirror...')}
                className="px-4 py-2 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>

            <div className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <strong className="text-sm font-bold text-[#000000] block">VMware Workstation Pro 17 (Free for Personal Use)</strong>
                <p className="text-[#707070] font-mono text-[11px]">Broadcom Official Installer</p>
              </div>
              <button 
                onClick={() => alert('Redirecting to Broadcom VMware Workstation free personal edition download...')}
                className="px-4 py-2 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs uppercase tracking-wider"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Get Installer</span>
              </button>
            </div>

            <div className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <strong className="text-sm font-bold text-[#000000] block">TechLabs Automated AD Bootstrap Script (.ps1)</strong>
                <p className="text-[#707070] font-mono text-[11px]">Creates OU Structure & 30 Mock Users</p>
              </div>
              <button 
                onClick={() => alert('Downloading Bootstrap-UbuntuMfgAD.ps1...')}
                className="px-4 py-2 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PS1</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. CERTIFICATE */}
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

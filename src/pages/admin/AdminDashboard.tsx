import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LabPilotPanel } from '../../components/common/LabPilotPanel';
import { YocoPayments } from '../../components/common/YocoPayments';
import { apiDownload, apiGetPrivateBlob, apiOpenPrivate, apiRequest } from '../../lib/api';
import { ApplicationStatus, LeadStatus, SupportTicket, Certificate, Invoice, CourseTier, PaymentOption, AuditLogRecord, StudentTimelineEvent, StaffAccount, AdmissionNote, AdmissionTask, PaymentInstallment } from '../../types';
import { CertificateView } from '../../components/common/CertificateView';
import { PrintableInvoice } from '../../components/common/PrintableInvoice';
import { BulkOperationsUI } from '../../components/admin/BulkOperationsUI';
import { EmailAutomationUI } from '../../components/admin/EmailAutomationUI';
import { InvoiceGeneratorUI } from '../../components/admin/InvoiceGeneratorUI';
import { 
  Users, 
  FileText, 
  CreditCard, 
  Award, 
  Settings, 
  Calendar, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Search, 
  ExternalLink,
  MessageSquare,
  Building2,
  Laptop,
  Printer,
  Check,
  Zap,
  TrendingUp,
  Filter,
  Zap as Zapper,
  Mail,
  Layers,
  ScrollText
  ,RotateCw
  ,ZoomIn
  ,ZoomOut
  ,Download
} from 'lucide-react';

type PipelineStage = 'NEW' | 'HARDWARE_REVIEW' | 'APPROVED' | 'AWAITING_DEPOSIT' | 'POP_SUBMITTED' | 'ENROLLED' | 'COMPLETED' | 'OTHER';
type AdminTab = 'OVERVIEW' | 'APPLICATIONS' | 'COHORTS' | 'TICKETS' | 'LEADS' | 'INVOICES' | 'CERTIFICATES' | 'CURRICULUM' | 'SETTINGS' | 'STAFF' | 'AUDIT_LOG' | 'BULK_OPS' | 'EMAIL_AUTOMATION' | 'LAB_MACHINES';
const PIPELINE_STAGES: Array<{ id: Exclude<PipelineStage, 'OTHER'>; label: string }> = [
  { id: 'NEW', label: 'New' }, { id: 'HARDWARE_REVIEW', label: 'Hardware Review' }, { id: 'APPROVED', label: 'Approved' },
  { id: 'AWAITING_DEPOSIT', label: 'Awaiting Deposit' }, { id: 'POP_SUBMITTED', label: 'POP Submitted' }, { id: 'ENROLLED', label: 'Enrolled' }, { id: 'COMPLETED', label: 'Completed' },
];
type ActionCentreGroup = { count: number; items: Array<{ id: string; label: string; detail: string }> };
type ActionCentreData = { generatedAt: string; hardware: ActionCentreGroup; pops: ActionCentreGroup; overdue: ActionCentreGroup; cohorts: ActionCentreGroup; emails: ActionCentreGroup; followUps: ActionCentreGroup };
const friendlyStatus = (status: string) => status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
const statusTone = (status: string) => {
  if (/ENROLLED|PAID|VERIFIED|COMPLETED|RESOLVED|OPEN/i.test(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (/REJECTED|FAILED|BOUNCED|OVERDUE|WITHDRAWN/i.test(status)) return 'border-red-200 bg-red-50 text-red-800';
  if (/SUBMITTED|IN_PROGRESS|ACTIVE/i.test(status)) return 'border-blue-200 bg-blue-50 text-blue-800';
  if (/PENDING|REVIEW|REQUIRED|WAITLISTED|FILLING/i.test(status)) return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-neutral-200 bg-neutral-50 text-neutral-700';
};
const StatusBadge = ({ status }: { status: string }) => <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusTone(status)}`}>{friendlyStatus(status)}</span>;
const TIER_CARD_DEFAULTS: Record<CourseTier, { priceZAR: number; displayName: string; description: string; features: string[]; badgeLabel: string }> = {
  STARTER: { priceZAR: 1999, displayName: 'Starter Tier', description: 'Weekend practical self-paced lab track with comprehensive workbooks and VMware guidance.', features: ['Weekend practical labs', 'Student workbook & architecture diagrams', 'VMware lab guidance & ISO links', 'Practical exercises & helpdesk scripts', 'Certificate of Completion'], badgeLabel: 'Self-paced' },
  PROFESSIONAL: { priceZAR: 3499, displayName: 'Professional Tier', description: 'Full bootcamp with live evening and weekend sessions, enterprise VMware labs, and tickets.', features: ['Full 8-12 week bootcamp', 'Live evening and weekend practical sessions', 'VMware enterprise labs (Server, AD, DNS)', 'Microsoft 365, Entra ID, Intune & Defender', 'PowerShell automation & helpdesk tickets', 'Graded assessments & verified certificate'], badgeLabel: 'Most Popular' },
  CAREER_ACCELERATOR: { priceZAR: 4999, displayName: 'Career Accelerator', description: 'Everything in Professional plus dedicated 1-on-1 career coaching and mock interviews.', features: ['Everything in Professional Tier', 'Technical CV and portfolio review', 'LinkedIn profile optimization', '1-on-1 technical mock interview', 'Job application guidance', 'Priority placement assistance'], badgeLabel: 'Full Support' },
};
const SESSION_TRACKS: Record<CourseTier, { name: string; detail: string }> = {
  STARTER: { name: 'Weekend Practical Track', detail: 'Weekend practical labs and self-paced workbook support.' },
  PROFESSIONAL: { name: 'Live Bootcamp Track', detail: 'Live weekend and evening sessions with graded labs and tickets.' },
  CAREER_ACCELERATOR: { name: 'Live Bootcamp Track + Coaching', detail: 'Professional live sessions plus dedicated career coaching.' },
};

export const AdminDashboard: React.FC = () => {
  const {
    currentRole,
    adminLogin,
    logout,
    applications,
    updateApplicationStatus,
    recordApplicationDecision,
    transferApplicationCohort,
    updateStudentRecord,
    deleteStudentRecord,
    setPaymentRemindersPaused,
    sendApprovalEmail,
    cohorts,
    updateCohort,
    tickets,
    createTicket,
    leads,
    updateLeadStatus,
    addLeadNote,
    updateLeadFollowUp,
    invoices,
    payments,
    courseModules,
    createCourseModule,
    saveCourseModule,
    setInvoices,
    verifyInvoicePayment,
    settleInvoiceBalance,
    verifySubmittedPayment,
    rejectSubmittedPayment,
    certificates,
    issueCertificate,
    settings,
    updateSettings,
    saveSettings,
    students,
    showToast,
    navigate
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>(() => new URLSearchParams(window.location.search).has('application') ? 'APPLICATIONS' : 'OVERVIEW');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(() => new URLSearchParams(window.location.search).get('application'));
  const [editingCohortId, setEditingCohortId] = useState<string | null>(null);
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<Invoice | null>(null);
  const [cohortForm, setCohortForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    scheduleFormat: '',
    deliveryMode: 'Hybrid (Cape Town Lab + Virtual)' as '100% Virtual Learning' | 'Hybrid (Cape Town Lab + Virtual)',
    location: '',
    teamsChannelUrl: '',
    capacity: 20,
    status: 'Open' as 'Open' | 'Filling Fast' | 'Closed' | 'In Progress' | 'Completed'
  });
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });
  const [adminLoginError, setAdminLoginError] = useState('');
  const [emailingInvoiceId, setEmailingInvoiceId] = useState<string | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [pipelineCohort, setPipelineCohort] = useState('ALL');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage | 'ALL'>('ALL');
  const [pipelinePayment, setPipelinePayment] = useState('ALL');
  const [pipelineDateFrom, setPipelineDateFrom] = useState('');
  const [pipelineDateTo, setPipelineDateTo] = useState('');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [showAdvancedPipelineFilters, setShowAdvancedPipelineFilters] = useState(false);
  const [studentTimeline, setStudentTimeline] = useState<StudentTimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [reviewingPaymentId, setReviewingPaymentId] = useState<string | null>(null);
  const [popPreview, setPopPreview] = useState<{ url: string; type: string } | null>(null);
  const [popPreviewLoading, setPopPreviewLoading] = useState(false);
  const [popZoom, setPopZoom] = useState(1);
  const [popRotation, setPopRotation] = useState(0);
  const [confirmedPopAmount, setConfirmedPopAmount] = useState('');
  const [popRejectionReason, setPopRejectionReason] = useState('');
  const [staffAccounts, setStaffAccounts] = useState<Array<Omit<StaffAccount, 'passwordHash'>>>([]);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'INSTRUCTOR' as 'ADMIN' | 'INSTRUCTOR' });
  const [staffSaving, setStaffSaving] = useState(false);
  const [admissionNotes, setAdmissionNotes] = useState<AdmissionNote[]>([]);
  const [admissionTasks, setAdmissionTasks] = useState<AdmissionTask[]>([]);
  const [internalNote, setInternalNote] = useState('');
  const [assignmentStaffId, setAssignmentStaffId] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '', priority: 'MEDIUM' as AdmissionTask['priority'], assignedStaffId: '' });
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [decisionStatus, setDecisionStatus] = useState<'REJECTED' | 'WAITLISTED' | 'WITHDRAWN' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionSaving, setDecisionSaving] = useState(false);
  const [showCohortTransfer, setShowCohortTransfer] = useState(false);
  const [transferCohortId, setTransferCohortId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferSaving, setTransferSaving] = useState(false);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [editingInstallments, setEditingInstallments] = useState(false);
  const [installmentRows, setInstallmentRows] = useState<Array<{ label: string; amountZAR: string; dueDate: string }>>([]);
  const [installmentsSaving, setInstallmentsSaving] = useState(false);
  const [actionCentre, setActionCentre] = useState<ActionCentreData | null>(null);
  const [actionCentreLoading, setActionCentreLoading] = useState(false);
  const [editingStudentRecord, setEditingStudentRecord] = useState(false);
  const [recordForm, setRecordForm] = useState<Partial<typeof applications[number]>>({});
  const [recordSaving, setRecordSaving] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<LeadStatus | 'ALL' | 'DUE'>('ALL');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadNote, setLeadNote] = useState('');
  const [editingModuleNumber, setEditingModuleNumber] = useState<number | null>(null);
  const [creatingModule, setCreatingModule] = useState(false);
  const [curriculumSaving, setCurriculumSaving] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', duration: '', summary: '', learningOutcomes: '', practicalLabs: '', exampleTickets: '', technologies: '', published: true });

  useEffect(() => {
    if (!['ADMIN', 'INSTRUCTOR'].includes(currentRole || '') || activeTab !== 'AUDIT_LOG') return;
    setAuditLoading(true);
    void apiRequest<AuditLogRecord[]>('/admin/audit-logs').then(setAuditLogs).catch(error => showToast('error', 'Audit Log Unavailable', error instanceof Error ? error.message : 'Could not load audit records.')).finally(() => setAuditLoading(false));
  }, [activeTab, currentRole]);

  useEffect(() => {
    if (!['ADMIN', 'INSTRUCTOR'].includes(currentRole || '') || activeTab !== 'OVERVIEW') return; setActionCentreLoading(true);
    void apiRequest<ActionCentreData>('/admin/action-centre').then(setActionCentre).catch(error => showToast('error', 'Action Centre Unavailable', error instanceof Error ? error.message : 'Could not load dashboard alerts.')).finally(() => setActionCentreLoading(false));
  }, [activeTab, currentRole]);

  const openActionItem = (kind: keyof Omit<ActionCentreData, 'generatedAt'>, item: { id: string; label: string }) => {
    if (kind === 'cohorts') { setActiveTab('COHORTS'); return; }
    if (kind === 'overdue') { setActiveTab('INVOICES'); return; }
    setActiveTab('APPLICATIONS');
    const application = kind === 'emails' ? applications.find(candidate => candidate.email.toLowerCase() === item.label.toLowerCase()) : applications.find(candidate => candidate.id === item.id);
    if (application) { setPipelineSearch(application.referenceNumber); setSelectedAppId(application.id); }
    if (kind === 'hardware') setPipelineStage('HARDWARE_REVIEW');
    if (kind === 'pops') setPipelineStage('POP_SUBMITTED');
  };

  useEffect(() => {
    if (!['ADMIN', 'INSTRUCTOR'].includes(currentRole || '') || !['STAFF', 'APPLICATIONS'].includes(activeTab)) return;
    void apiRequest<Array<Omit<StaffAccount, 'passwordHash'>>>('/admin/staff').then(setStaffAccounts).catch(error => showToast('error', 'Staff Unavailable', error instanceof Error ? error.message : 'Could not load staff accounts.'));
  }, [activeTab, currentRole]);

  useEffect(() => {
    if (activeTab !== 'EMAIL_AUTOMATION' || currentRole !== 'ADMIN') return;
    void apiRequest<any[]>('/automation/templates').then(setEmailTemplates).catch(error => showToast('error', 'Templates Unavailable', error instanceof Error ? error.message : 'Could not load email templates.'));
  }, [activeTab, currentRole]);

  const createStaffAccount = async (event: React.FormEvent) => {
    event.preventDefault(); setStaffSaving(true);
    try { const staff = await apiRequest<Omit<StaffAccount, 'passwordHash'>>('/admin/staff', { method: 'POST', body: JSON.stringify(staffForm) }); setStaffAccounts(current => [...current, staff]); setStaffForm({ name: '', email: '', password: '', role: 'INSTRUCTOR' }); showToast('success', 'Staff Account Created', `${staff.name} can now sign in through the admin login.`); }
    catch (error) { showToast('error', 'Account Not Created', error instanceof Error ? error.message : 'Could not create staff account.'); }
    finally { setStaffSaving(false); }
  };

  const removeStaffAccount = async (staff: Omit<StaffAccount, 'passwordHash'>) => {
    if (!window.confirm(`Remove ${staff.name}'s ${staff.role.toLowerCase()} account?`)) return;
    try { await apiRequest(`/admin/staff/${encodeURIComponent(staff.id)}`, { method: 'DELETE' }); setStaffAccounts(current => current.filter(item => item.id !== staff.id)); showToast('info', 'Staff Account Removed', `${staff.name} can no longer sign in.`); }
    catch (error) { showToast('error', 'Account Not Removed', error instanceof Error ? error.message : 'Could not remove staff account.'); }
  };

  const loadStudentTimeline = async (applicationId: string) => {
    setTimelineLoading(true);
    try { setStudentTimeline(await apiRequest<StudentTimelineEvent[]>(`/admin/applications/${encodeURIComponent(applicationId)}/timeline`)); }
    catch (error) { showToast('error', 'Timeline Unavailable', error instanceof Error ? error.message : 'Could not load the student timeline.'); }
    finally { setTimelineLoading(false); }
  };

  useEffect(() => {
    if (!['ADMIN', 'INSTRUCTOR'].includes(currentRole || '')) return;
    if (!selectedAppId) { setStudentTimeline([]); setAdmissionNotes([]); setAdmissionTasks([]); return; }
    void loadStudentTimeline(selectedAppId);
    setAssignmentStaffId(applications.find(item => item.id === selectedAppId)?.assignedStaffId || '');
    void apiRequest<{ notes: AdmissionNote[]; tasks: AdmissionTask[] }>(`/admin/applications/${encodeURIComponent(selectedAppId)}/workflow`).then(result => { setAdmissionNotes(result.notes); setAdmissionTasks(result.tasks); }).catch(error => showToast('error', 'Workflow Unavailable', error instanceof Error ? error.message : 'Could not load notes and tasks.'));
  }, [selectedAppId, currentRole]);

  const assignApplication = async (applicationId: string, staffId: string) => {
    setWorkflowSaving(true);
    try { await apiRequest(`/admin/applications/${encodeURIComponent(applicationId)}/assignment`, { method: 'PUT', body: JSON.stringify({ staffId }) }); setAssignmentStaffId(staffId); showToast('success', 'Assignment Updated', staffId ? 'The application has a new owner.' : 'The application is now unassigned.'); void loadStudentTimeline(applicationId); }
    catch (error) { showToast('error', 'Assignment Failed', error instanceof Error ? error.message : 'Could not assign the application.'); }
    finally { setWorkflowSaving(false); }
  };

  const addInternalNote = async (applicationId: string) => {
    if (!internalNote.trim()) return; setWorkflowSaving(true);
    try { const note = await apiRequest<AdmissionNote>(`/admin/applications/${encodeURIComponent(applicationId)}/notes`, { method: 'POST', body: JSON.stringify({ body: internalNote }) }); setAdmissionNotes(current => [note, ...current]); setInternalNote(''); void loadStudentTimeline(applicationId); showToast('success', 'Internal Note Added', 'The note is visible to admissions staff only.'); }
    catch (error) { showToast('error', 'Note Not Added', error instanceof Error ? error.message : 'Could not save the note.'); }
    finally { setWorkflowSaving(false); }
  };

  const createFollowUpTask = async (applicationId: string) => {
    setWorkflowSaving(true);
    try { const task = await apiRequest<AdmissionTask>(`/admin/applications/${encodeURIComponent(applicationId)}/tasks`, { method: 'POST', body: JSON.stringify(taskForm) }); setAdmissionTasks(current => [...current, task].sort((a, b) => a.status.localeCompare(b.status) || a.dueDate.localeCompare(b.dueDate))); setTaskForm({ title: '', dueDate: '', priority: 'MEDIUM', assignedStaffId: assignmentStaffId }); void loadStudentTimeline(applicationId); showToast('success', 'Follow-up Created', 'The task was assigned successfully.'); }
    catch (error) { showToast('error', 'Task Not Created', error instanceof Error ? error.message : 'Could not create the follow-up task.'); }
    finally { setWorkflowSaving(false); }
  };

  const toggleFollowUpTask = async (applicationId: string, task: AdmissionTask) => {
    try { const updated = await apiRequest<AdmissionTask>(`/admin/applications/${encodeURIComponent(applicationId)}/tasks/${encodeURIComponent(task.id)}`, { method: 'PUT', body: JSON.stringify({ completed: task.status !== 'COMPLETED' }) }); setAdmissionTasks(current => current.map(item => item.id === updated.id ? updated : item)); void loadStudentTimeline(applicationId); }
    catch (error) { showToast('error', 'Task Not Updated', error instanceof Error ? error.message : 'Could not update the task.'); }
  };

  const openPopReview = async (payment: typeof payments[number]) => {
    if (popPreview) URL.revokeObjectURL(popPreview.url);
    setReviewingPaymentId(payment.id); setConfirmedPopAmount(String(payment.amountZAR)); setPopRejectionReason(''); setPopZoom(1); setPopRotation(0); setPopPreview(null); setPopPreviewLoading(true);
    try { setPopPreview(await apiGetPrivateBlob(`/payments/${encodeURIComponent(payment.id)}/proof`)); }
    catch (error) { showToast('error', 'POP Preview Unavailable', error instanceof Error ? error.message : 'Could not load the proof of payment.'); }
    finally { setPopPreviewLoading(false); }
  };
  const openStudentDocument = async (applicationId: string, type: string, recordId?: string) => {
    try {
      await apiOpenPrivate(`/admin/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(type)}${recordId ? `/${encodeURIComponent(recordId)}` : ''}`);
    } catch (error) {
      showToast('error', 'Document Unavailable', error instanceof Error ? error.message : 'The document could not be opened.');
    }
  };
  const closePopReview = () => { if (popPreview) URL.revokeObjectURL(popPreview.url); setPopPreview(null); setReviewingPaymentId(null); };

  // New Ticket Form State
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    title: '',
    category: 'ACTIVE_DIRECTORY',
    severity: 'MEDIUM' as 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW',
    userImpact: '',
    symptoms: '',
    vmEnvironment: 'DC01 (ad.ubuntu-mfg.co.za) & CLIENT01',
    brokenStateDetails: '',
    resolutionVerification: ''
  });

  // Certificate Generator State
  const [certStudentId, setCertStudentId] = useState(students[0]?.id || '');
  const [certGrade, setCertGrade] = useState('88% (Distinction)');

  // Email Automation State
  const [emailTemplates, setEmailTemplates] = useState<any[]>([
    {
      id: 'tpl-app-submitted',
      name: 'Application Received',
      trigger: 'APPLICATION_SUBMITTED',
      subject: 'Your TechLabs Academy Application Received',
      htmlBody: 'Thank you for applying to TechLabs Academy...',
      enabled: true,
      variables: ['studentName', 'cohortName', 'referenceNumber']
    },
    {
      id: 'tpl-app-approved',
      name: 'Application Approved',
      trigger: 'APPLICATION_APPROVED',
      subject: 'Congratulations! Your TechLabs Application is Approved',
      htmlBody: 'Welcome to TechLabs Academy...',
      enabled: true,
      variables: ['studentName', 'cohortName', 'cohortStartDate', 'invoiceAmount', 'dueDate']
    },
    {
      id: 'tpl-payment-verified',
      name: 'Payment Verified',
      trigger: 'PAYMENT_VERIFIED',
      subject: 'Payment Confirmed - Welcome to Your Course!',
      htmlBody: 'Your payment has been verified...',
      enabled: true,
      variables: ['studentName', 'amount', 'cohortName', 'courseStartDate']
    },
    {
      id: 'tpl-app-rejected',
      name: 'Application Not Accepted',
      trigger: 'APPLICATION_REJECTED',
      subject: 'Your TechLabs Application Status',
      htmlBody: 'Thank you for your interest...',
      enabled: true,
      variables: ['studentName']
    }
  ]);

  // Selected Application for Inspection Modal
  const selectedApp = applications.find(a => a.id === selectedAppId);
  const selectedAppInvoice = selectedApp ? invoices.find(invoice => invoice.studentEmail.toLowerCase() === selectedApp.email.toLowerCase()) : undefined;
  const selectedAppPayments = selectedAppInvoice ? payments.filter(payment => payment.invoiceId === selectedAppInvoice.id) : [];
  const selectedPendingPayment = selectedAppPayments.find(payment => payment.status === 'SUBMITTED');
  const reviewingPayment = payments.find(payment => payment.id === reviewingPaymentId);
  const reviewingApplication = reviewingPayment ? applications.find(application => application.id === reviewingPayment.studentId) : undefined;
  const reviewingInvoice = reviewingPayment ? invoices.find(invoice => invoice.id === reviewingPayment.invoiceId) : undefined;
  const reviewingCohort = reviewingApplication ? cohorts.find(cohort => cohort.id === reviewingApplication.cohortId) : undefined;
  const reviewingDuplicateCount = reviewingPayment ? payments.filter(payment => payment.id !== reviewingPayment.id && payment.sha256 === reviewingPayment.sha256).length : 0;
  const selectedAppCohort = selectedApp ? cohorts.find(cohort => cohort.id === selectedApp.cohortId) : undefined;
  const selectedAppLead = selectedApp ? leads.find(lead => lead.email.toLowerCase() === selectedApp.email.toLowerCase()) : undefined;

  useEffect(() => {
    if (!selectedAppInvoice) { setInstallments([]); return; }
    void apiRequest<PaymentInstallment[]>(`/admin/invoices/${encodeURIComponent(selectedAppInvoice.id)}/installments`).then(setInstallments).catch(() => setInstallments([]));
  }, [selectedAppInvoice?.id]);

  const startInstallmentEditor = () => {
    if (!selectedAppInvoice) return;
    if (installments.length) setInstallmentRows(installments.map(item => ({ label: item.label, amountZAR: String(item.amountZAR), dueDate: item.dueDate })));
    else { const deposit = Math.min(1000, selectedAppInvoice.amountZAR); const remainder = selectedAppInvoice.amountZAR - deposit; setInstallmentRows([{ label: 'Seat deposit', amountZAR: String(deposit), dueDate: selectedAppInvoice.dueDate }, { label: 'Installment 2', amountZAR: String(Math.round(remainder / 2 * 100) / 100), dueDate: '' }, { label: 'Final installment', amountZAR: String(Math.round((remainder - Math.round(remainder / 2 * 100) / 100) * 100) / 100), dueDate: '' }]); }
    setEditingInstallments(true);
  };
  const saveInstallmentPlan = async () => {
    if (!selectedAppInvoice) return; setInstallmentsSaving(true);
    try { const result = await apiRequest<PaymentInstallment[]>(`/admin/invoices/${encodeURIComponent(selectedAppInvoice.id)}/installments`, { method: 'PUT', body: JSON.stringify({ installments: installmentRows.map(row => ({ ...row, amountZAR: Number(row.amountZAR) })) }) }); setInstallments(result); setEditingInstallments(false); showToast('success', 'Payment Plan Saved', `${result.length} installments now total R${selectedAppInvoice.amountZAR.toLocaleString()}.`); }
    catch (error) { showToast('error', 'Payment Plan Not Saved', error instanceof Error ? error.message : 'Could not save the installment schedule.'); }
    finally { setInstallmentsSaving(false); }
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await adminLogin(adminForm.email, adminForm.password);
    if (!ok) {
      setAdminLoginError('Sign-in could not be completed. See the notification for the reason, then try again.');
      return;
    }
    setAdminLoginError('');
  };

  const handleApproveApplication = async (app: typeof applications[number]) => {
    const approved = await sendApprovalEmail(app, 'APPROVED');
    if (approved) void loadStudentTimeline(app.id);
  };

  const submitApplicationDecision = async (applicationId: string) => {
    if (!decisionStatus || decisionReason.trim().length < 10) return;
    setDecisionSaving(true); const saved = await recordApplicationDecision(applicationId, decisionStatus, decisionReason.trim()); setDecisionSaving(false);
    if (saved) { setDecisionStatus(null); setDecisionReason(''); void loadStudentTimeline(applicationId); }
  };

  const submitCohortTransfer = async (applicationId: string) => {
    if (!transferCohortId || transferReason.trim().length < 10) return;
    setTransferSaving(true); const saved = await transferApplicationCohort(applicationId, transferCohortId, transferReason.trim()); setTransferSaving(false);
    if (saved) { setShowCohortTransfer(false); setTransferCohortId(''); setTransferReason(''); void loadStudentTimeline(applicationId); }
  };
  const startStudentRecordEdit = (application: typeof applications[number]) => { setRecordForm({ firstName: application.firstName, lastName: application.lastName, email: application.email, whatsapp: application.whatsapp, city: application.city, province: application.province, selectedTier: application.selectedTier, laptopBrand: application.laptopBrand, cpu: application.cpu, ramGB: application.ramGB, storageType: application.storageType, freeStorageGB: application.freeStorageGB, os: application.os, hasVirtualizationEnabled: application.hasVirtualizationEnabled }); setEditingStudentRecord(true); };
  const saveStudentRecord = async (applicationId: string) => { setRecordSaving(true); const saved = await updateStudentRecord(applicationId, recordForm); setRecordSaving(false); if (saved) { setEditingStudentRecord(false); void loadStudentTimeline(applicationId); } };
  const handleDeleteStudent = async (application: typeof applications[number]) => {
    const confirmed = window.confirm(`Delete ${application.firstName} ${application.lastName}'s unused student record? This cannot be undone.`);
    if (!confirmed) return;
    const deleted = await deleteStudentRecord(application.id);
    if (deleted) { setSelectedAppId(null); setEditingStudentRecord(false); }
  };

  const handleEmailInvoice = async (invoice: Invoice) => {
    setEmailingInvoiceId(invoice.id);
    try {
      const result = await apiRequest<{ message: string }>(`/invoices/${encodeURIComponent(invoice.id)}/email`, { method: 'POST' });
      showToast('success', 'Invoice Emailed', result.message);
    } catch (error) {
      showToast('error', 'Invoice Email Failed', error instanceof Error ? error.message : 'The invoice could not be emailed.');
    } finally {
      setEmailingInvoiceId(null);
    }
  };

  const handleSaveSettings = async () => {
    if (settingsSaving) return;
    setSettingsSaving(true);
    await saveSettings();
    setSettingsSaving(false);
  };

  const handleExportCsv = () => {
    const headers = [
      'referenceNumber',
      'submissionDate',
      'firstName',
      'lastName',
      'email',
      'whatsapp',
      'city',
      'province',
      'selectedTier',
      'cohortId',
      'status',
      'paymentOption',
      'isLaptopCompliant',
      'currentRole'
    ];

    const rows = applications.map((app) => [
      app.referenceNumber,
      app.submissionDate,
      app.firstName,
      app.lastName,
      app.email,
      app.whatsapp,
      app.city,
      app.province,
      app.selectedTier,
      app.cohortId,
      app.status,
      app.paymentOption || 'DEPOSIT',
      String(app.isLaptopCompliant),
      app.currentRole
    ].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'techlabs_applications.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLeadsCsv = () => {
    const headers = ['name', 'email', 'whatsapp', 'source', 'courseInterest', 'status', 'followUpDate', 'createdAt'];
    const rows = leads.map((lead) => [
      lead.name,
      lead.email,
      lead.whatsapp,
      lead.source,
      lead.courseInterest,
      lead.status,
      lead.followUpDate,
      lead.createdAt
    ].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'techlabs_leads.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date().toISOString().slice(0, 10);
  const activeRecruitmentStatuses: LeadStatus[] = ['NEW_LEAD', 'CONTACTED', 'INTERESTED', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'APPROVED', 'PAYMENT_PENDING'];
  const filteredLeads = leads.filter(lead => {
    const query = leadSearch.trim().toLowerCase();
    const matchesSearch = !query || [lead.name, lead.email, lead.whatsapp, lead.courseInterest, lead.source].some(value => String(value).toLowerCase().includes(query));
    const matchesStatus = leadStatusFilter === 'ALL' || (leadStatusFilter === 'DUE' ? activeRecruitmentStatuses.includes(lead.status) && lead.followUpDate <= today : lead.status === leadStatusFilter);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate) || b.createdAt.localeCompare(a.createdAt));
  const selectedLead = leads.find(lead => lead.id === selectedLeadId);
  const leadApplication = selectedLead ? applications.find(application => application.email.toLowerCase() === selectedLead.email.toLowerCase()) : undefined;
  const dueLeadCount = leads.filter(lead => activeRecruitmentStatuses.includes(lead.status) && lead.followUpDate <= today).length;
  const openLeadWorkspace = (leadId: string) => {
    setSelectedLeadId(leadId);
    setLeadNote('');
    window.setTimeout(() => document.getElementById('lead-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };
  const startModuleEdit = (module: typeof courseModules[number]) => {
    setCreatingModule(false);
    setEditingModuleNumber(module.number);
    setModuleForm({ title: module.title, duration: module.duration, summary: module.summary, learningOutcomes: module.learningOutcomes.join('\n'), practicalLabs: module.practicalLabs.join('\n'), exampleTickets: module.exampleTickets.join('\n'), technologies: module.technologies.join('\n'), published: module.published !== false });
    window.setTimeout(() => document.getElementById('curriculum-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };
  const startModuleCreate = () => {
    setEditingModuleNumber(null); setCreatingModule(true);
    setModuleForm({ title: '', duration: '', summary: '', learningOutcomes: '', practicalLabs: '', exampleTickets: '', technologies: '', published: true });
    window.setTimeout(() => document.getElementById('curriculum-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };
  const submitModuleEdit = async () => {
    if (!editingModuleNumber && !creatingModule) return; setCurriculumSaving(true);
    const toList = (value: string) => value.split('\n').map(item => item.trim()).filter(Boolean);
    const payload = { title: moduleForm.title, duration: moduleForm.duration, summary: moduleForm.summary, learningOutcomes: toList(moduleForm.learningOutcomes), practicalLabs: toList(moduleForm.practicalLabs), exampleTickets: toList(moduleForm.exampleTickets), technologies: toList(moduleForm.technologies), published: moduleForm.published };
    const saved = creatingModule ? await createCourseModule(payload) : await saveCourseModule(editingModuleNumber!, payload);
    setCurriculumSaving(false); if (saved) { setEditingModuleNumber(null); setCreatingModule(false); }
  };

  // Metrics
  const totalRevenue = invoices
    .filter(i => i.status === 'VERIFIED')
    .reduce((acc, curr) => {
      const actualPaid = curr.paidZAR ?? Math.max(0, curr.amountZAR - curr.balanceZAR);
      return acc + actualPaid;
    }, 0);
  const pendingApps = applications.filter(a => a.status === 'NEW' || a.status === 'LAPTOP_REVIEW' || a.status === 'UNDER_REVIEW');
  const visibleAuditLogs = auditLogs.filter(log => `${log.action} ${log.actorEmail} ${log.entityType} ${log.entityId} ${log.summary}`.toLowerCase().includes(auditSearch.toLowerCase()));
  const getPipelineStage = (application: typeof applications[number]): PipelineStage => {
    if (application.status === 'COMPLETED' || certificates.some(certificate => certificate.studentId === application.id)) return 'COMPLETED';
    if (application.status === 'ENROLLED') return 'ENROLLED';
    if (['REJECTED', 'WAITLISTED', 'WITHDRAWN'].includes(application.status)) return 'OTHER';
    if (application.status === 'NEW') return 'NEW';
    if (application.status === 'UNDER_REVIEW') return 'HARDWARE_REVIEW';
    const invoice = invoices.find(item => item.studentEmail.toLowerCase() === application.email.toLowerCase());
    if (!invoice) return 'APPROVED';
    if (payments.some(payment => payment.invoiceId === invoice.id && payment.status === 'SUBMITTED')) return 'POP_SUBMITTED';
    if ((invoice.paidZAR ?? 0) >= Math.min(1000, invoice.amountZAR)) return 'ENROLLED';
    return 'AWAITING_DEPOSIT';
  };
  const getPaymentState = (application: typeof applications[number]) => {
    const invoice = invoices.find(item => item.studentEmail.toLowerCase() === application.email.toLowerCase());
    if (!invoice) return 'NO_INVOICE';
    if (payments.some(payment => payment.invoiceId === invoice.id && payment.status === 'SUBMITTED')) return 'POP_SUBMITTED';
    if (invoice.balanceZAR === 0) return 'PAID_FULL';
    if ((invoice.paidZAR ?? 0) > 0) return 'PARTIALLY_PAID';
    return 'UNPAID';
  };
  const pipelineBaseApplications = applications.filter(application => (pipelineCohort === 'ALL' || application.cohortId === pipelineCohort)
      && (pipelinePayment === 'ALL' || getPaymentState(application) === pipelinePayment)
      && (!pipelineDateFrom || application.submissionDate >= pipelineDateFrom)
      && (!pipelineDateTo || application.submissionDate <= pipelineDateTo));
  const filteredApplications = pipelineBaseApplications.filter(application => (pipelineStage === 'ALL' || getPipelineStage(application) === pipelineStage)
    && `${application.firstName} ${application.lastName} ${application.email} ${application.whatsapp} ${application.referenceNumber}`.toLowerCase().includes(pipelineSearch.trim().toLowerCase()));
  const exportCohortRoster = (cohort: typeof cohorts[number]) => {
    const roster = applications.filter(application => application.cohortId === cohort.id && ['ENROLLED', 'COMPLETED'].includes(application.status));
    const headers = ['Student name', 'Email', 'Plan', 'Session track', 'Cohort', 'Schedule', 'Status'];
    const csvValue = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = roster.map(student => [
      `${student.firstName} ${student.lastName}`,
      student.email,
      TIER_CARD_DEFAULTS[student.selectedTier].displayName,
      SESSION_TRACKS[student.selectedTier].name,
      cohort.name,
      cohort.scheduleFormat,
      student.status,
    ].map(csvValue).join(','));
    const csv = [headers.map(csvValue).join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cohort.id}-student-roster.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const reviewApplication = (application: typeof applications[number]) => {
    setSelectedAppId(application.id);
    if (application.status === 'NEW') updateApplicationStatus(application.id, 'UNDER_REVIEW', 'Hardware review started by admissions.');
    window.setTimeout(() => document.getElementById('application-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };
  const verifiedStudentsCount = students.length;

  if (currentRole !== 'ADMIN' && currentRole !== 'INSTRUCTOR') {
    return (
      <div className="w-full h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="max-w-xl w-full px-4">
        <div className="bg-[#FFFFFF] border border-[#E0E0E0] rounded-2xl shadow-sm p-8 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#707070]">Admin Access</span>
            <h1 className="text-3xl font-light text-[#000000] tracking-tight">Sign in to the admissions console</h1>
          </div>

          <form onSubmit={handleAdminSignIn} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Admin Email</label>
              <input
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#000000] outline-none focus:border-[#000000]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Password</label>
              <input
                type="password"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#000000] outline-none focus:border-[#000000]"
              />
            </div>

            {adminLoginError && <p className="text-[#707070]">{adminLoginError}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl"
            >
              Sign In
            </button>
          </form>

          <div className="rounded-xl bg-[#FAFAFA] border border-[#E0E0E0] p-3 text-[11px] text-[#707070]">
            Administrator access is configured securely on the server.
          </div>
        </div>
      </div>
      </div>
    );
  }

  const handleCohortEdit = (cohort: typeof cohorts[number]) => {
    setEditingCohortId(cohort.id);
    setCohortForm({
      name: cohort.name,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      scheduleFormat: cohort.scheduleFormat,
      deliveryMode: cohort.deliveryMode,
      location: cohort.location,
      teamsChannelUrl: cohort.teamsChannelUrl || '',
      capacity: cohort.capacity,
      status: cohort.status
    });
  };

  const handleSaveCohort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCohortId) return;

    const selectedCohort = cohorts.find((cohort) => cohort.id === editingCohortId);
    updateCohort(editingCohortId, {
      ...cohortForm,
      capacity: Number(cohortForm.capacity),
      enrolledCount: selectedCohort?.enrolledCount ?? 0
    });
    setEditingCohortId(null);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket({
      ticketNumber: `INT-${Math.floor(1000 + Math.random() * 9000)}`,
      moduleNumber: 4,
      title: newTicketData.title,
      category: newTicketData.category,
      severity: newTicketData.severity,
      userImpact: newTicketData.userImpact,
      symptoms: newTicketData.symptoms,
      vmEnvironment: newTicketData.vmEnvironment,
      brokenStateDetails: newTicketData.brokenStateDetails,
      resolutionVerification: newTicketData.resolutionVerification,
      status: 'OPEN'
    });
    setNewTicketModal(false);
    setNewTicketData({
      title: '',
      category: 'ACTIVE_DIRECTORY',
      severity: 'MEDIUM' as any,
      userImpact: '',
      symptoms: '',
      vmEnvironment: 'DC01 & CLIENT01',
      brokenStateDetails: '',
      resolutionVerification: ''
    });
  };

  const handleIssueCert = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === certStudentId) || students[0];
    if (!st) return;

    issueCertificate({
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      courseName: 'IT Support & Enterprise Administration Bootcamp',
      completionDate: new Date().toISOString().slice(0, 10),
      instructorName: settings.leadInstructorName || 'TechLabs Instruction Team',
      cohortName: 'Cape Town Cohort Alpha (Oct 2026)',
      practicalGrade: certGrade,
      skillsAcquired: [
        'Enterprise VMware Virtualization & Isolated VMnet2 Switching',
        'Windows Server 2022 & Active Directory Domain Services Forest Architecture',
        'Microsoft 365, Entra ID Cloud Connector & Conditional Access',
        'Microsoft Intune MDM Compliance Policies & BitLocker Escrow',
        'Microsoft Defender for Endpoint Threat Hunting & Live Response',
        'PowerShell 7 Automation Cmdlets & Scripted Ticket Remediation'
      ]
    });
    alert(`Certificate successfully generated for ${st.firstName} ${st.lastName}!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#FFFFFF] text-[#1A1A1A]">
      {/* Admin Top Banner */}
      <div className="bg-[#FAFAFA] text-[#1A1A1A] rounded-2xl p-6 sm:p-8 border border-[#E0E0E0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-[#000000] text-white px-2.5 py-0.5 rounded-full uppercase tracking-[0.2em]">
              Academy Administrator Console
            </span>
            <span className="text-xs text-[#707070] font-mono">
              {currentRole === 'INSTRUCTOR' ? 'Instructor Workspace' : 'Administration Workspace'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
            TechLabs Academy Operations Hub
          </h1>

          <p className="text-xs sm:text-sm text-[#707070]">
            Virtual & Hybrid Cohorts • Admissions Pipeline & Virtual Lab Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('APPLICATIONS')}
            className="px-4 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] flex items-center gap-1.5 transition shadow"
          >
            <Users className="w-4 h-4" />
            <span>Applications ({pendingApps.length} Pending)</span>
          </button>
        </div>
      </div>

      <nav aria-label="Administration sections" className="space-y-3 rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-3 shadow-sm">
        {([
          ['Operations', [{ id: 'OVERVIEW', label: 'Overview', icon: TrendingUp }, { id: 'APPLICATIONS', label: `Applications (${applications.length})`, icon: Users }, { id: 'LEADS', label: `Leads (${leads.length})`, icon: MessageSquare }]],
          ['Finance', [{ id: 'INVOICES', label: `Invoices (${invoices.length})`, icon: FileText }, { id: 'BULK_OPS', label: 'Bulk operations', icon: Zap }]],
          ['Learning', [{ id: 'COHORTS', label: `Cohorts (${cohorts.length})`, icon: Calendar }, { id: 'TICKETS', label: 'Tickets', icon: Terminal }, { id: 'LAB_MACHINES', label: 'Lab Machines', icon: Terminal }, { id: 'CERTIFICATES', label: `Certificates (${certificates.length})`, icon: Award }, ...(currentRole === 'ADMIN' ? [{ id: 'CURRICULUM' as AdminTab, label: 'Curriculum', icon: Layers }] : [])]],
          ['System', [{ id: 'EMAIL_AUTOMATION', label: 'Email templates', icon: Mail }, { id: 'AUDIT_LOG', label: 'Audit log', icon: ScrollText }, ...(currentRole === 'ADMIN' ? [{ id: 'STAFF' as AdminTab, label: 'Staff', icon: Users }, { id: 'SETTINGS' as AdminTab, label: 'Settings', icon: Settings }] : [])]],
        ] as Array<[string, Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }>]>).map(([group, tabs]) => (
          <div key={group} className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <span className="w-24 shrink-0 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#707070]">{group}</span>
            <div className="flex min-w-0 gap-1 overflow-x-auto pb-1 sm:pb-0">
              {tabs.map(tab => { const Icon = tab.icon; const selected = activeTab === tab.id; return <button key={tab.id} type="button" aria-current={selected ? 'page' : undefined} onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold transition ${selected ? 'bg-black text-white shadow-sm' : 'text-[#555] hover:bg-white hover:text-black'}`}><Icon className="h-3.5 w-3.5" /><span>{tab.label}</span></button>; })}
            </div>
          </div>
        ))}
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'LAB_MACHINES' && <LabPilotPanel staff />}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Top 4 Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E0E0E0] shadow-sm space-y-1">
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase font-bold tracking-wider">Total Applicants</span>
              <div className="text-3xl font-light text-[#000000]">{applications.length}</div>
              <p className="text-xs text-[#707070] font-medium">Cape Town & Hybrid applicants</p>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E0E0E0] shadow-sm space-y-1">
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase font-bold tracking-wider">Verified Revenue (ZAR)</span>
              <div className="text-3xl font-light text-[#000000]">R{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-[#707070]">Paid deposits & full tuition</p>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E0E0E0] shadow-sm space-y-1">
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase font-bold tracking-wider">Active Cohort Seats</span>
              <div className="text-3xl font-light text-[#000000]">
                {cohorts.reduce((a, c) => a + c.enrolledCount, 0)} / {cohorts.reduce((a, c) => a + c.capacity, 0)}
              </div>
              <p className="text-xs text-[#707070] font-medium">October & November cohorts</p>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E0E0E0] shadow-sm space-y-1">
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase font-bold tracking-wider">Live Ticket Queue</span>
              <div className="text-3xl font-light text-[#000000]">
                {tickets.filter(t => t.status !== 'RESOLVED').length} Active
              </div>
              <p className="text-xs text-[#707070]">Simulated enterprise incidents</p>
            </div>
          </div>

          <section className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-base">Action Centre</h3><p className="text-[11px] text-[#707070]">Admissions, finance and follow-up items requiring attention.</p></div><button type="button" disabled={actionCentreLoading} onClick={() => { setActionCentreLoading(true); void apiRequest<ActionCentreData>('/admin/action-centre').then(setActionCentre).finally(() => setActionCentreLoading(false)); }} className="px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-[10px] font-bold uppercase">{actionCentreLoading ? 'Refreshing…' : 'Refresh'}</button></div>
            {actionCentre ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">{([
              ['hardware', 'Hardware Review', Laptop, 'Applications waiting for laptop verification'],
              ['pops', 'POP Verification', CreditCard, 'Submitted payments awaiting review'],
              ['overdue', 'Overdue Balances', AlertTriangle, 'Invoices or installments past due'],
              ['cohorts', 'Cohort Capacity', Users, 'Active cohorts with three or fewer seats'],
              ['emails', 'Email Delivery', Mail, 'Failed, bounced or suppressed messages'],
              ['followUps', 'Student Follow-ups', CheckCircle, 'Students with open internal tasks'],
            ] as Array<[keyof Omit<ActionCentreData, 'generatedAt'>, string, React.ComponentType<{ className?: string }>, string]>).map(([key, title, Icon, description]) => { const group = actionCentre[key]; return <article key={key} className={`rounded-xl border p-4 space-y-3 ${group.count ? 'border-[#000000]' : 'border-[#E0E0E0]'}`}><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="w-8 h-8 rounded-lg bg-[#FAFAFA] border border-[#E0E0E0] flex items-center justify-center"><Icon className="w-4 h-4" /></span><div><h4 className="text-xs font-bold">{title}</h4><p className="text-[10px] text-[#707070]">{description}</p></div></div><span className={`min-w-7 h-7 px-2 rounded-full flex items-center justify-center text-[11px] font-bold ${group.count ? 'bg-black text-white' : 'bg-[#FAFAFA] text-[#707070]'}`}>{group.count}</span></div>{group.items.length ? <div className="space-y-1.5">{group.items.slice(0, 3).map(item => <button key={item.id} type="button" onClick={() => openActionItem(key, item)} className="w-full text-left p-2 rounded-lg bg-[#FAFAFA] hover:bg-[#EAEAEA]"><strong className="block text-[11px] truncate">{item.label}</strong><span className="block text-[9px] text-[#707070] truncate">{item.detail}</span></button>)}{group.count > 3 && <button type="button" onClick={() => group.items[0] && openActionItem(key, group.items[0])} className="text-[9px] font-bold uppercase hover:underline">View all {group.count}</button>}</div> : <p className="text-[10px] text-[#008000]">No action required.</p>}</article>; })}</div> : <p className="py-8 text-center text-xs text-[#707070]">{actionCentreLoading ? 'Loading action centre…' : 'No alert data available.'}</p>}
          </section>

          {/* Quick Pending Applications Queue */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#000000]">
                Recent Applications Requiring Laptop Verification
              </h3>
              <button
                onClick={() => setActiveTab('APPLICATIONS')}
                className="text-xs font-bold text-[#000000] hover:text-neutral-700 uppercase tracking-wider"
              >
                View All Pipeline →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E0E0E0] text-[#707070] font-mono text-[10px] uppercase tracking-wider">
                    <th className="pb-3 font-bold">Applicant</th>
                    <th className="pb-3 font-bold">Laptop Hardware</th>
                    <th className="pb-3 font-bold">Program Tier</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]">
                  {applications.slice(0, 5).map((app) => (
                    <tr key={app.id} className="hover:bg-[#FAFAFA]">
                      <td className="py-3">
                        <strong className="text-[#000000]">{app.firstName} {app.lastName}</strong>
                        <span className="text-[#707070] block text-[11px]">{app.city}, {app.province}</span>
                      </td>
                      <td className="py-3 font-mono text-[11px]">
                        {app.laptopBrand || 'Custom PC'} • {app.ramGB} GB RAM
                        <span className={app.isLaptopCompliant ? 'text-[#000000] block font-bold' : 'text-[#707070] block'}>
                          {app.isLaptopCompliant ? '✔ 16GB Compliant' : '⚠️ Review Specs'}
                        </span>
                      </td>
                      <td className="py-3 font-mono">{app.selectedTier}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${
                          app.status === 'APPROVED' || app.status === 'ENROLLED'
                            ? 'bg-[#000000] text-white border-[#000000]'
                            : 'bg-[#FAFAFA] text-[#000000] border-[#E0E0E0]'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedAppId(app.id);
                            setActiveTab('APPLICATIONS');
                          }}
                          className="px-3 py-1 bg-[#000000] hover:bg-neutral-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider"
                        >
                          Inspect Hardware
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPLICATIONS PIPELINE */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-light text-[#000000] tracking-tight">Student Admissions Pipeline</h3>
              <p className="text-xs text-[#707070]">Review laptop hardware compliance, approve applications, and issue student onboarding access.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="px-4 py-2 bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#E0E0E0]"
              >
                Export CSV
              </button>
              <button
                onClick={() => logout()}
                className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#E0E0E0]"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setPipelineStage('ALL')} className={`shrink-0 px-3 py-2 rounded-lg border text-[10px] font-bold uppercase ${pipelineStage === 'ALL' ? 'bg-black text-white border-black' : 'bg-white border-[#E0E0E0]'}`}>All <span className="ml-1 opacity-70">{pipelineBaseApplications.length}</span></button>
              {PIPELINE_STAGES.map(stage => {
                const count = pipelineBaseApplications.filter(application => getPipelineStage(application) === stage.id).length;
                return <button key={stage.id} type="button" onClick={() => setPipelineStage(stage.id)} className={`shrink-0 px-3 py-2 rounded-lg border text-[10px] font-bold uppercase ${pipelineStage === stage.id ? 'bg-black text-white border-black' : 'bg-white border-[#E0E0E0]'}`}>{stage.label} <span className="ml-1 opacity-70">{count}</span></button>;
              })}
            </div>
            <div className="flex flex-col lg:flex-row gap-3">
              <input value={pipelineSearch} onChange={event => setPipelineSearch(event.target.value)} placeholder="Search student, email, phone or reference…" className="flex-1 min-w-0 p-2.5 border border-[#E0E0E0] rounded-lg text-xs" />
              <select aria-label="Application stage" value={pipelineStage} onChange={event => setPipelineStage(event.target.value as PipelineStage | 'ALL')} className="lg:w-56 p-2.5 border border-[#E0E0E0] rounded-lg bg-white text-xs font-bold"><option value="ALL">All workflow stages</option>{PIPELINE_STAGES.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}<option value="OTHER">Rejected / Waitlisted</option></select>
              <button type="button" onClick={() => setShowAdvancedPipelineFilters(value => !value)} className="px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-[10px] font-bold uppercase tracking-wider">{showAdvancedPipelineFilters ? 'Hide filters' : 'More filters'}</button>
            </div>
            {showAdvancedPipelineFilters && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E0E0E0] text-[10px] font-mono">
              <label className="space-y-1"><span className="font-bold uppercase text-[#707070]">Cohort</span><select value={pipelineCohort} onChange={event => setPipelineCohort(event.target.value)} className="w-full p-2.5 border border-[#E0E0E0] rounded-lg bg-white"><option value="ALL">All cohorts</option>{cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}</select></label>
              <label className="space-y-1"><span className="font-bold uppercase text-[#707070]">Payment</span><select value={pipelinePayment} onChange={event => setPipelinePayment(event.target.value)} className="w-full p-2.5 border border-[#E0E0E0] rounded-lg bg-white"><option value="ALL">All payment states</option><option value="UNPAID">Unpaid</option><option value="POP_SUBMITTED">POP submitted</option><option value="PARTIALLY_PAID">Partially paid</option><option value="PAID_FULL">Paid in full</option><option value="NO_INVOICE">No invoice</option></select></label>
              <label className="space-y-1"><span className="font-bold uppercase text-[#707070]">Applied from</span><input type="date" value={pipelineDateFrom} onChange={event => setPipelineDateFrom(event.target.value)} className="w-full p-2.5 border border-[#E0E0E0] rounded-lg" /></label>
              <label className="space-y-1"><span className="font-bold uppercase text-[#707070]">Applied to</span><input type="date" value={pipelineDateTo} onChange={event => setPipelineDateTo(event.target.value)} className="w-full p-2.5 border border-[#E0E0E0] rounded-lg" /></label>
            </div>}
            <div className="flex items-center justify-between gap-3 text-[11px]"><span className="text-[#707070]"><strong className="text-black">{filteredApplications.length}</strong> applications</span><button type="button" onClick={() => { setPipelineSearch(''); setPipelineCohort('ALL'); setPipelineStage('ALL'); setPipelinePayment('ALL'); setPipelineDateFrom(''); setPipelineDateTo(''); }} className="font-bold uppercase tracking-wider hover:underline">Reset</button></div>
          </div>

          {/* Application Detail Inspection Modal */}
          {selectedApp && (
            <div id="application-workspace" className="bg-[#FAFAFA] text-[#1A1A1A] p-6 sm:p-8 rounded-2xl border-2 border-[#000000] shadow-xl space-y-6 scroll-mt-4">
              <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
                <div>
                  <span className="text-xs font-mono text-[#707070]">Application Reference: {selectedApp.referenceNumber}</span>
                  <h4 className="text-xl font-bold text-[#000000] mt-0.5">
                    {selectedApp.firstName} {selectedApp.lastName}
                  </h4>
                </div>
                <div className="flex items-center gap-2">{currentRole === 'ADMIN' && <><button onClick={() => editingStudentRecord ? setEditingStudentRecord(false) : startStudentRecordEdit(selectedApp)} className="px-3 py-1.5 border border-[#E0E0E0] bg-white rounded-lg text-[10px] font-bold uppercase">{editingStudentRecord ? 'Cancel Edit' : 'Edit Record'}</button><button onClick={() => void handleDeleteStudent(selectedApp)} className="px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold uppercase hover:bg-red-100">Delete</button></>}<button onClick={() => setSelectedAppId(null)} className="text-xs font-mono uppercase text-[#707070] hover:text-[#000000]">Close Inspection</button></div>
              </div>

              {editingStudentRecord && <section className="p-5 bg-white rounded-xl border-2 border-black space-y-4"><div><h5 className="font-bold text-sm">Edit Student Record</h5><p className="text-[11px] text-[#707070]">Cohort transfers and installment schedules remain in their dedicated controlled workflows below.</p></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">{([
                ['firstName','First name','text'],['lastName','Last name','text'],['email','Email','email'],['whatsapp','WhatsApp','text'],['city','City','text'],['province','Province','text'],['laptopBrand','Laptop brand/model','text'],['cpu','Processor','text'],['freeStorageGB','Free storage (GB)','number'],['os','Operating system','text']
              ] as Array<[keyof typeof recordForm,string,string]>).map(([key,label,type]) => <label key={String(key)} className="space-y-1"><span className="text-[10px] font-bold uppercase">{label}</span><input type={type} value={String(recordForm[key] ?? '')} onChange={event => setRecordForm(current => ({ ...current, [key]: type === 'number' ? Number(event.target.value) : event.target.value }))} className="w-full p-2.5 border border-[#E0E0E0] rounded-lg" /></label>)}<label className="space-y-1"><span className="text-[10px] font-bold uppercase">RAM</span><select value={recordForm.ramGB || 16} onChange={event => setRecordForm(current => ({ ...current, ramGB: Number(event.target.value) }))} className="w-full p-2.5 border border-[#E0E0E0] rounded-lg bg-white"><option value={8}>8 GB</option><option value={16}>16 GB</option><option value={32}>32 GB</option><option value={64}>64 GB</option><option value={128}>128 GB</option></select></label><label className="space-y-1"><span className="text-[10px] font-bold uppercase">Storage type</span><select value={recordForm.storageType || ''} onChange={event => setRecordForm(current => ({ ...current, storageType: event.target.value }))} className="w-full p-2.5 border border-[#E0E0E0] rounded-lg bg-white"><option value="NVMe SSD">NVMe SSD</option><option value="SATA SSD">SATA SSD</option><option value="HDD (Hard Disk Drive)">HDD</option></select></label><label className="space-y-1"><span className="text-[10px] font-bold uppercase">Course tier</span><select value={recordForm.selectedTier || 'STARTER'} onChange={event => setRecordForm(current => ({ ...current, selectedTier: event.target.value as CourseTier }))} className="w-full p-2.5 border border-[#E0E0E0] rounded-lg bg-white"><option value="STARTER">Starter</option><option value="PROFESSIONAL">Professional</option><option value="CAREER_ACCELERATOR">Career Accelerator</option></select></label></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={Boolean(recordForm.hasVirtualizationEnabled)} onChange={event => setRecordForm(current => ({ ...current, hasVirtualizationEnabled: event.target.checked }))} className="accent-black" /><span>Hardware virtualization supported/enabled</span></label><div className="flex justify-end"><button type="button" disabled={recordSaving} onClick={() => void saveStudentRecord(selectedApp.id)} className="px-5 py-2.5 bg-black disabled:bg-[#E0E0E0] text-white rounded-xl text-[10px] font-bold uppercase">{recordSaving ? 'Saving…' : 'Save Audited Changes'}</button></div></section>}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-1">
                  <span className="text-[#A0A0A0] uppercase text-[10px] block font-bold">Contact:</span>
                  <p className="text-[#000000]">{selectedApp.email}<br />{selectedApp.whatsapp}<br />{selectedApp.city}, {selectedApp.province}</p>
                </div>

                <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-1">
                  <span className="text-[#A0A0A0] uppercase text-[10px] block font-bold">IT Background:</span>
                  <p className="text-[#000000]">{selectedApp.highestQualification}<br />Exp: {selectedApp.itExperienceYears}<br />Status: {selectedApp.currentEmploymentStatus}</p>
                </div>

                <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-1">
                  <span className="text-[#A0A0A0] uppercase text-[10px] block font-bold">Laptop Hardware:</span>
                  <p className="text-[#000000] font-bold">{selectedApp.laptopBrand || 'Verified Laptop'}<br />{selectedApp.cpu || 'Multi-Core'}<br />{selectedApp.ramGB} GB RAM • {selectedApp.storageType}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <section className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-3">
                  <div className="flex items-center justify-between"><h5 className="font-bold text-sm">Hardware Inspection</h5><span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold ${selectedApp.isLaptopCompliant ? 'bg-black text-white' : 'bg-[#FAFAFA] border border-[#E0E0E0] text-[#707070]'}`}>{selectedApp.isLaptopCompliant ? 'COMPLIANT' : 'REVIEW REQUIRED'}</span></div>
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div><span className="text-[#707070] block">Operating system</span><strong>{selectedApp.os}</strong></div>
                    <div><span className="text-[#707070] block">Processor</span><strong>{selectedApp.cpu}</strong></div>
                    <div><span className="text-[#707070] block">Memory</span><strong>{selectedApp.ramGB} GB RAM</strong></div>
                    <div><span className="text-[#707070] block">Storage</span><strong>{selectedApp.storageType} • {selectedApp.freeStorageGB} GB free</strong></div>
                    <div className="col-span-2"><span className="text-[#707070] block">Hardware virtualization</span><strong>{selectedApp.hasVirtualizationEnabled ? 'Supported / enabled' : 'Not confirmed'}</strong></div>
                  </div>
                </section>

                <section className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-3">
                  <div className="flex items-center justify-between gap-3"><h5 className="font-bold text-sm">Course & Intake</h5>{currentRole === 'ADMIN' && selectedApp.status !== 'COMPLETED' && <button type="button" onClick={() => { setShowCohortTransfer(value => !value); setTransferCohortId(''); setTransferReason(''); }} className="px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-[10px] font-bold uppercase">{showCohortTransfer ? 'Cancel Transfer' : 'Transfer Cohort'}</button>}</div>
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div><span className="text-[#707070] block">Tier</span><strong>{selectedApp.selectedTier}</strong></div>
                    <div><span className="text-[#707070] block">Payment plan</span><strong>{selectedApp.paymentOption || 'DEPOSIT'}</strong></div>
                    <div className="col-span-2"><span className="text-[#707070] block">Cohort</span><strong>{selectedAppCohort?.name || selectedApp.cohortId}</strong></div>
                    <div><span className="text-[#707070] block">Submitted</span><strong>{selectedApp.submissionDate}</strong></div>
                    <div><span className="text-[#707070] block">Marketing consent</span><strong>{selectedApp.marketingConsent ? 'Yes' : 'No'}</strong></div>
                  </div>
                  {showCohortTransfer && <div className="pt-3 border-t border-[#E0E0E0] space-y-3"><p className="text-[11px] text-[#707070]">Payments, invoices, POPs, documents, notes, tasks and timeline history remain attached to this student.</p><select aria-label="Destination cohort" value={transferCohortId} onChange={event => setTransferCohortId(event.target.value)} className="w-full p-2.5 bg-white border border-[#E0E0E0] rounded-lg text-xs"><option value="">Select destination cohort…</option>{cohorts.filter(cohort => cohort.id !== selectedApp.cohortId && !['Closed', 'Completed'].includes(cohort.status)).map(cohort => <option key={cohort.id} value={cohort.id}>{cohort.name} · {Math.max(0, cohort.capacity - cohort.enrolledCount)} seats remaining · {cohort.startDate}</option>)}</select><textarea value={transferReason} onChange={event => setTransferReason(event.target.value)} minLength={10} maxLength={1000} rows={3} placeholder="Reason for transferring this student…" className="w-full p-3 border border-[#E0E0E0] rounded-xl text-xs resize-y" /><button type="button" disabled={transferSaving || !transferCohortId || transferReason.trim().length < 10} onClick={() => void submitCohortTransfer(selectedApp.id)} className="px-4 py-2 bg-black disabled:bg-[#E0E0E0] text-white rounded-lg text-[10px] font-bold uppercase">{transferSaving ? 'Transferring…' : 'Confirm Transfer & Email Student'}</button></div>}
                </section>
              </div>

              <section className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
                  <div><h5 className="font-bold text-sm">Admissions Owner & Follow-ups</h5><p className="text-[11px] text-[#707070]">Internal assignments, notes and tasks are never shown to the student.</p></div>
                  <label className="space-y-1 text-[10px] font-bold uppercase tracking-wider lg:w-72"><span>Application owner</span><select disabled={workflowSaving} value={assignmentStaffId} onChange={event => void assignApplication(selectedApp.id, event.target.value)} className="w-full p-2.5 bg-white border border-[#E0E0E0] rounded-lg text-xs normal-case"><option value="">Unassigned</option>{staffAccounts.filter(staff => staff.active).map(staff => <option key={staff.id} value={staff.id}>{staff.name} · {staff.role}</option>)}</select></label>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h6 className="text-[10px] font-bold uppercase tracking-wider">Internal notes</h6>
                    <textarea value={internalNote} onChange={event => setInternalNote(event.target.value)} maxLength={2000} rows={3} placeholder="Add review findings, contact attempts or handover context…" className="w-full p-3 border border-[#E0E0E0] rounded-xl text-xs resize-y" />
                    <button type="button" disabled={workflowSaving || internalNote.trim().length < 2} onClick={() => void addInternalNote(selectedApp.id)} className="px-4 py-2 bg-black disabled:bg-[#E0E0E0] text-white rounded-lg text-[10px] font-bold uppercase">Add Private Note</button>
                    <div className="space-y-2 max-h-56 overflow-y-auto">{admissionNotes.map(note => <article key={note.id} className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0]"><p className="text-xs whitespace-pre-wrap">{note.body}</p><p className="text-[9px] font-mono text-[#707070] mt-2">{note.authorEmail} · {new Date(note.createdAt).toLocaleString('en-ZA')}</p></article>)}{!admissionNotes.length && <p className="text-[11px] text-[#707070]">No private notes yet.</p>}</div>
                  </div>
                  <div className="space-y-3">
                    <h6 className="text-[10px] font-bold uppercase tracking-wider">Follow-up tasks</h6>
                    <input value={taskForm.title} onChange={event => setTaskForm(current => ({ ...current, title: event.target.value }))} maxLength={300} placeholder="e.g. Call student about laptop upgrade" className="w-full p-2.5 border border-[#E0E0E0] rounded-lg text-xs" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><input aria-label="Task due date" type="date" value={taskForm.dueDate} onChange={event => setTaskForm(current => ({ ...current, dueDate: event.target.value }))} className="p-2.5 border border-[#E0E0E0] rounded-lg text-xs" /><select aria-label="Task priority" value={taskForm.priority} onChange={event => setTaskForm(current => ({ ...current, priority: event.target.value as AdmissionTask['priority'] }))} className="p-2.5 border border-[#E0E0E0] rounded-lg bg-white text-xs"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select><select aria-label="Task owner" value={taskForm.assignedStaffId} onChange={event => setTaskForm(current => ({ ...current, assignedStaffId: event.target.value }))} className="p-2.5 border border-[#E0E0E0] rounded-lg bg-white text-xs"><option value="">Owner…</option>{staffAccounts.filter(staff => staff.active).map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select></div>
                    <button type="button" disabled={workflowSaving || taskForm.title.trim().length < 2 || !taskForm.dueDate || !taskForm.assignedStaffId} onClick={() => void createFollowUpTask(selectedApp.id)} className="px-4 py-2 bg-black disabled:bg-[#E0E0E0] text-white rounded-lg text-[10px] font-bold uppercase">Create Follow-up</button>
                    <div className="space-y-2 max-h-64 overflow-y-auto">{admissionTasks.map(task => { const overdue = task.status === 'OPEN' && task.dueDate < new Date().toISOString().slice(0, 10); return <article key={task.id} className={`p-3 rounded-xl border ${overdue ? 'border-[#CC0000] bg-[#FFF5F5]' : 'border-[#E0E0E0] bg-[#FAFAFA]'} ${task.status === 'COMPLETED' ? 'opacity-60' : ''}`}><div className="flex items-start gap-3"><input type="checkbox" checked={task.status === 'COMPLETED'} onChange={() => void toggleFollowUpTask(selectedApp.id, task)} className="mt-0.5 accent-black" /><div className="min-w-0"><strong className={`text-xs block ${task.status === 'COMPLETED' ? 'line-through' : ''}`}>{task.title}</strong><span className="text-[9px] font-mono text-[#707070]">{task.priority} · Due {task.dueDate} · {task.assignedStaffName}{overdue ? ' · OVERDUE' : ''}</span></div></div></article>})}{!admissionTasks.length && <p className="text-[11px] text-[#707070]">No follow-up tasks yet.</p>}</div>
                  </div>
                </div>
              </section>

              <section className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-4">
                <div>
                  <h5 className="font-bold text-sm">Student Document Centre</h5>
                  <p className="text-[11px] text-[#707070]">Open the current official PDFs and every submitted proof-of-payment file linked to this application.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <button type="button" onClick={() => void openStudentDocument(selectedApp.id, 'application')} className="p-3 text-left rounded-xl border border-[#E0E0E0] hover:border-black"><strong className="block text-xs">Application Summary</strong><span className="text-[10px] text-[#707070]">Submitted details and declarations</span></button>
                  {selectedAppInvoice && <button type="button" onClick={() => void openStudentDocument(selectedApp.id, 'invoice')} className="p-3 text-left rounded-xl border border-[#E0E0E0] hover:border-black"><strong className="block text-xs">Invoice PDF</strong><span className="text-[10px] text-[#707070]">{selectedAppInvoice.invoiceNumber}</span></button>}
                  {selectedAppCohort && <button type="button" onClick={() => void openStudentDocument(selectedApp.id, 'schedule')} className="p-3 text-left rounded-xl border border-[#E0E0E0] hover:border-black"><strong className="block text-xs">Course Schedule</strong><span className="text-[10px] text-[#707070]">{selectedAppCohort.name}</span></button>}
                  {['ENROLLED', 'COMPLETED'].includes(selectedApp.status) && <button type="button" onClick={() => void openStudentDocument(selectedApp.id, 'admission')} className="p-3 text-left rounded-xl border border-[#E0E0E0] hover:border-black"><strong className="block text-xs">Admission Confirmation</strong><span className="text-[10px] text-[#707070]">Official enrollment letter</span></button>}
                  {certificates.some(certificate => certificate.studentId === selectedApp.id) && <button type="button" onClick={() => void openStudentDocument(selectedApp.id, 'certificate')} className="p-3 text-left rounded-xl border border-[#E0E0E0] hover:border-black"><strong className="block text-xs">Certificate</strong><span className="text-[10px] text-[#707070]">Completion certificate</span></button>}
                </div>
                {selectedAppPayments.length ? <div className="space-y-2 pt-3 border-t border-[#E0E0E0]">
                  <h6 className="text-[10px] font-bold uppercase tracking-wider">Payment documents</h6>
                  {selectedAppPayments.map(payment => <div key={payment.id} className="p-3 border rounded-xl space-y-2 text-sm"><strong>{payment.provider === 'YOCO' ? 'Yoco card payment' : payment.originalFileName}</strong><p>{payment.type} · {payment.status} · R{payment.amountZAR.toLocaleString()}</p><div className="flex gap-3">{payment.provider !== 'YOCO' && <><button type="button" onClick={() => void apiOpenPrivate(`/payments/${encodeURIComponent(payment.id)}/proof`).catch(error => showToast('error', 'POP Unavailable', error.message))}>Original POP</button><button type="button" onClick={() => void openStudentDocument(selectedApp.id, 'pop', payment.id)}>POP Record PDF</button></>}{payment.status === 'VERIFIED' && <button type="button" onClick={() => void openStudentDocument(selectedApp.id, 'receipt', payment.id)}>Receipt PDF</button>}</div></div>)}
                </div> : <p className="p-3 bg-[#FAFAFA] rounded-xl text-[11px] text-[#707070]">No payment documents have been submitted yet.</p>}
              </section>

              <section className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h5 className="font-bold text-sm">Invoice, Deposit & POP</h5><p className="text-[11px] text-[#707070]">The student is enrolled only after a submitted deposit is verified.</p></div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => void setPaymentRemindersPaused(selectedApp.id, !selectedApp.paymentRemindersPaused)} className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] border ${selectedApp.paymentRemindersPaused ? 'border-[#CC0000] text-[#CC0000] bg-white' : 'border-[#E0E0E0] text-[#000000] bg-[#FAFAFA]'}`}>{selectedApp.paymentRemindersPaused ? 'Resume Reminders' : 'Pause Reminders'}</button>{selectedAppInvoice && <button type="button" disabled={emailingInvoiceId === selectedAppInvoice.id} onClick={() => void handleEmailInvoice(selectedAppInvoice)} className="px-3 py-1.5 bg-black disabled:bg-[#E0E0E0] text-white rounded-lg font-bold uppercase text-[10px]">{emailingInvoiceId === selectedAppInvoice.id ? 'Sending…' : 'Email Invoice'}</button>}<span className="font-mono text-[10px] font-bold px-2.5 py-1 bg-[#FAFAFA] border border-[#E0E0E0] rounded-full">{selectedAppInvoice?.status || 'NO INVOICE'}</span></div></div>
                {selectedApp.paymentRemindersPaused && <p className="p-3 rounded-xl border border-[#E6AAAA] bg-[#FFF5F5] text-[#9B1C1C] text-[11px] font-bold">Scheduled deposit and balance reminders are paused for this student.</p>}
                {selectedAppInvoice ? <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div><span className="text-[#707070] block">Invoice</span><strong>{selectedAppInvoice.invoiceNumber}</strong></div>
                    <div><span className="text-[#707070] block">Total tuition</span><strong>R{selectedAppInvoice.amountZAR.toLocaleString()}</strong></div>
                    <div><span className="text-[#707070] block">Paid to date</span><strong className="text-[#008000]">R{(selectedAppInvoice.paidZAR ?? 0).toLocaleString()}</strong></div>
                    <div><span className="text-[#707070] block">Remaining balance</span><strong className={selectedAppInvoice.balanceZAR > 0 ? 'text-[#CC0000]' : 'text-[#008000]'}>R{selectedAppInvoice.balanceZAR.toLocaleString()}</strong></div>
                  </div>
                  {selectedAppInvoice.paymentOption === 'FULL' || ((selectedAppInvoice.paidZAR ?? 0) >= selectedAppInvoice.amountZAR && !installments.length) ? <div className="p-4 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl"><h6 className="font-bold text-xs">Full Payment</h6><p className="text-[11px] text-[#707070] mt-1">This invoice was paid using the full-payment option. No installment schedule applies.</p></div> : <div className="p-4 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl space-y-3"><div className="flex items-center justify-between gap-3"><div><h6 className="font-bold text-xs">Installment Schedule</h6><p className="text-[10px] text-[#707070]">Verified payments are allocated from the earliest installment first.</p></div>{currentRole === 'ADMIN' && <button type="button" onClick={editingInstallments ? () => setEditingInstallments(false) : startInstallmentEditor} className="px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-[10px] font-bold uppercase">{editingInstallments ? 'Cancel' : installments.length ? 'Edit Plan' : 'Create Plan'}</button>}</div>{editingInstallments ? <div className="space-y-2">{installmentRows.map((row, index) => <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_130px_150px_auto] gap-2"><input value={row.label} onChange={event => setInstallmentRows(current => current.map((item, rowIndex) => rowIndex === index ? { ...item, label: event.target.value } : item))} placeholder="Installment label" className="p-2 border border-[#E0E0E0] rounded-lg text-xs" /><input type="number" min="0.01" step="0.01" value={row.amountZAR} disabled={index === 0} onChange={event => setInstallmentRows(current => current.map((item, rowIndex) => rowIndex === index ? { ...item, amountZAR: event.target.value } : item))} className="p-2 border border-[#E0E0E0] rounded-lg text-xs disabled:bg-[#E0E0E0]" /><input type="date" value={row.dueDate} onChange={event => setInstallmentRows(current => current.map((item, rowIndex) => rowIndex === index ? { ...item, dueDate: event.target.value } : item))} className="p-2 border border-[#E0E0E0] rounded-lg text-xs" /><button type="button" disabled={installmentRows.length <= 2 || index === 0} onClick={() => setInstallmentRows(current => current.filter((_, rowIndex) => rowIndex !== index))} className="px-2 text-[#CC0000] disabled:text-[#A0A0A0] text-[10px] font-bold">Remove</button></div>)}<div className="flex flex-wrap justify-between gap-2"><button type="button" disabled={installmentRows.length >= 24} onClick={() => setInstallmentRows(current => [...current, { label: `Installment ${current.length + 1}`, amountZAR: '', dueDate: '' }])} className="px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-[10px] font-bold uppercase">Add Installment</button><div className="flex items-center gap-3"><span className="text-[10px] font-mono">Plan total: R{installmentRows.reduce((sum, row) => sum + (Number(row.amountZAR) || 0), 0).toLocaleString()}</span><button type="button" disabled={installmentsSaving} onClick={() => void saveInstallmentPlan()} className="px-3 py-1.5 bg-black disabled:bg-[#E0E0E0] text-white rounded-lg text-[10px] font-bold uppercase">{installmentsSaving ? 'Saving…' : 'Save Plan'}</button></div></div></div> : installments.length ? <div className="space-y-2">{installments.map(item => { const overdue = item.status === 'OVERDUE'; return <div key={item.id} className={`grid grid-cols-[1fr_auto] gap-3 p-2.5 bg-white rounded-lg border ${overdue ? 'border-[#CC0000]' : 'border-[#E0E0E0]'} text-[11px]`}><div><strong>{item.sequence}. {item.label}</strong><span className="block text-[#707070]">Due {item.dueDate} · R{item.paidZAR.toLocaleString()} of R{item.amountZAR.toLocaleString()} paid</span></div><strong className={overdue ? 'text-[#CC0000]' : item.status === 'PAID' ? 'text-[#008000]' : ''}>{item.status}</strong></div>})}</div> : <p className="text-[11px] text-[#707070]">No installment schedule. The invoice uses its standard deposit and balance terms.</p>}</div>}
                  {selectedPendingPayment ? <div className="p-4 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div className="font-mono text-[11px]"><strong className="block text-[#000000]">POP awaiting verification • R{selectedPendingPayment.amountZAR.toLocaleString()}</strong><span className="text-[#707070]">EFT ref: {selectedPendingPayment.eftReference} • {selectedPendingPayment.originalFileName}</span><span className="text-[#707070] block">SHA-256: {selectedPendingPayment.sha256.slice(0, 16)}… • Submitted {new Date(selectedPendingPayment.submittedAt).toLocaleString('en-ZA')}</span></div><button onClick={() => void openPopReview(selectedPendingPayment)} className="px-4 py-2 bg-[#000000] text-white rounded-xl font-bold uppercase text-[10px]">Review POP & Payment</button></div> : <p className="p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#707070]">No payment is currently awaiting verification.</p>}
                  {selectedAppPayments.map(payment => <div key={payment.id} className="p-3 border rounded-xl space-y-2 text-sm"><strong>{payment.provider === 'YOCO' ? 'Yoco card payment' : payment.originalFileName}</strong><p>{payment.type} · {payment.status} · R{payment.amountZAR.toLocaleString()}</p><div className="flex gap-3">{payment.provider !== 'YOCO' && <><button type="button" onClick={() => void apiOpenPrivate(`/payments/${encodeURIComponent(payment.id)}/proof`).catch(error => showToast('error', 'POP Unavailable', error.message))}>Original POP</button><button type="button" onClick={() => void openStudentDocument(selectedApp.id, 'pop', payment.id)}>POP Record PDF</button></>}{payment.status === 'VERIFIED' && <button type="button" onClick={() => void openStudentDocument(selectedApp.id, 'receipt', payment.id)}>Receipt PDF</button>}</div></div>)}
                </> : <p className="text-[#707070]">No linked invoice was found for this application.</p>}
              </section>

              <section className="p-5 bg-white rounded-xl border border-[#E0E0E0] space-y-4">
                <div className="flex items-center justify-between gap-3"><div><h5 className="font-bold text-sm">Unified Student Timeline</h5><p className="text-[11px] text-[#707070]">Admissions, communications, finance and learning activity in one chronological record.</p></div><button type="button" disabled={timelineLoading} onClick={() => void loadStudentTimeline(selectedApp.id)} className="px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-[10px] font-bold uppercase">{timelineLoading ? 'Loading…' : 'Refresh'}</button></div>
                {timelineLoading && !studentTimeline.length ? <p className="py-8 text-center text-xs text-[#707070]">Loading timeline…</p> : studentTimeline.length ? <div className="relative pl-7 space-y-0 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-[#D8D8D8]">{studentTimeline.map(event => (
                  <article key={event.id} className="relative pb-5 last:pb-0"><span className={`absolute -left-7 top-1 w-[19px] h-[19px] rounded-full border-4 border-white ${event.category === 'PAYMENT' ? 'bg-[#008000]' : event.category === 'EMAIL' || event.category === 'INVOICE' ? 'bg-[#4B50B8]' : event.category === 'ENROLLMENT' ? 'bg-black' : event.category === 'NOTE' ? 'bg-[#A05A00]' : 'bg-[#707070]'}`} /><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1"><div><span className="font-mono text-[9px] font-bold tracking-wider text-[#707070]">{event.category}{event.status ? ` • ${event.status}` : ''}</span><h6 className="text-xs font-bold">{event.title}</h6><p className="text-[11px] text-[#707070] mt-0.5">{event.detail}</p>{event.actorEmail && <p className="text-[9px] font-mono text-[#A0A0A0] mt-1">By {event.actorEmail}</p>}</div><time className="text-[9px] font-mono text-[#707070] shrink-0">{new Date(event.occurredAt).toLocaleString('en-ZA')}</time></div></article>
                ))}</div> : <p className="py-8 text-center text-xs text-[#707070]">No timeline activity recorded.</p>}
              </section>

              <section className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-2 text-xs"><h5 className="font-bold text-sm">Applicant Notes & Skills</h5><p><strong>Known technologies:</strong> {selectedApp.technologiesKnown?.join(', ') || 'None provided'}</p><p><strong>Current role:</strong> {selectedApp.currentRole || 'Not provided'}</p>{selectedApp.adminNotes && <p><strong>Admin notes:</strong> {selectedApp.adminNotes}</p>}{selectedAppLead?.notes?.length ? <div><strong>CRM notes:</strong><ul className="list-disc pl-5 text-[#707070]">{selectedAppLead.notes.map((note, index) => <li key={index}>{note}</li>)}</ul></div> : null}</section>

              {/* Status Changer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E0E0E0]">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span>Current Status:</span>
                  <StatusBadge status={selectedApp.status} />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void handleApproveApplication(selectedApp)}
                    disabled={!selectedApp.isLaptopCompliant || ['APPROVED', 'PAYMENT_REQUIRED', 'ENROLLED'].includes(selectedApp.status)}
                    className="px-4 py-2 bg-[#000000] hover:bg-neutral-800 disabled:bg-[#E0E0E0] disabled:text-[#707070] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow"
                  >
                    {selectedApp.isLaptopCompliant ? 'Approve Hardware & Send Payment Details' : 'Hardware Review Required'}
                  </button>
                  {selectedApp.status === 'ENROLLED' && <button
                    onClick={() => { setDecisionStatus('WITHDRAWN'); setDecisionReason(''); }}
                    className="px-4 py-2 bg-white hover:bg-[#FFF5F5] text-[#CC0000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#CC0000] transition"
                  >
                    Cancel Enrollment
                  </button>}
                  {!['ENROLLED', 'COMPLETED', 'REJECTED', 'WITHDRAWN'].includes(selectedApp.status) && <button onClick={() => { setDecisionStatus('WAITLISTED'); setDecisionReason(''); }} className="px-4 py-2 bg-white hover:bg-[#FAFAFA] text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#000000] transition">Move to Waitlist</button>}
                  <button
                    onClick={() => { setDecisionStatus('REJECTED'); setDecisionReason(''); }}
                    disabled={['ENROLLED', 'COMPLETED', 'REJECTED', 'WITHDRAWN'].includes(selectedApp.status)}
                    className="px-4 py-2 bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#707070] hover:text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#E0E0E0] transition"
                  >
                    Reject (Hardware Incompatible)
                  </button>
                </div>
              </div>
              {decisionStatus && <section className="p-4 bg-[#FFF8F2] border border-[#D97706] rounded-xl space-y-3"><div><h6 className="text-sm font-bold">Confirm {decisionStatus === 'WITHDRAWN' ? 'Enrollment Cancellation' : decisionStatus === 'WAITLISTED' ? 'Waitlist Decision' : 'Application Rejection'}</h6><p className="text-[11px] text-[#707070]">The reason is mandatory, recorded in the audit log, and included in the email sent to the student.</p></div><textarea autoFocus value={decisionReason} onChange={event => setDecisionReason(event.target.value)} minLength={10} maxLength={1000} rows={4} placeholder={decisionStatus === 'WITHDRAWN' ? 'Explain why the enrollment is being cancelled…' : decisionStatus === 'WAITLISTED' ? 'Explain why the student is being waitlisted…' : 'Explain why the application cannot be approved…'} className="w-full p-3 bg-white border border-[#D97706] rounded-xl text-xs resize-y" /><div className="flex flex-wrap items-center justify-between gap-3"><span className={`text-[10px] font-mono ${decisionReason.trim().length >= 10 ? 'text-[#008000]' : 'text-[#9B1C1C]'}`}>{decisionReason.trim().length}/1000 · minimum 10 characters</span><div className="flex gap-2"><button type="button" disabled={decisionSaving} onClick={() => { setDecisionStatus(null); setDecisionReason(''); }} className="px-4 py-2 bg-white border border-[#E0E0E0] rounded-lg text-[10px] font-bold uppercase">Cancel</button><button type="button" disabled={decisionSaving || decisionReason.trim().length < 10} onClick={() => void submitApplicationDecision(selectedApp.id)} className="px-4 py-2 bg-[#9B1C1C] disabled:bg-[#E0E0E0] text-white rounded-lg text-[10px] font-bold uppercase">{decisionSaving ? 'Recording…' : 'Record Decision & Email Student'}</button></div></div></section>}
            </div>
          )}

          {/* Applications Table */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0] text-[#707070] font-mono text-[10px] uppercase tracking-wider">
                    <th className="p-4 font-bold">Ref / Date</th>
                    <th className="p-4 font-bold">Student Name</th>
                    <th className="p-4 font-bold">WhatsApp / Email</th>
                    <th className="p-4 font-bold">Laptop Hardware</th>
                    <th className="p-4 font-bold">Tier / Option</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#FAFAFA]">
                      <td className="p-4 font-mono text-[11px]">
                        <strong className="text-[#000000]">{app.referenceNumber}</strong>
                        <span className="text-[#707070] block">{app.submissionDate}</span>
                      </td>
                      <td className="p-4">
                        <strong className="text-[#000000]">{app.firstName} {app.lastName}</strong>
                        <span className="text-[#707070] block text-[11px]">{app.city}</span>
                      </td>
                      <td className="p-4 text-[11px]">
                        <span className="text-[#1A1A1A] block">{app.whatsapp}</span>
                        <span className="text-[#707070] block">{app.email}</span>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        <span>{app.laptopBrand || 'Generic'} • {app.ramGB}GB RAM</span>
                        <span className={app.isLaptopCompliant ? 'text-[#000000] block font-bold' : 'text-[#707070] block font-bold'}>
                          {app.isLaptopCompliant ? '✔ 16GB Ready' : '⚠️ Sub-16GB'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        <strong>{app.selectedTier}</strong>
                        <span className="text-[#707070] block">{app.paymentOption}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase border ${
                          app.status === 'ENROLLED' 
                            ? 'bg-[#000000] text-white border-[#000000]' 
                            : app.status === 'APPROVED' 
                            ? 'bg-[#E0E0E0] text-[#000000] border-[#E0E0E0]' 
                            : 'bg-[#FAFAFA] text-[#707070] border-[#E0E0E0]'
                        }`}>
                          {PIPELINE_STAGES.find(stage => stage.id === getPipelineStage(app))?.label || app.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => reviewApplication(app)}
                          className="px-3 py-1.5 bg-[#000000] hover:bg-neutral-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition"
                        >
                          Open Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredApplications.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-[#707070]">No applications match the selected filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COHORTS */}
      {activeTab === 'COHORTS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-light text-[#000000] tracking-tight">Cape Town & Hybrid Cohorts</h3>
              <p className="text-xs text-[#707070]">Manage cohort start dates, capacity constraints, and enrollment status.</p>
            </div>
          </div>

          {editingCohortId && (
            <form onSubmit={handleSaveCohort} className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-[#000000]">Edit Cohort</h4>
                <button type="button" onClick={() => setEditingCohortId(null)} className="text-xs font-mono uppercase text-[#707070]">Cancel</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Cohort Name</label>
                  <input
                    value={cohortForm.name}
                    onChange={(e) => setCohortForm({ ...cohortForm, name: e.target.value })}
                    className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Status</label>
                  <select
                    value={cohortForm.status}
                    onChange={(e) => setCohortForm({ ...cohortForm, status: e.target.value as any })}
                    className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000]"
                  >
                    <option value="Open">Open</option>
                    <option value="Filling Fast">Filling Fast</option>
                    <option value="Closed">Closed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={cohortForm.startDate}
                    onChange={(e) => setCohortForm({ ...cohortForm, startDate: e.target.value })}
                    className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={cohortForm.endDate}
                    onChange={(e) => setCohortForm({ ...cohortForm, endDate: e.target.value })}
                    className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000]"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Schedule</label>
                  <input
                    value={cohortForm.scheduleFormat}
                    onChange={(e) => setCohortForm({ ...cohortForm, scheduleFormat: e.target.value })}
                    className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Mode</label>
                  <select
                    value={cohortForm.deliveryMode}
                    onChange={(e) => setCohortForm({ ...cohortForm, deliveryMode: e.target.value as any })}
                    className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000]"
                  >
                    <option value="100% Virtual Learning">100% Virtual Learning (MS Teams)</option>
                    <option value="Hybrid (Cape Town Lab + Virtual)">Hybrid (Cape Town Lab + Virtual)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Location</label>
                  <input
                    value={cohortForm.location}
                    onChange={(e) => setCohortForm({ ...cohortForm, location: e.target.value })}
                    className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000]"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Microsoft Teams Channel Link</label>
                  <input
                    type="url"
                    value={cohortForm.teamsChannelUrl}
                    onChange={(e) => setCohortForm({ ...cohortForm, teamsChannelUrl: e.target.value })}
                    placeholder="https://teams.microsoft.com/..."
                    className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000]"
                  />
                  <p className="text-[10px] text-[#707070]">Optional. Enrolled students see this link in their portal. Paste the cohort channel or meeting link.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={cohortForm.capacity}
                    onChange={(e) => setCohortForm({ ...cohortForm, capacity: Number(e.target.value) })}
                    className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="px-5 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em]">
                  Save Cohort
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cohorts.map((cohort) => (
              <div key={cohort.id} className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E0E0E0] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
                  <h4 className="font-bold text-base text-[#000000]">{cohort.name}</h4>
                  <span className="text-[10px] font-mono font-bold bg-[#000000] text-white px-2 py-0.5 rounded uppercase tracking-wider">
                    <StatusBadge status={cohort.status} />
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#707070]">
                  <p><strong className="text-[#000000]">Dates:</strong> {cohort.startDate} → {cohort.endDate}</p>
                  <p><strong className="text-[#000000]">Schedule:</strong> {cohort.scheduleFormat}</p>
                  <p><strong className="text-[#000000]">Mode:</strong> {cohort.deliveryMode} ({cohort.location})</p>
                  <p><strong className="text-[#000000]">Enrolled:</strong> <strong className="text-[#000000]">{cohort.enrolledCount} / {cohort.capacity} Students</strong></p>
                  <p><strong className="text-[#000000]">Remaining:</strong> <strong className={cohort.enrolledCount >= cohort.capacity ? 'text-[#A05A00]' : 'text-[#008000]'}>{Math.max(0, cohort.capacity - cohort.enrolledCount)} seats{cohort.enrolledCount >= cohort.capacity ? ' - waitlist active' : ''}</strong></p>
                  <p><strong className="text-[#000000]">Waitlisted:</strong> <strong className="text-[#000000]">{applications.filter(application => application.cohortId === cohort.id && application.status === 'WAITLISTED').length} applicants</strong></p>
                </div>

                <div className="border-t border-[#E0E0E0] pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#000000]">Class roster by plan</h5>
                    <p className="text-[10px] text-[#707070] mt-1">Shared cohort: {cohort.scheduleFormat}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => exportCohortRoster(cohort)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[#000000] hover:bg-[#E0E0E0]"
                      title={`Export ${cohort.name} roster as CSV`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      CSV
                    </button>
                  </div>
                  {applications.some(application => application.cohortId === cohort.id && ['ENROLLED', 'COMPLETED'].includes(application.status)) ? (
                    <div className="overflow-x-auto rounded-lg border border-[#E0E0E0]">
                      <table className="w-full min-w-[680px] text-left text-[11px]">
                        <thead className="bg-[#FAFAFA] text-[10px] uppercase tracking-wider text-[#707070]">
                          <tr>
                            <th className="px-3 py-2 font-bold">Student</th>
                            <th className="px-3 py-2 font-bold">Plan</th>
                            <th className="px-3 py-2 font-bold">Session</th>
                            <th className="px-3 py-2 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E0E0E0]">
                          {applications.filter(application => application.cohortId === cohort.id && ['ENROLLED', 'COMPLETED'].includes(application.status)).map(student => (
                            <tr key={student.id} className="bg-white">
                              <td className="px-3 py-2">
                                <span className="block font-bold text-[#000000]">{student.firstName} {student.lastName}</span>
                                <span className="text-[10px] text-[#707070]">{student.email}</span>
                              </td>
                              <td className="px-3 py-2 text-[#1A1A1A]">{TIER_CARD_DEFAULTS[student.selectedTier].displayName}</td>
                              <td className="px-3 py-2 text-[#1A1A1A]">{SESSION_TRACKS[student.selectedTier].name}</td>
                              <td className="px-3 py-2"><StatusBadge status={student.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-[#707070]">No enrolled students assigned yet.</p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E0E0E0] flex items-center gap-2">
                  <button
                    onClick={() => handleCohortEdit(cohort)}
                    className="flex-1 py-2 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => updateCohort(cohort.id, { status: cohort.status === 'Open' ? 'Filling Fast' : cohort.status === 'Filling Fast' ? 'Closed' : 'Open' })}
                    className="flex-1 py-2 bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#000000] font-bold rounded-lg text-xs uppercase tracking-wider border border-[#E0E0E0] transition"
                  >
                    Toggle Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TICKET SIMULATOR MANAGER */}
      {activeTab === 'TICKETS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-light text-[#000000] tracking-tight">Incident Ticket Simulator & Lab Faults</h3>
              <p className="text-xs text-[#707070]">Author realistic enterprise helpdesk tickets and configure root cause benchmarks.</p>
            </div>
            <button
              onClick={() => setNewTicketModal(true)}
              className="px-4 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] flex items-center gap-1.5 transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Ticket Scenario</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['All leads', leads.length, 'ALL'],
              ['Follow-up due', dueLeadCount, 'DUE'],
              ['New', leads.filter(lead => lead.status === 'NEW_LEAD').length, 'NEW_LEAD'],
              ['Interested', leads.filter(lead => lead.status === 'INTERESTED').length, 'INTERESTED']
            ].map(([label, count, filter]) => <button key={String(filter)} type="button" onClick={() => setLeadStatusFilter(filter as LeadStatus | 'ALL' | 'DUE')} className={`p-4 text-left rounded-xl border ${leadStatusFilter === filter ? 'bg-black text-white border-black' : 'bg-white border-[#E0E0E0]'}`}><span className="block text-2xl font-light">{count}</span><span className="text-[10px] font-bold uppercase tracking-wider">{label}</span></button>)}
          </div>

          <div className="flex flex-col md:flex-row gap-3 bg-white border border-[#E0E0E0] rounded-xl p-4">
            <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-3 text-[#A0A0A0]" /><input value={leadSearch} onChange={event => setLeadSearch(event.target.value)} placeholder="Search name, phone, email, source or course…" className="w-full pl-9 pr-3 py-2.5 border border-[#E0E0E0] rounded-lg text-xs" /></div>
            <select aria-label="Lead status filter" value={leadStatusFilter} onChange={event => setLeadStatusFilter(event.target.value as LeadStatus | 'ALL' | 'DUE')} className="md:w-64 p-2.5 border border-[#E0E0E0] rounded-lg bg-white text-xs font-bold"><option value="ALL">All statuses</option><option value="DUE">Follow-up due</option><option value="NEW_LEAD">New leads</option><option value="CONTACTED">Contacted</option><option value="INTERESTED">Interested</option><option value="APPLICATION_STARTED">Application started</option><option value="APPLICATION_SUBMITTED">Application submitted</option><option value="APPROVED">Approved</option><option value="PAYMENT_PENDING">Payment pending</option><option value="ENROLLED">Enrolled</option></select>
          </div>

          {/* New Ticket Modal */}
          {newTicketModal && (
            <div className="bg-[#FAFAFA] text-[#1A1A1A] p-6 sm:p-8 rounded-2xl border-2 border-[#000000] shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
                <h4 className="font-bold text-base text-[#000000]">Create Practical IT Incident Ticket</h4>
                <button onClick={() => setNewTicketModal(false)} className="text-xs font-mono uppercase text-[#707070]">Cancel</button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Ticket Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Domain Trust Relationship Failed on Workstation"
                      value={newTicketData.title}
                      onChange={(e) => setNewTicketData({ ...newTicketData, title: e.target.value })}
                      className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Severity Level *</label>
                    <select
                      value={newTicketData.severity}
                      onChange={(e) => setNewTicketData({ ...newTicketData, severity: e.target.value as any })}
                      className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none"
                    >
                      <option value="P1_CRITICAL">P1 - Critical (Entire Department Down)</option>
                      <option value="P2_HIGH">P2 - High (Executive User Blocked)</option>
                      <option value="P3_MEDIUM">P3 - Medium (Single User Impact)</option>
                      <option value="P4_LOW">P4 - Low (Informational / Provisioning)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">User Symptoms Description</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. User cannot sign in. Error says: The trust relationship between this workstation and primary domain failed."
                      value={newTicketData.symptoms}
                      onChange={(e) => setNewTicketData({ ...newTicketData, symptoms: e.target.value })}
                      className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Broken State & Root Cause</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Machine account password was reset on DC without updating workstation secure channel."
                      value={newTicketData.brokenStateDetails}
                      onChange={(e) => setNewTicketData({ ...newTicketData, brokenStateDetails: e.target.value })}
                      className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] shadow"
                >
                  Publish Ticket to Student Portals
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E0E0E0] shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-2">
                  <span className="text-[10px] font-mono font-bold text-[#707070]">#{ticket.ticketNumber} • Module {ticket.moduleNumber}</span>
                  <span className="text-[10px] font-mono font-bold bg-[#000000] text-white px-2 py-0.5 rounded uppercase">{ticket.severity}</span>
                </div>
                <h4 className="font-bold text-sm text-[#000000]">{ticket.title}</h4>
                <p className="text-xs text-[#707070] line-clamp-2 leading-relaxed">{ticket.symptoms}</p>
                <div className="pt-2 border-t border-[#E0E0E0] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#707070] text-[11px]">Target: {ticket.vmEnvironment}</span>
                  <StatusBadge status={ticket.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: LEADS CRM */}
      {activeTab === 'LEADS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-light text-[#000000] tracking-tight">Prospective Student Inquiries (CRM)</h3>
              <p className="text-xs text-[#707070]">Inquiries submitted via website contact form and WhatsApp click-to-chat.</p>
            </div>
            <button
              onClick={handleExportLeadsCsv}
              className="px-4 py-2 bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#E0E0E0]"
            >
              Export Leads CSV
            </button>
          </div>

          <div className="bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0] text-[#707070] font-mono text-[10px] uppercase tracking-wider">
                    <th className="p-4 font-bold">Contact Name</th>
                    <th className="p-4 font-bold">WhatsApp / Email</th>
                    <th className="p-4 font-bold">Course Interest</th>
                    <th className="p-4 font-bold">Follow-Up Date</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]">
                  {filteredLeads.map((lead) => {
                    const followUpDue = activeRecruitmentStatuses.includes(lead.status) && lead.followUpDate <= today;
                    return (
                    <tr key={lead.id} className={`hover:bg-[#FAFAFA] ${selectedLeadId === lead.id ? 'bg-[#F0F0F0] ring-1 ring-inset ring-black' : followUpDue ? 'bg-[#FFF8EE]' : ''}`}>
                      <td className="p-4 font-bold text-[#000000]">{lead.name}</td>
                      <td className="p-4 text-[11px]">
                        <span className="text-[#1A1A1A] block">{lead.whatsapp}</span>
                        <span className="text-[#707070] block">{lead.email}</span>
                      </td>
                      <td className="p-4 font-mono text-[11px]">{lead.courseInterest}</td>
                      <td className="p-4 font-mono text-[11px]"><span className={followUpDue ? 'text-[#9B1C1C] font-bold' : 'text-[#707070]'}>{lead.followUpDate}</span>{followUpDue && <span className="block text-[9px] uppercase font-bold text-[#9B1C1C]">Due</span>}</td>
                      <td className="p-4">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                          className="p-1.5 bg-[#FFFFFF] border border-[#E0E0E0] rounded-lg text-[11px] font-bold font-mono text-[#000000]"
                        >
                          <option value="NEW_LEAD">NEW_LEAD</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="INTERESTED">INTERESTED</option>
                          <option value="APPLICATION_STARTED">APPLICATION_STARTED</option>
                          <option value="APPLICATION_SUBMITTED">APPLICATION_SUBMITTED</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
                          <option value="ENROLLED">ENROLLED</option>
                          <option value="ACTIVE_STUDENT">ACTIVE_STUDENT</option>
                          <option value="GRADUATED">GRADUATED</option>
                          <option value="ALUMNI">ALUMNI</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => openLeadWorkspace(lead.id)} className="px-3 py-1 border border-[#E0E0E0] bg-white rounded-lg text-[10px] uppercase font-bold">{selectedLeadId === lead.id ? 'Opened' : 'Open'}</button><a
                          href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(lead.name)},%20this%20is%20the%20TechLabs%20Academy%20team.%20We%20received%20your%20IT%20Support%20inquiry.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#000000] hover:bg-neutral-800 text-white rounded-lg text-[10px] uppercase font-bold tracking-wider"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a></div>
                      </td>
                    </tr>
                  )})}
                  {filteredLeads.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-[#707070]">No recruitment leads match these filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {selectedLead && <section id="lead-workspace" className="bg-[#FAFAFA] border-2 border-black rounded-2xl p-6 space-y-5 scroll-mt-4">
            <div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-mono uppercase text-[#707070]">Recruitment lead · {selectedLead.source}</span><h4 className="text-xl font-bold">{selectedLead.name}</h4><p className="text-xs text-[#707070]">Created {selectedLead.createdAt} · {selectedLead.courseInterest}</p></div><button type="button" onClick={() => setSelectedLeadId(null)} className="text-[10px] font-bold uppercase">Close</button></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-xl p-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3 text-xs"><div><span className="block text-[10px] uppercase font-bold text-[#707070]">Email</span><a className="underline" href={`mailto:${selectedLead.email}`}>{selectedLead.email}</a></div><div><span className="block text-[10px] uppercase font-bold text-[#707070]">WhatsApp</span><a className="underline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${selectedLead.whatsapp.replace(/[^0-9]/g, '')}`}>{selectedLead.whatsapp}</a></div></div>
                <div className="grid sm:grid-cols-2 gap-3"><label className="space-y-1"><span className="text-[10px] uppercase font-bold">Recruitment stage</span><select value={selectedLead.status} onChange={event => updateLeadStatus(selectedLead.id, event.target.value as LeadStatus)} className="w-full p-2.5 border border-[#E0E0E0] rounded-lg bg-white text-xs"><option value="NEW_LEAD">New lead</option><option value="CONTACTED">Contacted</option><option value="INTERESTED">Interested</option><option value="APPLICATION_STARTED">Application started</option><option value="APPLICATION_SUBMITTED">Application submitted</option><option value="APPROVED">Approved</option><option value="PAYMENT_PENDING">Payment pending</option><option value="ENROLLED">Enrolled</option><option value="ACTIVE_STUDENT">Active student</option><option value="GRADUATED">Graduated</option><option value="ALUMNI">Alumni</option></select></label><label className="space-y-1"><span className="text-[10px] uppercase font-bold">Next follow-up</span><input type="date" value={selectedLead.followUpDate} onChange={event => updateLeadFollowUp(selectedLead.id, event.target.value)} className="w-full p-2.5 border border-[#E0E0E0] rounded-lg text-xs" /></label></div>
                <div className="flex flex-wrap gap-2"><a target="_blank" rel="noopener noreferrer" href={`https://wa.me/${selectedLead.whatsapp.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(selectedLead.name)},%20this%20is%20the%20TechLabs%20Academy%20admissions%20team.%20I%20am%20following%20up%20on%20your%20course%20inquiry.`} className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-bold uppercase">Message on WhatsApp</a><a href={`mailto:${selectedLead.email}?subject=${encodeURIComponent('Your TechLabs Academy inquiry')}`} className="px-4 py-2 bg-white border border-[#E0E0E0] rounded-lg text-[10px] font-bold uppercase">Send Email</a>{leadApplication && <button type="button" onClick={() => { setSelectedAppId(leadApplication.id); setPipelineSearch(leadApplication.referenceNumber); setActiveTab('APPLICATIONS'); }} className="px-4 py-2 bg-white border border-[#E0E0E0] rounded-lg text-[10px] font-bold uppercase">Open Application</button>}</div>
              </div>
              <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 space-y-3"><h5 className="font-bold text-sm">Recruitment notes</h5><div className="max-h-44 overflow-y-auto space-y-2">{selectedLead.notes?.length ? [...selectedLead.notes].reverse().map((note, index) => <p key={index} className="p-2 bg-[#FAFAFA] rounded-lg text-[11px]">{note}</p>) : <p className="text-xs text-[#707070]">No notes yet.</p>}</div><textarea value={leadNote} onChange={event => setLeadNote(event.target.value)} rows={3} maxLength={1000} placeholder="Record the call outcome or next step…" className="w-full p-2.5 border border-[#E0E0E0] rounded-lg text-xs" /><button type="button" disabled={leadNote.trim().length < 2} onClick={() => { addLeadNote(selectedLead.id, leadNote); setLeadNote(''); }} className="w-full py-2 bg-black disabled:bg-[#D0D0D0] text-white rounded-lg text-[10px] font-bold uppercase">Add Internal Note</button></div>
            </div>
          </section>}
        </div>
      )}

      {/* TAB 7: CERTIFICATES */}
      {activeTab === 'CERTIFICATES' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-light text-[#000000] tracking-tight">Certificate Generation & Verification Registry</h3>
              <p className="text-xs text-[#707070]">Issue verifiable Certificates of Completion with audit score benchmarks.</p>
            </div>
          </div>

          {/* Generator Form */}
          <div className="bg-[#FAFAFA] text-[#1A1A1A] p-6 sm:p-8 rounded-2xl border-2 border-[#000000] shadow-xl space-y-4">
            <h4 className="font-bold text-base text-[#000000]">Generate Verified Certificate</h4>
            <form onSubmit={handleIssueCert} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs items-end">
              <div className="space-y-1">
                <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Select Enrolled Student:</label>
                <select
                  value={certStudentId}
                  onChange={(e) => setCertStudentId(e.target.value)}
                  className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000] font-bold focus:border-[#000000] focus:outline-none"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#000000] font-bold uppercase text-[10px] tracking-wider">Practical Incident Audit Score:</label>
                <input
                  type="text"
                  value={certGrade}
                  onChange={(e) => setCertGrade(e.target.value)}
                  className="w-full p-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-[#000000] font-mono focus:border-[#000000] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] shadow"
              >
                Issue Certificate & Publish URL
              </button>
            </form>
          </div>

          {/* Issued Certificates List */}
          <div className="space-y-6">
            <h4 className="font-bold text-base text-[#000000]">Official Registry Records:</h4>
            {certificates.map((cert) => (
              <div key={cert.id} className="space-y-4">
                <div className="flex items-center justify-between bg-[#FAFAFA] p-4 rounded-xl border border-[#E0E0E0] text-xs">
                  <div>
                    <strong className="text-[#000000] font-mono text-sm">{cert.certificateNumber}</strong>
                    <span className="text-[#707070] block">{cert.studentName} • {cert.cohortName} • Grade: {cert.practicalGrade}</span>
                  </div>
                  <button
                    onClick={() => navigate('/verify')}
                    className="px-3 py-1.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider"
                  >
                    Public Verification Page
                  </button>
                </div>

                <CertificateView certificate={cert} allowPrint={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'AUDIT_LOG' && (
        <div className="space-y-6 animate-in fade-in max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div><h3 className="text-2xl font-light tracking-tight">Administrator Audit Log</h3><p className="text-xs text-[#707070]">Append-only history of admissions, payment, invoice, banking and student-record actions.</p></div>
            <div className="relative w-full sm:w-80"><Search className="w-4 h-4 absolute left-3 top-3 text-[#A0A0A0]" /><input value={auditSearch} onChange={event => setAuditSearch(event.target.value)} placeholder="Search action, admin or record…" className="w-full pl-9 pr-3 py-2.5 border border-[#E0E0E0] rounded-xl text-xs focus:border-black focus:outline-none" /></div>
          </div>
          <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden shadow-sm">
            {auditLoading ? <p className="p-8 text-center text-xs text-[#707070]">Loading audit records…</p> : visibleAuditLogs.length ? <div className="divide-y divide-[#E0E0E0]">{visibleAuditLogs.map(log => (
              <div key={log.id} className="p-4 sm:p-5 space-y-2 hover:bg-[#FAFAFA]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2"><div><span className="inline-block px-2 py-0.5 bg-black text-white rounded font-mono text-[9px] font-bold tracking-wider">{log.action}</span><strong className="block mt-1 text-sm">{log.summary}</strong></div><time className="font-mono text-[10px] text-[#707070] shrink-0">{new Date(log.createdAt).toLocaleString('en-ZA')}</time></div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10px] font-mono text-[#707070]"><span>Admin: <strong className="text-black">{log.actorEmail}</strong></span><span>Record: <strong className="text-black">{log.entityType}/{log.entityId}</strong></span>{log.ipAddress && <span>IP: {log.ipAddress}</span>}</div>
                {log.changes && <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">{(Object.entries(log.changes) as Array<[string, { before: unknown; after: unknown }]>).map(([field, change]) => <div key={field} className="p-2.5 bg-white border border-[#E0E0E0] rounded-lg text-[10px] font-mono"><strong className="block uppercase text-[#707070]">{field}</strong><span className="break-all">{JSON.stringify(change.before) ?? 'null'} → {JSON.stringify(change.after) ?? 'null'}</span></div>)}</div>}
              </div>
            ))}</div> : <p className="p-8 text-center text-xs text-[#707070]">No matching audit records.</p>}
          </div>
        </div>
      )}

      {activeTab === 'STAFF' && currentRole === 'ADMIN' && (
        <div className="space-y-6 animate-in fade-in max-w-5xl">
          <div><h3 className="text-2xl font-light text-[#000000] tracking-tight">Administrators & Instructors</h3><p className="text-xs text-[#707070]">Create individual staff logins and remove access when a staff member leaves.</p></div>
          <form onSubmit={createStaffAccount} className="bg-white border border-[#E0E0E0] rounded-xl p-6 space-y-4">
            <h4 className="font-bold text-sm">Add staff account</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="space-y-1"><span className="font-bold uppercase text-[10px]">Full name</span><input required value={staffForm.name} onChange={event => setStaffForm({ ...staffForm, name: event.target.value })} className="w-full p-3 border border-[#E0E0E0] rounded-xl" /></label>
              <label className="space-y-1"><span className="font-bold uppercase text-[10px]">Email address</span><input required type="email" value={staffForm.email} onChange={event => setStaffForm({ ...staffForm, email: event.target.value })} className="w-full p-3 border border-[#E0E0E0] rounded-xl" /></label>
              <label className="space-y-1"><span className="font-bold uppercase text-[10px]">Role</span><select value={staffForm.role} onChange={event => setStaffForm({ ...staffForm, role: event.target.value as 'ADMIN' | 'INSTRUCTOR' })} className="w-full p-3 border border-[#E0E0E0] rounded-xl bg-white"><option value="INSTRUCTOR">Instructor</option><option value="ADMIN">Administrator</option></select></label>
              <label className="space-y-1"><span className="font-bold uppercase text-[10px]">Temporary password</span><input required type="password" minLength={10} value={staffForm.password} onChange={event => setStaffForm({ ...staffForm, password: event.target.value })} placeholder="10+ chars, upper/lowercase and number" className="w-full p-3 border border-[#E0E0E0] rounded-xl" /></label>
            </div>
            <button disabled={staffSaving} className="px-5 py-2.5 bg-black disabled:bg-[#A0A0A0] text-white rounded-xl font-bold text-xs uppercase tracking-wider">{staffSaving ? 'Creating…' : 'Create Staff Login'}</button>
          </form>
          <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden">
            {staffAccounts.length ? <div className="divide-y divide-[#E0E0E0]">{staffAccounts.map(staff => <div key={staff.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><strong className="block text-sm">{staff.name}</strong><span className="text-xs text-[#707070]">{staff.email} • {staff.role}</span><span className="block text-[10px] font-mono text-[#A0A0A0]">Added {new Date(staff.createdAt).toLocaleDateString('en-ZA')} by {staff.createdBy}</span></div><button onClick={() => void removeStaffAccount(staff)} className="px-4 py-2 border border-[#CC0000] text-[#CC0000] rounded-lg font-bold text-[10px] uppercase">Remove Access</button></div>)}</div> : <p className="p-8 text-center text-xs text-[#707070]">No managed staff accounts yet. The environment administrator still has access.</p>}
          </div>
        </div>
      )}

      {activeTab === 'CURRICULUM' && currentRole === 'ADMIN' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><h3 className="text-2xl font-light tracking-tight">Curriculum Management</h3><p className="text-xs text-[#707070]">Add or edit the module content shown on the website, in student portals, and in course-schedule PDFs. Dates are generated from each cohort.</p></div><button type="button" onClick={startModuleCreate} className="px-5 py-3 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Module</button></div>
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
            <div className="bg-white border border-[#E0E0E0] rounded-xl divide-y divide-[#E0E0E0] overflow-hidden">
              {[...(courseModules || [])].sort((left, right) => left.number - right.number).map(module => <button key={module.number} type="button" onClick={() => startModuleEdit(module)} className={`w-full p-4 text-left hover:bg-[#FAFAFA] ${editingModuleNumber === module.number ? 'bg-[#F0F0F0] border-l-4 border-black' : ''}`}><span className="text-[10px] font-mono font-bold uppercase text-[#707070]">Module {module.number} · {module.published === false ? 'Hidden' : 'Published'}</span><strong className="block text-xs mt-1">{module.title}</strong><span className="block text-[10px] text-[#707070] mt-1">{module.duration}</span></button>)}
            </div>
            {(editingModuleNumber || creatingModule) ? <section id="curriculum-editor" className="bg-white border-2 border-black rounded-2xl p-6 space-y-4 scroll-mt-4">
              <div className="flex items-center justify-between gap-3"><div><span className="text-[10px] font-mono uppercase text-[#707070]">{creatingModule ? `New module · Number ${Math.max(0, ...(courseModules || []).map(module => module.number)) + 1}` : `Module ${editingModuleNumber}`}</span><h4 className="font-bold text-lg">{creatingModule ? 'Add curriculum module' : 'Edit curriculum content'}</h4></div><button type="button" onClick={() => { setEditingModuleNumber(null); setCreatingModule(false); }} className="text-[10px] font-bold uppercase">Close</button></div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3"><label className="space-y-1"><span className="text-[10px] font-bold uppercase">Title</span><input value={moduleForm.title} maxLength={200} onChange={event => setModuleForm(current => ({ ...current, title: event.target.value }))} className="w-full p-3 border border-[#E0E0E0] rounded-xl text-xs" /></label><label className="space-y-1"><span className="text-[10px] font-bold uppercase">Duration</span><input value={moduleForm.duration} maxLength={200} onChange={event => setModuleForm(current => ({ ...current, duration: event.target.value }))} placeholder="e.g. Week 1" className="w-full p-3 border border-[#E0E0E0] rounded-xl text-xs" /></label></div>
              <label className="space-y-1 block"><span className="text-[10px] font-bold uppercase">Summary</span><textarea value={moduleForm.summary} maxLength={2000} rows={4} onChange={event => setModuleForm(current => ({ ...current, summary: event.target.value }))} className="w-full p-3 border border-[#E0E0E0] rounded-xl text-xs" /></label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{([
                ['learningOutcomes', 'Learning outcomes'], ['practicalLabs', 'Practical labs'], ['exampleTickets', 'Example support tickets'], ['technologies', 'Technologies']
              ] as Array<[keyof typeof moduleForm, string]>).map(([field, label]) => <label key={field} className="space-y-1"><span className="text-[10px] font-bold uppercase">{label}</span><textarea value={String(moduleForm[field])} rows={6} onChange={event => setModuleForm(current => ({ ...current, [field]: event.target.value }))} placeholder="One item per line" className="w-full p-3 border border-[#E0E0E0] rounded-xl text-xs" /><span className="text-[9px] text-[#707070]">Enter one item per line.</span></label>)}</div>
              <label className="flex items-center gap-2 p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs"><input type="checkbox" checked={moduleForm.published} onChange={event => setModuleForm(current => ({ ...current, published: event.target.checked }))} className="accent-black" /><span><strong>Published</strong> — visible on the public curriculum, student portal, and schedule PDF.</span></label>
              <div className="flex justify-end"><button type="button" disabled={curriculumSaving || !moduleForm.title.trim() || !moduleForm.duration.trim() || !moduleForm.summary.trim()} onClick={() => void submitModuleEdit()} className="px-5 py-3 bg-black disabled:bg-[#D0D0D0] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider">{curriculumSaving ? 'Saving…' : creatingModule ? 'Add Module' : 'Save Audited Changes'}</button></div>
            </section> : <div className="p-10 bg-[#FAFAFA] border border-[#E0E0E0] rounded-2xl text-center"><Layers className="w-8 h-8 mx-auto mb-3" /><h4 className="font-bold">Select a module to edit</h4><p className="text-xs text-[#707070] mt-2">Module numbers remain fixed so assessments and student progress stay correctly linked.</p></div>}
          </div>
        </div>
      )}

      {/* SETTINGS & BANK DETAILS */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-6 animate-in fade-in max-w-4xl">
          <div className="space-y-1">
            <h3 className="text-2xl font-light text-[#000000] tracking-tight">Platform & EFT Banking Settings</h3>
            <p className="text-xs text-[#707070]">Configure public contact information, WhatsApp hotline, and South African banking credentials.</p>
          </div>

          <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-xl border border-[#E0E0E0] shadow-sm space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-[#000000] uppercase text-[10px] tracking-wider">Academy Brand Name</label>
                <input
                  type="text"
                  value={settings.academyName}
                  onChange={(e) => updateSettings({ academyName: e.target.value })}
                  className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#000000] uppercase text-[10px] tracking-wider">Primary Location / Address</label>
                <input
                  type="text"
                  value={settings.location}
                  onChange={(e) => updateSettings({ location: e.target.value })}
                  className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#000000] uppercase text-[10px] tracking-wider">Enrolled Student Support WhatsApp</label>
              <input type="text" value={settings.studentSupportWhatsappNumber || settings.whatsappNumber} onChange={(e) => updateSettings({ studentSupportWhatsappNumber: e.target.value })} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl font-mono text-[#000000] focus:border-[#000000] focus:outline-none" />
              <p className="text-[10px] text-[#707070]">Shown to enrolled and completed students. Applicants continue using the admissions hotline.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-[#000000] uppercase text-[10px] tracking-wider">WhatsApp Admissions Hotline</label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => updateSettings({ whatsappNumber: e.target.value })}
                  className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl font-mono text-[#000000] focus:border-[#000000] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#000000] uppercase text-[10px] tracking-wider">Admissions Email</label>
                <input
                  type="email"
                  value={settings.admissionsEmail}
                  onChange={(e) => updateSettings({ admissionsEmail: e.target.value })}
                  className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#000000] uppercase text-[10px] tracking-wider">Public Lead Instructor Name</label>
              <input type="text" value={settings.leadInstructorName || ''} onChange={(e) => updateSettings({ leadInstructorName: e.target.value })} placeholder="TechLabs Instructor" className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none" />
              <p className="text-[10px] text-[#707070]">Used wherever the website refers to the lead instructor. Leave blank to use “TechLabs Instructor”.</p>
            </div>

            <div className="pt-4 border-t border-[#E0E0E0] space-y-4">
              <div><h4 className="font-bold text-sm text-[#000000]">Compliance & Privacy</h4><p className="mt-1 text-[11px] text-[#707070]">Keep public policy contacts, consent versions, and retention guidance current. This does not delete records automatically.</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1"><span className="block text-[10px] font-bold uppercase tracking-wider">Privacy contact email</span><input type="email" maxLength={254} value={settings.privacyContactEmail || ''} onChange={event => updateSettings({ privacyContactEmail: event.target.value })} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs" /></label>
                <label className="space-y-1"><span className="block text-[10px] font-bold uppercase tracking-wider">Information officer contact</span><input maxLength={240} value={settings.informationOfficerContact || ''} onChange={event => updateSettings({ informationOfficerContact: event.target.value })} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs" /></label>
                <label className="space-y-1"><span className="block text-[10px] font-bold uppercase tracking-wider">Privacy policy version</span><input maxLength={40} value={settings.privacyPolicyVersion || ''} onChange={event => updateSettings({ privacyPolicyVersion: event.target.value })} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs" /></label>
                <label className="space-y-1"><span className="block text-[10px] font-bold uppercase tracking-wider">Terms version</span><input maxLength={40} value={settings.termsVersion || ''} onChange={event => updateSettings({ termsVersion: event.target.value })} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs" /></label>
                <label className="space-y-1"><span className="block text-[10px] font-bold uppercase tracking-wider">Consent text version</span><input maxLength={40} value={settings.consentTextVersion || ''} onChange={event => updateSettings({ consentTextVersion: event.target.value })} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs" /></label>
                <label className="space-y-1"><span className="block text-[10px] font-bold uppercase tracking-wider">Data retention (days)</span><input type="number" min={30} max={3650} value={settings.dataRetentionDays || 1825} onChange={event => updateSettings({ dataRetentionDays: Number(event.target.value) })} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs" /></label>
                <label className="space-y-1"><span className="block text-[10px] font-bold uppercase tracking-wider">Cookie notice version</span><input maxLength={40} value={settings.cookieNoticeVersion || ''} onChange={event => updateSettings({ cookieNoticeVersion: event.target.value })} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs" /></label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E0E0E0] space-y-4">
              <div><h4 className="font-bold text-sm text-[#000000]">Student Communications</h4><p className="mt-1 text-[11px] text-[#707070]">Control the reusable messages shown to applicants and students.</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([['studentWelcomeMessage', 'Student welcome message'], ['studentSupportMessage', 'Student support message'], ['admissionsAcknowledgement', 'Application acknowledgement'], ['whatsappGreeting', 'WhatsApp greeting']] as Array<[keyof typeof settings, string]>).map(([key, label]) => <label key={key} className="space-y-1"><span className="block text-[10px] font-bold uppercase tracking-wider">{label}</span><textarea maxLength={800} rows={3} value={String(settings[key] || '')} onChange={event => updateSettings({ [key]: event.target.value } as Partial<typeof settings>)} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs" /></label>)}
              </div>
              <label className="space-y-1 block"><span className="block text-[10px] font-bold uppercase tracking-wider">Payment instructions</span><textarea maxLength={1200} rows={3} value={settings.paymentInstructions || ''} onChange={event => updateSettings({ paymentInstructions: event.target.value })} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs" /></label>
            </div>

            <div className="pt-4 border-t border-[#E0E0E0] space-y-4">
              <div><h4 className="font-bold text-sm text-[#000000]">Website Controls</h4><p className="mt-1 text-[11px] text-[#707070]">Control public availability and visible website content.</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([['applicationsEnabled', 'Accept new applications'], ['onlinePaymentsEnabled', 'Enable online payments'], ['showPricing', 'Show pricing page'], ['showUpcomingCohorts', 'Show upcoming cohorts'], ['maintenanceMode', 'Maintenance mode']] as Array<[keyof typeof settings, string]>).map(([key, label]) => <label key={key} className="flex items-center gap-2 p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg text-xs"><input type="checkbox" checked={Boolean(settings[key])} onChange={event => updateSettings({ [key]: event.target.checked } as Partial<typeof settings>)} className="accent-black" /><span>{label}</span></label>)}
              </div>
              <label className="space-y-1 block"><span className="block text-[10px] font-bold uppercase tracking-wider">Public announcement</span><textarea maxLength={500} rows={2} value={settings.publicAnnouncement || ''} onChange={event => updateSettings({ publicAnnouncement: event.target.value })} placeholder="Optional banner shown on public pages" className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs" /></label>
              <label className="space-y-1 block"><span className="block text-[10px] font-bold uppercase tracking-wider">Default landing page</span><select value={settings.defaultLandingPage || '/'} onChange={event => updateSettings({ defaultLandingPage: event.target.value })} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs"><option value="/">Home</option><option value="/pricing">Pricing</option><option value="/courses/it-support">Course details</option><option value="/apply">Application</option></select></label>
            </div>

            <div className="pt-4 border-t border-[#E0E0E0] space-y-4">
              <h4 className="font-bold text-sm text-[#000000]">South African Bank EFT Credentials (Invoicing)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                <div className="space-y-1">
                  <label className="font-bold text-[#000000] font-sans uppercase text-[10px] tracking-wider">Bank Name</label>
                  <input
                    type="text"
                    value={settings.bankName}
                    onChange={(e) => updateSettings({ bankName: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#000000] font-sans uppercase text-[10px] tracking-wider">Account Holder Name</label>
                  <input
                    type="text"
                    value={settings.accountName}
                    onChange={(e) => updateSettings({ accountName: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#000000] font-sans uppercase text-[10px] tracking-wider">Account Number</label>
                  <input
                    type="text"
                    value={settings.accountNumber}
                    onChange={(e) => updateSettings({ accountNumber: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl font-bold text-[#000000] focus:border-[#000000] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#000000] font-sans uppercase text-[10px] tracking-wider">Branch Code</label>
                  <input
                    type="text"
                    value={settings.branchCode}
                    onChange={(e) => updateSettings({ branchCode: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E0E0E0] space-y-4">
              <div>
                <h4 className="font-bold text-sm text-[#000000]">Course Tier Pricing</h4>
                <p className="mt-1 text-[11px] text-[#707070]">These prices apply to new applications. Existing invoices retain their issued amounts.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {([
                  ['STARTER', 'Starter Tier'],
                  ['PROFESSIONAL', 'Professional Tier'],
                  ['CAREER_ACCELERATOR', 'Career Accelerator'],
                ] as Array<[CourseTier, string]>).map(([tier, label]) => {
                  const value = { ...TIER_CARD_DEFAULTS[tier], ...settings.courseTierPricing?.[tier] };
                  const updateTier = (changes: Partial<typeof value>) => updateSettings({ courseTierPricing: { ...TIER_CARD_DEFAULTS, ...settings.courseTierPricing, [tier]: { ...value, ...changes } } });
                  return <section key={tier} className="p-4 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl space-y-3"><h5 className="text-[10px] font-bold uppercase tracking-wider text-[#000000]">{label}</h5><div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_180px] gap-3"><label className="space-y-1"><span className="block text-[9px] font-bold uppercase text-[#707070]">Price (ZAR)</span><span className="flex rounded-lg border border-[#E0E0E0] bg-white overflow-hidden"><span className="px-3 py-2.5 border-r border-[#E0E0E0] text-[#707070] font-mono">R</span><input type="number" min="1" max="100000" step="0.01" value={value.priceZAR} onChange={event => updateTier({ priceZAR: Number(event.target.value) })} className="min-w-0 flex-1 px-3 py-2.5 bg-white font-mono text-sm font-bold text-[#000000] focus:outline-none" /></span></label><label className="space-y-1"><span className="block text-[9px] font-bold uppercase text-[#707070]">Display name</span><input maxLength={80} value={value.displayName} onChange={event => updateTier({ displayName: event.target.value })} className="w-full px-3 py-2.5 bg-white border border-[#E0E0E0] rounded-lg text-sm" /></label><label className="space-y-1"><span className="block text-[9px] font-bold uppercase text-[#707070]">Badge</span><input maxLength={40} value={value.badgeLabel} onChange={event => updateTier({ badgeLabel: event.target.value })} className="w-full px-3 py-2.5 bg-white border border-[#E0E0E0] rounded-lg text-sm" /></label></div><label className="block space-y-1"><span className="block text-[9px] font-bold uppercase text-[#707070]">Card description</span><textarea maxLength={400} rows={2} value={value.description} onChange={event => updateTier({ description: event.target.value })} className="w-full px-3 py-2.5 bg-white border border-[#E0E0E0] rounded-lg text-sm" /></label><label className="block space-y-1"><span className="block text-[9px] font-bold uppercase text-[#707070]">Card benefits, one per line</span><textarea maxLength={1600} rows={4} value={value.features.join('\n')} onChange={event => updateTier({ features: event.target.value.split('\n').map(item => item.trim()).filter(Boolean) })} className="w-full px-3 py-2.5 bg-white border border-[#E0E0E0] rounded-lg text-sm" /></label></section>;
                })}
              </div>
            </div>

            {/* Course Flash Sale Configuration Card */}
            <div className="pt-4 border-t border-[#E0E0E0] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-[#000000] flex items-center gap-2 font-sans">
                    <Zap className="w-4 h-4 text-[#000000] fill-[#000000]" />
                    <span>Course Flash Sale Manager</span>
                  </h4>
                  <p className="text-[11px] text-[#707070]">Configure course promotional discounts across bootcamp tiers with live badges and top site banners.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0 bg-[#FAFAFA] border border-[#E0E0E0] px-3 py-1.5 rounded-xl">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.flashSale?.enabled)}
                    onChange={(e) => updateSettings({
                      flashSale: {
                        enabled: e.target.checked,
                        title: settings.flashSale?.title || '⚡ SPECIAL FLASH SALE: 20% OFF ALL COURSES!',
                        discountPercent: settings.flashSale?.discountPercent || 20,
                        endDate: settings.flashSale?.endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                        targetTiers: settings.flashSale?.targetTiers || ['STARTER', 'PROFESSIONAL', 'CAREER_ACCELERATOR'],
                        manuallySet: true
                      }
                    })}
                    className="w-4 h-4 accent-[#000000]"
                  />
                  <span className="font-bold text-xs uppercase text-[#000000] font-mono">
                    {settings.flashSale?.enabled ? '⚡ FLASH SALE ACTIVE' : 'FLASH SALE INACTIVE'}
                  </span>
                </label>
              </div>

              {settings.flashSale?.enabled && (
                <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-[#000000] uppercase text-[10px] tracking-wider font-sans">Flash Sale Banner Title</label>
                      <input
                        type="text"
                        value={settings.flashSale.title}
                        onChange={(e) => updateSettings({
                          flashSale: { ...settings.flashSale!, title: e.target.value }
                        })}
                        className="w-full p-3 bg-white border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div className="space-y-1">
                        <label className="font-bold text-[#000000] uppercase text-[10px] tracking-wider font-sans">Discount (%)</label>
                        <select
                          value={settings.flashSale.discountPercent}
                          onChange={(e) => updateSettings({
                            flashSale: { ...settings.flashSale!, discountPercent: Number(e.target.value) }
                          })}
                          className="w-full p-3 bg-white border border-[#E0E0E0] rounded-xl text-[#000000] font-bold focus:border-[#000000] focus:outline-none"
                        >
                          <option value="10">10% OFF</option>
                          <option value="15">15% OFF</option>
                          <option value="20">20% OFF</option>
                          <option value="25">25% OFF</option>
                          <option value="30">30% OFF</option>
                          <option value="50">50% OFF</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-[#000000] uppercase text-[10px] tracking-wider font-sans">Sale End Date</label>
                        <input
                          type="date"
                          value={settings.flashSale.endDate}
                          onChange={(e) => updateSettings({
                            flashSale: { ...settings.flashSale!, endDate: e.target.value }
                          })}
                          className="w-full p-3 bg-white border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preset Quick Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E0E0E0]">
                    <span className="text-[10px] uppercase font-bold text-[#707070] mr-2">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => updateSettings({
                        flashSale: {
                          enabled: true,
                          title: '⚡ WEEKEND FLASH SALE: 20% OFF ALL BOOTCAMP TIERS!',
                          discountPercent: 20,
                          endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
                          targetTiers: ['STARTER', 'PROFESSIONAL', 'CAREER_ACCELERATOR'],
                          manuallySet: true
                        }
                      })}
                      className="px-3 py-1.5 bg-white border border-[#E0E0E0] hover:border-[#000000] rounded-lg text-[10px] font-bold uppercase tracking-wider"
                    >
                      20% Weekend Sale
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSettings({
                        flashSale: {
                          enabled: true,
                          title: '⚡ END OF MONTH FLASH SALE: 30% OFF ALL COURSES!',
                          discountPercent: 30,
                          endDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
                          targetTiers: ['STARTER', 'PROFESSIONAL', 'CAREER_ACCELERATOR'],
                          manuallySet: true
                        }
                      })}
                      className="px-3 py-1.5 bg-white border border-[#E0E0E0] hover:border-[#000000] rounded-lg text-[10px] font-bold uppercase tracking-wider"
                    >
                      30% End-of-Month Sale
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSettings({
                        flashSale: { ...settings.flashSale!, enabled: false, manuallySet: true }
                      })}
                      className="px-3 py-1.5 bg-white border border-[#E0E0E0] text-[#707070] hover:text-[#000000] rounded-lg text-[10px] font-bold uppercase tracking-wider"
                    >
                      Turn Off Flash Sale
                    </button>
                  </div>

                  {/* Realtime Result Preview */}
                  <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-[#E0E0E0] text-center font-mono text-xs">
                    <div>
                      <span className="text-[9px] uppercase text-[#707070] block font-sans font-bold">Starter Tier</span>
                      <span className="line-through text-[10px] text-[#A0A0A0] block">R{(settings.courseTierPricing?.STARTER.priceZAR ?? 1999).toLocaleString()}</span>
                      <strong className="text-[#000000]">R{Math.round((settings.courseTierPricing?.STARTER.priceZAR ?? 1999) * (1 - settings.flashSale.discountPercent / 100)).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-[#707070] block font-sans font-bold">Professional Tier</span>
                      <span className="line-through text-[10px] text-[#A0A0A0] block">R{(settings.courseTierPricing?.PROFESSIONAL.priceZAR ?? 3499).toLocaleString()}</span>
                      <strong className="text-[#000000]">R{Math.round((settings.courseTierPricing?.PROFESSIONAL.priceZAR ?? 3499) * (1 - settings.flashSale.discountPercent / 100)).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-[#707070] block font-sans font-bold">Career Accelerator</span>
                      <span className="line-through text-[10px] text-[#A0A0A0] block">R{(settings.courseTierPricing?.CAREER_ACCELERATOR.priceZAR ?? 4999).toLocaleString()}</span>
                      <strong className="text-[#000000]">R{Math.round((settings.courseTierPricing?.CAREER_ACCELERATOR.priceZAR ?? 4999) * (1 - settings.flashSale.discountPercent / 100)).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-5 border-t border-[#E0E0E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[11px] text-[#707070]">Changes remain editable until you save them. One confirmation will appear after saving.</p>
              <button type="button" disabled={settingsSaving} onClick={() => void handleSaveSettings()} className="px-6 py-3 bg-black hover:bg-neutral-800 disabled:bg-[#A0A0A0] text-white font-bold rounded-xl text-xs uppercase tracking-[0.18em] shadow transition">
                {settingsSaving ? 'Saving…' : 'Save All Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BULK OPERATIONS */}
      {activeTab === 'BULK_OPS' && (
        <div className="space-y-6 animate-in fade-in max-w-6xl">
          <div className="space-y-1">
            <h3 className="text-2xl font-light text-[#000000] tracking-tight">Bulk Operations</h3>
            <p className="text-xs text-[#707070]">Approve, email, and export multiple records at once.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bulk Applications */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
              <h4 className="font-bold text-[#000000] mb-4">Bulk Approve Applications</h4>
              <BulkOperationsUI
                items={applications}
                itemType="applications"
                templates={emailTemplates}
                onBulkApprove={async (ids, sendEmails) => {
                  await apiRequest('/bulk/approve', { method: 'POST', body: JSON.stringify({ applicationIds: ids, sendEmails }) });
                  ids.forEach(id => updateApplicationStatus(id, 'APPROVED'));
                }}
                onBulkExport={async (ids, format) => {
                  await apiDownload('/bulk/export', { targetIds: ids, targetType: 'applications', format }, `applications.${format}`);
                }}
                onBulkEmail={async (ids, templateId) => {
                  await apiRequest('/bulk/send-emails', { method: 'POST', body: JSON.stringify({ recipientIds: ids, recipientType: 'applications', templateId }) });
                }}
              />
            </div>

            {/* Bulk Leads */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
              <h4 className="font-bold text-[#000000] mb-4">Bulk Email Leads</h4>
              <BulkOperationsUI
                items={leads}
                itemType="leads"
                templates={emailTemplates}
                onBulkApprove={async () => {}}
                onBulkExport={async (ids, format) => {
                  await apiDownload('/bulk/export', { targetIds: ids, targetType: 'leads', format }, `leads.${format}`);
                }}
                onBulkEmail={async (ids, templateId) => {
                  await apiRequest('/bulk/send-emails', { method: 'POST', body: JSON.stringify({ recipientIds: ids, recipientType: 'leads', templateId }) });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB: EMAIL TEMPLATES */}
      {activeTab === 'EMAIL_AUTOMATION' && (
        <div className="space-y-6 animate-in fade-in max-w-4xl">
          <div className="space-y-1">
            <h3 className="text-2xl font-light text-[#000000] tracking-tight">Email Templates</h3>
            <p className="text-xs text-[#707070]">Preview and edit the message templates used by staff communication tools.</p>
          </div>

          <EmailAutomationUI
            templates={emailTemplates}
            onUpdateTemplate={async (id, updates) => {
              const updated = await apiRequest<any>(`/automation/templates/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(updates) });
              setEmailTemplates(emailTemplates.map(t => t.id === id ? updated : t));
            }}
            onRenderPreview={async (templateId, variables) => {
              const template = emailTemplates.find(t => t.id === templateId);
              if (!template) return { subject: '', html: '' };
              
              let subject = template.subject;
              let html = template.htmlBody;
              
              Object.entries(variables).forEach(([key, value]) => {
                const placeholder = new RegExp(`\\{${key}\\}`, 'g');
                subject = subject.replace(placeholder, String(value));
                html = html.replace(placeholder, String(value));
              });
              
              return { subject, html };
            }}
          />
        </div>
      )}

      {/* TAB: VIRTUAL LEARNING */}
      {/* TAB: INVOICES (moved before COHORTS) */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-6 animate-in fade-in max-w-4xl">
          <YocoPayments admin />
          <div className="space-y-1">
            <h3 className="text-2xl font-light text-[#000000] tracking-tight">Invoice Management</h3>
            <p className="text-xs text-[#707070]">Generate professional invoices for student applications and track payments.</p>
          </div>

          <InvoiceGeneratorUI
            applications={applications}
            cohorts={cohorts}
            onGenerateInvoice={async (params) => {
              const seq = invoices.length + 95;
              const ref = params.invoiceNumber || `INV-TLS-2026-${String(seq).padStart(3, '0')}`;
              const tier: CourseTier = params.courseTier || 'PROFESSIONAL';
              const option: PaymentOption = params.paymentOption || 'DEPOSIT';
              const total = params.amount || 3499;
              const deposit = params.depositZAR ?? (option === 'DEPOSIT' ? 1000 : total);
              const balance = total - deposit;

              const newInvoice: Invoice = {
                id: 'inv-' + Date.now(),
                invoiceNumber: ref,
                studentName: params.studentName,
                studentEmail: params.studentEmail,
                courseTier: tier,
                amountZAR: total,
                depositZAR: deposit,
                balanceZAR: balance,
                paymentOption: option,
                status: 'PENDING',
                dueDate: params.dueDate || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
                paymentMethod: 'EFT'
              };

              setInvoices(prev => [newInvoice, ...prev]);
              void apiRequest('/invoices', {
                method: 'POST',
                body: JSON.stringify(newInvoice)
              }).catch((err) => console.warn('Backend invoice save error:', err));
            }}
          />

          {/* Existing Invoices List */}
          <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#E0E0E0]">
              <h4 className="font-bold text-[#000000]">Generated Invoices & Realtime Balances</h4>
            </div>
            <div className="divide-y">
              {invoices.length > 0 ? (
                invoices.map((invoice) => {
                  const amountPaid = invoice.status === 'VERIFIED'
                    ? (invoice.paymentOption === 'DEPOSIT' && invoice.balanceZAR > 0 ? invoice.depositZAR : invoice.amountZAR - invoice.balanceZAR)
                    : 0;
                  const currentBalanceDue = invoice.status === 'VERIFIED'
                    ? invoice.balanceZAR
                    : invoice.amountZAR;

                  return (
                    <div key={invoice.id} className="p-5 hover:bg-[#FAFAFA] transition space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#000000]">{invoice.invoiceNumber}</span>
                            <span className="text-[10px] font-mono bg-[#FAFAFA] border border-[#E0E0E0] px-2 py-0.5 rounded text-[#707070]">
                              {invoice.courseTier}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#000000] mt-0.5">{invoice.studentName} <span className="font-normal text-[#707070]">({invoice.studentEmail})</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={emailingInvoiceId === invoice.id}
                            onClick={() => void handleEmailInvoice(invoice)}
                            className="px-3 py-1 bg-[#000000] disabled:bg-[#A0A0A0] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition"
                          >
                            {emailingInvoiceId === invoice.id ? 'Sending…' : 'Email Invoice'}
                          </button>
                          <button
                            onClick={() => setSelectedInvoiceForPdf(invoice)}
                            className="px-3 py-1 bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#000000] font-bold text-[10px] uppercase tracking-wider rounded-lg border border-[#E0E0E0] flex items-center gap-1 transition"
                          >
                            <Printer className="w-3 h-3" />
                            <span>View / Print PDF</span>
                          </button>
                          <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                            invoice.status === 'VERIFIED' ? 'bg-[#000000] text-white border-[#000000]' : 'bg-[#FAFAFA] text-[#707070] border-[#E0E0E0]'
                          }`}>
                            {friendlyStatus(invoice.status)}
                          </span>
                          {payments.some(item => item.invoiceId === invoice.id && item.status === 'SUBMITTED') && (
                            <button
                              onClick={() => { const payment = payments.find(item => item.invoiceId === invoice.id && item.status === 'SUBMITTED'); if (payment) void openPopReview(payment); }}
                              className="px-3 py-1 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg shadow"
                            >
                              Review Submitted POP
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-[#FAFAFA] p-3 rounded-lg border border-[#E0E0E0]">
                        <div>
                          <span className="text-[#707070] text-[9px] uppercase block">Total Course Fee</span>
                          <strong className="text-[#000000]">R{invoice.amountZAR.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="text-[#707070] text-[9px] uppercase block">Required Deposit</span>
                          <strong className="text-[#000000]">R{invoice.depositZAR.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="text-[#707070] text-[9px] uppercase block">Amount Paid</span>
                          <strong className="text-[#000000]">R{amountPaid.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="text-[#707070] text-[9px] uppercase block">Balance Due</span>
                          <strong className={currentBalanceDue > 0 ? 'text-[#CC0000]' : 'text-[#008000]'}>
                            R{currentBalanceDue.toLocaleString()}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-[#707070]">
                        <span>
                          POP Document: {invoice.proofOfPaymentUrl ? (
                            <strong className="text-[#008000]">✔ {invoice.proofOfPaymentUrl.split('/').pop()}</strong>
                          ) : (
                            <span className="text-[#707070]">Pending Upload</span>
                          )}
                        </span>
                        {invoice.paidAt && <span>Payment Recorded: {invoice.paidAt} ({invoice.paymentMethod || 'EFT'})</span>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-[#707070] text-xs">No invoices generated yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {reviewingPayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-3 sm:p-5">
          <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-20 bg-white border-b border-[#E0E0E0] p-4 flex items-center justify-between"><div><h3 className="font-bold text-sm uppercase tracking-wider">Proof of Payment Review</h3><p className="text-[10px] font-mono text-[#707070]">{reviewingPayment.originalFileName} • {reviewingPayment.eftReference}</p></div><button onClick={closePopReview} className="px-4 py-2 bg-black text-white rounded-lg font-bold text-[10px] uppercase">Close</button></div>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] min-h-[680px]">
              <section className="bg-[#202020] p-4 overflow-auto flex flex-col">
                <div className="flex items-center justify-between gap-2 pb-3 text-white"><span className="text-[10px] font-bold uppercase tracking-wider">Document Preview</span>{popPreview?.type.startsWith('image/') && <div className="flex gap-2"><button onClick={() => setPopZoom(value => Math.max(.5, value - .25))} className="p-2 bg-white/10 rounded" title="Zoom out"><ZoomOut className="w-4 h-4" /></button><button onClick={() => setPopZoom(value => Math.min(3, value + .25))} className="p-2 bg-white/10 rounded" title="Zoom in"><ZoomIn className="w-4 h-4" /></button><button onClick={() => setPopRotation(value => (value + 90) % 360)} className="p-2 bg-white/10 rounded" title="Rotate"><RotateCw className="w-4 h-4" /></button></div>}</div>
                <div className="flex-1 min-h-[580px] bg-[#333] rounded-xl overflow-auto flex items-center justify-center">
                  {popPreviewLoading ? <p className="text-white text-xs">Loading secure preview…</p> : popPreview?.type === 'application/pdf' ? <iframe title="POP PDF preview" src={popPreview.url} className="w-full h-[650px] bg-white" /> : popPreview?.type.startsWith('image/') ? <img src={popPreview.url} alt="Submitted proof of payment" className="max-w-none transition-transform duration-200" style={{ transform: `rotate(${popRotation}deg) scale(${popZoom})`, maxHeight: popZoom <= 1 ? '620px' : 'none' }} /> : <p className="text-white text-xs">Preview unavailable for this file format.</p>}
                </div>
              </section>
              <aside className="p-5 space-y-5 bg-[#FAFAFA]">
                {reviewingDuplicateCount > 0 && <div className="p-3 border border-[#CC0000] bg-[#FFF5F5] text-[#9B1C1C] rounded-xl text-xs font-bold">Duplicate warning: this file hash matches {reviewingDuplicateCount} previous payment submission{reviewingDuplicateCount === 1 ? '' : 's'}.</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <section className="p-4 bg-white border border-[#E0E0E0] rounded-xl text-xs space-y-2"><h4 className="font-bold uppercase text-[10px] tracking-wider">Student & Application</h4><p><strong>{reviewingApplication?.firstName} {reviewingApplication?.lastName}</strong><br />{reviewingApplication?.email}<br />{reviewingApplication?.whatsapp}</p><p className="font-mono text-[10px] text-[#707070]">Application: {reviewingApplication?.referenceNumber}<br />Cohort: {reviewingCohort?.name}<br />Status: {reviewingApplication?.status}</p></section>
                  <section className="p-4 bg-white border border-[#E0E0E0] rounded-xl text-xs space-y-2"><h4 className="font-bold uppercase text-[10px] tracking-wider">Invoice & Banking</h4><p className="font-mono"><strong>{reviewingInvoice?.invoiceNumber}</strong><br />Invoice total: R{reviewingInvoice?.amountZAR.toLocaleString()}<br />Paid: R{(reviewingInvoice?.paidZAR ?? 0).toLocaleString()}<br />Balance: R{reviewingInvoice?.balanceZAR.toLocaleString()}</p><p className="text-[#707070]">{settings.bankName}<br />{settings.accountName}<br />Account: {settings.accountNumber}<br />Branch: {settings.branchCode}</p></section>
                </div>
                <section className="p-4 bg-white border border-[#E0E0E0] rounded-xl space-y-3 text-xs"><h4 className="font-bold uppercase text-[10px] tracking-wider">Verification</h4><div className="grid grid-cols-2 gap-2 font-mono text-[10px]"><span>Submitted amount</span><strong className="text-right">R{reviewingPayment.amountZAR.toLocaleString()}</strong><span>EFT reference</span><strong className="text-right break-all">{reviewingPayment.eftReference}</strong><span>File hash</span><strong className="text-right" title={reviewingPayment.sha256}>{reviewingPayment.sha256.slice(0, 12)}…</strong></div><label className="space-y-1 block"><span className="font-bold uppercase text-[10px]">Confirmed amount received</span><input type="number" min="0.01" step="0.01" value={confirmedPopAmount} onChange={event => setConfirmedPopAmount(event.target.value)} className="w-full p-3 border border-[#E0E0E0] rounded-xl font-mono font-bold" /></label></section>
                {currentRole === 'ADMIN' && <section className="space-y-3"><button disabled={!Number.isFinite(Number(confirmedPopAmount)) || Number(confirmedPopAmount) <= 0 || reviewingDuplicateCount > 0} onClick={async () => { if (await verifySubmittedPayment(reviewingPayment.id, Number(confirmedPopAmount))) closePopReview(); }} className="w-full py-3 bg-black disabled:bg-[#D0D0D0] text-white disabled:text-[#707070] rounded-xl font-bold text-xs uppercase tracking-wider">Confirm Payment & Recalculate Balance</button><div className="p-4 border border-[#E0E0E0] bg-white rounded-xl space-y-2"><label className="font-bold uppercase text-[10px]">Mandatory rejection reason</label><textarea value={popRejectionReason} onChange={event => setPopRejectionReason(event.target.value)} rows={3} placeholder="Explain clearly what the student must correct…" className="w-full p-3 border border-[#E0E0E0] rounded-xl text-xs" /><button disabled={!popRejectionReason.trim()} onClick={async () => { if (await rejectSubmittedPayment(reviewingPayment.id, popRejectionReason.trim())) closePopReview(); }} className="w-full py-2.5 border border-[#CC0000] disabled:border-[#D0D0D0] text-[#CC0000] disabled:text-[#A0A0A0] rounded-xl font-bold text-[10px] uppercase">Reject POP & Email Student</button></div></section>}
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal for Admin */}
      {selectedInvoiceForPdf && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4">
            <div className="sticky top-0 bg-white border-b border-[#E0E0E0] pb-3 flex items-center justify-between z-10">
              <h3 className="font-bold text-[#000000] text-sm uppercase tracking-wider">Updated Printable Tax Invoice</h3>
              <button
                onClick={() => setSelectedInvoiceForPdf(null)}
                className="px-4 py-1.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs rounded-xl uppercase tracking-wider"
              >
                Close Preview
              </button>
            </div>
            <PrintableInvoice invoice={selectedInvoiceForPdf} allowPrint={true} />
          </div>
        </div>
      )}
    </div>
  );
};

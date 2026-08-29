import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../lib/api';
import { ApplicationStatus, LeadStatus, SupportTicket, Certificate, Invoice, CourseTier, PaymentOption } from '../../types';
import { CertificateView } from '../../components/common/CertificateView';
import { PrintableInvoice } from '../../components/common/PrintableInvoice';
import { BulkOperationsUI } from '../../components/admin/BulkOperationsUI';
import { EmailAutomationUI } from '../../components/admin/EmailAutomationUI';
import { InvoiceGeneratorUI } from '../../components/admin/InvoiceGeneratorUI';
import { VirtualLearningUI } from '../../components/admin/VirtualLearningUI';
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
  MonitorPlay
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    currentRole,
    adminLogin,
    logout,
    applications,
    updateApplicationStatus,
    sendApprovalEmail,
    cohorts,
    updateCohort,
    tickets,
    createTicket,
    leads,
    updateLeadStatus,
    invoices,
    setInvoices,
    verifyInvoicePayment,
    settleInvoiceBalance,
    certificates,
    issueCertificate,
    settings,
    updateSettings,
    students,
    navigate
  } = useApp();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'APPLICATIONS' | 'COHORTS' | 'TICKETS' | 'LEADS' | 'INVOICES' | 'CERTIFICATES' | 'SETTINGS' | 'BULK_OPS' | 'EMAIL_AUTOMATION' | 'VIRTUAL_LEARNING'>('OVERVIEW');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [editingCohortId, setEditingCohortId] = useState<string | null>(null);
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<Invoice | null>(null);
  const [cohortForm, setCohortForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    scheduleFormat: '',
    deliveryMode: 'Hybrid (Cape Town Lab + Virtual)' as '100% Virtual Learning' | 'Hybrid (Cape Town Lab + Virtual)',
    location: '',
    capacity: 20,
    status: 'Open' as 'Open' | 'Filling Fast' | 'Closed' | 'In Progress' | 'Completed'
  });
  const [adminForm, setAdminForm] = useState({ email: 'dave@techlabs.co.za', password: 'admin123' });
  const [adminLoginError, setAdminLoginError] = useState('');

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

  const handleAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = adminLogin(adminForm.email, adminForm.password);
    if (!ok) {
      setAdminLoginError('Use the TechLabs admin account to continue.');
      return;
    }
    setAdminLoginError('');
  };

  const handleApproveApplication = async (app: typeof applications[number], notes?: string) => {
    updateApplicationStatus(app.id, 'APPROVED', notes || 'Approved by admissions team. Payment and onboarding instructions issued.');
    await sendApprovalEmail(app, 'APPROVED');
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

  // Metrics
  const totalRevenue = invoices
    .filter(i => i.status === 'VERIFIED')
    .reduce((acc, curr) => {
      const actualPaid = curr.paymentOption === 'DEPOSIT' && curr.balanceZAR > 0 
        ? curr.depositZAR 
        : (curr.amountZAR - curr.balanceZAR);
      return acc + actualPaid;
    }, 0);
  const pendingApps = applications.filter(a => a.status === 'NEW' || a.status === 'LAPTOP_REVIEW' || a.status === 'UNDER_REVIEW');
  const verifiedStudentsCount = students.length;

  if (currentRole !== 'ADMIN') {
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
            Demo admin login: dave@techlabs.co.za / admin123
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
      cohortName: 'Cape Town Cohort Alpha (Oct 2026)',
      practicalGrade: certGrade,
      competencies: [
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
              Lead Instructor: Dave Kitching
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

      {/* Navigation Tabs */}
      <div className="bg-[#FAFAFA] p-1.5 rounded-xl border border-[#E0E0E0] shadow-sm flex items-center gap-1 overflow-x-auto text-xs font-bold font-mono">
        {[
          { id: 'OVERVIEW', label: 'Operations Overview', icon: TrendingUp },
          { id: 'APPLICATIONS', label: `Student Applications (${applications.length})`, icon: Users },
          { id: 'BULK_OPS', label: 'Bulk Operations', icon: Zap },
          { id: 'EMAIL_AUTOMATION', label: 'Email Automation', icon: Mail },
          { id: 'VIRTUAL_LEARNING', label: 'Virtual Learning', icon: MonitorPlay },
          { id: 'INVOICES', label: `Invoices (${invoices.length})`, icon: FileText },
          { id: 'COHORTS', label: `Cohorts (${cohorts.length})`, icon: Calendar },
          { id: 'LEADS', label: `Leads CRM (${leads.length})`, icon: MessageSquare },
          { id: 'CERTIFICATES', label: `Certificates (${certificates.length})`, icon: Award },
          { id: 'SETTINGS', label: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap uppercase tracking-wider text-[11px] ${
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

      {/* TAB 1: OVERVIEW */}
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

          {/* Application Detail Inspection Modal */}
          {selectedApp && (
            <div className="bg-[#FAFAFA] text-[#1A1A1A] p-6 sm:p-8 rounded-2xl border-2 border-[#000000] shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
                <div>
                  <span className="text-xs font-mono text-[#707070]">Application Reference: {selectedApp.referenceNumber}</span>
                  <h4 className="text-xl font-bold text-[#000000] mt-0.5">
                    {selectedApp.firstName} {selectedApp.lastName}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedAppId(null)}
                  className="text-xs font-mono uppercase text-[#707070] hover:text-[#000000]"
                >
                  Close Inspection
                </button>
              </div>

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

              {/* Status Changer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E0E0E0]">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span>Current Status:</span>
                  <strong className="text-[#000000] uppercase font-bold">{selectedApp.status}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void handleApproveApplication(selectedApp, 'Approved by admissions team. Payment and onboarding instructions issued.')}
                    className="px-4 py-2 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow"
                  >
                    Approve Application & Email Student
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(selectedApp.id, 'ENROLLED')}
                    className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#E0E0E0] transition"
                  >
                    Mark Fully Enrolled
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(selectedApp.id, 'REJECTED')}
                    className="px-4 py-2 bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#707070] hover:text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#E0E0E0] transition"
                  >
                    Reject (Hardware Incompatible)
                  </button>
                </div>
              </div>
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
                  {applications.map((app) => (
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
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedAppId(app.id)}
                          className="px-3 py-1.5 bg-[#000000] hover:bg-neutral-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition"
                        >
                          Review
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
                    {cohort.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#707070]">
                  <p><strong className="text-[#000000]">Dates:</strong> {cohort.startDate} → {cohort.endDate}</p>
                  <p><strong className="text-[#000000]">Schedule:</strong> {cohort.scheduleFormat}</p>
                  <p><strong className="text-[#000000]">Mode:</strong> {cohort.deliveryMode} ({cohort.location})</p>
                  <p><strong className="text-[#000000]">Enrolled:</strong> <strong className="text-[#000000]">{cohort.enrolledCount} / {cohort.capacity} Students</strong></p>
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
                  <span className="font-bold text-[#000000]">{ticket.status}</span>
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
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#FAFAFA]">
                      <td className="p-4 font-bold text-[#000000]">{lead.name}</td>
                      <td className="p-4 text-[11px]">
                        <span className="text-[#1A1A1A] block">{lead.whatsapp}</span>
                        <span className="text-[#707070] block">{lead.email}</span>
                      </td>
                      <td className="p-4 font-mono text-[11px]">{lead.courseInterest}</td>
                      <td className="p-4 font-mono text-[11px] text-[#707070]">{lead.followUpDate}</td>
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
                        <a
                          href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(lead.name)},%20this%20is%20Dave%20from%20TechLabs%20Academy%20SA.%20I%20saw%20your%20IT%20Support%20inquiry.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#000000] hover:bg-neutral-800 text-white rounded-lg text-[10px] uppercase font-bold tracking-wider"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INVOICES & EFT */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-light text-[#000000] tracking-tight">Student Invoices & Bank EFT Verifications</h3>
              <p className="text-xs text-[#707070]">Confirm proof of payment uploads, issue receipts, and record gateway transactions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {invoices.map((inv) => (
              <div key={inv.id} className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E0E0E0] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#A0A0A0] uppercase font-bold">Invoice #{inv.invoiceNumber}</span>
                    <h4 className="font-bold text-base text-[#000000]">{inv.studentName}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase border ${
                    inv.status === 'VERIFIED' ? 'bg-[#000000] text-white border-[#000000]' : 'bg-[#FAFAFA] text-[#707070] border-[#E0E0E0]'
                  }`}>
                    {inv.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[#707070] block">Total Tuition:</span>
                    <strong className="text-[#000000]">R{inv.amountZAR.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-[#707070] block">Seat Deposit:</span>
                    <strong className="text-[#000000]">R{inv.depositZAR.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-[#707070] block">Course Tier:</span>
                    <span className="text-[#000000]">{inv.courseTier}</span>
                  </div>
                  <div>
                    <span className="text-[#707070] block">Due Date:</span>
                    <span className="text-[#000000]">{inv.dueDate}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E0E0E0] flex items-center justify-between">
                  <div className="text-[11px] font-mono">
                    {inv.proofOfPaymentUrl ? (
                      <span className="inline-flex items-center gap-1.5 text-[#008000] font-bold">
                        <span>✔ POP Attached ({inv.proofOfPaymentUrl.split('/').pop()})</span>
                      </span>
                    ) : (
                      <span className="text-[#707070]">POP: Pending Upload</span>
                    )}
                    {inv.paidAt && <span className="block text-[10px] text-[#707070]">Paid: {inv.paidAt} via {inv.paymentMethod || 'EFT'}</span>}
                  </div>
                  {inv.status !== 'VERIFIED' ? (
                    <button
                      onClick={() => verifyInvoicePayment(inv.id)}
                      className="px-4 py-2 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow"
                    >
                      Verify EFT Payment & Activate Student
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-[#000000] uppercase tracking-wider font-mono">Payment Verified</span>
                  )}
                </div>
              </div>
            ))}
          </div>
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

      {/* TAB 8: SETTINGS & BANK DETAILS */}
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
                      <span className="line-through text-[10px] text-[#A0A0A0] block">R1,999</span>
                      <strong className="text-[#000000]">R{Math.round(1999 * (1 - settings.flashSale.discountPercent / 100)).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-[#707070] block font-sans font-bold">Professional Tier</span>
                      <span className="line-through text-[10px] text-[#A0A0A0] block">R3,499</span>
                      <strong className="text-[#000000]">R{Math.round(3499 * (1 - settings.flashSale.discountPercent / 100)).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-[#707070] block font-sans font-bold">Career Accelerator</span>
                      <span className="line-through text-[10px] text-[#A0A0A0] block">R4,999</span>
                      <strong className="text-[#000000]">R{Math.round(4999 * (1 - settings.flashSale.discountPercent / 100)).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              )}
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
                  console.log(`Bulk approve ${ids.length} applications, send emails: ${sendEmails}`);
                  // API call would go here
                }}
                onBulkExport={async (ids, format) => {
                  console.log(`Export ${ids.length} applications as ${format}`);
                  // API call would go here
                }}
                onBulkEmail={async (ids, templateId) => {
                  console.log(`Send ${templateId} email to ${ids.length} applications`);
                  // API call would go here
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
                  console.log(`Export ${ids.length} leads as ${format}`);
                }}
                onBulkEmail={async (ids, templateId) => {
                  console.log(`Send ${templateId} email to ${ids.length} leads`);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB: EMAIL AUTOMATION */}
      {activeTab === 'EMAIL_AUTOMATION' && (
        <div className="space-y-6 animate-in fade-in max-w-4xl">
          <div className="space-y-1">
            <h3 className="text-2xl font-light text-[#000000] tracking-tight">Email Automation Templates</h3>
            <p className="text-xs text-[#707070]">Configure automated email templates for key application events.</p>
          </div>

          <EmailAutomationUI
            templates={emailTemplates}
            onUpdateTemplate={async (id, updates) => {
              setEmailTemplates(emailTemplates.map(t => t.id === id ? { ...t, ...updates } : t));
              console.log(`Updated template ${id}`);
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
      {activeTab === 'VIRTUAL_LEARNING' && (
        <div className="space-y-6 animate-in fade-in max-w-6xl">
          <div className="space-y-1">
            <h3 className="text-2xl font-light text-[#000000] tracking-tight">Virtual Learning Mode</h3>
            <p className="text-xs text-[#707070]">Configure live virtual sessions, Teams/Zoom links, and attendance tracking for your cohorts.</p>
          </div>

          <VirtualLearningUI cohorts={cohorts} />
        </div>
      )}

      {/* TAB: INVOICES (moved before COHORTS) */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-6 animate-in fade-in max-w-4xl">
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
                            onClick={() => setSelectedInvoiceForPdf(invoice)}
                            className="px-3 py-1 bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#000000] font-bold text-[10px] uppercase tracking-wider rounded-lg border border-[#E0E0E0] flex items-center gap-1 transition"
                          >
                            <Printer className="w-3 h-3" />
                            <span>View / Print PDF</span>
                          </button>
                          <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                            invoice.status === 'VERIFIED' ? 'bg-[#000000] text-white border-[#000000]' : 'bg-[#FAFAFA] text-[#707070] border-[#E0E0E0]'
                          }`}>
                            {invoice.status}
                          </span>
                          {invoice.status !== 'VERIFIED' && (
                            <button
                              onClick={() => verifyInvoicePayment(invoice.id)}
                              className="px-3 py-1 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg shadow"
                            >
                              Verify Deposit & Enroll
                            </button>
                          )}
                          {invoice.status === 'VERIFIED' && invoice.balanceZAR > 0 && (
                            <button
                              onClick={() => settleInvoiceBalance(invoice.id)}
                              className="px-3 py-1 bg-[#006600] hover:bg-[#004D00] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg shadow"
                            >
                              Verify Balance Settlement
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

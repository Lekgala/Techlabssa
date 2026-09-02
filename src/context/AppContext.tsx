import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, apiUpload, setApiSession } from '../lib/api';
import {
  User,
  Lead,
  Application,
  Cohort,
  SupportTicket,
  PracticalLab,
  Invoice,
  Assessment,
  Certificate,
  AttendanceRecord,
  ApplicationStatus,
  LeadStatus,
  PaymentOption,
  Role,
  CourseTier,
  CourseModule,
  AcademySettings,
  FlashSaleConfig
  ,PaymentRecord
} from '../types';

export const getTierPrice = (
  tier: CourseTier,
  settings?: Pick<AcademySettings, 'courseTierPricing' | 'flashSale'>
): { original: number; current: number; isDiscounted: boolean; discountPercent: number } => {
  const basePrices: Record<CourseTier, number> = {
    STARTER: 1999,
    PROFESSIONAL: 3499,
    CAREER_ACCELERATOR: 4999,
  };
  const original = settings?.courseTierPricing?.[tier]?.priceZAR || basePrices[tier];
  const flashSale = settings?.flashSale;
  if (flashSale && flashSale.enabled && flashSale.discountPercent > 0) {
    const isTargeted = !flashSale.targetTiers || flashSale.targetTiers.length === 0 || flashSale.targetTiers.includes(tier);
    if (isTargeted) {
      const current = Math.round(original * (1 - flashSale.discountPercent / 100));
      return { original, current, isDiscounted: true, discountPercent: flashSale.discountPercent };
    }
  }
  return { original, current: original, isDiscounted: false, discountPercent: 0 };
};

import { 
  COURSE_MODULES, 
  COHORTS, 
  REAL_SUPPORT_TICKETS, 
  PRACTICAL_LABS, 
  INITIAL_INVOICES, 
  INITIAL_ASSESSMENTS, 
  SAMPLE_CERTIFICATE, 
  INITIAL_ATTENDANCE, 
  INITIAL_LEADS, 
  INITIAL_APPLICATIONS 
} from '../data/mockData';

const DEFAULT_STUDENT_USER: User = {
  id: 'usr-student-01',
  name: 'Bongani Dlamini',
  email: 'bongani.dlamini@techlabs.co.za',
  role: 'STUDENT',
  whatsapp: '+27820000001',
  cohortId: 'cohort-oct-2026'
};

const DEFAULT_ADMIN_USER: User = {
  id: 'usr-admin-01',
  name: 'TechLabs Administrator',
  email: 'admin@techlabs.co.za',
  role: 'ADMIN',
  whatsapp: '+27820000002'
};

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message: string;
}

type StudentProfile = User & {
  firstName: string;
  lastName: string;
  progressPercent: number;
};

interface AppContextType {
  // Navigation & Routing
  currentPath: string;
  navigate: (path: string) => void;
  
  // Auth & Roles
  currentUser: User | null;
  currentStudent: StudentProfile | null;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  loginAsStudent: () => void;
  studentLogin: (email: string, password: string) => Promise<boolean>;
  loginAsAdmin: () => void;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  students: StudentProfile[];
  
  // Data Collections
  leads: Lead[];
  applications: Application[];
  cohorts: Cohort[];
  tickets: SupportTicket[];
  labs: PracticalLab[];
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  assessments: Assessment[];
  certificates: Certificate[];
  attendance: AttendanceRecord[];
  courseModules: CourseModule[];
  payments: PaymentRecord[];
  paymentSettings?: Pick<AcademySettings, 'bankName' | 'accountName' | 'accountNumber' | 'branchCode' | 'referenceFormat'>;
  
  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'notes'>) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  addLeadNote: (id: string, note: string) => void;
  updateLeadFollowUp: (id: string, followUpDate: string) => void;
  createCourseModule: (module: Omit<CourseModule, 'number'>) => Promise<boolean>;
  saveCourseModule: (moduleNumber: number, updates: Partial<CourseModule>) => Promise<boolean>;
  
  submitApplication: (appData: Omit<Application, 'id' | 'referenceNumber' | 'submissionDate' | 'status'>) => Promise<string>;
  updateApplicationStatus: (id: string, status: ApplicationStatus, notes?: string) => void;
  recordApplicationDecision: (id: string, status: 'REJECTED' | 'WAITLISTED' | 'WITHDRAWN', reason: string) => Promise<boolean>;
  transferApplicationCohort: (id: string, cohortId: string, reason: string) => Promise<boolean>;
  updateStudentRecord: (id: string, updates: Partial<Application>) => Promise<boolean>;
  setPaymentRemindersPaused: (id: string, paused: boolean) => Promise<boolean>;
  sendApprovalEmail: (app: Application, type: 'APPROVED' | 'REJECTED' | 'WAITLISTED') => Promise<boolean>;
  
  updateTicketResolution: (ticketId: string, rootCause: string, resolutionNotes: string) => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status'], notes?: string) => void;
  gradeTicket: (ticketId: string, gradeScore: number, feedback: string) => void;
  createTicket: (ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'status'>) => void;
  
  toggleLabComplete: (labId: string) => void;
  
  markAttendance: (studentId: string, cohortId: string, status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED') => void;
  qrCheckIn: (studentId: string) => boolean;
  
  recordPayment: (invoiceId: string, paymentMethod: 'EFT' | 'Yoco' | 'PayFast' | 'Card') => void;
  uploadProofOfPayment: (invoiceId: string, file: File, eftReference: string) => Promise<boolean>;
  verifySubmittedPayment: (paymentId: string, amountZAR: number) => Promise<boolean>;
  rejectSubmittedPayment: (paymentId: string, reason: string) => Promise<boolean>;
  verifyInvoicePayment: (invoiceId: string) => void;
  settleInvoiceBalance: (invoiceId: string) => void;
  
  issueCertificate: (certData: Omit<Certificate, 'id' | 'certificateNumber' | 'verificationUrl' | 'qrCodeData'>) => Certificate;
  getCertificateByNumber: (certNumber: string) => Certificate | undefined;
  
  createCohort: (cohort: Omit<Cohort, 'id' | 'enrolledCount'>) => void;
  updateCohort: (id: string, updates: Partial<Cohort>) => void;
  updateCohortStatus: (id: string, status: Cohort['status']) => void;
  
  // Settings & Toasts
  settings: AcademySettings;
  updateSettings: (newSettings: Partial<AcademySettings>) => void;
  saveSettings: () => Promise<boolean>;
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'info' | 'error', title: string, message: string) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasHydrated, setHasHydrated] = useState(false);
  const hasPersistedOnceRef = React.useRef(false);

  const persistRecord = (collection: string, id: string, updates: unknown) =>
    apiRequest(`/${collection}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(updates) })
      .catch(error => console.warn(`Unable to update ${collection}/${id}:`, error));

  const hydrateFromApi = async () => {
    try {
      const data = await apiRequest<{
        currentUser?: User | null;
        currentRole?: Role;
        leads?: Lead[];
        applications?: Application[];
        cohorts?: Cohort[];
        tickets?: SupportTicket[];
        labs?: PracticalLab[];
        invoices?: Invoice[];
        assessments?: Assessment[];
        certificates?: Certificate[];
        attendance?: AttendanceRecord[];
        courseModules?: CourseModule[];
        settings?: Partial<AcademySettings>;
      }>('/data');

      if (data.leads && data.leads.length > 0) setLeads(data.leads);
      if (data.applications && data.applications.length > 0) setApplications(data.applications);
      if (data.cohorts && data.cohorts.length > 0) setCohorts(data.cohorts.map((c: any) => ({ ...c, deliveryMode: c.deliveryMode === 'Cape Town On-Campus' ? '100% Virtual Learning' : c.deliveryMode })));
      if (data.tickets && data.tickets.length > 0) setTickets(data.tickets);
      if (data.labs && data.labs.length > 0) setLabs(data.labs);
      if (data.invoices && data.invoices.length > 0) setInvoices(data.invoices);
      if (data.assessments && data.assessments.length > 0) setAssessments(data.assessments);
      if (data.certificates && data.certificates.length > 0) setCertificates(data.certificates);
      if (data.attendance && data.attendance.length > 0) setAttendance(data.attendance);
      if (data.courseModules && data.courseModules.length > 0) setCourseModules(data.courseModules);
      if (data.settings) setSettings(current => ({ ...current, ...data.settings, flashSale: data.settings.flashSale ?? { ...current.flashSale!, enabled: false } }));

      if (localStorage.getItem('techlabs_session')) {
        try {
          const restored = await apiRequest<{ user: User }>('/session');
          setCurrentUser(restored.user);
          setCurrentRole(restored.user.role);
          if (restored.user.role === 'ADMIN' || restored.user.role === 'INSTRUCTOR') {
            const adminData = await apiRequest<any>('/admin/data');
            setLeads(adminData.leads || []); setApplications(adminData.applications || []); setCohorts(adminData.cohorts || []);
            setTickets(adminData.tickets || []); setLabs(adminData.labs || []); setInvoices(adminData.invoices || []);
            setAssessments(adminData.assessments || []); setCertificates(adminData.certificates || []);
            setAttendance(adminData.attendance || []); setCourseModules(adminData.courseModules || []);
            setPayments(adminData.payments || []);
            if (adminData.academySettings) setSettings(adminData.academySettings);
          } else if (restored.user.role === 'STUDENT') {
            const studentData = await apiRequest<any>('/student/data');
            setApplications(studentData.application ? [studentData.application] : []); setInvoices(studentData.invoices || []);
            setTickets(studentData.tickets || []); setAttendance(studentData.attendance || []);
            setAssessments(studentData.assessments || []); setCertificates(studentData.certificates || []);
            setPayments(studentData.payments || []); setPaymentSettings(studentData.paymentSettings);
          }
        } catch {
          setApiSession();
          setCurrentUser(null);
          setCurrentRole('VISITOR');
        }
      }
    } catch (error) {
      console.warn('Falling back to localStorage data because the backend is unavailable:', error);
    } finally {
      setHasHydrated(true);
    }
  };

  // Navigation
  const normalizeRoute = (input?: string): string => {
    if (!input) return '/';

    let route = input.trim();
    if (route.startsWith('#')) route = route.slice(1);

    if (route.startsWith('http://') || route.startsWith('https://')) {
      try {
        const parsed = new URL(route);
        route = parsed.pathname + parsed.hash;
      } catch {
        route = '/';
      }
    }

    route = route.replace(/index\.html$/i, '');
    route = decodeURIComponent(route);
    if (!route.startsWith('/')) route = `/${route}`;
    if (route.length > 1 && route.endsWith('/')) route = route.replace(/\/+$/, '');
    return route || '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    const browserPath = normalizeRoute(window.location.pathname || '/');
    return browserPath === '' ? '/' : browserPath;
  });

  const navigate = (path: string) => {
    const safePath = normalizeRoute(path);
    setCurrentPath(safePath);
    if (typeof window !== 'undefined') {
      const nextUrl = new URL(window.location.href);
      nextUrl.pathname = safePath === '/' ? '/' : safePath;
      nextUrl.hash = '';
      window.history.pushState({}, '', nextUrl.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = normalizeRoute(window.location.pathname || '/');
      setCurrentPath((prev) => (prev === nextPath ? prev : nextPath));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auth
  const [currentRole, setCurrentRole] = useState<Role>('VISITOR');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loginAsStudent = () => navigate('/student/login');

  const studentLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ token: string; user: User }>('/auth/student', { method: 'POST', body: JSON.stringify({ email, password }) });
      setApiSession(response.token);
      setCurrentRole('STUDENT'); setCurrentUser(response.user);
      const data = await apiRequest<any>('/student/data');
      setApplications(data.application ? [data.application] : []); setInvoices(data.invoices || []); setTickets(data.tickets || []);
      setAttendance(data.attendance || []); setAssessments(data.assessments || []); setCertificates(data.certificates || []);
      setPayments(data.payments || []); setPaymentSettings(data.paymentSettings);
      showToast('success', 'Signed In', `Welcome back, ${response.user.name.split(' ')[0]}!`); navigate('/student'); return true;
    } catch {
      showToast('error', 'Sign In Failed', 'Check your email and password, or use the recovery options below.'); return false;
    }
  };

  const loginAsAdmin = () => navigate('/admin/login');

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ token: string; user: User }>('/auth/admin', { method: 'POST', body: JSON.stringify({ email, password }) });
      setApiSession(response.token); setCurrentRole(response.user.role); setCurrentUser(response.user);
      const data = await apiRequest<any>('/admin/data');
      setLeads(data.leads || []); setApplications(data.applications || []); setCohorts(data.cohorts || []); setTickets(data.tickets || []); setLabs(data.labs || []); setInvoices(data.invoices || []); setAssessments(data.assessments || []); setCertificates(data.certificates || []); setAttendance(data.attendance || []); setCourseModules(data.courseModules || []);
      setPayments(data.payments || []);
      if (data.academySettings) setSettings(data.academySettings);
      showToast('success', 'Admin Signed In', 'Welcome to the TechLabs admissions console.'); navigate('/admin'); return true;
    } catch {
      showToast('error', 'Access Denied', 'Invalid administrator credentials.'); return false;
    }
  };

  const logout = () => {
    void apiRequest('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setApiSession();
    setCurrentRole('VISITOR');
    setCurrentUser(null);
    showToast('info', 'Logged Out', 'You have been signed out successfully.');
    navigate('/');
  };

  // State Collections with LocalStorage Persistence
  const [leads, setLeads] = useState<Lead[]>([]);

  const [applications, setApplications] = useState<Application[]>([]);

  const [cohorts, setCohorts] = useState<Cohort[]>(() => {
    const saved = localStorage.getItem('techlabs_cohorts');
    if (!saved) return COHORTS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 
        ? parsed.map((c: any) => ({ ...c, deliveryMode: c.deliveryMode === 'Cape Town On-Campus' ? '100% Virtual Learning' : c.deliveryMode }))
        : COHORTS;
    } catch {
      return COHORTS;
    }
  });

  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const [labs, setLabs] = useState<PracticalLab[]>(() => {
    const saved = localStorage.getItem('techlabs_labs');
    if (!saved) return PRACTICAL_LABS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : PRACTICAL_LABS;
    } catch {
      return PRACTICAL_LABS;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<AppContextType['paymentSettings']>();

  const [assessments, setAssessments] = useState<Assessment[]>([]);

  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [courseModules, setCourseModules] = useState<CourseModule[]>(() => {
    const saved = localStorage.getItem('techlabs_course_modules');
    if (!saved) return COURSE_MODULES;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : COURSE_MODULES;
    } catch {
      return COURSE_MODULES;
    }
  });

  const [settings, setSettings] = useState<AcademySettings>(() => {
    const defaults: AcademySettings = {
      whatsappNumber: (import.meta as any).env?.VITE_WHATSAPP_NUMBER || '+27821234567',
      studentSupportWhatsappNumber: (import.meta as any).env?.VITE_STUDENT_SUPPORT_WHATSAPP_NUMBER || (import.meta as any).env?.VITE_WHATSAPP_NUMBER || '+27821234567',
      admissionsEmail: (import.meta as any).env?.VITE_ACADEMY_EMAIL || 'admissions@techlabs.co.za',
      campusAddress: 'Cape Town, South Africa',
      bankName: 'Provided on your official invoice',
      accountName: 'Configured by administration',
      accountNumber: 'Contact admissions',
      branchCode: 'Contact admissions',
      referenceFormat: 'TLS-ReferenceNumber (e.g. TLS-2026-0089)',
      flashSale: {
        enabled: false,
        title: '⚡ SPECIAL FLASH SALE: 20% OFF ALL COURSES & BOOTCAMP TIERS!',
        discountPercent: 20,
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        targetTiers: ['STARTER', 'PROFESSIONAL', 'CAREER_ACCELERATOR']
      },
      courseTierPricing: {
        STARTER: { priceZAR: 1999, displayName: 'Starter Tier', description: 'Weekend practical self-paced lab track with comprehensive workbooks and VMware guidance.', features: ['Weekend practical labs', 'Student workbook & architecture diagrams', 'VMware lab guidance & ISO links', 'Practical exercises & helpdesk scripts', 'Certificate of Completion'], badgeLabel: 'Self-paced' },
        PROFESSIONAL: { priceZAR: 3499, displayName: 'Professional Tier', description: 'Full bootcamp with live evening and weekend sessions, enterprise VMware labs, and tickets.', features: ['Full 8-12 week bootcamp', 'Live evening and weekend practical sessions', 'VMware enterprise labs (Server, AD, DNS)', 'Microsoft 365, Entra ID, Intune & Defender', 'PowerShell automation & helpdesk tickets', 'Graded assessments & verified certificate'], badgeLabel: 'Most Popular' },
        CAREER_ACCELERATOR: { priceZAR: 4999, displayName: 'Career Accelerator', description: 'Everything in Professional plus dedicated 1-on-1 career coaching and mock interviews.', features: ['Everything in Professional Tier', 'Technical CV and portfolio review', 'LinkedIn profile optimization', '1-on-1 technical mock interview', 'Job application guidance', 'Priority placement assistance'], badgeLabel: 'Full Support' }
      }
    };
    return defaults;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    void hydrateFromApi();
  }, []);

  // Public catalog preferences may be cached locally. Personal and operational
  // records remain server-owned and are loaded only after authentication.
  useEffect(() => {
    if (!hasHydrated) return;
  }, [leads, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
  }, [applications, hasHydrated]);

  useEffect(() => {
    localStorage.setItem('techlabs_cohorts', JSON.stringify(cohorts));
    if (!hasHydrated) return;
    if (!hasPersistedOnceRef.current) {
      hasPersistedOnceRef.current = true;
      return;
    }
  }, [cohorts, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
  }, [tickets, hasHydrated]);

  useEffect(() => {
    localStorage.setItem('techlabs_labs', JSON.stringify(labs));
    if (!hasHydrated) return;
    if (!hasPersistedOnceRef.current) {
      hasPersistedOnceRef.current = true;
      return;
    }
  }, [labs, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
  }, [invoices, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
  }, [attendance, hasHydrated]);

  useEffect(() => {
    localStorage.setItem('techlabs_course_modules', JSON.stringify(courseModules));
    if (!hasHydrated) return;
    if (!hasPersistedOnceRef.current) {
      hasPersistedOnceRef.current = true;
      return;
    }
  }, [courseModules, hasHydrated]);

  const getProgressForCohort = (cohortId?: string) => {
    const cohort = (cohorts && cohorts.length > 0)
      ? (cohorts.find((candidate) => candidate.id === cohortId) || cohorts[0])
      : COHORTS[0];
    const modules = (courseModules && courseModules.length > 0) ? courseModules : COURSE_MODULES;

    if (!cohort?.startDate || !modules.length) {
      return { completedModules: 0, progressPercent: 0 };
    }

    const start = new Date(`${cohort.startDate}T00:00:00`);
    const now = new Date();
    let completedModules = 0;

    modules.forEach((module, index) => {
      const moduleDate = new Date(start);
      moduleDate.setDate(start.getDate() + index * 7);
      if (moduleDate <= now) {
        completedModules += 1;
      }
    });

    const progressPercent = Math.min(100, Math.round((completedModules / modules.length) * 100));
    return { completedModules, progressPercent };
  };

  const currentStudent: StudentProfile | null = currentUser && currentRole === 'STUDENT'
    ? {
        ...currentUser,
        firstName: currentUser.name.split(' ')[0] || 'Student',
        lastName: currentUser.name.split(' ').slice(1).join(' ') || 'Profile',
        progressPercent: getProgressForCohort(currentUser.cohortId).progressPercent
      }
    : null;

  const students: StudentProfile[] = [
    currentStudent,
    ...applications
      .filter(app => app.status === 'ENROLLED' || app.status === 'APPROVED')
      .map(app => ({
        id: app.id,
        name: `${app.firstName} ${app.lastName}`,
        email: app.email,
        role: 'STUDENT' as const,
        whatsapp: app.whatsapp,
        cohortId: app.cohortId,
        firstName: app.firstName,
        lastName: app.lastName,
        progressPercent: getProgressForCohort(app.cohortId).progressPercent
      })),
    ...leads
      .filter(lead => lead.status === 'ACTIVE_STUDENT' || lead.status === 'ENROLLED')
      .map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        role: 'STUDENT' as const,
        whatsapp: lead.whatsapp,
        cohortId: 'cohort-oct-2026',
        firstName: lead.name.split(' ')[0] || 'Student',
        lastName: lead.name.split(' ').slice(1).join(' ') || 'Lead',
        progressPercent: getProgressForCohort('cohort-oct-2026').progressPercent
      }))
  ]
    .filter((student): student is StudentProfile => Boolean(student && student.email))
    .filter((student, index, array) => array.findIndex(item => item && item.email && item.email.toLowerCase() === student.email.toLowerCase()) === index);

  // Toast Helpers
  const showToast = (type: 'success' | 'info' | 'error', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Business Actions
  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'notes'>) => {
    const newLead: Lead = {
      ...leadData,
      id: 'lead-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      notes: [`Inquiry received from ${leadData.source}`]
    };
    setLeads(prev => [newLead, ...prev]);
    void apiRequest<Lead>('/leads', { method: 'POST', body: JSON.stringify(leadData) })
      .then(saved => setLeads(prev => [saved, ...prev.filter(item => item.id !== newLead.id)]))
      .catch(() => showToast('error', 'Inquiry Not Saved', 'We could not save your inquiry. Please use the WhatsApp contact option.'));
    showToast('success', 'Inquiry Received', 'Thank you. Your inquiry has been submitted to admissions.');
  };

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    const previousStatus = leads.find(lead => lead.id === id)?.status;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    void apiRequest<Lead>(`/admin/leads/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ status }) })
      .then(saved => setLeads(prev => prev.map(lead => lead.id === saved.id ? saved : lead)))
      .catch(() => { if (previousStatus) setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, status: previousStatus } : lead)); showToast('error', 'Lead Not Updated', 'The status change could not be saved.'); });
    showToast('info', 'Lead Updated', `Lead status updated to ${status.replace('_', ' ')}`);
  };

  const addLeadNote = (id: string, note: string) => {
    const cleanNote = note.trim();
    if (!cleanNote) return;
    void apiRequest<Lead>(`/admin/leads/${encodeURIComponent(id)}/notes`, { method: 'POST', body: JSON.stringify({ note: cleanNote }) })
      .then(saved => { setLeads(prev => prev.map(lead => lead.id === saved.id ? saved : lead)); showToast('success', 'Note Added', 'Advisor note saved to lead record.'); })
      .catch(() => showToast('error', 'Note Not Added', 'The recruitment note could not be saved.'));
  };

  const updateLeadFollowUp = (id: string, followUpDate: string) => {
    void apiRequest<Lead>(`/admin/leads/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ followUpDate }) })
      .then(saved => { setLeads(prev => prev.map(lead => lead.id === saved.id ? saved : lead)); showToast('success', 'Follow-up Scheduled', `Next follow-up set for ${followUpDate}.`); })
      .catch(() => showToast('error', 'Follow-up Not Saved', 'Use a valid follow-up date and try again.'));
  };

  const saveCourseModule = async (moduleNumber: number, updates: Partial<CourseModule>): Promise<boolean> => {
    try {
      const saved = await apiRequest<CourseModule>(`/admin/course-modules/${moduleNumber}`, { method: 'PUT', body: JSON.stringify(updates) });
      setCourseModules(current => [...current.filter(module => module.number !== saved.number), saved].sort((left, right) => left.number - right.number));
      showToast('success', 'Curriculum Updated', `Module ${saved.number} was saved successfully.`);
      return true;
    } catch (error) {
      showToast('error', 'Curriculum Not Updated', error instanceof Error ? error.message : 'The module could not be saved.');
      return false;
    }
  };

  const createCourseModule = async (module: Omit<CourseModule, 'number'>): Promise<boolean> => {
    try {
      const saved = await apiRequest<CourseModule>('/admin/course-modules', { method: 'POST', body: JSON.stringify(module) });
      setCourseModules(current => [...current, saved].sort((left, right) => left.number - right.number));
      showToast('success', 'Module Added', `Module ${saved.number} was added to the curriculum.`);
      return true;
    } catch (error) {
      showToast('error', 'Module Not Added', error instanceof Error ? error.message : 'The module could not be created.');
      return false;
    }
  };

  const submitApplication = async (appData: Omit<Application, 'id' | 'referenceNumber' | 'submissionDate' | 'status'>): Promise<string> => {
    const amountZAR = getTierPrice(appData.selectedTier, settings).current;
    const response = await apiRequest<{ application: Application; invoice: Invoice; emailDelivery: { sent: boolean } }>('/applications', {
      method: 'POST', body: JSON.stringify({ ...appData, amountZAR })
    });
    setApplications(prev => [response.application, ...prev.filter(a => a.id !== response.application.id)]);
    setInvoices(prev => [response.invoice, ...prev.filter(i => i.id !== response.invoice.id)]);
    showToast('success', 'Application Submitted!', `Your reference code is ${response.application.referenceNumber}. Save it securely to access your application portal.`);
    if (response.emailDelivery.sent) {
      showToast('info', 'Confirmation Sent', `A confirmation email was sent to ${response.application.email}.`);
    } else {
      showToast('info', 'Save Your Reference', 'Email confirmation is temporarily unavailable, so please save the reference shown on this page.');
    }
    return response.application.referenceNumber;
  };

  const updateApplicationStatus = async (id: string, status: ApplicationStatus, notes?: string) => {
    const application = applications.find(item => item.id === id);
    try {
      const response = await apiRequest<{ application: Application; cohort?: Cohort; waitlisted?: boolean }>(`/applications/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ status, ...(notes ? { adminNotes: application?.adminNotes ? `${application.adminNotes} | ${notes}` : notes } : {}) }) });
      setApplications(prev => prev.map(item => item.id === id ? response.application : item));
      if (response.cohort) setCohorts(prev => prev.map(item => item.id === response.cohort!.id ? response.cohort! : item));
      showToast(response.waitlisted ? 'info' : 'success', response.waitlisted ? 'Cohort Full' : 'Application Status Updated', response.waitlisted ? 'No seat was available, so the applicant was moved to the waitlist.' : `Application status changed to ${response.application.status}`);
    } catch (error) { showToast('error', 'Status Update Failed', error instanceof Error ? error.message : 'The application status could not be updated.'); }
  };

  const recordApplicationDecision = async (id: string, status: 'REJECTED' | 'WAITLISTED' | 'WITHDRAWN', reason: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ application: Application; cohort?: Cohort; emailDelivery: { sent: boolean; reason?: string } }>(`/admin/applications/${encodeURIComponent(id)}/decision`, { method: 'POST', body: JSON.stringify({ status, reason }) });
      setApplications(current => current.map(application => application.id === id ? response.application : application));
      if (response.cohort) setCohorts(current => current.map(cohort => cohort.id === response.cohort!.id ? response.cohort! : cohort));
      showToast(response.emailDelivery.sent ? 'success' : 'info', 'Decision Recorded', response.emailDelivery.sent ? 'The application was updated and the student was emailed.' : `The application was updated, but email delivery failed${response.emailDelivery.reason ? `: ${response.emailDelivery.reason}` : '.'}`);
      return true;
    } catch (error) { showToast('error', 'Decision Not Recorded', error instanceof Error ? error.message : 'The decision could not be saved.'); return false; }
  };

  const transferApplicationCohort = async (id: string, cohortId: string, reason: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ application: Application; sourceCohort?: Cohort; targetCohort: Cohort; emailDelivery: { sent: boolean; reason?: string } }>(`/admin/applications/${encodeURIComponent(id)}/transfer`, { method: 'POST', body: JSON.stringify({ cohortId, reason }) });
      setApplications(current => current.map(application => application.id === id ? response.application : application));
      setCohorts(current => current.map(cohort => cohort.id === response.targetCohort.id ? response.targetCohort : response.sourceCohort && cohort.id === response.sourceCohort.id ? response.sourceCohort : cohort));
      showToast(response.emailDelivery.sent ? 'success' : 'info', 'Cohort Transfer Complete', response.emailDelivery.sent ? `Student moved to ${response.targetCohort.name} and notified by email.` : `Student moved to ${response.targetCohort.name}, but the notification email failed${response.emailDelivery.reason ? `: ${response.emailDelivery.reason}` : '.'}`);
      return true;
    } catch (error) { showToast('error', 'Transfer Failed', error instanceof Error ? error.message : 'The student could not be transferred.'); return false; }
  };

  const updateStudentRecord = async (id: string, updates: Partial<Application>): Promise<boolean> => {
    try {
      const response = await apiRequest<{ application: Application; invoice?: Invoice }>(`/admin/applications/${encodeURIComponent(id)}/record`, { method: 'PUT', body: JSON.stringify(updates) });
      setApplications(current => current.map(application => application.id === id ? response.application : application));
      if (response.invoice) setInvoices(current => current.map(invoice => invoice.id === response.invoice!.id ? response.invoice! : invoice));
      showToast('success', 'Student Record Updated', 'Corrections were saved and added to the audit log.'); return true;
    } catch (error) { showToast('error', 'Record Update Failed', error instanceof Error ? error.message : 'The student record could not be updated.'); return false; }
  };

  const setPaymentRemindersPaused = async (id: string, paused: boolean): Promise<boolean> => {
    try {
      await apiRequest(`/applications/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ paymentRemindersPaused: paused }) });
      setApplications(prev => prev.map(application => application.id === id ? { ...application, paymentRemindersPaused: paused } : application));
      showToast('success', paused ? 'Reminders Paused' : 'Reminders Resumed', paused ? 'Scheduled payment reminders are paused for this student.' : 'Scheduled payment reminders are active for this student.');
      return true;
    } catch (error) {
      showToast('error', 'Reminder Setting Failed', error instanceof Error ? error.message : 'The reminder preference could not be saved.');
      return false;
    }
  };

  const sendApprovalEmail = async (app: Application, type: 'APPROVED' | 'REJECTED' | 'WAITLISTED'): Promise<boolean> => {
    try {
      const response = await apiRequest<{ ok: boolean; message: string; application: Application; invoice: Invoice; emailDelivery: { sent: boolean; reason?: string } }>('/email/approval', {
        method: 'POST',
        body: JSON.stringify({
          applicantName: `${app.firstName} ${app.lastName}`,
          email: app.email,
          type,
          referenceNumber: app.referenceNumber,
          cohortName: app.cohortId || 'Next available intake'
        })
      });

      setApplications(current => current.map(application => application.id === response.application.id ? response.application : application));
      setInvoices(current => current.map(invoice => invoice.id === response.invoice.id ? response.invoice : invoice));
      showToast(response.ok ? 'success' : 'info', response.ok ? 'Application Approved' : 'Approved — Email Failed', response.ok ? `${response.message} to ${app.email}` : `${response.message}${response.emailDelivery.reason ? `: ${response.emailDelivery.reason}` : '.'}`);
      return true;
    } catch (error) {
      console.warn('Email dispatch failed:', error);
      showToast('error', 'Email Failed', `Unable to send the ${type.toLowerCase()} email to ${app.email}.`);
      return false;
    }
  };

  const updateTicketResolution = (ticketId: string, rootCause: string, resolutionNotes: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'RESOLVED',
          studentRootCause: rootCause,
          studentResolutionNotes: resolutionNotes,
          submittedAt: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) + ' SAST'
        };
      }
      return t;
    }));
    void apiRequest(`/student/tickets/${encodeURIComponent(ticketId)}`, { method: 'PATCH', body: JSON.stringify({ studentRootCause: rootCause, studentResolutionNotes: resolutionNotes }) });
    showToast('success', 'Ticket Submitted for Review', 'Your resolution notes have been sent to your instructor.');
  };

  const updateTicketStatus = (ticketId: string, status: SupportTicket['status'], notes?: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status,
          studentResolutionNotes: notes || t.studentResolutionNotes,
          submittedAt: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) + ' SAST'
        };
      }
      return t;
    }));
    void persistRecord('tickets', ticketId, { status, ...(notes ? { studentResolutionNotes: notes } : {}) });
    showToast('info', 'Ticket Status Updated', `Ticket marked as ${status}`);
  };

  const gradeTicket = (ticketId: string, gradeScore: number, feedback: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          gradeScore,
          instructorFeedback: feedback,
          status: 'VERIFIED'
        };
      }
      return t;
    }));
    void persistRecord('tickets', ticketId, { gradeScore, instructorFeedback: feedback, status: 'VERIFIED' });
    showToast('success', 'Ticket Graded', `Assigned ${gradeScore}% with instructor feedback.`);
  };

  const createTicket = (ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'status'>) => {
    const num = `INT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTkt: SupportTicket = {
      ...ticketData,
      id: 'tkt-' + Date.now(),
      ticketNumber: num,
      status: 'OPEN'
    };
    setTickets(prev => [newTkt, ...prev]);
    void apiRequest('/tickets', { method: 'POST', body: JSON.stringify(newTkt) });
    showToast('success', 'Support Ticket Created', `Ticket ${num} published to student queue.`);
  };

  const toggleLabComplete = (labId: string) => {
    const lab = labs.find(item => item.id === labId);
    setLabs(prev => prev.map(l => l.id === labId ? { ...l, isCompleted: !l.isCompleted } : l));
    if (lab) void persistRecord('labs', labId, { isCompleted: !lab.isCompleted });
    showToast('success', 'Lab Progress Updated', 'Practical lab status updated.');
  };

  const markAttendance = (studentId: string, cohortId: string, status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED') => {
    const record: AttendanceRecord = {
      id: 'att-' + Date.now(),
      cohortId,
      sessionDate: new Date().toISOString().split('T')[0],
      sessionTopic: 'Live Practical Session',
      studentId,
      studentName: studentId === 'usr-student-01' ? 'Bongani Dlamini' : 'Student',
      status,
      checkInTime: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) + ' SAST'
    };
    setAttendance(prev => [record, ...prev]);
    void apiRequest('/attendance', { method: 'POST', body: JSON.stringify(record) });
    showToast('success', 'Attendance Recorded', `Status marked as ${status}`);
  };

  const qrCheckIn = (studentId: string): boolean => {
    markAttendance(studentId, 'cohort-oct-2026', 'PRESENT');
    showToast('success', 'QR Check-in Verified!', 'Welcome to class! Your attendance has been logged in real-time.');
    return true;
  };

  const recordPayment = (invoiceId: string, paymentMethod: 'EFT' | 'Yoco' | 'PayFast' | 'Card') => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          balanceZAR: 0,
          status: 'VERIFIED',
          paidAt: new Date().toISOString().split('T')[0],
          paymentMethod
        };
      }
      return inv;
    }));
    void persistRecord('invoices', invoiceId, { balanceZAR: 0, status: 'VERIFIED', paidAt: new Date().toISOString().split('T')[0], paymentMethod });

    const selectedInvoice = invoices.find(i => i.id === invoiceId);
    if (selectedInvoice) {
      const app = applications.find(a => a.email.toLowerCase() === selectedInvoice.studentEmail.toLowerCase());
      if (app) {
        updateApplicationStatus(app.id, 'ENROLLED', `Payment recorded via ${paymentMethod}. Outstanding balance: R0.`);
      }
    }

    showToast('success', 'Payment Received', 'Tuition payment recorded in full! Remaining balance: R0.');
  };

  const uploadProofOfPayment = async (invoiceId: string, file: File, eftReference: string): Promise<boolean> => {
    try {
      const response = await apiUpload<{ payment: PaymentRecord; invoice: Invoice }>(`/student/invoices/${encodeURIComponent(invoiceId)}/proof`, file, { 'X-EFT-Reference': eftReference });
      setPayments(prev => [response.payment, ...prev]);
      setInvoices(prev => prev.map(item => item.id === invoiceId ? response.invoice : item));
      showToast('success', 'POP Submitted', 'Your deposit is awaiting verification by admissions.');
      return true;
    } catch (error) {
      showToast('error', 'Upload Failed', error instanceof Error ? error.message : 'The proof of payment could not be uploaded.');
      return false;
    }
  };

  const verifySubmittedPayment = async (paymentId: string, amountZAR: number): Promise<boolean> => {
    try {
      const response = await apiRequest<{ payment: PaymentRecord; invoice: Invoice; application: Application; cohort?: Cohort; waitlisted?: boolean }>(`/admin/payments/${encodeURIComponent(paymentId)}/verify`, { method: 'POST', body: JSON.stringify({ amountZAR }) });
      setPayments(prev => prev.map(item => item.id === paymentId ? response.payment : item));
      setInvoices(prev => prev.map(item => item.id === response.invoice.id ? response.invoice : item));
      setApplications(prev => prev.map(item => item.id === response.application.id ? response.application : item));
      if (response.cohort) setCohorts(prev => prev.map(item => item.id === response.cohort!.id ? response.cohort! : item));
      showToast(response.waitlisted ? 'info' : 'success', response.waitlisted ? 'Payment Verified - Waitlisted' : 'Deposit Verified', response.waitlisted ? `R${amountZAR.toLocaleString()} recorded. The cohort is full, so the applicant was moved to the waitlist.` : `R${amountZAR.toLocaleString()} recorded. The student is now enrolled.`);
      return true;
    } catch (error) {
      showToast('error', 'Verification Failed', error instanceof Error ? error.message : 'Payment could not be verified.');
      return false;
    }
  };

  const rejectSubmittedPayment = async (paymentId: string, reason: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ payment: PaymentRecord; invoice?: Invoice }>(`/admin/payments/${encodeURIComponent(paymentId)}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      setPayments(prev => prev.map(item => item.id === paymentId ? response.payment : item));
      if (response.invoice) setInvoices(prev => prev.map(item => item.id === response.invoice!.id ? response.invoice! : item));
      showToast('info', 'POP Rejected', 'The proof was rejected and can be submitted again.');
      return true;
    } catch (error) {
      showToast('error', 'Rejection Failed', error instanceof Error ? error.message : 'Payment could not be rejected.');
      return false;
    }
  };

  const verifyInvoicePayment = (invoiceId: string) => {
    const selectedInvoice = invoices.find((inv) => inv.id === invoiceId);

    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'VERIFIED',
          paidAt: new Date().toISOString().split('T')[0]
        };
      }
      return inv;
    }));
    void persistRecord('invoices', invoiceId, { balanceZAR: 0, status: 'VERIFIED', paidAt: new Date().toISOString().split('T')[0] });

    if (selectedInvoice) {
      const matchingApp = applications.find(a => a.email.toLowerCase() === selectedInvoice.studentEmail.toLowerCase());
      if (matchingApp) {
        updateApplicationStatus(matchingApp.id, 'ENROLLED', `Payment verified for ${selectedInvoice.invoiceNumber}. Student enrolled.`);
      }

      const matchingLead = leads.find((lead) => lead.email.toLowerCase() === selectedInvoice.studentEmail.toLowerCase());
      if (matchingLead) {
        setLeads(prev => prev.map((lead) =>
          lead.id === matchingLead.id
            ? {
                ...lead,
                status: 'ACTIVE_STUDENT',
                notes: [...lead.notes, `Payment verified for ${selectedInvoice.invoiceNumber}. Student activated.`]
              }
            : lead,
        ));
      }
    }

    showToast('success', 'Invoice Verified', 'Invoice verified and applicant converted to ENROLLED student.');
  };

  const settleInvoiceBalance = (invoiceId: string) => {
    const selectedInvoice = invoices.find((inv) => inv.id === invoiceId);

    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          balanceZAR: 0,
          status: 'VERIFIED',
          paidAt: new Date().toISOString().split('T')[0]
        };
      }
      return inv;
    }));

    if (selectedInvoice) {
      const matchingApp = applications.find(a => a.email.toLowerCase() === selectedInvoice.studentEmail.toLowerCase());
      if (matchingApp) {
        updateApplicationStatus(matchingApp.id, 'ENROLLED', `Full tuition balance settled for ${selectedInvoice.invoiceNumber}.`);
      }
    }

    showToast('success', 'Balance Settled', 'Outstanding balance has been settled in full (R0 remaining).');
  };

  const issueCertificate = (certData: Omit<Certificate, 'id' | 'certificateNumber' | 'verificationUrl' | 'qrCodeData'>): Certificate => {
    const seq = certificates.length + 125;
    const num = `TLS-2026-00${seq}`;
    const newCert: Certificate = {
      ...certData,
      id: 'cert-' + Date.now(),
      certificateNumber: num,
      verificationUrl: `https://techlabs.co.za/verify/${num}`,
      qrCodeData: `https://techlabs.co.za/verify/${num}`
    };
    setCertificates(prev => [newCert, ...prev]);
    void apiRequest('/certificates', { method: 'POST', body: JSON.stringify(newCert) });
    showToast('success', 'Certificate Issued!', `Certificate ${num} generated and published.`);
    return newCert;
  };

  const getCertificateByNumber = (certNumber: string) => {
    return certificates.find(c => c.certificateNumber.toLowerCase() === certNumber.trim().toLowerCase());
  };

  const createCohort = (cohortData: Omit<Cohort, 'id' | 'enrolledCount'>) => {
    const newCohort: Cohort = {
      ...cohortData,
      id: 'cohort-' + Date.now(),
      enrolledCount: 0
    };
    setCohorts(prev => [...prev, newCohort]);
    void apiRequest('/cohorts', { method: 'POST', body: JSON.stringify(newCohort) });
    showToast('success', 'Cohort Created', `${cohortData.name} is now active.`);
  };

  const updateCohort = async (id: string, updates: Partial<Cohort>) => {
    try {
      const cohort = await apiRequest<Cohort>(`/cohorts/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(updates) });
      setCohorts(prev => prev.map(item => item.id === id ? cohort : item));
      showToast('success', 'Cohort Updated', 'Cohort details were updated successfully.');
    } catch (error) { showToast('error', 'Cohort Update Failed', error instanceof Error ? error.message : 'The cohort could not be updated.'); }
  };

  const updateCohortStatus = (id: string, status: Cohort['status']) => {
    setCohorts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    void persistRecord('cohorts', id, { status });
    showToast('info', 'Cohort Status Updated', `Cohort status updated to ${status}`);
  };

  const updateSettings = (newSettings: Partial<AcademySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const saveSettings = async (): Promise<boolean> => {
    if (currentRole !== 'ADMIN') return false;
    try {
      const saved = await apiRequest<AcademySettings>('/settings', { method: 'PUT', body: JSON.stringify(settings) });
      setSettings(saved);
      showToast('success', 'Settings Saved', 'All academy and banking settings were updated.');
      return true;
    } catch (error) {
      showToast('error', 'Settings Not Saved', error instanceof Error ? error.message : 'The server could not save the settings.');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        currentUser,
        currentStudent,
        currentRole,
        setCurrentRole,
        loginAsStudent,
        studentLogin,
        loginAsAdmin,
        adminLogin,
        logout,
        students,
        leads,
        applications,
        cohorts,
        tickets,
        labs,
        invoices,
        setInvoices,
        payments,
        paymentSettings,
        assessments,
        certificates,
        attendance,
        courseModules,
        addLead,
        updateLeadStatus,
        addLeadNote,
        updateLeadFollowUp,
        createCourseModule,
        saveCourseModule,
        submitApplication,
        updateApplicationStatus,
        recordApplicationDecision,
        transferApplicationCohort,
        updateStudentRecord,
        setPaymentRemindersPaused,
        sendApprovalEmail,
        updateTicketResolution,
        updateTicketStatus,
        gradeTicket,
        createTicket,
        toggleLabComplete,
        markAttendance,
        qrCheckIn,
        recordPayment,
        uploadProofOfPayment,
        verifySubmittedPayment,
        rejectSubmittedPayment,
        verifyInvoicePayment,
        settleInvoiceBalance,
        issueCertificate,
        getCertificateByNumber,
        createCohort,
        updateCohort,
        updateCohortStatus,
        settings,
        updateSettings,
        saveSettings,
        toasts,
        showToast,
        dismissToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

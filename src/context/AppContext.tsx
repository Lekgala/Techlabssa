import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
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
} from '../types';

export const getTierPrice = (
  tier: CourseTier,
  flashSale?: FlashSaleConfig
): { original: number; current: number; isDiscounted: boolean; discountPercent: number } => {
  const basePrices: Record<CourseTier, number> = {
    STARTER: 1999,
    PROFESSIONAL: 3499,
    CAREER_ACCELERATOR: 4999,
  };
  const original = basePrices[tier] || 3499;
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
  name: 'David Kitching',
  email: 'dave@techlabs.co.za',
  role: 'ADMIN',
  whatsapp: '+27820000002'
};

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message: string;
}

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  actionLabel?: string;
  actionUrl?: string;
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
  studentLogin: (email: string, referenceNumber: string) => boolean;
  loginAsAdmin: () => void;
  adminLogin: (email: string, password: string) => boolean;
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
  
  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'notes'>) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  addLeadNote: (id: string, note: string) => void;
  
  submitApplication: (appData: Omit<Application, 'id' | 'referenceNumber' | 'submissionDate' | 'status'>) => string;
  updateApplicationStatus: (id: string, status: ApplicationStatus, notes?: string) => void;
  sendApprovalEmail: (app: Application, type: 'APPROVED' | 'REJECTED' | 'WAITLISTED') => Promise<boolean>;
  
  updateTicketResolution: (ticketId: string, rootCause: string, resolutionNotes: string) => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status'], notes?: string) => void;
  gradeTicket: (ticketId: string, gradeScore: number, feedback: string) => void;
  createTicket: (ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'status'>) => void;
  
  toggleLabComplete: (labId: string) => void;
  
  markAttendance: (studentId: string, cohortId: string, status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED') => void;
  qrCheckIn: (studentId: string) => boolean;
  
  recordPayment: (invoiceId: string, paymentMethod: 'EFT' | 'Yoco' | 'PayFast' | 'Card') => void;
  uploadProofOfPayment: (invoiceId: string, fileName: string) => void;
  verifyInvoicePayment: (invoiceId: string) => void;
  settleInvoiceBalance: (invoiceId: string) => void;
  
  issueCertificate: (certData: Omit<Certificate, 'id' | 'certificateNumber' | 'verificationUrl' | 'qrCodeData'>) => Certificate;
  getCertificateByNumber: (certNumber: string) => Certificate | undefined;
  
  createCohort: (cohort: Omit<Cohort, 'id' | 'enrolledCount'>) => void;
  updateCohort: (id: string, updates: Partial<Cohort>) => void;
  updateCohortStatus: (id: string, status: Cohort['status']) => void;
  
  // Onboarding
  onboardingSteps: OnboardingStep[];
  toggleOnboardingStep: (stepId: number) => void;
  onboardingProgressPercent: number;
  
  // Settings & Toasts
  settings: AcademySettings;
  updateSettings: (newSettings: Partial<AcademySettings>) => void;
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'info' | 'error', title: string, message: string) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 1, title: 'Application Approved', description: 'Your IT background and laptop specifications have been verified by our admissions panel.', completed: true },
  { id: 2, title: 'Payment Confirmed', description: 'Deposit/Tuition recorded. Your seat in the cohort is secured.', completed: true },
  { id: 3, title: 'Student Account Created', description: 'Your official TechLabs student identity and credentials have been provisioned.', completed: true },
  { id: 4, title: 'Student Portal Activated', description: 'Full access to labs, simulated tickets, and learning materials unlocked.', completed: true },
  { id: 5, title: 'Join WhatsApp & Teams Group', description: 'Connect with your instructor, mentor, and fellow cohort peers.', completed: true, actionLabel: 'Open WhatsApp Group', actionUrl: '#' },
  { id: 6, title: 'Install VMware Workstation Pro', description: 'Download VMware Workstation Pro for Windows and run setup.', completed: true, actionLabel: 'Download Guide', actionUrl: '/student/resources' },
  { id: 7, title: 'Verify Hardware Virtualization', description: 'Ensure VT-x / AMD-V is enabled in your laptop BIOS/UEFI.', completed: true },
  { id: 8, title: 'Download Windows Server & Win11 ISOs', description: 'Download the official Microsoft evaluation ISOs for your lab build.', completed: false, actionLabel: 'ISO Mirrors', actionUrl: '/student/resources' },
  { id: 9, title: 'Deploy Base DC01 Virtual Machine', description: 'Build your initial Windows Server 2022 template machine.', completed: false, actionLabel: 'Open Lab Guide', actionUrl: '/student/labs' },
  { id: 10, title: 'Attend Live Virtual Orientation', description: 'Meet Lead Instructor Dave Kitching for the kickoff orientation call.', completed: false },
  { id: 11, title: 'Unlock First Class Session', description: 'Module 1 & 2 hands-on lab environment ready for kickoff.', completed: false }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasHydrated, setHasHydrated] = useState(false);
  const hasPersistedOnceRef = React.useRef(false);

  const persistCollection = async <T,>(collection: 'leads' | 'applications' | 'cohorts' | 'tickets' | 'labs' | 'invoices' | 'assessments' | 'certificates' | 'attendance' | 'courseModules', value: T) => {
    try {
      await apiRequest(`/${collection}`, {
        method: 'POST',
        body: JSON.stringify(value)
      });
    } catch (error) {
      console.warn(`Unable to persist ${collection} to the backend:`, error);
    }
  };

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

  const loginAsStudent = () => {
    setCurrentRole('STUDENT');
    setCurrentUser(DEFAULT_STUDENT_USER);
    showToast('success', 'Logged In as Student', 'Welcome back, Bongani Dlamini!');
    navigate('/student');
  };

  const studentLogin = (email: string, referenceNumber: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanRef = referenceNumber.trim().toUpperCase();

    // Find applicant matching email & reference
    const app = applications.find(
      a => a.email.trim().toLowerCase() === cleanEmail && a.referenceNumber.trim().toUpperCase() === cleanRef
    );

    if (app) {
      const studentUser: User = {
        id: app.id,
        name: `${app.firstName} ${app.lastName}`,
        email: app.email,
        role: 'STUDENT',
        whatsapp: app.whatsapp,
        cohortId: app.cohortId || 'cohort-oct-2026'
      };

      setCurrentRole('STUDENT');
      setCurrentUser(studentUser);
      showToast('success', 'Signed In', `Welcome back, ${app.firstName}!`);
      navigate('/student');
      return true;
    }

    // Default student user fallback for demo/testing
    if (cleanEmail === DEFAULT_STUDENT_USER.email.toLowerCase()) {
      setCurrentRole('STUDENT');
      setCurrentUser(DEFAULT_STUDENT_USER);
      showToast('success', 'Signed In', `Welcome back, ${DEFAULT_STUDENT_USER.name}!`);
      navigate('/student');
      return true;
    }

    showToast('error', 'Sign In Failed', 'No application found with matching Email and Reference Number.');
    return false;
  };

  const loginAsAdmin = () => {
    setCurrentRole('ADMIN');
    setCurrentUser(DEFAULT_ADMIN_USER);
    showToast('success', 'Logged In as Admin', 'Welcome to TechLabs Administration, David Kitching.');
    navigate('/admin');
  };

  const adminLogin = (email: string, password: string): boolean => {
    if (email.trim().toLowerCase() === DEFAULT_ADMIN_USER.email.toLowerCase() && password === 'admin123') {
      setCurrentRole('ADMIN');
      setCurrentUser(DEFAULT_ADMIN_USER);
      showToast('success', 'Admin Signed In', 'Welcome back to the TechLabs admissions console.');
      navigate('/admin');
      return true;
    }

    showToast('error', 'Access Denied', 'Invalid admin credentials. Use the TechLabs admin account details.');
    return false;
  };

  const logout = () => {
    setCurrentRole('VISITOR');
    setCurrentUser(null);
    showToast('info', 'Logged Out', 'You have been signed out successfully.');
    navigate('/');
  };

  // State Collections with LocalStorage Persistence
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('techlabs_leads');
    if (!saved) return INITIAL_LEADS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localStorage.getItem('techlabs_applications');
    if (!saved) return INITIAL_APPLICATIONS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  });

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

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('techlabs_tickets');
    if (!saved) return REAL_SUPPORT_TICKETS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : REAL_SUPPORT_TICKETS;
    } catch {
      return REAL_SUPPORT_TICKETS;
    }
  });

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

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('techlabs_invoices');
    if (!saved) return INITIAL_INVOICES;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [assessments, setAssessments] = useState<Assessment[]>(() => {
    const saved = localStorage.getItem('techlabs_assessments');
    if (!saved) return INITIAL_ASSESSMENTS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ASSESSMENTS;
    } catch {
      return INITIAL_ASSESSMENTS;
    }
  });

  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const saved = localStorage.getItem('techlabs_certificates');
    if (!saved) return [SAMPLE_CERTIFICATE];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [SAMPLE_CERTIFICATE];
    } catch {
      return [SAMPLE_CERTIFICATE];
    }
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('techlabs_attendance');
    if (!saved) return INITIAL_ATTENDANCE;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  });

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

  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>(() => {
    const saved = localStorage.getItem('techlabs_onboarding');
    return saved ? JSON.parse(saved) : INITIAL_ONBOARDING_STEPS;
  });

  const [settings, setSettings] = useState<AcademySettings>(() => {
    const saved = localStorage.getItem('techlabs_settings');
    const defaults: AcademySettings = {
      whatsappNumber: (import.meta as any).env?.VITE_WHATSAPP_NUMBER || '+27821234567',
      admissionsEmail: (import.meta as any).env?.VITE_ACADEMY_EMAIL || 'admissions@techlabs.co.za',
      campusAddress: 'Cape Town, South Africa',
      bankName: 'First National Bank (FNB)',
      accountName: 'Madilotane Design (Pty) Ltd',
      accountNumber: '62899451201',
      branchCode: '250655',
      referenceFormat: 'TLS-ReferenceNumber (e.g. TLS-2026-0089)',
      flashSale: {
        enabled: true,
        title: '⚡ SPECIAL FLASH SALE: 20% OFF ALL COURSES & BOOTCAMP TIERS!',
        discountPercent: 20,
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        targetTiers: ['STARTER', 'PROFESSIONAL', 'CAREER_ACCELERATOR']
      }
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.campusAddress && parsed.campusAddress.includes('Harrington')) {
          parsed.campusAddress = 'Cape Town, South Africa';
        }
        if (parsed.accountName && (parsed.accountName.includes('TechLabs') || parsed.accountName.includes('TechLabs Academy SA'))) {
          parsed.accountName = 'Madilotane Design (Pty) Ltd';
        }
        return { ...defaults, ...parsed };
      } catch {
        return defaults;
      }
    }
    return defaults;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    void hydrateFromApi();
  }, []);

  // Sync to localStorage + backend
  useEffect(() => {
    localStorage.setItem('techlabs_leads', JSON.stringify(leads));
    if (!hasHydrated) return;
    if (!hasPersistedOnceRef.current) {
      hasPersistedOnceRef.current = true;
      return;
    }
    void persistCollection('leads', leads);
  }, [leads, hasHydrated]);

  useEffect(() => {
    localStorage.setItem('techlabs_applications', JSON.stringify(applications));
    if (!hasHydrated) return;
    if (!hasPersistedOnceRef.current) {
      hasPersistedOnceRef.current = true;
      return;
    }
    void persistCollection('applications', applications);
  }, [applications, hasHydrated]);

  useEffect(() => {
    localStorage.setItem('techlabs_cohorts', JSON.stringify(cohorts));
    if (!hasHydrated) return;
    if (!hasPersistedOnceRef.current) {
      hasPersistedOnceRef.current = true;
      return;
    }
    void persistCollection('cohorts', cohorts);
  }, [cohorts, hasHydrated]);

  useEffect(() => {
    localStorage.setItem('techlabs_tickets', JSON.stringify(tickets));
    if (!hasHydrated) return;
    if (!hasPersistedOnceRef.current) {
      hasPersistedOnceRef.current = true;
      return;
    }
    void persistCollection('tickets', tickets);
  }, [tickets, hasHydrated]);

  useEffect(() => {
    localStorage.setItem('techlabs_labs', JSON.stringify(labs));
    if (!hasHydrated) return;
    if (!hasPersistedOnceRef.current) {
      hasPersistedOnceRef.current = true;
      return;
    }
    void persistCollection('labs', labs);
  }, [labs, hasHydrated]);

  useEffect(() => {
    localStorage.setItem('techlabs_invoices', JSON.stringify(invoices));
    if (!hasHydrated) return;
    if (!hasPersistedOnceRef.current) {
      hasPersistedOnceRef.current = true;
      return;
    }
    void persistCollection('invoices', invoices);
  }, [invoices, hasHydrated]);

  useEffect(() => {
    localStorage.setItem('techlabs_attendance', JSON.stringify(attendance));
    if (!hasHydrated) return;
    if (!hasPersistedOnceRef.current) {
      hasPersistedOnceRef.current = true;
      return;
    }
    void persistCollection('attendance', attendance);
  }, [attendance, hasHydrated]);

  useEffect(() => {
    localStorage.setItem('techlabs_course_modules', JSON.stringify(courseModules));
    if (!hasHydrated) return;
    if (!hasPersistedOnceRef.current) {
      hasPersistedOnceRef.current = true;
      return;
    }
    void persistCollection('courseModules', courseModules);
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

  useEffect(() => {
    localStorage.setItem('techlabs_onboarding', JSON.stringify(onboardingSteps));
  }, [onboardingSteps]);

  useEffect(() => {
    localStorage.setItem('techlabs_settings', JSON.stringify(settings));
  }, [settings]);

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
    showToast('success', 'Inquiry Received', 'Thank you! A TechLabs admissions advisor will reach out via WhatsApp / Email shortly.');
  };

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    showToast('info', 'Lead Updated', `Lead status updated to ${status.replace('_', ' ')}`);
  };

  const addLeadNote = (id: string, note: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, notes: [...l.notes, note] } : l));
    showToast('success', 'Note Added', 'Advisor note saved to lead record.');
  };

  const submitApplication = (appData: Omit<Application, 'id' | 'referenceNumber' | 'submissionDate' | 'status'>): string => {
    const seq = applications.length + 90;
    const ref = `TLS-2026-${String(seq).padStart(4, '0')}`;
    const newApp: Application = {
      ...appData,
      id: 'app-' + Date.now(),
      referenceNumber: ref,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'NEW'
    };

    setApplications(prev => [newApp, ...prev]);
    void apiRequest('/applications', {
      method: 'POST',
      body: JSON.stringify(newApp)
    }).catch((error) => {
      console.warn('Application save to backend failed:', error);
    });

    // Also link into Leads CRM
    const newLead: Lead = {
      id: 'lead-' + Date.now(),
      name: `${appData.firstName} ${appData.lastName}`,
      email: appData.email,
      whatsapp: appData.whatsapp,
      source: 'Website',
      courseInterest: `Bootcamp (${appData.selectedTier})`,
      status: 'APPLICATION_SUBMITTED',
      notes: [`Application submitted with ref ${ref}. Laptop: ${appData.laptopBrand} (${appData.ramGB}GB RAM)`],
      followUpDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0]
    };
    setLeads(prev => [newLead, ...prev]);
    void apiRequest('/leads', {
      method: 'POST',
      body: JSON.stringify(newLead)
    }).catch((error) => {
      console.warn('Lead save to backend failed:', error);
    });

    // Create pending invoice with Flash Sale discount consideration
    const total = getTierPrice(appData.selectedTier, settings.flashSale).current;
    const isDeposit = appData.paymentOption === 'DEPOSIT';
    const depositAmt = isDeposit ? 1000 : total;

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: `INV-${ref}`,
      studentName: `${appData.firstName} ${appData.lastName}`,
      studentEmail: appData.email,
      courseTier: appData.selectedTier,
      amountZAR: total,
      depositZAR: depositAmt,
      balanceZAR: total - depositAmt,
      paymentOption: appData.paymentOption || 'DEPOSIT',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      paymentMethod: 'EFT'
    };
    setInvoices(prev => [newInvoice, ...prev]);
    void apiRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify(newInvoice)
    }).catch((error) => {
      console.warn('Invoice save to backend failed:', error);
    });

    // Sign in newly applied student
    const studentUser: User = {
      id: newApp.id,
      name: `${newApp.firstName} ${newApp.lastName}`,
      email: newApp.email,
      role: 'STUDENT',
      whatsapp: newApp.whatsapp,
      cohortId: newApp.cohortId || 'cohort-oct-2026'
    };
    setCurrentRole('STUDENT');
    setCurrentUser(studentUser);

    showToast('success', 'Application Submitted!', `Your reference code is ${ref}. Check your email and WhatsApp for confirmation.`);
    return ref;
  };

  const updateApplicationStatus = (id: string, status: ApplicationStatus, notes?: string) => {
    setApplications(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status,
          adminNotes: notes ? (a.adminNotes ? `${a.adminNotes} | ${notes}` : notes) : a.adminNotes
        };
      }
      return a;
    }));

    showToast('info', 'Application Status Updated', `Application status changed to ${status}`);
  };

  const sendApprovalEmail = async (app: Application, type: 'APPROVED' | 'REJECTED' | 'WAITLISTED'): Promise<boolean> => {
    try {
      const response = await apiRequest<{ ok: boolean; message: string }>('/email/approval', {
        method: 'POST',
        body: JSON.stringify({
          applicantName: `${app.firstName} ${app.lastName}`,
          email: app.email,
          type,
          referenceNumber: app.referenceNumber,
          cohortName: app.cohortId || 'Next available intake'
        })
      });

      if (response.ok) {
        showToast('success', 'Email Sent', `${response.message} to ${app.email}`);
        return true;
      }

      return false;
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
    showToast('success', 'Ticket Submitted for Review', 'Your resolution notes have been sent to Lead Instructor Dave.');
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
    showToast('success', 'Support Ticket Created', `Ticket ${num} published to student queue.`);
  };

  const toggleLabComplete = (labId: string) => {
    setLabs(prev => prev.map(l => l.id === labId ? { ...l, isCompleted: !l.isCompleted } : l));
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

    const selectedInvoice = invoices.find(i => i.id === invoiceId);
    if (selectedInvoice) {
      const app = applications.find(a => a.email.toLowerCase() === selectedInvoice.studentEmail.toLowerCase());
      if (app) {
        updateApplicationStatus(app.id, 'ENROLLED', `Payment recorded via ${paymentMethod}. Outstanding balance: R0.`);
      }
    }

    showToast('success', 'Payment Received', 'Tuition payment recorded in full! Remaining balance: R0.');
  };

  const uploadProofOfPayment = (invoiceId: string, fileName: string) => {
    const popUrl = `/uploads/pop/${fileName}`;
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          proofOfPaymentUrl: popUrl
        };
      }
      return inv;
    }));

    // Update matching application status if applicable
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      const app = applications.find(a => a.email.toLowerCase() === inv.studentEmail.toLowerCase());
      if (app && app.status !== 'ENROLLED') {
        updateApplicationStatus(app.id, 'PAYMENT_REQUIRED', `POP uploaded: ${fileName}`);
      }
    }

    showToast('success', 'Proof of Payment Uploaded', `File ${fileName} attached to invoice and sent to admissions.`);
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
    showToast('success', 'Cohort Created', `${cohortData.name} is now active.`);
  };

  const updateCohort = (id: string, updates: Partial<Cohort>) => {
    setCohorts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    showToast('info', 'Cohort Updated', 'Cohort details were updated successfully.');
  };

  const updateCohortStatus = (id: string, status: Cohort['status']) => {
    setCohorts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    showToast('info', 'Cohort Status Updated', `Cohort status updated to ${status}`);
  };

  const toggleOnboardingStep = (stepId: number) => {
    setOnboardingSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s));
  };

  const onboardingProgressPercent = Math.round(
    (onboardingSteps.filter(s => s.completed).length / onboardingSteps.length) * 100
  );

  const updateSettings = (newSettings: Partial<AcademySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('success', 'Settings Saved', 'Academy configuration updated.');
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
        assessments,
        certificates,
        attendance,
        addLead,
        updateLeadStatus,
        addLeadNote,
        submitApplication,
        updateApplicationStatus,
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
        verifyInvoicePayment,
        settleInvoiceBalance,
        issueCertificate,
        getCertificateByNumber,
        createCohort,
        updateCohort,
        updateCohortStatus,
        onboardingSteps,
        toggleOnboardingStep,
        onboardingProgressPercent,
        settings,
        updateSettings,
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

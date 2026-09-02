import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  COURSE_MODULES, 
  INITIAL_LEADS, 
  INITIAL_APPLICATIONS, 
  INITIAL_INVOICES, 
  INITIAL_ATTENDANCE, 
  INITIAL_ASSESSMENTS, 
  SAMPLE_CERTIFICATE 
} from '../../src/data/mockData';

import type {
  Application,
  AttendanceRecord,
  Certificate,
  Cohort,
  Invoice,
  Lead,
  PracticalLab,
  SupportTicket,
  Assessment,
  User,
  CourseModule,
  EmailDeliveryRecord,
  AcademySettings,
  PaymentRecord,
  StudentCredential,
  AuthTokenRecord,
  SessionRecord,
  PaymentReminderRecord,
  AuditLogRecord,
  StaffAccount,
  AdmissionNote,
  AdmissionTask,
  PaymentInstallment,
} from '../../src/types';
import { DEFAULT_EMAIL_TEMPLATES, type EmailTemplate } from '../services/email-automation';

// Re-export types for use in server code
export type {
  Application,
  AttendanceRecord,
  Certificate,
  Cohort,
  Invoice,
  Lead,
  PracticalLab,
  SupportTicket,
  Assessment,
  User,
  CourseModule,
  EmailDeliveryRecord,
  AcademySettings,
  PaymentRecord,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(process.env.TECHLABS_DB_PATH || path.join(__dirname, 'techlabs.db'));
const DATABASE_PROVIDER = (process.env.DATABASE_PROVIDER || (process.env.DATABASE_URL ? 'postgres' : 'sqlite')).toLowerCase();

if (!['sqlite', 'postgres'].includes(DATABASE_PROVIDER)) {
  throw new Error('DATABASE_PROVIDER must be either "sqlite" or "postgres".');
}

export type TechlabsDatabase = {
  currentUser: User | null;
  currentRole: 'VISITOR' | 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  leads: Lead[];
  applications: Application[];
  cohorts: Cohort[];
  tickets: SupportTicket[];
  labs: PracticalLab[];
  invoices: Invoice[];
  assessments: Assessment[];
  certificates: Certificate[];
  attendance: AttendanceRecord[];
  courseModules: CourseModule[];
  emailDeliveries: EmailDeliveryRecord[];
  academySettings: AcademySettings;
  payments: PaymentRecord[];
  studentCredentials: StudentCredential[];
  authTokens: AuthTokenRecord[];
  sessions: SessionRecord[];
  paymentReminders: PaymentReminderRecord[];
  auditLogs: AuditLogRecord[];
  staffAccounts: StaffAccount[];
  admissionNotes: AdmissionNote[];
  admissionTasks: AdmissionTask[];
  paymentInstallments: PaymentInstallment[];
  emailTemplates: EmailTemplate[];
};

const defaultDatabase: TechlabsDatabase = {
  currentUser: null,
  currentRole: 'VISITOR',
  leads: INITIAL_LEADS,
  applications: INITIAL_APPLICATIONS,
  cohorts: [
    {
      id: 'cohort-oct-2026',
      name: 'October 2026 Intake',
      courseId: 'it-support-bootcamp',
      startDate: '2026-10-10',
      endDate: '2026-12-05',
      scheduleFormat: 'Saturdays (09:00 - 13:00) + Tuesday Evenings (18:30 - 20:30 SAST)',
      deliveryMode: '100% Virtual Learning',
      location: 'Virtual / Online (MS Teams)',
      capacity: 15,
      enrolledCount: 11,
      status: 'Filling Fast',
      earlyBirdCutoff: '2026-09-25',
    },
    {
      id: 'cohort-nov-2026',
      name: 'November 2026 Intake',
      courseId: 'it-support-bootcamp',
      startDate: '2026-11-07',
      endDate: '2027-01-30',
      scheduleFormat: 'Saturdays (09:00 - 13:00) + Thursday Evenings (18:30 - 20:30 SAST)',
      deliveryMode: 'Hybrid (Cape Town Lab + Virtual)',
      location: 'Cape Town, South Africa (Hybrid)',
      capacity: 18,
      enrolledCount: 6,
      status: 'Open',
      earlyBirdCutoff: '2026-10-20',
    },
    {
      id: 'cohort-jan-2027',
      name: 'January 2027 New Year Intake',
      courseId: 'it-support-bootcamp',
      startDate: '2027-01-16',
      endDate: '2027-03-20',
      scheduleFormat: 'Saturdays (09:00 - 14:00 SAST)',
      deliveryMode: '100% Virtual Learning',
      location: 'Virtual / Online (MS Teams)',
      capacity: 20,
      enrolledCount: 2,
      status: 'Open',
      earlyBirdCutoff: '2026-12-15',
    },
  ],
  tickets: [
    {
      id: 'tkt-1001',
      ticketNumber: 'INT-1001',
      priority: 'P1',
      department: 'IT Support',
      companyName: 'Ubuntu Manufacturing (Pty) Ltd',
      requestedBy: 'Mpho Ndlovu',
      device: 'WINDOWS-11-LAPTOP-07',
      issueTitle: 'Users cannot log into Adobe Creative Cloud after MFA reset',
      description: 'User credential prompts keep failing after MFA reset and Adobe Cloud account is forcing reauthentication.',
      systemEnvironment: 'Windows 11 Pro • Adobe Creative Cloud • Entra ID managed device',
      stepsToReproduce: ['Reset MFA for user', 'Attempt to sign in to Adobe Creative Cloud', 'Prompt loops between enterprise login and MFA'],
      troubleshootingGuidance: ['Confirm Microsoft account sync status', 'Verify device compliance in Intune', 'Revoke stale refresh token'],
      expectedFix: 'MFA token refresh and app reauthorization',
      status: 'OPEN',
      assignedStudentId: 'usr-student-01',
      submittedAt: '09:15 SAST',
    },
    {
      id: 'tkt-1002',
      ticketNumber: 'INT-1002',
      priority: 'P2',
      department: 'Active Directory',
      companyName: 'Cape Town Logistics',
      requestedBy: 'Lerato Mokoena',
      device: 'FIN-WS-02',
      issueTitle: 'Finance staff cannot access shared drive after password change',
      description: 'After password reset, user is not granted access to the finance drive due to stale permission mapping.',
      systemEnvironment: 'Windows Server 2022 • AD DS • DFS Share',
      stepsToReproduce: ['Reset user password', 'Log in with new password', 'Attempt to access Finance drive'],
      troubleshootingGuidance: ['Check Group Policy refresh', 'Validate SMB share access', 'Review AD group membership'],
      expectedFix: 'Refresh group membership and reapply share permissions',
      status: 'IN_PROGRESS',
      assignedStudentId: 'usr-student-01',
      submittedAt: '11:40 SAST',
    },
  ],
  labs: [
    {
      id: 'lab-01',
      moduleNumber: 1,
      title: 'Lab 1.1: Hardware Diagnostics & UEFI Review',
      category: 'VMware',
      difficulty: 'Beginner',
      estimatedMinutes: 90,
      architecture: 'CLIENT01 + HOST-OS',
      objectives: ['Review BIOS/UEFI settings', 'Verify virtualization support', 'Confirm hardware compliance'],
      verificationSteps: ['VT-x enabled', 'RAM count validated', 'Secure boot confirmed'],
      isCompleted: true,
    },
    {
      id: 'lab-02',
      moduleNumber: 2,
      title: 'Lab 2.1: VMware Virtual Networking',
      category: 'VMware',
      difficulty: 'Intermediate',
      estimatedMinutes: 120,
      architecture: 'DC01 + CLIENT01 + VMnet2',
      objectives: ['Create isolated VMnets', 'Configure DNS and DHCP', 'Validate connectivity'],
      verificationSteps: ['VMnet2 reachable', 'DNS resolves locally', 'Client joins domain'],
      isCompleted: false,
    },
    {
      id: 'lab-03',
      moduleNumber: 3,
      title: 'Lab 3.1: Windows Server 2022 Hardening',
      category: 'Windows Server',
      difficulty: 'Intermediate',
      estimatedMinutes: 150,
      architecture: 'DC01 + FileServer01',
      objectives: ['Install roles', 'Harden firewall', 'Configure shares'],
      verificationSteps: ['Shares accessible', 'Permissions applied', 'Audit logs available'],
      isCompleted: false,
    },
  ],
  invoices: INITIAL_INVOICES,
  assessments: INITIAL_ASSESSMENTS,
  certificates: [SAMPLE_CERTIFICATE],
  attendance: INITIAL_ATTENDANCE,
  courseModules: COURSE_MODULES,
  emailDeliveries: [],
  academySettings: {
    academyName: 'TechLabs Academy SA',
    companyName: 'Madilotane Design (Pty) Ltd',
    location: 'Cape Town, South Africa',
    campusAddress: 'Cape Town, South Africa',
    whatsappNumber: process.env.PUBLIC_WHATSAPP_NUMBER || '+27000000000',
    studentSupportWhatsappNumber: process.env.PUBLIC_STUDENT_SUPPORT_WHATSAPP_NUMBER || process.env.PUBLIC_WHATSAPP_NUMBER || '+27000000000',
    admissionsEmail: 'admissions@madilotane.co.za',
    bankName: 'Provided on your official invoice',
    accountName: 'Configured by administration',
    accountNumber: 'Contact admissions',
    branchCode: 'Contact admissions',
    referenceFormat: 'TLS-ReferenceNumber',
    leadInstructorName: 'TechLabs Instructor',
    flashSale: {
      enabled: false,
      title: 'Special course offer',
      discountPercent: 20,
      endDate: '',
      targetTiers: ['STARTER', 'PROFESSIONAL', 'CAREER_ACCELERATOR'],
    },
    courseTierPricing: {
      STARTER: { priceZAR: 1999, displayName: 'Starter Tier', description: 'Weekend practical self-paced lab track with comprehensive workbooks and VMware guidance.', features: ['Weekend practical labs', 'Student workbook & architecture diagrams', 'VMware lab guidance & ISO links', 'Practical exercises & helpdesk scripts', 'Certificate of Completion'], badgeLabel: 'Self-paced' },
      PROFESSIONAL: { priceZAR: 3499, displayName: 'Professional Tier', description: 'Full bootcamp with live evening and weekend sessions, enterprise VMware labs, and tickets.', features: ['Full 8-12 week bootcamp', 'Live evening and weekend practical sessions', 'VMware enterprise labs (Server, AD, DNS)', 'Microsoft 365, Entra ID, Intune & Defender', 'PowerShell automation & helpdesk tickets', 'Graded assessments & verified certificate'], badgeLabel: 'Most Popular' },
      CAREER_ACCELERATOR: { priceZAR: 4999, displayName: 'Career Accelerator', description: 'Everything in Professional plus dedicated 1-on-1 career coaching and mock interviews.', features: ['Everything in Professional Tier', 'Technical CV and portfolio review', 'LinkedIn profile optimization', '1-on-1 technical mock interview', 'Job application guidance', 'Priority placement assistance'], badgeLabel: 'Full Support' },
    },
  },
  payments: [],
  studentCredentials: [],
  authTokens: [],
  sessions: [],
  paymentReminders: [],
  auditLogs: [],
  staffAccounts: [],
  admissionNotes: [],
  admissionTasks: [],
  paymentInstallments: [],
  emailTemplates: DEFAULT_EMAIL_TEMPLATES,
};

type CollectionRow = { key: string; value: unknown };

const sqlite = DATABASE_PROVIDER === 'sqlite' ? new Database(DB_PATH) : null;
const postgres = DATABASE_PROVIDER === 'postgres'
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.DATABASE_POOL_SIZE || 10),
    })
  : null;

let initialization: Promise<void> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function initializeStorage(): Promise<void> {
  if (initialization) return initialization;
  initialization = (async () => {
    if (sqlite) {
      sqlite.pragma('journal_mode = WAL');
      sqlite.exec('CREATE TABLE IF NOT EXISTS collections (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    } else {
      if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required when DATABASE_PROVIDER=postgres.');
      await postgres!.query('CREATE TABLE IF NOT EXISTS collections (key TEXT PRIMARY KEY, value JSONB NOT NULL)');
    }

    const existing = await readCollections();
    const seedEntries = Object.entries(defaultDatabase).filter(([key, value]) => {
      const stored = existing[key];
      return stored === undefined || stored === null || (Array.isArray(stored) && stored.length === 0 && Array.isArray(value) && value.length > 0);
    });
    if (seedEntries.length) await writeCollections(seedEntries);
    const templates = existing.emailTemplates as EmailTemplate[] | undefined;
    if (templates) {
      const legacyMarkers: Record<string, string> = {
        'tpl-app-submitted': 'Our admissions team will review your application',
        'tpl-app-approved': "We're excited to inform you that your application has been",
        'tpl-payment-verified': "We're ready to transform your IT career!",
      };
      let changed = false;
      const updated = templates.map(template => {
        const replacement = defaultDatabase.emailTemplates.find(candidate => candidate.id === template.id);
        if (replacement && legacyMarkers[template.id] && template.htmlBody.includes(legacyMarkers[template.id])) {
          changed = true;
          return replacement;
        }
        return template;
      });
      if (changed) await writeCollections([['emailTemplates', updated]]);
    }
    await writeCollections([['currentUser', null], ['currentRole', 'VISITOR']]);
  })();
  return initialization;
}

async function readCollections(): Promise<Record<string, unknown>> {
  const rows: CollectionRow[] = sqlite
    ? (sqlite.prepare('SELECT key, value FROM collections').all() as Array<{ key: string; value: string }>).map(row => ({ key: row.key, value: JSON.parse(row.value) }))
    : (await postgres!.query<CollectionRow>('SELECT key, value FROM collections')).rows;
  return Object.fromEntries(rows.map(row => [row.key, row.value]));
}

async function writeCollections(entries: Array<[string, unknown]>): Promise<void> {
  if (sqlite) {
    const upsert = sqlite.prepare('INSERT INTO collections (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    sqlite.transaction(() => entries.forEach(([key, value]) => upsert.run(key, JSON.stringify(value))))();
    return;
  }
  const client = await postgres!.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of entries) {
      await client.query(
        'INSERT INTO collections (key, value) VALUES ($1, $2::jsonb) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value',
        [key, JSON.stringify(value)],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getDatabase(): Promise<TechlabsDatabase> {
  await initializeStorage();
  const recordMap = await readCollections() as Partial<TechlabsDatabase>;
  const applications = recordMap.applications ?? defaultDatabase.applications;

  return {
    currentUser: null,
    currentRole: 'VISITOR',
    leads: recordMap.leads ?? defaultDatabase.leads,
    applications,
    cohorts: (recordMap.cohorts ?? defaultDatabase.cohorts).map((c: any) => ({
      ...c,
      deliveryMode: c.deliveryMode === 'Cape Town On-Campus' ? '100% Virtual Learning' : c.deliveryMode,
      enrolledCount: applications.filter((application: Application) => application.cohortId === c.id && ['ENROLLED', 'COMPLETED'].includes(application.status)).length,
    })),
    tickets: recordMap.tickets ?? defaultDatabase.tickets,
    labs: recordMap.labs ?? defaultDatabase.labs,
    invoices: (recordMap.invoices ?? defaultDatabase.invoices).map((invoice: Invoice) => ({
      ...invoice,
      paidZAR: invoice.paidZAR ?? (invoice.status === 'VERIFIED' ? Math.max(0, invoice.amountZAR - invoice.balanceZAR) : 0),
      balanceZAR: invoice.paidZAR === undefined && invoice.status === 'PENDING' ? invoice.amountZAR : invoice.balanceZAR,
    })),
    assessments: recordMap.assessments ?? defaultDatabase.assessments,
    certificates: (recordMap.certificates ?? defaultDatabase.certificates).map((certificate: Certificate) => ({ ...certificate, instructorName: /dave|david kitching/i.test(certificate.instructorName) ? 'TechLabs Instructor' : certificate.instructorName })),
    attendance: recordMap.attendance ?? defaultDatabase.attendance,
    courseModules: recordMap.courseModules?.length ? recordMap.courseModules : defaultDatabase.courseModules,
    emailDeliveries: recordMap.emailDeliveries ?? defaultDatabase.emailDeliveries,
    academySettings: recordMap.academySettings ?? defaultDatabase.academySettings,
    payments: recordMap.payments ?? defaultDatabase.payments,
    studentCredentials: recordMap.studentCredentials ?? [],
    authTokens: recordMap.authTokens ?? [],
    sessions: recordMap.sessions ?? [],
    paymentReminders: recordMap.paymentReminders ?? [],
    auditLogs: recordMap.auditLogs ?? [],
    staffAccounts: recordMap.staffAccounts ?? [],
    admissionNotes: recordMap.admissionNotes ?? [],
    admissionTasks: recordMap.admissionTasks ?? [],
    paymentInstallments: recordMap.paymentInstallments ?? [],
    emailTemplates: recordMap.emailTemplates ?? defaultDatabase.emailTemplates,
  };
}

export async function saveDatabase(database: TechlabsDatabase): Promise<void> {
  await initializeStorage();
  const pending = writeQueue.then(() => writeCollections(Object.entries(database)));
  writeQueue = pending.catch(() => undefined);
  await pending;
}

export async function resetDatabase(): Promise<TechlabsDatabase> {
  await initializeStorage();
  if (sqlite) sqlite.prepare('DELETE FROM collections').run();
  else await postgres!.query('DELETE FROM collections');
  const seeded = { ...defaultDatabase };
  await saveDatabase(seeded);
  return seeded;
}

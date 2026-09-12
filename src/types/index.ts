export type Role = 'VISITOR' | 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';

export type ApplicationStatus = 
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PAYMENT_REQUIRED'
  | 'ENROLLED'
  | 'COMPLETED'
  | 'WAITLISTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type LeadStatus = 
  | 'NEW_LEAD'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'APPLICATION_STARTED'
  | 'APPLICATION_SUBMITTED'
  | 'APPROVED'
  | 'PAYMENT_PENDING'
  | 'ENROLLED'
  | 'ACTIVE_STUDENT'
  | 'GRADUATED'
  | 'ALUMNI';

export type LeadSource = 
  | 'Facebook'
  | 'Instagram'
  | 'TikTok'
  | 'LinkedIn'
  | 'Google'
  | 'WhatsApp'
  | 'Referral'
  | 'Website'
  | 'Other';

export type CourseTier = 'STARTER' | 'PROFESSIONAL' | 'CAREER_ACCELERATOR';

export type CourseTierPricing = Record<CourseTier, {
  priceZAR: number;
  displayName?: string;
  description?: string;
  features?: string[];
  badgeLabel?: string;
}>;

export type PaymentOption = 'FULL' | 'DEPOSIT' | 'INSTALLMENTS';

export type PaymentStatus = 'PENDING' | 'AWAITING_VERIFICATION' | 'PARTIALLY_PAID' | 'VERIFIED' | 'FAILED' | 'REFUNDED';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';

export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED' | 'CLOSED';

export interface FlashSaleConfig {
  enabled: boolean;
  title: string;
  discountPercent: number;
  endDate: string;
  showCountdown?: boolean;
  targetTiers?: CourseTier[];
  manuallySet?: boolean;
}

export interface AcademySettings {
  whatsappNumber: string;
  studentSupportWhatsappNumber?: string;
  admissionsEmail: string;
  campusAddress: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  referenceFormat: string;
  academyName?: string;
  location?: string;
  companyName?: string;
  leadInstructorName?: string;
  studentWelcomeMessage?: string;
  studentSupportMessage?: string;
  admissionsAcknowledgement?: string;
  paymentInstructions?: string;
  whatsappGreeting?: string;
  applicationsEnabled?: boolean;
  onlinePaymentsEnabled?: boolean;
  showPricing?: boolean;
  showUpcomingCohorts?: boolean;
  maintenanceMode?: boolean;
  publicAnnouncement?: string;
  defaultLandingPage?: string;
  privacyContactEmail?: string;
  informationOfficerContact?: string;
  privacyPolicyVersion?: string;
  termsVersion?: string;
  consentTextVersion?: string;
  dataRetentionDays?: number;
  cookieNoticeVersion?: string;
  flashSale?: FlashSaleConfig;
  courseTierPricing?: CourseTierPricing;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  whatsapp?: string;
  enrolledCourseId?: string;
  cohortId?: string;
}

export interface StudentCredential {
  applicationId: string;
  email: string;
  passwordHash?: string;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuthTokenPurpose = 'SETUP' | 'VERIFY_EMAIL' | 'RESET_PASSWORD' | 'MAGIC_LOGIN';

export interface AuthTokenRecord {
  id: string;
  applicationId: string;
  tokenHash: string;
  purpose: AuthTokenPurpose;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
}

export interface SessionRecord {
  id: string;
  tokenHash: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  userId: string;
  email: string;
  expiresAt: string;
  createdAt: string;
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'INSTRUCTOR';
  passwordHash: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface EmailDeliveryRecord {
  id: string;
  providerId?: string;
  recipient: string;
  subject: string;
  category: 'APPLICATION_SUBMITTED' | 'APPLICATION_STATUS';
  status: 'SENT' | 'DELIVERED' | 'BOUNCED' | 'SUPPRESSED' | 'COMPLAINED' | 'FAILED';
  reason?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  source: LeadSource;
  courseInterest: string;
  status: LeadStatus;
  notes: string[];
  followUpDate: string;
  createdAt: string;
}

export interface Application {
  id: string;
  referenceNumber: string; // e.g. TLS-2026-0001
  // Step 1: Personal
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  city: string;
  province: string;
  // Step 2: IT Background
  highestQualification: string;
  itExperienceYears: string;
  currentEmploymentStatus: string;
  currentRole: string;
  technologiesKnown: string[];
  // Step 3: Laptop
  laptopBrand: string;
  cpu: string;
  ramGB: number;
  storageType: string;
  freeStorageGB: number;
  os: string;
  hasVirtualizationEnabled: boolean;
  isLaptopCompliant: boolean;
  // Step 4: Course
  selectedTier: CourseTier;
  // Step 5: Intake
  cohortId: string;
  // Step 6: Consent
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  marketingConsent: boolean;
  // Metadata
  status: ApplicationStatus;
  submissionDate: string;
  adminNotes?: string;
  paymentOption?: PaymentOption;
  paymentRemindersPaused?: boolean;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffEmail?: string;
}

export interface AdmissionNote {
  id: string;
  applicationId: string;
  body: string;
  authorEmail: string;
  createdAt: string;
}

export interface AdmissionTask {
  id: string;
  applicationId: string;
  title: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'COMPLETED';
  assignedStaffId: string;
  assignedStaffName: string;
  assignedStaffEmail: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
}

export type PaymentReminderType = 'DEPOSIT_DUE_SOON' | 'DEPOSIT_OVERDUE' | 'BALANCE_BEFORE_WEEK_4' | 'INSTALLMENT_DUE_SOON' | 'INSTALLMENT_OVERDUE';

export interface PaymentReminderRecord {
  id: string;
  applicationId: string;
  invoiceId: string;
  type: PaymentReminderType;
  sentAt: string;
  providerId?: string;
  installmentId?: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actorEmail: string;
  entityType: string;
  entityId: string;
  summary: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  ipAddress?: string;
  createdAt: string;
}

export interface StudentTimelineEvent {
  id: string;
  occurredAt: string;
  category: 'APPLICATION' | 'HARDWARE' | 'EMAIL' | 'INVOICE' | 'PAYMENT' | 'ENROLLMENT' | 'ATTENDANCE' | 'ASSESSMENT' | 'NOTE';
  title: string;
  detail: string;
  status?: string;
  actorEmail?: string;
}

export interface Cohort {
  id: string;
  name: string; // e.g. "October 2026 Intake"
  courseId: string;
  startDate: string;
  endDate: string;
  scheduleFormat: string; // e.g. "Saturday (09:00 - 13:00) + Tuesday (18:30 - 20:30)"
  deliveryMode: '100% Virtual Learning' | 'Hybrid (Cape Town Lab + Virtual)';
  location: string;
  teamsChannelUrl?: string;
  capacity: number;
  enrolledCount: number;
  status: 'Open' | 'Filling Fast' | 'Closed' | 'In Progress' | 'Completed';
  earlyBirdCutoff?: string;
}

export interface CourseModule {
  number: number;
  title: string;
  duration: string;
  summary: string;
  learningOutcomes: string[];
  practicalLabs: string[];
  exampleTickets: string[];
  technologies: string[];
  startDate?: string;
  published?: boolean;
}

export interface PracticalLab {
  id: string;
  moduleNumber: number;
  title: string;
  category: 'VMware' | 'Windows Server' | 'Active Directory' | 'Microsoft 365' | 'Entra ID' | 'Intune' | 'Defender' | 'PowerShell' | 'Networking';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  architecture: string; // e.g. "DC01 + CLIENT01"
  objectives: string[];
  brokenScenario?: string;
  verificationSteps: string[];
  isCompleted?: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g. "INT-1042"
  priority: TicketPriority;
  department: string;
  companyName: string; // Ubuntu Manufacturing (Pty) Ltd
  requestedBy: string;
  device: string;
  issueTitle: string;
  description: string;
  systemEnvironment: string;
  stepsToReproduce: string[];
  troubleshootingGuidance: string[];
  expectedFix: string;
  status: TicketStatus;
  assignedStudentId?: string;
  studentResolutionNotes?: string;
  studentRootCause?: string;
  instructorFeedback?: string;
  gradeScore?: number; // 0 - 100
  submittedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  cohortId: string;
  sessionDate: string;
  sessionTopic: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  checkInTime?: string;
  qrCode?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-TLS-2026-081"
  invoiceDate?: string;
  studentName: string;
  studentEmail: string;
  courseTier: CourseTier;
  amountZAR: number;
  listPriceZAR?: number;
  discountZAR?: number;
  discountPercent?: number;
  paidZAR?: number;
  depositZAR: number;
  balanceZAR: number;
  paymentOption: PaymentOption;
  status: PaymentStatus;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: 'EFT' | 'Yoco' | 'PayFast' | 'Card';
  proofOfPaymentUrl?: string;
}

export interface PaymentInstallment {
  id: string;
  invoiceId: string;
  sequence: number;
  label: string;
  amountZAR: number;
  paidZAR: number;
  dueDate: string;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  paidAt?: string;
  createdAt: string;
}

export interface PaymentRecord {
  provider?: 'EFT' | 'YOCO';
  mode?: 'test' | 'live';
  id: string;
  invoiceId: string;
  studentId: string;
  amountZAR: number;
  type: 'DEPOSIT' | 'BALANCE';
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  originalFileName?: string;
  storageKey?: string;
  mimeType?: 'application/pdf' | 'image/jpeg' | 'image/png';
  sizeBytes?: number;
  sha256?: string;
  eftReference: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface Assessment {
  id: string;
  studentId?: string;
  title: string;
  moduleNumber: number;
  type: 'Practical Lab Fix' | 'Scenario Simulation' | 'Troubleshooting Documentation';
  totalMarks: number;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Graded';
  studentScore?: number;
  feedback?: string;
  instructions: string;
}

export interface Certificate {
  id: string;
  studentId?: string;
  certificateNumber: string; // e.g. "TLS-2026-00124"
  studentName: string;
  courseName: string;
  completionDate: string;
  instructorName: string;
  verificationUrl: string;
  gradeDistinction?: string;
  qrCodeData: string;
  skillsAcquired: string[];
}

export interface LearningResource {
  id: string;
  title: string;
  category: 'Cheatsheet' | 'PowerShell Script' | 'Lab Architecture' | 'GPO Template' | 'Checklist' | 'Guide';
  fileSize: string;
  description: string;
  downloadUrl: string;
}

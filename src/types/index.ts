export type Role = 'VISITOR' | 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';

export type ApplicationStatus = 
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PAYMENT_REQUIRED'
  | 'ENROLLED'
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

export type PaymentOption = 'FULL' | 'DEPOSIT' | 'INSTALLMENTS';

export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';

export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED' | 'CLOSED';

export type VirtualSessionStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export type LearningDeliveryMode = 'VIRTUAL' | 'HYBRID';

export type SessionPlatform = 'TEAMS' | 'ZOOM' | 'GOOGLE_MEET' | 'GENERIC_LINK';

export interface FlashSaleConfig {
  enabled: boolean;
  title: string;
  discountPercent: number;
  endDate: string;
  targetTiers?: CourseTier[];
  manuallySet?: boolean;
}

export interface AcademySettings {
  whatsappNumber: string;
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
  flashSale?: FlashSaleConfig;
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
  studentName: string;
  studentEmail: string;
  courseTier: CourseTier;
  amountZAR: number;
  depositZAR: number;
  balanceZAR: number;
  paymentOption: PaymentOption;
  status: PaymentStatus;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: 'EFT' | 'Yoco' | 'PayFast' | 'Card';
  proofOfPaymentUrl?: string;
}

export interface Assessment {
  id: string;
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

export interface VirtualSession {
  id: string;
  cohortId: string;
  sessionNumber: number; // Session 1, 2, 3, etc.
  topic: string; // e.g. "Active Directory Fundamentals"
  moduleNumber?: number; // Link to course module
  status: VirtualSessionStatus;
  scheduledDate: string; // ISO date
  scheduledStartTime: string; // HH:MM (24-hour)
  scheduledEndTime: string; // HH:MM (24-hour)
  platform: SessionPlatform;
  meetingLink: string; // Teams/Zoom/Google Meet URL
  meetingId?: string; // For Teams: meeting ID
  passcode?: string; // For Zoom: meeting passcode
  recordingUrl?: string; // Link to recording after session
  instructorId: string;
  instructorName: string;
  description: string;
  agenda: string[]; // Array of topics to cover
  createdAt: string;
  updatedAt: string;
}

export interface SessionAttendance {
  id: string;
  sessionId: string;
  cohortId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  joinedAt?: string; // ISO timestamp when student joined
  leftAt?: string; // ISO timestamp when student left
  attendanceStatus: AttendanceStatus;
  durationMinutes?: number; // How long they attended
  notes?: string;
  recordedAt: string;
}

export interface VirtualLearningSettings {
  id: string;
  cohortId: string;
  deliveryMode: LearningDeliveryMode;
  defaultPlatform: SessionPlatform;
  recordSessions: boolean;
  requireCameraForAttendance: boolean;
  autoMarkAttendance: boolean; // Auto-mark present if joined meeting
  attendanceThreshold: number; // Percentage required for completion
  enableChat: boolean;
  enableScreenShare: boolean;
  enableRecording: boolean;
  sessionNotificationMinutes: number; // Send reminder X mins before
  createdAt: string;
  updatedAt: string;
}


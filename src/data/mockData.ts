import {
  Cohort,
  CourseModule,
  PracticalLab,
  SupportTicket,
  Lead,
  Application,
  Invoice,
  Assessment,
  Certificate,
  LearningResource,
  User,
  AttendanceRecord
} from '../types';

export const CURRENT_USER_STUDENT: User = {
  id: 'usr-student-01',
  name: 'Bongani Dlamini',
  email: 'bongani.dlamini@gmail.com',
  role: 'STUDENT',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  whatsapp: '+27 83 456 7890',
  enrolledCourseId: 'it-support-bootcamp',
  cohortId: 'cohort-oct-2026'
};

export const CURRENT_USER_ADMIN: User = {
  id: 'usr-admin-01',
  name: 'TechLabs Administrator',
  email: 'admin@techlabs.co.za',
  role: 'ADMIN',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  whatsapp: '+27 82 123 4567'
};

export const COHORTS: Cohort[] = [
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
    earlyBirdCutoff: '2026-09-25'
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
    earlyBirdCutoff: '2026-10-20'
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
    earlyBirdCutoff: '2026-12-15'
  }
];

export const COURSE_MODULES: CourseModule[] = [
  {
    number: 1,
    title: 'IT Support Foundations & Architecture',
    duration: 'Week 1',
    summary: 'Hardware architecture, system bus, storage types, OS internals, BIOS/UEFI, client hardware troubleshooting, and the professional IT support mindset.',
    learningOutcomes: [
      'Understand enterprise PC hardware, RAM types, SSD NVMe protocols and bus speeds',
      'Configure UEFI/BIOS secure boot, TPM 2.0 chips, and hardware virtualization (VT-x/AMD-V)',
      'Master structured troubleshooting methodologies (OSI model, isolate variables, root cause analysis)'
    ],
    practicalLabs: [
      'Lab 1.1: Hardware diagnostics and UEFI TPM configuration',
      'Lab 1.2: Host virtualization setup and host resource allocation'
    ],
    exampleTickets: [
      'HD-1002: User reports machine fails to POST after RAM upgrade',
      'HD-1005: Random blue screens (BSOD) during high thermal load'
    ],
    technologies: ['PC Architecture', 'UEFI/BIOS', 'TPM 2.0', 'Hardware Diagnostics']
  },
  {
    number: 2,
    title: 'VMware Workstation & Virtualization',
    duration: 'Week 2',
    summary: 'Building your isolated enterprise sandbox. Creating virtual switches, host-only vs NAT vs Bridged networks, cloning, snapshots, and resource quotas.',
    learningOutcomes: [
      'Deploy VMware Workstation Pro with isolated VMnet segments',
      'Architect custom subnetting for private enterprise domain vs WAN uplink',
      'Manage VM snapshots, differentials, and rapid disaster-recovery rollback'
    ],
    practicalLabs: [
      'Lab 2.1: VMware custom virtual network editor setup (VMnet2 Private Domain)',
      'Lab 2.2: Base Windows Server 2022 and Windows 11 sysprep master templates'
    ],
    exampleTickets: [
      'VM-101: Virtual network bridge loop causing DHCP collision on host',
      'VM-104: Hypervisor snapshot chain corruption and recovery'
    ],
    technologies: ['VMware Workstation', 'Hyper-V', 'Virtual Switching', 'Sysprep']
  },
  {
    number: 3,
    title: 'Windows Server 2022 Administration',
    duration: 'Week 3',
    summary: 'Installing, configuring and hardening Windows Server 2022 Core and Desktop Experience. Storage pools, file servers, NTFS vs share permissions.',
    learningOutcomes: [
      'Install Windows Server 2022 with static enterprise IP configuration and naming standards',
      'Configure Windows Firewall advanced rules, remote management (WinRM), and Server Manager',
      'Implement tiered NTFS security and SMB file shares with Access-Based Enumeration (ABE)'
    ],
    practicalLabs: [
      'Lab 3.1: Server 2022 post-install hardening and role configuration',
      'Lab 3.2: Multi-tier departmental file repository (Finance, HR, Execs)'
    ],
    exampleTickets: [
      'FS-201: Payroll folder permissions leaking to general staff group',
      'FS-204: Shadow Copies failing on primary Volume D:'
    ],
    technologies: ['Windows Server 2022', 'NTFS Security', 'SMB 3.0', 'Server Manager']
  },
  {
    number: 4,
    title: 'Active Directory Domain Services (AD DS)',
    duration: 'Week 4',
    summary: 'Promoting the Domain Controller (DC01), forest functional levels, Organizational Unit (OU) structure, user lifecycle management, and security groups.',
    learningOutcomes: [
      'Promote DC01 for the domain: ad.ubuntu-mfg.co.za',
      'Architect enterprise OU hierarchies (Executive, Finance, HR, Sales, IT, Tier-0 Admins)',
      'Create security vs distribution groups, nested group strategy (AGDLP)'
    ],
    practicalLabs: [
      'Lab 4.1: DC01 promotion and Active Directory Schema verification',
      'Lab 4.2: Enterprise OU provisioning and automated bulk user onboarding'
    ],
    exampleTickets: [
      'AD-301: New finance contractor cannot access departmental folders',
      'AD-305: Account lockout storm caused by stale service credential'
    ],
    technologies: ['Active Directory', 'Domain Controller', 'AGDLP Security', 'RSAT']
  },
  {
    number: 5,
    title: 'Enterprise DNS & DHCP Infrastructure',
    duration: 'Week 5',
    summary: 'The lifeblood of enterprise networking. Forward/Reverse lookup zones, SRV records, Dynamic DNS registration, DHCP scopes, reservations, and failover.',
    learningOutcomes: [
      'Configure AD-integrated DNS forward lookup zones and root hints',
      'Diagnose broken SRV records preventing domain joins using nslookup and PowerShell',
      'Deploy DHCP scopes, lease durations, exclusions, and router/DNS option tags'
    ],
    practicalLabs: [
      'Lab 5.1: DNS zone creation, forwarders, and scavenging configuration',
      'Lab 5.2: DHCP scope activation and MAC-address static reservations'
    ],
    exampleTickets: [
      'NET-402: Workstations picking up rogue DHCP addresses on 192.168.1.x',
      'DNS-1099: Unable to join computer to domain due to DNS SRV resolution failure'
    ],
    technologies: ['DNS Zones', 'SRV Records', 'DHCP Failover', 'Wireshark']
  },
  {
    number: 6,
    title: 'Group Policy Objects (GPO) Mastery',
    duration: 'Week 6',
    summary: 'Centralized enterprise management. Mapping network drives, deploying printers, enforcing BitLocker, password policies, and troubleshooting gpupdate /force.',
    learningOutcomes: [
      'Author and link GPOs for Default Domain Policy, Desktop Restrictions, and Drive Maps',
      'Use GPO WMI filtering, Security Filtering, and Loopback processing',
      'Run Group Policy Results Wizard (gpresult /h) to diagnose GPO precedence conflicts'
    ],
    practicalLabs: [
      'Lab 6.1: Departmental automatic network drive mapping via GPO Preferences',
      'Lab 6.2: BitLocker escrow to Active Directory and USB restriction policy'
    ],
    exampleTickets: [
      'GPO-5014: Shared network drive Z: missing for Sales team members',
      'GPO-5018: Password complexity policy failing to enforce on branch OU'
    ],
    technologies: ['Group Policy (GPMC)', 'GPO Preferences', 'WMI Filters', 'gpresult']
  },
  {
    number: 7,
    title: 'Windows 11 Enterprise Administration',
    duration: 'Week 7',
    summary: 'Client machine joining, local admin controls (LAPS), Event Viewer triage, Performance Monitor, Task Scheduler, registry keys, and remote desktop.',
    learningOutcomes: [
      'Join CLIENT01 and CLIENT02 to ad.ubuntu-mfg.co.za with proper hostname conventions',
      'Deploy Windows LAPS (Local Administrator Password Solution) for credential protection',
      'Analyze Event Viewer Windows Logs (System, Application, Security) for error IDs'
    ],
    practicalLabs: [
      'Lab 7.1: Domain joining, profile migration, and RSAT workstation setup',
      'Lab 7.2: Windows Event Viewer triage and BSOD memory dump inspection'
    ],
    exampleTickets: [
      'WIN-3012: BitLocker recovery prompt on startup after BIOS firmware update',
      'WIN-3015: High disk usage and corrupted Windows Update cache'
    ],
    technologies: ['Windows 11 Enterprise', 'Event Viewer', 'Windows LAPS', 'Sysinternals']
  },
  {
    number: 8,
    title: 'Microsoft 365 Tenant Administration',
    duration: 'Week 8',
    summary: 'Cloud administration in Microsoft 365 admin center. User licensing, Exchange Online mailboxes, shared mailboxes, aliases, and distribution groups.',
    learningOutcomes: [
      'Navigate Microsoft 365 Admin Center and manage Business Premium licenses',
      'Configure Exchange Online mail routing, spam filter policies, and DKIM/SPF',
      'Provision shared mailboxes, assign Send-As / Full Access permissions, and mail forwarding'
    ],
    practicalLabs: [
      'Lab 8.1: M365 tenant user lifecycle and license assignment',
      'Lab 8.2: Exchange Online shared mailbox delegation and transport rules'
    ],
    exampleTickets: [
      'HD-2031: Outlook disconnected from Exchange Online after password reset',
      'M365-4011: Executive executive email spoofing attempt and SPF quarantine'
    ],
    technologies: ['Microsoft 365 Admin', 'Exchange Online', 'Shared Mailboxes', 'DKIM/SPF']
  },
  {
    number: 9,
    title: 'Microsoft Entra ID (Azure AD) & Identity',
    duration: 'Week 9',
    summary: 'Modern cloud identity. Entra ID users, dynamic groups, Self-Service Password Reset (SSPR), Multi-Factor Authentication (MFA), and Conditional Access.',
    learningOutcomes: [
      'Manage Entra ID directory objects, guest invitations, and role assignments',
      'Enforce Conditional Access policies (Require MFA from untrusted networks)',
      'Configure SSPR and troubleshoot Microsoft Authenticator registration issues'
    ],
    practicalLabs: [
      'Lab 9.1: Entra ID Conditional Access policy creation and What-If tool testing',
      'Lab 9.2: MFA enforcement and risky user remediation'
    ],
    exampleTickets: [
      'ENT-901: Finance user blocked by Conditional Access outside South Africa',
      'ENT-905: User lost phone and cannot pass Microsoft Authenticator MFA'
    ],
    technologies: ['Microsoft Entra ID', 'Conditional Access', 'MFA', 'SSPR']
  },
  {
    number: 10,
    title: 'Microsoft Intune (Endpoint Management)',
    duration: 'Week 10',
    summary: 'Modern cloud device management. Windows Autopilot basics, Intune MDM enrollment, Compliance Policies, Configuration Profiles, and app deployment.',
    learningOutcomes: [
      'Enroll Windows 11 endpoints into Microsoft Intune via Company Portal',
      'Create and deploy device compliance policies (BitLocker, Antivirus, OS version)',
      'Deploy enterprise software (Microsoft 365 Apps, Edge, Chrome) via Company Portal'
    ],
    practicalLabs: [
      'Lab 10.1: Intune Windows enrollment and device category tagging',
      'Lab 10.2: Intune compliance policy authoring and remote wipe/sync testing'
    ],
    exampleTickets: [
      'INT-1042: My laptop says it is not compliant and I cannot access company resources',
      'INT-1048: Company Portal application deployment fails with error code 0x87D1041C'
    ],
    technologies: ['Microsoft Intune', 'Company Portal', 'Compliance Policies', 'MDM']
  },
  {
    number: 11,
    title: 'Microsoft Defender for Endpoint & Security',
    duration: 'Week 11',
    summary: 'Endpoint security and threat management. Defender antivirus rules, Attack Surface Reduction (ASR), threat alerts, isolating compromised devices.',
    learningOutcomes: [
      'Onboard Windows 11 endpoints to Microsoft Defender for Endpoint',
      'Investigate alerts in Microsoft Defender Security Center (XDR)',
      'Perform live device isolation, automated investigation, and file quarantine'
    ],
    practicalLabs: [
      'Lab 11.1: Defender for Endpoint onboarding script execution and test alert',
      'Lab 11.2: Investigating suspicious PowerShell payload and remediation'
    ],
    exampleTickets: [
      'M365-4021: Defender for Endpoint alert: Suspicious PowerShell process execution',
      'SEC-1102: Malicious macro attachment quarantined on HR workstation'
    ],
    technologies: ['Microsoft Defender XDR', 'ASR Rules', 'Threat Hunting', 'Endpoint Isolation']
  },
  {
    number: 12,
    title: 'PowerShell for IT Support Technicians',
    duration: 'Week 12',
    summary: 'Automating real-world tasks. Cmdlets, pipelines, ActiveDirectory module, Microsoft Graph PowerShell SDK, bulk onboarding, and log parsing scripts.',
    learningOutcomes: [
      'Write PowerShell scripts using Get-ADUser, Set-ADUser, New-ADUser with CSV import',
      'Connect to Microsoft Graph PowerShell SDK and query Entra ID / Intune devices',
      'Create diagnostic one-liners (Test-NetConnection, Get-Service, Restart-Service)'
    ],
    practicalLabs: [
      'Lab 12.1: Bulk user creation and group assignment script from CSV dataset',
      'Lab 12.2: Automated workstation health check and network diagnostic script'
    ],
    exampleTickets: [
      'PS-1201: Helpdesk manager requests script to audit inactive AD accounts (>90 days)',
      'PS-1204: Reset passwords and force MFA re-registration for 25 compromised users'
    ],
    technologies: ['PowerShell 7', 'Microsoft Graph SDK', 'ActiveDirectory Module', 'Scripting']
  },
  {
    number: 13,
    title: 'Enterprise Troubleshooting & Root Cause Analysis',
    duration: 'Week 13',
    summary: 'Advanced multi-tier incidents. The "Broken Environment" phase: students receive intentionally crippled environments and must systematically restore them.',
    learningOutcomes: [
      'Methodically isolate whether a fault is Layer 1 (Physical/VM), Layer 3 (IP), Layer 7 (Application), or Identity/Authentication',
      'Formulate hypothesis, test non-destructively, implement fix, verify, and write RCA',
      'Document professional technical incident reports for IT management'
    ],
    practicalLabs: [
      'Lab 13.1: "The Blackout Lab" - Crippled domain controller, DNS corruption, and broken trust',
      'Lab 13.2: Corporate wireless certificate and 802.1X authentication outage'
    ],
    exampleTickets: [
      'INC-1301: The trust relationship between this workstation and the primary domain failed',
      'INC-1304: Half the office cannot browse external websites while internal ERP works'
    ],
    technologies: ['Root Cause Analysis', 'Packet Inspection', 'Domain Trust Repair', 'RCA Reports']
  },
  {
    number: 14,
    title: 'Helpdesk & Ticket Lifecycle Management',
    duration: 'Week 14',
    summary: 'ITIL foundations, SLAs, priority matrix (P1-P4), customer communication standards, ticketing software operation, and knowledge base authoring.',
    learningOutcomes: [
      'Manage ticket lifecycle from Inception -> Triage -> Work In Progress -> Resolved -> Closed',
      'Adhere to SLA response and resolution times for mission-critical enterprise incidents',
      'Draft clear, empathetic customer-facing notes and detailed internal technical work logs'
    ],
    practicalLabs: [
      'Lab 14.1: Simulated high-volume helpdesk queue sprint (5 tickets in 45 minutes)',
      'Lab 14.2: Authoring a standardized Knowledge Base (KB) article for new IT hires'
    ],
    exampleTickets: [
      'TICK-1401: VIP Executive unable to present in board meeting (P1 SLA 15 min)',
      'TICK-1405: Software deployment request for licensed CAD software'
    ],
    technologies: ['ITIL Framework', 'Ticketing Systems', 'SLA Management', 'Technical Writing']
  },
  {
    number: 15,
    title: 'Capstone Practical Examination & Final Portfolio',
    duration: 'Week 15',
    summary: 'Comprehensive hands-on final exam. You are handed an enterprise lab with 5 critical incidents and 2 hours to resolve, verify, and present your documentation.',
    learningOutcomes: [
      'Demonstrate complete independence across VMware, Server, AD, DNS, Intune, and Defender',
      'Pass the strict 5-incident live troubleshooting audit with 80%+ benchmark',
      'Compile your verified TechLabs Practical Portfolio to showcase to hiring managers'
    ],
    practicalLabs: [
      'Lab 15.1: Final 120-minute Live Disaster-Recovery & Helpdesk Practical Exam',
      'Lab 15.2: Portfolio compilation and certificate verification generation'
    ],
    exampleTickets: [
      'FINAL-01: Domain Controller replication lockup & DNS pointer failure',
      'FINAL-02: Intune BitLocker compliance lock on Executive laptop'
    ],
    technologies: ['Full Stack IT Support', 'Portfolio Defense', 'Capstone Audit', 'Certification']
  }
];

export const PRACTICAL_LABS: PracticalLab[] = [
  {
    id: 'lab-vmware-01',
    moduleNumber: 2,
    title: 'VMware Enterprise Virtual Lab Deployment',
    category: 'VMware',
    difficulty: 'Beginner',
    estimatedMinutes: 60,
    architecture: 'Host Machine + VMnet2 Isolated Subnet (10.0.10.0/24)',
    objectives: [
      'Create custom VMnet2 switch in VMware Network Editor',
      'Disable host DHCP on VMnet2 so our Windows Server will handle DHCP',
      'Deploy Windows Server 2022 and Windows 11 VM templates with 4GB/2GB allocations'
    ],
    brokenScenario: 'Host DHCP conflicts with Server DHCP causing IP lease chaos.',
    verificationSteps: [
      'Verify VMnet2 only allows traffic between guest VMs',
      'Confirm ping connectivity between DC01 and CLIENT01 on static IP subnet'
    ],
    isCompleted: true
  },
  {
    id: 'lab-ad-01',
    moduleNumber: 4,
    title: 'Promote DC01 & Build Ubuntu Manufacturing OU Tree',
    category: 'Active Directory',
    difficulty: 'Intermediate',
    estimatedMinutes: 75,
    architecture: 'DC01 (Windows Server 2022) -> ad.ubuntu-mfg.co.za',
    objectives: [
      'Install Active Directory Domain Services role on DC01',
      'Promote server to root Domain Controller for ad.ubuntu-mfg.co.za',
      'Create OU hierarchy: [Ubuntu-Manufacturing] -> [Departments] -> [Executive, Finance, HR, IT, Sales]'
    ],
    brokenScenario: 'DNS forwarders incorrectly configured causing domain promotion timeout.',
    verificationSteps: [
      'Run dcdiag /v /test:dns to ensure 0 critical errors',
      'Inspect Active Directory Users and Computers console for all 5 OUs'
    ],
    isCompleted: true
  },
  {
    id: 'lab-intune-01',
    moduleNumber: 10,
    title: 'Intune Compliance Policy & Conditional Access Enforcement',
    category: 'Intune',
    difficulty: 'Advanced',
    estimatedMinutes: 90,
    architecture: 'CLIENT01 (Win11) <-> Microsoft Intune Tenant + Entra ID',
    objectives: [
      'Create "Ubuntu-Win11-Corporate-Compliance" policy requiring BitLocker, Firewall, and AV',
      'Enroll CLIENT01 via Company Portal into Intune MDM',
      'Test Conditional Access block when BitLocker is temporarily disabled'
    ],
    brokenScenario: 'Device marked non-compliant due to missing BitLocker escrow key.',
    verificationSteps: [
      'Check Intune portal shows Device status = Compliant',
      'Verify Entra ID Conditional Access allows Outlook login only when Compliant'
    ],
    isCompleted: false
  },
  {
    id: 'lab-defender-01',
    moduleNumber: 11,
    title: 'Defender for Endpoint Live Incident Triage',
    category: 'Defender',
    difficulty: 'Advanced',
    estimatedMinutes: 60,
    architecture: 'ADMIN01 -> Microsoft 365 Defender Security Portal',
    objectives: [
      'Onboard workstation to Microsoft Defender for Endpoint',
      'Simulate fileless suspicious PowerShell payload execution',
      'Isolate device from network, pull memory dump, and analyze process tree in Defender console'
    ],
    brokenScenario: 'Malicious payload attempting privilege escalation in %temp% folder.',
    verificationSteps: [
      'Defender incident status changed to Remediated',
      'Workstation released from isolation with verified clean health status'
    ],
    isCompleted: false
  }
];

export const REAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1042',
    ticketNumber: 'INT-1042',
    priority: 'P2',
    department: 'Finance',
    companyName: 'Ubuntu Manufacturing (Pty) Ltd',
    requestedBy: 'Bongani Dlamini (Senior Financial Accountant)',
    device: 'FIN-LAPTOP-04 (Dell Latitude 5430 - Win 11)',
    issueTitle: 'My laptop says it is not compliant and I cannot access company resources.',
    description: 'Hi IT Support. I came into the Foreshore office this morning and opened Outlook and our SAP Financials portal. A red banner popped up saying "Your device does not meet the security requirements set by Ubuntu Manufacturing." I cannot approve today\'s supplier payment run. Please assist urgently!',
    systemEnvironment: 'Microsoft Intune / Microsoft Entra ID / Conditional Access / Windows 11 Enterprise',
    stepsToReproduce: [
      'User logs in to FIN-LAPTOP-04 with corporate account (bdlamini@ubuntu-mfg.co.za)',
      'Attempts to open Microsoft 365 Outlook or company SharePoint Finance hub',
      'Entra ID Conditional Access blocks sign-in with error "Device is marked Non-Compliant in Microsoft Intune"',
      'Company Portal app displays: "BitLocker Drive Encryption is turned off or not registered"'
    ],
    troubleshootingGuidance: [
      'Step 1: Check Intune Device status under Devices -> Windows -> FIN-LAPTOP-04 -> Device compliance',
      'Step 2: Note which setting failed (BitLocker encryption policy)',
      'Step 3: Log in as local admin, check manage-bde -status',
      'Step 4: Enable BitLocker, escrow recovery key to Entra ID, trigger manual sync in Company Portal',
      'Step 5: Confirm compliance status flips to Green and user access is restored'
    ],
    expectedFix: 'Enable BitLocker on OS drive C:, back up key to Entra ID, trigger Intune device sync, verify compliance passes, and update ticket with root cause.',
    status: 'IN_PROGRESS',
    assignedStudentId: 'usr-student-01',
    studentRootCause: 'BitLocker was disabled during a recent motherboard BIOS reset at a third-party repair depot.',
    studentResolutionNotes: 'Ran manage-bde -on C: -RecoveryPassword. Verified key escrowed in Entra ID admin center. Forced Company Portal sync. Device returned to Compliant status within 4 minutes. Tested user login to Outlook and SAP. Confirmed successful.',
    instructorFeedback: 'Excellent investigation. Clear verification of Entra ID escrow before closing ticket.',
    gradeScore: 95,
    submittedAt: '2026-08-28 14:30'
  },
  {
    id: 'tkt-2031',
    ticketNumber: 'HD-2031',
    priority: 'P2',
    department: 'Human Resources',
    companyName: 'Ubuntu Manufacturing (Pty) Ltd',
    requestedBy: 'Thabo Mokoena (HR Manager)',
    device: 'HR-LAPTOP-02 (Lenovo ThinkPad T14 - Win 11)',
    issueTitle: 'Outlook disconnected from Microsoft 365 Exchange after password change.',
    description: 'Good day. I changed my Active Directory domain password yesterday as prompted. Now my desktop Outlook says "Disconnected" and keeps popping up a credential prompt that refuses my new password. Teams is working, but Outlook is completely stuck.',
    systemEnvironment: 'Hybrid Exchange / Microsoft 365 Apps / Windows Credential Manager',
    stepsToReproduce: [
      'User changed domain password on Windows login screen',
      'Outlook desktop client remains in "Disconnected" or "Need Password" state',
      'Windows Credential Manager holds stale cached OAuth token for smolefe/tmokoena'
    ],
    troubleshootingGuidance: [
      'Check Windows Credential Manager -> Windows Credentials',
      'Look for cached Generic Credentials starting with "MicrosoftOffice16_Data:ADAL:" or "SSO"',
      'Clear stale credentials, restart Outlook, enter modern authentication MFA prompt'
    ],
    expectedFix: 'Purge stale Office credentials from Windows Credential Manager, confirm Modern Auth prompt appears, verify Outlook status reads "Connected to: Microsoft Exchange".',
    status: 'OPEN'
  },
  {
    id: 'tkt-3012',
    ticketNumber: 'WIN-3012',
    priority: 'P1',
    department: 'Executive',
    companyName: 'Ubuntu Manufacturing (Pty) Ltd',
    requestedBy: 'Naledi Maseko (Chief Operations Officer)',
    device: 'EXEC-LAPTOP-01 (HP EliteBook 840 G9 - Win 11)',
    issueTitle: 'BitLocker recovery prompt on startup after BIOS firmware update.',
    description: 'EMERGENCY: I turned on my laptop before an executive board meeting and it is showing a blue screen asking for a 48-digit BitLocker recovery key. I do not have this number. I need my presentation in 20 minutes!',
    systemEnvironment: 'BitLocker Drive Encryption / Microsoft Entra ID Device Portal / Active Directory',
    stepsToReproduce: [
      'Machine powers on directly to BitLocker Recovery screen',
      'Key ID displayed: e.g. 7E429B01-4A59-...',
      'User cannot bypass without correct 48-digit numeric password'
    ],
    troubleshootingGuidance: [
      'Locate BitLocker Recovery Key in Entra ID Admin Center (Devices -> All Devices -> EXEC-LAPTOP-01 -> BitLocker Keys) or AD DS Computer Object properties',
      'Match the first 8 characters of Key ID',
      'Read key to user over phone, enter on prompt, boot into Windows, test TPM health'
    ],
    expectedFix: 'Retrieve 48-digit key from Entra ID portal, verify TPM measurement PCR registers, guide user through unlock, and verify machine reboots normally.',
    status: 'OPEN'
  },
  {
    id: 'tkt-4021',
    ticketNumber: 'M365-4021',
    priority: 'P1',
    department: 'IT & Security Operations',
    companyName: 'Ubuntu Manufacturing (Pty) Ltd',
    requestedBy: 'Automated Alert (Microsoft Defender for Endpoint)',
    device: 'IT-ADMIN-01 (Windows 11 Workstation)',
    issueTitle: 'Defender for Endpoint alert: Suspicious PowerShell process execution detected.',
    description: 'HIGH SEVERITY ALERT: An encoded PowerShell command execution (powershell.exe -enc ...) was detected attempting to connect to external IP 185.220.101.5 on port 443. Process initiated from Word macro spawned in user Temp directory.',
    systemEnvironment: 'Microsoft 365 Defender XDR / Attack Surface Reduction / Live Response',
    stepsToReproduce: [
      'Defender XDR generates Alert ID: DEF-88910',
      'Endpoint flagged with high risk score',
      'Potential C2 beacon activity'
    ],
    troubleshootingGuidance: [
      'Immediately isolate IT-ADMIN-01 from Microsoft Defender portal to prevent lateral movement',
      'Initiate Automated Investigation to quarantine dropping binary',
      'Collect investigation package and inspect command-line arguments in Timeline',
      'Verify user account status and revoke active Entra ID refresh tokens'
    ],
    expectedFix: 'Isolate device via Defender, quarantine malicious artifact, revoke user session tokens, conduct full AV scan, release isolation when clean.',
    status: 'OPEN'
  },
  {
    id: 'tkt-5014',
    ticketNumber: 'GPO-5014',
    priority: 'P3',
    department: 'Sales',
    companyName: 'Ubuntu Manufacturing (Pty) Ltd',
    requestedBy: 'Musa Ndlovu (Sales Representative)',
    device: 'SALES-LAPTOP-08 (Dell Latitude 3520 - Win 11)',
    issueTitle: 'Shared network drive Z: (Sales) and default network printer missing on logon.',
    description: 'Hello. When I logged into my laptop this morning at my desk, my Z: drive (Sales Shared Documents) was missing from File Explorer. Also the 2nd Floor Canon Sales printer is not listed. Other sales colleagues have their drives working.',
    systemEnvironment: 'Group Policy Preferences / File & Print Sharing / AD Security Group Membership',
    stepsToReproduce: [
      'User logs into domain workstation SALES-LAPTOP-08',
      'File Explorer shows only C: and D: drives',
      'GPO "GPO-Sales-DriveMaps" and "GPO-Sales-Printers" not applying'
    ],
    troubleshootingGuidance: [
      'Run gpresult /r in command prompt to inspect applied GPOs and group memberships',
      'Check if user was mistakenly removed from "SG-Sales-Department" in Active Directory',
      'Run gpupdate /force and verify drive Z: appears'
    ],
    expectedFix: 'Verify user is in SG-Sales-Department, run gpupdate /force, verify Z: drive maps to \\\\DC01\\SalesShared, confirm default printer added.',
    status: 'RESOLVED',
    assignedStudentId: 'usr-student-01',
    studentRootCause: 'User was moved to Sales-Contractors OU which lacked the security group link for the departmental GPO.',
    studentResolutionNotes: 'Added user back to SG-Sales-Department security group in Active Directory. Ran gpupdate /force on client workstation. Confirmed Z: drive and Canon printer mounted successfully.',
    instructorFeedback: 'Spot on. Good understanding of GPO security group filtering.',
    gradeScore: 100,
    submittedAt: '2026-08-27 11:15'
  },
  {
    id: 'tkt-1099',
    ticketNumber: 'DNS-1099',
    priority: 'P2',
    department: 'Operations',
    companyName: 'Ubuntu Manufacturing (Pty) Ltd',
    requestedBy: 'Sipho Sithole (Operations Supervisor)',
    device: 'OPS-WS-03 (Custom Desktop Workstation)',
    issueTitle: 'Unable to join computer to domain - DNS resolution failure for ad.ubuntu-mfg.co.za',
    description: 'We built a new workstation for the warehouse dispatch desk. When attempting to join domain ad.ubuntu-mfg.co.za, Windows returns error: "An Active Directory Domain Controller for the domain could not be contacted."',
    systemEnvironment: 'Windows Server 2022 DNS / IPv4 Configuration / Domain Join',
    stepsToReproduce: [
      'System Properties -> Change Domain -> ad.ubuntu-mfg.co.za',
      'Error popup: DNS name does not exist (Error code 0x0000232B RCODE_NAME_ERROR)'
    ],
    troubleshootingGuidance: [
      'Run ipconfig /all on client machine',
      'Check Primary DNS server IP address (is it pointing to DC01 10.0.10.10 or 8.8.8.8?)',
      'Configure IPv4 DNS to point to DC01, test nslookup ad.ubuntu-mfg.co.za and _ldap._tcp.dc._msdcs.ad.ubuntu-mfg.co.za'
    ],
    expectedFix: 'Point workstation primary DNS to DC01 IP address (10.0.10.10), verify SRV records resolve, successfully join domain, and reboot.',
    status: 'OPEN'
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-01',
    name: 'Bongani Khumalo',
    email: 'bongani.k@gmail.com',
    whatsapp: '+27 82 998 1234',
    source: 'Google',
    courseInterest: 'IT Support & Enterprise Administration Bootcamp (Professional)',
    status: 'APPLICATION_SUBMITTED',
    notes: [
      'BSc Computer Science graduate, struggling to pass technical interviews due to lack of Active Directory & Intune hands-on experience.',
      'Very keen on October 2026 intake.'
    ],
    followUpDate: '2026-09-01',
    createdAt: '2026-08-25'
  },
  {
    id: 'lead-02',
    name: 'Zanele Ndlovu',
    email: 'zanele.n@outlook.com',
    whatsapp: '+27 71 555 4321',
    source: 'WhatsApp',
    courseInterest: 'Career Accelerator Tier',
    status: 'PAYMENT_PENDING',
    notes: [
      'Currently working in retail, wants to transition to Junior Desktop Support.',
      'Application approved. Invoice INV-TLS-2026-088 sent for R1,000 deposit.'
    ],
    followUpDate: '2026-08-30',
    createdAt: '2026-08-22'
  },
  {
    id: 'lead-03',
    name: 'Chad van der Merwe',
    email: 'chad.vdm@webmail.co.za',
    whatsapp: '+27 84 332 8765',
    source: 'LinkedIn',
    courseInterest: 'Professional Tier (Weekend Sessions)',
    status: 'CONTACTED',
    notes: [
      'Junior helpdesk agent at local ISP, wants to learn Microsoft 365, Intune and Defender for salary bump.',
      'Sent course brochure and curriculum breakdown.'
    ],
    followUpDate: '2026-09-03',
    createdAt: '2026-08-27'
  },
  {
    id: 'lead-04',
    name: 'Fatima Adams',
    email: 'fatima.adams@gmail.com',
    whatsapp: '+27 79 112 3499',
    source: 'Facebook',
    courseInterest: 'Starter Tier',
    status: 'NEW_LEAD',
    notes: [
      'Enquired via Facebook Ad: "Stop Watching Tutorials". Wants to know if laptop with 8GB RAM can be upgraded.'
    ],
    followUpDate: '2026-08-29',
    createdAt: '2026-08-28'
  }
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-01',
    referenceNumber: 'TLS-2026-0089',
    firstName: 'Bongani',
    lastName: 'Khumalo',
    email: 'bongani.k@gmail.com',
    whatsapp: '+27 82 998 1234',
    city: 'Cape Town',
    province: 'Western Cape',
    highestQualification: 'BSc Computer Science (Degree)',
    itExperienceYears: '0 - 1 years (Graduate)',
    currentEmploymentStatus: 'Unemployed / Job Seeking',
    currentRole: 'IT Graduate',
    technologiesKnown: ['Basic Networking', 'Python/Java', 'Windows 10/11 Basics'],
    laptopBrand: 'Dell G15 5520',
    cpu: 'Intel Core i7-12700H (14 cores)',
    ramGB: 16,
    storageType: 'NVMe SSD',
    freeStorageGB: 280,
    os: 'Windows 11 Home 64-bit',
    hasVirtualizationEnabled: true,
    isLaptopCompliant: true,
    selectedTier: 'PROFESSIONAL',
    cohortId: 'cohort-oct-2026',
    acceptedTerms: true,
    acceptedPrivacy: true,
    marketingConsent: true,
    status: 'UNDER_REVIEW',
    submissionDate: '2026-08-26',
    paymentOption: 'DEPOSIT'
  },
  {
    id: 'app-02',
    referenceNumber: 'TLS-2026-0088',
    firstName: 'Zanele',
    lastName: 'Ndlovu',
    email: 'zanele.n@outlook.com',
    whatsapp: '+27 71 555 4321',
    city: 'Cape Town (Bellville)',
    province: 'Western Cape',
    highestQualification: 'National Senior Certificate (Matric)',
    itExperienceYears: 'None (Career Changer)',
    currentEmploymentStatus: 'Employed (Non-IT)',
    currentRole: 'Customer Service Representative',
    technologiesKnown: ['General Computer Literacy', 'Microsoft Word & Excel'],
    laptopBrand: 'Lenovo IdeaPad 3',
    cpu: 'AMD Ryzen 5 5500U',
    ramGB: 16,
    storageType: 'SSD',
    freeStorageGB: 190,
    os: 'Windows 11 Pro 64-bit',
    hasVirtualizationEnabled: true,
    isLaptopCompliant: true,
    selectedTier: 'CAREER_ACCELERATOR',
    cohortId: 'cohort-oct-2026',
    acceptedTerms: true,
    acceptedPrivacy: true,
    marketingConsent: true,
    status: 'PAYMENT_REQUIRED',
    submissionDate: '2026-08-24',
    adminNotes: 'Laptop specs verified and compliant. Approved for Career Accelerator cohort.',
    paymentOption: 'DEPOSIT'
  },
  {
    id: 'app-03',
    referenceNumber: 'TLS-2026-0075',
    firstName: 'Bongani',
    lastName: 'Dlamini',
    email: 'bongani.dlamini@gmail.com',
    whatsapp: '+27 83 456 7890',
    city: 'Cape Town (Century City)',
    province: 'Western Cape',
    highestQualification: 'Diploma in Information Technology',
    itExperienceYears: '1 - 2 years',
    currentEmploymentStatus: 'Employed (Junior IT)',
    currentRole: 'Junior Helpdesk Analyst',
    technologiesKnown: ['Windows 11', 'Office 365 Basics', 'Printer Setup', 'Active Directory Basic Password Resets'],
    laptopBrand: 'HP Pavilion 15',
    cpu: 'Intel Core i5-1135G7',
    ramGB: 16,
    storageType: 'NVMe SSD',
    freeStorageGB: 220,
    os: 'Windows 11 Pro 64-bit',
    hasVirtualizationEnabled: true,
    isLaptopCompliant: true,
    selectedTier: 'PROFESSIONAL',
    cohortId: 'cohort-oct-2026',
    acceptedTerms: true,
    acceptedPrivacy: true,
    marketingConsent: true,
    status: 'ENROLLED',
    submissionDate: '2026-08-10',
    adminNotes: 'Paid in full via EFT. Onboarding initiated.',
    paymentOption: 'FULL'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-01',
    invoiceNumber: 'INV-TLS-2026-075',
    studentName: 'Bongani Dlamini',
    studentEmail: 'bongani.dlamini@gmail.com',
    courseTier: 'PROFESSIONAL',
    amountZAR: 3499,
    depositZAR: 3499,
    balanceZAR: 0,
    paymentOption: 'FULL',
    status: 'VERIFIED',
    dueDate: '2026-08-15',
    paidAt: '2026-08-11',
    paymentMethod: 'EFT'
  },
  {
    id: 'inv-02',
    invoiceNumber: 'INV-TLS-2026-088',
    studentName: 'Zanele Ndlovu',
    studentEmail: 'zanele.n@outlook.com',
    courseTier: 'CAREER_ACCELERATOR',
    amountZAR: 4999,
    depositZAR: 1000,
    balanceZAR: 3999,
    paymentOption: 'DEPOSIT',
    status: 'PENDING',
    dueDate: '2026-09-02',
    paymentMethod: 'EFT'
  },
  {
    id: 'inv-03',
    invoiceNumber: 'INV-TLS-2026-089',
    studentName: 'Bongani Khumalo',
    studentEmail: 'bongani.k@gmail.com',
    courseTier: 'PROFESSIONAL',
    amountZAR: 3499,
    depositZAR: 1000,
    balanceZAR: 2499,
    paymentOption: 'DEPOSIT',
    status: 'PENDING',
    dueDate: '2026-09-05',
    paymentMethod: 'Yoco'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-01',
    cohortId: 'cohort-oct-2026',
    sessionDate: '2026-10-10',
    sessionTopic: 'Module 1 & 2: IT Foundations & VMware Setup',
    studentId: 'usr-student-01',
    studentName: 'Bongani Dlamini',
    status: 'PRESENT',
    checkInTime: '08:52 SAST'
  },
  {
    id: 'att-02',
    cohortId: 'cohort-oct-2026',
    sessionDate: '2026-10-13',
    sessionTopic: 'Module 3: Windows Server 2022 Hardening',
    studentId: 'usr-student-01',
    studentName: 'Bongani Dlamini',
    status: 'PRESENT',
    checkInTime: '18:24 SAST'
  },
  {
    id: 'att-03',
    cohortId: 'cohort-oct-2026',
    sessionDate: '2026-10-17',
    sessionTopic: 'Module 4: Active Directory & OU Hierarchy',
    studentId: 'usr-student-01',
    studentName: 'Bongani Dlamini',
    status: 'LATE',
    checkInTime: '09:18 SAST'
  },
  {
    id: 'att-04',
    cohortId: 'cohort-oct-2026',
    sessionDate: '2026-10-20',
    sessionTopic: 'Module 5: DNS & DHCP Services',
    studentId: 'usr-student-01',
    studentName: 'Bongani Dlamini',
    status: 'PRESENT',
    checkInTime: '18:28 SAST'
  }
];

export const INITIAL_ASSESSMENTS: Assessment[] = [
  {
    id: 'ass-01',
    title: 'Practical Assessment 1: DC01 Disaster Recovery & Broken DNS Repair',
    moduleNumber: 5,
    type: 'Practical Lab Fix',
    totalMarks: 100,
    dueDate: '2026-10-25',
    status: 'Graded',
    studentScore: 94,
    feedback: 'Superb DNS SRV record reconstruction. Accurate troubleshooting step documentation.',
    instructions: 'You will receive a broken DC01 VM where DNS forward lookup zones have been corrupted and domain join fails. Restore DNS functionality, ensure dcdiag passes, and submit your technical report.'
  },
  {
    id: 'ass-02',
    title: 'Practical Assessment 2: Intune Compliance & Conditional Access Blueprint',
    moduleNumber: 10,
    type: 'Scenario Simulation',
    totalMarks: 100,
    dueDate: '2026-11-15',
    status: 'Pending',
    instructions: 'Configure a full corporate Intune policy requiring BitLocker, Windows Defender real-time protection, and minimum build 22621. Deploy to Finance group and verify non-compliant quarantine.'
  },
  {
    id: 'ass-03',
    title: 'Final Capstone: Enterprise Helpdesk Incident Run (5 Live Tickets)',
    moduleNumber: 15,
    type: 'Troubleshooting Documentation',
    totalMarks: 100,
    dueDate: '2026-12-05',
    status: 'Pending',
    instructions: 'Simulated 120-minute enterprise sprint. Resolve 5 randomized tickets spanning Active Directory, GPO, M365, Defender, and Intune with verified Root Cause Analysis.'
  }
];

export const SAMPLE_CERTIFICATE: Certificate = {
  id: 'cert-01',
  certificateNumber: 'TLS-2026-00124',
  studentName: 'Bongani Dlamini',
  courseName: 'IT Support & Enterprise Administration Bootcamp',
  completionDate: '05 December 2026',
  instructorName: 'TechLabs Instructor',
  verificationUrl: 'https://techlabs.co.za/verify/TLS-2026-00124',
  gradeDistinction: 'Distinction (94.5% Practical Exam Score)',
  qrCodeData: 'https://techlabs.co.za/verify/TLS-2026-00124',
  skillsAcquired: [
    'VMware Enterprise Virtualization',
    'Windows Server 2022 & Active Directory DS',
    'Enterprise DNS, DHCP & Group Policy (GPO)',
    'Microsoft 365 & Exchange Online Admin',
    'Microsoft Entra ID & Conditional Access',
    'Microsoft Intune & Endpoint Compliance',
    'Microsoft Defender for Endpoint & Incident Triage',
    'PowerShell IT Administration & Automation',
    'Enterprise IT Helpdesk & ITIL Ticket Resolution'
  ]
};

export const LEARNING_RESOURCES: LearningResource[] = [
  {
    id: 'res-01',
    title: 'TechLabs Active Directory & OU Architecture Template',
    category: 'Lab Architecture',
    fileSize: '1.4 MB (PDF)',
    description: 'High-resolution blueprint of enterprise OU naming schemas, AGDLP security group hierarchy, and administrative delegation standards.',
    downloadUrl: '#'
  },
  {
    id: 'res-02',
    title: 'Essential PowerShell Cmdlets for IT Support (Cheat Sheet)',
    category: 'Cheatsheet',
    fileSize: '850 KB (PDF)',
    description: 'Field reference of 50+ must-know PowerShell commands for ActiveDirectory, Microsoft Graph, Event Logs, and Network Diagnostics.',
    downloadUrl: '#'
  },
  {
    id: 'res-03',
    title: 'VMware Workstation Pro Lab Setup & VMnet2 Guide',
    category: 'Guide',
    fileSize: '2.8 MB (PDF)',
    description: 'Step-by-step walkthrough to configure isolated private subnets, host RAM allocation, and Windows Server / Win11 Sysprep templates.',
    downloadUrl: '#'
  },
  {
    id: 'res-04',
    title: 'Bulk User Onboarding PowerShell Automation Script',
    category: 'PowerShell Script',
    fileSize: '45 KB (.ps1)',
    description: 'Production-ready PowerShell script that reads employees.csv and provisions AD accounts, sets initial password, creates home drives, and assigns OUs.',
    downloadUrl: '#'
  },
  {
    id: 'res-05',
    title: 'Microsoft Intune Compliance & BitLocker Deployment Checklist',
    category: 'Checklist',
    fileSize: '620 KB (PDF)',
    description: 'Auditor checklist for verifying Windows 11 encryption, TPM 2.0 readiness, recovery key escrow, and Conditional Access rules.',
    downloadUrl: '#'
  },
  {
    id: 'res-06',
    title: 'Group Policy Troubleshooting Guide (gpresult & WMI filters)',
    category: 'Guide',
    fileSize: '1.1 MB (PDF)',
    description: 'Deep dive into diagnosing GPO precedence, loopback processing, security filtering blocks, and Event ID 1085/1058 errors.',
    downloadUrl: '#'
  }
];

export const FREQUENTLY_ASKED_QUESTIONS = [
  {
    question: 'Do I need prior IT experience to enroll?',
    answer: 'No prior enterprise experience is required for the Starter and Professional tiers. If you are comfortable using a computer, installing software, and have a passion for technology, our step-by-step "Build. Break. Fix. Verify." methodology will guide you from the ground up to junior enterprise administrator capability.'
  },
  {
    question: 'Do I need a university degree or diploma?',
    answer: 'No degree is required. South African employers and managed service providers (MSPs) hiring for IT Support, Desktop Support, and Junior SysAdmin roles prioritize demonstrable practical skills—such as whether you can configure Active Directory, deploy Intune compliance, and troubleshoot real helpdesk tickets.'
  },
  {
    question: 'Do I need my own laptop?',
    answer: 'Yes. Practical VMware virtual machine labs are built and run locally on your own machine. This ensures you can practice anytime at home, pause your virtual lab, snapshot your progress, and build your own real-world IT environment without being tethered to a browser timer.'
  },
  {
    question: 'What laptop specifications do I need?',
    answer: 'Minimum recommended requirements:\n• RAM: 16 GB RAM (strictly recommended so you can run Windows Server + Windows 11 VM concurrently)\n• Storage: 500 GB SSD (or at least 150 GB free SSD storage)\n• Processor: Modern Intel Core i5 / Core i7 or AMD Ryzen 5 / Ryzen 7 (with hardware virtualization VT-x/AMD-V enabled in BIOS)\n• Operating System: Windows 10 or Windows 11 64-bit.'
  },
  {
    question: 'Do I need to buy VMware Workstation?',
    answer: 'No additional purchase is necessary. Broadcom now offers VMware Workstation Pro free for personal and educational use. We guide you through the official download, installation, and virtual network configuration during student onboarding.'
  },
  {
    question: 'Do I need to pay for Microsoft 365 or create my own tenant?',
    answer: 'Where cloud licensing and tenant capacity allow, students work in controlled academy Microsoft 365 environments managed by TechLabs Academy. This keeps your training safe, isolated, and cost-free without needing your own credit card for Azure.'
  },
  {
    question: 'What happens if I break my lab during an exercise?',
    answer: 'That is the point of TechLabs Academy! In real IT, you learn the most when systems break. We teach you how to take VMware snapshots before major changes so you can safely experiment, break the environment, investigate the root cause, fix it, or roll back cleanly.'
  },
  {
    question: 'Are the labs simulated or real?',
    answer: 'Our labs are 100% REAL. You are running genuine Windows Server 2022 operating systems, real Active Directory Domain Services, real PowerShell scripts, genuine DNS servers, and real Windows 11 client virtual machines. You are not clicking pre-recorded web animations.'
  },
  {
    question: 'Is this an official Microsoft certification?',
    answer: 'TechLabs Academy SA is an independent IT training provider. Our training covers the practical real-world skills tested in certifications such as Microsoft CompTIA A+, Network+, MD-102 (Endpoint Administrator), and MS-900/AZ-900. Upon successful completion of our bootcamp and final practical assessment, you receive a verified TechLabs Academy Certificate of Completion. Official vendor exam vouchers can be purchased separately through Pearson VUE.'
  },
  {
    question: 'Where are classes held and what is the schedule?',
    answer: 'We operate in Cape Town with convenient evening and weekend sessions designed for working professionals, university students, and career changers:\n• Saturday practical deep-dives: 09:00 - 13:00 SAST\n• Tuesday or Thursday evening lab sessions: 18:30 - 20:30 SAST\nHybrid options are also available with remote access to our instructors and lab guidance.'
  },
  {
    question: 'Can I pay in installments?',
    answer: 'Yes! We offer a flexible installment structure: you can secure your seat with a R1,000 deposit upon application approval, with the remaining balance split across comfortable monthly payments during your bootcamp.'
  },
  {
    question: 'What happens if I miss a live class session?',
    answer: 'All lecture demonstrations, troubleshooting walk-throughs, and lab debriefs are recorded and posted to your Student Portal within 24 hours. Instructors and peer teaching assistants are also available in our private WhatsApp/Teams group to unblock your lab questions.'
  },
  {
    question: 'Can I repeat a lab if I want more practice?',
    answer: 'Yes! Since your VMware virtual lab environment lives on your own laptop, you can re-run lab scenarios, rebuild your Domain Controller, or try alternative troubleshooting techniques as many times as you like.'
  }
];

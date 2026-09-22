export type EmailTrigger = 
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_WAITLISTED'
  | 'PAYMENT_VERIFIED'
  | 'INVOICE_GENERATED'
  | 'COHORT_STARTED'
  | 'COHORT_ENDED'
  | 'MANUAL_SEND';

export interface EmailTemplate {
  id: string;
  name: string;
  trigger: EmailTrigger;
  subject: string;
  htmlBody: string;
  enabled: boolean;
  variables: string[]; // e.g., ['{studentName}', '{cohortName}', '{invoiceAmount}']
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  enabled: boolean;
  trigger: EmailTrigger;
  actions: WorkflowAction[];
  conditions?: WorkflowCondition[];
}

export interface WorkflowAction {
  type: 'SEND_EMAIL' | 'GENERATE_INVOICE' | 'UPDATE_STATUS' | 'ASSIGN_COHORT';
  config: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
}

// Default email templates
export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-app-submitted',
    name: 'Application Received',
    trigger: 'APPLICATION_SUBMITTED',
    subject: 'We received your application · {referenceNumber}',
    htmlBody: `
<h2>Application received</h2>
<p>Hello {studentName},</p>
<p>Thank you for applying to <strong>{cohortName}</strong>. Our admissions team is reviewing your application and laptop details.</p>
<p style="padding:14px 18px;background:#f5f7f8;border-left:3px solid #80cdf0"><strong>Your reference</strong><br>{referenceNumber}</p>
<h3>What happens next</h3>
<p>We aim to email your outcome within two business days. If approved, you will receive your invoice, a secure portal setup link, and payment instructions.</p>
<p>No payment is needed during this review. If you have not heard from us after two business days, reply with your reference number.</p>
<p>Regards,<br>TechLabs Academy</p>
    `,
    enabled: true,
    variables: ['studentName', 'cohortName', 'referenceNumber']
  },
  {
    id: 'tpl-app-approved',
    name: 'Application Approved',
    trigger: 'APPLICATION_APPROVED',
    subject: 'Your TechLabs application is approved',
    htmlBody: `
<h2>Your application is approved</h2>
<p>Hello {studentName},</p>
<p>You have been approved for <strong>{cohortName}</strong>, starting <strong>{cohortStartDate}</strong>.</p>
<p style="padding:14px 18px;background:#f5f7f8;border-left:3px solid #80cdf0"><strong>Your invoice is attached</strong><br>Total tuition: R{invoiceAmount}<br>Payment due: {dueDate}</p>
<p>First, use the private link below to create your student portal password. Then review your invoice and choose a payment option in the portal.</p>
    `,
    enabled: true,
    variables: ['studentName', 'cohortName', 'cohortStartDate', 'invoiceAmount', 'dueDate']
  },
  {
    id: 'tpl-payment-verified',
    name: 'Payment Verified',
    trigger: 'PAYMENT_VERIFIED',
    subject: 'Payment confirmed for your TechLabs course',
    htmlBody: `
<h2>Payment confirmed</h2>
<p>Hello {studentName},</p>
<p>We confirmed your payment of <strong>R{amount}</strong> for <strong>{cohortName}</strong>.</p>
<p>Sign in to your student portal to see your updated invoice, payment schedule and receipts. Your course calendar shows the first session on <strong>{courseStartDate}</strong>.</p>
    `,
    enabled: true,
    variables: ['studentName', 'amount', 'cohortName', 'courseStartDate']
  },
  {
    id: 'tpl-lead-marketing',
    name: 'Lead Marketing Campaign',
    trigger: 'MANUAL_SEND',
    subject: 'TechLabs Academy: explore your next IT career step',
    htmlBody: `
<h2>Build practical IT skills</h2>
<p>Hello {studentName},</p>
<p>Explore TechLabs Academy's hands-on IT support training, guided labs and small-group mentoring.</p>
<p>See the upcoming programmes and choose the intake that suits your goals.</p>
<p><a href="https://techlabssa.vercel.app/pricing" style="display:inline-block;padding:13px 20px;background:#111111;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700">Explore programmes</a></p>
<p>Questions about the programme? Reply to this email and our admissions team will help.</p>
    `,
    enabled: true,
    variables: ['studentName']
  },
  {
    id: 'tpl-app-rejected',
    name: 'Application Not Accepted',
    trigger: 'APPLICATION_REJECTED',
    subject: 'Update on your TechLabs application',
    htmlBody: `
<h2>Your application update</h2>
<p>Hello {studentName},</p>
<p>Thank you for your interest in TechLabs Academy. We are unable to offer you a place in this intake.</p>
<p>If you would like to discuss the decision or future intakes, reply to this email and our admissions team will help.</p>
<p>Regards,<br>TechLabs Academy</p>
    `,
    enabled: true,
    variables: ['studentName']
  }
];

export class EmailAutomationEngine {
  private templates: Map<string, EmailTemplate> = new Map();
  private workflows: Map<string, AutomationWorkflow> = new Map();

  constructor() {
    DEFAULT_EMAIL_TEMPLATES.forEach(tpl => {
      this.templates.set(tpl.id, tpl);
    });
  }

  registerWorkflow(workflow: AutomationWorkflow) {
    this.workflows.set(workflow.id, workflow);
  }

  getWorkflowsByTrigger(trigger: EmailTrigger): AutomationWorkflow[] {
    return Array.from(this.workflows.values()).filter(
      w => w.enabled && w.trigger === trigger
    );
  }

  renderTemplate(templateId: string, variables: Record<string, any>): { subject: string; html: string } | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    let subject = template.subject;
    let html = template.htmlBody;

    // Replace all variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      subject = subject.replace(placeholder, String(value));
      html = html.replace(placeholder, String(value));
    });

    return { subject, html };
  }

  getTemplate(templateId: string): EmailTemplate | undefined {
    return this.templates.get(templateId);
  }

  updateTemplate(templateId: string, updates: Partial<EmailTemplate>) {
    const template = this.templates.get(templateId);
    if (template) {
      this.templates.set(templateId, { ...template, ...updates });
    }
  }

  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  getAllWorkflows(): AutomationWorkflow[] {
    return Array.from(this.workflows.values());
  }
}

// Global singleton instance
export const emailAutomationEngine = new EmailAutomationEngine();

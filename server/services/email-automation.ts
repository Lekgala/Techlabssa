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
    subject: 'Your TechLabs Academy Application Received',
    htmlBody: `
<h2>Thank you, {studentName}!</h2>
<p>We've received your application for the {cohortName} cohort.</p>
<p><strong>Reference Number:</strong> {referenceNumber}</p>
<p>Our admissions team will review your application and contact you within 2-3 business days.</p>
<p>Best regards,<br/>TechLabs Academy Team</p>
    `,
    enabled: true,
    variables: ['studentName', 'cohortName', 'referenceNumber']
  },
  {
    id: 'tpl-app-approved',
    name: 'Application Approved',
    trigger: 'APPLICATION_APPROVED',
    subject: 'Congratulations! Your TechLabs Application is Approved',
    htmlBody: `
<h2>Welcome to TechLabs Academy, {studentName}!</h2>
<p>We're excited to inform you that your application has been <strong>APPROVED</strong>.</p>
<p>You're enrolled in the <strong>{cohortName}</strong> cohort starting on <strong>{cohortStartDate}</strong>.</p>
<h3>Next Steps:</h3>
<ol>
  <li>Review your invoice (attached): R{invoiceAmount}</li>
  <li>Complete payment via EFT to confirm enrollment</li>
  <li>Receive your onboarding welcome package</li>
  <li>Join our student WhatsApp community</li>
</ol>
<p><strong>Payment Due Date:</strong> {dueDate}</p>
<p>Questions? Reply to this email or contact us on WhatsApp.</p>
    `,
    enabled: true,
    variables: ['studentName', 'cohortName', 'cohortStartDate', 'invoiceAmount', 'dueDate']
  },
  {
    id: 'tpl-payment-verified',
    name: 'Payment Verified',
    trigger: 'PAYMENT_VERIFIED',
    subject: 'Payment Confirmed - Welcome to Your Course!',
    htmlBody: `
<h2>Payment Confirmed!</h2>
<p>Hi {studentName},</p>
<p>We've verified your payment of <strong>R{amount}</strong>.</p>
<p>Your enrollment in <strong>{cohortName}</strong> is now confirmed.</p>
<h3>What Happens Next:</h3>
<ul>
  <li>Access your student portal at techlabs.co.za/student</li>
  <li>Download your course materials and schedule</li>
  <li>Set up your lab environment (instructions sent separately)</li>
  <li>First class starts on {courseStartDate}</li>
</ul>
<p>We're ready to transform your IT career! 🚀</p>
    `,
    enabled: true,
    variables: ['studentName', 'amount', 'cohortName', 'courseStartDate']
  },
  {
    id: 'tpl-app-rejected',
    name: 'Application Not Accepted',
    trigger: 'APPLICATION_REJECTED',
    subject: 'Your TechLabs Application Status',
    htmlBody: `
<h2>Application Status Update</h2>
<p>Hi {studentName},</p>
<p>Thank you for your interest in TechLabs Academy. After careful review, we're unable to offer admission at this time.</p>
<p>We'd like to suggest reapplying for our next cohort or exploring alternative programs that might suit you better.</p>
<p>Please don't hesitate to contact us if you'd like feedback on your application.</p>
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

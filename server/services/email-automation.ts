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
    subject: 'Application received: {referenceNumber}',
    htmlBody: `
  <h2>Application received</h2>
  <p>Hello {studentName},</p>
  <p>We have received your application for <strong>{cohortName}</strong>.</p>
  <p><strong>Your reference:</strong> {referenceNumber}</p>
  <h3>What you need to do now</h3>
  <p>No further action or payment is required while admissions reviews your application and laptop details. Keep this reference for any future contact.</p>
  <h3>What happens next</h3>
  <ol>
    <li>Admissions reviews your application and hardware readiness.</li>
    <li>We email you with an outcome within two business days.</li>
    <li>If approved, that email will include your invoice, secure portal-password link, and the exact payment steps.</li>
  </ol>
  <p>Please do not send payment or a proof of payment until you receive an approval email and invoice. If you have not received an update after two business days, reply to this email and include <strong>{referenceNumber}</strong>.</p>
  <p>Regards,<br/>TechLabs Academy</p>
    `,
    enabled: true,
    variables: ['studentName', 'cohortName', 'referenceNumber']
  },
  {
    id: 'tpl-app-approved',
    name: 'Application Approved',
    trigger: 'APPLICATION_APPROVED',
    subject: 'Action required: secure your TechLabs seat',
    htmlBody: `
<h2>Your application is approved</h2>
<p>Hello {studentName},</p>
<p>You are eligible for <strong>{cohortName}</strong>, which starts on <strong>{cohortStartDate}</strong>. Your seat is confirmed only after admissions verifies the required payment.</p>
<h3>Complete these steps in order</h3>
<ol>
  <li>Open the secure portal link below this message and create your password. The link expires after 24 hours and can be used once.</li>
  <li>Review the attached invoice. Your total tuition is <strong>R{invoiceAmount}</strong>.</li>
  <li>Make the EFT payment due by <strong>{dueDate}</strong>, using the invoice number as the payment reference.</li>
  <li>Sign in to the student portal and upload the bank-generated proof of payment as a PDF, JPG, or PNG.</li>
</ol>
<p>After upload, your proof is marked for admissions review. Do not upload it again while it is awaiting review. We will email you when the payment is verified or if a correction is needed.</p>
<p>Use the portal for payment and document actions. Reply to this email only for a problem the portal cannot resolve.</p>
    `,
    enabled: true,
    variables: ['studentName', 'cohortName', 'cohortStartDate', 'invoiceAmount', 'dueDate']
  },
  {
    id: 'tpl-payment-verified',
    name: 'Payment Verified',
    trigger: 'PAYMENT_VERIFIED',
    subject: 'Payment verified: your TechLabs access is active',
    htmlBody: `
<h2>Your payment has been verified</h2>
<p>Hi {studentName},</p>
<p>We verified your payment of <strong>R{amount}</strong> for <strong>{cohortName}</strong>.</p>
<h3>Do this next</h3>
<ol>
  <li>Sign in to the student portal and open your calendar to confirm your first session on <strong>{courseStartDate}</strong>.</li>
  <li>Open the Documents section to download your admission confirmation, invoice, and course schedule.</li>
  <li>Open Learning before your first session and complete the lab setup instructions shown there.</li>
  <li>Use the Support section for a course or technical issue after checking the relevant portal instructions.</li>
</ol>
<p>Your portal shows any remaining balance and due dates. Pay only according to that payment plan, using your invoice number as the EFT reference.</p>
<p>Regards,<br/>TechLabs Academy</p>
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

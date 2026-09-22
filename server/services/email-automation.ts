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
  <li>Open the student portal and pay the amount due securely with Yoco by <strong>{dueDate}</strong>.</li>
  <li>After Yoco confirms the payment, your invoice and enrollment status update automatically.</li>
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
<p>Your portal shows any remaining balance and due dates. Pay securely through Yoco using the payment option shown in your portal.</p>
<p>Regards,<br/>TechLabs Academy</p>
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
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#ffffff;border:1px solid #e1e1e1">
      <tr><td style="padding:22px 28px;background:#000000;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:1px">◆ TECHLABS <span style="color:#bdbdbd;font-size:10px;letter-spacing:2px">SA</span></td></tr>
      <tr><td style="padding:36px 28px 28px">
        <p style="margin:0 0 12px;color:#707070;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">A practical next step in IT</p>
        <h1 style="margin:0 0 18px;color:#111111;font-size:30px;line-height:1.15;font-weight:700">Build skills that work in the real world.</h1>
        <p style="margin:0 0 18px;color:#444444;font-size:16px;line-height:1.7">Hello {studentName}, explore upcoming TechLabs Academy cohorts, hands-on labs, and practical IT support training built for the workplace.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:24px 0;background:#f7f7f7;border-left:4px solid #000000"><tr><td style="padding:16px 18px;color:#333333;font-size:14px;line-height:1.6"><strong>Learn by doing.</strong><br/>Enterprise administration, troubleshooting, cloud foundations, and guided practical labs.</td></tr></table>
        <p style="margin:0 0 24px;color:#444444;font-size:15px;line-height:1.6">See what is available for the next intake and choose the path that fits your goals.</p>
        <p style="margin:0 0 8px"><a href="https://techlabssa.vercel.app/pricing" style="display:inline-block;padding:13px 20px;background:#000000;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.5px">Explore programmes</a></p>
        <p style="margin:20px 0 0;color:#707070;font-size:13px;line-height:1.6">Questions? Reply to this email or contact our admissions team.</p>
      </td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid #e5e5e5;color:#8a8a8a;font-size:11px;line-height:1.5">TechLabs Academy SA · Practical IT training in South Africa</td></tr>
    </table>
  </td></tr>
</table>
    `,
    enabled: true,
    variables: ['studentName']
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

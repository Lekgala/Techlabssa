import cors from 'cors';
import 'dotenv/config';
import express from 'express';

import {
  getDatabase,
  saveDatabase,
  type TechlabsDatabase,
} from './data/store';
import { generateInvoiceHTML } from './services/invoice-service';
import { emailAutomationEngine } from './services/email-automation';
import { bulkOperationsService } from './services/bulk-operations';
import { virtualLearningService } from './services/virtual-learning-service';

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'techlabs-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/data', async (_req, res) => {
  const database = await getDatabase();
  res.json(database);
});

const collectionNames = [
  'leads',
  'applications',
  'cohorts',
  'tickets',
  'labs',
  'invoices',
  'assessments',
  'certificates',
  'attendance',
  'courseModules',
] as const satisfies ReadonlyArray<Exclude<keyof TechlabsDatabase, 'currentUser' | 'currentRole'>>;

for (const collection of collectionNames) {
  app.get(`/api/${collection}`, async (_req, res) => {
    const database = await getDatabase();
    res.json(database[collection]);
  });

  app.post(`/api/${collection}`, async (req, res) => {
    const database = await getDatabase();
    const nextValue = Array.isArray(req.body) ? req.body : [req.body];
    database[collection] = nextValue as never;
    await saveDatabase(database);
    res.status(201).json(database[collection]);
  });

  app.put(`/api/${collection}/:id`, async (req, res) => {
    const database = await getDatabase();
    const { id } = req.params;
    const nextCollection = database[collection].map((item: any) =>
      item.id === id ? { ...item, ...req.body } : item,
    );

    database[collection] = nextCollection as never;
    await saveDatabase(database);
    res.json(nextCollection.find((item: any) => item.id === id));
  });

  app.delete(`/api/${collection}/:id`, async (req, res) => {
    const database = await getDatabase();
    const { id } = req.params;
    database[collection] = database[collection].filter((item: any) => item.id !== id) as never;
    await saveDatabase(database);
    res.status(204).send();
  });
}

app.post('/api/applications', async (req, res) => {
  const database = await getDatabase();
  const appData = req.body;
  const referenceNumber = appData.referenceNumber || `TLS-${new Date().getFullYear()}-${String(database.applications.length + 1).padStart(4, '0')}`;
  const newApplication = {
    ...appData,
    id: appData.id || `app-${Date.now()}`,
    referenceNumber,
    submissionDate: appData.submissionDate || new Date().toISOString().split('T')[0],
    status: appData.status || 'NEW',
  };

  database.applications = [newApplication, ...database.applications];
  await saveDatabase(database);
  res.status(201).json(newApplication);
});

app.post('/api/leads', async (req, res) => {
  const database = await getDatabase();
  const leadData = req.body;
  const newLead = {
    ...leadData,
    id: leadData.id || `lead-${Date.now()}`,
    createdAt: leadData.createdAt || new Date().toISOString().split('T')[0],
    notes: leadData.notes || [`Inquiry received from ${leadData.source || 'Website'}`],
  };

  database.leads = [newLead, ...database.leads];
  await saveDatabase(database);
  res.status(201).json(newLead);
});

app.post('/api/tickets', async (req, res) => {
  const database = await getDatabase();
  const ticketData = req.body;
  const newTicket = {
    ...ticketData,
    id: ticketData.id || `tkt-${Date.now()}`,
    ticketNumber: ticketData.ticketNumber || `INT-${Math.floor(1000 + Math.random() * 9000)}`,
    status: ticketData.status || 'OPEN',
  };

  database.tickets = [newTicket, ...database.tickets];
  await saveDatabase(database);
  res.status(201).json(newTicket);
});

app.patch('/api/applications/:id/status', async (req, res) => {
  const database = await getDatabase();
  const { id } = req.params;
  const { status, notes } = req.body;

  database.applications = database.applications.map((application) => {
    if (application.id !== id) return application;
    return {
      ...application,
      status,
      adminNotes: notes ? (application.adminNotes ? `${application.adminNotes} | ${notes}` : notes) : application.adminNotes,
    };
  });

  await saveDatabase(database);
  res.json(database.applications.find((application) => application.id === id));
});

app.patch('/api/leads/:id/status', async (req, res) => {
  const database = await getDatabase();
  const { id } = req.params;
  const { status } = req.body;

  database.leads = database.leads.map((lead) =>
    lead.id === id ? { ...lead, status } : lead,
  );

  await saveDatabase(database);
  res.json(database.leads.find((lead) => lead.id === id));
});

app.post('/api/email/approval', (req, res) => {
  const { applicantName, email, type, referenceNumber, cohortName } = req.body || {};

  const subjectMap = {
    APPROVED: 'Your TechLabs application has been approved',
    REJECTED: 'Your TechLabs application update',
    WAITLISTED: 'Your TechLabs application is on the waitlist',
  } as const;

  const message = `Hi ${applicantName || 'Applicant'},\n\nYour application ${referenceNumber || 'reference'} has been marked as ${type || 'APPROVED'} for the ${cohortName || 'next intake'}.\n\nThis is an automated email from TechLabs Academy SA.\n\nRegards,\nTechLabs Academy SA`;

  console.log(`[EMAIL] ${subjectMap[type as keyof typeof subjectMap] || 'Application Update'} -> ${email}`);
  console.log(message);

  res.json({
    ok: true,
    message: `Automated ${type.toLowerCase()} email prepared for ${applicantName || email}`,
  });
});

// ============= INVOICE GENERATION =============
app.post('/api/invoices/generate', async (req, res) => {
  const { studentName, studentEmail, amount, description, invoiceNumber, dueDate, reference } = req.body;

  if (!studentName || !studentEmail || !amount || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const html = generateInvoiceHTML({
    invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    studentName,
    studentEmail,
    amount,
    description,
    reference
  });

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ============= EMAIL AUTOMATION =============
app.get('/api/automation/templates', (req, res) => {
  const templates = emailAutomationEngine.getAllTemplates();
  res.json(templates);
});

app.get('/api/automation/templates/:id', (req, res) => {
  const template = emailAutomationEngine.getTemplate(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json(template);
});

app.put('/api/automation/templates/:id', (req, res) => {
  emailAutomationEngine.updateTemplate(req.params.id, req.body);
  const updated = emailAutomationEngine.getTemplate(req.params.id);
  res.json(updated);
});

app.post('/api/automation/render', (req, res) => {
  const { templateId, variables } = req.body;

  if (!templateId || !variables) {
    return res.status(400).json({ error: 'Missing templateId or variables' });
  }

  const rendered = emailAutomationEngine.renderTemplate(templateId, variables);
  if (!rendered) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json(rendered);
});

app.get('/api/automation/workflows', (req, res) => {
  const workflows = emailAutomationEngine.getAllWorkflows();
  res.json(workflows);
});

// ============= BULK OPERATIONS =============
app.post('/api/bulk/approve', async (req, res) => {
  const { applicationIds, cohortId, notes, sendEmails } = req.body as any;

  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    return res.status(400).json({ error: 'applicationIds array required' });
  }

  const database = await getDatabase();

  const result = await bulkOperationsService.approveApplications(
    { applicationIds, cohortId, notes, sendEmails },
    async (id: string, status: string, note: string) => {
      database.applications = database.applications.map((app) =>
        app.id === id
          ? {
              ...app,
              status: status as any,
              adminNotes: note
                ? app.adminNotes
                  ? `${app.adminNotes} | ${note}`
                  : note
                : app.adminNotes,
            }
          : app,
      );
      await saveDatabase(database);
    },
    async (appId: string) => {
      // Send approval email (mock)
      const app = database.applications.find((a) => a.id === appId);
      if (app) {
        console.log(`[BULK EMAIL] Approval email sent to ${app.email}`);
      }
    }
  );

  res.json(result);
});

app.post('/api/bulk/export', async (req, res) => {
  const { targetIds, targetType, format } = req.body;

  if (!targetIds || !targetType || !format) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const database = await getDatabase();
  let records: any[] = [];

  if (targetType === 'applications') {
    records = database.applications.filter((app) => targetIds.includes(app.id));
  } else if (targetType === 'leads') {
    records = database.leads.filter((lead) => targetIds.includes(lead.id));
  } else if (targetType === 'invoices') {
    records = database.invoices.filter((inv) => targetIds.includes(inv.id));
  }

  let output = '';
  let contentType = 'text/plain';

  if (format === 'csv') {
    output = bulkOperationsService.generateCSV(records);
    contentType = 'text/csv';
  } else if (format === 'json') {
    output = bulkOperationsService.generateJSON(records);
    contentType = 'application/json';
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${targetType}-export-${Date.now()}.${format}"`);
  res.send(output);
});

app.post('/api/bulk/update-status', async (req, res) => {
  const { targetIds, targetType, newStatus, notes } = req.body;

  if (!targetIds || !targetType || !newStatus) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const database = await getDatabase();

  const result = await bulkOperationsService.bulkUpdateStatus(
    { targetIds, targetType: targetType as any, newStatus, notes },
    async (id: string, status: string) => {
      if (targetType === 'applications') {
        database.applications = database.applications.map((app) =>
          app.id === id ? { ...app, status: status as any } : app
        );
      } else if (targetType === 'leads') {
        database.leads = database.leads.map((lead) =>
          lead.id === id ? { ...lead, status: status as any } : lead
        );
      }
      await saveDatabase(database);
    }
  );

  res.json(result);
});

app.post('/api/bulk/send-emails', async (req, res) => {
  const { recipientIds, recipientType, templateId, variables } = req.body;

  if (!recipientIds || !recipientType || !templateId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const database = await getDatabase();
  let recipients: any[] = [];

  if (recipientType === 'applications') {
    recipients = database.applications.filter((app) => recipientIds.includes(app.id));
  } else if (recipientType === 'leads') {
    recipients = database.leads.filter((lead) => recipientIds.includes(lead.id));
  }

  const results = recipients.map((recipient) => {
    const emailVars = {
      studentName: recipient.firstName || recipient.name || 'Student',
      email: recipient.email,
      ...variables,
    };

    const rendered = emailAutomationEngine.renderTemplate(templateId, emailVars);
    console.log(`[BULK EMAIL] Sending to ${recipient.email}: ${rendered?.subject}`);

    return {
      recipientId: recipient.id,
      recipientEmail: recipient.email,
      sent: true,
      timestamp: new Date().toISOString(),
    };
  });

  res.json({
    totalSent: results.length,
    results,
    templateUsed: templateId,
  });
});

app.listen(PORT, () => {
  console.log(`TechLabs API listening on http://localhost:${PORT}`);
});

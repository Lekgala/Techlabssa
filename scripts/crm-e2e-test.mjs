const baseUrl = process.env.CRM_TEST_BASE_URL || 'http://127.0.0.1:4011/api';
const adminEmail = process.env.CRM_TEST_ADMIN_EMAIL || 'crm-test@example.test';
const adminPassword = process.env.CRM_TEST_ADMIN_PASSWORD || 'RecruitmentTest123';

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} failed (${response.status}): ${JSON.stringify(body)}`);
  return body;
};

const unique = Date.now();
const publicLead = await request('/leads', {
  method: 'POST',
  body: JSON.stringify({
    name: 'CRM Test Recruit',
    email: `crm-test-${unique}@example.test`,
    whatsapp: '+27820000000',
    source: 'Website',
    courseInterest: 'IT Support Bootcamp',
    followUpDate: '2026-09-02',
  }),
});
if (publicLead.status !== 'NEW_LEAD') throw new Error('New enquiry did not enter NEW_LEAD');

const login = await request('/auth/admin', {
  method: 'POST',
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
const auth = { authorization: `Bearer ${login.token}` };

const contacted = await request(`/admin/leads/${encodeURIComponent(publicLead.id)}`, {
  method: 'PUT', headers: auth,
  body: JSON.stringify({ status: 'CONTACTED', followUpDate: '2026-09-05' }),
});
if (contacted.status !== 'CONTACTED' || contacted.followUpDate !== '2026-09-05') throw new Error('Status or follow-up date was not saved');

const noted = await request(`/admin/leads/${encodeURIComponent(publicLead.id)}/notes`, {
  method: 'POST', headers: auth,
  body: JSON.stringify({ note: 'Prospect requested a course outline and Friday callback.' }),
});
if (!noted.notes.some(note => note.includes('Friday callback'))) throw new Error('Recruitment note was not saved');

const data = await request('/admin/data', { headers: auth });
if (!data.leads.some(lead => lead.id === publicLead.id && lead.status === 'CONTACTED')) throw new Error('Updated lead was not returned to staff');

const audit = await request('/admin/audit-logs', { headers: auth });
if (!audit.some(record => record.entityId === publicLead.id && record.action === 'LEAD_UPDATED')) throw new Error('Lead update was not audited');
if (!audit.some(record => record.entityId === publicLead.id && record.action === 'LEAD_NOTE_ADDED')) throw new Error('Lead note was not audited');

console.log('CRM E2E passed: enquiry creation, login, status, follow-up, note, staff retrieval, and audit log.');

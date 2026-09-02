const baseUrl = process.env.CURRICULUM_TEST_BASE_URL || 'http://127.0.0.1:4012/api';
const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} failed (${response.status}): ${JSON.stringify(body)}`);
  return body;
};

const login = await request('/auth/admin', { method: 'POST', body: JSON.stringify({ email: 'curriculum-test@example.test', password: 'CurriculumTest123' }) });
const auth = { authorization: `Bearer ${login.token}` };
const adminData = await request('/admin/data', { headers: auth });
if (adminData.courseModules.length !== 15) throw new Error(`Expected 15 default modules, received ${adminData.courseModules.length}`);

const created = await request('/admin/course-modules', {
  method: 'POST', headers: auth,
  body: JSON.stringify({ title: 'E2E Added Module', duration: 'Week 16', summary: 'Creation test', learningOutcomes: ['Create modules'], practicalLabs: ['Admin lab'], exampleTickets: ['CUR-001'], technologies: ['TechLabs'], published: true }),
});
if (created.number !== 16 || created.title !== 'E2E Added Module') throw new Error('New module was not assigned the next module number');

const original = adminData.courseModules.find(module => module.number === 1);
const updated = await request('/admin/course-modules/1', {
  method: 'PUT', headers: auth,
  body: JSON.stringify({ ...original, title: 'E2E Curriculum Test Title', technologies: ['Windows 11', 'Ticketing'], published: false }),
});
if (updated.title !== 'E2E Curriculum Test Title' || updated.published !== false) throw new Error('Curriculum changes were not saved');

const publicData = await request('/data');
const publicModule = publicData.courseModules.find(module => module.number === 1);
if (!publicModule || publicModule.title !== updated.title || publicModule.published !== false) throw new Error('Updated curriculum was not returned publicly');

const audit = await request('/admin/audit-logs', { headers: auth });
if (!audit.some(record => record.action === 'CURRICULUM_MODULE_UPDATED' && record.entityId === '1')) throw new Error('Curriculum update was not audited');
if (!audit.some(record => record.action === 'CURRICULUM_MODULE_CREATED' && record.entityId === '16')) throw new Error('Curriculum creation was not audited');

console.log('Curriculum E2E passed: defaults, module creation, admin update, publish state, public read, and audit log.');

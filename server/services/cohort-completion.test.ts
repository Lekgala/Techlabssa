import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCohortCompletionPreview } from './cohort-completion.ts';

const cohort = { id: 'cohort-1', name: 'Test Cohort', courseId: 'course', startDate: '2026-01-01', endDate: '2026-03-01', scheduleFormat: 'Weekends', deliveryMode: '100% Virtual Learning' as const, location: 'Online', capacity: 10, enrolledCount: 2, status: 'In Progress' as const };
const application = (id: string, email: string) => ({ id, referenceNumber: id, firstName: 'Test', lastName: id, email, whatsapp: '1', city: 'Cape Town', province: 'Western Cape', highestQualification: 'Matric', itExperienceYears: '0', currentEmploymentStatus: 'Student', currentRole: 'Student', technologiesKnown: [], laptopBrand: 'Test', cpu: 'Test', ramGB: 16, storageType: 'SSD', freeStorageGB: 100, os: 'Windows', hasVirtualizationEnabled: true, isLaptopCompliant: true, selectedTier: 'PROFESSIONAL' as const, cohortId: cohort.id, acceptedTerms: true, acceptedPrivacy: true, marketingConsent: false, status: 'ENROLLED' as const, submissionDate: '2026-01-01' });

test('cohort completion preview blocks unpaid and ungraded students', () => {
  const applications = [application('student-1', 'one@example.test'), application('student-2', 'two@example.test')];
  const preview = buildCohortCompletionPreview({ cohorts: [cohort], applications, certificates: [], invoices: [
    { id: 'inv-1', invoiceNumber: '1', studentName: 'One', studentEmail: 'one@example.test', courseTier: 'PROFESSIONAL', amountZAR: 1000, depositZAR: 1000, balanceZAR: 0, paymentOption: 'FULL', status: 'VERIFIED', dueDate: '2026-01-01' },
    { id: 'inv-2', invoiceNumber: '2', studentName: 'Two', studentEmail: 'two@example.test', courseTier: 'PROFESSIONAL', amountZAR: 1000, depositZAR: 1000, balanceZAR: 500, paymentOption: 'FULL', status: 'PENDING', dueDate: '2026-01-01' },
  ], assessments: [{ id: 'assess-1', studentId: 'student-1', title: 'Final', moduleNumber: 15, type: 'Scenario Simulation', totalMarks: 100, dueDate: '2026-03-01', status: 'Graded', studentScore: 85, instructions: '' }] }, cohort.id);
  assert.equal(preview?.canComplete, false);
  assert.equal(preview?.eligibleCount, 1);
  assert.deepEqual(preview?.students[1].blockers, ['Outstanding balance: R500', 'Final assessment is missing']);
});

test('an existing certificate keeps a graduate eligible and completion is idempotent', () => {
  const student = { ...application('student-1', 'one@example.test'), status: 'COMPLETED' as const };
  const certificate = { id: 'cert-1', studentId: student.id, certificateNumber: 'TLS-2026-00125', studentName: 'Test student-1', courseName: 'Course', completionDate: '2026-03-01', instructorName: 'Instructor', verificationUrl: 'https://techlabssa.co.za/verify/TLS-2026-00125', qrCodeData: 'https://techlabssa.co.za/verify/TLS-2026-00125', skillsAcquired: [] };
  const preview = buildCohortCompletionPreview({ cohorts: [{ ...cohort, status: 'Completed' }], applications: [student], assessments: [], certificates: [certificate], invoices: [] }, cohort.id);
  assert.equal(preview?.students[0].eligible, true);
  assert.equal(preview?.canComplete, false);
});

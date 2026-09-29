import assert from 'node:assert/strict';
import test from 'node:test';
import type { Cohort } from '../../src/types';
import { CohortLifecycleError, publicCohorts, setCohortArchiveState } from './cohort-lifecycle.ts';

const cohort = (status: Cohort['status'] = 'Completed'): Cohort => ({ id: 'cohort-1', name: 'Test Cohort', courseId: 'course', startDate: '2026-01-01', endDate: '2026-03-01', scheduleFormat: 'Weekends', deliveryMode: '100% Virtual Learning', location: 'Online', capacity: 20, enrolledCount: 12, status });

test('only completed cohorts can be archived', () => {
  assert.throws(() => setCohortArchiveState(cohort('In Progress'), true, 'admin@example.test'), (error: unknown) => error instanceof CohortLifecycleError && error.status === 409);
});

test('archiving preserves the cohort and restoration removes archive metadata', () => {
  const record = cohort();
  setCohortArchiveState(record, true, 'admin@example.test', new Date('2026-03-02T08:00:00.000Z'));
  assert.equal(record.archivedAt, '2026-03-02T08:00:00.000Z');
  assert.equal(record.archivedBy, 'admin@example.test');
  assert.equal(record.enrolledCount, 12);
  assert.deepEqual(publicCohorts([record]), []);
  setCohortArchiveState(record, false, 'admin@example.test');
  assert.equal(record.archivedAt, undefined);
  assert.equal(record.archivedBy, undefined);
  assert.deepEqual(publicCohorts([record]), [record]);
});

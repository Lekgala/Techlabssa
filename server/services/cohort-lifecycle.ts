import type { Cohort } from '../../src/types';

export class CohortLifecycleError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const publicCohorts = (cohorts: Cohort[]) => cohorts.filter(cohort => !cohort.archivedAt);

export function setCohortArchiveState(cohort: Cohort, archived: boolean, actorEmail: string, now = new Date()): Cohort {
  if (archived && cohort.status !== 'Completed') throw new CohortLifecycleError(409, 'Complete the cohort before archiving it');
  if (archived) {
    cohort.archivedAt = cohort.archivedAt || now.toISOString();
    cohort.archivedBy = actorEmail;
  } else {
    delete cohort.archivedAt;
    delete cohort.archivedBy;
  }
  return cohort;
}

import type { Application, Assessment, Certificate, Cohort, Invoice } from '../../src/types';

type CompletionData = {
  applications: Application[];
  assessments: Assessment[];
  certificates: Certificate[];
  cohorts: Cohort[];
  invoices: Invoice[];
};

export type CohortCompletionStudent = {
  applicationId: string;
  name: string;
  email: string;
  status: Application['status'];
  eligible: boolean;
  blockers: string[];
  invoiceBalanceZAR?: number;
  finalAssessmentScore?: number;
  certificateNumber?: string;
  skillsVerified: boolean;
  skillsVerifiedBy?: string;
};

export type CohortCompletionPreview = {
  cohortId: string;
  cohortName: string;
  cohortStatus: Cohort['status'];
  endDate: string;
  canComplete: boolean;
  eligibleCount: number;
  blockedCount: number;
  students: CohortCompletionStudent[];
};

export function buildCohortCompletionPreview(data: CompletionData, cohortId: string): CohortCompletionPreview | undefined {
  const cohort = data.cohorts.find(item => item.id === cohortId);
  if (!cohort) return undefined;
  const applications = data.applications.filter(item => item.cohortId === cohortId && ['ENROLLED', 'COMPLETED'].includes(item.status));
  const students = applications.map(application => {
    const certificate = data.certificates.find(item => item.studentId === application.id);
    const invoice = data.invoices.find(item => item.studentEmail.toLowerCase() === application.email.toLowerCase());
    const finalAssessment = data.assessments.find(item => item.studentId === application.id && item.moduleNumber === 15);
    const blockers: string[] = [];
    if (!certificate) {
      if (!invoice) blockers.push('Invoice is missing');
      else if (invoice.balanceZAR > 0) blockers.push(`Outstanding balance: R${invoice.balanceZAR.toLocaleString('en-ZA')}`);
      if (!application.completionSkillsVerifiedAt) blockers.push('Practical skills have not been verified by an administrator');
    }
    return {
      applicationId: application.id,
      name: `${application.firstName} ${application.lastName}`,
      email: application.email,
      status: application.status,
      eligible: blockers.length === 0,
      blockers,
      invoiceBalanceZAR: invoice?.balanceZAR,
      finalAssessmentScore: finalAssessment?.studentScore,
      certificateNumber: certificate?.certificateNumber,
      skillsVerified: Boolean(application.completionSkillsVerifiedAt || certificate),
      skillsVerifiedBy: application.completionSkillsVerifiedBy,
    };
  });
  const blockedCount = students.filter(item => !item.eligible).length;
  return {
    cohortId: cohort.id,
    cohortName: cohort.name,
    cohortStatus: cohort.status,
    endDate: cohort.endDate,
    canComplete: cohort.status !== 'Completed' && students.length > 0 && blockedCount === 0,
    eligibleCount: students.length - blockedCount,
    blockedCount,
    students,
  };
}

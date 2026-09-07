export type LabRunState = 'READY' | 'APPLYING' | 'ACTIVE' | 'VERIFYING' | 'VERIFIED' | 'RESETTING' | 'RESET' | 'UNKNOWN';
export interface LabAttempt {
  id: string;
  action: 'apply' | 'verify' | 'reset';
  actorId: string;
  startedAt: string;
  finishedAt?: string;
  outcome: 'PENDING' | 'SUCCESS' | 'NOT_RESOLVED' | 'UNKNOWN';
  notes?: string;
}
export interface LabRun {
  id: string;
  mode?: 'INSTRUCTOR_TEST' | 'STUDENT_ASSIGNMENT';
  ticketId?: string;
  studentId?: string;
  faultId: string;
  agentId: string;
  state: LabRunState;
  createdAt: string;
  attempts: LabAttempt[];
}
export interface LabPilotView {
  configured: boolean;
  setup?: { addressConfigured: boolean; keyConfigured: boolean; identityConfigured: boolean; localMachine: boolean };
  machineName: string;
  enabledFaults: string[];
  runs: LabRun[];
  tickets?: { id: string; label: string; studentId: string }[];
}

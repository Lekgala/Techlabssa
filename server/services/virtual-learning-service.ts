import { VirtualSession, SessionAttendance, VirtualLearningSettings, SessionPlatform, VirtualSessionStatus, AttendanceStatus } from '../../src/types';

export interface CreateSessionOptions {
  cohortId: string;
  sessionNumber: number;
  topic: string;
  moduleNumber?: number;
  scheduledDate: string; // YYYY-MM-DD
  scheduledStartTime: string; // HH:MM
  scheduledEndTime: string; // HH:MM
  platform: SessionPlatform;
  meetingLink: string;
  meetingId?: string;
  passcode?: string;
  instructorId: string;
  instructorName: string;
  description: string;
  agenda: string[];
}

export interface RecordAttendanceOptions {
  sessionId: string;
  cohortId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  attendanceStatus: AttendanceStatus;
  joinedAt?: string;
  leftAt?: string;
  durationMinutes?: number;
  notes?: string;
}

export class VirtualLearningService {
  private sessions: Map<string, VirtualSession> = new Map();
  private attendance: Map<string, SessionAttendance[]> = new Map();
  private settings: Map<string, VirtualLearningSettings> = new Map();

  /**
   * Create a new virtual session
   */
  createSession(options: CreateSessionOptions): VirtualSession {
    const session: VirtualSession = {
      id: `vsess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cohortId: options.cohortId,
      sessionNumber: options.sessionNumber,
      topic: options.topic,
      moduleNumber: options.moduleNumber,
      status: 'SCHEDULED',
      scheduledDate: options.scheduledDate,
      scheduledStartTime: options.scheduledStartTime,
      scheduledEndTime: options.scheduledEndTime,
      platform: options.platform,
      meetingLink: options.meetingLink,
      meetingId: options.meetingId,
      passcode: options.passcode,
      recordingUrl: undefined,
      instructorId: options.instructorId,
      instructorName: options.instructorName,
      description: options.description,
      agenda: options.agenda,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): VirtualSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions for a cohort
   */
  getSessionsByCohort(cohortId: string): VirtualSession[] {
    return Array.from(this.sessions.values()).filter(s => s.cohortId === cohortId);
  }

  /**
   * Update session status (e.g., SCHEDULED → LIVE → COMPLETED)
   */
  updateSessionStatus(sessionId: string, status: VirtualSessionStatus, recordingUrl?: string): VirtualSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.status = status;
    if (recordingUrl) session.recordingUrl = recordingUrl;
    session.updatedAt = new Date().toISOString();

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Record student attendance for a session
   */
  recordAttendance(options: RecordAttendanceOptions): SessionAttendance {
    const attendance: SessionAttendance = {
      id: `satt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: options.sessionId,
      cohortId: options.cohortId,
      studentId: options.studentId,
      studentName: options.studentName,
      studentEmail: options.studentEmail,
      joinedAt: options.joinedAt,
      leftAt: options.leftAt,
      attendanceStatus: options.attendanceStatus,
      durationMinutes: options.durationMinutes,
      notes: options.notes,
      recordedAt: new Date().toISOString(),
    };

    if (!this.attendance.has(options.sessionId)) {
      this.attendance.set(options.sessionId, []);
    }
    this.attendance.get(options.sessionId)!.push(attendance);

    return attendance;
  }

  /**
   * Get attendance records for a session
   */
  getSessionAttendance(sessionId: string): SessionAttendance[] {
    return this.attendance.get(sessionId) || [];
  }

  /**
   * Get attendance records for a student across sessions
   */
  getStudentSessionAttendance(cohortId: string, studentId: string): SessionAttendance[] {
    const allRecords: SessionAttendance[] = [];
    this.attendance.forEach(records => {
      allRecords.push(...records.filter(r => r.cohortId === cohortId && r.studentId === studentId));
    });
    return allRecords;
  }

  /**
   * Calculate attendance statistics for a cohort
   */
  getCohortAttendanceStats(cohortId: string): {
    totalSessions: number;
    completedSessions: number;
    avgAttendancePercentage: number;
    studentStats: Array<{
      studentId: string;
      studentName: string;
      sessionsAttended: number;
      attendancePercentage: number;
    }>;
  } {
    const sessions = this.getSessionsByCohort(cohortId);
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
    
    const studentMap = new Map<string, { name: string; attended: number; total: number }>();
    
    sessions.forEach(session => {
      const records = this.getSessionAttendance(session.id);
      records.forEach(record => {
        if (!studentMap.has(record.studentId)) {
          studentMap.set(record.studentId, { name: record.studentName, attended: 0, total: 0 });
        }
        const stats = studentMap.get(record.studentId)!;
        stats.total++;
        if (record.attendanceStatus === 'PRESENT' || record.attendanceStatus === 'LATE') {
          stats.attended++;
        }
      });
    });

    const studentStats = Array.from(studentMap.entries()).map(([id, stats]) => ({
      studentId: id,
      studentName: stats.name,
      sessionsAttended: stats.attended,
      attendancePercentage: stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0,
    }));

    const totalAttendancePercentage = studentStats.length > 0 
      ? Math.round(studentStats.reduce((sum, s) => sum + s.attendancePercentage, 0) / studentStats.length)
      : 0;

    return {
      totalSessions: sessions.length,
      completedSessions,
      avgAttendancePercentage: totalAttendancePercentage,
      studentStats,
    };
  }

  /**
   * Setup virtual learning settings for a cohort
   */
  setupVirtualLearning(cohortId: string, settings: Partial<VirtualLearningSettings>): VirtualLearningSettings {
    const virtualSettings: VirtualLearningSettings = {
      id: `vset-${cohortId}`,
      cohortId,
      deliveryMode: settings.deliveryMode || 'VIRTUAL',
      defaultPlatform: settings.defaultPlatform || 'TEAMS',
      recordSessions: settings.recordSessions ?? true,
      requireCameraForAttendance: settings.requireCameraForAttendance ?? false,
      autoMarkAttendance: settings.autoMarkAttendance ?? true,
      attendanceThreshold: settings.attendanceThreshold ?? 80,
      enableChat: settings.enableChat ?? true,
      enableScreenShare: settings.enableScreenShare ?? true,
      enableRecording: settings.enableRecording ?? true,
      sessionNotificationMinutes: settings.sessionNotificationMinutes ?? 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.settings.set(cohortId, virtualSettings);
    return virtualSettings;
  }

  /**
   * Get virtual learning settings for a cohort
   */
  getVirtualLearningSettings(cohortId: string): VirtualLearningSettings | undefined {
    return this.settings.get(cohortId);
  }

  /**
   * Update virtual learning settings
   */
  updateVirtualLearningSettings(cohortId: string, updates: Partial<VirtualLearningSettings>): VirtualLearningSettings | undefined {
    const current = this.settings.get(cohortId);
    if (!current) return undefined;

    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    this.settings.set(cohortId, updated);
    return updated;
  }

  /**
   * Generate session statistics
   */
  getSessionStats(sessionId: string): {
    session: VirtualSession | undefined;
    totalAttendees: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    excusedCount: number;
    avgDurationMinutes: number;
    attendancePercentage: number;
  } {
    const session = this.getSession(sessionId);
    const records = this.getSessionAttendance(sessionId);

    const stats = {
      presentCount: records.filter(r => r.attendanceStatus === 'PRESENT').length,
      lateCount: records.filter(r => r.attendanceStatus === 'LATE').length,
      absentCount: records.filter(r => r.attendanceStatus === 'ABSENT').length,
      excusedCount: records.filter(r => r.attendanceStatus === 'EXCUSED').length,
    };

    const attended = stats.presentCount + stats.lateCount;
    const totalAttendees = records.length;
    const avgDuration = records.length > 0 
      ? Math.round(records.reduce((sum, r) => sum + (r.durationMinutes || 0), 0) / records.length)
      : 0;

    return {
      session,
      totalAttendees,
      presentCount: stats.presentCount,
      lateCount: stats.lateCount,
      absentCount: stats.absentCount,
      excusedCount: stats.excusedCount,
      avgDurationMinutes: avgDuration,
      attendancePercentage: totalAttendees > 0 ? Math.round((attended / totalAttendees) * 100) : 0,
    };
  }

  /**
   * Get upcoming sessions for a cohort (next 7 days)
   */
  getUpcomingSessions(cohortId: string): VirtualSession[] {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.getSessionsByCohort(cohortId)
      .filter(s => s.status === 'SCHEDULED')
      .filter(s => {
        const sessionDate = new Date(`${s.scheduledDate}T${s.scheduledStartTime}`);
        return sessionDate >= now && sessionDate <= oneWeekFromNow;
      })
      .sort((a, b) => `${a.scheduledDate}T${a.scheduledStartTime}`.localeCompare(`${b.scheduledDate}T${b.scheduledStartTime}`));
  }

  /**
   * Generate sample data for demo/testing
   */
  generateSampleSessions(cohortId: string): VirtualSession[] {
    const sessions: VirtualSession[] = [];
    const topics = [
      'Active Directory Fundamentals',
      'Group Policy Objects (GPO)',
      'User and Computer Management',
      'Windows Server Security',
      'Network Troubleshooting',
    ];

    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i * 7); // One session per week
      
      sessions.push(this.createSession({
        cohortId,
        sessionNumber: i + 1,
        topic: topics[i],
        moduleNumber: i + 1,
        scheduledDate: date.toISOString().split('T')[0],
        scheduledStartTime: '18:30',
        scheduledEndTime: '20:00',
        platform: 'TEAMS',
        meetingLink: `https://teams.microsoft.com/l/meetup-join/cohort-${cohortId}-session-${i + 1}`,
        meetingId: `teamsmeeting${cohortId}${i + 1}`,
        instructorId: 'instr-001',
        instructorName: 'TechLabs Instructor',
        description: `Learn ${topics[i]} with live demonstrations and Q&A.`,
        agenda: [
          'Welcome & recap from last week',
          `Deep dive: ${topics[i]}`,
          'Hands-on demo',
          'Q&A and troubleshooting',
          'Resources and next week preview',
        ],
      }));
    }

    return sessions;
  }
}

// Export singleton instance
export const virtualLearningService = new VirtualLearningService();

import type { Cohort, CourseModule } from '../types';

export type ScheduledCourseModule = CourseModule & {
  scheduledStartDate: string;
  scheduledEndDate: string;
  scheduleLabel: string;
};

const parseDate = (value: string) => new Date(`${value}T12:00:00.000Z`);
const isoDate = (value: Date) => value.toISOString().slice(0, 10);
const displayDate = (value: Date) => value.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const buildCurriculumSchedule = (modules: CourseModule[], cohort?: Cohort): ScheduledCourseModule[] => {
  if (!cohort || !modules.length) return modules.map(module => ({ ...module, scheduledStartDate: '', scheduledEndDate: '', scheduleLabel: module.duration }));
  const cohortStart = parseDate(cohort.startDate); const cohortEnd = parseDate(cohort.endDate);
  if (!Number.isFinite(cohortStart.getTime()) || !Number.isFinite(cohortEnd.getTime()) || cohortEnd < cohortStart) return modules.map(module => ({ ...module, scheduledStartDate: '', scheduledEndDate: '', scheduleLabel: module.duration }));
  const totalDays = Math.max(modules.length, Math.round((cohortEnd.getTime() - cohortStart.getTime()) / 86_400_000) + 1);
  return modules.map((module, index) => {
    const startOffset = Math.floor((index * totalDays) / modules.length);
    const nextOffset = Math.floor(((index + 1) * totalDays) / modules.length);
    const start = new Date(cohortStart.getTime() + startOffset * 86_400_000);
    const end = index === modules.length - 1 ? cohortEnd : new Date(cohortStart.getTime() + Math.max(startOffset, nextOffset - 1) * 86_400_000);
    return { ...module, startDate: isoDate(start), scheduledStartDate: isoDate(start), scheduledEndDate: isoDate(end), scheduleLabel: `${displayDate(start)} - ${displayDate(end)}` };
  });
};

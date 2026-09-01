import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { buildCurriculumSchedule } from '../../lib/curriculumSchedule';
import {
  Server, 
  Clock, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  ArrowRight, 
  Layers, 
  Laptop, 
  ShieldCheck, 
  FileText,
  Terminal,
  Sparkles
} from 'lucide-react';

const selectNextCohort = <T extends { status?: string; startDate?: string }>(cohorts: T[] = []) => {
  const byStartDate = (left: T, right: T) => (left.startDate || '').localeCompare(right.startDate || '');
  return cohorts
    .filter(cohort => !['Closed', 'Completed'].includes(cohort.status || ''))
    .sort(byStartDate)[0] || [...cohorts].sort(byStartDate)[0];
};

const formatCohortDate = (value?: string) => {
  if (!value) return 'To be announced';
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : value;
};

export const CourseDetail: React.FC = () => {
  const { navigate, courseModules, cohorts } = useApp();
  const nextCohort = useMemo(() => selectNextCohort(cohorts), [cohorts]);
  const scheduledModules = useMemo(() => buildCurriculumSchedule(courseModules || [], nextCohort), [courseModules, nextCohort]);

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      {/* Header Banner */}
      <section className="bg-[#FAFAFA] text-[#1A1A1A] py-16 border-b border-[#F0F0F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#FFFFFF] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] font-bold">
            Flagship Practical Bootcamp • Cape Town & Hybrid
          </div>

          <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight leading-tight">
            IT Support & Enterprise Administration Bootcamp
          </h1>

          <p className="text-sm sm:text-base text-[#707070] max-w-3xl leading-relaxed">
            A comprehensive, hands-on 15-module training program designed to transform beginners, IT graduates, and junior technicians into competent, job-ready IT administrators through real VMware virtualization and enterprise helpdesk simulations.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-mono">
            <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              <span className="text-[#A0A0A0] block text-[10px] uppercase tracking-wider">Duration:</span>
              <strong className="text-[#000000] text-xs">8–12 Weeks</strong>
            </div>
            <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              <span className="text-[#A0A0A0] block text-[10px] uppercase tracking-wider">Next Cohort:</span>
              <strong className="text-[#000000] text-xs">{nextCohort?.name || 'To be announced'}</strong>
            </div>
            <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              <span className="text-[#A0A0A0] block text-[10px] uppercase tracking-wider">Level:</span>
              <strong className="text-[#000000] text-xs">Beginner → Junior IT</strong>
            </div>
            <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              <span className="text-[#A0A0A0] block text-[10px] uppercase tracking-wider">Course Dates:</span>
              <strong className="text-[#000000] text-xs">{nextCohort ? `${formatCohortDate(nextCohort.startDate)} - ${formatCohortDate(nextCohort.endDate)}` : 'To be announced'}</strong>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/apply')}
              className="px-8 py-3.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply for Next Intake</span>
            </button>
            <button
              onClick={() => navigate('/courses/it-support/curriculum')}
              className="px-6 py-3.5 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold text-xs uppercase tracking-[0.2em] rounded-xl border border-[#E0E0E0] transition"
            >
              Explore 15-Module Timeline
            </button>
          </div>
        </div>
      </section>

      {/* Target Audiences */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000] bg-[#FAFAFA] px-3 py-1 rounded-full border border-[#E0E0E0]">
            Target Cohort
          </span>
          <h2 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
            Who This Program Is Built For
          </h2>
          <p className="text-xs text-[#707070]">
            Engineered specifically for individuals who want tangible practical ability rather than passive certificates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAFAFA] border border-[#E0E0E0] text-[#000000] font-mono text-xs font-bold flex items-center justify-center">01</div>
            <h3 className="font-bold text-sm text-[#000000]">IT Graduates</h3>
            <p className="text-xs text-[#707070] leading-relaxed">
              You have a Computer Science degree or IT diploma, but struggle to land roles because interviewers ask for practical Active Directory, Intune, and helpdesk experience you were never taught in university.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAFAFA] border border-[#E0E0E0] text-[#000000] font-mono text-xs font-bold flex items-center justify-center">02</div>
            <h3 className="font-bold text-sm text-[#000000]">Career Changers</h3>
            <p className="text-xs text-[#707070] leading-relaxed">
              You are working in retail, hospitality, or administration and want to transition into a well-paying, stable IT career with real, demonstrable skills.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAFAFA] border border-[#E0E0E0] text-[#000000] font-mono text-xs font-bold flex items-center justify-center">03</div>
            <h3 className="font-bold text-sm text-[#000000]">Junior IT Technicians</h3>
            <p className="text-xs text-[#707070] leading-relaxed">
              You are currently doing basic cable swapping or password resets, but want to master Microsoft 365 tenant admin, Intune compliance, Defender XDR, and PowerShell to step up to Junior SysAdmin.
            </p>
          </div>
        </div>
      </section>

      {/* Curriculum Summary Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A0A0A0] font-bold">
              15 Progressive Modules
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
              Curriculum Overview
            </h2>
            {nextCohort && (
              <p className="text-xs text-[#707070] mt-2">
                Dates shown for {nextCohort.name}. They update automatically when the cohort dates change.
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/courses/it-support/curriculum')}
            className="text-xs font-bold text-[#000000] hover:underline flex items-center gap-1 uppercase tracking-wider"
          >
            <span>View Detailed Week-by-Week Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scheduledModules.map((mod) => (
            <div key={mod.number} className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#F0F0F0] hover:border-[#000000] space-y-3 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-2 py-0.5 rounded">
                  Module {mod.number}
                </span>
                <span className="text-[10px] font-mono text-[#A0A0A0]">{mod.scheduleLabel}</span>
              </div>
              <h3 className="font-bold text-sm text-[#000000]">{mod.title}</h3>
              <p className="text-xs text-[#707070] line-clamp-2">{mod.summary}</p>
              <div className="pt-2 border-t border-[#F0F0F0] flex flex-wrap gap-1">
                {mod.technologies.slice(0, 3).map((t, idx) => (
                  <span key={idx} className="text-[10px] font-mono bg-[#FAFAFA] text-[#707070] px-1.5 py-0.5 rounded border border-[#E0E0E0]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Laptop & Lab Prerequisites */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAFAFA] text-[#1A1A1A] rounded-2xl p-8 sm:p-12 border border-[#E0E0E0] space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A0A0A0] font-bold">
              Hardware Requirements
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
              Student Laptop Specifications
            </h2>
            <p className="text-xs text-[#707070]">
              Because practical VMware labs run locally on your machine, your laptop must meet our minimum operational benchmark.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-1">
              <span className="text-[#A0A0A0] text-[10px] uppercase">RAM:</span>
              <strong className="text-[#000000] text-sm block font-sans">16 GB RAM</strong>
              <p className="text-[10px] text-[#707070]">Concurrent Server + Win 11 VMs</p>
            </div>
            <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-1">
              <span className="text-[#A0A0A0] text-[10px] uppercase">Storage:</span>
              <strong className="text-[#000000] text-sm block font-sans">500 GB SSD</strong>
              <p className="text-[10px] text-[#707070]">Min 150 GB free NVMe/SSD space</p>
            </div>
            <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-1">
              <span className="text-[#A0A0A0] text-[10px] uppercase">CPU:</span>
              <strong className="text-[#000000] text-sm block font-sans">Intel Core i5 / Ryzen 5</strong>
              <p className="text-[10px] text-[#707070]">Virtualization (VT-x) enabled</p>
            </div>
            <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] space-y-1">
              <span className="text-[#A0A0A0] text-[10px] uppercase">OS:</span>
              <strong className="text-[#000000] text-sm block font-sans">Windows 10/11 64-bit</strong>
              <p className="text-[10px] text-[#707070]">Host for VMware Workstation</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-4">
        <h3 className="text-2xl font-light text-[#000000] tracking-tight">
          Ready to join the next intake?
        </h3>
        <p className="text-xs text-[#707070]">
          Intakes are strictly limited to 15 students per cohort to ensure one-on-one lab guidance.
        </p>
        <button
          onClick={() => navigate('/apply')}
          className="px-8 py-3.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition"
        >
          Submit Student Application
        </button>
      </section>
    </div>
  );
};

export const Curriculum: React.FC = () => {
  const { navigate, courseModules, cohorts } = useApp();
  const defaultCohort = useMemo(() => selectNextCohort(cohorts), [cohorts]);
  const [selectedCohortId, setSelectedCohortId] = useState(defaultCohort?.id || '');
  const selectedCohort = cohorts.find(cohort => cohort.id === selectedCohortId) || defaultCohort;
  const scheduledModules = useMemo(() => buildCurriculumSchedule(courseModules || [], selectedCohort), [courseModules, selectedCohort]);

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <button
          onClick={() => navigate('/courses/it-support')}
          className="text-xs font-bold text-[#000000] hover:underline flex items-center gap-1 uppercase tracking-wider"
        >
          ← Back to Course Overview
        </button>

        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#000000] bg-[#FAFAFA] px-3 py-1 rounded-full border border-[#E0E0E0] font-bold">
            Complete Syllabus & Lab Matrix
          </span>
          <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight">
            Detailed 15-Module Curriculum
          </h1>
          <p className="text-sm text-[#707070] max-w-3xl">
            Each module is anchored by three concrete pillars: theoretical foundations, hands-on VMware/Cloud labs, and realistic enterprise helpdesk tickets.
          </p>
          {selectedCohort && <div className="max-w-md space-y-1 pt-2"><label className="text-[10px] font-bold uppercase tracking-wider">Curriculum dates for</label><select value={selectedCohort.id} onChange={event => setSelectedCohortId(event.target.value)} className="w-full p-3 bg-white border border-[#E0E0E0] rounded-xl text-xs font-bold">{cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>{cohort.name} ({cohort.startDate} - {cohort.endDate})</option>)}</select></div>}
        </div>
      </div>

      {/* 15 Modules Timeline */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {scheduledModules.map((module) => (
          <div 
            key={module.number}
            className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-6 sm:p-8 space-y-6 hover:border-[#000000] transition"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0F0F0] pb-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#000000] text-white font-mono font-bold text-xs flex items-center justify-center">
                  M{module.number}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-[#000000]">{module.title}</h2>
                  <span className="text-xs text-[#707070] font-mono">{module.scheduleLabel}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {module.technologies.map((tech, idx) => (
                  <span key={idx} className="text-[10px] font-mono bg-[#FAFAFA] text-[#707070] px-2 py-0.5 rounded border border-[#E0E0E0]">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Summary */}
            <p className="text-xs text-[#707070] leading-relaxed">
              {module.summary}
            </p>

            {/* 3-Column Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs pt-2">
              {/* Learning Outcomes */}
              <div className="space-y-2 bg-[#FAFAFA] p-4 rounded-xl border border-[#E0E0E0]">
                <h4 className="font-bold text-[#000000] uppercase tracking-[0.2em] text-[10px]">
                  What You Will Learn:
                </h4>
                <ul className="space-y-2 text-[#707070]">
                  {module.learningOutcomes.map((out, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#000000] shrink-0 mt-0.5" />
                      <span className="text-xs">{out}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Practical Labs */}
              <div className="space-y-2 bg-[#FAFAFA] p-4 rounded-xl border border-[#E0E0E0]">
                <h4 className="font-bold text-[#000000] uppercase tracking-[0.2em] text-[10px]">
                  Practical Labs:
                </h4>
                <ul className="space-y-2 text-[#1A1A1A]">
                  {module.practicalLabs.map((lab, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Layers className="w-3.5 h-3.5 text-[#000000] shrink-0 mt-0.5" />
                      <span className="font-medium text-xs">{lab}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Example Tickets */}
              <div className="space-y-2 bg-[#000000] text-white p-4 rounded-xl border border-[#222222]">
                <h4 className="font-bold text-white uppercase tracking-[0.2em] text-[10px]">
                  Example Helpdesk Tickets:
                </h4>
                <ul className="space-y-2 text-neutral-300">
                  {module.exampleTickets.map((tkt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Terminal className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <span className="font-mono text-[11px]">{tkt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="max-w-3xl mx-auto text-center space-y-4 px-4 pt-6">
        <button
          onClick={() => navigate('/apply')}
          className="px-8 py-3.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition"
        >
          Apply for the 15-Module Bootcamp
        </button>
      </div>
    </div>
  );
};

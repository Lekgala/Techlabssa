import React, { useMemo, useState } from 'react';
import type { Cohort } from '../../types';

interface VirtualLearningUIProps {
  cohorts: Cohort[];
}

const platformOptions = [
  { label: 'Microsoft Teams', value: 'TEAMS' },
  { label: 'Zoom', value: 'ZOOM' },
  { label: 'Google Meet', value: 'GOOGLE_MEET' },
  { label: 'Generic Link', value: 'GENERIC_LINK' },
] as const;

export const VirtualLearningUI: React.FC<VirtualLearningUIProps> = ({ cohorts }) => {
  const [selectedCohortId, setSelectedCohortId] = useState<string>(cohorts[0]?.id || '');
  const [deliveryMode, setDeliveryMode] = useState<'VIRTUAL' | 'HYBRID'>('VIRTUAL');
  const [sessionForm, setSessionForm] = useState({
    topic: 'Windows Server Hardening',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    startTime: '18:30',
    endTime: '20:00',
    platform: 'TEAMS',
    link: 'https://teams.microsoft.com/l/meetup-join/techlabs-virtual-session',
    description: 'Live troubleshooting and guided lab walkthrough',
  });

  const selectedCohort = useMemo(
    () => cohorts.find((cohort) => cohort.id === selectedCohortId) || cohorts[0],
    [cohorts, selectedCohortId],
  );

  const upcomingSessions = useMemo(
    () => [
      {
        title: 'Session 1 • Active Directory Fundamentals',
        date: '2026-09-02',
        startTime: '18:30',
        endTime: '20:00',
        platform: 'Teams',
      },
      {
        title: 'Session 2 • Group Policy & User Management',
        date: '2026-09-09',
        startTime: '18:30',
        endTime: '20:00',
        platform: 'Teams',
      },
      {
        title: 'Session 3 • VMware Lab Advanced Troubleshooting',
        date: '2026-09-16',
        startTime: '18:30',
        endTime: '20:00',
        platform: 'Zoom',
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#707070]">Cohorts</p>
            <h4 className="font-bold text-[#000000]">Virtual delivery setup</h4>
          </div>

          <div className="space-y-2">
            {cohorts.map((cohort) => (
              <button
                key={cohort.id}
                type="button"
                onClick={() => setSelectedCohortId(cohort.id)}
                className={`w-full text-left rounded-xl border p-3 transition ${
                  selectedCohort?.id === cohort.id
                    ? 'bg-[#000000] text-white border-[#000000]'
                    : 'bg-[#FAFAFA] border-[#E0E0E0] text-[#000000]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs">{cohort.name}</span>
                  <span className="text-[10px] opacity-80">{cohort.enrolledCount} seats</span>
                </div>
                <div className="mt-1 text-[10px] opacity-80">{cohort.deliveryMode}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#707070]">Selected cohort</p>
                <h4 className="font-bold text-[#000000] text-lg">{selectedCohort?.name || 'No cohort selected'}</h4>
              </div>
              <div className="px-3 py-1 rounded-full bg-[#F5F5F5] border border-[#E0E0E0] text-[10px] font-bold uppercase text-[#000000]">
                {selectedCohort?.status || 'Open'}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#707070]">Learning mode</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['VIRTUAL', 'HYBRID'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDeliveryMode(mode)}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] rounded-xl border transition ${
                        deliveryMode === mode
                          ? 'bg-[#000000] text-white border-[#000000]'
                          : 'bg-[#FAFAFA] text-[#000000] border-[#E0E0E0]'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#707070]">Session topic</label>
                  <input
                    value={sessionForm.topic}
                    onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                    className="w-full rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] p-3 text-[#000000] outline-none focus:border-[#000000]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#707070]">Platform</label>
                  <select
                    value={sessionForm.platform}
                    onChange={(e) => setSessionForm({ ...sessionForm, platform: e.target.value as any })}
                    className="w-full rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] p-3 text-[#000000] outline-none focus:border-[#000000]"
                  >
                    {platformOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#707070]">Date</label>
                  <input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    className="w-full rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] p-3 text-[#000000] outline-none focus:border-[#000000]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#707070]">Meeting link</label>
                  <input
                    value={sessionForm.link}
                    onChange={(e) => setSessionForm({ ...sessionForm, link: e.target.value })}
                    className="w-full rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] p-3 text-[#000000] outline-none focus:border-[#000000]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#707070]">Start time</label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] p-3 text-[#000000] outline-none focus:border-[#000000]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#707070]">End time</label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] p-3 text-[#000000] outline-none focus:border-[#000000]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#707070]">Description</label>
                <textarea
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] p-3 text-[#000000] outline-none focus:border-[#000000]"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2.5 bg-[#000000] text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em]"
                >
                  Save virtual mode
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 border border-[#E0E0E0] bg-[#FAFAFA] text-[#000000] rounded-xl text-[10px] font-bold uppercase tracking-[0.2em]"
                >
                  Schedule session
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#707070]">Upcoming sessions</p>
                <h4 className="font-bold text-[#000000] text-lg">Live learning schedule</h4>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#707070]">3 planned</span>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingSessions.map((session, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] p-4">
                  <div>
                    <div className="font-bold text-[#000000]">{session.title}</div>
                    <div className="mt-1 text-[11px] text-[#707070]">
                      {session.date} • {session.startTime} - {session.endTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-[#FFFFFF] border border-[#E0E0E0] text-[10px] font-bold uppercase tracking-[0.15em] text-[#000000]">
                      {session.platform}
                    </span>
                    <button type="button" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000]">
                      Open link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArchitectureDiagram } from '../../components/common/ArchitectureDiagram';
import { 
  Server, 
  Layers, 
  ShieldCheck, 
  Wrench, 
  CheckCircle, 
  Sparkles, 
  Terminal, 
  Laptop, 
  AlertTriangle,
  Flame,
  FileCheck
} from 'lucide-react';

export const Labs: React.FC = () => {
  const { navigate, labs } = useApp();

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
          Practical VMware & Cloud Sandbox
        </div>
        <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight">
          Your Classroom Is a Real IT Environment.
        </h1>
        <p className="text-sm sm:text-base text-[#707070] max-w-3xl mx-auto leading-relaxed">
          We don't use pre-recorded click-through slides. Every student builds and operates an isolated enterprise virtual lab running genuine Windows Server 2022, Active Directory, DNS, DHCP, Windows 11 clients, and controlled Microsoft 365 cloud management.
        </p>
      </section>

      {/* Interactive Topology Diagram */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ArchitectureDiagram />
      </section>

      {/* Lab Breakdown Details */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A0A0A0] font-bold">
            Controlled Academy Cloud Notice
          </span>
          <h2 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
            Real Technology with Safe Isolation
          </h2>
          <p className="text-xs text-[#707070]">
            Where cloud licensing and tenant capacity allow, students work in controlled academy Microsoft environments. Cloud access is managed by TechLabs Academy to keep the learning environment safe, isolated, and accessible without students needing personal Azure subscriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labs.map((lab) => (
            <div key={lab.id} className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] space-y-4 hover:border-[#000000] transition">
              <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-[#000000] text-white px-2.5 py-1 rounded">
                    Module {lab.moduleNumber} Lab
                  </span>
                  <span className="text-xs font-mono text-[#707070]">{lab.category}</span>
                </div>
                <span className="text-xs font-mono bg-[#FAFAFA] text-[#707070] px-2 py-0.5 rounded border border-[#E0E0E0]">
                  ~{lab.estimatedMinutes} Mins
                </span>
              </div>

              <h3 className="font-bold text-base text-[#000000]">{lab.title}</h3>

              <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#E0E0E0] text-xs font-mono text-[#1A1A1A] space-y-1">
                <span className="text-[#A0A0A0] uppercase text-[10px] block">Virtual Architecture:</span>
                <strong className="text-[#000000]">{lab.architecture}</strong>
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-[#000000] uppercase tracking-wider text-[10px]">Lab Objectives:</h4>
                <ul className="space-y-1.5 text-[#707070]">
                  {lab.objectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#000000] shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {lab.brokenScenario && (
                <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#E0E0E0] text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[#000000] font-bold text-[11px] uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#000000]" />
                    <span>The "Broken System" Fault:</span>
                  </div>
                  <p className="text-[#707070]">{lab.brokenScenario}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-4 pt-6">
        <h3 className="text-2xl font-light text-[#000000] tracking-tight">
          Build Your Own Enterprise IT Lab
        </h3>
        <p className="text-xs text-[#707070]">
          We provide the blueprints, official evaluation ISO mirrors, and step-by-step guidance.
        </p>
        <button
          onClick={() => navigate('/apply')}
          className="px-8 py-3.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition"
        >
          Apply for the Next Intake
        </button>
      </section>
    </div>
  );
};

export const HowItWorks: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
          Training Methodology & Schedule
        </div>
        <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight">
          How Practical IT Training Works
        </h1>
        <p className="text-sm sm:text-base text-[#707070] max-w-3xl mx-auto leading-relaxed">
          TechLabs Academy SA operates primarily through convenient evening classes and weekend practical deep-dives tailored for working professionals and students.
        </p>
      </section>

      {/* The 4-Step Cycle */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#FAFAFA] text-[#1A1A1A] p-6 rounded-2xl border border-[#E0E0E0] space-y-3">
            <span className="text-xs font-mono font-bold text-[#000000] uppercase tracking-wider block">01. BUILD</span>
            <h3 className="text-base font-bold text-[#000000]">Build The Infrastructure</h3>
            <p className="text-xs text-[#707070] leading-relaxed">
              You deploy your Domain Controller, configure DNS zones, create DHCP scopes, set up Active Directory OUs, and join client workstations.
            </p>
          </div>

          <div className="bg-[#FAFAFA] text-[#1A1A1A] p-6 rounded-2xl border border-[#E0E0E0] space-y-3">
            <span className="text-xs font-mono font-bold text-[#000000] uppercase tracking-wider block">02. BREAK</span>
            <h3 className="text-base font-bold text-[#000000]">Introduce Enterprise Faults</h3>
            <p className="text-xs text-[#707070] leading-relaxed">
              We corrupt your DNS SRV records, tamper with GPO permissions, disable BitLocker, or simulate credential lockouts.
            </p>
          </div>

          <div className="bg-[#FAFAFA] text-[#1A1A1A] p-6 rounded-2xl border border-[#E0E0E0] space-y-3">
            <span className="text-xs font-mono font-bold text-[#000000] uppercase tracking-wider block">03. FIX</span>
            <h3 className="text-base font-bold text-[#000000]">Investigate & Resolve</h3>
            <p className="text-xs text-[#707070] leading-relaxed">
              You inspect Windows Event Viewer logs, run PowerShell diagnostic cmdlets, isolate the root cause, and implement the enterprise repair.
            </p>
          </div>

          <div className="bg-[#FAFAFA] text-[#1A1A1A] p-6 rounded-2xl border border-[#E0E0E0] space-y-3">
            <span className="text-xs font-mono font-bold text-[#000000] uppercase tracking-wider block">04. VERIFY</span>
            <h3 className="text-base font-bold text-[#000000]">Verify & Document</h3>
            <p className="text-xs text-[#707070] leading-relaxed">
              You run health checks (dcdiag, ping, manage-bde, Intune sync), verify user access, and log your resolution in the helpdesk ticketing portal.
            </p>
          </div>
        </div>
      </section>

      {/* Weekly Schedule */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-8 space-y-6 shadow-sm">
          <h2 className="text-2xl font-light text-[#000000] tracking-tight">
            Typical Weekly Cohort Rhythm
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#000000] bg-[#FFFFFF] border border-[#E0E0E0] px-2 py-0.5 rounded uppercase">
                  Tuesday / Thursday Evening (18:30 - 20:30 SAST)
                </span>
                <h4 className="font-bold text-[#000000] text-sm mt-1">Live Technical Lecture & Lab Prep</h4>
                <p className="text-xs text-[#707070]">Conceptual walkthrough, architecture blueprints, and guided setup.</p>
              </div>
              <span className="text-xs font-mono text-[#A0A0A0]">2 Hours Live</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#000000] bg-[#FFFFFF] border border-[#E0E0E0] px-2 py-0.5 rounded uppercase">
                  Saturday Morning (09:00 - 13:00 SAST)
                </span>
                <h4 className="font-bold text-[#000000] text-sm mt-1">Intensive Practical Lab & Ticket Sprint</h4>
                <p className="text-xs text-[#707070]">Active troubleshooting, instructor debugging, and live simulated support tickets.</p>
              </div>
              <span className="text-xs font-mono text-[#A0A0A0]">4 Hours Lab</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#000000] bg-[#FFFFFF] border border-[#E0E0E0] px-2 py-0.5 rounded uppercase">
                  Midweek Self-Paced Practice & WhatsApp Support
                </span>
                <h4 className="font-bold text-[#000000] text-sm mt-1">Asynchronous Lab Repetition & Mentor Q&A</h4>
                <p className="text-xs text-[#707070]">Replay lectures, rebuild virtual machines, and get unblocked in the private group.</p>
              </div>
              <span className="text-xs font-mono text-[#A0A0A0]">Flexible</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4">
        <button
          onClick={() => navigate('/apply')}
          className="px-8 py-3.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition"
        >
          Join Our Next Cape Town Cohort
        </button>
      </section>
    </div>
  );
};

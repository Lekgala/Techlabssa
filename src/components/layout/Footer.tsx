import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Terminal, 
  MapPin, 
  Mail, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  ExternalLink,
  Lock,
  FileText
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate, settings } = useApp();

  return (
    <footer className="bg-[#FAFAFA] text-[#707070] pt-16 pb-12 border-t border-[#F0F0F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Callout Box */}
        <div className="bg-[#FFFFFF] p-8 sm:p-10 rounded-2xl border border-[#F0F0F0] mb-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-[0.2em] block">
              Practical South African IT Training
            </span>
            <h3 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
              Ready to engineer, diagnose, and master enterprise systems?
            </h3>
            <p className="text-sm text-[#707070] max-w-xl">
              Applications for upcoming Cape Town intakes are open. Cohorts are strictly capped at 15–20 engineers for intensive 1-on-1 mentoring.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/apply')}
              className="px-6 py-3 bg-[#000000] text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-colors shadow-sm"
            >
              Apply Online
            </button>
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi%20TechLabs%20Academy%20SA!%20I'd%20like%20to%20ask%20about%20the%20upcoming%20IT%20Support%20bootcamp.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-[#FFFFFF] hover:bg-[#FAFAFA] text-[#000000] text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl border border-[#E0E0E0] transition flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#F0F0F0]">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 bg-[#000000] rotate-45 flex items-center justify-center"></div>
              <span className="font-bold text-base tracking-tighter uppercase text-[#000000]">
                TECHLABS ACADEMY <span className="text-[10px] font-mono border border-[#E0E0E0] px-1.5 py-0.5 rounded text-[#A0A0A0]">SA</span>
              </span>
            </div>
            <p className="text-xs text-[#707070] leading-relaxed max-w-sm">
              We teach enterprise IT engineering through real hands-on systems, deliberate failure scenarios, and rigorous support ticket resolution.
            </p>
            <div className="space-y-2 text-xs text-[#707070] pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                <span>{settings.campusAddress || 'Cape Town, South Africa'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                <span>{settings.admissionsEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                <span>{settings.whatsappNumber} (Admissions Hotline)</span>
              </div>
            </div>
          </div>

          {/* Quick Links: Curriculum */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
              Curriculum & Labs
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => navigate('/courses/it-support')} className="hover:text-[#000000] transition">
                  IT Support Bootcamp
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/courses/it-support/curriculum')} className="hover:text-[#000000] transition">
                  15-Module Syllabus
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/labs')} className="hover:text-[#000000] transition">
                  VMware Virtual Sandboxes
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/how-it-works')} className="hover:text-[#000000] transition">
                  Build • Break • Fix
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/career')} className="hover:text-[#000000] transition">
                  Career Trajectories
                </button>
              </li>
            </ul>
          </div>

          {/* Admissions & Tuition */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
              Admissions
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => navigate('/pricing')} className="hover:text-[#000000] transition">
                  Tuition & Payment Plans
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/intakes')} className="hover:text-[#000000] transition">
                  Cape Town Intakes
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/apply')} className="hover:text-[#000000] transition">
                  Application Form
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/payment')} className="hover:text-[#000000] transition">
                  EFT & Card Guide
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/faq')} className="hover:text-[#000000] transition">
                  Admissions FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Portals & Legal */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
              Access & Policy
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => navigate('/student')} className="hover:text-[#000000] transition flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#A0A0A0]" />
                  <span>Student Portal</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/admin')} className="hover:text-[#000000] transition flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#A0A0A0]" />
                  <span>Admin Console</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/terms')} className="hover:text-[#000000] transition">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/privacy')} className="hover:text-[#000000] transition">
                  Privacy Policy (POPIA)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/verify/TLS-2026-00124')} className="hover:text-[#000000] transition">
                  Verify Certificate
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="pt-8 pb-6 text-[11px] text-[#A0A0A0] space-y-2 border-b border-[#F0F0F0]">
          <p className="font-bold uppercase tracking-wider text-[#707070]">
            Legal Notice:
          </p>
          <p className="leading-relaxed">
            TechLabs is a non-accredited practical IT skills training division operated by Madilotane Design (Pty) Ltd, registered in the Republic of South Africa. Its courses and completion certificates are not SAQA/NQF qualifications, SETA/QCTO-accredited awards, university qualifications, or Microsoft/vendor certifications. Technology names identify tools used in training and do not imply affiliation or endorsement.
          </p>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A0A0A0]">
          <p>© {new Date().getFullYear()} Madilotane Design (Pty) Ltd trading as TechLabs. All rights reserved.</p>
          <p className="font-mono text-[#707070]">Tagline: "Learn IT by Doing."</p>
        </div>
      </div>
    </footer>
  );
};

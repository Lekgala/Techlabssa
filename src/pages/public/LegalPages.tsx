import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CertificateView } from '../../components/common/CertificateView';
import { Certificate } from '../../types';
import { ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../../lib/api';

export const Courses: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-[0.2em]">
          Practical Course Catalog
        </div>
        <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight">
          IT Training Programs in Cape Town
        </h1>
        <p className="text-base sm:text-lg text-[#707070] max-w-2xl mx-auto leading-relaxed">
          Explore our hands-on engineering programs. Every course is centered around real virtualization and enterprise troubleshooting.
        </p>
      </section>

      {/* Featured Flagship Card */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAFAFA] text-[#1A1A1A] rounded-2xl border border-[#E0E0E0] p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="bg-[#000000] text-white font-bold text-[10px] px-3 py-1 rounded-full uppercase font-mono tracking-widest">
              Flagship Bootcamp
            </span>
            <span className="text-xs font-mono text-[#707070]">
              8–12 Weeks • Cape Town & Hybrid
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
              IT Support & Enterprise Administration Bootcamp
            </h2>
            <p className="text-xs sm:text-sm text-[#707070] mt-2 leading-relaxed">
              Master VMware Workstation, Windows Server 2022, Active Directory Domain Services, Group Policy, Microsoft 365, Microsoft Entra ID, Microsoft Intune MDM, Microsoft Defender for Endpoint, PowerShell 7, and Helpdesk ticket resolution.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              <span className="text-[#A0A0A0] block text-[10px] uppercase font-bold">Level:</span>
              <strong className="text-[#000000]">Beginner → Mid</strong>
            </div>
            <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              <span className="text-[#A0A0A0] block text-[10px] uppercase font-bold">Delivery:</span>
              <strong className="text-[#000000]">Evening + Weekend</strong>
            </div>
            <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              <span className="text-[#A0A0A0] block text-[10px] uppercase font-bold">Tuition:</span>
              <strong className="text-[#000000]">From R1,999</strong>
            </div>
            <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              <span className="text-[#A0A0A0] block text-[10px] uppercase font-bold">Intakes:</span>
              <strong className="text-[#000000]">Oct '26 / Jan '27</strong>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/courses/it-support')}
              className="px-6 py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] transition shadow"
            >
              View Full Course Details
            </button>
            <button
              onClick={() => navigate('/courses/it-support/curriculum')}
              className="px-5 py-3 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#E0E0E0] transition"
            >
              View 15-Module Curriculum
            </button>
            <button
              onClick={() => navigate('/apply')}
              className="px-5 py-3 bg-transparent hover:bg-[#E0E0E0]/50 text-[#000000] font-bold rounded-xl text-xs uppercase tracking-wider border border-[#000000] transition"
            >
              Apply Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export const VerifyCertificate: React.FC = () => {
  const [certInput, setCertInput] = useState('');
  const [foundCert, setFoundCert] = useState<Certificate | undefined>();
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFoundCert(await apiRequest<Certificate>(`/certificates/${encodeURIComponent(certInput.trim())}`));
    } catch {
      setFoundCert(undefined);
    }
    setSearched(true);
  };

  return (
    <div className="space-y-12 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-[0.2em]">
          <ShieldCheck className="w-4 h-4 text-[#000000]" />
          <span>TechLabs Completion Record Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light text-[#000000] tracking-tight">
          Verify TechLabs Academy Digital Certificate
        </h1>
        <p className="text-sm text-[#707070] max-w-xl mx-auto leading-relaxed">
          Enter a certificate number to confirm that TechLabs Academy issued the completion record. Verification confirms our internal record only; it does not indicate accredited or vendor-certified status.
        </p>

        {/* Verification search box */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-2 pt-2">
          <input
            type="text"
            value={certInput}
            onChange={(e) => setCertInput(e.target.value)}
            placeholder="e.g. TLS-2026-00124"
            className="flex-1 px-4 py-3 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-xs sm:text-sm font-mono uppercase text-[#000000] focus:border-[#000000] focus:outline-none shadow-sm"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition"
          >
            Verify
          </button>
        </form>
      </section>

      {/* Result Display */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {searched && (
          foundCert ? (
            <div className="space-y-6">
              <div className="bg-[#FAFAFA] border border-[#000000] p-4 rounded-xl flex items-center justify-between text-xs text-[#000000] font-medium">
                <div className="flex items-center gap-2 font-bold font-mono">
                  <CheckCircle className="w-4 h-4 text-[#000000] shrink-0" />
                  <span>TechLabs record confirmed: Certificate {foundCert.certificateNumber} was issued by TechLabs Academy SA.</span>
                </div>
                <span className="text-[11px] font-mono text-[#707070]">Issued by TechLabs Academy SA</span>
              </div>

              <CertificateView certificate={foundCert} allowPrint={true} />
            </div>
          ) : (
            <div className="bg-[#FAFAFA] border border-[#E0E0E0] p-8 rounded-2xl text-center space-y-3 max-w-md mx-auto">
              <AlertTriangle className="w-8 h-8 text-[#000000] mx-auto" />
              <h3 className="text-base font-bold text-[#000000]">Certificate Not Found</h3>
              <p className="text-xs text-[#707070] leading-relaxed">
                No certificate found matching reference "<strong>{certInput}</strong>". Please check the spelling or contact admissions at <strong>admissions@techlabs.co.za</strong>.
              </p>
            </div>
          )
        )}
      </section>
    </div>
  );
};

export const Terms: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 text-[#1A1A1A] text-xs sm:text-sm leading-relaxed bg-[#FFFFFF]">
    <div className="space-y-2 border-b border-[#E0E0E0] pb-4">
      <span className="text-xs font-mono text-[#707070] uppercase font-bold tracking-wider">Legal Terms of Service</span>
      <h1 className="text-3xl font-light text-[#000000] tracking-tight">Terms & Conditions</h1>
      <p className="text-[#707070]">Last updated: August 2026 • Madilotane Design (Pty) Ltd trading as TechLabs</p>
    </div>

    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">1. Nature of Training & Independent Status</h2>
        <p className="text-[#707070]">TechLabs is an independent practical IT training initiative owned and operated by Madilotane Design (Pty) Ltd, a private company registered in the Republic of South Africa. We teach hands-on enterprise troubleshooting using industry-standard tools including VMware Workstation, Windows Server, and Microsoft Cloud technologies. TechLabs and Madilotane Design (Pty) Ltd are independent entities and are not affiliated with or endorsed by Microsoft Corporation unless explicitly stated.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">2. Student Hardware Responsibility</h2>
        <p className="text-[#707070]">Because practical VMware virtualization labs execute locally on the student's hardware, students are required to supply a compliant laptop meeting our published benchmark (minimum 16 GB RAM, 500 GB SSD, Core i5/Ryzen 5, 64-bit Windows OS with hardware virtualization VT-x/AMD-V enabled).</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">3. Certificates of Completion</h2>
        <p className="text-[#707070]">Upon fulfilling all lab milestones and achieving an 80%+ passing benchmark on the final practical audit, students receive a verified TechLabs Academy Certificate of Completion. This certificate is a verifiable digital completion record and does not represent an accredited university qualification or official Microsoft certification voucher.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">4. Code of Conduct & Lab Security</h2>
        <p className="text-[#707070]">Students must adhere to ethical IT practices. Controlled academy cloud tenants and lab tools must never be utilized for unauthorized penetration testing, scraping, or non-educational activities.</p>
      </section>
    </div>
  </div>
);

export const Privacy: React.FC = () => {
  const { settings } = useApp();
  return (
  <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 text-[#1A1A1A] text-xs sm:text-sm leading-relaxed bg-[#FFFFFF]">
    <div className="space-y-2 border-b border-[#E0E0E0] pb-4">
      <span className="text-xs font-mono text-[#707070] uppercase font-bold tracking-wider">Data Privacy Notice</span>
      <h1 className="text-3xl font-light text-[#000000] tracking-tight">Privacy Policy (POPIA Compliant)</h1>
      <p className="text-[#707070]">Protection of Personal Information Act (POPIA) • South Africa • Version {settings.privacyPolicyVersion || '2026.09'}</p>
    </div>

    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">1. Information We Collect</h2>
        <p className="text-[#707070]">When you submit an application or contact inquiry, we collect personal information including your full name, email address, WhatsApp telephone number, city, IT background, and laptop specifications to assess cohort eligibility.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">2. How We Use Your Data</h2>
        <p className="text-[#707070]">Your information is used strictly to process your student admission, issue tuition invoices, provision your student portal access, and communicate essential timetable updates via WhatsApp and email.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">3. Non-Disclosure & Security</h2>
        <p className="text-[#707070]">We do not sell, rent, or distribute student personal information to third-party marketing brokers. All data is processed using modern encryption protocols.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">4. Essential Cookies</h2>
        <p className="text-[#707070]">The student and staff portals use an essential HttpOnly session cookie to keep authenticated accounts signed in. A separate security cookie helps protect authenticated form submissions against cross-site request forgery. These cookies are required for the portal to function, are not used for advertising or analytics, and are removed or expire when the session ends.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">5. Privacy Contact</h2>
        <p className="text-[#707070]">For privacy questions or information requests, contact <a className="underline text-[#000000]" href={`mailto:${settings.privacyContactEmail || settings.admissionsEmail}`}>{settings.privacyContactEmail || settings.admissionsEmail}</a>. Information Officer: {settings.informationOfficerContact || 'Contact admissions.'}</p>
        <p className="text-[#A0A0A0] text-xs">Consent text version: {settings.consentTextVersion || '2026.09'} • Cookie notice version: {settings.cookieNoticeVersion || '2026.09'} • Operational retention guidance: {settings.dataRetentionDays || 1825} days.</p>
      </section>
    </div>
  </div>
  );
};

export const RefundPolicy: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 text-[#1A1A1A] text-xs sm:text-sm leading-relaxed bg-[#FFFFFF]">
    <div className="space-y-2 border-b border-[#E0E0E0] pb-4">
      <span className="text-xs font-mono text-[#707070] uppercase font-bold tracking-wider">Financial Policy</span>
      <h1 className="text-3xl font-light text-[#000000] tracking-tight">Refund & Deferral Policy</h1>
      <p className="text-[#707070]">Transparent terms for seat reservations and cancellations</p>
    </div>

    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">1. Seat Reservations & Deposits</h2>
        <p className="text-[#707070]">Due to our strict 15–20 student cohort cap, the R1,000 reservation deposit secures your individual lab slot and is non-refundable once an application is approved and onboarding begins.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">2. Cohort Deferrals</h2>
        <p className="text-[#707070]">If unexpected personal or professional circumstances arise prior to the first class session, students may request to defer their enrollment to the next scheduled intake at zero penalty by giving written notice at least 5 business days prior to cohort kickoff.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[#000000]">3. Early Withdrawal</h2>
        <p className="text-[#707070]">Tuition refunds requested within the first 7 calendar days of cohort kickoff will be evaluated on a pro-rata basis minus administrative onboarding fees.</p>
      </section>
    </div>
  </div>
);

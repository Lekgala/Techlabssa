import React from 'react';
import { useApp } from '../../context/AppContext';
import { FREQUENTLY_ASKED_QUESTIONS } from '../../data/mockData';
import { 
  Briefcase, 
  FileText, 
  Linkedin, 
  MessageSquare, 
  Award, 
  CheckCircle, 
  Sparkles, 
  Laptop, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const Career: React.FC = () => {
  const { navigate } = useApp();

  const targetRoles = [
    { title: 'IT Support Technician', salary: 'R15,000 – R22,000 / mo', desc: 'First-line and second-line enterprise user support, workstation deployment, Active Directory password resets, and peripheral troubleshooting.' },
    { title: 'Desktop Support Technician', salary: 'R18,000 – R28,000 / mo', desc: 'Hardware lifecycle, Windows 11 enterprise imaging, BitLocker encryption, driver diagnostics, and on-site user support.' },
    { title: 'Service Desk Analyst (MSP)', salary: 'R16,000 – R25,000 / mo', desc: 'Multi-tenant client ticket triage, SLA compliance, remote diagnostics via PowerShell and RMM agents for managed service providers.' },
    { title: 'Junior Systems Administrator', salary: 'R22,000 – R35,000 / mo', desc: 'Windows Server 2022 administration, Active Directory Domain Services, DNS/DHCP infrastructure, GPO deployment, and backup verification.' },
    { title: 'Microsoft 365 Support Specialist', salary: 'R20,000 – R30,000 / mo', desc: 'Exchange Online mail flow, shared mailboxes, user license management, Entra ID MFA troubleshooting, and Microsoft Teams administration.' },
    { title: 'Endpoint Support Technician (Intune)', salary: 'R22,000 – R32,000 / mo', desc: 'Enrolling client devices into Microsoft Intune MDM, managing compliance policies, deploying Company Portal apps, and remote wiping.' }
  ];

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
          Job Readiness & Portfolio Development
        </div>
        <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight">
          Don't Just Finish the Course. Prepare for the Job.
        </h1>
        <p className="text-sm sm:text-base text-[#707070] max-w-3xl mx-auto leading-relaxed">
          We bridge the gap between having theoretical knowledge and being able to confidently explain your technical troubleshooting methodology in interviews.
        </p>
      </section>

      {/* Honest Disclaimer */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-[#FAFAFA] rounded-2xl border border-[#E0E0E0] p-5 flex items-start gap-3.5 text-xs text-[#1A1A1A] leading-relaxed">
          <AlertCircle className="w-5 h-5 text-[#000000] shrink-0 mt-0.5" />
          <div>
            <strong className="block text-[#000000] font-bold text-xs uppercase tracking-wider mb-1">Our Ethical Commitment: No False Employment Guarantees</strong>
            <p className="text-[#707070]">
              TechLabs Academy SA does not guarantee job placement or make unrealistic employment promises. We believe true career transformation comes from rigorous hands-on skill development, creating a portfolio of real VMware/Intune projects, and mastering technical interview communication.
            </p>
          </div>
        </div>
      </section>

      {/* Target Job Roles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
            Realistic Target Roles in South Africa
          </h2>
          <p className="text-xs text-[#707070]">
            The skills you learn directly match the requirements of enterprise IT departments and Managed Service Providers (MSPs) across Cape Town, Johannesburg, and Durban.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {targetRoles.map((role, idx) => (
            <div key={idx} className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] space-y-3 hover:border-[#000000] transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-[#000000] text-white px-2 py-0.5 rounded">
                  Target Role
                </span>
                <span className="text-[11px] font-mono text-[#707070]">{role.salary}</span>
              </div>
              <h3 className="text-base font-bold text-[#000000]">{role.title}</h3>
              <p className="text-xs text-[#707070] leading-relaxed">{role.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Pillars of Career Preparation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAFAFA] text-[#1A1A1A] rounded-2xl p-8 sm:p-12 border border-[#E0E0E0] space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A0A0A0] font-bold">
              Comprehensive Career Track
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
              How We Help You Stand Out to Recruiters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E0E0E0] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#000000] text-white flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#000000]">Technical CV Restructuring</h3>
              <p className="text-[#707070] leading-relaxed">
                Replace generic buzzwords with specific, demonstrable lab projects: "Built Windows Server 2022 Active Directory domain, configured Intune BitLocker compliance, resolved 15+ ITIL tickets."
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E0E0E0] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#000000] text-white flex items-center justify-center font-bold">
                <Linkedin className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#000000]">LinkedIn Profile Guidance</h3>
              <p className="text-[#707070] leading-relaxed">
                Optimize your headline, featured portfolio sections, and technical skills keywords so South African IT recruiters find your profile for entry and junior IT roles.
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E0E0E0] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#000000] text-white flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#000000]">Technical Mock Interview</h3>
              <p className="text-[#707070] leading-relaxed">
                Practice answering real interview scenarios with your TechLabs instructor: "Walk me through how you troubleshoot a user whose Outlook is stuck on Disconnected."
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E0E0E0] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#000000] text-white flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#000000]">Verified Digital Portfolio</h3>
              <p className="text-[#707070] leading-relaxed">
                Graduate with a shareable digital certificate verification URL and your documented root cause analysis reports to demonstrate real work in interviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 pt-4">
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

export const About: React.FC = () => {
  const { navigate, settings } = useApp();

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
          Cape Town, South Africa
        </div>
        <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight">
          About TechLabs Academy SA
        </h1>
        <p className="text-sm sm:text-base text-[#707070] max-w-3xl mx-auto leading-relaxed">
          We were founded with a singular mission: to eliminate the frustration of IT graduates and career changers who have theoretical knowledge but lack the practical troubleshooting ability demanded by employers.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4 text-sm text-[#707070] leading-relaxed">
          <h2 className="text-2xl font-light text-[#000000] tracking-tight">
            Our Core Differentiator
          </h2>
          <p className="italic text-xs text-[#000000] font-medium bg-[#FAFAFA] p-4 rounded-xl border border-[#E0E0E0] leading-relaxed">
            "We don't just teach students what buttons to click. We give them realistic IT environments, deliberately broken systems and support tickets, and teach them how to investigate, troubleshoot, resolve and document the problem."
          </p>
          <p className="text-xs">
            Traditional computer training often consists of watching an instructor click through menus. But when you land a job in IT support, nobody tells you which button to click. You receive a frantic phone call or an urgent ticket with vague symptoms, and you must figure out the root cause.
          </p>
          <p className="text-xs">
            At TechLabs Academy SA, every student builds their own enterprise network, experiences simulated outages, and learns how to restore service methodically.
          </p>
        </div>

        <div className="bg-[#FAFAFA] text-[#1A1A1A] p-8 rounded-2xl border border-[#E0E0E0] space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A0A0A0] font-bold">
              Lead Technical Instructor
            </span>
            <h3 className="text-2xl font-bold text-[#000000]">{settings.leadInstructorName || 'TechLabs Instruction Team'}</h3>
            <p className="text-xs text-[#707070]">Senior Systems Administrator & IT Mentor</p>
          </div>
          <p className="text-xs text-[#707070] leading-relaxed">
            Learn from experienced technical instructors with hands-on enterprise infrastructure backgrounds across South African managed services, corporate networks, Windows Server environments, and Microsoft Cloud migrations.
          </p>
          <div className="pt-2 border-t border-[#E0E0E0] flex items-center gap-4 text-xs font-mono text-[#000000]">
            <span>✔ 100% Practical Mentorship</span>
            <span>✔ 100% Virtual & Hybrid</span>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 text-center space-y-4 pt-6">
        <button
          onClick={() => navigate('/courses/it-support')}
          className="px-8 py-3.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition"
        >
          Explore Our Bootcamp
        </button>
      </section>
    </div>
  );
};

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filtered = FREQUENTLY_ASKED_QUESTIONS.filter((item: any) => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
          Frequently Asked Questions
        </div>
        <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight">
          Everything You Need to Know
        </h1>
        <p className="text-sm sm:text-base text-[#707070] max-w-2xl mx-auto leading-relaxed">
          Clear, transparent answers about our practical VMware labs, evening classes, hardware prerequisites, and admissions.
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto pt-4">
          <input
            type="text"
            placeholder="Search questions (e.g. laptop, VMware, installment, degree)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs focus:outline-none focus:border-[#000000] transition"
          />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        {filtered.map((item: any, idx: number) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-[#FAFAFA] transition"
              >
                <span className="font-bold text-xs sm:text-sm text-[#000000]">
                  {item.question}
                </span>
                <span className="text-[#000000] font-mono text-base font-bold shrink-0">
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-[#707070] border-t border-[#F0F0F0] leading-relaxed whitespace-pre-line animate-in fade-in">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};

export const Contact: React.FC = () => {
  const { settings, addLead } = useApp();
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    whatsapp: '',
    courseInterest: 'IT Support Bootcamp',
    message: ''
  });
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLead({
      name: formData.name,
      email: formData.email,
      whatsapp: formData.whatsapp,
      source: 'Website',
      courseInterest: formData.courseInterest,
      status: 'NEW_LEAD',
      followUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
    setSubmitted(true);
  };

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
          Get in Touch
        </div>
        <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight">
          Talk to TechLabs Academy SA
        </h1>
        <p className="text-sm sm:text-base text-[#707070] max-w-2xl mx-auto leading-relaxed">
          Have questions before applying? Reach out via WhatsApp, email, or our inquiry form below.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Contact Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FAFAFA] text-[#1A1A1A] p-8 rounded-2xl border border-[#E0E0E0] space-y-6">
            <h3 className="text-lg font-bold text-[#000000]">Cape Town Campus</h3>
            <div className="space-y-4 text-xs text-[#707070]">
              <div>
                <strong className="text-[#000000] uppercase text-[10px] tracking-wider block mb-1">Location:</strong>
                <p>Cape Town, South Africa</p>
              </div>
              <div>
                <strong className="text-[#000000] uppercase text-[10px] tracking-wider block mb-1">Admissions Hotline (WhatsApp):</strong>
                <p>{settings.whatsappNumber}</p>
              </div>
              <div>
                <strong className="text-[#000000] uppercase text-[10px] tracking-wider block mb-1">Email:</strong>
                <p>{settings.admissionsEmail}</p>
              </div>
              <div>
                <strong className="text-[#000000] uppercase text-[10px] tracking-wider block mb-1">Practical Lab Schedule:</strong>
                <p>Saturday: 09:00 – 13:00 SAST<br />Tuesday / Thursday Evenings: 18:30 – 20:30 SAST</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E0E0E0]">
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi%20TechLabs%20Academy!%20I'd%20like%20to%20chat%20about%20the%20bootcamp.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition text-xs uppercase tracking-[0.2em]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Instantly on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Inquiry Form */}
        <div className="lg:col-span-7 bg-[#FFFFFF] p-8 rounded-2xl border border-[#E0E0E0] space-y-5">
          <h3 className="text-xl font-light text-[#000000] tracking-tight">
            Send an Admissions Inquiry
          </h3>

          {submitted ? (
            <div className="p-6 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] text-center space-y-3">
              <span className="w-9 h-9 rounded-full bg-[#000000] text-white flex items-center justify-center mx-auto font-bold text-sm">✔</span>
              <h4 className="text-sm font-bold text-[#000000]">Inquiry Received!</h4>
              <p className="text-xs text-[#707070]">
                Thank you, {formData.name}. Our admissions team will reach out via WhatsApp / email shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Bongani Khumalo"
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs focus:border-[#000000] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. bongani@gmail.com"
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs focus:border-[#000000] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">WhatsApp Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="e.g. +27 82 123 4567"
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs focus:border-[#000000] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Course / Tier of Interest</label>
                  <select
                    value={formData.courseInterest}
                    onChange={(e) => setFormData({ ...formData, courseInterest: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs focus:border-[#000000] focus:outline-none"
                  >
                    <option value="Professional Tier (R3,499)">Professional Tier (R3,499 - Most Popular)</option>
                    <option value="Career Accelerator (R4,999)">Career Accelerator (R4,999)</option>
                    <option value="Starter Tier (R1,999)">Starter Tier (R1,999)</option>
                    <option value="General Question">General Question / Laptop Check</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Your Message / Questions</label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your IT goals or ask about laptop specifications..."
                  className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-xs focus:border-[#000000] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition"
              >
                Send Inquiry to Admissions Team
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

import React from 'react';
import { useApp, getTierPrice } from '../../context/AppContext';
import { ArchitectureDiagram } from '../../components/common/ArchitectureDiagram';
import { TicketCard } from '../../components/common/TicketCard';
import { 
  Terminal, 
  Server, 
  Shield, 
  Cloud, 
  Laptop, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  MessageSquare, 
  Sparkles, 
  Flame, 
  Wrench, 
  Search, 
  FileCheck, 
  Layers, 
  Users, 
  Award,
  Zap,
  Calendar,
  MapPin,
  Check
} from 'lucide-react';

export const Home: React.FC = () => {
  const { navigate, settings, tickets } = useApp();

  const techCards = [
    { title: 'Windows Server', desc: 'Server 2022 setup, roles, storage pools, permissions & hardening', icon: Server },
    { title: 'Active Directory', desc: 'AD DS forest, OU architecture, AGDLP security groups & RSAT', icon: Users },
    { title: 'Microsoft 365', desc: 'M365 admin center, Exchange Online, shared mailboxes & licenses', icon: Cloud },
    { title: 'Microsoft Entra ID', desc: 'Cloud identities, MFA, SSPR, Conditional Access & What-If tools', icon: Shield },
    { title: 'Microsoft Intune', desc: 'MDM enrollment, BitLocker compliance policies & Company Portal', icon: Laptop },
    { title: 'Microsoft Defender', desc: 'Defender for Endpoint XDR, live device isolation & threat hunting', icon: Zap },
    { title: 'PowerShell', desc: 'Automation cmdlets, Microsoft Graph SDK & bulk provisioning scripts', icon: Terminal },
    { title: 'VMware Workstation', desc: 'Isolated VMnet virtual switching, snapshots & disaster recovery', icon: Layers },
    { title: 'Helpdesk & ITIL', desc: 'P1-P4 SLA prioritization, root cause analysis & KB documentation', icon: FileCheck },
    { title: 'Enterprise Network', desc: 'AD DNS zones, SRV records, DHCP scopes, failover & Wireshark', icon: Wrench }
  ];

  return (
    <div className="space-y-24 pb-20 bg-[#FFFFFF] text-[#1A1A1A]">
      {settings.publicAnnouncement && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-center text-xs text-[#707070]">{settings.publicAnnouncement}</div></div>}
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-[#FAFAFA] border-b border-[#F0F0F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[#FFFFFF] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-[10px] font-bold text-[#000000] uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#000000]"></span>
                <span>Cape Town IT Academy • Evening & Weekend</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#000000] leading-[1.1]">
                Stop Watching Tutorials. <br className="hidden sm:inline" />
                <span className="font-semibold">Start Solving Real IT Problems.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#707070] max-w-2xl leading-relaxed mx-auto lg:mx-0 font-normal">
                Hands-on IT Support training in Cape Town using VMware, Windows Server 2022, Active Directory, Microsoft 365, Entra ID, Intune, Defender and real-world enterprise helpdesk scenarios.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  id="hero-apply-btn"
                  onClick={() => navigate('/apply')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Apply for Next Intake</span>
                </button>

                <button
                  id="hero-explore-course-btn"
                  onClick={() => navigate('/courses/it-support')}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold text-xs uppercase tracking-[0.2em] border border-[#E0E0E0] transition flex items-center justify-center gap-2"
                >
                  <span>Explore Course</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi%20TechLabs%20Academy!%20I'd%20like%20to%20learn%20more%20about%20the%20IT%20Support%20bootcamp.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#707070] hover:text-[#000000] font-bold text-xs uppercase tracking-[0.2em] border border-[#E0E0E0] transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-[#000000]" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>

              {/* Key Value Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#707070]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#000000]" />
                  <span>100% VMware Sandbox</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#000000]" />
                  <span>Real Ticket Scenarios</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#000000]" />
                  <span>Installment Options</span>
                </div>
              </div>
            </div>

            {/* Right Visual Terminal / Enterprise Lab Preview */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-[#000000] text-white border border-[#222222] p-5 overflow-hidden shadow-xl">
                {/* Simulated Terminal Title Bar */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4 text-[10px] font-mono text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700"></span>
                    <span className="ml-2 text-neutral-300 font-bold uppercase tracking-wider">IT-ADMIN-01 ~ PowerShell 7</span>
                  </div>
                  <span className="text-[10px] bg-neutral-900 text-neutral-300 px-2 py-0.5 rounded border border-neutral-700 uppercase">
                    VMnet2 Connected
                  </span>
                </div>

                {/* Simulated PowerShell Shell Log */}
                <div className="space-y-3 font-mono text-xs leading-relaxed text-neutral-300">
                  <div>
                    <span className="text-neutral-400 font-bold">PS C:\TechLabs&gt;</span> <span className="text-white">Get-ADDomainController -Identity DC01</span>
                    <p className="text-neutral-400 text-[11px] mt-1 pl-3 border-l border-neutral-700">
                      Domain: ad.ubuntu-mfg.co.za<br />
                      Forest: ad.ubuntu-mfg.co.za<br />
                      IPAddress: 10.0.10.10 (Static - Healthy)
                    </p>
                  </div>

                  <div>
                    <span className="text-neutral-400 font-bold">PS C:\TechLabs&gt;</span> <span className="text-white">Get-MgDeviceManagementManagedDevice -Filter "deviceName eq 'FIN-LAPTOP-04'"</span>
                    <p className="text-neutral-300 text-[11px] mt-1 pl-3 border-l border-neutral-700">
                      [ALERT] ComplianceState: NonCompliant<br />
                      Reason: BitLocker Drive Encryption Not Detected
                    </p>
                  </div>

                  <div>
                    <span className="text-neutral-400 font-bold">PS C:\TechLabs&gt;</span> <span className="text-white">Invoke-TechLabsTicketSolver -TicketId "INT-1042"</span>
                    <p className="text-white text-[11px] mt-1 pl-3 border-l border-neutral-400">
                      ✔ Key Escrowed to Entra ID<br />
                      ✔ Intune Device Sync Triggered<br />
                      ✔ Compliance Status: PASSED (Resolved)
                    </p>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    <span className="text-neutral-300 text-[11px]">Ubuntu Manufacturing (Pty) Ltd</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Cape Town Node</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRICING TEASER (MOVED UP FOR QUICK VISIBILITY) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000] bg-[#FAFAFA] px-3 py-1 rounded-full border border-[#E0E0E0]">
            South African Rand (ZAR)
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-[#000000] tracking-tight">
            Invest in Demonstrable Practical Skills
          </h2>
          <p className="text-sm text-[#707070]">
            Choose the tier that aligns with your schedule and career goals.
          </p>
        </div>

        {(() => {
          const starterPricing = getTierPrice('STARTER', settings);
          const proPricing = getTierPrice('PROFESSIONAL', settings);
          const careerPricing = getTierPrice('CAREER_ACCELERATOR', settings);
          const starterContent = settings?.courseTierPricing?.STARTER;
          const professionalContent = settings?.courseTierPricing?.PROFESSIONAL;
          const acceleratorContent = settings?.courseTierPricing?.CAREER_ACCELERATOR;

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {/* STARTER */}
              <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#E0E0E0] flex flex-col justify-between space-y-6 relative">
                {starterPricing.isDiscounted && (
                  <div className="absolute -top-3 left-6 bg-[#000000] text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Zap className="w-3 h-3 fill-white text-white" />
                    <span>{starterPricing.discountPercent}% OFF Flash Sale</span>
                  </div>
                )}
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
                    {starterContent?.displayName || 'Starter Tier'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    {starterPricing.isDiscounted && (
                      <span className="text-sm line-through text-[#A0A0A0] font-mono">
                        R{starterPricing.original.toLocaleString()}
                      </span>
                    )}
                    <span className="text-3xl font-light text-[#000000]">
                      R{starterPricing.current.toLocaleString()}
                    </span>
                    <span className="text-xs text-[#707070]">once-off</span>
                  </div>
                  <p className="text-xs text-[#707070]">
                    {starterContent?.description || 'Weekend self-paced practical labs with comprehensive workbooks and VMware guidance.'}
                  </p>
                  <ul className="space-y-2.5 text-xs text-[#707070] pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                      <span>{starterContent?.features?.[0] || 'Weekend practical labs'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                      <span>{starterContent?.features?.[1] || 'Student workbook & lab architecture'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                      <span>{starterContent?.features?.[2] || 'VMware lab guidance & ISO links'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                      <span>{starterContent?.features?.[3] || 'Practical exercises & helpdesk scripts'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                      <span>{starterContent?.features?.[4] || 'Certificate of Completion'}</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => navigate('/apply')}
                  className="w-full py-3 bg-[#FAFAFA] hover:bg-[#000000] text-[#000000] hover:text-white border border-[#E0E0E0] font-bold rounded-xl text-[10px] uppercase tracking-[0.2em] transition"
                >
                  Select Starter
                </button>
              </div>

              {/* PROFESSIONAL (MOST POPULAR) */}
              <div className="bg-[#000000] text-white p-8 rounded-2xl border border-[#000000] shadow-xl flex flex-col justify-between space-y-6 relative">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-400">
                      {professionalContent?.displayName || 'Professional Tier'}
                    </span>
                    <span className="bg-white text-black font-bold text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      {proPricing.isDiscounted && <Zap className="w-3 h-3 fill-black text-black" />}
                      <span>{proPricing.isDiscounted ? `Flash Sale ${proPricing.discountPercent}% OFF` : professionalContent?.badgeLabel || 'Recommended'}</span>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    {proPricing.isDiscounted && (
                      <span className="text-sm line-through text-neutral-400 font-mono">
                        R{proPricing.original.toLocaleString()}
                      </span>
                    )}
                    <span className="text-3xl font-light text-white">
                      R{proPricing.current.toLocaleString()}
                    </span>
                    <span className="text-xs text-neutral-400">or R1,000 deposit</span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    {professionalContent?.description || 'Full bootcamp with live evening & weekend practical mentor sessions and tickets.'}
                  </p>
                  <ul className="space-y-2.5 text-xs text-neutral-300 pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>{professionalContent?.features?.[0] || 'Full 8-12 week bootcamp'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>{professionalContent?.features?.[1] || 'Live evening and weekend practical sessions'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>{professionalContent?.features?.[2] || 'VMware enterprise labs (Server, AD, DNS)'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>{professionalContent?.features?.[3] || 'Microsoft 365, Entra ID, Intune & Defender'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>{professionalContent?.features?.[4] || 'PowerShell automation & Helpdesk tickets'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>{professionalContent?.features?.[5] || 'Graded assessments & verified certificate'}</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => navigate('/apply')}
                  className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl text-xs uppercase tracking-[0.2em] transition"
                >
                  Apply for Professional
                </button>
              </div>

              {/* CAREER ACCELERATOR */}
              <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#E0E0E0] flex flex-col justify-between space-y-6 relative">
                {careerPricing.isDiscounted && (
                  <div className="absolute -top-3 left-6 bg-[#000000] text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Zap className="w-3 h-3 fill-white text-white" />
                    <span>{careerPricing.discountPercent}% OFF Flash Sale</span>
                  </div>
                )}
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
                    {acceleratorContent?.displayName || 'Career Accelerator'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    {careerPricing.isDiscounted && (
                      <span className="text-sm line-through text-[#A0A0A0] font-mono">
                        R{careerPricing.original.toLocaleString()}
                      </span>
                    )}
                    <span className="text-3xl font-light text-[#000000]">
                      R{careerPricing.current.toLocaleString()}
                    </span>
                    <span className="text-xs text-[#707070]">or R1,000 deposit</span>
                  </div>
                  <p className="text-xs text-[#707070]">
                    {acceleratorContent?.description || 'Includes everything in Professional plus dedicated 1-on-1 career coaching & mock interviews.'}
                  </p>
                  <ul className="space-y-2.5 text-xs text-[#707070] pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                      <span>{acceleratorContent?.features?.[0] || 'Everything in Professional Tier'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                      <span>{acceleratorContent?.features?.[1] || 'Technical CV and portfolio review'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                      <span>{acceleratorContent?.features?.[2] || 'LinkedIn profile optimization'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                      <span>{acceleratorContent?.features?.[3] || '1-on-1 technical mock interview'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                      <span>{acceleratorContent?.features?.[4] || 'Job application guidance'}</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => navigate('/apply')}
                  className="w-full py-3 bg-[#FAFAFA] hover:bg-[#000000] text-[#000000] hover:text-white border border-[#E0E0E0] font-bold rounded-xl text-[10px] uppercase tracking-[0.2em] transition"
                >
                  Select Accelerator
                </button>
              </div>
            </div>
          );
        })()}
      </section>

      {/* 2. 10 TECHNOLOGIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000] bg-[#FAFAFA] px-3 py-1 rounded-full border border-[#E0E0E0]">
            Enterprise Technology Stack
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-[#000000] tracking-tight">
            Built for Practical IT Engineering
          </h2>
          <p className="text-sm text-[#707070]">
            Configure, break, and troubleshoot the exact technologies used across corporate IT departments and Managed Service Providers (MSPs).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {techCards.map((tech, idx) => {
            const Icon = tech.icon;
            return (
              <div 
                key={idx}
                className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#F0F0F0] hover:border-[#000000] transition group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#E0E0E0] bg-[#FAFAFA] text-[#000000] group-hover:bg-[#000000] group-hover:text-white transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#000000]">
                    {tech.title}
                  </h3>
                  <p className="text-xs text-[#707070] leading-relaxed">
                    {tech.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. PROBLEM / SOLUTION SECTION */}
      <section className="bg-[#FAFAFA] py-18 text-[#1A1A1A] border-y border-[#F0F0F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
              Methodology Contrast
            </span>
            <h2 className="text-3xl sm:text-4xl font-light text-[#000000] tracking-tight">
              Theory vs. Production Readiness
            </h2>
            <p className="text-sm text-[#707070]">
              When an executive is locked out of their encrypted machine 10 minutes before a board meeting, memorized definitions won't help you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Traditional Training Column */}
            <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#E0E0E0] space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FAFAFA] border border-[#E0E0E0] text-[#707070] flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#000000]">Traditional IT Training</h3>
                  <p className="text-xs text-[#A0A0A0]">Passive theory & pre-recorded slides</p>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs text-[#707070]">
                <li className="flex items-center gap-3"><XCircle className="w-4 h-4 text-[#A0A0A0] shrink-0" /><span>Memorize definitions for exams instead of building systems</span></li>
                <li className="flex items-center gap-3"><XCircle className="w-4 h-4 text-[#A0A0A0] shrink-0" /><span>Follow pre-recorded demonstrations without troubleshooting</span></li>
                <li className="flex items-center gap-3"><XCircle className="w-4 h-4 text-[#A0A0A0] shrink-0" /><span>Complete generic exercises disconnected from production incidents</span></li>
                <li className="flex items-center gap-3"><XCircle className="w-4 h-4 text-[#A0A0A0] shrink-0" /><span>Receive limited feedback on technical investigation notes</span></li>
              </ul>
            </div>

            {/* TechLabs Academy Column */}
            <div className="bg-[#FFFFFF] p-8 rounded-2xl border-2 border-[#000000] space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#000000] text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#000000]">TechLabs Academy SA</h3>
                  <p className="text-xs text-[#707070] font-medium">100% Practical troubleshooting & sandbox labs</p>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs text-[#1A1A1A]">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#000000] shrink-0" />
                  <span>Build your own isolated VMware network from scratch</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#000000] shrink-0" />
                  <span>Configure Windows Server 2022 & Active Directory Domain Controller</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#000000] shrink-0" />
                  <span>Deploy Intune compliance policies & investigate Defender alerts</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#000000] shrink-0" />
                  <span>Receive deliberately broken environments and realistic helpdesk tickets</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#000000] shrink-0" />
                  <span>Investigate, diagnose root cause, fix, and document your resolution</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/labs')}
                  className="w-full py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition flex items-center justify-center gap-2"
                >
                  <span>Explore Lab Architecture</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW THE TRAINING WORKS (Build. Break. Fix. Verify.) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-14">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000] bg-[#FAFAFA] px-3 py-1 rounded-full border border-[#E0E0E0]">
            The 4-Step Engineering Cycle
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-[#000000] tracking-tight">
            Build. Break. Fix. Verify.
          </h2>
          <p className="text-sm text-[#707070]">
            Transform abstract IT concepts into demonstrable, battle-tested troubleshooting competence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* STEP 1 */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#F0F0F0] relative group hover:border-[#000000] transition">
            <div className="w-10 h-10 rounded-xl bg-[#000000] text-white font-mono font-bold text-xs flex items-center justify-center mb-4">
              01
            </div>
            <h3 className="text-base font-bold text-[#000000] mb-2 uppercase tracking-wider">BUILD</h3>
            <p className="text-xs text-[#707070] leading-relaxed">
              Students build their own VMware environment: Windows Server 2022, Active Directory, DNS, DHCP, GPO, and Windows 11 client endpoints.
            </p>
          </div>

          {/* STEP 2 */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#F0F0F0] relative group hover:border-[#000000] transition">
            <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] font-mono font-bold text-xs flex items-center justify-center mb-4">
              02
            </div>
            <h3 className="text-base font-bold text-[#000000] mb-2 uppercase tracking-wider">BREAK</h3>
            <p className="text-xs text-[#707070] leading-relaxed">
              Realistic faults and incidents are introduced: broken DNS pointers, corrupted GPO links, Intune compliance failures, or password loops.
            </p>
          </div>

          {/* STEP 3 */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#F0F0F0] relative group hover:border-[#000000] transition">
            <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] font-mono font-bold text-xs flex items-center justify-center mb-4">
              03
            </div>
            <h3 className="text-base font-bold text-[#000000] mb-2 uppercase tracking-wider">FIX</h3>
            <p className="text-xs text-[#707070] leading-relaxed">
              Students investigate event logs, execute PowerShell diagnostics, isolate variables, identify the root cause, and implement the fix.
            </p>
          </div>

          {/* STEP 4 */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#F0F0F0] relative group hover:border-[#000000] transition">
            <div className="w-10 h-10 rounded-xl bg-[#000000] text-white font-mono font-bold text-xs flex items-center justify-center mb-4">
              04
            </div>
            <h3 className="text-base font-bold text-[#000000] mb-2 uppercase tracking-wider">VERIFY</h3>
            <p className="text-xs text-[#707070] leading-relaxed">
              Students prove the issue is resolved, verify system health across client and server, and document their resolution in the ticketing portal.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FEATURED COURSE CARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAFAFA] rounded-3xl border border-[#E0E0E0] p-8 sm:p-12 text-[#1A1A1A]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#000000] text-white font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                  Flagship Program
                </span>
                <span className="bg-[#FFFFFF] border border-[#E0E0E0] text-[#707070] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  8–12 Weeks • Cape Town & Hybrid
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-light text-[#000000] tracking-tight">
                IT Support & Enterprise Administration Bootcamp
              </h2>

              <p className="text-[#707070] text-sm leading-relaxed max-w-2xl">
                A rigorous, practical curriculum designed to take you from foundational understanding to enterprise IT Support technician, Desktop Support engineer, and Junior Systems Administrator.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
                <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
                  <span className="text-[#A0A0A0] block text-[10px] font-mono uppercase tracking-wider">Duration:</span>
                  <strong className="text-[#000000] text-xs">8–12 Weeks</strong>
                </div>
                <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
                  <span className="text-[#A0A0A0] block text-[10px] font-mono uppercase tracking-wider">Format:</span>
                  <strong className="text-[#000000] text-xs">Sat + Tue Evenings</strong>
                </div>
                <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
                  <span className="text-[#A0A0A0] block text-[10px] font-mono uppercase tracking-wider">Hardware:</span>
                  <strong className="text-[#000000] text-xs">16GB RAM Host</strong>
                </div>
                <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
                  <span className="text-[#A0A0A0] block text-[10px] font-mono uppercase tracking-wider">Class Cap:</span>
                  <strong className="text-[#000000] text-xs">15 Seats Max</strong>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
              <button
                onClick={() => navigate('/courses/it-support')}
                className="w-full py-3.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition text-center"
              >
                View Course Details
              </button>
              <button
                onClick={() => navigate('/courses/it-support/curriculum')}
                className="w-full py-3.5 bg-[#FFFFFF] hover:bg-[#FAFAFA] text-[#000000] font-bold text-xs uppercase tracking-[0.2em] rounded-xl border border-[#E0E0E0] transition text-center"
              >
                15-Module Curriculum
              </button>
              <button
                onClick={() => navigate('/apply')}
                className="w-full py-3.5 bg-transparent hover:bg-[#FFFFFF] text-[#000000] font-bold text-xs uppercase tracking-[0.2em] rounded-xl border border-[#000000] transition text-center"
              >
                Apply for Next Intake
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRACTICAL LAB ARCHITECTURE PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000] bg-[#FAFAFA] px-3 py-1 rounded-full border border-[#E0E0E0]">
            Virtual Lab Infrastructure
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-[#000000] tracking-tight">
            Your Classroom Is a Real IT Environment
          </h2>
          <p className="text-sm text-[#707070]">
            Explore the multi-machine enterprise topology you will configure in VMware on your laptop.
          </p>
        </div>

        <ArchitectureDiagram />
      </section>

      {/* 7. REALISTIC TICKET SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000] bg-[#FAFAFA] px-3 py-1 rounded-full border border-[#E0E0E0]">
            Helpdesk Ticket Engine
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-[#000000] tracking-tight">
            Assignments That Mirror Real IT Support
          </h2>
          <p className="text-sm text-[#707070]">
            No multiple-choice tests. You are assigned tickets from our enterprise scenario company, <strong>Ubuntu Manufacturing (Pty) Ltd</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.slice(0, 4).map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/labs')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#000000] text-white hover:bg-neutral-800 font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition"
          >
            <span>Explore All 15+ Lab Scenarios</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 8. "REAL ENVIRONMENT" SECTION */}
      <section className="bg-[#FAFAFA] py-16 text-[#1A1A1A] border-y border-[#F0F0F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
            Controlled & Isolated Sandbox
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-[#000000] tracking-tight">
            Learn on Real Technology. Not Fake Simulations.
          </h2>
          <p className="text-sm text-[#707070] max-w-3xl mx-auto leading-relaxed">
            Where cloud licensing and tenant capacity allow, students work in controlled academy Microsoft environments. Cloud access is managed by TechLabs Academy to keep the learning environment safe and isolated.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-[#000000] pt-4">
            <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              ✔ Windows Server 2022
            </div>
            <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              ✔ Active Directory DS
            </div>
            <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              ✔ Intune MDM Policies
            </div>
            <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0]">
              ✔ PowerShell Scripts
            </div>
          </div>
        </div>
      </section>

      {/* 9. PRICING TEASER */}
      
    </div>
  );
};

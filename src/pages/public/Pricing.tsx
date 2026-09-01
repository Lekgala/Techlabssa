import React, { useState } from 'react';
import { useApp, getTierPrice } from '../../context/AppContext';
import { 
  Check, 
  Sparkles, 
  HelpCircle, 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  Calendar, 
  Users, 
  ArrowRight,
  MapPin,
  Clock,
  Zap
} from 'lucide-react';

export const Pricing: React.FC = () => {
  const { navigate, settings } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PROFESSIONAL' | 'CAREER_ACCELERATOR'>('PROFESSIONAL');

  const starterPricing = getTierPrice('STARTER', settings.flashSale);
  const proPricing = getTierPrice('PROFESSIONAL', settings.flashSale);
  const careerPricing = getTierPrice('CAREER_ACCELERATOR', settings.flashSale);

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
          Transparent Tuition in South African Rand (ZAR)
        </div>
        <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight">
          Invest in Real Practical Capability
        </h1>
        <p className="text-sm sm:text-base text-[#707070] max-w-2xl mx-auto leading-relaxed">
          No hidden fees or recurring subscriptions. Secure your seat with a flexible deposit or choose our full upfront rate.
        </p>
      </section>

      {/* 3 Tier Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* STARTER */}
          <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col justify-between space-y-6 relative">
            {starterPricing.isDiscounted && (
              <div className="absolute -top-3 left-6 bg-[#000000] text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                <Zap className="w-3 h-3 fill-white text-white" />
                <span>{starterPricing.discountPercent}% OFF Flash Sale</span>
              </div>
            )}
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#707070]">
                Starter Tier
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
                <span className="text-[10px] text-[#A0A0A0] uppercase font-mono">once-off</span>
              </div>
              <p className="text-xs text-[#707070]">
                Weekend practical self-paced lab track with comprehensive workbooks and VMware guidance.
              </p>
              <ul className="space-y-2.5 text-xs text-[#707070] pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Weekend practical labs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Student workbook & architecture diagrams</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>VMware lab guidance & ISO links</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Practical exercises & helpdesk scripts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Certificate of Completion</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/apply')}
              className="w-full py-3 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold text-xs uppercase tracking-[0.2em] rounded-xl border border-[#E0E0E0] transition"
            >
              Apply for Starter
            </button>
          </div>

          {/* PROFESSIONAL (MOST POPULAR) */}
          <div className="bg-[#000000] text-white p-8 rounded-2xl border border-[#222222] shadow-xl flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFFFFF] text-[#000000] font-bold text-[9px] uppercase tracking-[0.2em] px-3 py-0.5 rounded-full border border-[#E0E0E0] shadow flex items-center gap-1">
              {proPricing.isDiscounted && <Zap className="w-3 h-3 fill-[#000000] text-[#000000]" />}
              <span>{proPricing.isDiscounted ? `Flash Sale: ${proPricing.discountPercent}% OFF` : 'Most Popular'}</span>
            </div>
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-400">
                Professional Tier
              </span>
              <div className="flex items-baseline gap-2">
                {proPricing.isDiscounted && (
                  <span className="text-sm line-through text-neutral-500 font-mono">
                    R{proPricing.original.toLocaleString()}
                  </span>
                )}
                <span className="text-3xl font-light text-white">
                  R{proPricing.current.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-400 uppercase font-mono">or R1,000 deposit</span>
              </div>
              <p className="text-xs text-neutral-300">
                Full bootcamp with live evening + weekend sessions, enterprise VMware labs & tickets.
              </p>
              <ul className="space-y-2.5 text-xs text-neutral-300 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Full 8–12 week bootcamp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Live evening + weekend practical sessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>VMware enterprise labs (Server 2022, AD, DNS, GPO)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Microsoft 365, Entra ID, Intune & Defender</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>PowerShell automation & Helpdesk ticket simulations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Graded practical assessments & verified certificate</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/apply')}
              className="w-full py-3.5 bg-[#FFFFFF] hover:bg-neutral-200 text-[#000000] font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition"
            >
              Apply for Professional
            </button>
          </div>

          {/* CAREER ACCELERATOR */}
          <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col justify-between space-y-6 relative">
            {careerPricing.isDiscounted && (
              <div className="absolute -top-3 left-6 bg-[#000000] text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                <Zap className="w-3 h-3 fill-white text-white" />
                <span>{careerPricing.discountPercent}% OFF Flash Sale</span>
              </div>
            )}
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#707070]">
                Career Accelerator
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
                <span className="text-[10px] text-[#A0A0A0] uppercase font-mono">or R1,000 deposit</span>
              </div>
              <p className="text-xs text-[#707070]">
                Everything in Professional plus 1-on-1 technical CV review, LinkedIn overhaul & mock interviews.
              </p>
              <ul className="space-y-2.5 text-xs text-[#707070] pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Everything in Professional Tier</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Technical CV restructuring & portfolio review</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>LinkedIn profile optimization for recruiters</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>1-on-1 technical mock interview with Lead Instructor</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>MSP job application tracking & reference</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/apply')}
              className="w-full py-3 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold text-xs uppercase tracking-[0.2em] rounded-xl border border-[#E0E0E0] transition"
            >
              Apply for Career Accelerator
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-[#A0A0A0]">
          <p>Prices are subject to change based on intake, delivery format and included services.</p>
          <p className="mt-1">
            *TechLabs Academy SA is an independent IT training provider. Certificates issued are verified Certificates of Completion.
          </p>
        </div>
      </section>

      {/* Payment Options Breakdown */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAFAFA] rounded-2xl border border-[#E0E0E0] p-8 space-y-6">
          <h3 className="text-lg font-light text-[#000000] tracking-tight">
            Payment Options & Deposit Structure
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E0E0E0] space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#000000]">1. Deposit + Installment Plan</h4>
              <p className="text-[#707070] leading-relaxed">
                Secure your seat immediately upon application approval with a <strong>R1,000 deposit</strong>. The remaining balance (e.g. R2,499 for Professional) can be settled before Week 4 of the bootcamp.
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E0E0E0] space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#000000]">2. Full Upfront Payment (EFT)</h4>
              <p className="text-[#707070] leading-relaxed">
                Pay the full amount upfront via Electronic Funds Transfer (EFT) to confirm your student enrollment and unlock onboarding guides.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const Intakes: React.FC = () => {
  const { navigate, cohorts } = useApp();

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
          Cape Town & Hybrid Cohorts
        </div>
        <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight">
          Upcoming Bootcamp Intakes
        </h1>
        <p className="text-sm sm:text-base text-[#707070] max-w-2xl mx-auto leading-relaxed">
          Cohorts are capped strictly at 15–20 students to guarantee hands-on debugging support and one-on-one ticket feedback.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {cohorts.map((cohort) => {
          const seatsLeft = Math.max(0, cohort.capacity - cohort.enrolledCount);
          const isFillingFast = cohort.status === 'Filling Fast';

          return (
            <div
              key={cohort.id}
              className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-6 sm:p-8 space-y-6 hover:border-[#000000] transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F0F0] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#000000]">{cohort.name}</h2>
                    {isFillingFast && (
                      <span className="bg-[#000000] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        Filling Fast
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#707070] font-mono mt-0.5">
                    Starts: {cohort.startDate} • Ends: {cohort.endDate}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A0A0A0] block">Capacity</span>
                  <strong className="text-[#000000] font-mono text-xs">
                    {cohort.enrolledCount} / {cohort.capacity} Seats ({seatsLeft > 0 ? `${seatsLeft} Left` : 'Waitlist Only'})
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-[#FAFAFA] p-3.5 rounded-xl border border-[#E0E0E0] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#000000]">
                    <Clock className="w-3.5 h-3.5 text-[#000000]" />
                    <span>Schedule Format</span>
                  </div>
                  <p className="text-[#707070]">{cohort.scheduleFormat}</p>
                </div>

                <div className="bg-[#FAFAFA] p-3.5 rounded-xl border border-[#E0E0E0] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#000000]">
                    <MapPin className="w-3.5 h-3.5 text-[#000000]" />
                    <span>Delivery Mode</span>
                  </div>
                  <p className="text-[#707070]">{cohort.deliveryMode}</p>
                </div>

                <div className="bg-[#FAFAFA] p-3.5 rounded-xl border border-[#E0E0E0] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#000000]">
                    <Building2 className="w-3.5 h-3.5 text-[#000000]" />
                    <span>Location / Platform</span>
                  </div>
                  <p className="text-[#707070]">{cohort.location}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-xs text-[#A0A0A0]">
                  {cohort.earlyBirdCutoff && (
                    <span>Early registration closes: <strong className="text-[#000000]">{cohort.earlyBirdCutoff}</strong></span>
                  )}
                </div>
                <button
                  onClick={() => navigate('/apply')}
                  className="w-full sm:w-auto px-6 py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition"
                >
                  Apply for This Cohort
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

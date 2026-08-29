import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KeyRound, Mail, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export const StudentLogin: React.FC = () => {
  const { studentLogin, navigate } = useApp();
  const [email, setEmail] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !referenceNumber.trim()) {
      alert('Please enter both your email address and application reference number.');
      return;
    }

    const success = studentLogin(email, referenceNumber);
    if (success) {
      navigate('/student');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8 bg-[#FFFFFF] text-[#1A1A1A]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 bg-[#000000] text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <KeyRound className="w-6 h-6 stroke-[1.75]" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#000000] bg-[#FAFAFA] px-3 py-1 rounded-full border border-[#E0E0E0] font-bold">
          Student & Applicant Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-light text-[#000000] tracking-tight">
          Applicant Feedback Sign In
        </h1>
        <p className="text-xs text-[#707070] max-w-sm mx-auto leading-relaxed">
          Applied for a TechLabs intake? Sign in with your registered email address and official reference number (e.g. <strong className="text-[#000000]">TLS-2026-0091</strong>) to view feedback and status.
        </p>
      </div>

      <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#E0E0E0] shadow-sm space-y-6">
        <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="text-[#000000] font-bold uppercase tracking-wider text-[10px] block">
              Registered Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A0A0A0] absolute left-3 top-3.5" />
              <input
                type="email"
                required
                placeholder="e.g. applicant@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#000000] focus:border-[#000000] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#000000] font-bold uppercase tracking-wider text-[10px] block">
              Application Reference Number *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#A0A0A0] absolute left-3 top-3.5" />
              <input
                type="text"
                required
                placeholder="e.g. TLS-2026-0091"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl text-[#000000] font-mono focus:border-[#000000] focus:bg-white focus:outline-none transition uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition flex items-center justify-center gap-2 pt-3"
          >
            <span>Sign In to Track Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-[#E0E0E0] pt-4 space-y-3 text-[11px] text-[#707070]">
          <div className="flex items-start gap-2 bg-[#FAFAFA] p-3 rounded-xl border border-[#E0E0E0]">
            <ShieldCheck className="w-4 h-4 text-[#000000] shrink-0 mt-0.5" />
            <p>
              Demo credentials: Try <strong className="text-[#000000]">bongani.dlamini@gmail.com</strong> with reference <strong className="text-[#000000]">TLS-2026-0075</strong> or any freshly submitted application.
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#707070]">Haven't submitted an application yet?</span>
            <button
              onClick={() => navigate('/apply')}
              className="font-bold text-[#000000] hover:underline uppercase tracking-wider text-[10px]"
            >
              Apply Online →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

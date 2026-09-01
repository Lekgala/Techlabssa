import React from 'react';
import { Certificate } from '../../types';
import { Award, ShieldCheck, Printer, CheckCircle, ExternalLink, QrCode } from 'lucide-react';

interface CertificateViewProps {
  certificate: Certificate;
  allowPrint?: boolean;
}

export const CertificateView: React.FC<CertificateViewProps> = ({ certificate, allowPrint = true }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  if (!certificate) {
    return (
      <div className="p-8 text-center text-xs text-[#707070] bg-[#FAFAFA] rounded-xl border border-[#E0E0E0]">
        Certificate details are currently loading or unavailable.
      </div>
    );
  }

  const handlePrint = () => {
    if (!containerRef.current) {
      window.print();
      return;
    }

    const originalBody = document.body.innerHTML;
    const printableNode = containerRef.current.cloneNode(true) as HTMLElement;
    printableNode.querySelectorAll('.no-print').forEach((node) => node.remove());

    document.body.innerHTML = '';
    document.body.appendChild(printableNode);

    const restoreBody = () => {
      document.body.innerHTML = originalBody;
      window.removeEventListener('afterprint', restoreBody);
    };

    window.addEventListener('afterprint', restoreBody, { once: true });
    requestAnimationFrame(() => window.print());
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {allowPrint && (
        <div className="flex justify-end no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      )}

      {/* Official Certificate Canvas */}
      <div className="certificate-page relative bg-[#FFFFFF] text-[#1A1A1A] p-8 sm:p-12 md:p-16 rounded-2xl border-4 border-[#000000] shadow-xl overflow-hidden max-w-4xl mx-auto">
        {/* Subtle Watermark background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
          <Award className="w-[500px] h-[500px] text-[#000000]" />
        </div>

        {/* Top Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center justify-center gap-2 bg-[#000000] text-white px-4 py-1.5 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>Verified Digital Credential</span>
          </div>

          <div className="pt-3">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#000000] uppercase">
              TechLabs Academy SA
            </h1>
            <p className="text-xs font-bold tracking-[0.2em] text-[#707070] uppercase mt-1">
              Cape Town, South Africa • "Learn IT by Doing"
            </p>
          </div>

          <div className="w-16 h-0.5 bg-[#000000] mx-auto my-4"></div>

          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A0A0A0]">
            This is to certify that
          </p>
        </div>

        {/* Student Name */}
        <div className="text-center my-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-normal text-[#000000] tracking-tight font-serif italic border-b border-[#E0E0E0] pb-4 inline-block px-8">
            {certificate.studentName}
          </h2>
        </div>

        {/* Course Name & Wording */}
        <div className="text-center max-w-2xl mx-auto space-y-3 relative z-10">
          <p className="text-xs text-[#707070] leading-relaxed">
            has successfully completed the intensive practical training program and demonstrated technical proficiency in the
          </p>

          <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0]">
            <h3 className="text-xl sm:text-2xl font-semibold text-[#000000]">
              {certificate.courseName}
            </h3>
            {certificate.gradeDistinction && (
              <p className="text-xs font-bold text-[#000000] mt-1 uppercase tracking-wider">
                ★ Passed with {certificate.gradeDistinction} ★
              </p>
            )}
          </div>
        </div>

        {/* Practical Skills Matrix */}
        <div className="my-8 relative z-10">
          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A0A0A0] font-bold text-center mb-3">
            Verified Practical Competencies & Lab Audit:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {certificate.skillsAcquired.map((skill, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-[#FAFAFA] rounded-lg border border-[#E0E0E0]">
                <CheckCircle className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                <span className="font-medium text-[#1A1A1A] text-[11px]">{skill}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures & Verification Footer */}
        <div className="pt-8 border-t border-[#E0E0E0] grid grid-cols-1 sm:grid-cols-3 items-end gap-6 relative z-10 text-center sm:text-left">
          {/* Instructor Signature */}
          <div className="space-y-1">
            <div className="font-serif italic text-2xl text-[#1A1A1A] border-b border-[#A0A0A0] pb-1">
              {certificate.instructorName}
            </div>
            <p className="text-xs font-bold text-[#000000]">{certificate.instructorName}</p>
            <p className="text-[10px] text-[#707070]">TechLabs Academy SA Lead Instructor</p>
          </div>

          {/* Date & Seal */}
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-full border border-[#000000] bg-[#FAFAFA] mx-auto flex items-center justify-center">
              <Award className="w-6 h-6 text-[#000000]" />
            </div>
            <p className="text-xs font-bold text-[#000000] mt-2">Issued: {certificate.completionDate}</p>
            <p className="text-[10px] text-[#707070]">Cape Town, South Africa</p>
          </div>

          {/* Digital Verification ID & QR */}
          <div className="sm:text-right space-y-1">
            <div className="inline-block p-2 bg-[#FAFAFA] rounded-lg border border-[#E0E0E0]">
              <QrCode className="w-10 h-10 text-[#000000] mx-auto" />
            </div>
            <p className="text-[9px] font-mono text-[#A0A0A0] uppercase tracking-wider">Certificate ID:</p>
            <p className="text-xs font-mono font-bold text-[#000000] bg-[#FAFAFA] px-2 py-0.5 rounded inline-block border border-[#E0E0E0]">
              {certificate.certificateNumber}
            </p>
            <p className="text-[10px] text-[#707070] font-mono block">
              techlabs.co.za/verify/{certificate.certificateNumber}
            </p>
          </div>
        </div>

        {/* Disclaimer per requirement */}
        <div className="mt-8 pt-4 border-t border-[#F0F0F0] text-center text-[10px] text-[#A0A0A0] leading-tight font-mono">
          This Certificate of Completion verifies that the recipient has completed practical lab requirements on real virtualized systems at TechLabs Academy SA. TechLabs Academy is an independent training provider.
        </div>
      </div>
    </div>
  );
};

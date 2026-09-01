import React, { useState } from 'react';
import { useApp, getTierPrice } from '../../context/AppContext';
import { CourseTier, PaymentOption } from '../../types';
import { PrintableInvoice } from '../../components/common/PrintableInvoice';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Laptop, 
  User as UserIcon, 
  Briefcase, 
  Shield, 
  Calendar, 
  FileCheck,
  CreditCard,
  Building2,
  Copy,
  ExternalLink,
  Printer,
  Zap
} from 'lucide-react';

export const Apply: React.FC = () => {
  const { submitApplication, studentLogin, cohorts, navigate, settings } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
    city: 'Cape Town',
    province: 'Western Cape',
    // Step 2: IT Background
    highestQualification: 'National Senior Certificate (Matric)',
    itExperienceYears: '0 - 1 years (Beginner / Graduate)',
    currentEmploymentStatus: 'Job Seeking / Unemployed',
    currentRole: '',
    technologiesKnown: [] as string[],
    // Step 3: Laptop
    laptopBrand: '',
    cpu: '',
    ramGB: 16,
    storageType: 'NVMe SSD',
    freeStorageGB: 150,
    os: 'Windows 11 64-bit',
    hasVirtualizationEnabled: true,
    // Step 4: Course
    selectedTier: 'PROFESSIONAL' as CourseTier,
    paymentOption: 'DEPOSIT' as PaymentOption,
    // Step 5: Intake
    cohortId: 'cohort-oct-2026',
    // Step 6: Consent
    acceptedTerms: false,
    acceptedPrivacy: false,
    marketingConsent: true
  });

  const availableTechs = [
    'Basic Computer Literacy',
    'Windows 10/11 Basics',
    'Microsoft 365 / Office Apps',
    'Active Directory Password Resets',
    'Basic Networking / IP Addresses',
    'Linux / Command Line',
    'PowerShell / Scripting',
    'Hardware Assembly / Upgrades'
  ];

  const handleTechToggle = (tech: string) => {
    setFormData(prev => {
      const exists = prev.technologiesKnown.includes(tech);
      return {
        ...prev,
        technologiesKnown: exists 
          ? prev.technologiesKnown.filter(t => t !== tech)
          : [...prev.technologiesKnown, tech]
      };
    });
  };

  const isRamCompliant = formData.ramGB >= 16;
  const isStorageCompliant = formData.freeStorageGB >= 100;
  const isLaptopReady = isRamCompliant && isStorageCompliant && formData.hasVirtualizationEnabled;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerms || !formData.acceptedPrivacy) {
      alert('Please accept the Terms & Conditions and Privacy Policy to proceed.');
      return;
    }

    setSubmitting(true);
    setSubmissionError('');
    try {
      const ref = await submitApplication({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      whatsapp: formData.whatsapp,
      city: formData.city,
      province: formData.province,
      highestQualification: formData.highestQualification,
      itExperienceYears: formData.itExperienceYears,
      currentEmploymentStatus: formData.currentEmploymentStatus,
      currentRole: formData.currentRole,
      technologiesKnown: formData.technologiesKnown,
      laptopBrand: formData.laptopBrand,
      cpu: formData.cpu,
      ramGB: Number(formData.ramGB),
      storageType: formData.storageType,
      freeStorageGB: Number(formData.freeStorageGB),
      os: formData.os,
      hasVirtualizationEnabled: formData.hasVirtualizationEnabled,
      isLaptopCompliant: isLaptopReady,
      selectedTier: formData.selectedTier,
      cohortId: formData.cohortId,
      acceptedTerms: formData.acceptedTerms,
      acceptedPrivacy: formData.acceptedPrivacy,
      marketingConsent: formData.marketingConsent,
      paymentOption: formData.paymentOption
      });

      setSubmittedRef(ref);

    // Fire celebration confetti
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {
        // Celebration is optional.
      }
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'The application could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRef) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 bg-[#FFFFFF] text-[#1A1A1A]">
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] shadow-sm p-8 sm:p-12 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-8 h-8 stroke-[2]" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] bg-[#FAFAFA] text-[#000000] px-3 py-1 rounded-full border border-[#E0E0E0]">
              Application Successfully Received
            </span>
            <h1 className="text-3xl sm:text-4xl font-light text-[#000000] tracking-tight">
              Welcome to TechLabs Academy SA
            </h1>
            <p className="text-xs sm:text-sm text-[#707070] max-w-lg mx-auto leading-relaxed">
              Thank you, <strong>{formData.firstName} {formData.lastName}</strong>. We have received your application for the upcoming IT Support Bootcamp.
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-[#FAFAFA] text-[#1A1A1A] p-5 rounded-xl border border-[#E0E0E0] max-w-md mx-auto space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A0A0A0]">Your Official Application Reference:</span>
            <div className="text-2xl sm:text-3xl font-light text-[#000000] font-mono tracking-wider">
              {submittedRef}
            </div>
            <p className="text-[10px] text-[#707070]">
              Please quote this reference number in all WhatsApp and EFT payment inquiries.
            </p>
          </div>

          {/* Next Steps Stepper */}
          <div className="bg-[#FAFAFA] p-6 rounded-xl border border-[#E0E0E0] text-left space-y-3 text-xs">
            <h3 className="font-bold text-[#000000] uppercase tracking-wider text-[10px]">
              What Happens Next?
            </h3>
            <ol className="space-y-2.5 text-[#707070]">
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#000000] text-white text-[9px] flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                <span><strong className="text-[#000000]">Laptop & Admission Review:</strong> Our technical team verifies your hardware specifications within 24 business hours.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#000000] text-white text-[9px] flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                <span><strong className="text-[#000000]">Payment Instructions:</strong> You will receive formal EFT banking instructions via email and WhatsApp.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#000000] text-white text-[9px] flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
                <span><strong className="text-[#000000]">Student Portal & Onboarding:</strong> Upon payment confirmation (deposit or full), your student account unlocks with the VMware lab checklist.</span>
              </li>
            </ol>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/student')}
              className="w-full sm:w-auto px-6 py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <span>Go to Student Portal to View Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/payment')}
              className="w-full sm:w-auto px-6 py-3 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold text-xs uppercase tracking-[0.2em] rounded-xl border border-[#E0E0E0] transition"
            >
              Proceed to Payment Instructions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 bg-[#FFFFFF] text-[#1A1A1A]">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#000000] bg-[#FAFAFA] px-3.5 py-1.5 rounded-full border border-[#E0E0E0] font-bold">
          Step {currentStep} of 7
        </span>
        <h1 className="text-3xl sm:text-4xl font-light text-[#000000] tracking-tight">
          Apply for the Next IT Support Intake
        </h1>
        <p className="text-xs sm:text-sm text-[#707070] max-w-xl mx-auto leading-relaxed">
          Complete our 7-step admissions application. We review every applicant's hardware readiness and IT background to ensure a high-impact learning cohort.
        </p>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-[#FAFAFA] border border-[#E0E0E0] p-2 rounded-xl flex items-center justify-between gap-1 overflow-x-auto text-[10px] font-mono">
        {['Personal', 'IT Background', 'Laptop Specs', 'Course Tier', 'Cohort', 'Consent', 'Summary'].map((stepName, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;

          return (
            <div
              key={idx}
              onClick={() => { if (stepNum < currentStep) setCurrentStep(stepNum); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition whitespace-nowrap uppercase tracking-wider ${
                isCurrent 
                  ? 'bg-[#000000] text-white font-bold shadow' 
                  : isDone 
                  ? 'bg-[#E0E0E0] text-[#000000] font-medium' 
                  : 'text-[#A0A0A0] hover:text-[#000000]'
              }`}
            >
              <span>{isDone ? '✔' : stepNum}.</span>
              <span>{stepName}</span>
            </div>
          );
        })}
      </div>

      {/* Form Container */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] shadow-sm p-6 sm:p-10">
        <form onSubmit={currentStep === 7 ? handleSubmit : (e) => { e.preventDefault(); setCurrentStep(prev => Math.min(7, prev + 1)); }}>
          {/* STEP 1: PERSONAL */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#000000]">Step 1: Personal Information</h3>
                <p className="text-xs text-[#707070]">Provide your official contact details for admissions and WhatsApp cohort communication.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bongani"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Khumalo"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. bongani@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">WhatsApp Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +27 82 123 4567"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">City / Suburb *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cape Town"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Province *</label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  >
                    <option value="Western Cape">Western Cape</option>
                    <option value="Gauteng">Gauteng</option>
                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                    <option value="Eastern Cape">Eastern Cape</option>
                    <option value="Free State">Free State</option>
                    <option value="Limpopo">Limpopo</option>
                    <option value="Mpumalanga">Mpumalanga</option>
                    <option value="North West">North West</option>
                    <option value="Northern Cape">Northern Cape</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: IT BACKGROUND */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#000000]">Step 2: IT Background & Experience</h3>
                <p className="text-xs text-[#707070]">Helps our instructors tailor lab difficulty and group peers effectively.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Highest Qualification *</label>
                  <select
                    value={formData.highestQualification}
                    onChange={(e) => setFormData({ ...formData, highestQualification: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  >
                    <option value="National Senior Certificate (Matric)">National Senior Certificate (Matric)</option>
                    <option value="Diploma in Information Technology">Diploma in IT / Systems Support</option>
                    <option value="BSc Computer Science / IT Degree">BSc Computer Science / IT Degree</option>
                    <option value="Higher Certificate / TVET Nated">Higher Certificate / TVET College</option>
                    <option value="Other Non-IT Degree or Diploma">Other Non-IT Qualification</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Years of IT Experience *</label>
                  <select
                    value={formData.itExperienceYears}
                    onChange={(e) => setFormData({ ...formData, itExperienceYears: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  >
                    <option value="None (Complete Beginner / Career Changer)">None (Complete Beginner / Career Changer)</option>
                    <option value="0 - 1 years (Graduate / Intern)">0 - 1 years (Graduate / Intern)</option>
                    <option value="1 - 3 years (Junior IT Support)">1 - 3 years (Junior IT Support)</option>
                    <option value="3+ years (Experienced Technician)">3+ years (Experienced Technician)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Current Employment Status *</label>
                  <select
                    value={formData.currentEmploymentStatus}
                    onChange={(e) => setFormData({ ...formData, currentEmploymentStatus: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  >
                    <option value="Job Seeking / Unemployed">Job Seeking / Unemployed</option>
                    <option value="Employed (Non-IT Role)">Employed (Non-IT Role)</option>
                    <option value="Employed in IT Support / Helpdesk">Employed in IT Support / Helpdesk</option>
                    <option value="University / College Student">University / College Student</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Current Job Title / Occupation</label>
                  <input
                    type="text"
                    placeholder="e.g. Retail Assistant / IT Graduate"
                    value={formData.currentRole}
                    onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Select Technologies You Have Used (Optional):</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableTechs.map((tech, idx) => {
                    const checked = formData.technologiesKnown.includes(tech);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handleTechToggle(tech)}
                        className={`p-2.5 rounded-xl border text-left text-[11px] font-medium transition ${
                          checked 
                            ? 'bg-[#000000] border-[#000000] text-white font-bold' 
                            : 'bg-[#FAFAFA] border-[#E0E0E0] text-[#707070] hover:border-[#000000]'
                        }`}
                      >
                        {checked ? '✔ ' : '+ '}{tech}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LAPTOP REQUIREMENTS */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#000000]">Step 3: Laptop Specifications Validation</h3>
                <p className="text-xs text-[#707070]">
                  Students require a capable Windows laptop because practical VMware labs run locally on your machine.
                </p>
              </div>

              {/* Hardware Guidance Box */}
              <div className="bg-[#FAFAFA] text-[#1A1A1A] p-4 rounded-xl border border-[#E0E0E0] text-xs space-y-1 font-mono">
                <span className="text-[#000000] font-bold block uppercase tracking-wider text-[10px]">Recommended Minimum Benchmark:</span>
                <p className="text-[#707070] text-[11px]">
                  • 16 GB RAM • 500 GB SSD • Intel Core i5 / Ryzen 5 or better • Windows 10/11 64-bit • Virtualization (VT-x/AMD-V) enabled in BIOS.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Laptop Brand & Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell Latitude 5420 / Lenovo ThinkPad T14"
                    value={formData.laptopBrand}
                    onChange={(e) => setFormData({ ...formData, laptopBrand: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Processor (CPU) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Intel Core i5-1135G7 or AMD Ryzen 5 5600U"
                    value={formData.cpu}
                    onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">System RAM *</label>
                  <select
                    value={formData.ramGB}
                    onChange={(e) => setFormData({ ...formData, ramGB: Number(e.target.value) })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none font-bold"
                  >
                    <option value={16}>16 GB RAM (Recommended)</option>
                    <option value={32}>32 GB RAM (Ideal)</option>
                    <option value={8}>8 GB RAM (Upgrade Required for Multi-VM)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Storage Type *</label>
                  <select
                    value={formData.storageType}
                    onChange={(e) => setFormData({ ...formData, storageType: e.target.value })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  >
                    <option value="NVMe SSD">NVMe SSD (Fastest)</option>
                    <option value="SATA SSD">SATA SSD</option>
                    <option value="HDD (Hard Disk Drive)">Mechanical HDD</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs uppercase tracking-wider text-[#000000]">Available Free Space (GB) *</label>
                  <input
                    type="number"
                    min={50}
                    required
                    value={formData.freeStorageGB}
                    onChange={(e) => setFormData({ ...formData, freeStorageGB: Number(e.target.value) })}
                    className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-[#000000] focus:outline-none"
                  />
                </div>
              </div>

              {/* Virtualization Checkbox */}
              <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] flex items-start gap-3 text-xs">
                <input
                  type="checkbox"
                  id="vt-checkbox"
                  checked={formData.hasVirtualizationEnabled}
                  onChange={(e) => setFormData({ ...formData, hasVirtualizationEnabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-black rounded"
                />
                <label htmlFor="vt-checkbox" className="text-[#707070] cursor-pointer">
                  <strong className="text-[#000000]">Hardware Virtualization (VT-x / AMD-V) Support:</strong> My laptop supports hardware virtualization and it can be enabled in the BIOS/UEFI. (We will help you verify this during onboarding).
                </label>
              </div>

              {/* Live Spec Indicator */}
              <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${
                isLaptopReady 
                  ? 'bg-[#FAFAFA] border-[#000000] text-[#000000] font-bold' 
                  : 'bg-[#FAFAFA] border-[#E0E0E0] text-[#707070]'
              }`}>
                <span>Compatibility Assessment:</span>
                <span>{isLaptopReady ? '✔ Laptop Fully Compatible for Multi-VM Labs' : '⚠️ Minor Spec Adjustment May Be Recommended'}</span>
              </div>
            </div>
          )}

          {/* STEP 4: COURSE TIER & PAYMENT OPTION */}
          {/* Step 4: Course Tier Selection */}
          {currentStep === 4 && (() => {
            const starterP = getTierPrice('STARTER', settings?.flashSale);
            const proP = getTierPrice('PROFESSIONAL', settings?.flashSale);
            const careerP = getTierPrice('CAREER_ACCELERATOR', settings?.flashSale);

            return (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#000000]">Step 4: Select Your Bootcamp Tier</h3>
                  <p className="text-xs text-[#707070]">Choose the training tier that matches your desired level of career support.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Starter */}
                  <div
                    onClick={() => setFormData({ ...formData, selectedTier: 'STARTER' })}
                    className={`p-5 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-3 relative ${
                      formData.selectedTier === 'STARTER'
                        ? 'border-[#000000] bg-[#FAFAFA] shadow-sm'
                        : 'border-[#E0E0E0] hover:border-[#000000]'
                    }`}
                  >
                    {starterP.isDiscounted && (
                      <span className="absolute -top-2.5 left-3 bg-[#000000] text-white font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 fill-white text-white" />
                        {starterP.discountPercent}% OFF
                      </span>
                    )}
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#707070] font-bold">Starter</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        {starterP.isDiscounted && (
                          <span className="text-xs line-through text-[#A0A0A0] font-mono">R{starterP.original.toLocaleString()}</span>
                        )}
                        <span className="text-2xl font-light text-[#000000]">R{starterP.current.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#707070] mt-1">Weekend self-paced practical lab track & workbook.</p>
                    </div>
                    <span className="text-xs font-bold text-[#000000] uppercase tracking-wider">
                      {formData.selectedTier === 'STARTER' ? '✔ Selected' : 'Select'}
                    </span>
                  </div>

                  {/* Professional */}
                  <div
                    onClick={() => setFormData({ ...formData, selectedTier: 'PROFESSIONAL' })}
                    className={`p-5 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-3 relative ${
                      formData.selectedTier === 'PROFESSIONAL'
                        ? 'border-[#000000] bg-[#000000] text-white shadow-md'
                        : 'border-[#E0E0E0] hover:border-[#000000]'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 bg-[#FFFFFF] text-[#000000] font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#E0E0E0] flex items-center gap-1">
                      {proP.isDiscounted && <Zap className="w-2.5 h-2.5 fill-black text-black" />}
                      <span>{proP.isDiscounted ? `${proP.discountPercent}% OFF` : 'Most Popular'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-mono uppercase font-bold ${formData.selectedTier === 'PROFESSIONAL' ? 'text-neutral-400' : 'text-[#707070]'}`}>Professional</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        {proP.isDiscounted && (
                          <span className={`text-xs line-through font-mono ${formData.selectedTier === 'PROFESSIONAL' ? 'text-neutral-400' : 'text-[#A0A0A0]'}`}>
                            R{proP.original.toLocaleString()}
                          </span>
                        )}
                        <span className={`text-2xl font-light ${formData.selectedTier === 'PROFESSIONAL' ? 'text-white' : 'text-[#000000]'}`}>
                          R{proP.current.toLocaleString()}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${formData.selectedTier === 'PROFESSIONAL' ? 'text-neutral-300' : 'text-[#707070]'}`}>Full 15-module bootcamp, live evening/weekend classes & tickets.</p>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${formData.selectedTier === 'PROFESSIONAL' ? 'text-white' : 'text-[#000000]'}`}>
                      {formData.selectedTier === 'PROFESSIONAL' ? '✔ Selected' : 'Select'}
                    </span>
                  </div>

                  {/* Career Accelerator */}
                  <div
                    onClick={() => setFormData({ ...formData, selectedTier: 'CAREER_ACCELERATOR' })}
                    className={`p-5 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-3 relative ${
                      formData.selectedTier === 'CAREER_ACCELERATOR'
                        ? 'border-[#000000] bg-[#FAFAFA] shadow-sm'
                        : 'border-[#E0E0E0] hover:border-[#000000]'
                    }`}
                  >
                    {careerP.isDiscounted && (
                      <span className="absolute -top-2.5 left-3 bg-[#000000] text-white font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 fill-white text-white" />
                        {careerP.discountPercent}% OFF
                      </span>
                    )}
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#707070] font-bold">Career Accelerator</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        {careerP.isDiscounted && (
                          <span className="text-xs line-through text-[#A0A0A0] font-mono">R{careerP.original.toLocaleString()}</span>
                        )}
                        <span className="text-2xl font-light text-[#000000]">R{careerP.current.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#707070] mt-1">Everything in Professional + 1-on-1 CV review & mock interview.</p>
                    </div>
                    <span className="text-xs font-bold text-[#000000] uppercase tracking-wider">
                      {formData.selectedTier === 'CAREER_ACCELERATOR' ? '✔ Selected' : 'Select'}
                    </span>
                  </div>
                </div>

              {/* Payment Option Selection */}
              <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] space-y-3 text-xs">
                <label className="font-bold text-xs uppercase tracking-wider text-[#000000] block">Preferred Payment Option upon Approval:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, paymentOption: 'DEPOSIT' })}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      formData.paymentOption === 'DEPOSIT' ? 'bg-[#FFFFFF] border-[#000000] shadow-sm font-bold text-[#000000]' : 'border-[#E0E0E0] text-[#707070]'
                    }`}
                  >
                    <span>R1,000 Seat Deposit + Installment Balance</span>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, paymentOption: 'FULL' })}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      formData.paymentOption === 'FULL' ? 'bg-[#FFFFFF] border-[#000000] shadow-sm font-bold text-[#000000]' : 'border-[#E0E0E0] text-[#707070]'
                    }`}
                  >
                    <span>Full Upfront Payment via EFT</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

          {/* STEP 5: INTAKE SELECTION */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#000000]">Step 5: Select Your Cohort</h3>
                <p className="text-xs text-[#707070]">Pick your preferred start date and delivery format.</p>
              </div>

              <div className="space-y-3 text-xs">
                {cohorts.map((cohort) => {
                  const selected = formData.cohortId === cohort.id;
                  const seatsLeft = Math.max(0, cohort.capacity - cohort.enrolledCount);
                  return (
                    <div
                      key={cohort.id}
                      onClick={() => setFormData({ ...formData, cohortId: cohort.id })}
                      className={`p-5 rounded-xl border cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        selected 
                          ? 'border-[#000000] bg-[#FAFAFA] shadow-sm' 
                          : 'border-[#E0E0E0] hover:border-[#000000]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[#000000]">{cohort.name}</h4>
                          <span className="text-[9px] font-mono bg-[#000000] text-white px-2 py-0.5 rounded uppercase">
                            {cohort.deliveryMode}
                          </span>
                        </div>
                        <p className="text-[#707070]">{cohort.scheduleFormat}</p>
                        <p className={`text-[10px] font-mono font-bold ${seatsLeft > 0 ? 'text-[#000000]' : 'text-[#A05A00]'}`}>{seatsLeft > 0 ? `${seatsLeft} of ${cohort.capacity} seats remaining` : 'Cohort full - applications join the waitlist'}</p>
                        <p className="text-[10px] text-[#A0A0A0] font-mono">Starts: {cohort.startDate} • Location: {cohort.location}</p>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${selected ? 'bg-[#000000] text-white' : 'bg-[#FAFAFA] border border-[#E0E0E0] text-[#707070]'}`}>
                          {selected ? '✔ Selected' : 'Select Cohort'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: CONSENT */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in duration-200 text-xs text-[#707070]">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#000000]">Step 6: Student Declarations & Consent</h3>
                <p className="text-xs text-[#707070]">Please review and accept our standard academy enrollment policies.</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms-check"
                    required
                    checked={formData.acceptedTerms}
                    onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                    className="mt-0.5 w-4 h-4 accent-black rounded"
                  />
                  <label htmlFor="terms-check" className="cursor-pointer text-[#707070]">
                    <strong className="text-[#000000]">Terms & Conditions:</strong> I understand that TechLabs Academy SA is an independent IT training provider. Practical VMware labs run on my own laptop, and I agree to the academy code of conduct.
                  </label>
                </div>

                <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="privacy-check"
                    required
                    checked={formData.acceptedPrivacy}
                    onChange={(e) => setFormData({ ...formData, acceptedPrivacy: e.target.checked })}
                    className="mt-0.5 w-4 h-4 accent-black rounded"
                  />
                  <label htmlFor="privacy-check" className="cursor-pointer text-[#707070]">
                    <strong className="text-[#000000]">POPIA Privacy Policy:</strong> I consent to TechLabs Academy processing my contact details for admission updates, invoicing, and WhatsApp class timetable communication.
                  </label>
                </div>

                <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="marketing-check"
                    checked={formData.marketingConsent}
                    onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                    className="mt-0.5 w-4 h-4 accent-black rounded"
                  />
                  <label htmlFor="marketing-check" className="cursor-pointer text-[#707070]">
                    <strong className="text-[#000000]">Admissions Updates (Optional):</strong> Keep me informed about future masterclasses, guest speaker workshops, and alumni career meetups in Cape Town.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: SUMMARY & SUBMIT */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in duration-200 text-xs">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#000000]">Step 7: Application Summary</h3>
                <p className="text-[#707070]">Please verify your details before submitting your formal application.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] space-y-1.5">
                  <span className="font-mono text-[10px] text-[#A0A0A0] uppercase block font-bold">Applicant:</span>
                  <div className="text-sm font-bold text-[#000000]">{formData.firstName} {formData.lastName}</div>
                  <div className="text-[#707070]">{formData.email} • {formData.whatsapp}</div>
                  <div className="text-[#707070]">{formData.city}, {formData.province}</div>
                </div>

                <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] space-y-1.5">
                  <span className="font-mono text-[10px] text-[#A0A0A0] uppercase block font-bold">Laptop Hardware:</span>
                  <div className="text-sm font-bold text-[#000000]">{formData.laptopBrand || 'Verified Model'}</div>
                  <div className="text-[#707070]">{formData.cpu || 'Multi-Core CPU'} • {formData.ramGB} GB RAM</div>
                  <div className="text-[#000000] font-bold">✔ Multi-VM Lab Ready</div>
                </div>
              </div>

              <div className="p-5 bg-[#FAFAFA] text-[#1A1A1A] rounded-xl border border-[#E0E0E0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-[#A0A0A0] uppercase font-bold tracking-wider">Program & Tier:</span>
                  <div className="text-base font-bold text-[#000000]">
                    IT Support Bootcamp ({formData.selectedTier})
                  </div>
                  <span className="text-xs text-[#707070] font-mono">
                    Payment Plan: {formData.paymentOption === 'DEPOSIT' ? 'R1,000 Deposit + Balance' : 'Full Upfront Tuition'}
                  </span>
                </div>
                <div className="text-right">
                  {(() => {
                    const price = getTierPrice(formData.selectedTier, settings?.flashSale);
                    return (
                      <div>
                        {price.isDiscounted && (
                          <span className="block text-xs line-through text-[#A0A0A0] font-mono font-bold">
                            R{price.original.toLocaleString()}
                          </span>
                        )}
                        <span className="text-2xl font-light text-[#000000]">
                          R{price.current.toLocaleString()}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          {submissionError && <div className="mt-6 p-4 rounded-xl border border-[#E6AAAA] bg-[#FFF5F5] text-[#9B1C1C] text-xs font-bold">{submissionError}</div>}
          <div className="flex items-center justify-between pt-8 border-t border-[#F0F0F0]">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className="px-5 py-2.5 rounded-xl border border-[#E0E0E0] text-[#000000] hover:bg-[#FAFAFA] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div></div>}

            {currentStep < 7 ? (
              <button
                type="submit"
                className="px-6 py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] flex items-center gap-2 transition"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 bg-[#000000] hover:bg-neutral-800 disabled:bg-[#A0A0A0] text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] shadow transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{submitting ? 'Submitting…' : 'Submit Application'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export const Payment: React.FC = () => {
  const { invoices, payments, paymentSettings, currentUser, uploadProofOfPayment, navigate } = useApp();

  // Pick the invoice matching the logged-in student, or fallback to first available
  const userInvoice = currentUser?.email
    ? invoices.find(i => i.studentEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase())
    : undefined;

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(userInvoice?.id || invoices[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [popUploaded, setPopUploaded] = useState(false);
  const [eftReference, setEftReference] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedPopFile, setSelectedPopFile] = useState<File | null>(null);
  const [popError, setPopError] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId) || userInvoice || invoices[0];

  const handleCopyBanking = () => {
    const txt = `TechLabs Banking Details (Madilotane Design Pty Ltd):
Bank: ${paymentSettings?.bankName}
Account Name: ${paymentSettings?.accountName}
Account Number: ${paymentSettings?.accountNumber}
Branch Code: ${paymentSettings?.branchCode}
Reference: ${selectedInvoice?.invoiceNumber || 'TLS-Reference'}`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!currentUser || !selectedInvoice || !paymentSettings) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4"><h1 className="text-3xl font-light">Payment details are not available yet</h1><p className="text-sm text-[#707070]">Banking details and POP upload unlock after admissions approves your application. Sign in to your applicant portal to check the latest status.</p></div>;
  }

  return (
    <div className="space-y-16 py-12 bg-[#FFFFFF] text-[#1A1A1A]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#000000] border border-[#E0E0E0] px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
          Official EFT Banking & Invoicing
        </div>
        <h1 className="text-3xl sm:text-5xl font-light text-[#000000] tracking-tight">
          Tuition Payment & Invoicing
        </h1>
        <p className="text-sm sm:text-base text-[#707070] max-w-2xl mx-auto leading-relaxed">
          Pay your R1,000 seat deposit or full tuition via Electronic Funds Transfer (EFT) using our official banking details below.
        </p>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Invoice Summary Box */}
        <div className="bg-[#FAFAFA] text-[#1A1A1A] p-6 sm:p-8 rounded-2xl border border-[#E0E0E0] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#A0A0A0] font-bold">Invoice Reference</span>
              <h3 className="text-xl font-mono font-bold text-[#000000]">{selectedInvoice?.invoiceNumber || 'INV-TLS-2026-088'}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] font-bold text-xs uppercase tracking-wider rounded-lg border border-[#E0E0E0] flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View / Print PDF</span>
              </button>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                selectedInvoice?.status === 'VERIFIED' ? 'bg-[#000000] text-white' : 'bg-[#E0E0E0] text-[#000000]'
              }`}>
                {selectedInvoice?.status === 'VERIFIED' ? 'PAID & VERIFIED' : 'PAYMENT REQUIRED'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#A0A0A0] block uppercase text-[9px] font-mono">Student:</span>
              <strong className="text-[#000000]">{selectedInvoice?.studentName}</strong>
            </div>
            <div>
              <span className="text-[#A0A0A0] block uppercase text-[9px] font-mono">Program:</span>
              <strong className="text-[#000000]">Bootcamp ({selectedInvoice?.courseTier})</strong>
            </div>
            <div>
              <span className="text-[#A0A0A0] block uppercase text-[9px] font-mono">Total Tuition:</span>
              <strong className="text-[#000000] text-sm">R{selectedInvoice?.amountZAR.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-[#A0A0A0] block uppercase text-[9px] font-mono">Chosen Plan:</span>
              <strong className="text-[#000000]">
                {selectedInvoice?.paymentOption === 'DEPOSIT' ? 'Deposit + Installments' : 'Full Upfront Payment'}
              </strong>
            </div>
            <div>
              <span className="text-[#A0A0A0] block uppercase text-[9px] font-mono">Amount Paid To Date:</span>
              <strong className="text-[#008000]">
                R{(selectedInvoice?.paidZAR ?? 0).toLocaleString()}
              </strong>
            </div>
            <div>
              <span className="text-[#A0A0A0] block uppercase text-[9px] font-mono">Remaining Balance Due:</span>
              <strong className={(selectedInvoice?.balanceZAR || 0) > 0 ? 'text-[#CC0000]' : 'text-[#008000]'}>
                R{(selectedInvoice?.balanceZAR || 0).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Official Bank Account for EFT */}
        <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#E0E0E0] shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#000000] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#000000]" />
              <span>Official EFT Banking Details</span>
            </h3>
            <button
              onClick={handleCopyBanking}
              className="text-xs text-[#000000] hover:text-neutral-700 font-bold flex items-center gap-1 uppercase tracking-wider"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Bank Details'}</span>
            </button>
          </div>

          <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#E0E0E0] space-y-2 font-mono text-xs text-[#1A1A1A]">
            <div className="flex justify-between">
              <span className="text-[#707070]">Bank Name:</span>
              <strong>{paymentSettings?.bankName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#707070]">Account Name:</span>
              <strong>{paymentSettings?.accountName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#707070]">Account Number:</span>
              <strong className="text-[#000000]">{paymentSettings?.accountNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#707070]">Branch Code:</span>
              <strong>{paymentSettings?.branchCode}</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#E0E0E0] text-[#000000]">
              <span className="text-[#707070]">Payment Reference:</span>
              <strong className="bg-[#000000] text-white px-2 py-0.5 rounded">{selectedInvoice?.invoiceNumber || 'INV-TLS-2026-088'}</strong>
            </div>
          </div>

          {/* Proof of Payment Upload & Direct Settle */}
          <div className="pt-2 space-y-3">
            <div className="space-y-1">
              <label className="font-bold text-xs uppercase tracking-wider text-[#000000] block">EFT payment reference</label>
              <input value={eftReference} onChange={(event) => setEftReference(event.target.value)} placeholder={selectedInvoice?.invoiceNumber || 'Invoice reference'} className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl font-mono text-xs" />
            </div>
            <label className="font-bold text-xs uppercase tracking-wider text-[#000000] block">
              Upload Proof of Payment (POP / PDF / Image):
            </label>
            <label htmlFor="pop-upload" className="border border-dashed border-[#E0E0E0] rounded-xl p-6 text-center cursor-pointer hover:bg-[#FAFAFA] transition block">
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                id="pop-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setPopError('');
                  if (!file) return;
                  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) { setSelectedPopFile(null); setPopError('Please choose a PDF, JPG, or PNG file.'); return; }
                  if (file.size > 5 * 1024 * 1024) { setSelectedPopFile(null); setPopError('The selected file is larger than 5 MB.'); return; }
                  setSelectedPopFile(file);
                }}
              />
              <span className="cursor-pointer text-[#707070] block">
                {popUploaded || selectedInvoice?.proofOfPaymentUrl ? (
                  <span className="text-[#008000] font-bold">✔ POP Uploaded ({selectedInvoice?.proofOfPaymentUrl?.split('/').pop() || 'EFT_Payment_Receipt.pdf'})</span>
                ) : selectedPopFile ? (
                  <span><strong className="text-[#000000] block">{selectedPopFile.name}</strong>{(selectedPopFile.size / 1024).toFixed(1)} KB • Click to choose a different file</span>
                ) : (
                  <span>Select a PDF, JPG, or PNG <strong className="text-[#000000]">proof of payment</strong> (max 5 MB)</span>
                )}
              </span>
            </label>
            {popError && <p className="text-[#CC0000] font-bold text-xs">{popError}</p>}
            {!payments.some(payment => payment.invoiceId === selectedInvoice?.id && payment.status === 'SUBMITTED') && !popUploaded && <button type="button" disabled={!selectedPopFile || !eftReference.trim() || uploading} onClick={async () => { if (!selectedPopFile || !selectedInvoice) return; if (!eftReference.trim()) { setPopError('Enter the EFT payment reference before submitting.'); return; } setUploading(true); setPopError(''); const uploaded = await uploadProofOfPayment(selectedInvoice.id, selectedPopFile, eftReference.trim()); setPopUploaded(uploaded); if (uploaded) setSelectedPopFile(null); setUploading(false); }} className="w-full py-3 bg-[#000000] hover:bg-neutral-800 disabled:bg-[#E0E0E0] disabled:text-[#707070] text-white font-bold text-xs uppercase tracking-[0.15em] rounded-xl transition">{uploading ? 'Uploading POP securely…' : 'Submit POP for Verification'}</button>}

            {(payments.some(payment => payment.invoiceId === selectedInvoice?.id && payment.status === 'SUBMITTED') || popUploaded) && <div className="space-y-3"><p className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E0E0E0] font-bold text-center">Deposit awaiting admissions verification</p><button type="button" onClick={() => navigate('/student')} className="w-full py-3 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] border border-[#000000] font-bold text-xs uppercase tracking-[0.15em] rounded-xl transition">Return to Student Portal</button></div>}
          </div>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4">
            <div className="sticky top-0 bg-white border-b border-[#E0E0E0] pb-3 flex items-center justify-between z-10">
              <h3 className="font-bold text-[#000000] text-sm uppercase tracking-wider">Official Updated Tax Invoice</h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-1.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs rounded-xl uppercase tracking-wider"
              >
                Close Preview
              </button>
            </div>
            <PrintableInvoice invoice={selectedInvoice} allowPrint={true} />
          </div>
        </div>
      )}
    </div>
  );
};

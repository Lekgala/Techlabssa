import React, { useEffect, useMemo, useState } from 'react';
import { useApp, getTierPrice } from '../../context/AppContext';
import { CourseTier, PaymentOption } from '../../types';
import { apiRequest } from '../../lib/api';
import { getEmailValidationError } from '../../lib/emailValidation';
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
  Zap,
  BookOpen,
  MessageSquare
} from 'lucide-react';

const CourseGuideCta: React.FC = () => {
  const { settings } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lead, setLead] = useState({ name: '', email: '', whatsapp: '' });
  const whatsappNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi TechLabs Academy, I'd like to learn more about the IT Support Bootcamp before applying.")}`;

  const submitGuideRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailValidationError = getEmailValidationError(lead.email);
    if (emailValidationError) return setError(emailValidationError);
    if (lead.name.trim().length < 2 || lead.whatsapp.trim().length < 6) return setError('Please enter your name and a valid WhatsApp number.');
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: lead.name.trim(),
          email: lead.email.trim(),
          whatsapp: lead.whatsapp.trim(),
          source: 'Website',
          courseInterest: 'IT Support & Enterprise Administration Bootcamp course guide',
        }),
      });
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Your request could not be submitted. Please use the WhatsApp option.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#D8D8D8] bg-[#FAFAFA] p-5 sm:p-6" aria-labelledby="course-guide-heading">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl space-y-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#707070]">Exploring your options?</span>
          <h2 id="course-guide-heading" className="text-xl font-semibold text-black">Not ready for the full application?</h2>
          <p className="text-xs leading-relaxed text-[#707070]">Request the course guide or chat to Admissions about the curriculum, timetable, laptop requirements and payment options.</p>
        </div>
        {!showForm && !submitted && (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800">
              <BookOpen className="h-4 w-4" /> Request Course Guide
            </button>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#CFCFCF] bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-black hover:border-black">
              <MessageSquare className="h-4 w-4" /> Chat to Admissions
            </a>
          </div>
        )}
      </div>

      {showForm && !submitted && (
        <form onSubmit={submitGuideRequest} className="mt-5 border-t border-[#E0E0E0] pt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-xs"><span className="font-bold uppercase tracking-wider">Full name</span><input required value={lead.name} onChange={event => setLead(current => ({ ...current, name: event.target.value }))} autoComplete="name" className="w-full rounded-xl border border-[#D8D8D8] bg-white p-3 focus:border-black focus:outline-none" /></label>
            <label className="space-y-1 text-xs"><span className="font-bold uppercase tracking-wider">Email</span><input required type="email" value={lead.email} onChange={event => setLead(current => ({ ...current, email: event.target.value }))} autoComplete="email" className="w-full rounded-xl border border-[#D8D8D8] bg-white p-3 focus:border-black focus:outline-none" /></label>
            <label className="space-y-1 text-xs"><span className="font-bold uppercase tracking-wider">WhatsApp number</span><input required type="tel" value={lead.whatsapp} onChange={event => setLead(current => ({ ...current, whatsapp: event.target.value }))} autoComplete="tel" className="w-full rounded-xl border border-[#D8D8D8] bg-white p-3 focus:border-black focus:outline-none" /></label>
          </div>
          {error && <p role="alert" className="mt-3 text-xs font-semibold text-[#B42318]">{error}</p>}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] leading-relaxed text-[#707070]">By requesting information, you agree that Admissions may contact you about this course. See our <a href="/privacy" className="font-semibold text-black underline">Privacy Policy</a>.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="rounded-xl border border-[#D8D8D8] bg-white px-4 py-2.5 text-xs font-bold">Cancel</button>
              <button type="submit" disabled={submitting} className="rounded-xl bg-black px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:bg-[#A0A0A0]">{submitting ? 'Sending…' : 'Send My Request'}</button>
            </div>
          </div>
        </form>
      )}

      {submitted && (
        <div role="status" className="mt-5 flex items-start gap-3 border-t border-[#E0E0E0] pt-5">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="text-sm font-bold">Course guide request received</p><p className="mt-1 text-xs text-[#707070]">Admissions will send course information to your email or WhatsApp contact.</p></div>
        </div>
      )}
    </section>
  );
};

export const Apply: React.FC = () => {
  const { submitApplication, studentLogin, cohorts, navigate, settings } = useApp();
  const availableCohorts = useMemo(
    () => cohorts.filter(cohort => cohort.status === 'Open' || cohort.status === 'Filling Fast'),
    [cohorts]
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formRef = React.useRef<HTMLDivElement>(null);
  const firstNameInputRef = React.useRef<HTMLInputElement>(null);

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
    cohortId: '',
    // Step 6: Consent
    acceptedTerms: false,
    acceptedPrivacy: false,
    marketingConsent: true
  });

  useEffect(() => {
    setFormData(current => {
      if (availableCohorts.some(cohort => cohort.id === current.cohortId)) return current;
      return { ...current, cohortId: availableCohorts[0]?.id || '' };
    });
  }, [availableCohorts]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      firstNameInputRef.current?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentStep > 1 && formRef.current) {
      const topOffset = formRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    }
  }, [currentStep]);

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
    const currentEmailError = getEmailValidationError(formData.email);
    if (currentEmailError) {
      setEmailError(currentEmailError);
      setCurrentStep(1);
      return;
    }
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

  const handleFormSubmit = (e: React.FormEvent) => {
    if (currentStep === 7) return void handleSubmit(e);
    e.preventDefault();
    if (currentStep === 1) {
      const currentEmailError = getEmailValidationError(formData.email);
      if (currentEmailError) {
        setEmailError(currentEmailError);
        return;
      }
      setEmailError('');
    }
    setCurrentStep(prev => Math.min(7, prev + 1));
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
              Thank you, <strong>{formData.firstName} {formData.lastName}</strong>. {settings.admissionsAcknowledgement || 'We have received your application for the upcoming IT Support Bootcamp.'}
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
                <span><strong className="text-[#000000]">Laptop & Admission Review:</strong> Admissions will review your application and laptop details. No action or payment is required while this is in progress.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#000000] text-white text-[9px] flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                <span><strong className="text-[#000000]">Approval Email:</strong> Within two business days, we will email your application outcome. If approved, the email includes your invoice, secure portal-password link, and payment steps.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#000000] text-white text-[9px] flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
                <span><strong className="text-[#000000]">Portal & Onboarding:</strong> After you create your portal password, pay, and admissions verifies your proof of payment, your course access and onboarding instructions unlock.</span>
              </li>
            </ol>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/courses/it-support')}
              className="w-full sm:w-auto px-6 py-3 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <span>Review Course Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (settings.applicationsEnabled === false) return <div className="max-w-3xl mx-auto px-4 py-20 space-y-8"><div className="text-center space-y-4"><h1 className="text-3xl font-light">Applications are temporarily closed</h1><p className="text-sm text-[#707070]">Please request the course guide or contact Admissions for information about the next intake.</p><button type="button" onClick={() => navigate('/')} className="px-5 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider">Return home</button></div><CourseGuideCta /></div>;

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
        <div className="mx-auto max-w-xl" aria-label={`${Math.round((currentStep / 7) * 100)}% complete`}>
          <div className="mb-1 flex justify-between text-[11px] font-bold text-[#555]"><span>Application progress</span><span>{Math.round((currentStep / 7) * 100)}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E0E0E0]"><div className="h-full rounded-full bg-black transition-all duration-300" style={{ width: `${(currentStep / 7) * 100}%` }} /></div>
        </div>
      </div>

      <CourseGuideCta />

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
      <div ref={formRef} className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] shadow-sm p-6 sm:p-10">
        <form className="application-form" onSubmit={handleFormSubmit}>
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
                    ref={firstNameInputRef}
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
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'application-email-error' : undefined}
                    placeholder="e.g. bongani@gmail.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (emailError) setEmailError(getEmailValidationError(e.target.value) || '');
                    }}
                    onBlur={(e) => setEmailError(getEmailValidationError(e.target.value) || '')}
                    className={`w-full p-3 bg-[#FAFAFA] border rounded-xl focus:outline-none ${emailError ? 'border-[#B42318] focus:border-[#B42318]' : 'border-[#E0E0E0] focus:border-[#000000]'}`}
                  />
                  {emailError && <p id="application-email-error" role="alert" className="text-[11px] font-semibold text-[#B42318]">{emailError}</p>}
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
            const starterP = getTierPrice('STARTER', settings);
            const proP = getTierPrice('PROFESSIONAL', settings);
            const careerP = getTierPrice('CAREER_ACCELERATOR', settings);
            const starterContent = settings?.courseTierPricing?.STARTER;
            const professionalContent = settings?.courseTierPricing?.PROFESSIONAL;
            const acceleratorContent = settings?.courseTierPricing?.CAREER_ACCELERATOR;

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
                      <span className="text-[10px] font-mono uppercase text-[#707070] font-bold">{starterContent?.displayName || 'Starter'}</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        {starterP.isDiscounted && (
                          <span className="text-xs line-through text-[#A0A0A0] font-mono">R{starterP.original.toLocaleString()}</span>
                        )}
                        <span className="text-2xl font-light text-[#000000]">R{starterP.current.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#707070] mt-1">{starterContent?.description || 'Weekend self-paced practical lab track & workbook.'}</p>
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
                      <span>{proP.isDiscounted ? `${proP.discountPercent}% OFF` : professionalContent?.badgeLabel || 'Most Popular'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-mono uppercase font-bold ${formData.selectedTier === 'PROFESSIONAL' ? 'text-neutral-400' : 'text-[#707070]'}`}>{professionalContent?.displayName || 'Professional'}</span>
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
                      <p className={`text-xs mt-1 ${formData.selectedTier === 'PROFESSIONAL' ? 'text-neutral-300' : 'text-[#707070]'}`}>{professionalContent?.description || 'Full 15-module bootcamp, live evening/weekend classes & tickets.'}</p>
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
                      <span className="text-[10px] font-mono uppercase text-[#707070] font-bold">{acceleratorContent?.displayName || 'Career Accelerator'}</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        {careerP.isDiscounted && (
                          <span className="text-xs line-through text-[#A0A0A0] font-mono">R{careerP.original.toLocaleString()}</span>
                        )}
                        <span className="text-2xl font-light text-[#000000]">R{careerP.current.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#707070] mt-1">{acceleratorContent?.description || 'Everything in Professional + 1-on-1 CV review & mock interview.'}</p>
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
                {availableCohorts.map((cohort) => {
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
                {!availableCohorts.length && (
                  <div className="p-6 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-center">
                    <h4 className="font-bold text-sm text-[#000000]">No cohorts are currently accepting applications</h4>
                    <p className="mt-2 text-xs text-[#707070]">Please check back soon or contact admissions for the next available intake.</p>
                  </div>
                )}
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
                    <strong className="text-[#000000]">Course status and Terms:</strong> I understand that this is independent, non-accredited practical skills training. It is not an SAQA/NQF qualification, SETA/QCTO-accredited programme, university award, or Microsoft/vendor certification, and completion does not guarantee employment. Practical labs run on my own laptop, and I agree to the academy code of conduct.
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
                    const price = getTierPrice(formData.selectedTier, settings);
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
          <div className="sticky bottom-0 -mx-6 sm:-mx-10 px-6 sm:px-10 py-4 mt-8 flex items-center justify-between border-t border-[#E0E0E0] bg-white/95 backdrop-blur shadow-[0_-8px_20px_rgba(0,0,0,0.04)]">
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
                disabled={currentStep === 5 && !formData.cohortId}
                className="px-6 py-3 bg-[#000000] hover:bg-neutral-800 disabled:bg-[#A0A0A0] disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] flex items-center gap-2 transition"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !formData.cohortId}
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

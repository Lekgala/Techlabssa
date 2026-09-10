import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Terminal, 
  Menu, 
  X, 
  ChevronDown, 
  Server, 
  Shield, 
  GraduationCap, 
  UserCheck, 
  ExternalLink,
  PhoneCall,
  Calendar,
  Zap
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentPath, navigate, currentRole, logout, loginAsStudent, loginAsAdmin, settings } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setCoursesDropdownOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#F0F0F0] text-[#1A1A1A]">
      {/* Flash Sale Banner if Active */}
      {settings?.flashSale?.enabled && (
        <div className="bg-[#000000] text-white px-3 sm:px-4 py-2 text-center font-mono text-[11px] sm:text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 border-b border-[#333333]">
          <div className="flex items-center gap-2">
            <span className="bg-white text-black text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Zap className="w-3 h-3 text-[#000000] fill-[#000000]" />
              Flash Sale
            </span>
            <span className="font-sans font-bold text-xs leading-tight sm:leading-normal">
              {settings.flashSale.title} ({settings.flashSale.discountPercent}% OFF)
            </span>
          </div>
          <button
            onClick={() => handleNav('/pricing')}
            className="underline hover:text-neutral-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition shrink-0"
          >
            Claim Discount & Apply →
          </button>
        </div>
      )}

      {/* Top micro-bar with South Africa location and academy info */}
      <div className="bg-[#FAFAFA] px-4 sm:px-8 py-2 text-[10px] font-bold text-[#A0A0A0] uppercase tracking-[0.2em] border-b border-[#F0F0F0]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[#1A1A1A] font-medium tracking-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-[#000000]"></span>
              Cape Town, South Africa
            </span>
            <span className="hidden sm:inline text-[#E0E0E0]">|</span>
            <span className="hidden sm:inline text-[#707070] tracking-normal font-normal">VMware & M365 Hybrid Labs</span>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div 
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-6 h-6 bg-[#000000] rotate-45 flex items-center justify-center transition group-hover:rotate-90"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tighter uppercase text-[#000000]">
                  TechLabs
                </span>
                <span className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-[#A0A0A0] border border-[#E0E0E0] px-1.5 py-0.5 rounded">
                  SA
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
            <button
              id="nav-home"
              onClick={() => handleNav('/')}
              className={`transition pb-1 ${isActive('/') && currentPath === '/' ? 'text-[#000000] border-b border-[#000000]' : 'hover:text-[#000000]'}`}
            >
              Overview
            </button>

            {/* Courses Dropdown */}
            <div className="relative">
              <button
                id="nav-courses-dropdown"
                onClick={() => setCoursesDropdownOpen(!coursesDropdownOpen)}
                onMouseEnter={() => setCoursesDropdownOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setCoursesDropdownOpen(false);
                  if (event.key === 'ArrowDown') setCoursesDropdownOpen(true);
                }}
                aria-expanded={coursesDropdownOpen}
                aria-controls="courses-menu"
                className={`flex items-center gap-1 transition pb-1 ${isActive('/courses') ? 'text-[#000000] border-b border-[#000000]' : 'hover:text-[#000000]'}`}
              >
                <span>Curriculum</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {coursesDropdownOpen && (
                <div 
                  id="courses-menu"
                  role="menu"
                  onMouseLeave={() => setCoursesDropdownOpen(false)}
                  className="absolute top-full left-0 w-72 bg-[#FFFFFF] border border-[#F0F0F0] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNav('/courses/it-support')}
                    className="w-full p-3 rounded-xl hover:bg-[#FAFAFA] cursor-pointer transition text-left"
                  >
                    <span className="font-bold text-xs text-[#000000] tracking-normal block">IT Support & Enterprise Admin</span>
                    <p className="text-[11px] text-[#707070] tracking-normal mt-1 font-normal">
                      15-module practical engineering bootcamp covering Active Directory, M365, Intune, Defender & Helpdesk.
                    </p>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNav('/courses/it-support/curriculum')}
                    className="w-full p-3 rounded-xl hover:bg-[#FAFAFA] cursor-pointer transition border-t border-[#F0F0F0] text-left"
                  >
                    <span className="font-bold text-xs text-[#000000] tracking-normal block">15-Module Syllabus</span>
                    <p className="text-[11px] text-[#707070] tracking-normal mt-1 font-normal">
                      Detailed week-by-week labs and enterprise troubleshooting scenarios.
                    </p>
                  </button>
                </div>
              )}
            </div>

            <button
              id="nav-labs"
              onClick={() => handleNav('/labs')}
              className={`transition pb-1 ${isActive('/labs') ? 'text-[#000000] border-b border-[#000000]' : 'hover:text-[#000000]'}`}
            >
              VM Labs
            </button>

            <button
              id="nav-how-it-works"
              onClick={() => handleNav('/how-it-works')}
              className={`transition pb-1 ${isActive('/how-it-works') ? 'text-[#000000] border-b border-[#000000]' : 'hover:text-[#000000]'}`}
            >
              Methodology
            </button>

            <button
              id="nav-pricing"
              onClick={() => handleNav('/pricing')}
              className={`transition pb-1 ${isActive('/pricing') ? 'text-[#000000] border-b border-[#000000]' : 'hover:text-[#000000]'}`}
            >
              Tuition
            </button>

            <button
              id="nav-intakes"
              onClick={() => handleNav('/intakes')}
              className={`transition pb-1 ${isActive('/intakes') ? 'text-[#000000] border-b border-[#000000]' : 'hover:text-[#000000]'}`}
            >
              Intakes
            </button>

            <button
              id="nav-career"
              onClick={() => handleNav('/career')}
              className={`transition pb-1 ${isActive('/career') ? 'text-[#000000] border-b border-[#000000]' : 'hover:text-[#000000]'}`}
            >
              Career
            </button>

            <button
              id="nav-faq"
              onClick={() => handleNav('/faq')}
              className={`transition pb-1 ${isActive('/faq') ? 'text-[#000000] border-b border-[#000000]' : 'hover:text-[#000000]'}`}
            >
              FAQ
            </button>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden lg:flex items-center gap-4">
            {currentRole === 'STUDENT' ? (
              <button
                id="nav-portal-student-btn"
                onClick={() => handleNav('/student')}
                className="border border-[#000000] text-[#000000] hover:bg-[#000000] hover:text-white px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
              >
                Student Portal
              </button>
            ) : currentRole === 'ADMIN' || currentRole === 'INSTRUCTOR' ? (
              <button
                id="nav-portal-admin-btn"
                onClick={() => handleNav('/admin')}
                className="border border-[#000000] text-[#000000] hover:bg-[#000000] hover:text-white px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
              >
                Admin Console
              </button>
            ) : (
              <button
                id="nav-student-login-link"
                onClick={() => handleNav('/student/login')}
                className="border border-[#000000] text-[#000000] hover:bg-[#000000] hover:text-white px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
              >
                Student Portal
              </button>
            )}

            <button
              id="nav-apply-primary-cta"
              onClick={() => handleNav('/apply')}
              className="px-5 py-2.5 bg-[#000000] text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-colors shadow-sm"
            >
              Apply Online
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => handleNav('/apply')}
              className="bg-[#000000] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg"
            >
              Apply
            </button>
            <button
              id="mobile-menu-toggle"
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#1A1A1A] hover:bg-[#FAFAFA]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="lg:hidden bg-[#FFFFFF] border-b border-[#F0F0F0] px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-4">
          {settings?.flashSale?.enabled && (
            <div 
              onClick={() => handleNav('/pricing')}
              className="bg-[#000000] text-white p-3 rounded-xl cursor-pointer flex items-center justify-between gap-2 shadow-sm font-mono text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="bg-white text-black text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 font-sans">
                  <Zap className="w-3 h-3 fill-black text-black" />
                  Sale
                </span>
                <span className="font-sans font-bold text-[11px] leading-tight">
                  {settings.flashSale.discountPercent}% OFF Flash Sale
                </span>
              </div>
              <span className="text-[10px] uppercase underline font-bold tracking-wider shrink-0">Claim →</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 pb-3 border-b border-[#F0F0F0]">
            <button
              onClick={() => handleNav('/apply')}
              className="w-full py-2.5 bg-[#000000] text-white text-center font-bold text-xs uppercase tracking-wider rounded-xl"
            >
              Apply Now
            </button>
            {currentRole === 'STUDENT' ? (
              <button
                onClick={() => handleNav('/student')}
                className="w-full py-2.5 bg-[#FAFAFA] text-[#000000] text-center font-bold text-xs uppercase tracking-wider rounded-xl border border-[#E0E0E0]"
              >
                My Dashboard
              </button>
            ) : currentRole === 'ADMIN' || currentRole === 'INSTRUCTOR' ? (
              <button
                onClick={() => handleNav('/admin')}
                className="w-full py-2.5 bg-[#FAFAFA] text-[#000000] text-center font-bold text-xs uppercase tracking-wider rounded-xl border border-[#E0E0E0]"
              >
                Admin Panel
              </button>
            ) : (
              <button
                onClick={() => handleNav('/student')}
                className="w-full py-2.5 bg-[#FAFAFA] text-[#000000] text-center font-bold text-xs uppercase tracking-wider rounded-xl border border-[#E0E0E0]"
              >
                Student Login
              </button>
            )}
          </div>

          <div className="space-y-1 text-[#1A1A1A] text-xs font-bold uppercase tracking-wider">
            <button onClick={() => handleNav('/')} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA]">
              Overview
            </button>
            <button onClick={() => handleNav('/courses/it-support')} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA]">
              IT Support Bootcamp
            </button>
            <button onClick={() => handleNav('/courses/it-support/curriculum')} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA]">
              Curriculum (15 Modules)
            </button>
            <button onClick={() => handleNav('/labs')} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA]">
              VMware Labs
            </button>
            <button onClick={() => handleNav('/how-it-works')} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA]">
              Methodology
            </button>
            <button onClick={() => handleNav('/pricing')} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA]">
              Tuition (ZAR)
            </button>
            <button onClick={() => handleNav('/intakes')} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA]">
              Upcoming Intakes
            </button>
            <button onClick={() => handleNav('/career')} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA]">
              Career Support
            </button>
            <button onClick={() => handleNav('/faq')} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA]">
              FAQ
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

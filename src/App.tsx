import React, { useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { WhatsAppButton } from './components/layout/WhatsAppButton';
import { ToastContainer } from './components/layout/ToastContainer';
import { CookieNotice } from './components/layout/CookieNotice';

// Public Pages
import { Home } from './pages/public/Home';
import { CourseDetail, Curriculum } from './pages/public/Curriculum';
import { Courses, VerifyCertificate, Terms, Privacy, RefundPolicy } from './pages/public/LegalPages';
import { Labs, HowItWorks } from './pages/public/Labs';
import { Pricing, Intakes } from './pages/public/Pricing';
import { Career, About, FAQ, Contact } from './pages/public/Career';
import { Apply } from './pages/public/Apply';

// Auth Portals
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentLogin } from './pages/student/StudentLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const AppContent: React.FC = () => {
  const { currentPath, currentRole, hasHydrated, navigate, settings, showToast } = useApp();
  const yocoCallbackHandled = useRef(false);
  const isAdminRoute = currentPath === '/admin' || currentPath === '/admin/login' || currentPath.startsWith('/admin/');
  const path = (currentPath || '/')
    .replace(/^#/, '')
    .replace(/index\.html$/i, '')
    .replace(/\/$/, '')
    .trim() || '/';
  const isStaff = currentRole === 'ADMIN' || currentRole === 'INSTRUCTOR';
  const isStudentRoute = path === '/student' || path.startsWith('/student/');
  const isAdminPortalRoute = path === '/admin' || path.startsWith('/admin/');
  const isMaintenancePage = Boolean(hasHydrated && settings.maintenanceMode && !isAdminPortalRoute && !isStudentRoute && path !== '/privacy' && path !== '/terms');
  const redirectPath = !hasHydrated ? undefined
    : path === '/payment' ? '/student/payments'
    : isStudentRoute && currentRole === 'STUDENT' && path === '/student/login' ? '/student'
    : isStudentRoute && isStaff ? '/admin'
    : isAdminPortalRoute && isStaff && path === '/admin/login' ? '/admin'
    : isAdminPortalRoute && currentRole === 'STUDENT' ? '/student'
    : path === '/' && settings.defaultLandingPage && settings.defaultLandingPage !== '/' ? settings.defaultLandingPage
    : undefined;

  useEffect(() => {
    if (redirectPath) navigate(redirectPath, { replace: true });
  }, [navigate, redirectPath]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  useEffect(() => {
    if (yocoCallbackHandled.current) return;
    const url = new URL(window.location.href);
    const status = url.searchParams.get('yoco');
    if (!status) return;
    yocoCallbackHandled.current = true;
    const messages: Record<string, { type: 'success' | 'info' | 'error'; title: string; message: string }> = {
      returned: { type: 'info', title: 'Payment returned', message: 'Refresh payment status to check whether Yoco confirmed your payment.' },
      cancelled: { type: 'info', title: 'Payment cancelled', message: 'No payment was confirmed. You can return to checkout when you are ready.' },
      failed: { type: 'error', title: 'Payment failed', message: 'Yoco could not complete the payment. Please try again or use EFT.' },
    };
    const callback = messages[status];
    if (callback) showToast(callback.type, callback.title, callback.message);
    url.searchParams.delete('yoco');
    window.history.replaceState({}, '', url.toString());
  }, [showToast]);

  const renderPage = () => {
    if (isMaintenancePage) return <section className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4"><p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#707070]">Temporarily unavailable</p><h1 className="text-4xl font-light">We are updating the academy site</h1><p className="text-sm text-[#707070]">Please check back shortly or contact admissions for assistance.</p></section>;
    if (!hasHydrated && (isStudentRoute || isAdminPortalRoute)) {
      return (
        <section className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4 py-24">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#707070]">Initializing secure portal…</p>
        </section>
      );
    }
    if (redirectPath) return null;

    if (path === '/' || path === '') return <Home />;
    if (path === '/courses') return <Courses />;
    if (path === '/courses/it-support') return <CourseDetail />;
    if (path === '/courses/it-support/curriculum') return <Curriculum />;
    if (path === '/labs') return <Labs />;
    if (path === '/how-it-works') return <HowItWorks />;
    if (path === '/pricing') return settings.showPricing === false ? <section className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4"><h1 className="text-3xl font-light">Pricing is being updated</h1><p className="text-sm text-[#707070]">Please contact admissions for current tuition information.</p></section> : <Pricing />;
    if (path === '/intakes') return settings.showUpcomingCohorts === false ? <section className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4"><h1 className="text-3xl font-light">Upcoming intakes are being updated</h1><p className="text-sm text-[#707070]">Please contact admissions for the next available cohort.</p></section> : <Intakes />;
    if (path === '/career') return <Career />;
    if (path === '/about') return <About />;
    if (path === '/faq') return <FAQ />;
    if (path === '/contact') return <Contact />;
    if (path === '/apply') return <Apply />;
    if (path === '/student/login') return <StudentLogin />;
    if (path === '/student' || path.startsWith('/student/')) {
      return currentRole === 'STUDENT' ? <StudentDashboard /> : <StudentLogin />;
    }
    if (path === '/admin' || path === '/admin/login' || path.startsWith('/admin/')) return <AdminDashboard />;
    if (path === '/terms') return <Terms />;
    if (path === '/privacy') return <Privacy />;
    if (path === '/refunds' || path === '/refund-policy') return <RefundPolicy />;
    if (path.startsWith('/verify')) return <VerifyCertificate />;

    return (
      <section className="max-w-3xl mx-auto px-4 py-24 text-center space-y-5">
        <p className="font-mono text-sm text-[#707070]">404</p>
        <h1 className="text-4xl font-light">Page not found</h1>
        <button onClick={() => window.history.back()} className="px-5 py-3 rounded-xl bg-black text-white font-bold">Go back</button>
      </section>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#1A1A1A] font-sans antialiased selection:bg-black selection:text-white">
      <Navbar />
      <main className="flex-grow min-w-0">
        {renderPage()}
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <WhatsAppButton />}
      {!isAdminRoute && <CookieNotice />}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

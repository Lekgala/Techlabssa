import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { WhatsAppButton } from './components/layout/WhatsAppButton';
import { ToastContainer } from './components/layout/ToastContainer';

// Public Pages
import { Home } from './pages/public/Home';
import { CourseDetail, Curriculum } from './pages/public/Curriculum';
import { Courses, VerifyCertificate, Terms, Privacy, RefundPolicy } from './pages/public/LegalPages';
import { Labs, HowItWorks } from './pages/public/Labs';
import { Pricing, Intakes } from './pages/public/Pricing';
import { Career, About, FAQ, Contact } from './pages/public/Career';
import { Apply, Payment } from './pages/public/Apply';

// Auth Portals
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentLogin } from './pages/student/StudentLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const AppContent: React.FC = () => {
  const { currentPath, currentRole } = useApp();

  const renderPage = () => {
    const path = (currentPath || '/')
      .replace(/^#/, '')
      .replace(/index\.html$/i, '')
      .replace(/\/$/, '')
      .trim() || '/';

    if (path === '/' || path === '') return <Home />;
    if (path === '/courses') return <Courses />;
    if (path === '/courses/it-support') return <CourseDetail />;
    if (path === '/courses/it-support/curriculum') return <Curriculum />;
    if (path === '/labs') return <Labs />;
    if (path === '/how-it-works') return <HowItWorks />;
    if (path === '/pricing') return <Pricing />;
    if (path === '/intakes') return <Intakes />;
    if (path === '/career') return <Career />;
    if (path === '/about') return <About />;
    if (path === '/faq') return <FAQ />;
    if (path === '/contact') return <Contact />;
    if (path === '/apply') return <Apply />;
    if (path === '/payment') return <Payment />;
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
      <main className="flex-grow">
        {renderPage()}
      </main>
      <Footer />
      <WhatsAppButton />
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

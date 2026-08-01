import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { useAuth } from './context/AuthContext';
import { PageTransition } from './components/PageTransition';
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppProviders } from './components/providers/AppProviders';
import { TopLoader } from './components/ui/TopLoader';

// Lazy load heavy global UI overlays (named exports → default)
const Lightbox = React.lazy(() => import('./components/ui/Lightbox').then(m => ({ default: m.Lightbox })));
const CartDrawer = React.lazy(() => import('./components/ui/CartDrawer').then(m => ({ default: m.CartDrawer })));
const TripAssistant = React.lazy(() => import('./components/TripAssistant').then(m => ({ default: m.TripAssistant })));
const CookieConsent = React.lazy(() => import('./components/ui/CookieConsent').then(m => ({ default: m.CookieConsent })));
const CommandPalette = React.lazy(() => import('./components/ui/CommandPalette').then(m => ({ default: m.CommandPalette })));
const LoginModal = React.lazy(() => import('./components/auth/LoginModal').then(m => ({ default: m.LoginModal })));
const RegisterModal = React.lazy(() => import('./components/auth/RegisterModal').then(m => ({ default: m.RegisterModal })));

// Smooth Skeleton Loading Component (prevents layout collapse)
const PageLoader = () => (
  <div className="w-full min-h-[60vh] max-w-7xl mx-auto px-4 py-8 animate-pulse">
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3 mb-6"></div>
    <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
    </div>
  </div>
);

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    // Prevent browser from restoring scroll position
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // Force instant scroll to prevent smooth scrolling from interfering
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

const AppContent: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans w-full">
      <TopLoader />
      <Navbar />
      <main className="flex-grow overflow-x-hidden">
        <PageTransition>
          <ErrorBoundary>
            <React.Suspense fallback={<PageLoader />}>
              <AppRoutes />
            </React.Suspense>
          </ErrorBoundary>
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProviders>
      <Toaster position="bottom-left" />
      <ScrollToTop />
      <AppContent />
      <React.Suspense fallback={null}>
        <LoginModal />
        <RegisterModal />
        <Lightbox />
        <CartDrawer />
        <TripAssistant />
        <CookieConsent />
        <CommandPalette />
      </React.Suspense>
    </AppProviders>
  );
};

export default App;
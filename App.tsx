import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartProvider } from './context/CartContext';
import { ModalProvider } from './context/ModalContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LightboxProvider } from './context/LightboxContext';
import { NotificationProvider } from './context/NotificationContext';
import { PageTransition } from './components/PageTransition';
import { CurrencyProvider } from './context/CurrencyContext';
import { ChatProvider } from './context/ChatContext';
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Lazy load heavy components (named exports → default)
const Lightbox = React.lazy(() => import('./components/ui/Lightbox').then(m => ({ default: m.Lightbox })));
const CartDrawer = React.lazy(() => import('./components/ui/CartDrawer').then(m => ({ default: m.CartDrawer })));
const TripAssistant = React.lazy(() => import('./components/TripAssistant').then(m => ({ default: m.TripAssistant })));
const CookieConsent = React.lazy(() => import('./components/ui/CookieConsent').then(m => ({ default: m.CookieConsent })));
const CommandPalette = React.lazy(() => import('./components/ui/CommandPalette').then(m => ({ default: m.CommandPalette })));

// Loading Component
const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
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
    <div className="flex flex-col min-h-screen font-sans overflow-x-hidden w-full">
      <Navbar />
      <main className="flex-grow">
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
    <HelmetProvider>
      <BrowserRouter>
        <Toaster position="bottom-left" />
        <ScrollToTop />
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <CurrencyProvider>
                <NotificationProvider>
                  <CartProvider>
                    <FavoritesProvider>
                      <ModalProvider>
                        <LightboxProvider>
                          <ChatProvider>
                            <AppContent />
                            <LoginModal />
                            <RegisterModal />
                            <React.Suspense fallback={null}>
                              <Lightbox />
                              <CartDrawer />
                              <TripAssistant />
                              <CookieConsent />
                              <CommandPalette />
                            </React.Suspense>
                          </ChatProvider>
                        </LightboxProvider>
                      </ModalProvider>
                    </FavoritesProvider>
                  </CartProvider>
                </NotificationProvider>
              </CurrencyProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider >
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;
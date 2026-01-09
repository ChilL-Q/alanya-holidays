import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { PropertyDetails } from './pages/PropertyDetails';
import { Checkout } from './pages/Checkout';
import { ServicesPage } from './pages/ServicesPage';
import { ZeroFeesPage } from './pages/ZeroFeesPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { FAQ } from './pages/FAQ';
import { CarRental } from './pages/CarRental';
import { BikeRental } from './pages/BikeRental';
import { Visa } from './pages/Visa';
import { Esim } from './pages/Esim';
import { CartProvider } from './context/CartContext';
import { ModalProvider } from './context/ModalContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { LanguageProvider } from './context/LanguageContext';
import { LightboxProvider } from './context/LightboxContext';
import { Lightbox } from './components/ui/Lightbox';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Experiences } from './pages/Experiences';
import { PageTransition } from './components/PageTransition';


// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <LightboxProvider>
          <CartProvider>
            <ModalProvider>
              <FavoritesProvider>
                <HashRouter>
                  <ScrollToTop />
                  <div className="flex flex-col min-h-screen font-sans">
                    <Navbar />
                    <main className="flex-grow">
                      <PageTransition>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/search-results" element={<SearchResultsPage />} />
                          <Route path="/stays" element={<SearchResultsPage />} />
                          <Route path="/favorites" element={<FavoritesPage />} />
                          <Route path="/property/:id" element={<PropertyDetails />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/services" element={<ServicesPage />} />
                          <Route path="/zero-fees" element={<ZeroFeesPage />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/terms" element={<Terms />} />
                          <Route path="/experiences" element={<Experiences />} />
                          <Route path="/help" element={<FAQ />} />
                          <Route path="/support" element={<Contact />} />
                          <Route path="/services/car-rental" element={<CarRental />} />
                          <Route path="/services/bike-rental" element={<BikeRental />} />
                          <Route path="/services/visa" element={<Visa />} />
                          <Route path="/services/esim" element={<Esim />} />
                          <Route path="*" element={<Home />} />
                        </Routes>
                      </PageTransition>
                    </main>
                    <Footer />
                  </div>
                  <LoginModal />
                  <RegisterModal />
                  <Lightbox />
                </HashRouter>
              </FavoritesProvider>
            </ModalProvider>
          </CartProvider>
        </LightboxProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;
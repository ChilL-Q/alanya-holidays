import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { PropertyDetails } from './pages/PropertyDetails';
import { Checkout } from './pages/Checkout';
import { ServicesPage } from './pages/ServicesPage';
import { ZeroFeesPage } from './pages/ZeroFeesPage';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';

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
      <CartProvider>
        <HashRouter>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen font-sans">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/zero-fees" element={<ZeroFeesPage />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>

            <footer className="bg-slate-900 text-slate-300 py-12">
              <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h4 className="font-serif text-white text-xl font-bold mb-4">AlanyaHolidays</h4>
                  <p className="text-sm opacity-70">The premier marketplace for rentals and experiences in the jewel of the Mediterranean.</p>
                </div>
                <div>
                  <h5 className="text-white font-bold mb-4">Support</h5>
                  <ul className="space-y-2 text-sm">
                    <li>Help Center</li>
                    <li>Safety Information</li>
                    <li>Cancellation Options</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-bold mb-4">Hosting</h5>
                  <ul className="space-y-2 text-sm">
                    <li>List your home</li>
                    <li>Partner Dashboard</li>
                    <li>Community Forum</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-bold mb-4">About</h5>
                  <ul className="space-y-2 text-sm">
                    <li>Newsroom</li>
                    <li>Investors</li>
                    <li>Careers</li>
                  </ul>
                </div>
              </div>
              <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-xs text-center">
                © 2023 Alanya Holidays Inc. All rights reserved.
              </div>
            </footer>
          </div>
        </HashRouter>
      </CartProvider>
    </LanguageProvider>
  );
};

export default App;
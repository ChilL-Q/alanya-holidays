import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import { AuthProvider } from './context/AuthContext';
import { LightboxProvider } from './context/LightboxContext';
import { Lightbox } from './components/ui/Lightbox';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Experiences } from './pages/Experiences';
import { PageTransition } from './components/PageTransition';
import { CurrencyProvider } from './context/CurrencyContext';
import { ChatProvider } from './context/ChatContext';
import { TripAssistant } from './components/TripAssistant';
import { ListProperty } from './pages/ListProperty';
import { AddService } from './pages/AddService';
import { Shop } from './pages/Shop';
import { AddProduct } from './pages/AddProduct';
import { Profile } from './pages/Profile';
import { AdminPage } from './pages/AdminPage';
import { AdminEditPropertyPage } from './pages/AdminEditPropertyPage';
import { AdminEditUserPage } from './pages/AdminEditUserPage';
import { AdminRoute } from './components/auth/AdminRoute';
import { SystemTest } from './pages/SystemTest';



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
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <FavoritesProvider>
                <ModalProvider>
                  <LightboxProvider>
                    <ChatProvider>
                      <BrowserRouter>
                        <ScrollToTop />
                        <div className="flex flex-col min-h-screen font-sans">
                          <Navbar />
                          <main className="flex-grow">
                            <PageTransition>
                              <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/list-property" element={<ListProperty />} />
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
                                <Route path="/shop" element={<Shop />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/add-service" element={<AddService />} />
                                <Route path="/bookmarks" element={<FavoritesPage />} />

                                {/* Admin Routes Protected by AdminRoute */}
                                <Route path="/admin" element={
                                  <AdminRoute>
                                    <AdminPage />
                                  </AdminRoute>
                                } />
                                <Route path="/admin/edit-property/:id" element={
                                  <AdminRoute>
                                    <AdminEditPropertyPage />
                                  </AdminRoute>
                                } />
                                <Route path="/admin/edit-user/:id" element={
                                  <AdminRoute>
                                    <AdminEditUserPage />
                                  </AdminRoute>
                                } />

                                <Route path="/add-product" element={<AddProduct />} />
                                <Route path="/system-test" element={<SystemTest />} />
                                <Route path="*" element={<Home />} />
                              </Routes>
                            </PageTransition>
                          </main>
                          <Footer />
                        </div>
                        <LoginModal />
                        <RegisterModal />
                        <Lightbox />
                        <TripAssistant />
                      </BrowserRouter>
                    </ChatProvider>
                  </LightboxProvider>
                </ModalProvider>
              </FavoritesProvider>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
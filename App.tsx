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
import { CarModelDetails } from './pages/CarModelDetails';
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
import { NotificationProvider } from './context/NotificationContext';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Experiences } from './pages/Experiences';
import { PageTransition } from './components/PageTransition';
import { CurrencyProvider } from './context/CurrencyContext';
import { ChatProvider } from './context/ChatContext';
import { TripAssistant } from './components/TripAssistant';
import { CookieConsent } from './components/ui/CookieConsent';
import { ListProperty } from './pages/ListProperty';
import { AddService } from './pages/AddService';
import { Shop } from './pages/Shop';
import { AddProduct } from './pages/AddProduct';
import { Profile } from './pages/Profile';
import { BookVehicle } from './pages/booking/BookVehicle';
import { BookTour } from './pages/booking/BookTour';
import { HostDashboard } from './pages/host/HostDashboard';
import { HostLayout } from './components/layouts/HostLayout';
import { HostPropertiesPage } from './pages/host/HostPropertiesPage';
import { HostServicesPage } from './pages/host/HostServicesPage';
import { HostEditServicePage } from './pages/host/HostEditServicePage';
import { HostBookingsPage } from './pages/host/HostBookingsPage';
import { HostCalendarPage } from './pages/host/HostCalendarPage';
const AdminEditPropertyPage = React.lazy(() => import('./pages/admin/AdminEditPropertyPage').then(module => ({ default: module.AdminEditPropertyPage })));
const AdminEditUserPage = React.lazy(() => import('./pages/admin/AdminEditUserPage').then(module => ({ default: module.AdminEditUserPage })));
const AdminEditServicePage = React.lazy(() => import('./pages/admin/AdminEditServicePage').then(module => ({ default: module.AdminEditServicePage })));
// New Admin 3.0
import { AdminLayout } from './components/layouts/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { BookingsPage } from './pages/admin/BookingsPage';
import { PropertiesPage } from './pages/admin/PropertiesPage';
import { UsersPage } from './pages/admin/UsersPage';
import { ServicesPage as AdminServicesPage } from './pages/admin/ServicesPage';
import { AdminRoute } from './components/auth/AdminRoute';




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
            <NotificationProvider>
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
                                  <Route path="/services/car-rental/:modelId" element={<CarModelDetails />} />
                                  <Route path="/services/bike-rental" element={<BikeRental />} />
                                  <Route path="/services/visa" element={<Visa />} />
                                  <Route path="/services/esim" element={<Esim />} />
                                  <Route path="/shop" element={<Shop />} />
                                  <Route path="/profile" element={<Profile />} />
                                  <Route path="/add-service" element={<AddService />} />
                                  <Route path="/bookmarks" element={<FavoritesPage />} />
                                  <Route path="/book-vehicle/:id" element={<BookVehicle />} />
                                  <Route path="/book-tour/:id" element={<BookTour />} />
                                  <Route path="/host" element={
                                    <HostLayout>
                                      <HostDashboard />
                                    </HostLayout>
                                  } />
                                  <Route path="/host/properties" element={
                                    <HostLayout>
                                      <HostPropertiesPage />
                                    </HostLayout>
                                  } />
                                  <Route path="/host/services" element={
                                    <HostLayout>
                                      <HostServicesPage />
                                    </HostLayout>
                                  } />
                                  <Route path="/host/edit-service/:id" element={
                                    <HostLayout>
                                      <HostEditServicePage />
                                    </HostLayout>
                                  } />
                                  <Route path="/host/bookings" element={
                                    <HostLayout>
                                      <HostBookingsPage />
                                    </HostLayout>
                                  } />
                                  <Route path="/host/calendar" element={
                                    <HostLayout>
                                      <HostCalendarPage />
                                    </HostLayout>
                                  } />
                                  <Route path="/host/dashboard" element={
                                    <HostLayout>
                                      <HostDashboard />
                                    </HostLayout>
                                  } />
                                  <Route path="/host/messages" element={
                                    <HostLayout>
                                      <div className="p-8 text-center text-slate-500">Inbox coming soon...</div>
                                    </HostLayout>
                                  } />

                                  {/* Admin Routes Protected by AdminRoute */}
                                  <Route path="/admin" element={
                                    <AdminRoute>
                                      <AdminLayout>
                                        <Dashboard />
                                      </AdminLayout>
                                    </AdminRoute>
                                  } />
                                  <Route path="/admin/bookings" element={
                                    <AdminRoute>
                                      <AdminLayout>
                                        <BookingsPage />
                                      </AdminLayout>
                                    </AdminRoute>
                                  } />
                                  <Route path="/admin/properties" element={
                                    <AdminRoute>
                                      <AdminLayout>
                                        <PropertiesPage />
                                      </AdminLayout>
                                    </AdminRoute>
                                  } />
                                  <Route path="/admin/users" element={
                                    <AdminRoute>
                                      <AdminLayout>
                                        <UsersPage />
                                      </AdminLayout>
                                    </AdminRoute>
                                  } />
                                  <Route path="/admin/services" element={
                                    <AdminRoute>
                                      <AdminLayout>
                                        <AdminServicesPage />
                                      </AdminLayout>
                                    </AdminRoute>
                                  } />

                                  {/* Edit Routes (Wrapped in Layout) */}
                                  <Route path="/admin/edit-property/:id" element={
                                    <AdminRoute>
                                      <React.Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
                                        <AdminLayout>
                                          <AdminEditPropertyPage />
                                        </AdminLayout>
                                      </React.Suspense>
                                    </AdminRoute>
                                  } />
                                  <Route path="/admin/edit-user/:id" element={
                                    <AdminRoute>
                                      <React.Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
                                        <AdminLayout>
                                          <AdminEditUserPage />
                                        </AdminLayout>
                                      </React.Suspense>
                                    </AdminRoute>
                                  } />
                                  <Route path="/admin/edit-service/:id" element={
                                    <AdminRoute>
                                      <React.Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
                                        <AdminLayout>
                                          <AdminEditServicePage />
                                        </AdminLayout>
                                      </React.Suspense>
                                    </AdminRoute>
                                  } />



                                  <Route path="/add-product" element={<AddProduct />} />

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
                          <CookieConsent />
                        </BrowserRouter>
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
  );
};

export default App;
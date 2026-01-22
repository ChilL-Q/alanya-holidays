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
import { CartDrawer } from './components/ui/CartDrawer';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { ExperienceCategoryPage } from './pages/ExperienceCategoryPage';
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
// Host pages are lazy loaded below
import { Toaster } from 'react-hot-toast';
const AdminEditPropertyPage = React.lazy(() => import('./pages/admin/AdminEditPropertyPage').then(module => ({ default: module.AdminEditPropertyPage })));
const AdminEditUserPage = React.lazy(() => import('./pages/admin/AdminEditUserPage').then(module => ({ default: module.AdminEditUserPage })));
const AdminEditServicePage = React.lazy(() => import('./pages/admin/AdminEditServicePage').then(module => ({ default: module.AdminEditServicePage })));

// Lazy Load Admin Pages
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard').then(module => ({ default: module.Dashboard })));
const BookingsPage = React.lazy(() => import('./pages/admin/BookingsPage').then(module => ({ default: module.BookingsPage })));
const PropertiesPage = React.lazy(() => import('./pages/admin/PropertiesPage').then(module => ({ default: module.PropertiesPage })));
const UsersPage = React.lazy(() => import('./pages/admin/UsersPage').then(module => ({ default: module.UsersPage })));
const AdminServicesPage = React.lazy(() => import('./pages/admin/ServicesPage').then(module => ({ default: module.ServicesPage })));
const ReportsPage = React.lazy(() => import('./pages/admin/ReportsPage').then(module => ({ default: module.ReportsPage })));

// Lazy Load Host Pages
const HostDashboard = React.lazy(() => import('./pages/host/HostDashboard').then(module => ({ default: module.HostDashboard })));
const HostPropertiesPage = React.lazy(() => import('./pages/host/HostPropertiesPage').then(module => ({ default: module.HostPropertiesPage })));
const HostServicesPage = React.lazy(() => import('./pages/host/HostServicesPage').then(module => ({ default: module.HostServicesPage })));
const HostEditServicePage = React.lazy(() => import('./pages/host/HostEditServicePage').then(module => ({ default: module.HostEditServicePage })));
const HostBookingsPage = React.lazy(() => import('./pages/host/HostBookingsPage').then(module => ({ default: module.HostBookingsPage })));
const HostCalendarPage = React.lazy(() => import('./pages/host/HostCalendarPage').then(module => ({ default: module.HostCalendarPage })));
const HostMessagesPage = React.lazy(() => import('./pages/host/HostMessagesPage').then(module => ({ default: module.HostMessagesPage })));

import { AdminLayout } from './components/layouts/AdminLayout';
import { HostLayout } from './components/layouts/HostLayout';
import { AdminRoute } from './components/auth/AdminRoute';

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
                          <Toaster position="bottom-left" />
                          <ScrollToTop />
                          <div className="flex flex-col min-h-screen font-sans">
                            <Navbar />
                            <main className="flex-grow">
                              <PageTransition>
                                <React.Suspense fallback={<PageLoader />}>
                                  <Routes>
                                    <Route path="/" element={<Home />} />

                                    <Route path="/list-property" element={<ListProperty />} />

                                    <Route path="/search-results" element={<SearchResultsPage />} />
                                    <Route path="/stays" element={<SearchResultsPage />} />
                                    <Route path="/favorites" element={<FavoritesPage />} />
                                    <Route path="/property/:id" element={<PropertyDetails />} />
                                    <Route path="/checkout" element={<Checkout />} />
                                    <Route path="/services" element={<ServicesPage />} />
                                    <Route path="/services/:category" element={<ServicesPage />} />
                                    <Route path="/zero-fees" element={<ZeroFeesPage />} />
                                    <Route path="/about" element={<About />} />
                                    <Route path="/contact" element={<Contact />} />
                                    <Route path="/privacy" element={<Privacy />} />
                                    <Route path="/terms" element={<Terms />} />
                                    <Route path="/experiences/:category" element={<ExperienceCategoryPage />} />
                                    <Route path="/help" element={<FAQ />} />
                                    <Route path="/support" element={<Contact />} />
                                    <Route path="/services/car-rental" element={<CarRental />} />
                                    <Route path="/services/car-rental/:modelId" element={<CarModelDetails />} />
                                    <Route path="/services/bike-rental" element={<BikeRental />} />
                                    <Route path="/services/esim" element={<Esim />} />
                                    <Route path="/shop" element={<Shop />} />
                                    <Route path="/profile" element={<Profile />} />
                                    <Route path="/add-service" element={<AddService />} />
                                    <Route path="/bookmarks" element={<FavoritesPage />} />
                                    <Route path="/book-vehicle/:id" element={<BookVehicle />} />
                                    <Route path="/book-tour/:id" element={<BookTour />} />

                                    {/* Host Routes */}
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
                                    <Route path="/host/edit-property/:id" element={
                                      <HostLayout>
                                        <AdminEditPropertyPage />
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
                                        <HostMessagesPage />
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
                                    <Route path="/admin/reports" element={
                                      <AdminRoute>
                                        <AdminLayout>
                                          <ReportsPage />
                                        </AdminLayout>
                                      </AdminRoute>
                                    } />

                                    {/* Edit Routes (Wrapped in Layout) */}
                                    <Route path="/admin/edit-property/:id" element={
                                      <AdminRoute>
                                        <AdminLayout>
                                          <AdminEditPropertyPage />
                                        </AdminLayout>
                                      </AdminRoute>
                                    } />
                                    <Route path="/admin/edit-user/:id" element={
                                      <AdminRoute>
                                        <AdminLayout>
                                          <AdminEditUserPage />
                                        </AdminLayout>
                                      </AdminRoute>
                                    } />
                                    <Route path="/admin/edit-service/:id" element={
                                      <AdminRoute>
                                        <AdminLayout>
                                          <AdminEditServicePage />
                                        </AdminLayout>
                                      </AdminRoute>
                                    } />

                                    <Route path="/add-product" element={<AddProduct />} />

                                    <Route path="*" element={<Home />} />
                                  </Routes>
                                </React.Suspense>
                              </PageTransition>
                            </main>
                            <Footer />
                          </div>
                          <LoginModal />
                          <RegisterModal />
                          <Lightbox />
                          <CartDrawer />
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
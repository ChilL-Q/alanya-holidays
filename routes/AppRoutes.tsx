import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { AdminLayout } from '../components/layouts/AdminLayout';
import { HostLayout } from '../components/layouts/HostLayout';
import { AdminRoute } from '../components/auth/AdminRoute';
import { HostRoute } from '../components/auth/HostRoute';

// Public Pages - Direct Imports (for critical navigation speed)
import { Home } from '../pages/Home';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { ServicesPage } from '../pages/ServicesPage';
import { About } from '../pages/About';
import { Contact } from '../pages/Contact';
import { FAQ } from '../pages/FAQ';
import { Privacy } from '../pages/Privacy';
import { Terms } from '../pages/Terms';
import { Esim } from '../pages/Esim';
import { ListProperty } from '../pages/ListProperty';

// Public Pages - Lazy Loaded
const PropertyDetails = React.lazy(() => import('../pages/PropertyDetails').then(module => ({ default: module.PropertyDetails })));
const VisaConsult = React.lazy(() => import('../pages/VisaConsult').then(module => ({ default: module.VisaConsult })));
const CarRental = React.lazy(() => import('../pages/CarRental').then(module => ({ default: module.CarRental })));
const CarModelDetails = React.lazy(() => import('../pages/CarModelDetails').then(module => ({ default: module.CarModelDetails })));
const BikeRental = React.lazy(() => import('../pages/BikeRental').then(module => ({ default: module.BikeRental })));
const BicycleRental = React.lazy(() => import('../pages/BicycleRental').then(module => ({ default: module.BicycleRental })));
const Visa = React.lazy(() => import('../pages/Visa').then(module => ({ default: module.Visa })));
const Checkout = React.lazy(() => import('../pages/Checkout').then(module => ({ default: module.Checkout })));
const ZeroFeesPage = React.lazy(() => import('../pages/ZeroFeesPage').then(module => ({ default: module.ZeroFeesPage })));
const FavoritesPage = React.lazy(() => import('../pages/FavoritesPage').then(module => ({ default: module.FavoritesPage })));
const ExperienceCategoryPage = React.lazy(() => import('../pages/ExperienceCategoryPage').then(module => ({ default: module.ExperienceCategoryPage })));
const AddService = React.lazy(() => import('../pages/AddService').then(module => ({ default: module.AddService })));
const Shop = React.lazy(() => import('../pages/Shop').then(module => ({ default: module.Shop })));
const AddProduct = React.lazy(() => import('../pages/AddProduct').then(module => ({ default: module.AddProduct })));
const Profile = React.lazy(() => import('../pages/Profile').then(module => ({ default: module.Profile })));
const BookVehicle = React.lazy(() => import('../pages/booking/BookVehicle').then(module => ({ default: module.BookVehicle })));
const BookTour = React.lazy(() => import('../pages/booking/BookTour').then(module => ({ default: module.BookTour })));
const BookWellness = React.lazy(() => import('../pages/booking/BookWellness').then(module => ({ default: module.BookWellness })));
const BookingSuccess = React.lazy(() => import('../pages/booking/Success').then(module => ({ default: module.BookingSuccess })));
const InboxPage = React.lazy(() => import('../pages/InboxPage').then(module => ({ default: module.InboxPage })));
const CreativeServices = React.lazy(() => import('../pages/CreativeServices').then(module => ({ default: module.CreativeServices })));

// Lazy Load Admin Pages
const AdminEditPropertyPage = React.lazy(() => import('../pages/admin/AdminEditPropertyPage').then(module => ({ default: module.AdminEditPropertyPage })));
const AdminEditUserPage = React.lazy(() => import('../pages/admin/AdminEditUserPage').then(module => ({ default: module.AdminEditUserPage })));
const AdminEditServicePage = React.lazy(() => import('../pages/admin/AdminEditServicePage').then(module => ({ default: module.AdminEditServicePage })));
const Dashboard = React.lazy(() => import('../pages/admin/Dashboard').then(module => ({ default: module.Dashboard })));
const BookingsPage = React.lazy(() => import('../pages/admin/BookingsPage').then(module => ({ default: module.BookingsPage })));
const PropertiesPage = React.lazy(() => import('../pages/admin/PropertiesPage').then(module => ({ default: module.PropertiesPage })));
const UsersPage = React.lazy(() => import('../pages/admin/UsersPage').then(module => ({ default: module.UsersPage })));
const AdminServicesPage = React.lazy(() => import('../pages/admin/ServicesPage').then(module => ({ default: module.ServicesPage })));
const ReportsPage = React.lazy(() => import('../pages/admin/ReportsPage').then(module => ({ default: module.ReportsPage })));

// Lazy Load Host Pages
const HostDashboard = React.lazy(() => import('../pages/host/HostDashboard').then(module => ({ default: module.HostDashboard })));
const HostPropertiesPage = React.lazy(() => import('../pages/host/HostPropertiesPage').then(module => ({ default: module.HostPropertiesPage })));
const HostServicesPage = React.lazy(() => import('../pages/host/HostServicesPage').then(module => ({ default: module.HostServicesPage })));
const HostEditServicePage = React.lazy(() => import('../pages/host/HostEditServicePage').then(module => ({ default: module.HostEditServicePage })));
const HostBookingsPage = React.lazy(() => import('../pages/host/HostBookingsPage').then(module => ({ default: module.HostBookingsPage })));
const HostCalendarPage = React.lazy(() => import('../pages/host/HostCalendarPage').then(module => ({ default: module.HostCalendarPage })));
const HostMessagesPage = React.lazy(() => import('../pages/host/HostMessagesPage').then(module => ({ default: module.HostMessagesPage })));

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

export const AppRoutes: React.FC = () => {
    return (
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
                <Route path="/visa-consult" element={<VisaConsult />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/experiences/:category" element={<ExperienceCategoryPage />} />
                <Route path="/help" element={<FAQ />} />
                <Route path="/support" element={<Contact />} />
                <Route path="/services/car-rental" element={<CarRental />} />
                <Route path="/services/car-rental/:modelId" element={<CarModelDetails />} />
                <Route path="/services/bike-rental" element={<BikeRental />} />
                <Route path="/services/bicycle-rental" element={<BicycleRental />} />
                <Route path="/services/tourist-sim-card" element={<Esim />} />
                <Route path="/services/visa-legal" element={<Visa />} />
                <Route path="/creative-professionals/:subcategory" element={<CreativeServices />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/add-service" element={<AddService />} />
                <Route path="/bookmarks" element={<FavoritesPage />} />
                <Route path="/book-vehicle/:id" element={<BookVehicle />} />
                <Route path="/book-tour/:id" element={<BookTour />} />
                <Route path="/book-wellness/:id" element={<BookWellness />} />
                <Route path="/inbox" element={<InboxPage />} />

                {/* Host Routes - Protected */}
                <Route path="/booking/success" element={<BookingSuccess />} />
                <Route path="/host" element={
                    <HostRoute>
                        <HostLayout>
                            <HostDashboard />
                        </HostLayout>
                    </HostRoute>
                } />
                <Route path="/host/properties" element={
                    <HostRoute>
                        <HostLayout>
                            <HostPropertiesPage />
                        </HostLayout>
                    </HostRoute>
                } />
                <Route path="/host/services" element={
                    <HostRoute>
                        <HostLayout>
                            <HostServicesPage />
                        </HostLayout>
                    </HostRoute>
                } />
                <Route path="/host/edit-service/:id" element={
                    <HostRoute>
                        <HostLayout>
                            <HostEditServicePage />
                        </HostLayout>
                    </HostRoute>
                } />
                <Route path="/host/edit-property/:id" element={
                    <HostRoute>
                        <HostLayout>
                            <AdminEditPropertyPage />
                        </HostLayout>
                    </HostRoute>
                } />
                <Route path="/host/bookings" element={
                    <HostRoute>
                        <HostLayout>
                            <HostBookingsPage />
                        </HostLayout>
                    </HostRoute>
                } />
                <Route path="/host/calendar" element={
                    <HostRoute>
                        <HostLayout>
                            <HostCalendarPage />
                        </HostLayout>
                    </HostRoute>
                } />
                <Route path="/host/dashboard" element={
                    <HostRoute>
                        <HostLayout>
                            <HostDashboard />
                        </HostLayout>
                    </HostRoute>
                } />
                <Route path="/host/messages" element={
                    <HostRoute>
                        <HostLayout>
                            <HostMessagesPage />
                        </HostLayout>
                    </HostRoute>
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
    );
};

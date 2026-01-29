import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { Home } from '../pages/Home';
import { PropertyDetails } from '../pages/PropertyDetails';
import { Checkout } from '../pages/Checkout';
import { ServicesPage } from '../pages/ServicesPage';
import { ZeroFeesPage } from '../pages/ZeroFeesPage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { About } from '../pages/About';
import { Contact } from '../pages/Contact';
import { FAQ } from '../pages/FAQ';
import { CarRental } from '../pages/CarRental';
import { CarModelDetails } from '../pages/CarModelDetails';
import { BikeRental } from '../pages/BikeRental';
import { Visa } from '../pages/Visa';
import { Esim } from '../pages/Esim';
import { Privacy } from '../pages/Privacy';
import { Terms } from '../pages/Terms';
import { ExperienceCategoryPage } from '../pages/ExperienceCategoryPage';
import { ListProperty } from '../pages/ListProperty';
import { AddService } from '../pages/AddService';
import { Shop } from '../pages/Shop';
import { AddProduct } from '../pages/AddProduct';
import { Profile } from '../pages/Profile';
import { BookVehicle } from '../pages/booking/BookVehicle';
import { BookTour } from '../pages/booking/BookTour';
import { BookingSuccess } from '../pages/booking/Success';
import { InboxPage } from '../pages/InboxPage';



import { AdminLayout } from '../components/layouts/AdminLayout';
import { HostLayout } from '../components/layouts/HostLayout';
import { AdminRoute } from '../components/auth/AdminRoute';
import { HostRoute } from '../components/auth/HostRoute';

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

export const AppRoutes: React.FC = () => {
    return (
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
    );
};

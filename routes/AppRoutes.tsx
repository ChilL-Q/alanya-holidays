import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AdminLayout } from '../components/layouts/AdminLayout';
import { HostLayout } from '../components/layouts/HostLayout';
import { AdminRoute } from '../components/auth/AdminRoute';
import { HostRoute } from '../components/auth/HostRoute';
import { AuthRoute } from '../components/auth/AuthRoute';
import { NotFound } from '../components/pages/NotFound';

// Public Pages - Direct Imports (critical for immediate FCP)
const DirectoryHome = React.lazy(() => import('../pages/DirectoryHome').then(module => ({ default: module.DirectoryHome })));
const DirectoryCategoryPage = React.lazy(() => import('../pages/DirectoryCategoryPage').then(module => ({ default: module.DirectoryCategoryPage })));
const LoginRedirect = React.lazy(() => import('../pages/auth/LoginRedirect').then(module => ({ default: module.LoginRedirect })));

// Public Pages - Lazy Loaded
const AiPlanner = React.lazy(() => import('../pages/AiPlanner').then(module => ({ default: module.AiPlanner })));
const SearchResultsPage = React.lazy(() => import('../pages/SearchResultsPage').then(module => ({ default: module.SearchResultsPage })));
const ServicesPage = React.lazy(() => import('../pages/ServicesPage').then(module => ({ default: module.ServicesPage })));
const About = React.lazy(() => import('../pages/About').then(module => ({ default: module.About })));
const Contact = React.lazy(() => import('../pages/Contact').then(module => ({ default: module.Contact })));
const FAQ = React.lazy(() => import('../pages/FAQ').then(module => ({ default: module.FAQ })));
const Privacy = React.lazy(() => import('../pages/Privacy').then(module => ({ default: module.Privacy })));
const Terms = React.lazy(() => import('../pages/Terms').then(module => ({ default: module.Terms })));
const Esim = React.lazy(() => import('../pages/Esim').then(module => ({ default: module.Esim })));
const ListProperty = React.lazy(() => import('../pages/ListProperty').then(module => ({ default: module.ListProperty })));
const PropertyDetails = React.lazy(() => import('../pages/PropertyDetails').then(module => ({ default: module.PropertyDetails })));
const BlogPostPage = React.lazy(() => import('../pages/BlogPostPage').then(module => ({ default: module.BlogPostPage })));
const BlogPage = React.lazy(() => import('../pages/BlogPage').then(module => ({ default: module.BlogPage })));
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
const ReviewsAdminPage = React.lazy(() => import('../pages/admin/ReviewsAdminPage').then(module => ({ default: module.ReviewsAdminPage })));
const AdminProductsPage = React.lazy(() => import('../pages/admin/ProductsPage').then(module => ({ default: module.ProductsPage })));
const AdminEditProductPage = React.lazy(() => import('../pages/admin/AdminEditProductPage').then(module => ({ default: module.AdminEditProductPage })));
const DirectoryAdminPage = React.lazy(() => import('../pages/admin/DirectoryAdminPage').then(module => ({ default: module.DirectoryAdminPage })));
const AdminEditDirectoryPage = React.lazy(() => import('../pages/admin/AdminEditDirectoryPage').then(module => ({ default: module.AdminEditDirectoryPage })));

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
            <Route path="/" element={<DirectoryHome />} />
                <Route path="/ai-planner" element={<AiPlanner />} />

                {/* SEO-Optimized Directory Category Routes */}
                <Route path="/medical-tourism-alanya" element={<DirectoryCategoryPage categoryId="medical" />} />
                <Route path="/alanya-hotels" element={<DirectoryCategoryPage categoryId="accommodations" />} />
                <Route path="/alanya-villas" element={<DirectoryCategoryPage categoryId="villas" />} />
                <Route path="/alanya-apartments" element={<DirectoryCategoryPage categoryId="apartments" />} />
                <Route path="/things-to-do-in-alanya" element={<DirectoryCategoryPage categoryId="tours" />} />
                <Route path="/tours" element={<Navigate to="/things-to-do-in-alanya" replace />} />
                <Route path="/airport-transfer" element={<DirectoryCategoryPage categoryId="transport" />} />
                <Route path="/car-rental" element={<DirectoryCategoryPage categoryId="transport" />} />
                <Route path="/restaurants" element={<DirectoryCategoryPage categoryId="restaurants" />} />
                <Route path="/alanya-restaurants" element={<Navigate to="/restaurants" replace />} />
                <Route path="/alanya-real-estate" element={<DirectoryCategoryPage categoryId="real-estate" />} />
                <Route path="/alanya-residency-guide" element={<DirectoryCategoryPage categoryId="visa" />} />
                <Route path="/alanya-shopping-guide" element={<DirectoryCategoryPage categoryId="shopping" />} />
                <Route path="/alanya-nature-attractions" element={<DirectoryCategoryPage categoryId="nature" />} />
                <Route path="/nightlife" element={<DirectoryCategoryPage categoryId="nightlife" />} />
                <Route path="/alanya-spa-hamam" element={<DirectoryCategoryPage categoryId="spa-hamam" />} />
                <Route path="/alanya-hair-beauty" element={<DirectoryCategoryPage categoryId="hair-beauty" />} />

                <Route path="/list-property" element={<ListProperty />} />

                <Route path="/search-results" element={<SearchResultsPage />} />
                <Route path="/stays" element={<SearchResultsPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />

                {/* Auth Redirects */}
                <Route path="/login" element={<LoginRedirect mode="login" />} />
                <Route path="/register" element={<LoginRedirect mode="register" />} />

                <Route path="/checkout" element={<AuthRoute><Checkout /></AuthRoute>} />
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
                <Route path="/profile" element={<AuthRoute><Profile /></AuthRoute>} />
                <Route path="/add-service" element={
                    <HostRoute>
                        <AddService />
                    </HostRoute>
                } />
                <Route path="/bookmarks" element={<FavoritesPage />} />
                <Route path="/book-vehicle/:id" element={<AuthRoute><BookVehicle /></AuthRoute>} />
                <Route path="/book-tour/:id" element={<AuthRoute><BookTour /></AuthRoute>} />
                <Route path="/book-wellness/:id" element={<AuthRoute><BookWellness /></AuthRoute>} />
                <Route path="/inbox" element={<AuthRoute><InboxPage /></AuthRoute>} />

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
                <Route path="/host/fleet" element={
                    <HostRoute>
                        <HostLayout>
                            <HostServicesPage mode="fleet" />
                        </HostLayout>
                    </HostRoute>
                } />
                <Route path="/host/services" element={
                    <HostRoute>
                        <HostLayout>
                            <HostServicesPage mode="services" />
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
                <Route path="/admin/fleet" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminServicesPage type="fleet" />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/services" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminServicesPage type="services" />
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
                <Route path="/admin/reviews" element={
                    <AdminRoute>
                        <AdminLayout>
                            <ReviewsAdminPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/products" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminProductsPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/products/:id" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminEditProductPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/directory" element={
                    <AdminRoute>
                        <AdminLayout>
                            <DirectoryAdminPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/directory/:id" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminEditDirectoryPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/restaurants" element={
                    <AdminRoute>
                        <AdminLayout>
                            <DirectoryAdminPage defaultCategory="restaurants" />
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

                <Route path="/add-product" element={
                    <HostRoute>
                        <AddProduct />
                    </HostRoute>
                } />

                <Route path="*" element={<NotFound />} />
            </Routes>
    );
};

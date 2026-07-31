import React from 'react';
import { Route } from 'react-router-dom';

const AdminRoute = React.lazy(() => import('../components/auth/AdminRoute').then(m => ({ default: m.AdminRoute })));
const AdminLayout = React.lazy(() => import('../components/layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));

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
const AdminBlogSubmissionsPage = React.lazy(() => import('../pages/admin/AdminBlogSubmissionsPage').then(module => ({ default: module.AdminBlogSubmissionsPage })));
const AdminAddBlogPostPage = React.lazy(() => import('../pages/admin/AdminAddBlogPostPage').then(module => ({ default: module.AdminAddBlogPostPage })));
const AdminTestimonialsPage = React.lazy(() => import('../pages/admin/AdminTestimonialsPage').then(module => ({ default: module.AdminTestimonialsPage })));
const AdminListingReviewsPage = React.lazy(() => import('../pages/admin/AdminListingReviewsPage').then(module => ({ default: module.AdminListingReviewsPage })));
const AdminForumPage = React.lazy(() => import('../pages/admin/AdminForumPage').then(module => ({ default: module.AdminForumPage })));
const AdminEventsPage = React.lazy(() => import('../pages/admin/AdminEventsPage').then(module => ({ default: module.AdminEventsPage })));
const AdminEditPropertyPage = React.lazy(() => import('../pages/admin/AdminEditPropertyPage').then(module => ({ default: module.AdminEditPropertyPage })));
const AdminEditUserPage = React.lazy(() => import('../pages/admin/AdminEditUserPage').then(module => ({ default: module.AdminEditUserPage })));
const AdminEditServicePage = React.lazy(() => import('../pages/admin/AdminEditServicePage').then(module => ({ default: module.AdminEditServicePage })));

export const AdminRoutes: React.FC = () => (
    <>
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
        <Route path="/admin/listing-reviews" element={
            <AdminRoute>
                <AdminLayout>
                    <AdminListingReviewsPage />
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
        <Route path="/admin/blog-submissions" element={
            <AdminRoute>
                <AdminLayout>
                    <AdminBlogSubmissionsPage />
                </AdminLayout>
            </AdminRoute>
        } />
        <Route path="/admin/blog-submissions/new" element={
            <AdminRoute>
                <AdminLayout>
                    <AdminAddBlogPostPage />
                </AdminLayout>
            </AdminRoute>
        } />
        <Route path="/admin/testimonials" element={
            <AdminRoute>
                <AdminLayout>
                    <AdminTestimonialsPage />
                </AdminLayout>
            </AdminRoute>
        } />
        <Route path="/admin/forum" element={
            <AdminRoute>
                <AdminLayout>
                    <AdminForumPage />
                </AdminLayout>
            </AdminRoute>
        } />
        <Route path="/admin/events" element={
            <AdminRoute>
                <AdminLayout>
                    <AdminEventsPage />
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
        <Route path="/admin/cafes" element={
            <AdminRoute>
                <AdminLayout>
                    <DirectoryAdminPage defaultCategory="cafes" />
                </AdminLayout>
            </AdminRoute>
        } />
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
    </>
);

import React from 'react';
import { Route } from 'react-router-dom';

const HostRoute = React.lazy(() => import('../components/auth/HostRoute').then(m => ({ default: m.HostRoute })));
const HostLayoutController = React.lazy(() => import('../components/layouts/HostLayoutController').then(m => ({ default: m.HostLayoutController })));

const AddService = React.lazy(() => import('../pages/AddService').then(module => ({ default: module.AddService })));
const AddProduct = React.lazy(() => import('../pages/AddProduct').then(module => ({ default: module.AddProduct })));
const HostDashboard = React.lazy(() => import('../pages/host/HostDashboard').then(module => ({ default: module.HostDashboard })));
const HostPropertiesPage = React.lazy(() => import('../pages/host/HostPropertiesPage').then(module => ({ default: module.HostPropertiesPage })));
const HostServicesPage = React.lazy(() => import('../pages/host/HostServicesPage').then(module => ({ default: module.HostServicesPage })));
const HostEditServicePage = React.lazy(() => import('../pages/host/HostEditServicePage').then(module => ({ default: module.HostEditServicePage })));
const HostBookingsPage = React.lazy(() => import('../pages/host/HostBookingsPage').then(module => ({ default: module.HostBookingsPage })));
const HostCalendarPage = React.lazy(() => import('../pages/host/HostCalendarPage').then(module => ({ default: module.HostCalendarPage })));
const HostMessagesPage = React.lazy(() => import('../pages/host/HostMessagesPage').then(module => ({ default: module.HostMessagesPage })));
const DirectoryAnalyticsPage = React.lazy(() => import('../pages/host/DirectoryAnalyticsPage').then(module => ({ default: module.DirectoryAnalyticsPage })));
const HostUpgradesPage = React.lazy(() => import('../pages/host/HostUpgradesPage').then(module => ({ default: module.HostUpgradesPage })));
const AdminEditPropertyPage = React.lazy(() => import('../pages/admin/AdminEditPropertyPage').then(module => ({ default: module.AdminEditPropertyPage })));

export const HostRoutes: React.FC = () => (
    <>
        <Route path="/add-service" element={
            <HostRoute>
                <AddService />
            </HostRoute>
        } />
        <Route path="/add-product" element={
            <HostRoute>
                <AddProduct />
            </HostRoute>
        } />
        <Route path="/host" element={
            <HostRoute>
                <HostLayoutController>
                    <HostDashboard />
                </HostLayoutController>
            </HostRoute>
        } />
        <Route path="/host/properties" element={
            <HostRoute>
                <HostLayoutController>
                    <HostPropertiesPage />
                </HostLayoutController>
            </HostRoute>
        } />
        <Route path="/host/fleet" element={
            <HostRoute>
                <HostLayoutController>
                    <HostServicesPage mode="fleet" />
                </HostLayoutController>
            </HostRoute>
        } />
        <Route path="/host/services" element={
            <HostRoute>
                <HostLayoutController>
                    <HostServicesPage mode="services" />
                </HostLayoutController>
            </HostRoute>
        } />
        <Route path="/host/edit-service/:id" element={
            <HostRoute>
                <HostLayoutController>
                    <HostEditServicePage />
                </HostLayoutController>
            </HostRoute>
        } />
        <Route path="/host/edit-property/:id" element={
            <HostRoute>
                <HostLayoutController>
                    <AdminEditPropertyPage />
                </HostLayoutController>
            </HostRoute>
        } />
        <Route path="/host/bookings" element={
            <HostRoute>
                <HostLayoutController>
                    <HostBookingsPage />
                </HostLayoutController>
            </HostRoute>
        } />
        <Route path="/host/calendar" element={
            <HostRoute>
                <HostLayoutController>
                    <HostCalendarPage />
                </HostLayoutController>
            </HostRoute>
        } />
        <Route path="/host/dashboard" element={
            <HostRoute>
                <HostLayoutController>
                    <HostDashboard />
                </HostLayoutController>
            </HostRoute>
        } />
        <Route path="/host/messages" element={
            <HostRoute>
                <HostLayoutController>
                    <HostMessagesPage />
                </HostLayoutController>
            </HostRoute>
        } />
        <Route path="/host/directory-analytics" element={
            <HostRoute>
                <HostLayoutController>
                    <DirectoryAnalyticsPage />
                </HostLayoutController>
            </HostRoute>
        } />
        <Route path="/host/upgrades" element={
            <HostRoute>
                <HostLayoutController>
                    <HostUpgradesPage />
                </HostLayoutController>
            </HostRoute>
        } />
    </>
);

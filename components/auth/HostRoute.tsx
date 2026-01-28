import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface HostRouteProps {
    children: React.ReactNode;
}

/**
 * A wrapper component for routes that should be accessible by hosts AND admins.
 * It handles the loading state of authentication and redirects guests to home.
 */
export const HostRoute: React.FC<HostRouteProps> = ({ children }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    // Show loading state while authentication is being verified
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600 mx-auto mb-4" />
                    <p className="text-slate-500 animate-pulse">Verifying permissions...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Redirect to home if authenticated but not a host/admin
    // WE ALLOW ADMINS TO ACCESS HOST ROUTES TOO
    if (user?.role !== 'host' && user?.role !== 'admin') {
        console.warn(`Access denied to ${location.pathname}. Requirement: host/admin role. Current role: ${user?.role || 'guest'}`);
        return <Navigate to="/" replace />;
    }

    // If authenticated and host/admin, render the children
    return <>{children}</>;
};

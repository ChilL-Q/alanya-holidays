import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
    children: React.ReactNode;
}

/**
 * A wrapper component for routes that should only be accessible by administrators.
 * It handles the loading state of authentication and redirects non-admin users.
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
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

    // Redirect to home if not authenticated OR if authenticated but not an admin
    if (!isAuthenticated || user?.role !== 'admin') {
        console.warn(`Access denied to ${location.pathname}. Requirement: admin role. Current role: ${user?.role || 'guest'}`);
        return <Navigate to="/" replace />;
    }

    // If authenticated and admin, render the children
    return <>{children}</>;
};

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthRouteProps {
    children: React.ReactNode;
}

/**
 * A wrapper component for routes that require the user to be authenticated.
 * Redirects unauthenticated users to home, preserving the intended destination.
 */
export const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-cyan-400 mx-auto mb-4" />
                    <p className="text-slate-500 animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

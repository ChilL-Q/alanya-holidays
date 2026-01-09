import React from 'react';
import { useLocation } from 'react-router-dom';

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();

    return (
        <div
            key={location.pathname}
            className="animate-page-enter"
        >
            {children}
        </div>
    );
};

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps {
    to: string;
    label: string;
    isAccent?: boolean;
}

export const NavLink: React.FC<NavLinkProps> = ({ to, label, isAccent }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`relative px-4 py-2 font-medium transition-all duration-300 whitespace-nowrap rounded-full hover:scale-105 active:scale-95 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:text-primary dark:hover:text-white ${isActive
                ? (isAccent ? 'text-accent bg-white/80 dark:bg-slate-700/80 shadow-sm' : 'text-slate-900 dark:text-white')
                : (isAccent ? 'text-accent' : 'text-slate-600 dark:text-slate-300')
                }`}
            data-nav-link={to}
        >
            {label}
        </Link>
    );
};

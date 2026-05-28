import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

interface DesktopNavProps {
    mode?: 'directory' | 'rental';
}

const TabLink: React.FC<{ to: string; label: string; exact?: boolean }> = ({ to, label, exact }) => {
    const { pathname } = useLocation();
    const isActive = exact ? pathname === to : pathname === to || pathname.startsWith(to + '/');

    return (
        <Link
            to={to}
            className={`relative px-1 py-1 text-sm font-medium transition-colors whitespace-nowrap group ${
                isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
            {label}
            <span className={`absolute -bottom-[1px] left-0 right-0 h-0.5 rounded-full bg-slate-900 dark:bg-white transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-20'
            }`} />
        </Link>
    );
};

export const DesktopNav: React.FC<DesktopNavProps> = ({ mode = 'directory' }) => {
    const { t } = useLanguage();

    return (
        <nav className="hidden md:flex items-center gap-6 mx-4">
            {mode === 'directory' ? (
                <>
                    <TabLink to="/" label={t('nav.directory') || 'Directory'} exact />
                    <TabLink to="/blog" label={t('nav.blog') || 'Blog'} />
                    <TabLink to="/forum" label={t('nav.forum') || 'Forum'} />
                    <TabLink to="/shop" label={t('shop') || 'Shop'} />
                </>
            ) : (
                <>
                    <TabLink to="/alanya-villas" label={t('directory.villas') || 'Villas'} />
                    <TabLink to="/alanya-apartments" label={t('directory.apartments') || 'Apartments'} />
                    <TabLink to="/services/car-rental" label={t('nav.vehicles') || 'Vehicles'} />
                    <TabLink to="/services" label={t('nav.services') || 'Services'} exact />
                </>
            )}
        </nav>
    );
};

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { NavLink } from './NavLink';
import { NavIndicator } from './NavIndicator';

interface DesktopNavProps {
    mode?: 'directory' | 'rental';
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ mode = 'directory' }) => {
    const { t } = useLanguage();

    return (
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2 relative bg-slate-50 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200 dark:border-slate-800/50 backdrop-blur-sm mx-4">
            <NavIndicator mode={mode} />
            {mode === 'directory' ? (
                <>
                    <NavLink to="/" label={t('nav.directory')} />
                    <NavLink to="/community" label={t('nav.community') || 'Community'} />
                    <NavLink to="/shop" label={t('shop')} />
                </>
            ) : (
                <>
                    <NavLink to="/alanya-villas" label={t('directory.villas') || 'Villas'} />
                    <NavLink to="/alanya-apartments" label={t('directory.apartments') || 'Apartments'} />
                    <NavLink to="/services/car-rental" label={t('nav.vehicles') || 'Vehicles'} />
                    <NavLink to="/services" label={t('nav.services') || 'Services'} />
                </>
            )}
        </div>
    );
};

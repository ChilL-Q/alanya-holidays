import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { NavLink } from './NavLink';
import { NavIndicator } from './NavIndicator';

interface DesktopNavProps {
    mode?: 'rental' | 'services';
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ mode = 'rental' }) => {
    const { t } = useLanguage();

    return (
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2 relative bg-slate-50 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200 dark:border-slate-800/50 backdrop-blur-sm mx-4">
            <NavIndicator mode={mode} />
            {mode === 'rental' ? (
                <>
                    <NavLink to="/alanya-villas" label={t('directory.villas') || 'Villas'} />
                    <NavLink to="/alanya-apartments" label={t('directory.apartments') || 'Apartments'} />
                    <NavLink to="/" label={t('nav.directory')} />
                </>
            ) : (
                <>
                    <NavLink to="/services" label={t('nav.services') || 'Services'} />
                    <NavLink to="/shop" label={t('shop')} />
                    <NavLink to="/blog" label={t('nav.blog')} />
                </>
            )}
        </div>
    );
};

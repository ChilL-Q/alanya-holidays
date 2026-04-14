import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { NavLink } from './NavLink';
import { NavIndicator } from './NavIndicator';

export const DesktopNav: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2 relative bg-slate-50 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200 dark:border-slate-800/50 backdrop-blur-sm mx-4">
            <NavIndicator />
            <NavLink to="/" label={t('nav.directory')} />
            <NavLink to="/blog" label={t('nav.blog')} />
            <NavLink to="/shop" label={t('shop')} />
        </div>
    );
};

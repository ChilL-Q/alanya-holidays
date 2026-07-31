import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { DirectoryRoutes } from './directoryRoutes';
import { PublicRoutes } from './publicRoutes';
import { AccountRoutes } from './accountRoutes';
import { HostRoutes } from './hostRoutes';
import { AdminRoutes } from './adminRoutes';

const NotFound = React.lazy(() => import('../components/pages/NotFound').then(m => ({ default: m.NotFound })));

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {DirectoryRoutes()}
            {PublicRoutes()}
            {AccountRoutes()}
            {HostRoutes()}
            {AdminRoutes()}

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

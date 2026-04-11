import * as Sentry from '@sentry/react';
import React from 'react';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';

/**
 * Initialize Sentry error tracking.
 * Called once at app startup. No-op when VITE_SENTRY_DSN is not set.
 */
export function initSentry(): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn) {
        // Silently skip — local/dev environments don't need Sentry
        return;
    }

    Sentry.init({
        dsn,
        environment: import.meta.env.PROD ? 'production' : 'development',
        integrations: [
            // React Router v7 integration for automatic navigation tracing
            Sentry.reactRouterV7BrowserTracingIntegration({
                useEffect: React.useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes,
            }),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),
        ],

        // Performance traces — sample 20% in production
        tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,

        // Session replays — sample 10% in production
        replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 1.0,

        // Ignore noisy / unactionable errors
        ignoreErrors: [
            // Browser extensions
            'chrome-extension://',
            'moz-extension://',
            'safari-extension://',
            // Common third-party script errors
            'Script error.',
            'RandomlyChangeHash',
            // Network / offline issues
            'NetworkError',
            'Failed to fetch',
            'Load failed',
            'network error',
        ],

        // Deny URLs we don't want traces from (third-party iframes, etc.)
        denyUrls: [/chrome-extension:\/\//, /moz-extension:\/\//],
    });
}

export { Sentry };

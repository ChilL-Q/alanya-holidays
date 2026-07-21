#!/usr/bin/env node
/**
 * Build-time script to inject the correct Supabase URL into vercel.json rewrites.
 * Avoids hardcoding the project ref in version-controlled config.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';

if (!SUPABASE_URL) {
    console.warn('[generate-vercel-json] SUPABASE_URL not found in environment. Skipping rewrite injection.');
    process.exit(0);
}

const vercelPath = resolve(process.cwd(), 'vercel.json');
let vercelConfig;

try {
    vercelConfig = JSON.parse(readFileSync(vercelPath, 'utf-8'));
} catch (error) {
    console.error('[generate-vercel-json] Failed to read vercel.json:', error);
    process.exit(1);
}

const rewrittenRewrites = (vercelConfig.rewrites || []).map((rule) => {
    if (typeof rule.destination === 'string' && rule.destination.includes('supabase.co')) {
        return {
            ...rule,
            destination: rule.destination.replace(
                /https:\/\/[a-z0-9]+\.supabase\.co/,
                SUPABASE_URL.replace(/\/$/, '')
            ),
        };
    }
    return rule;
});

vercelConfig.rewrites = rewrittenRewrites;

writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2) + '\n');
console.log('[generate-vercel-json] Injected Supabase URL into vercel.json rewrites.');

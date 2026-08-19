import eslint from 'vite-plugin-eslint';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(() => {
  const isAnalyze = process.env.ANALYZE === 'true';
  const base = process.env.BASE_PATH || '/';
  const isPreview = process.env.IS_PREVIEW ? true : false;

  return {
    base,
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/calendar': {
          target: 'https://mdmizeyiyebvhkujjyjg.supabase.co/functions/v1/export-ical',
          changeOrigin: true,
          rewrite: (path) => {
            const idMatch = path.match(/\/calendar\/([^/?]+)/);
            const id = idMatch ? idMatch[1] : '';
            return `?id=${id}`;
          }
        },
        '^/api/': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        }
      }
    },
    preview: {
      port: 3000,
      host: '0.0.0.0'
    },
    plugins: [
      react(),
      eslint(),
      ...(isAnalyze ? [visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      })] : [])
    ],
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@react-google-maps') || id.includes('@googlemaps')) return 'vendor-maps';
              if (id.includes('recharts') || id.includes('d3-') || id.includes('/d3/')) return 'vendor-charts';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('@stripe')) return 'vendor-stripe';
              if (id.includes('@dnd-kit')) return 'vendor-dnd';
              if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('react-datepicker') || id.includes('date-fns')) return 'vendor-date-fns';
              if (id.includes('react-imask')) return 'vendor-imask';
              if (id.includes('zod')) return 'vendor-validation';
              if (id.includes('@headlessui/react')) return 'vendor-headlessui';
              if (id.includes('react-hot-toast')) return 'vendor-toast';
              if (id.includes('@sentry/react') || id.includes('@sentry/')) return 'vendor-sentry';
              if (
                id.includes('react') ||
                id.includes('scheduler') ||
                id.includes('@remix-run')
              ) {
                return 'vendor-react';
              }
            }
          }
        }
      }
    },
    define: {
      __BASE_PATH__: JSON.stringify(base),
      __IS_PREVIEW__: JSON.stringify(isPreview),
      __READDY_PROJECT_ID__: JSON.stringify(process.env.PROJECT_ID || ''),
      __READDY_VERSION_ID__: JSON.stringify(process.env.VERSION_ID || ''),
      __READDY_AI_DOMAIN__: JSON.stringify(process.env.READDY_AI_DOMAIN || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});

import eslint from 'vite-plugin-eslint';

import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(() => {
  const isAnalyze = process.env.ANALYZE === 'true';

  return {
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
      tailwindcss(),
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
              if (id.includes('@react-google-maps')) return 'vendor-maps';
              if (id.includes('recharts')) return 'vendor-charts';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('react-datepicker')) return 'vendor-datepicker';
              if (id.includes('date-fns')) return 'vendor-date-fns';
              if (id.includes('react-imask')) return 'vendor-imask';
              if (id.includes('zod')) return 'vendor-validation';
              if (id.includes('react-router-dom')) return 'vendor-router';
              if (id.includes('@headlessui/react')) return 'vendor-headlessui';
              if (id.includes('react-hot-toast')) return 'vendor-toast';
              if (id.includes('@sentry/react')) return 'vendor-sentry';
            }
            // Split large internal modules
            if (id.includes('pages/AiPlanner')) return 'pages-aiplanner';
            if (id.includes('components/charts')) return 'components-charts';
          }
        }
      }
    },
    define: {
      // GEMINI_API_KEY is now server-side only (ai-proxy Edge Function)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

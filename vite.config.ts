import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
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
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@react-google-maps')) return 'vendor-maps';
              if (id.includes('recharts')) return 'vendor-charts';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('@google/generative-ai')) return 'vendor-ai';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('date-fns') || id.includes('react-datepicker') || id.includes('react-imask')) return 'vendor-forms-dates';
              if (id.includes('react-dom') || id.includes('react-router') || id.includes('@remix-run')) return 'vendor-react';
              if (id.includes('framer-motion')) return 'vendor-motion';
              if (id.includes('@headlessui')) return 'vendor-ui';
              return 'vendor-core';
            }
          }
        }
      }
    },
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

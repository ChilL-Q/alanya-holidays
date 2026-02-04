import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('recharts') || id.includes('@react-google-maps')) return 'vendor-heavy';
              if (id.includes('@supabase') || id.includes('@google/generative-ai')) return 'vendor-api';
              if (id.includes('lucide-react') || id.includes('@headlessui')) return 'vendor-ui';
              return 'vendor'; // react, router, date-fns, zod, etc.
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

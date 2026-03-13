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
    preview: {
      port: 3000,
      host: '0.0.0.0'
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
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('date-fns') || id.includes('react-datepicker') || id.includes('react-imask')) return 'vendor-forms-dates';
            }
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

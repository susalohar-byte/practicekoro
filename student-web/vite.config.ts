import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Production builds are served from practicekoro.online/dashboard/ (next to the landing page and the
// admin console, which share its login). Override with VITE_BASE_PATH, e.g. "/" for its own domain.
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH || (command === 'build' ? '/dashboard/' : '/'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/@remix-run')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-query';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          return undefined;
        },
      },
    },
  },
}));

import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The demo engine's data (fake exams, tests, payments, students) is only read
// when VITE_ENABLE_DEMO_MODE is on, but localStore fills its stores at load
// time, so the bundler kept ~150 kB of it in every production build. Outside
// demo builds both modules resolve to src/services/demoDataStub.ts instead.
const DEMO_DATA_MODULES = [
  '/src/services/mockData/index.ts',
  '/src/services/domains/localStore.ts',
];

function stubDemoDataOutsideDemoBuilds(demoMode: boolean): Plugin {
  const stub = path.resolve(import.meta.dirname, './src/services/demoDataStub.ts');
  return {
    name: 'stub-demo-data',
    apply: 'build',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (demoMode || !importer || importer === stub) return null;
      if (!/mockData|localStore/.test(source)) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolved && DEMO_DATA_MODULES.some((m) => resolved.id.endsWith(m)) ? stub : null;
    },
  };
}

export default defineConfig(({ mode }) => {
  const demoMode =
    (process.env.VITE_ENABLE_DEMO_MODE ?? loadEnv(mode, process.cwd()).VITE_ENABLE_DEMO_MODE) ===
    'true';
  return {
    plugins: [react(), stubDemoDataOutsideDemoBuilds(demoMode)],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      allowedHosts: true,
    },
    build: {
      // Warn when a single chunk grows past 600 kB (raw). CI enforces the
      // total dist budget separately — see .github/workflows/ci.yml.
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        treeshake: demoMode
          ? undefined
          : { moduleSideEffects: (id: string) => !DEMO_DATA_MODULES.some((m) => id.endsWith(m)) },
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
  };
});

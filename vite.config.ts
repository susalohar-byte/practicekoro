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

// main.tsx loads the app with dynamic imports (after the env check), App then
// lazy-loads the landing page, and the page then asks for the hero photo: four
// round trips one after another before anything shows, each slow on shared
// hosting. Listing those files in index.html lets the browser fetch them all
// in the first round, in parallel with the entry script.
function preloadFirstScreen(): Plugin {
  const LANDING = 'src/pages/landing/LandingPage.tsx';
  return {
    name: 'preload-first-screen',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const bundle = ctx.bundle;
        const entry = ctx.chunk;
        if (!bundle || !entry) return;
        const chunks = Object.values(bundle).filter((c) => c.type === 'chunk');
        const landing = chunks.find((c) => c.facadeModuleId?.endsWith(LANDING));
        const seen = new Set<string>([entry.fileName, ...entry.imports]);
        const files: string[] = [];
        const visit = (file: string) => {
          if (seen.has(file)) return;
          seen.add(file);
          files.push(file);
          const chunk = bundle[file];
          if (chunk?.type === 'chunk') chunk.imports.forEach(visit);
        };
        entry.dynamicImports.forEach(visit);
        if (landing) visit(landing.fileName);
        return [
          ...files.map((file) => ({
            tag: 'link',
            attrs: { rel: 'modulepreload', crossorigin: true, href: `/${file}` },
            injectTo: 'head' as const,
          })),
          // Same breakpoint (sm, 640px) as the hero and login backgrounds.
          {
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'image',
              href: '/images/landing/hero_student_room_sm.webp',
              media: '(max-width: 639px)',
              fetchpriority: 'high',
            },
            injectTo: 'head' as const,
          },
          {
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'image',
              href: '/images/landing/hero_student_room.webp',
              media: '(min-width: 640px)',
              fetchpriority: 'high',
            },
            injectTo: 'head' as const,
          },
        ];
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const demoMode =
    (process.env.VITE_ENABLE_DEMO_MODE ?? loadEnv(mode, process.cwd()).VITE_ENABLE_DEMO_MODE) ===
    'true';
  return {
    plugins: [react(), stubDemoDataOutsideDemoBuilds(demoMode), preloadFirstScreen()],
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

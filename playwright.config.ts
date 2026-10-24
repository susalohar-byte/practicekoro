import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const localLaunchOptions = executablePath ? { launchOptions: { executablePath } } : {};

// Dedicated E2E port: must not collide with a developer's own `npm run preview`
// on 4173, otherwise Playwright would silently reuse a stale server whose
// dist/ was built WITHOUT VITE_ENABLE_DEMO_MODE (demo login then breaks).
const E2E_PORT = Number(process.env.E2E_PORT || 4174);
const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

// Admin flow specs run the real Supabase code path against a fake project host.
// Every request to it is answered by page.route stubs (tests/e2e/support), so no
// spec can reach production or Razorpay. Built into node_modules so it never
// clobbers dist/ or the demo-mode smoke build above.
const STUB_PORT = Number(process.env.E2E_STUB_PORT || 4175);
const STUB_BASE_URL = `http://127.0.0.1:${STUB_PORT}`;
const STUB_SUPABASE_URL = 'https://e2e-stub.supabase.co';
const STUB_OUT_DIR = 'node_modules/.e2e-stub-dist';

const demoServer = {
  // Hermetic E2E build: the Supabase vars are blanked so isSupabaseConfigured
  // is false and the app uses its in-memory demo engine. Otherwise Vite would
  // inherit the real credentials from .env, the RPCs would be called without
  // an authenticated session and every authenticated-route test would fail.
  // The demo flag is set inline as well as via env so it can never be skipped.
  command: `VITE_ENABLE_DEMO_MODE=true VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npm run build && npm run preview -- --host 127.0.0.1 --port ${E2E_PORT} --strictPort`,
  url: E2E_BASE_URL,
  reuseExistingServer: false,
  timeout: 120_000,
  env: {
    VITE_ENABLE_DEMO_MODE: 'true',
    VITE_SUPABASE_URL: '',
    VITE_SUPABASE_ANON_KEY: '',
  },
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
  },
  // E2E_ADMIN_FLOWS_ONLY=1 starts just the stub server (for `--project=admin-flows`).
  webServer: [
    ...(process.env.E2E_ADMIN_FLOWS_ONLY ? [] : [demoServer]),
    {
      command: `VITE_ENABLE_DEMO_MODE=false VITE_SUPABASE_URL=${STUB_SUPABASE_URL} VITE_SUPABASE_ANON_KEY=e2e-stub-anon-key npx vite build --outDir ${STUB_OUT_DIR} --emptyOutDir && npx vite preview --outDir ${STUB_OUT_DIR} --host 127.0.0.1 --port ${STUB_PORT} --strictPort`,
      url: STUB_BASE_URL,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        VITE_ENABLE_DEMO_MODE: 'false',
        VITE_SUPABASE_URL: STUB_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: 'e2e-stub-anon-key',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      testIgnore: /admin-flows\//,
      use: { ...devices['Desktop Chrome'], ...localLaunchOptions },
    },
    {
      name: 'mobile-chrome',
      testIgnore: /admin-flows\//,
      use: { ...devices['Pixel 7'], ...localLaunchOptions },
    },
    {
      name: 'admin-flows',
      testMatch: /admin-flows\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...localLaunchOptions,
        baseURL: STUB_BASE_URL,
        viewport: { width: 1440, height: 900 },
        // index.html's CSP only allows the production Supabase host; the stub host is
        // answered in-browser by page.route, so let the test browser connect to it.
        bypassCSP: true,
      },
    },
  ],
});

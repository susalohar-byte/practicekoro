import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const localLaunchOptions = executablePath ? { launchOptions: { executablePath } } : {};

// Dedicated E2E port: must not collide with a developer's own `npm run preview`
// on 4173, otherwise Playwright would silently reuse a stale server whose
// dist/ was built WITHOUT VITE_ENABLE_DEMO_MODE (demo login then breaks).
const E2E_PORT = Number(process.env.E2E_PORT || 4174);
const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: {
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
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...localLaunchOptions } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'], ...localLaunchOptions } },
  ],
});

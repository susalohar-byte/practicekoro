/**
 * Accessibility guard for the admin console.
 *
 * Renders each admin route (demo data) and runs axe-core rules that jsdom can evaluate:
 * every button, form field and dropdown must have an accessible name. Colour contrast needs a
 * real browser, so it is not checked here.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import axe from 'axe-core';
import { App } from '@/App';
import { ThemeProvider } from '@/context/ThemeContext';
import { MaintenanceProvider } from '@/context/MaintenanceContext';

vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: {
      id: 'admin-1',
      fullName: 'Demo Admin',
      email: 'admin@demo.local',
      role: 'admin',
      adminRole: 'super_admin',
    },
    role: 'admin',
    isAdmin: true,
    isStudent: false,
    isPro: true,
    loading: false,
    adminRole: 'super_admin',
    permissions: {},
    hasPermission: () => true,
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    refreshProStatus: vi.fn(),
  }),
}));

const NAME_RULES = [
  'button-name',
  'label',
  'select-name',
  'input-button-name',
  'aria-toggle-field-name',
];

const ADMIN_ROUTES = [
  '/admin',
  '/admin/question-bank',
  '/admin/tests',
  '/admin/exams',
  '/admin/subjects',
  '/admin/topics',
  '/admin/live-tests',
  '/admin/banners',
  '/admin/blog',
  '/admin/students',
  '/admin/test-attempts',
  '/admin/subscriptions',
  '/admin/rankings',
  '/admin/cutoff',
  '/admin/payments',
  '/admin/coupons',
  '/admin/notifications',
  '/admin/support',
  '/admin/staff',
  '/admin/audit-logs',
  '/admin/settings',
];

async function renderRoute(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <ThemeProvider>
            <MaintenanceProvider>
              <App />
            </MaintenanceProvider>
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
  // Wait for the lazy page to replace the route skeleton.
  await screen.findByRole('heading', { level: 1 }, { timeout: 10000 });
}

describe('Admin console accessibility', () => {
  it.each(ADMIN_ROUTES)(
    '%s: every control has an accessible name',
    async (path) => {
      await renderRoute(path);
      const results = await axe.run(document.body, {
        runOnly: { type: 'rule', values: NAME_RULES },
        resultTypes: ['violations'],
      });
      const problems = results.violations.flatMap((v) =>
        v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 160)}`)
      );
      cleanup();
      expect(problems).toEqual([]);
    },
    20000
  );
});

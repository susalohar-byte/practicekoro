import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { PublicOnlyRoute } from '@/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Login } from './Login';

// Stub the Supabase client boundary: no network, deterministic auth results.
const signInWithPassword = vi.fn();
const getSession = vi.fn();
const onAuthStateChange = vi.fn();

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  isDemoModeEnabled: false,
  supabaseRuntime: {
    auth: {
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
  },
}));

function renderLogin(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <ErrorBoundary area="PracticeKoro">
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route path="/" element={<div>Public landing page</div>} />
            <Route path="/admin" element={<div>Admin page</div>} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getSession.mockResolvedValue({ data: { session: null } });
  onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
});

describe('Login (auth regression)', () => {
  it('exposes the password field with an accessible label', async () => {
    renderLogin();
    await screen.findByRole('heading', { name: /welcome back/i });

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('shows OAuth error text containing a percent sign without crashing', async () => {
    renderLogin('/login?error=%25');

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeVisible();
    expect(await screen.findByText('%')).toBeVisible();
  });

  it('shows the error instead of silently staying put when login() rejects', async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { name: 'AuthApiError', message: 'Invalid login credentials' },
    });

    renderLogin();
    await screen.findByRole('heading', { name: /welcome back/i });

    fireEvent.change(screen.getByPlaceholderText('Enter your email or phone number'), {
      target: { value: 'admin@practicekoro.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wrongpassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    // The exact regression: the form used to unmount mid-submit (global
    // loading spinner) and swallow this error. It must now be visible
    // (as friendly copy) …
    const err = await screen.findByText(/Incorrect email or password/);
    expect(err).toBeVisible();
    // …and the form must still be mounted.
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  it('requires both fields before calling login()', async () => {
    const { container } = renderLogin();
    await screen.findByRole('heading', { name: /welcome back/i });

    // fireEvent.submit bypasses native `required` validation so the
    // JS-level guard inside handleSubmit is exercised directly.
    fireEvent.submit(container.querySelector('form')!);

    expect(await screen.findByText('Please enter both email and password.')).toBeVisible();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
  it('explains that phone sign-in is not available instead of calling login()', async () => {
    const { container } = renderLogin();
    await screen.findByRole('heading', { name: /welcome back/i });

    fireEvent.change(screen.getByPlaceholderText('Enter your email or phone number'), {
      target: { value: '98765 43210' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'secret123' },
    });
    fireEvent.submit(container.querySelector('form')!);

    expect(await screen.findByText(/Phone number sign-in is not available yet/)).toBeVisible();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('shows a small back arrow to the landing page and the create-account link', async () => {
    renderLogin();
    await screen.findByRole('heading', { name: /welcome back/i });

    expect(screen.getByRole('link', { name: 'Home পেজে ফিরুন' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Create Account' }).getAttribute('href')).toMatch(/signup$/);
  });
});

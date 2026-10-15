import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { PublicOnlyRoute } from '@/components/layout/ProtectedRoute';
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

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
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
  it('shows the error instead of silently staying put when login() rejects', async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { name: 'AuthApiError', message: 'Invalid login credentials' },
    });

    renderLogin();
    await screen.findByRole('heading', { name: /admin sign in/i });

    fireEvent.change(screen.getByPlaceholderText('aspirant@gmail.com'), {
      target: { value: 'admin@practicekoro.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    // The exact regression: the form used to unmount mid-submit (global
    // loading spinner) and swallow this error. It must now be visible
    // (as friendly copy) …
    const err = await screen.findByText(/Incorrect email or password/);
    expect(err).toBeVisible();
    // …and the form must still be mounted.
    expect(screen.getByRole('heading', { name: /admin sign in/i })).toBeVisible();
  });

  it('requires both fields before calling login()', async () => {
    const { container } = renderLogin();
    await screen.findByRole('heading', { name: /admin sign in/i });

    // fireEvent.submit bypasses native `required` validation so the
    // JS-level guard inside handleSubmit is exercised directly.
    fireEvent.submit(container.querySelector('form')!);

    expect(await screen.findByText('Please enter both email and password.')).toBeVisible();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});

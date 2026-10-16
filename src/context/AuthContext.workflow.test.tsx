import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  rpc: vi.fn(),
  profile: null as Record<string, unknown> | null,
  roles: [] as Array<{ role: string }>,
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  isDemoModeEnabled: false,
  supabaseRuntime: {
    auth: {
      getSession: m.getSession,
      onAuthStateChange: m.onAuthStateChange,
      signInWithPassword: m.signInWithPassword,
      signOut: m.signOut,
    },
    from: (table: string) => ({
      select: () => ({
        eq: () =>
          table === 'profiles'
            ? { maybeSingle: async () => ({ data: m.profile, error: null }) }
            : Promise.resolve({ data: m.roles, error: null }),
      }),
    }),
    rpc: m.rpc,
  },
}));

import { AuthProvider, useAuth } from './AuthContext';

const authUser = {
  id: 'student-1',
  email: 'student@example.com',
  user_metadata: {},
};

function AuthProbe() {
  const { user, login, logout } = useAuth();
  return (
    <>
      <output data-testid="auth-state">
        {user ? `${user.role}:${user.fullName}` : 'logged-out'}
      </output>
      <button onClick={() => void login(' student@example.com ', 'password')}>login</button>
      <button onClick={() => void logout()}>logout</button>
    </>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  m.profile = {
    id: authUser.id,
    email: authUser.email,
    full_name: 'Practice Student',
    role: 'student',
    account_status: 'active',
  };
  m.roles = [{ role: 'student' }];
  m.getSession.mockResolvedValue({ data: { session: null } });
  m.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  m.signInWithPassword.mockResolvedValue({ data: { user: authUser, session: {} }, error: null });
  m.signOut.mockResolvedValue({ error: null });
  m.rpc.mockResolvedValue({ data: false, error: null });
});

describe('AuthContext session workflow regressions', () => {
  it('restores a valid Supabase session and caches its resolved profile', async () => {
    m.getSession.mockResolvedValue({ data: { session: { user: authUser } } });

    renderAuth();

    expect(await screen.findByTestId('auth-state')).toHaveTextContent('student:Practice Student');
    expect(JSON.parse(localStorage.getItem('practicekoro_user') || 'null')).toMatchObject({
      id: 'student-1',
      role: 'student',
      fullName: 'Practice Student',
    });
  });

  it('clears stale cached identity when Supabase has no active session', async () => {
    localStorage.setItem(
      'practicekoro_user',
      JSON.stringify({ id: 'previous-user', role: 'admin', fullName: 'Stale Admin' })
    );
    localStorage.setItem('practicekoro_is_pro', 'true');

    renderAuth();

    expect(await screen.findByTestId('auth-state')).toHaveTextContent('logged-out');
    expect(localStorage.getItem('practicekoro_user')).toBeNull();
    expect(localStorage.getItem('practicekoro_is_pro')).toBeNull();
  });

  it('trims the login email and persists only the database-resolved user role', async () => {
    renderAuth();
    await screen.findByTestId('auth-state');

    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    expect(await screen.findByTestId('auth-state')).toHaveTextContent('student:Practice Student');
    expect(m.signInWithPassword).toHaveBeenCalledWith({
      email: 'student@example.com',
      password: 'password',
    });
    expect(JSON.parse(localStorage.getItem('practicekoro_user') || 'null')).toMatchObject({
      id: 'student-1',
      role: 'student',
    });
  });

  it('clears local identity and premium cache when logging out', async () => {
    m.getSession.mockResolvedValue({ data: { session: { user: authUser } } });
    localStorage.setItem('practicekoro_is_pro', 'true');

    renderAuth();
    expect(await screen.findByTestId('auth-state')).toHaveTextContent('student:Practice Student');

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));

    expect(await screen.findByTestId('auth-state')).toHaveTextContent('logged-out');
    expect(m.signOut).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('practicekoro_user')).toBeNull();
    expect(localStorage.getItem('practicekoro_is_pro')).toBeNull();
  });
});

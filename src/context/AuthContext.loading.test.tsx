import React, { useEffect } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

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
        }),
      }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
  },
}));

/**
 * Records every `loading` value the provider emits, so the test can prove
 * login()/register()/loginWithGoogle() never toggle the GLOBAL loading flag.
 * (Route guards swap children for a spinner while loading=true, which used to
 * unmount the Login form mid-submit and swallow the result.)
 */
function useLoadingProbe(onSample: (loading: boolean) => void) {
  const { loading, login } = useAuth();
  const ref = React.useRef({ loading, login });
  ref.current = { loading, login };
  useEffect(() => {
    onSample(loading);
  }, [loading, onSample]);
  return ref;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getSession.mockResolvedValue({ data: { session: null } });
  onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
});

describe('AuthContext global loading (regression)', () => {
  it('login() failure returns the error without ever setting loading=true after bootstrap', async () => {
    signInWithPassword.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { user: null, session: null },
                error: { name: 'AuthApiError', message: 'Invalid login credentials' },
              }),
            50
          )
        )
    );

    const samples: boolean[] = [];
    let probe!: React.MutableRefObject<{
      loading: boolean;
      login: (e: string, p: string) => Promise<{ error: Error | null }>;
    }>;

    function Probe() {
      probe = useLoadingProbe((v) => samples.push(v));
      return null;
    }

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    // Wait for bootstrap to settle (initial true -> false).
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(samples[samples.length - 1]).toBe(false);
    const baseline = samples.length;

    let result!: { error: Error | null };
    await act(async () => {
      result = await probe.current.login('admin@practicekoro.com', 'wrong');
    });

    expect(result.error?.message).toBe('Invalid login credentials');
    // Nothing after bootstrap may flip loading back to true.
    expect(samples.slice(baseline)).toEqual(expect.not.arrayContaining([true]));
  });

  it('register() without a session returns needsConfirmation and never logs in', async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: {
        // Email confirmation ON: user exists but no session issued.
        user: { id: 'new-user-1', email: 'new@example.com' },
        session: null,
      },
      error: null,
    });
    const { supabaseRuntime } = await import('@/lib/supabase');
    (supabaseRuntime as unknown as { auth: { signUp: unknown } }).auth.signUp = signUp;

    let probe!: React.MutableRefObject<{
      register: (
        e: string,
        p: string,
        q: string
      ) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
      user: unknown;
    }>;

    function Probe() {
      const { register: reg, user } = useAuth();
      probe = React.useRef({ register: reg, user });
      probe.current = { register: reg, user };
      return null;
    }

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    let result!: { error: Error | null; needsConfirmation?: boolean };
    await act(async () => {
      result = await probe.current.register('New User', 'new@example.com', 'secret123');
    });

    expect(result.error).toBeNull();
    expect(result.needsConfirmation).toBe(true);
    // No fake logged-in state without a session.
    expect(probe.current.user).toBeNull();
  });
});

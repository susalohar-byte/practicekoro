import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { clearSavedQuestionsCache } from '@/lib/savedQuestions';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Set when the student opened a password-reset link (PASSWORD_RECOVERY event). */
  recovery: boolean;
  clearRecovery: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(next);
      setLoading(false);
      if (event === 'SIGNED_OUT') queryClient.clear();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      recovery,
      clearRecovery: () => setRecovery(false),
      signOut: async () => {
        const uid = session?.user.id;
        try {
          await supabase.auth.signOut();
        } finally {
          // The next student on this browser must not see this student's details.
          if (uid) clearSavedQuestionsCache(uid);
          queryClient.clear();
        }
      },
    }),
    [session, loading, recovery, queryClient]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** For pages behind <RequireAuth>, where a user always exists. */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useUser used outside a protected route');
  return user;
}

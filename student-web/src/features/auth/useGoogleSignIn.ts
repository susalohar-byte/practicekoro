import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyAuthError } from '@/lib/errors';
import { callbackUrl } from './AuthLayout';

export function useGoogleSignIn(onError: (msg: string) => void) {
  const [loading, setLoading] = useState(false);
  const start = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setLoading(false);
      onError(friendlyAuthError(error) || 'Google sign-in could not be completed. Please try again.');
    }
    // On success the browser leaves for Google; /login-callback finishes the sign-in.
  };
  return { loading, start };
}

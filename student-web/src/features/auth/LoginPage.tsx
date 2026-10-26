import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { friendlyAuthError } from '@/lib/errors';
import { AuthLayout, Banner, Field, GoogleButton, OrDivider, PasswordField, SubmitButton, validateEmail } from './AuthLayout';
import { useGoogleSignIn } from './useGoogleSignIn';
import { onboardingDone } from '@/features/onboarding/OnboardingPage';
import { FullPageLoader } from '@/components/ui/Feedback';
import { goToSharedLogin, shouldUseSharedLogin } from '@/lib/sharedLogin';

export default function LoginPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const google = useGoogleSignIn(setBanner);
  // On the live site everyone signs in on practicekoro.online/login (one page for admins and students)
  const [useShared] = useState(shouldUseSharedLogin);

  useEffect(() => {
    if (useShared) goToSharedLogin();
  }, [useShared]);

  if (useShared) return <FullPageLoader />;
  if (!onboardingDone()) return <Navigate to={`/onboarding${params.toString() ? `?${params}` : ''}`} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = { email: validateEmail(email), password: password ? null : 'Enter your password' };
    setErrors(next);
    if (next.email || next.password) return;
    setLoading(true);
    setBanner(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setBanner(friendlyAuthError(error));
    // On success GuestOnly redirects to /home (or ?next=).
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to practise mock tests & track your progress.">
      {banner && <Banner tone="error">{banner}</Banner>}
      <GoogleButton label="Continue with Google" loading={google.loading} onClick={google.start} />
      <OrDivider />
      <form onSubmit={submit} noValidate>
        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          icon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="-mt-1 mb-2 text-right">
          <Link to="/forgot-password" className="text-[13px] font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <SubmitButton loading={loading}>Log In</SubmitButton>
      </form>
      <p className="mt-6 text-center text-[14px] text-[#64748B]">
        New to PracticeKoro?{' '}
        <Link to="/signup" className="font-bold text-primary hover:underline">
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}

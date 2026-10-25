import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { friendlyAuthError } from '@/lib/errors';
import { AuthLayout, Banner, Field, SubmitButton, callbackUrl, validateEmail } from './AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validateEmail(email);
    setError(v);
    if (v) return;
    setLoading(true);
    setBanner(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: callbackUrl() });
    setLoading(false);
    if (err) return setBanner(friendlyAuthError(err));
    setSent(true);
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We will email you a link to set a new password." back="/login">
      {banner && <Banner tone="error">{banner}</Banner>}
      {sent ? (
        <>
          <Banner tone="success">
            If an account exists for {email.trim()}, a reset link is on its way. Open it on this device to choose a new password.
          </Banner>
          <Link to="/login" className="flex h-[52px] w-full items-center justify-center rounded-card bg-primary text-[15px] font-semibold text-white hover:bg-primary-dark">
            Back to Log In
          </Link>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          <Field label="Email address" name="email" type="email" autoComplete="email" placeholder="name@example.com" icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <SubmitButton loading={loading}>Send Reset Link</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { friendlyAuthError } from '@/lib/errors';
import {
  AuthLayout,
  Banner,
  Field,
  GoogleButton,
  OrDivider,
  PasswordField,
  SubmitButton,
  callbackUrl,
  validateEmail,
  validatePassword,
} from './AuthLayout';
import { useGoogleSignIn } from './useGoogleSignIn';

export default function SignUpPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const google = useGoogleSignIn(setBanner);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      name: form.name.trim().length < 2 ? 'Enter your full name' : null,
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: form.confirm !== form.password ? 'Passwords do not match' : null,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setLoading(true);
    setBanner(null);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      // Read by the handle_new_user trigger to create the profile row.
      options: { data: { full_name: form.name.trim() }, emailRedirectTo: callbackUrl() },
    });
    setLoading(false);
    if (error) return setBanner(friendlyAuthError(error));
    if (!data.session) setSentTo(form.email.trim());
  };

  if (sentTo) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step to finish creating your account." back="/login">
        <Banner tone="success">We sent a confirmation link to {sentTo}. Open it on this device, then log in.</Banner>
        <Link to="/login" className="flex h-[52px] w-full items-center justify-center rounded-card bg-primary text-[15px] font-semibold text-white hover:bg-primary-dark">
          Go to Log In
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Practise mock tests and track your progress." back="/login">
      {banner && <Banner tone="error">{banner}</Banner>}
      <GoogleButton label="Sign up with Google" loading={google.loading} onClick={google.start} />
      <OrDivider />
      <form onSubmit={submit} noValidate>
        <Field label="Full name" name="name" autoComplete="name" placeholder="Student Name" icon={<User />} value={form.name} onChange={set('name')} error={errors.name} />
        <Field label="Email address" name="email" type="email" autoComplete="email" placeholder="name@example.com" icon={<Mail />} value={form.email} onChange={set('email')} error={errors.email} />
        <PasswordField label="Password (min. 6 characters)" name="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
        <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        <SubmitButton loading={loading}>Create Account</SubmitButton>
      </form>
      <p className="mt-6 text-center text-[14px] text-[#64748B]">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

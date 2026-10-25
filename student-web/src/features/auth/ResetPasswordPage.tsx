import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { friendlyAuthError } from '@/lib/errors';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { FullPageLoader } from '@/components/ui/Feedback';
import { AuthLayout, Banner, PasswordField, SubmitButton, validatePassword } from './AuthLayout';

export default function ResetPasswordPage() {
  const { user, loading: authLoading, clearRecovery } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (authLoading) return <FullPageLoader />;
  // The reset link signs the student in; without that session there is nothing to update.
  if (!user) return <Navigate to="/forgot-password" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      password: validatePassword(form.password),
      confirm: form.confirm !== form.password ? 'Passwords do not match' : null,
    };
    setErrors(next);
    if (next.password || next.confirm) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: form.password });
    setLoading(false);
    if (error) return setBanner(friendlyAuthError(error));
    clearRecovery();
    toast('Password updated.', 'success');
    navigate('/home', { replace: true });
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Use at least 6 characters.">
      {banner && <Banner tone="error">{banner}</Banner>}
      <form onSubmit={submit} noValidate>
        <PasswordField label="New password" name="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} error={errors.password} />
        <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} error={errors.confirm} />
        <SubmitButton loading={loading}>Update Password</SubmitButton>
      </form>
    </AuthLayout>
  );
}

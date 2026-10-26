import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, ChevronDown, Flag, Map, MapPin, ShieldCheck, Trash2, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { friendlyError } from '@/lib/errors';
import { useAuth } from '@/auth/AuthProvider';
import { qk, useExams, useProfile } from '@/hooks/queries';
import { saveProfile, uploadAvatar, type ProfileUpdate } from '@/services/account';
import { CATEGORIES, GENDERS, WEST_BENGAL_BLOCKS, WEST_BENGAL_DISTRICTS, normalizeCategoryCode } from '@/data/westBengal';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Loader } from '@/components/ui/Feedback';
import { Avatar } from '@/components/ui/Brand';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

const PHONE_RE = /^[6-9]\d{9}$/;

function Section({ id, icon, title, children }: { id: string; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-24 p-5">
      <h2 className="mb-4 flex items-center gap-2.5 text-[16.5px] font-bold text-ink">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
        {title}
      </h2>
      {children}
    </Card>
  );
}

function TextInput({ label, error, prefix, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null; prefix?: string }) {
  const id = rest.id ?? rest.name;
  return (
    <div className="mb-3.5">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-ink-soft">
        {label}
      </label>
      <div className={cn('flex h-12 items-center rounded-card bg-surface px-3.5 focus-within:ring-[1.4px] focus-within:ring-primary', error && 'ring-[1.4px] ring-danger')}>
        {prefix && <span className="mr-1 text-[15px] text-muted">{prefix}</span>}
        <input id={id} aria-invalid={!!error} className="h-full flex-1 bg-transparent text-[15px] outline-none disabled:text-muted" {...rest} />
      </div>
      {error && <p className="mt-1 text-[12.5px] font-medium text-danger">{error}</p>}
    </div>
  );
}

function Select({ label, value, onChange, children, error, required, warn }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; error?: string | null; required?: boolean; warn?: boolean }) {
  return (
    <label className="mb-3.5 block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">
        {label}
        {required && ' *'}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={cn('h-12 w-full appearance-none rounded-card border bg-white pl-3.5 pr-10 text-[15px]', error ? 'border-danger' : warn ? 'border-gold' : 'border-line')}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      </span>
      {error && <span className="mt-1 block text-[12.5px] font-medium text-danger">{error}</span>}
    </label>
  );
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function EditProfilePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const profile = useProfile();
  const exams = useExams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Required<Omit<ProfileUpdate, 'avatar_url'>> & { avatar_url: string | null } | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile.data || form) return;
    const p = profile.data;
    setForm({
      full_name: p.fullName,
      phone: (p.phone ?? '').replace(/\D/g, '').slice(-10),
      avatar_url: p.avatarUrl,
      target_exam_id: p.targetExamId ?? '',
      target_exam_title: p.targetExamTitle ?? '',
      state: 'West Bengal',
      district: p.district ?? '',
      block: p.block ?? '',
      gender: p.gender ?? 'NOT_SPECIFIED',
      category: normalizeCategoryCode(p.category),
      dob: p.dob ?? '',
    });
  }, [profile.data, form]);

  useEffect(() => {
    const section = params.get('section');
    if (form && section) setTimeout(() => document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: 'smooth' }), 300);
  }, [form, params]);

  if (profile.isLoading || (!form && profile.data)) return <Loader />;
  if (profile.isError || !form || !user) return <ErrorState message="Your profile could not be loaded." error={profile.error} onRetry={() => void profile.refetch()} />;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const today = new Date();
  const maxDob = iso(new Date(today.getFullYear() - 14, today.getMonth(), today.getDate()));
  const minDob = iso(new Date(today.getFullYear() - 60, today.getMonth(), today.getDate()));
  const blocks = form.district ? WEST_BENGAL_BLOCKS[form.district] ?? [] : [];

  const onAvatar = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      await saveProfile(user.id, { avatar_url: url });
      set('avatar_url', url);
      void queryClient.invalidateQueries({ queryKey: qk.profile(user.id) });
      toast('Profile picture updated successfully!', 'success');
    } catch (e) {
      toast(`Failed to update picture: ${friendlyError(e)}`, 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeAvatar = async () => {
    const google = (user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null) as string | null;
    setUploading(true);
    try {
      await saveProfile(user.id, { avatar_url: google });
      set('avatar_url', google);
      void queryClient.invalidateQueries({ queryKey: qk.profile(user.id) });
      toast('Custom picture removed successfully!', 'success');
    } catch (e) {
      toast(`Failed to remove custom picture: ${friendlyError(e)}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string | null> = {
      full_name: form.full_name.trim().length < 2 ? 'Enter your name' : null,
      phone: form.phone && !PHONE_RE.test(form.phone) ? 'Enter a 10-digit mobile number' : null,
      district: !form.district ? 'District is required for district-wise rankings' : null,
      category: form.category === 'NOT_SPECIFIED' ? '⚠️ Caste / Category is required for category cutoffs' : null,
    };
    setErrors(next);
    if (next.full_name || next.phone) {
      toast('⚠️ অনুগ্রহ করে আপনার নাম ও সঠিক তথ্য দিন', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (next.district || next.category) {
      toast(
        next.district && next.category
          ? '⚠️ জেলা (District) এবং জাতি (Caste) নির্বাচন করা আবশ্যক!'
          : next.district
            ? '⚠️ জেলা (District) নির্বাচন করা আবশ্যক!'
            : '⚠️ জাতি (Caste / Category) নির্বাচন করা আবশ্যক!',
        'error'
      );
      document.getElementById('section-location')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      await saveProfile(user.id, {
        full_name: form.full_name.trim(),
        phone: form.phone || null,
        target_exam_id: form.target_exam_id || null,
        target_exam_title: form.target_exam_title || null,
        state: 'West Bengal',
        district: form.district,
        block: form.block || null,
        gender: form.gender,
        category: form.category,
        dob: form.dob || null,
      });
      await queryClient.invalidateQueries({ queryKey: qk.profile(user.id) });
      toast('Profile saved successfully! (প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে)', 'success');
      navigate('/profile');
    } catch (err) {
      toast(friendlyError(err, 'Could not save your profile. Please try again.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasCustomAvatar = !!form.avatar_url && form.avatar_url !== (user.user_metadata?.avatar_url ?? user.user_metadata?.picture);

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-6xl pb-24">
      <PageHeader title="Edit Profile" back="/profile" />
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
        <Section id="section-personal" icon={<User />} title="Personal Details">
          <div className="mb-5 flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar url={form.avatar_url} name={form.full_name} size={80} />
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand text-white">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => void onAvatar(e.target.files?.[0])} />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" loading={uploading} icon={<Camera className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
                Change Photo
              </Button>
              {hasCustomAvatar && (
                <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft" disabled={uploading} icon={<Trash2 className="h-4 w-4" />} onClick={() => void removeAvatar()}>
                  Remove
                </Button>
              )}
            </div>
          </div>
          <TextInput label="Full name" name="full_name" autoComplete="name" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} error={errors.full_name} />
          <TextInput label="Email" name="email" value={profile.data?.email ?? ''} disabled readOnly />
          <TextInput
            label="Mobile number"
            name="phone"
            prefix="+91"
            inputMode="numeric"
            autoComplete="tel-national"
            value={form.phone ?? ''}
            onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            error={errors.phone}
          />
          <TextInput label="Date of Birth" name="dob" type="date" min={minDob} max={maxDob} value={form.dob ?? ''} onChange={(e) => set('dob', e.target.value)} />
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">Gender</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(GENDERS).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={form.gender === code}
                  onClick={() => set('gender', code)}
                  className={cn('rounded-full px-3.5 py-2 text-[13px]', form.gender === code ? 'bg-primary font-bold text-white' : 'border border-line text-ink-soft')}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </Section>

        <div className="space-y-4">
        <Section id="section-exam" icon={<Flag />} title="Exam Preparation">
          <Select
            label="Target exam"
            value={form.target_exam_id ?? ''}
            onChange={(id) => {
              const e = exams.data?.find((x) => x.id === id);
              set('target_exam_id', id);
              set('target_exam_title', e?.title ?? '');
            }}
          >
            <option value="">Select</option>
            {form.target_exam_id && !exams.data?.some((e) => e.id === form.target_exam_id) && <option value={form.target_exam_id}>{form.target_exam_title}</option>}
            {(exams.data ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </Select>
        </Section>

        <Section id="section-location" icon={<MapPin />} title="Location & Category">
          <p lang="bn" className="mb-4 flex gap-2.5 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] p-3 text-[12.5px] text-[#166534]">
            <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
            জেলা (District) ও জাতি (Caste / Category) নির্বাচন করা আবশ্যক — এর ভিত্তিতে প্রতিটি পরীক্ষার ক্যাটাগরিভিত্তিক Cutoff এবং জেলাভিত্তিক Rank List তৈরি করা হয়।
          </p>
          <div className="mb-3.5 flex items-center gap-2.5 rounded-card bg-surface px-3.5 py-3 text-[14px] text-muted">
            <Map className="h-5 w-5" /> State: <span className="font-semibold text-ink">West Bengal</span>
          </div>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Select
              label="District"
              required
              warn={!form.district}
              value={form.district ?? ''}
              error={errors.district}
              onChange={(d) => {
                set('district', d);
                set('block', '');
              }}
            >
              <option value="">Select District</option>
              {WEST_BENGAL_DISTRICTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
            <Select label="Block" value={form.block ?? ''} onChange={(b) => set('block', b)}>
              <option value="">{form.district ? 'Select Block (Optional)' : 'Select district first'}</option>
              {blocks.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </div>
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">Caste / Category *</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORIES)
                .filter(([c]) => c !== 'NOT_SPECIFIED')
                .map(([code, label]) => (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={form.category === code}
                    onClick={() => set('category', code)}
                    className={cn('rounded-full px-3.5 py-2 text-[13px]', form.category === code ? 'bg-primary font-bold text-white' : 'border border-line text-ink-soft')}
                  >
                    {label}
                  </button>
                ))}
            </div>
            {errors.category && <p className="mt-1.5 text-[12.5px] font-medium text-danger">{errors.category}</p>}
          </fieldset>
          <p className="mt-4 text-[12px] text-muted">Your category and district are used for expected cutoffs and district rankings.</p>
        </Section>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-[86px] z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:pl-[calc(var(--pk-sidebar)+16px)]">
        <div className="mx-auto flex max-w-6xl justify-end">
          <Button type="submit" className="lg:w-auto lg:min-w-[240px]" block size="lg" loading={saving}>
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
}

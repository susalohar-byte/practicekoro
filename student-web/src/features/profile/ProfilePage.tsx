import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Bookmark,
  Cake,
  Calendar,
  CalendarCheck,
  Camera,
  CheckCircle2,
  ChevronRight,
  Crown,
  Flag,
  GraduationCap,
  History,
  Hourglass,
  IdCard,
  LifeBuoy,
  ListChecks,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Timer,
  TrendingUp,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { fmtDateLong, ordinal } from '@/lib/format';
import { CATEGORIES, GENDERS, normalizeCategoryCode } from '@/data/westBengal';
import { isPassActive, remainingDays, remainingLabel } from '@/services/account';
import { useAttemptHistory, useBookmarks, useProfile, useSubscription } from '@/hooks/queries';
import { ErrorState, Loader } from '@/components/ui/Feedback';
import { Avatar } from '@/components/ui/Brand';
import { Card } from '@/components/ui/Card';
import { Tag, type Tone } from '@/components/ui/Tag';
import type { Profile } from '@/types/models';

export function profileCompletion(p: Profile) {
  const fields = [p.fullName, p.email, p.district, normalizeCategoryCode(p.category) !== 'NOT_SPECIFIED' ? 'x' : '', p.targetExamTitle, p.dob];
  const filled = fields.filter((f) => (f ?? '').toString().trim()).length;
  return { filled, total: fields.length, fraction: filled / fields.length };
}

const categoryShort = (c: string | null) => {
  const code = normalizeCategoryCode(c);
  if (code === 'NOT_SPECIFIED') return null;
  return code === 'GEN' ? 'General' : CATEGORIES[code];
};

function InfoRow({ icon, label, value, to, required, sub, tag }: { icon: ReactNode; label: string; value?: string | null; to?: string; required?: boolean; sub?: string; tag?: { text: string; tone: Tone } }) {
  const missing = !value;
  const inner = (
    <>
      <span className={`[&>svg]:h-[21px] [&>svg]:w-[21px] ${missing && required ? 'text-danger' : 'text-muted'}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] text-ink-soft">{label}</span>
        {sub && <span className="block text-[12px] text-muted">{sub}</span>}
      </span>
      {tag ? (
        <Tag tone={tag.tone}>{tag.text}</Tag>
      ) : missing ? (
        required ? <Tag tone="danger">Required</Tag> : <span className="text-[14.5px] font-bold text-primary">Add</span>
      ) : (
        <span className="max-w-[55%] truncate text-right text-[14px] font-semibold text-ink">{value}</span>
      )}
      {to && <ChevronRight className="h-5 w-5 shrink-0 text-faint" />}
    </>
  );
  const cls = 'flex min-h-[56px] items-center gap-3 px-1 py-2.5';
  return to ? (
    <Link to={to} className={`${cls} hover:bg-surface/60`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 mt-7 text-[16.5px] font-bold text-ink">{title}</h2>
      <Card className="divide-y divide-line px-3">{children}</Card>
    </section>
  );
}

const phoneFmt = (p: string | null) => {
  const d = (p ?? '').replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : p;
};

export default function ProfilePage() {
  const profile = useProfile();
  const sub = useSubscription();
  const history = useAttemptHistory();
  const bookmarks = useBookmarks();

  if (profile.isLoading) return <Loader />;
  if (profile.isError || !profile.data) return <ErrorState message="Your profile could not be loaded." error={profile.error} onRetry={() => void profile.refetch()} />;
  const p = profile.data;
  const pro = isPassActive(sub.data);
  const s = sub.data;
  const comp = profileCompletion(p);
  const attempts = history.data ?? [];
  const avg = attempts.length ? Math.round(attempts.reduce((x, a) => x + a.percentage, 0) / attempts.length) : null;
  const ranks = attempts.map((a) => a.rank ?? 0).filter((r) => r > 0);
  const best = ranks.length ? Math.min(...ranks) : null;
  const bmCount = bookmarks.data?.length ?? 0;
  const cat = categoryShort(p.category);
  const days = s ? remainingDays(s) : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#0F172A] sm:text-2xl">My Profile</h1>
        <Link to="/settings" aria-label="Settings" className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:bg-surface">
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      <div className="lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6">
        <div>
          {/* Header card */}
          <div className="relative overflow-hidden rounded-3xl border-[1.2px] border-[#E2E8F0] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
            <span className="absolute -left-11 -top-11 h-36 w-36 rounded-full bg-[#38BDF8]/10" aria-hidden />
            <span className="absolute -bottom-9 -right-9 h-32 w-32 rounded-full bg-[#A78BFA]/10" aria-hidden />
            <Link to="/profile/edit" aria-label="Edit profile" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#1D4ED8]">
              <Pencil className="h-[18px] w-[18px]" />
            </Link>
            <div className="relative flex flex-col items-center text-center">
              <Link to="/profile/edit" className="relative rounded-full bg-gradient-to-br from-[#00D2FF] to-[#0158FC] p-[2.5px]" aria-label="Change profile picture">
                <span className="block rounded-full bg-white p-[2.5px]">
                  <Avatar url={p.avatarUrl} name={p.fullName} size={76} />
                </span>
                <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-[2.2px] border-white bg-brand text-white">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              </Link>
              <p className="mt-3 flex max-w-full items-center gap-2 text-[21px] font-extrabold text-[#0B1F44]">
                <span className="truncate">{p.fullName || 'Add your name'}</span>
                {pro && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[12px] font-bold text-[#B45309]">
                    <Crown className="h-3.5 w-3.5 text-[#D97706]" /> Pro
                  </span>
                )}
              </p>
              <Link
                to="/profile/edit"
                className={
                  comp.fraction >= 1
                    ? 'mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-[12.5px] font-bold text-[#15803D]'
                    : 'mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1 text-[12.5px] font-bold text-brand'
                }
              >
                {comp.fraction >= 1 ? <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> : <Timer className="h-4 w-4" />}
                {comp.fraction >= 1 ? 'Profile Complete' : `Profile ${Math.round(comp.fraction * 100)}% Complete`}
              </Link>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link to="/profile/edit?section=exam" className="inline-flex items-center gap-1.5 rounded-[14px] bg-[#EFF6FF] px-3 py-2 text-[13px] font-bold text-[#0B1F44]">
                  <GraduationCap className="h-4 w-4 text-[#0284C7]" /> {p.targetExamTitle || 'Add Exam'}
                </Link>
                <Link to="/profile/edit?section=location" className="inline-flex items-center gap-1.5 rounded-[14px] bg-[#F5F3FF] px-3 py-2 text-[13px] font-bold text-[#0B1F44]">
                  <MapPin className="h-4 w-4 text-[#7C3AED]" /> {p.district || 'Add District'}
                </Link>
                <Link to="/profile/edit?section=location" className="inline-flex items-center gap-1.5 rounded-[14px] bg-[#F0FDF4] px-3 py-2 text-[13px] font-bold text-[#0B1F44]">
                  <Users className="h-4 w-4 text-[#10B981]" /> {cat || 'Add Caste'}
                </Link>
              </div>
            </div>
          </div>

          {(!p.district || !cat) ? (
            <Link to="/profile/edit?section=location" className="mt-4 flex items-center gap-3 rounded-card border border-gold/45 bg-gold-soft p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <MapPin className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span lang="bn" className="text-[14px] font-bold text-ink">জেলা ও জাতি দিন</span>
                  <Tag tone="danger">Required</Tag>
                </span>
                <span lang="bn" className="block text-[12.5px] text-ink-soft">Cutoff ও District Rank দেখতে District ও Caste পূরণ করুন।</span>
              </span>
              <ChevronRight className="h-5 w-5 text-faint" />
            </Link>
          ) : comp.fraction < 1 ? (
            <Link to="/profile/edit" className="mt-4 flex items-center gap-3 rounded-card border border-line bg-white p-4">
              <span className="relative flex h-[46px] w-[46px] items-center justify-center rounded-full text-[12px] font-bold text-ink" style={{ background: `conic-gradient(#F59E0B ${comp.fraction * 360}deg, #F1F5F9 0)` }}>
                <span className="absolute inset-[4px] rounded-full bg-white" />
                <span className="relative">{Math.round(comp.fraction * 100)}%</span>
              </span>
              <span className="flex-1">
                <span className="block text-[14px] font-bold text-ink">Complete your profile</span>
                <span className="block text-[12.5px] text-muted">
                  {comp.total - comp.filled} {comp.total - comp.filled === 1 ? 'detail' : 'details'} missing — they help us set your cutoffs and district rank.
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-faint" />
            </Link>
          ) : null}

          <Card className="mt-4 grid grid-cols-3 py-4 text-center">
            {[
              { icon: ListChecks, c: '#1F48E8', v: String(attempts.length), l: 'Tests Taken' },
              { icon: TrendingUp, c: '#16A34A', v: avg === null ? '–' : `${avg}%`, l: 'Avg. Score' },
              { icon: Trophy, c: '#F59E0B', v: best ? `#${best}` : '–', l: 'Best Rank' },
            ].map(({ icon: Icon, c, v, l }) => (
              <div key={l} className="flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${c}1F`, color: c }}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[18px] font-extrabold text-ink">{v}</span>
                <span className="text-[12px] text-muted">{l}</span>
              </div>
            ))}
          </Card>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              { to: '/progress', icon: TrendingUp, c: '#1F48E8', l: 'My Progress' },
              { to: '/bookmarks', icon: Bookmark, c: '#8B5CF6', l: bmCount ? `Bookmarks (${bmCount})` : 'Bookmarks' },
              { to: '/test-history', icon: History, c: '#0EA5E9', l: 'My Tests' },
            ].map(({ to, icon: Icon, c, l }) => (
              <Link key={to} to={to} className="flex flex-col items-center gap-2 rounded-card border border-line bg-white px-2 py-3.5 text-center shadow-card hover:border-primary/30">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${c}1F`, color: c }}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[12.5px] font-semibold text-ink">{l}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <Group title="Personal Details">
            <InfoRow icon={<User />} label="Full name" value={p.fullName} to="/profile/edit?section=personal" />
            <InfoRow icon={<Mail />} label="Email" value={p.email} />
            <InfoRow icon={<Phone />} label="Phone" value={phoneFmt(p.phone)} to="/profile/edit?section=personal" />
            <InfoRow icon={<Cake />} label="Date of Birth" value={p.dob ? fmtDateLong(p.dob) : null} to="/profile/edit?section=personal" />
            <InfoRow icon={<Users />} label="Gender" value={p.gender && p.gender !== 'NOT_SPECIFIED' ? GENDERS[p.gender] ?? p.gender : null} to="/profile/edit?section=personal" />
          </Group>
          <Group title="Target Exam & Category">
            <InfoRow icon={<Flag />} label="Target exam" value={p.targetExamTitle} to="/profile/edit?section=exam" />
            <InfoRow icon={<MapPin />} label="District" value={p.district} required to="/profile/edit?section=location" />
            <InfoRow icon={<MapPin />} label="Block" value={p.block ?? 'Not specified'} to="/profile/edit?section=location" />
            <InfoRow icon={<IdCard />} label="Caste" value={cat ? CATEGORIES[normalizeCategoryCode(p.category)] : null} required to="/profile/edit?section=location" />
          </Group>
          <Group title="Account">
            <InfoRow icon={<ShieldCheck />} label="Account status" sub="Managed by PracticeKoro" tag={{ text: 'Active', tone: 'success' }} />
            {!pro && (
              <InfoRow
                icon={<Crown />}
                label="Plan"
                to="/plans"
                sub={s?.hasSubscription && s.expiresAt ? `${s.planTitle || 'Pro Pass'} expired on ${fmtDateLong(s.expiresAt)}` : 'Free · Upgrade to unlock all tests'}
                tag={s?.hasSubscription ? { text: 'Expired', tone: 'danger' } : { text: 'Upgrade', tone: 'primary' }}
              />
            )}
            {p.createdAt && <InfoRow icon={<CalendarCheck />} label="Member since" value={fmtDateLong(p.createdAt)} />}
          </Group>
          {pro && s && (
            <Group title="Pro Pass">
              <InfoRow icon={<Crown />} label={s.planTitle || 'Pro Pass'} sub="Current plan · All tests unlocked" to="/plans" tag={days <= 7 ? { text: 'Expiring soon', tone: 'gold' } : { text: 'Active', tone: 'success' }} />
              {(s.purchasedAt || s.startsAt) && <InfoRow icon={<ShoppingBag />} label="Purchased on" value={fmtDateLong(s.purchasedAt ?? s.startsAt)} />}
              {s.expiresAt && <InfoRow icon={<Calendar />} label="Valid until" value={fmtDateLong(s.expiresAt)} />}
              <InfoRow icon={<Hourglass />} label="Remaining validity" value={`${remainingLabel(s)} (${days} ${days === 1 ? 'day' : 'days'})`} />
              {s.upgradeOptions.length > 0 && (
                <InfoRow icon={<TrendingUp />} label={`Upgrade to ${s.upgradeOptions[0].planTitle}`} sub="Pay only the difference" to="/plans" tag={{ text: 'Upgrade', tone: 'primary' }} />
              )}
            </Group>
          )}
          <Group title="More">
            <InfoRow icon={<ScrollText />} label="Previous Year Questions" to="/pyq" tag={undefined} value=" " />
            <InfoRow icon={<BarChart3 />} label="My Results" to="/results" value=" " />
            <InfoRow icon={<LifeBuoy />} label="Help & Support" to="/help" value=" " />
            <InfoRow icon={<Settings />} label="Settings" sub="Privacy, logout" to="/settings" value=" " />
          </Group>
          <p className="mt-6 text-center text-[12px] text-muted">PracticeKoro · Student Web</p>
          {best !== null && <span className="sr-only">Best rank {ordinal(best)}</span>}
        </div>
      </div>
    </div>
  );
}

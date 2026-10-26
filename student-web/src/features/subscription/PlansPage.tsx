import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarX, Check, ChevronDown, Crown, BookOpen, Sparkles, Timer, TrendingUp, Trophy, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fmtDate, fmtDateLong, inr } from '@/lib/format';
import { isPassActive, planDiscount, planDuration, remainingDays, remainingLabel, usedFraction } from '@/services/account';
import { usePlans, useSubscription } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Loader, Skeleton } from '@/components/ui/Feedback';
import { ButtonLink, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { StudentSubscription, SubscriptionPlan } from '@/types/models';

const FAQS = [
  ['Which exams are covered in the Pro Pass?', 'All West Bengal state competitive exams including WBP Constable, KP SI, WBCS, Food SI, WBPSC Clerkship, and Miscellaneous Services.'],
  ['Are there unlimited re-attempts for mock tests?', 'Yes! You can re-attempt tests anytime to practice your weak areas. Full solutions and Bengali explanations remain available 24x7.'],
  ['Is this a recurring subscription?', 'No, this is a 100% one-time payment. There are no automatic deductions or hidden charges. Your pass simply expires at the end of the duration.'],
  ['How do I get help if my payment gets stuck?', 'Reach out to our support team instantly via Help & Support or WhatsApp. Your payment status is verified automatically.'],
];

const PERKS = [
  { icon: Timer, c: '#1F48E8', t: 'Exact Exam Interface', d: 'Official timer, marks & negative marking simulator.' },
  { icon: BookOpen, c: '#8B5CF6', t: 'Bengali Explanations', d: 'In-depth step-by-step reasoning for every single question.' },
  { icon: Trophy, c: '#F59E0B', t: 'District & State Rank', d: 'Compete and see where you stand among West Bengal aspirants.' },
  { icon: Sparkles, c: '#0EA5E9', t: 'Mistakes Notebook', d: 'Auto-collect tricky questions for smart quick revision.' },
];

function ProPassCard({ s }: { s: StudentSubscription }) {
  const days = remainingDays(s);
  const soon = days <= 7;
  const rows: [string, string][] = [
    ['Current plan', s.planTitle || 'Pro Pass'],
    ['Purchased on', fmtDate(s.purchasedAt ?? s.startsAt) || '—'],
    ['Valid until', fmtDate(s.expiresAt) || '—'],
    ['Remaining', `${days} ${days === 1 ? 'day' : 'days'}`],
  ];
  return (
    <div className="rounded-[20px] bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-5 text-white">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] px-2.5 py-1 text-[11px] font-black">
          <Crown className="h-3.5 w-3.5" /> PRO MEMBER
        </span>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold', soon ? 'bg-gold/20 text-[#FDE68A]' : 'bg-success-bright/20 text-[#86EFAC]')}>
          <i className={cn('h-[7px] w-[7px] rounded-full', soon ? 'bg-gold' : 'bg-success-bright')} /> {soon ? 'Expiring soon' : 'Active'}
        </span>
      </div>
      <p className="mt-4 text-[20px] font-extrabold">{s.planTitle || 'Pro Pass'}</p>
      <p className={cn('text-[14px] font-bold', soon ? 'text-gold-bright' : 'text-[#CBD5E1]')}>{remainingLabel(s)} remaining</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-[#FACC15] to-[#F59E0B]" style={{ width: `${(1 - usedFraction(s)) * 100}%` }} />
      </div>
      <dl className="mt-4 space-y-1.5 rounded-xl bg-white/[0.08] p-3.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-[12.5px] text-[#94A3B8]">{k}</dt>
            <dd className="text-[13px] font-bold text-[#F1F5F9]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PlanCard({ plan, isPro, current }: { plan: SubscriptionPlan; isPro: boolean; current: boolean }) {
  const free = plan.price <= 0;
  const discount = planDiscount(plan);
  const best = !free && (plan.durationDays >= 365 || discount >= 60);
  return (
    <Card className={cn('flex flex-col overflow-hidden', best && 'border-2 border-primary')}>
      {best ? (
        <p className="bg-primary py-1.5 text-center text-[11px] font-black tracking-wide text-white">★ BEST VALUE{discount ? ` · SAVE ${discount}%` : ''}</p>
      ) : free ? (
        <p className="bg-[#64748B] py-1.5 text-center text-[11px] font-black tracking-wide text-white">
          FREE STARTER · <span lang="bn">সর্বদা বিনামূল্যে</span>
        </p>
      ) : null}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[18px] font-extrabold text-ink">{plan.title}</p>
            {plan.description && <p className="mt-0.5 text-[12px] text-muted">{plan.description}</p>}
          </div>
          <span className="shrink-0 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] font-bold text-ink-soft">{planDuration(plan)}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          <span className="text-[32px] font-black text-ink">{free ? 'Free' : inr(plan.price)}</span>
          {free ? (
            <span className="rounded-md bg-success-soft px-1.5 py-0.5 text-[11px] font-bold text-success">Forever</span>
          ) : (
            discount > 0 &&
            plan.originalPrice && (
              <>
                <span className="text-[16px] text-muted line-through">{inr(plan.originalPrice)}</span>
                <span className="rounded-md bg-success-soft px-1.5 py-0.5 text-[11px] font-bold text-success">{discount}% OFF</span>
              </>
            )
          )}
        </div>
        <p className="mt-1 text-[12px] text-muted">{free ? 'Free access for all students • No payment required' : 'One-time payment • No auto-renewal'}</p>
        <ul className="mt-4 flex-1 space-y-2 border-t border-line pt-4">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-2 text-[13px] font-medium text-ink-soft">
              <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                <Check className="h-3 w-3" />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          {free ? (
            <Button block variant={isPro ? 'secondary' : 'success'} disabled={isPro} icon={!isPro && <Check className="h-4 w-4" />}>
              {isPro ? 'Free Starter (Included)' : 'Current Active Plan'}
            </Button>
          ) : current ? (
            <Button block variant="success" disabled icon={<Check className="h-4 w-4" />}>
              Current Active Plan
            </Button>
          ) : (
            <ButtonLink to={`/checkout/${encodeURIComponent(plan.id)}?pay=1`} block variant={best ? 'primary' : 'dark'} trailingIcon={<ArrowRight className="h-4 w-4" />}>
              Get {planDuration(plan)} Pass
            </ButtonLink>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function PlansPage() {
  const plans = usePlans();
  const sub = useSubscription();
  const [faq, setFaq] = useState<number | null>(null);
  const s = sub.data;
  const pro = isPassActive(s);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Plans & Membership"
        back="/settings"
        actions={
          <button type="button" aria-label="Refresh Plans" onClick={() => { void plans.refetch(); void sub.refetch(); }} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:bg-surface">
            <RefreshCw className="h-[18px] w-[18px]" />
          </button>
        }
      />

      {sub.isLoading ? (
        <Skeleton className="h-40" />
      ) : pro && s ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ProPassCard s={s} />
          <div className="space-y-3">
            {s.upgradeOptions.length > 0 ? (
              s.upgradeOptions.map((u) => (
                <Card key={u.planId} className="border-2 border-primary p-5">
                  <p className="flex items-center gap-2 text-[16px] font-extrabold text-ink">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                    Upgrade to {u.planTitle}
                  </p>
                  <p className="mt-2 text-[13.5px] text-ink-soft">
                    Pay only the difference of {inr(u.amount)}.{u.newExpiresAt ? ` Your pass will then be valid until ${fmtDateLong(u.newExpiresAt)}.` : ''}
                  </p>
                  <ButtonLink to={`/checkout/${encodeURIComponent(u.planId)}?pay=1`} block className="mt-4">
                    Upgrade for {inr(u.amount)}
                  </ButtonLink>
                </Card>
              ))
            ) : (
              <Card className="flex gap-3 p-5 text-[13.5px] text-ink-soft">
                <BadgeCheck className="h-5 w-5 shrink-0 text-success" />
                You have full Pro access until {fmtDateLong(s.expiresAt)}. Plans will be available again when your pass expires.
              </Card>
            )}
          </div>
        </div>
      ) : (
        <>
          {s?.hasSubscription && s.expiresAt && (
            <Card className="mb-4 flex gap-3 border-transparent bg-danger-soft p-4 text-[13.5px] text-danger">
              <CalendarX className="h-5 w-5 shrink-0" />
              Your {s.planTitle || 'Pro Pass'} expired on {fmtDateLong(s.expiresAt)}. Choose a plan below to unlock Pro again.
            </Card>
          )}
          <div className="flex items-center gap-4 rounded-[20px] bg-hero p-5 text-white sm:p-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Crown className="h-7 w-7 text-gold-bright" />
            </span>
            <span>
              <span className="block text-[18px] font-extrabold sm:text-xl">Unlock PracticeKoro Pro</span>
              <span className="mt-1 block text-[13px] text-[#E0E7FF]">
                Targeting WBP, KP SI, WBCS, Food SI & WBPSC exams? Get complete access to real exam-pattern mock tests, detailed Bengali explanations, and state leaderboards.
              </span>
            </span>
          </div>
          <div className="mb-4 mt-7 flex items-center justify-between">
            <h2 className="text-[18px] font-extrabold text-ink">Available Packages</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-bold text-primary">
              <Zap className="h-3.5 w-3.5" /> Instant Access
            </span>
          </div>
          {plans.isLoading ? (
            <Loader />
          ) : plans.isError ? (
            <ErrorState message="Failed to load dynamic plans" error={plans.error} onRetry={() => void plans.refetch()} />
          ) : (plans.data ?? []).length === 0 ? (
            <Card className="p-6 text-center text-[13.5px] text-muted">
              No active subscription plans available at the moment.
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => void plans.refetch()}>
                Check Again
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(plans.data ?? []).map((p) => (
                <PlanCard key={p.id} plan={p} isPro={pro} current={pro && (s?.planId === p.id || s?.durationDays === p.durationDays)} />
              ))}
            </div>
          )}
          <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-ink">Why Aspirants Choose Pro</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PERKS.map(({ icon: Icon, c, t, d }) => (
              <Card key={t} className="p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${c}1F`, color: c }}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-[14px] font-bold text-ink">{t}</p>
                <p className="mt-0.5 text-[12px] text-muted">{d}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-3 mt-8 text-[18px] font-extrabold text-ink">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {FAQS.map(([q, a], i) => (
          <Card key={q} className="px-4">
            <button type="button" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? null : i)} className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-[14px] font-semibold text-ink">
              {q}
              <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted transition-transform', faq === i && 'rotate-180')} />
            </button>
            {faq === i && <p className="pb-3.5 text-[13.5px] text-ink-soft">{a}</p>}
          </Card>
        ))}
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-[12.5px] text-muted">
        <BadgeCheck className="h-4 w-4 text-success" /> 100% Safe & Secure Checkout · UPI • Debit/Credit Cards • Net Banking
      </p>
      <p className="mt-2 text-center text-[12px] text-faint">
        Need help? <Link to="/help" className="-my-3 inline-block py-3 font-semibold text-primary hover:underline">Contact support</Link>
      </p>
    </div>
  );
}

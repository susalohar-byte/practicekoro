import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart2, ChevronRight, ClipboardCheck, PlayCircle, Radio, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fmtClock, fmtNum, greeting, ordinal } from '@/lib/format';
import { recordBannerClick } from '@/services/catalog';
import {
  useAttemptHistory,
  useBanners,
  useExams,
  useInProgressAttempts,
  useLiveTests,
  useProfile,
  useSubjects,
} from '@/hooks/queries';
import { Card, SeeAll } from '@/components/ui/Card';
import { ExamLogo } from '@/components/ui/Brand';
import { Skeleton } from '@/components/ui/Feedback';
import { LiveTestCard } from '@/components/domain/LiveTestCard';
import { homeSubjectIcon, subjectGradient } from '@/components/domain/subjectVisuals';
import type { HeroBanner } from '@/types/models';

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;

/** Admin banner links are app routes; map the ones the web panel names differently. */
function resolveBannerLink(link: string): { href: string; external: boolean } {
  const l = link.trim();
  if (!l) return { href: '/exams', external: false };
  if (/^https?:\/\//i.test(l)) return { href: l, external: true };
  if (l === '/test-series' || l.startsWith('/exams')) return { href: l.startsWith('/exams/') ? l : '/exams', external: false };
  if (l.startsWith('/practice') || l.startsWith('/daily-10') || l.startsWith('/topic-tests')) return { href: '/practice', external: false };
  if (l.startsWith('/results')) return { href: '/results', external: false };
  return { href: l.startsWith('/') ? l : `/${l}`, external: false };
}

function BannerSlide({ b, onOpen, eager }: { b: HeroBanner; onOpen: (b: HeroBanner) => void; eager?: boolean }) {
  return (
    <button type="button" onClick={() => onOpen(b)} aria-label={b.title || 'Open banner'} className="absolute inset-0 text-left">
      <picture>
        {b.mobileImageUrl && <source media="(max-width: 640px)" srcSet={b.mobileImageUrl} />}
        <img src={b.imageUrl} alt="" className="h-full w-full object-cover" loading={eager ? 'eager' : 'lazy'} />
      </picture>
      {b.showTextOverlay && (
        <span className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/65 via-black/25 to-transparent px-5 text-white sm:px-8">
          {b.badgeText && <span className="mb-2 w-fit rounded-xl bg-[#FFB800] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#1E293B]">{b.badgeText}</span>}
          <span className="line-clamp-2 max-w-md text-[18px] font-extrabold sm:text-2xl">{b.title}</span>
          {b.subtitle && <span className="mt-1 line-clamp-2 max-w-md text-[12px] text-white/85 sm:text-sm">{b.subtitle}</span>}
          <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-2xl bg-white px-3 py-1.5 text-[11.5px] font-bold text-brand">
            {b.ctaText} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </span>
      )}
    </button>
  );
}

function Dots({ count, active, onPick, label }: { count: number; active: number; onPick: (i: number) => void; label: string }) {
  if (count < 2) return null;
  return (
    <div className="mt-2.5 flex justify-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(i)}
          aria-label={`${label} ${i + 1}`}
          aria-current={i === active}
          className={cn('h-1.5 rounded-full transition-all', i === active ? 'w-4 bg-brand' : 'w-1.5 bg-[#CBD5E1]')}
        />
      ))}
    </div>
  );
}

const FRAME = 'relative overflow-hidden rounded-[22px] bg-[#F1F5F9] shadow-card';

/** One large banner at a time on every screen size, auto-advancing every 5 s (as in the app). */
function HeroCarousel({ banners }: { banners: HeroBanner[] }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const list = banners.length > 0 ? banners : null;

  useEffect(() => {
    if (!list || list.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % list.length), 5000);
    return () => clearInterval(t);
  }, [list]);

  if (!list) {
    // HeroBannerModel.defaultBanner — the brand banner shipped with the app.
    return (
      <Link to="/exams" className={cn(FRAME, 'block')} style={{ aspectRatio: '896 / 466' }} aria-label="PracticeKoro Exam Preparation — Start Now">
        <img src={asset('brand/hero_banner.png')} alt="" className="h-full w-full object-cover" />
      </Link>
    );
  }

  const open = (b: HeroBanner) => {
    void recordBannerClick(b.id).catch(() => undefined);
    const { href, external } = resolveBannerLink(b.ctaLink);
    if (external) window.open(href, '_blank', 'noopener,noreferrer');
    else navigate(href);
  };

  return (
    <div>
      <div className={FRAME} style={{ aspectRatio: '896 / 466' }}>
        {list.map((b, i) => (
          <div
            key={b.id || i}
            aria-hidden={i !== index}
            className={cn('absolute inset-0 transition-opacity duration-500', i === index ? 'opacity-100' : 'pointer-events-none opacity-0')}
          >
            <BannerSlide b={b} onOpen={open} eager={i === 0} />
          </div>
        ))}
      </div>
      <Dots count={list.length} active={index} onPick={setIndex} label="Show banner" />
    </div>
  );
}

function ResumeCard() {
  const { data } = useInProgressAttempts();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const open = (data ?? []).filter((a) => a.startedAt.getTime() + a.durationMinutes * 60_000 > now);
  if (open.length === 0) return null;
  return (
    <section aria-labelledby="continue-h">
      <h2 id="continue-h" className="mb-3 mt-7 text-[16.5px] font-extrabold text-ink">
        Continue Practicing
      </h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {open.slice(0, 2).map((a) => {
          const left = (a.startedAt.getTime() + a.durationMinutes * 60_000 - now) / 1000;
          const used = 1 - left / (a.durationMinutes * 60 || 1);
          return (
            <Card key={a.id} className="flex items-center gap-3.5 p-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#9333EA]">
                <PlayCircle className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-ink">{a.testTitle}</p>
                <p className="text-[11.5px] text-faint">{fmtClock(left)} left</p>
                <div className="mt-1.5 h-[7px] overflow-hidden rounded bg-[#F1F5F9]">
                  <div className="h-full rounded bg-[#10B981]" style={{ width: `${Math.min(100, Math.max(0, used * 100))}%` }} />
                </div>
              </div>
              <Link
                to={`/test/${encodeURIComponent(a.testId)}/active?title=${encodeURIComponent(a.testTitle)}`}
                className="shrink-0 rounded-full bg-[#2563EB] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-primary-dark"
              >
                Continue
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: profile } = useProfile();
  const exams = useExams();
  const subjects = useSubjects();
  const live = useLiveTests();
  const banners = useBanners();
  const history = useAttemptHistory();
  const now = new Date();

  const bestRank = useMemo(() => {
    const ranks = (history.data ?? []).map((a) => a.rank ?? 0).filter((r) => r > 0);
    return ranks.length ? Math.min(...ranks) : null;
  }, [history.data]);

  const name = profile?.fullName?.trim() || 'Student';
  const recent = (history.data ?? []).slice(0, 3);

  return (
    <div>
      {/* Greeting + rank pill (same as the app) */}
      <div className="mb-4 flex items-center justify-between gap-3 lg:mb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-[26px] lg:text-[30px]" aria-hidden>
            👋
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-[#64748B] lg:text-[13.5px]">{greeting()},</p>
            <h1 className="truncate text-[19px] font-black text-[#0F172A] sm:text-2xl lg:text-[26px]">{name}</h1>
          </div>
        </div>
        <Link
          to="/results"
          className="flex shrink-0 items-center gap-2 rounded-[14px] border-[1.2px] border-[#FDE68A] bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] px-3 py-1.5 transition hover:shadow-card lg:px-4 lg:py-2"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-white lg:h-8 lg:w-8">
            <Trophy className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          </span>
          <span className="leading-tight">
            <span className="block text-[10.5px] font-bold text-[#B45309] lg:text-[11.5px]">Rank</span>
            <span className="block text-[13.5px] font-extrabold text-[#78350F] lg:text-[16px]">{bestRank ? ordinal(bestRank) : '–'}</span>
          </span>
        </Link>
      </div>

      {banners.isLoading ? <Skeleton className="aspect-[896/466] w-full rounded-[22px]" /> : <HeroCarousel banners={banners.data ?? []} />}

      {/* Exams for You */}
      <section aria-labelledby="exams-h">
        <div className="mb-3 mt-7 flex items-center justify-between">
          <h2 id="exams-h" className="text-[16.5px] font-extrabold text-[#01114E] lg:text-lg">
            Exams <span className="text-[#016BFC]">for You</span>
          </h2>
          <SeeAll to="/exams" />
        </div>
        {exams.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[76px]" />
            ))}
          </div>
        ) : exams.isError ? (
          <p className="rounded-card border border-line bg-white p-4 text-[13px] text-muted">Could not load exams.</p>
        ) : (exams.data ?? []).length === 0 ? (
          <p className="rounded-card border border-line bg-white p-4 text-[13px] text-muted">Exams will appear here once they are added.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(exams.data ?? []).slice(0, 3).map((e, i) => (
              <Link
                key={e.id}
                to={`/exams/${encodeURIComponent(e.id)}`}
                className={cn(
                  'flex items-center gap-3 rounded-[20px] border border-[#E2E8F0] bg-white px-3.5 py-3 transition hover:-translate-y-px hover:border-primary/30 hover:shadow-card',
                  i === 2 && 'sm:max-lg:col-span-2'
                )}
              >
                <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] p-1.5">
                  <ExamLogo title={e.title} iconUrl={e.iconUrl} size={38} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-extrabold text-[#0F172A]">{e.title}</span>
                  <span className="block text-[13px] font-medium text-[#64748B]">
                    {e.totalTests} {e.totalTests === 1 ? 'Test' : 'Tests'} Available
                  </span>
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] text-[#475569]">
                  <ChevronRight className="h-[18px] w-[18px]" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Live Test + Continue Practicing (below Exams for You, as in the app) */}
      <LiveSection live={live} now={now} />
      <ResumeCard />

      {/* Explore Subjects */}
      {(subjects.data ?? []).length > 0 && (
        <section aria-labelledby="subjects-h">
          <div className="mb-3.5 mt-7 flex items-center justify-between">
            <h2 id="subjects-h" className="text-[18px] font-extrabold tracking-tight text-[#0B1F44]">
              Explore Subjects
            </h2>
            <SeeAll to="/practice" />
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:px-0 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8">
            {(subjects.data ?? []).map((s) => {
              const [c1, c2] = subjectGradient(s.nameEnglish);
              const Icon = homeSubjectIcon(s.nameEnglish);
              return (
                <Link
                  key={s.id}
                  to={`/topic-tests?subjectId=${encodeURIComponent(s.id)}&subject=${encodeURIComponent(s.nameEnglish)}`}
                  className="group flex w-[88px] shrink-0 snap-start flex-col items-center rounded-2xl text-center sm:w-auto sm:py-2.5 sm:hover:bg-white sm:hover:shadow-card"
                >
                  <span
                    className="flex h-[62px] w-[62px] items-center justify-center rounded-full text-white transition group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, boxShadow: `0 4px 10px ${c2}40` }}
                  >
                    {Icon === 'A' ? <span className="text-[28px] font-black">A</span> : <Icon className="h-7 w-7" />}
                  </span>
                  <span className="mt-2 line-clamp-2 text-[13.5px] font-bold leading-tight text-[#0B1F44]">{s.nameEnglish}</span>
                  <span className="text-[12px] font-medium text-[#64748B]">
                    {s.totalTests} {s.totalTests === 1 ? 'Test' : 'Tests'}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Result */}
      <section aria-labelledby="recent-h">
        <div className="mb-3 mt-7 flex items-center justify-between">
          <h2 id="recent-h" className="text-[16.5px] font-extrabold text-ink lg:text-lg">
            Recent Result
          </h2>
          <Link to="/results" className="text-[13px] font-bold text-[#2563EB] hover:underline">
            See All →
          </Link>
        </div>
        {history.isLoading ? (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-6 text-center">
            <BarChart2 className="h-7 w-7 text-faint" />
            <p className="text-[13px] text-muted">No results yet. Your scores appear here after your first test.</p>
            <Link to="/exams" className="text-[13.5px] font-bold text-primary hover:underline">
              Take a test
            </Link>
          </Card>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((a, i) => {
              const tones = [
                ['#DCFCE7', '#10B981'],
                ['#EDE9FE', '#8B5CF6'],
                ['#FEE2E2', '#EF4444'],
              ][i % 3];
              return (
                <Link
                  key={a.id}
                  to={`/result/${a.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3 transition hover:border-primary/30 hover:shadow-card"
                >
                  <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl" style={{ background: tones[0], color: tones[1] }}>
                    <ClipboardCheck className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-ink">{a.testTitle}</span>
                    <span className="block text-[12px] text-faint">
                      {fmtNum(a.score)} / {fmtNum(a.totalMarks)}
                    </span>
                  </span>
                  <span className="rounded-lg bg-[#DCFCE7] px-2 py-1 text-[12px] font-extrabold text-[#059669]">{Math.round(a.percentage)}%</span>
                  <ChevronRight className="h-4 w-4 text-faint" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function LiveSection({ live, now }: { live: ReturnType<typeof useLiveTests>; now: Date }) {
  const list = live.data ?? [];
  return (
    <section aria-labelledby="live-h">
      <div className="mb-2.5 mt-7 flex items-center justify-between">
        <h2 id="live-h" className="text-[16.5px] font-extrabold text-ink lg:text-lg">
          Live Test
        </h2>
        <Link to="/live-tests" className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-[12px] font-bold text-[#2563EB]">
          See All →
        </Link>
      </div>
      {live.isLoading ? (
        <Skeleton className="h-[122px]" />
      ) : list.length === 0 ? (
        <Card className="flex items-center gap-3 px-4 py-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
            <Radio className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-[14px] font-bold text-ink">New Live Tests Coming Soon</span>
            <span className="block text-[12px] text-[#64748B]">Stay tuned for upcoming statewide mock tests</span>
          </span>
        </Card>
      ) : (
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {list.slice(0, 6).map((t, i) => (
            <div key={t.id} className={cn('w-[78vw] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none', i >= 4 && 'hidden lg:block')}>
              <LiveTestCard test={t} index={i} now={now} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

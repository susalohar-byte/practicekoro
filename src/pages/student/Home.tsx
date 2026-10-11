import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { bannerService } from '@/services/bannerService';
import { api } from '@/services/api';
import { HomepageCarousel } from '@/components/student/HomepageCarousel';
import { HomepageImage } from '@/components/student/HomepageImage';
import {
  activeHomepageBanners,
  bannerDestination,
  browserSavedAnswerCount,
  featuredLiveMock,
  recentAttempts,
  recentlyAddedTests,
  recommendedHomepageTests,
  resolveExamCards,
  resolveSeriesCards,
  storedImage,
} from '@/lib/student/homepage';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  FileText,
  Files,
  Flame,
  Radio,
  RefreshCw,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { MockTest, TestAttempt } from '@/types';
import '@/styles/student-homepage-reference.css';

const emptyAttempts: TestAttempt[] = [];
const emptyTests: MockTest[] = [];
const tones = ['orange', 'purple', 'green', 'pink'] as const;
const dateLabel = (value?: string) =>
  value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      }).format(new Date(value))
    : undefined;
const scheduleLabel = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
function SectionHeading({
  title,
  icon: Icon,
  link = '/test-series',
  id,
}: {
  title: string;
  icon: LucideIcon;
  link?: string;
  id: string;
}) {
  return (
    <div className="study-section-heading">
      <h2 id={id}>
        <Icon size={26} aria-hidden="true" />
        <span>{title}</span>
      </h2>
      <Link to={link}>
        View All
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
function EmptyState({
  children,
  loading = false,
  onRetry,
}: {
  children: ReactNode;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="study-empty" role={onRetry ? 'alert' : loading ? 'status' : undefined}>
      <span>{children}</span>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
function TestRow({ test, index }: { test: MockTest; index: number }) {
  return (
    <Link className="study-test-row" to={`/exams/${encodeURIComponent(test.id)}`}>
      <HomepageImage
        src={test.iconUrl}
        className={`study-doc study-${tones[index % tones.length]}`}
      />
      <div className="study-test-copy">
        <h3>{test.title}</h3>
        <p>
          <FileText size={13} aria-hidden="true" />
          {test.totalQuestions} Qs<span>·</span>
          <Clock3 size={13} aria-hidden="true" />
          {test.durationMinutes} Mins
        </p>
        <span className={`study-access ${test.isPremium ? 'study-access-pro' : ''}`}>
          {test.isPremium ? 'PRO' : 'FREE'}
        </span>
      </div>
      <ChevronRight size={18} aria-hidden="true" />
    </Link>
  );
}

export function Home() {
  const { user, isPro } = useAuth();
  const { selectedExam } = useExam();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const [slide, setSlide] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);
  const [failedBanners, setFailedBanners] = useState<string[]>([]);
  const audience = isPro ? 'pro' : 'free';
  const catalogOptions = { staleTime: 30000, refetchInterval: 60000 };
  const bannersQuery = useQuery({
    queryKey: ['hero-banners', audience, 'homepage-stored'],
    queryFn: () =>
      bannerService.getActiveBanners({
        audience,
        placement: 'home_hero',
        strictAudience: true,
        storedImagesOnly: true,
      }),
    ...catalogOptions,
  });
  const examsQuery = useQuery({
    queryKey: ['homepage-exams'],
    queryFn: () => api.getExams(),
    ...catalogOptions,
  });
  const examConfigQuery = useQuery({
    queryKey: ['homepage-exam-config'],
    queryFn: () => api.getPopularExams({ configuredOnly: true }),
    ...catalogOptions,
  });
  const testsQuery = useQuery({
    queryKey: ['homepage-tests'],
    queryFn: () => api.getTests(undefined, undefined, { strict: true }),
    ...catalogOptions,
  });
  const seriesQuery = useQuery({
    queryKey: ['homepage-series'],
    queryFn: () => api.getStudentTestSeries(),
    ...catalogOptions,
  });
  const seriesConfigQuery = useQuery({
    queryKey: ['homepage-series-config'],
    queryFn: () => api.getPopularTestSeriesCards({ configuredOnly: true }),
    ...catalogOptions,
  });
  const liveQuery = useQuery({
    queryKey: ['homepage-live-tests'],
    queryFn: () => api.getLiveTests(),
    staleTime: 15000,
    refetchInterval: 30000,
  });
  const attemptsQuery = useQuery({
    queryKey: ['home-user-attempts', user?.id],
    queryFn: () => (user?.id ? api.getUserAttempts(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
    ...catalogOptions,
  });
  const attempts = useMemo(
    () => (attemptsQuery.data || emptyAttempts).filter((attempt) => attempt.userId === user?.id),
    [attemptsQuery.data, user?.id]
  );
  const unfinished = useMemo(
    () => attempts.filter((attempt) => attempt.status === 'in_progress').slice(0, 12),
    [attempts]
  );
  const progressQuery = useQuery({
    queryKey: ['homepage-attempt-progress', user?.id, unfinished.map((attempt) => attempt.id)],
    queryFn: () =>
      api.getHomepageAttemptProgress(
        user!.id,
        unfinished.map((attempt) => attempt.id)
      ),
    enabled: !!user?.id && unfinished.length > 0,
    ...catalogOptions,
  });
  const tests = testsQuery.data || emptyTests;
  const examCards = useMemo(
    () => resolveExamCards(examsQuery.data || [], examConfigQuery.data || [], testsQuery.data),
    [examsQuery.data, examConfigQuery.data, testsQuery.data]
  );
  const seriesCards = useMemo(
    () => resolveSeriesCards(seriesQuery.data || [], seriesConfigQuery.data || [], testsQuery.data),
    [seriesQuery.data, seriesConfigQuery.data, testsQuery.data]
  );
  const banners = useMemo(
    () =>
      activeHomepageBanners(bannersQuery.data || [], audience, now).filter(
        (banner) => !failedBanners.includes(banner.imageUrl!)
      ),
    [bannersQuery.data, audience, now, failedBanners]
  );
  // Resolve against the complete published catalog: legacy API enrichment must
  // not feature a local/demo test or a source record hidden by publication/RLS.
  const live = useMemo(
    () =>
      featuredLiveMock(
        (liveQuery.data || []).map((event) => ({
          ...event,
          test: tests.find((test) => test.id === event.testId) || null,
        })),
        now
      ),
    [liveQuery.data, tests, now]
  );
  const recent = useMemo(() => recentAttempts(attempts), [attempts]);
  const added = useMemo(() => recentlyAddedTests(tests), [tests]);
  const recommended = useMemo(
    () => recommendedHomepageTests(tests, attempts, user?.targetExamId || selectedExam?.id),
    [tests, attempts, user?.targetExamId, selectedExam?.id]
  );
  const selectedBanner = banners.length ? banners[slide % banners.length] : undefined;
  const targetExamId = selectedExam?.id || user?.targetExamId;
  const targetRoute = (type: 'full-mock' | 'pyq') =>
    targetExamId ? `/exams/${encodeURIComponent(targetExamId)}/${type}` : '/test-series';

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (
      banners.length < 2 ||
      bannerPaused ||
      (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
    )
      return;
    const timer = setInterval(() => setSlide((previous) => (previous + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length, bannerPaused]);
  useEffect(() => {
    const refresh = () => {
      for (const key of [
        'homepage-exams',
        'homepage-exam-config',
        'homepage-tests',
        'homepage-series',
        'homepage-series-config',
        'homepage-live-tests',
      ])
        void queryClient.invalidateQueries({ queryKey: [key] });
    };
    const stopBanners = bannerService.subscribeToBannerUpdates(
      () => void queryClient.invalidateQueries({ queryKey: ['hero-banners'] })
    );
    const stopCatalog = api.subscribeToStudentCatalogUpdates(refresh, true);
    const stopSettings = api.subscribeToPopularExamUpdates(refresh);
    window.addEventListener('practicekoro:popular_test_series_updated', refresh);
    window.addEventListener('pk_test_series_updated', refresh);
    return () => {
      stopBanners();
      stopCatalog();
      stopSettings();
      window.removeEventListener('practicekoro:popular_test_series_updated', refresh);
      window.removeEventListener('pk_test_series_updated', refresh);
    };
  }, [queryClient]);

  return (
    <div className="pk-study-home" aria-label="PracticeKoro Study Dashboard">
      <h1 className="sr-only">Your study dashboard</h1>
      {selectedBanner && (
        <section
          className="study-hero"
          aria-label="Homepage banner"
          onMouseEnter={() => setBannerPaused(true)}
          onMouseLeave={() => setBannerPaused(false)}
          onFocusCapture={() => setBannerPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null))
              setBannerPaused(false);
          }}
        >
          <a
            href={bannerDestination(selectedBanner.primaryCtaLink)}
            target={
              /^https?:\/\//i.test(bannerDestination(selectedBanner.primaryCtaLink))
                ? '_blank'
                : undefined
            }
            rel="noopener noreferrer"
            onClick={() => {
              void bannerService.trackBannerClick(selectedBanner.id).catch(() => {});
            }}
          >
            <picture>
              {storedImage(selectedBanner.mobileImageUrl) && (
                <source media="(max-width: 640px)" srcSet={selectedBanner.mobileImageUrl} />
              )}
              <img
                src={selectedBanner.imageUrl}
                alt={selectedBanner.title || 'Featured homepage banner'}
                onError={() =>
                  setFailedBanners((previous) => [...previous, selectedBanner.imageUrl!])
                }
              />
            </picture>
          </a>
          {banners.length > 1 && (
            <>
              <button
                type="button"
                className="study-banner-prev"
                aria-label="Previous banner"
                onClick={() => setSlide((slide + banners.length - 1) % banners.length)}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className="study-banner-next"
                aria-label="Next banner"
                onClick={() => setSlide((slide + 1) % banners.length)}
              >
                <ChevronRight size={22} />
              </button>
              <div className="study-banner-dots">
                {banners.map((banner, index) => (
                  <button
                    type="button"
                    key={banner.id}
                    aria-label={`Show banner ${index + 1}`}
                    aria-pressed={index === slide % banners.length}
                    onClick={() => setSlide(index)}
                  >
                    <span />
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section className="study-quick-actions" aria-label="Quick actions">
        {[
          {
            title: 'Mock Test',
            detail: 'Full Length Tests',
            href: targetRoute('full-mock'),
            icon: FileText,
            tone: 'purple',
          },
          {
            title: 'Topic Test',
            detail: 'Chapter-wise Practice',
            href: '/practice',
            icon: Target,
            tone: 'green',
          },
          {
            title: 'Official PYQ',
            detail: 'Previous Year Questions',
            href: targetRoute('pyq'),
            icon: Files,
            tone: 'orange',
          },
          {
            title: 'Results',
            detail: 'Track Your Progress',
            href: '/results',
            icon: BarChart3,
            tone: 'pink',
          },
        ].map(({ title, detail, href, icon: Icon, tone }) => (
          <Link key={title} to={href} className={`study-quick-card study-${tone}`}>
            <span className="study-quick-icon">
              <Icon size={30} aria-hidden="true" />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{detail}</small>
            </span>
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        ))}
      </section>

      <section className="study-section" aria-labelledby="study-live-title">
        <SectionHeading
          title="Live Mock Test"
          icon={Radio}
          id="study-live-title"
          link="/live-test"
        />
        {liveQuery.isError || testsQuery.isError ? (
          <EmptyState
            onRetry={() => {
              void liveQuery.refetch();
              void testsQuery.refetch();
            }}
          >
            Live test schedules couldn’t be loaded.
          </EmptyState>
        ) : liveQuery.isLoading || testsQuery.isLoading ? (
          <EmptyState loading>Checking live test schedules…</EmptyState>
        ) : live ? (
          <div className="study-live-card">
            <HomepageImage
              src={live.test?.iconUrl || live.logo}
              className="study-doc study-orange"
            />
            <div className="study-live-copy">
              <div className="study-live-title">
                <span
                  className={`study-live-badge ${Date.parse(live.startAt) > now ? 'study-upcoming' : ''}`}
                >
                  {Date.parse(live.startAt) > now ? 'UPCOMING' : 'LIVE'}
                </span>
                <h3>{live.test?.title || live.title}</h3>
              </div>
              <p className="study-live-exam">{live.test?.examTitle || live.examTitle}</p>
              <div className="study-live-meta">
                <span>
                  <CalendarDays size={16} aria-hidden="true" />
                  {scheduleLabel(live.startAt)} IST
                </span>
                <span>
                  <Clock3 size={16} aria-hidden="true" />
                  {live.test?.durationMinutes} Mins
                </span>
                <span>
                  <FileText size={16} aria-hidden="true" />
                  {live.test?.totalQuestions} Questions
                </span>
                {(live.enrolledCount || 0) > 0 && (
                  <span>
                    <Users size={16} aria-hidden="true" />
                    {live.enrolledCount} registered
                  </span>
                )}
              </div>
            </div>
            <Link className="study-join-button" to={`/live-test?id=${encodeURIComponent(live.id)}`}>
              {Date.parse(live.startAt) > now ? 'View Schedule' : 'Join Now'}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <EmptyState>
            No live or upcoming full mock is scheduled. New events will appear here when published.
          </EmptyState>
        )}
      </section>

      <section className="study-section" aria-labelledby="study-continue-title">
        <SectionHeading
          title="Continue Your Practice"
          icon={Target}
          id="study-continue-title"
          link="/my-tests"
        />
        {attemptsQuery.isError ? (
          <EmptyState onRetry={() => void attemptsQuery.refetch()}>
            Your practice history couldn’t be loaded.
          </EmptyState>
        ) : attemptsQuery.isLoading ? (
          <EmptyState loading>Loading your saved practice…</EmptyState>
        ) : unfinished.length ? (
          <HomepageCarousel label="unfinished practice tests">
            {unfinished.map((attempt, index) => {
              const local = browserSavedAnswerCount(attempt.id);
              const count = progressQuery.data?.[attempt.id] ?? local;
              const total = attempt.totalQuestions;
              const answered =
                count === undefined
                  ? undefined
                  : total !== undefined
                    ? Math.min(count, total)
                    : count;
              const percentage =
                answered !== undefined && total && total > 0
                  ? Math.round((answered / total) * 100)
                  : undefined;
              return (
                <article key={attempt.id} className="study-continue-card">
                  <div className="study-continue-top">
                    <HomepageImage
                      src={tests.find((test) => test.id === attempt.testId)?.iconUrl}
                      className={`study-doc study-${tones[index % tones.length]}`}
                    />
                    <div>
                      <h3>{attempt.testTitle || 'Test in progress'}</h3>
                      <p>
                        {attempt.examTitle ||
                          attempt.subjectName ||
                          attempt.chapterName ||
                          'Saved test session'}
                      </p>
                    </div>
                  </div>
                  <div className="study-progress-label">
                    {answered !== undefined ? (
                      <span>
                        {answered}
                        {total !== undefined ? `/${total}` : ' answered'}
                        {progressQuery.data?.[attempt.id] === undefined && local !== undefined
                          ? ' · on this device'
                          : ''}
                      </span>
                    ) : (
                      <span>
                        {progressQuery.isLoading ? 'Loading progress…' : 'Progress unavailable'}
                      </span>
                    )}
                  </div>
                  <div
                    className="study-progress-track"
                    role="progressbar"
                    aria-label={`${attempt.testTitle || 'Test'} progress`}
                    aria-valuenow={percentage}
                    aria-valuemin={percentage !== undefined ? 0 : undefined}
                    aria-valuemax={percentage !== undefined ? 100 : undefined}
                    aria-valuetext={
                      answered !== undefined
                        ? `${answered}${total !== undefined ? ` of ${total}` : ''} questions answered`
                        : 'Progress unavailable'
                    }
                  >
                    <span style={{ width: percentage !== undefined ? `${percentage}%` : '0%' }} />
                  </div>
                  <Link
                    className="study-continue-button"
                    to={`/exams/${encodeURIComponent(attempt.testId)}/runner?attemptId=${encodeURIComponent(attempt.id)}`}
                  >
                    Continue Test
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </HomepageCarousel>
        ) : (
          <EmptyState>
            No unfinished tests yet. Choose a mock or topic test to begin your practice.
          </EmptyState>
        )}
      </section>

      <section className="study-section" aria-labelledby="study-exams-title">
        <SectionHeading title="Exams for You" icon={Crown} id="study-exams-title" />
        {examsQuery.isError ? (
          <EmptyState onRetry={() => void examsQuery.refetch()}>
            Exam records couldn’t be loaded.
          </EmptyState>
        ) : examsQuery.isLoading ? (
          <EmptyState loading>Loading available exams…</EmptyState>
        ) : examCards.length ? (
          <HomepageCarousel label="available exams">
            {examCards.map(({ exam, image }) => (
              <Link
                key={exam.id}
                className="study-exam-card"
                to={`/exams/${encodeURIComponent(exam.id)}/full-mock`}
              >
                <HomepageImage src={image} kind="exam" />
                <strong>{exam.title}</strong>
                <span>
                  <CalendarDays size={14} aria-hidden="true" />
                  {exam.testsCount !== undefined
                    ? `${exam.testsCount} Tests`
                    : 'Test count unavailable'}
                  <ChevronRight size={14} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </HomepageCarousel>
        ) : (
          <EmptyState>Published exams will appear here when available.</EmptyState>
        )}
        {examConfigQuery.isError && (
          <p className="study-inline-note">
            Custom exam artwork could not be refreshed. Showing saved exam fields or generic icons.
          </p>
        )}
      </section>

      <section className="study-section" aria-labelledby="study-series-title">
        <SectionHeading title="Popular Test Series" icon={Flame} id="study-series-title" />
        {seriesQuery.isError ? (
          <EmptyState onRetry={() => void seriesQuery.refetch()}>
            Test series couldn’t be loaded.
          </EmptyState>
        ) : seriesQuery.isLoading ? (
          <EmptyState loading>Loading published test series…</EmptyState>
        ) : seriesCards.length ? (
          <HomepageCarousel label="popular test series">
            {seriesCards.map(({ series, image, badge, testCount, questionCount }) => (
              <Link
                key={series.id}
                className="study-series-card"
                to={`/test-series/${encodeURIComponent(series.id)}`}
              >
                <HomepageImage src={image} className="study-series-thumb" />
                <div>
                  <h3>{series.title}</h3>
                  <p>
                    {testCount !== undefined ? `${testCount} Tests` : 'Counts unavailable'}
                    {questionCount !== undefined
                      ? ` · ${questionCount.toLocaleString('en-IN')} Questions`
                      : ''}
                  </p>
                </div>
                <span className="study-series-right">
                  {badge && <small>{badge}</small>}
                  <ChevronRight size={20} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </HomepageCarousel>
        ) : (
          <EmptyState>Published test series will appear here when available.</EmptyState>
        )}
        {seriesConfigQuery.isError && (
          <p className="study-inline-note">
            Showcase settings could not be refreshed. Showing the published series catalog.
          </p>
        )}
      </section>

      <div className="study-bottom-row">
        <section className="study-bottom-panel" aria-labelledby="study-recent-title">
          <SectionHeading
            title="Recent Tests"
            icon={Clock3}
            id="study-recent-title"
            link="/results"
          />
          {attemptsQuery.isError ? (
            <EmptyState onRetry={() => void attemptsQuery.refetch()}>
              Recent results couldn’t be loaded.
            </EmptyState>
          ) : attemptsQuery.isLoading ? (
            <EmptyState loading>Loading your recent results…</EmptyState>
          ) : recent.length ? (
            <div className="study-test-list">
              {recent.map((attempt, index) => (
                <Link
                  key={attempt.id}
                  className="study-test-row study-result-row"
                  to={`/exams/${encodeURIComponent(attempt.testId)}/results/${encodeURIComponent(attempt.id)}`}
                >
                  <HomepageImage
                    src={tests.find((test) => test.id === attempt.testId)?.iconUrl}
                    className={`study-doc study-${tones[index % tones.length]}`}
                  />
                  <div className="study-test-copy">
                    <h3>{attempt.testTitle || 'Completed test'}</h3>
                    <p>{attempt.examTitle || attempt.subjectName}</p>
                    {dateLabel(attempt.endTime || attempt.createdAt) && (
                      <p>
                        <CalendarDays size={13} aria-hidden="true" />
                        {dateLabel(attempt.endTime || attempt.createdAt)}
                      </p>
                    )}
                  </div>
                  <span className="study-result-score">
                    <strong>
                      {attempt.score}/{attempt.totalMarks}
                    </strong>
                    <small>Completed</small>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState>Complete your first test to see your results here.</EmptyState>
          )}
        </section>
        <section className="study-bottom-panel" aria-labelledby="study-added-title">
          <SectionHeading title="Recently Added Tests" icon={FileText} id="study-added-title" />
          {testsQuery.isError ? (
            <EmptyState onRetry={() => void testsQuery.refetch()}>
              New tests couldn’t be loaded.
            </EmptyState>
          ) : testsQuery.isLoading ? (
            <EmptyState loading>Loading newly published tests…</EmptyState>
          ) : added.length ? (
            <div className="study-test-list">
              {added.map((test, index) => (
                <TestRow key={test.id} test={test} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState>Newly published tests will appear here.</EmptyState>
          )}
        </section>
        <section className="study-bottom-panel" aria-labelledby="study-recommended-title">
          <SectionHeading
            title="Recommended for You"
            icon={Target}
            id="study-recommended-title"
            link="/practice"
          />
          {testsQuery.isError || attemptsQuery.isError ? (
            <EmptyState
              onRetry={() => {
                void testsQuery.refetch();
                void attemptsQuery.refetch();
              }}
            >
              Suggestions couldn’t be loaded.
            </EmptyState>
          ) : testsQuery.isLoading || attemptsQuery.isLoading ? (
            <EmptyState loading>Finding tests for your exam…</EmptyState>
          ) : recommended.length ? (
            <>
              <p className="study-recommendation-note">Unattempted tests from your exam catalog.</p>
              <div className="study-recommendations">
                {recommended.map((test, index) => (
                  <Link
                    key={test.id}
                    to={`/exams/${encodeURIComponent(test.id)}`}
                    className={`study-recommendation study-${tones[index % tones.length]}`}
                  >
                    <HomepageImage src={test.iconUrl} icon={index % 2 ? Files : Target} />
                    <div>
                      <h3>{test.title}</h3>
                      <p>{test.totalQuestions} Questions</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <EmptyState>New suggestions will appear as your exam catalog grows.</EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type {
  Exam,
  HeroBanner,
  LiveTest,
  MockTest,
  PopularTestSeriesCard,
  TestAttempt,
  TestSeries,
} from '@/types';
const signals = vi.hoisted(() => ({
  banner: undefined as undefined | (() => void),
  catalog: undefined as undefined | (() => void),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'student', fullName: 'Rahul Das', targetExamId: 'exam' },
    isPro: false,
  }),
}));
vi.mock('@/context/ExamContext', () => ({
  useExam: () => ({ selectedExam: { id: 'exam', title: 'Recorded exam' } }),
}));
vi.mock('@/services/bannerService', () => ({
  bannerService: {
    getActiveBanners: vi.fn(),
    trackBannerClick: vi.fn(async () => {}),
    subscribeToBannerUpdates: vi.fn((callback) => {
      signals.banner = callback;
      return () => {};
    }),
  },
}));
vi.mock('@/services/api', () => ({
  api: {
    getExams: vi.fn(),
    getPopularExams: vi.fn(),
    getTests: vi.fn(),
    getStudentTestSeries: vi.fn(),
    getPopularTestSeriesCards: vi.fn(),
    getLiveTests: vi.fn(),
    getUserAttempts: vi.fn(),
    getHomepageAttemptProgress: vi.fn(),
    subscribeToStudentCatalogUpdates: vi.fn((callback) => {
      signals.catalog = callback;
      return () => {};
    }),
    subscribeToPopularExamUpdates: vi.fn(() => () => {}),
  },
}));
import { api } from '@/services/api';
import { bannerService } from '@/services/bannerService';
import { Home } from './Home';
const attempt = (patch: Partial<TestAttempt> = {}): TestAttempt => ({
  id: 'attempt-1',
  userId: 'student',
  testId: 'test',
  testTitle: 'Recorded test',
  status: 'completed',
  startTime: '2026-01-01T00:00:00Z',
  timeSpentSeconds: 60,
  score: 8,
  totalMarks: 10,
  correctCount: 8,
  wrongCount: 2,
  skippedCount: 0,
  accuracy: 80,
  createdAt: '2026-01-01T00:00:00Z',
  totalQuestions: 10,
  ...patch,
});
const testRecord = (patch: Partial<MockTest> = {}): MockTest => ({
  id: 'test',
  title: 'Recorded test',
  slug: 'recorded-test',
  examId: 'exam',
  testSeriesId: 'series',
  testType: 'topic',
  durationMinutes: 30,
  totalQuestions: 10,
  totalMarks: 10,
  passingMarks: 5,
  negativeMarking: 0,
  isPremium: false,
  orderIndex: 0,
  isActive: true,
  status: 'published',
  createdAt: '2026-01-01T00:00:00Z',
  ...patch,
});
const exam: Exam = {
  id: 'exam',
  title: 'Recorded exam',
  slug: 'recorded-exam',
  category: 'state',
  iconName: 'Target',
  orderIndex: 0,
  isActive: true,
  testsCount: 2,
};
const series: TestSeries = {
  id: 'series',
  examId: 'exam',
  title: 'Recorded series',
  slug: 'recorded-series',
  isActive: true,
  status: 'published',
  isPremium: false,
  orderIndex: 0,
  iconUrl: 'https://assets.example.test/series.png',
  isPopular: true,
};
const banner: HeroBanner = {
  id: 'banner',
  title: 'Stored banner',
  primaryCtaLink: '/test-series',
  imageUrl: 'https://assets.example.test/hero.webp',
  isActive: true,
  displayOrder: 0,
  placement: 'home_hero',
  targetAudience: 'all',
  createdAt: '2026-01-01T00:00:00Z',
};
const mount = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <MemoryRouter initialEntries={['/dashboard']}>
        <Home />
      </MemoryRouter>
    </QueryClientProvider>
  );
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  signals.banner = undefined;
  signals.catalog = undefined;
  vi.mocked(bannerService.getActiveBanners).mockResolvedValue([]);
  vi.mocked(api.getExams).mockResolvedValue([]);
  vi.mocked(api.getPopularExams).mockResolvedValue([]);
  vi.mocked(api.getTests).mockResolvedValue([]);
  vi.mocked(api.getStudentTestSeries).mockResolvedValue([]);
  vi.mocked(api.getPopularTestSeriesCards).mockResolvedValue([]);
  vi.mocked(api.getLiveTests).mockResolvedValue([]);
  vi.mocked(api.getUserAttempts).mockResolvedValue([]);
  vi.mocked(api.getHomepageAttemptProgress).mockResolvedValue({});
});
describe('Reference student homepage', () => {
  it('preserves the requested section order and places the three panels below popular series', async () => {
    mount();
    await screen.findByText(/No unfinished tests yet/);
    expect(screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent)).toEqual([
      'Live Mock Test',
      'Continue Your Practice',
      'Exams for You',
      'Popular Test Series',
      'Recent Tests',
      'Recently Added Tests',
      'Recommended for You',
    ]);
    const bottom = document.querySelector('.study-bottom-row')!;
    expect(bottom.children).toHaveLength(3);
    expect(within(bottom as HTMLElement).getAllByRole('heading', { level: 2 })).toHaveLength(3);
    expect(document.querySelector('aside')).toBeNull();
  });
  it('shows exactly the four requested quick actions using actual routes', () => {
    mount();
    const actions = screen.getByRole('region', { name: 'Quick actions' });
    expect(within(actions).getAllByRole('link')).toHaveLength(4);
    for (const [title, href] of [
      ['Mock Test', '/exams/exam/full-mock'],
      ['Topic Test', '/practice'],
      ['Official PYQ', '/exams/exam/pyq'],
      ['Results', '/results'],
    ])
      expect(within(actions).getByRole('link', { name: new RegExp(title) })).toHaveAttribute(
        'href',
        href
      );
    expect(screen.queryByText('Audio books')).not.toBeInTheDocument();
  });
  it('renders the stored admin banner, with strict audience and asset reads', async () => {
    vi.mocked(bannerService.getActiveBanners).mockResolvedValue([banner]);
    mount();
    expect(await screen.findByRole('img', { name: 'Stored banner' })).toHaveAttribute(
      'src',
      banner.imageUrl
    );
    expect(bannerService.getActiveBanners).toHaveBeenCalledWith({
      audience: 'free',
      placement: 'home_hero',
      strictAudience: true,
      storedImagesOnly: true,
    });
  });
  it('collapses disabled, expired, wrong-placement and unconfigured-image banners', async () => {
    vi.mocked(bannerService.getActiveBanners).mockResolvedValue([
      { ...banner, isActive: false },
      { ...banner, id: 'expired', expiresAt: '2000-01-01' },
      { ...banner, id: 'other', placement: 'catalog' },
      { ...banner, id: 'missing', imageUrl: undefined },
    ]);
    mount();
    await screen.findByText(/No unfinished tests yet/);
    expect(screen.queryByRole('region', { name: 'Homepage banner' })).not.toBeInTheDocument();
  });
  it('refreshes admin-replaced banner images through the existing subscription', async () => {
    vi.mocked(bannerService.getActiveBanners).mockResolvedValue([banner]);
    mount();
    await screen.findByRole('img', { name: 'Stored banner' });
    vi.mocked(bannerService.getActiveBanners).mockResolvedValue([
      { ...banner, imageUrl: 'https://assets.example.test/replaced.webp' },
    ]);
    signals.banner?.();
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Stored banner' })).toHaveAttribute(
        'src',
        'https://assets.example.test/replaced.webp'
      )
    );
  });
  it('resumes multiple owned attempts with real answer counts and exact session links', async () => {
    vi.mocked(api.getUserAttempts).mockResolvedValue([
      attempt({ status: 'in_progress' }),
      attempt({
        id: 'attempt-2',
        testId: 'second',
        testTitle: 'Second test',
        status: 'in_progress',
        totalQuestions: 20,
      }),
      attempt({ id: 'not-owned', userId: 'another', status: 'in_progress' }),
    ]);
    vi.mocked(api.getHomepageAttemptProgress).mockResolvedValue({ 'attempt-1': 3, 'attempt-2': 8 });
    mount();
    expect(await screen.findByText('3/10')).toBeInTheDocument();
    expect(screen.getByText('8/20')).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: /Continue Test/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/exams/test/runner?attemptId=attempt-1');
    expect(links[1]).toHaveAttribute('href', '/exams/second/runner?attemptId=attempt-2');
    expect(api.getHomepageAttemptProgress).toHaveBeenCalledWith('student', [
      'attempt-1',
      'attempt-2',
    ]);
    expect(screen.getByRole('progressbar', { name: 'Recorded test progress' })).toHaveAttribute(
      'aria-valuenow',
      '30'
    );
  });
  it('shows helpful empty states instead of fabricated accuracy and a fake live event', async () => {
    mount();
    await screen.findByText(/No unfinished tests yet/);
    expect(screen.getByText(/No live or upcoming full mock/)).toBeInTheDocument();
    expect(screen.queryByText('78%')).not.toBeInTheDocument();
    expect(screen.queryByText('LIVE', { exact: true })).not.toBeInTheDocument();
  });
  it('uses each published exam’s stored image and actual count, excluding inactive exams', async () => {
    vi.mocked(api.getExams).mockResolvedValue([
      { ...exam, bannerUrl: 'https://assets.example.test/exam.jpg' },
      { ...exam, id: 'hidden', title: 'Hidden exam', isActive: false },
    ]);
    vi.mocked(api.getTests).mockResolvedValue([testRecord(), testRecord({ id: 'second' })]);
    mount();
    const card = await screen.findByRole('link', { name: /Recorded exam 2 Tests/ });
    expect(card.querySelector('img')).toHaveAttribute(
      'src',
      'https://assets.example.test/exam.jpg'
    );
    expect(screen.queryByText('Hidden exam')).not.toBeInTheDocument();
  });
  it('uses published series records, stored thumbnails and counts from real published tests', async () => {
    const config: PopularTestSeriesCard = {
      id: 'showcase',
      testSeriesId: 'series',
      title: 'Stale title',
      cardGradientStart: '#fff',
      cardGradientEnd: '#fff',
      orderIndex: 0,
      fullMockCount: 999,
      badgeText: 'Trending',
      isActive: true,
    };
    vi.mocked(api.getStudentTestSeries).mockResolvedValue([
      series,
      { ...series, id: 'draft', title: 'Draft series', status: 'draft' },
    ]);
    vi.mocked(api.getPopularTestSeriesCards).mockResolvedValue([config]);
    vi.mocked(api.getTests).mockResolvedValue([
      testRecord(),
      testRecord({ id: 'two', totalQuestions: 20 }),
      testRecord({ id: 'draft-test', status: 'draft', totalQuestions: 999 }),
    ]);
    mount();
    const card = await screen.findByRole('link', { name: /Recorded series/ });
    expect(card).toHaveAttribute('href', '/test-series/series');
    expect(within(card).getByText('2 Tests · 30 Questions')).toBeInTheDocument();
    expect(card.querySelector('img')).toHaveAttribute('src', series.iconUrl);
    expect(screen.queryByText('Draft series')).not.toBeInTheDocument();
    expect(screen.queryByText('999')).not.toBeInTheDocument();
  });
  it('links actual recent results and orders newly added tests by stored creation dates', async () => {
    vi.mocked(api.getUserAttempts).mockResolvedValue([attempt()]);
    vi.mocked(api.getTests).mockResolvedValue([
      testRecord(),
      testRecord({ id: 'new', title: 'Newest real test', createdAt: '2026-02-01T00:00:00Z' }),
    ]);
    mount();
    const recent = screen.getByRole('region', { name: 'Recent Tests' });
    expect(await within(recent).findByText('8/10')).toBeInTheDocument();
    expect(within(recent).getByRole('link', { name: /Recorded test/ })).toHaveAttribute(
      'href',
      '/exams/test/results/attempt-1'
    );
    const added = screen.getByRole('region', { name: 'Recently Added Tests' });
    expect(within(added).getAllByRole('heading', { level: 3 })[0]).toHaveTextContent(
      'Newest real test'
    );
  });
  it('provides a working retry rather than inventing an empty practice history on failure', async () => {
    vi.mocked(api.getUserAttempts)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([attempt({ status: 'in_progress' })]);
    vi.mocked(api.getHomepageAttemptProgress).mockResolvedValue({ 'attempt-1': 2 });
    mount();
    const region = screen.getByRole('region', { name: 'Continue Your Practice' });
    const alert = await within(region).findByRole('alert');
    fireEvent.click(within(alert).getByRole('button', { name: /Try again/ }));
    expect(await screen.findByText('2/10')).toBeInTheDocument();
  });
  it('cannot feature API-enriched fallback tests absent from the published catalog', async () => {
    vi.mocked(api.getLiveTests).mockResolvedValue([
      {
        id: 'event',
        testId: 'missing',
        startAt: new Date(Date.now() + 120000).toISOString(),
        status: 'upcoming',
        isPublished: true,
        test: testRecord({ id: 'missing', testType: 'full_mock' }),
      } as LiveTest,
    ]);
    mount();
    expect(await screen.findByText(/No live or upcoming full mock/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View Schedule/ })).not.toBeInTheDocument();
  });
  it('only features published full mocks and uses the real live-event selection route', async () => {
    const start = new Date(Date.now() + 120000).toISOString();
    const row: LiveTest = {
      id: 'event',
      testId: 'test',
      startAt: start,
      status: 'upcoming',
      rankingEnabled: true,
      subscriptionRequired: false,
      isPublished: true,
      test: testRecord({ testType: 'full_mock' }),
    };
    vi.mocked(api.getTests).mockResolvedValue([
      testRecord({ testType: 'full_mock' }),
      testRecord({ id: 'topic', testType: 'topic' }),
    ]);
    vi.mocked(api.getLiveTests).mockResolvedValue([
      {
        ...row,
        id: 'topic-event',
        testId: 'topic',
        test: testRecord({ id: 'topic', testType: 'topic' }),
      },
      row,
    ]);
    mount();
    expect(await screen.findByText('UPCOMING')).toBeInTheDocument();
    expect(screen.queryByText('LIVE', { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Schedule/ })).toHaveAttribute(
      'href',
      '/live-test?id=event'
    );
  });
});

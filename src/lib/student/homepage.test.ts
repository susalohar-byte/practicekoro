import { describe, it, expect, beforeEach } from 'vitest';
import {
  activeHomepageBanners,
  bannerDestination,
  storedImage,
  featuredLiveMock,
  resolveExamCards,
  resolveSeriesCards,
  recentlyAddedTests,
  browserSavedAnswerCount,
} from './homepage';
import type {
  HeroBanner,
  MockTest,
  LiveTest,
  Exam,
  TestSeries,
  PopularTestSeriesCard,
} from '@/types';
const test = {
  id: 't',
  examId: 'e',
  testSeriesId: 's',
  title: 'Test',
  testType: 'full_mock',
  status: 'published',
  isActive: true,
  totalQuestions: 20,
  durationMinutes: 30,
  createdAt: '2026-01-01',
} as MockTest;
const series = {
  id: 's',
  isActive: true,
  isPopular: true,
  status: 'published',
  iconUrl: 'https://stored.test/s.png',
  orderIndex: 0,
} as TestSeries;
const banner = {
  id: 'b',
  imageUrl: 'https://stored.test/banner.png',
  isActive: true,
  displayOrder: 0,
  placement: 'home_hero',
  targetAudience: 'all',
} as HeroBanner;
beforeEach(() => localStorage.clear());
describe('Homepage publication and ownership-safe presentation', () => {
  it('rejects unsafe image and banner destinations', () => {
    expect(storedImage('javascript:alert(1)')).toBeUndefined();
    expect(storedImage('//untrusted.test/a')).toBeUndefined();
    expect(bannerDestination('/\\untrusted.test')).toBe('/test-series');
    expect(storedImage('/images/stored.webp')).toBe('/images/stored.webp');
  });
  it('never revives expired, invalid-date, wrong-cohort or disabled banners', () => {
    const now = Date.parse('2026-02-01');
    expect(
      activeHomepageBanners(
        [
          banner,
          { ...banner, id: 'expired', expiresAt: '2026-01-01' },
          { ...banner, id: 'bad', startsAt: 'invalid' },
          { ...banner, id: 'pro', targetAudience: 'pro' },
          { ...banner, id: 'off', isActive: false },
        ],
        'free',
        now
      ).map((x) => x.id)
    ).toEqual(['b']);
  });
  it('excludes stale live events, unpublished tests and topic tests', () => {
    const now = Date.parse('2026-02-01T12:00:00Z');
    const live = {
      id: 'future',
      status: 'upcoming',
      startAt: '2026-02-01T13:00:00Z',
      isPublished: true,
      test,
    } as LiveTest;
    expect(
      featuredLiveMock(
        [
          { ...live, id: 'stale', status: 'live', startAt: '2026-02-01T10:00:00Z' },
          { ...live, id: 'topic', test: { ...test, testType: 'topic' } },
          { ...live, id: 'draft', test: { ...test, status: 'draft' } },
          live,
        ],
        now
      )?.id
    ).toBe('future');
  });
  it('uses only each exam’s own artwork and hides inactive records', () => {
    const exam = {
      id: 'e',
      slug: 'e',
      isActive: true,
      orderIndex: 0,
      bannerUrl: 'https://stored.test/e.png',
    } as Exam;
    expect(
      resolveExamCards(
        [
          exam,
          { ...exam, id: 'other', bannerUrl: undefined },
          { ...exam, id: 'hidden', isActive: false },
        ],
        []
      ).map((x) => [x.exam.id, x.image])
    ).toEqual([
      ['e', 'https://stored.test/e.png'],
      ['other', undefined],
    ]);
  });
  it('honours disabled configured series and does not turn unmatched config into records', () => {
    const card = {
      id: 'card',
      testSeriesId: 's',
      isActive: false,
      orderIndex: 0,
    } as PopularTestSeriesCard;
    expect(resolveSeriesCards([series], [card], [test])).toEqual([]);
    expect(
      resolveSeriesCards([series], [{ ...card, isActive: true, testSeriesId: 'missing' }], [test])
    ).toEqual([]);
  });
  it('uses actual published test totals and retains active legacy series', () => {
    const rows = resolveSeriesCards(
      [{ ...series, status: undefined }],
      [],
      [test, { ...test, id: 'draft', status: 'draft', totalQuestions: 900 }]
    );
    expect(rows[0]).toMatchObject({ image: series.iconUrl, testCount: 1, questionCount: 20 });
  });
  it('new-test lists require a real creation date and published status', () => {
    expect(
      recentlyAddedTests([
        test,
        { ...test, id: 'missing', createdAt: undefined },
        { ...test, id: 'draft', status: 'draft' },
      ]).map((x) => x.id)
    ).toEqual(['t']);
  });
  it('recovery counts deduplicate valid selections and fail safely on corrupt storage', () => {
    localStorage.setItem(
      'practicekoro_attempt_owned',
      JSON.stringify({
        answers: [
          { questionId: 'q', selectedOption: 'A' },
          { questionId: 'q', selectedOption: 'B' },
          { questionId: 'skip', selectedOption: null },
        ],
      })
    );
    expect(browserSavedAnswerCount('owned')).toBe(1);
    localStorage.setItem('practicekoro_attempt_owned', 'broken');
    expect(browserSavedAnswerCount('owned')).toBeUndefined();
  });
});
it('hides disabled exam showcases and counts deduplicated primary/associated published tests', () => {
  const exam = { id: 'e', slug: 'e', isActive: true, orderIndex: 0 } as Exam;
  expect(
    resolveExamCards(
      [exam],
      [{ id: 'e', examId: 'e', isActive: false } as import('@/types').PopularExamCard],
      [test]
    )
  ).toEqual([]);
  expect(
    resolveExamCards(
      [exam],
      [],
      [
        test,
        { ...test, id: 'linked', examId: 'other', associatedExamIds: ['e', 'e'] },
        { ...test, id: 'draft', status: 'draft' },
      ]
    )[0].exam.testsCount
  ).toBe(2);
  expect(resolveExamCards([exam], [])[0].exam.testsCount).toBeUndefined();
});

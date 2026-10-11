import type {
  Exam,
  HeroBanner,
  LiveTest,
  MockTest,
  PopularExamCard,
  PopularTestSeriesCard,
  TestAttempt,
  TestSeries,
} from '@/types';

export const isPublishedTest = (test: MockTest) =>
  test.isActive === true && test.status === 'published';
export const isPublishedSeries = (series: TestSeries) =>
  series.isActive === true && (!series.status || series.status === 'published');
export const isInternalPath = (value?: string) =>
  !!value && /^\/(?!\/)/.test(value) && !value.includes('\\');
export function storedImage(value?: string): string | undefined {
  if (!value) return undefined;
  return /^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(value) ||
    isInternalPath(value)
    ? value
    : undefined;
}
export function bannerDestination(value?: string) {
  if (isInternalPath(value)) return value!;
  if (/^https?:\/\//i.test(value || '')) return value!;
  return '/test-series';
}
export function activeHomepageBanners(
  banners: HeroBanner[],
  audience: 'free' | 'pro',
  now: number
) {
  return banners
    .filter((banner) => {
      if (!banner.isActive || !storedImage(banner.imageUrl)) return false;
      if (banner.placement && !['home_hero', 'all'].includes(banner.placement)) return false;
      if (banner.targetAudience && !['all', audience].includes(banner.targetAudience)) return false;
      if (
        banner.startsAt &&
        (!Number.isFinite(Date.parse(banner.startsAt)) || Date.parse(banner.startsAt) > now)
      )
        return false;
      if (
        banner.expiresAt &&
        (!Number.isFinite(Date.parse(banner.expiresAt)) || Date.parse(banner.expiresAt) <= now)
      )
        return false;
      return true;
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
export function featuredLiveMock(rows: LiveTest[], now: number) {
  return rows
    .filter((row) => {
      const test = row.test;
      if (
        !test ||
        !isPublishedTest(test) ||
        test.testType !== 'full_mock' ||
        row.isPublished === false ||
        !['live', 'upcoming', 'scheduled'].includes(row.status)
      )
        return false;
      const start = Date.parse(row.startAt);
      const duration = test.durationMinutes;
      if (!Number.isFinite(start) || !(duration > 0)) return false;
      const scheduledEnd = row.scheduledEndTime ? Date.parse(row.scheduledEndTime) : NaN;
      const end = Number.isFinite(scheduledEnd) ? scheduledEnd : start + duration * 60000;
      return end > now && end > start;
    })
    .sort((a, b) => {
      const aLive = Date.parse(a.startAt) <= now;
      const bLive = Date.parse(b.startAt) <= now;
      return Number(bLive) - Number(aLive) || Date.parse(a.startAt) - Date.parse(b.startAt);
    })[0];
}
export function resolveExamCards(
  exams: Exam[],
  configurations: PopularExamCard[],
  tests?: MockTest[]
) {
  const matches = (card: PopularExamCard, exam: Exam) =>
    card.examId === exam.id || card.id === exam.id || !!(card.slug && card.slug === exam.slug);
  const published = exams.filter(
    (exam) =>
      exam.isActive &&
      !configurations.some((card) => matches(card, exam) && card.isActive === false)
  );
  return published
    .map((exam) => {
      const config = configurations.find(
        (card) =>
          card.isActive !== false &&
          (card.examId === exam.id || card.id === exam.id || (card.slug && card.slug === exam.slug))
      );
      return {
        exam: {
          ...exam,
          testsCount: tests?.filter(
            (test) =>
              isPublishedTest(test) &&
              (test.examId === exam.id || test.associatedExamIds?.includes(exam.id))
          ).length,
        },
        image:
          storedImage(config?.cardBgImage) ||
          storedImage(exam.bannerUrl) ||
          storedImage(exam.iconName) ||
          storedImage(config?.cardEmblemUrl),
        order: config?.orderIndex ?? exam.orderIndex,
      };
    })
    .sort((a, b) => a.order - b.order);
}
export function resolveSeriesCards(
  series: TestSeries[],
  configurations: PopularTestSeriesCard[],
  tests?: MockTest[]
) {
  const active = series.filter((record) => {
    if (!isPublishedSeries(record)) return false;
    if (!configurations.length) return record.isPopular === true;
    return configurations.some(
      (card) =>
        card.isActive !== false && (card.testSeriesId === record.id || card.id === record.id)
    );
  });
  return active
    .map((record) => {
      const config = configurations.find(
        (card) =>
          card.isActive !== false && (card.testSeriesId === record.id || card.id === record.id)
      );
      const published = tests?.filter(
        (test) => isPublishedTest(test) && test.testSeriesId === record.id
      );
      return {
        series: record,
        image: storedImage(record.iconUrl) || storedImage(config?.cardLogoUrl),
        badge: config?.badgeText || (record.isPopular ? 'Popular' : undefined),
        testCount: published?.length,
        questionCount: published?.reduce((sum, test) => sum + test.totalQuestions, 0),
        order: config?.orderIndex ?? (record.isPopular ? -1 : record.orderIndex),
      };
    })
    .sort((a, b) => a.order - b.order);
}
export function recommendedHomepageTests(
  tests: MockTest[],
  attempts: TestAttempt[],
  examId?: string
) {
  const completed = new Set(
    attempts.filter((attempt) => attempt.status === 'completed').map((attempt) => attempt.testId)
  );
  return tests
    .filter(
      (test) =>
        isPublishedTest(test) &&
        !completed.has(test.id) &&
        (!examId || test.examId === examId || test.associatedExamIds?.includes(examId))
    )
    .sort(
      (a, b) =>
        Number(a.testType === 'full_mock') - Number(b.testType === 'full_mock') ||
        a.orderIndex - b.orderIndex
    )
    .slice(0, 4);
}
/** Read only recovery snapshots for attempts already confirmed as owned by the caller. */
export function browserSavedAnswerCount(attemptId: string): number | undefined {
  try {
    const raw = localStorage.getItem(`practicekoro_attempt_${attemptId}`);
    if (!raw) return undefined;
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== 'object' ||
      !('answers' in value) ||
      !Array.isArray(value.answers)
    )
      return undefined;
    return new Set(
      value.answers
        .filter(
          (answer: unknown): answer is { questionId: string; selectedOption: string } =>
            !!answer &&
            typeof answer === 'object' &&
            'questionId' in answer &&
            typeof answer.questionId === 'string' &&
            'selectedOption' in answer &&
            typeof answer.selectedOption === 'string' &&
            ['A', 'B', 'C', 'D'].includes(answer.selectedOption)
        )
        .map((answer) => answer.questionId)
    ).size;
  } catch {
    return undefined;
  }
}
export function recentAttempts(attempts: TestAttempt[]) {
  return attempts
    .filter((attempt) => attempt.status === 'completed')
    .sort((a, b) => Date.parse(b.endTime || b.createdAt) - Date.parse(a.endTime || a.createdAt))
    .slice(0, 3);
}
export function recentlyAddedTests(tests: MockTest[]) {
  return tests
    .filter(
      (test) =>
        isPublishedTest(test) && test.createdAt && Number.isFinite(Date.parse(test.createdAt))
    )
    .sort((a, b) => Date.parse(b.createdAt!) - Date.parse(a.createdAt!))
    .slice(0, 3);
}

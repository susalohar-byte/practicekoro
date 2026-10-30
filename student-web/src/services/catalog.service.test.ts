import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callsTo, mockSupabase, queueTable, resetSupabaseMock } from '@/test/supabaseMock';

vi.mock('@/lib/supabase', async () => ({
  supabase: (await import('@/test/supabaseMock')).mockSupabase,
}));

import {
  fetchAllTests,
  fetchExam,
  fetchExamTests,
  fetchExams,
  fetchHomeBanners,
  fetchLiveTests,
  fetchSubjects,
  fetchTest,
  fetchTopicTests,
  fetchTopics,
  isLiveNow,
  isUpcoming,
  recordBannerClick,
  toExam,
  toLiveTest,
  toSubject,
  toTest,
  toTopic,
} from './catalog';

beforeEach(() => resetSupabaseMock());
afterEach(() => vi.useRealTimers());

const methods = (table: string, i = 0) => callsTo(table)[i].chain.map((c) => c[0]);

describe('catalog row mappers', () => {
  it('maps an exam row with its test count and fallbacks', () => {
    expect(
      toExam({
        id: 7,
        name: 'WBP Constable',
        order_index: '3',
        tests: [{ count: 12 }],
        banner_url: 'https://cdn/b.png',
      })
    ).toEqual({
      id: '7',
      title: 'WBP Constable',
      slug: '',
      shortName: null,
      subtitle: null,
      category: null,
      description: null,
      iconUrl: null,
      bannerUrl: 'https://cdn/b.png',
      totalTests: 12,
      orderIndex: 3,
    });
    expect(toExam({ id: 'e', title: 'T', tests: [] }).totalTests).toBe(0);
    expect(toExam({ id: 'e', tests: null }).title).toBe('');
  });

  it('keeps an admin Bengali subject name and infers one when it is empty', () => {
    expect(toSubject({ id: 's', name: 'History', name_bengali: ' ইতিহাস কথা ' }).nameBengali).toBe(
      'ইতিহাস কথা'
    );
    expect(toSubject({ id: 's', name: 'General Science' }).nameBengali).toBe('সাধারণ বিজ্ঞান');
    expect(toSubject({ id: 's', name: 'Arithmetic' }).nameBengali).toBe('গণিত');
    expect(toSubject({ id: 's', name: 'Current Affairs' }).nameBengali).toBe(
      'সাম্প্রতিক ঘটনাপ্রবাহ'
    );
    expect(toSubject({ id: 's', name: 'Music' }).nameBengali).toBe('Music');
  });

  it('counts subject chapters and tests from the embeds', () => {
    const s = toSubject({
      id: 1,
      name: 'Polity',
      chapters: [{ count: 4 }],
      tests: [{ count: '9' as never }],
    });
    expect(s).toMatchObject({
      id: '1',
      nameEnglish: 'Polity',
      chapterCount: 4,
      totalTests: 9,
      examId: null,
    });
  });

  it('keeps a topic title untouched when it has no Bengali part or an explicit one', () => {
    expect(toTopic({ id: 't', name: 'Mughal Empire' })).toMatchObject({
      title: 'Mughal Empire',
      titleBengali: null,
    });
    expect(toTopic({ id: 't', name: 'Rivers (নদী)', name_bn: 'নদনদী' })).toMatchObject({
      title: 'Rivers (নদী)',
      titleBengali: 'নদনদী',
    });
  });

  it('maps a test row: numbers from strings, pro flag, category and live-only', () => {
    const t = toTest({
      id: 9,
      title: 'Mock 1',
      total_questions: '100',
      duration_minutes: 90,
      total_marks: '100',
      negative_marking: '0.25',
      passing_marks: null,
      is_premium: true,
      test_type: 'previous_year',
      is_live_only: true,
    });
    expect(t).toMatchObject({
      id: '9',
      totalQuestions: 100,
      durationMinutes: 90,
      totalMarks: 100,
      negativeMarking: 0.25,
      passingMarks: null,
      isPro: true,
      category: 'PYQ',
      isLiveOnly: true,
    });
    expect(toTest({ id: 'x', is_pro: true }).isPro).toBe(true);
    expect(toTest({ id: 'x' })).toMatchObject({
      isPro: false,
      isLiveOnly: false,
      category: 'Full Test',
      title: '',
    });
  });

  it('builds a live test from its parent test when its own columns are empty', () => {
    const lt = toLiveTest({
      id: 'l1',
      start_at: '2026-10-25T10:00:00Z',
      tests: {
        id: 't1',
        title: 'Parent paper',
        exam_id: 'e1',
        duration_minutes: 60,
        total_questions: 50,
        total_marks: 50,
        negative_marking: 0.5,
        exams: { title: 'WBCS' },
      },
    });
    expect(lt).toMatchObject({
      testId: 't1',
      title: 'Parent paper',
      examId: 'e1',
      examTitle: 'WBCS',
      status: 'upcoming',
      durationMinutes: 60,
      totalQuestions: 50,
      negativeMarking: 0.5,
      rankingEnabled: true,
      subscriptionRequired: false,
    });
    // No scheduled end: start + duration.
    expect(lt.endAt?.toISOString()).toBe('2026-10-25T11:00:00.000Z');
  });

  it('prefers the scheduled window and own columns and tolerates bad dates', () => {
    const lt = toLiveTest({
      id: 'l2',
      test_id: 'own',
      title: 'Own title',
      status: 'live',
      scheduled_start_time: '2026-10-25T09:00:00Z',
      scheduled_end_time: '2026-10-25T09:45:00Z',
      registration_deadline: 'not-a-date',
      duration_minutes: 30,
      exam_logo: 'logo.png',
      ranking_enabled: false,
      subscription_required: true,
      tests: [{ id: 'ignored-array' }],
    });
    expect(lt).toMatchObject({
      testId: 'own',
      title: 'Own title',
      status: 'live',
      registrationDeadline: null,
      logo: 'logo.png',
      rankingEnabled: false,
      subscriptionRequired: true,
    });
    expect(lt.endAt?.toISOString()).toBe('2026-10-25T09:45:00.000Z');
    expect(toLiveTest({ id: 'bare' })).toMatchObject({
      testId: 'bare',
      title: 'Live Mock Test',
      startAt: null,
      endAt: null,
    });
  });
});

describe('live test status', () => {
  const now = new Date('2026-10-25T10:00:00Z');
  const lt = (over: Partial<ReturnType<typeof toLiveTest>>) => ({
    ...toLiveTest({ id: 'l' }),
    ...over,
  });

  it('treats ended, completed and cancelled as neither live nor upcoming', () => {
    for (const status of ['ended', 'completed', 'CANCELLED']) {
      const t = lt({
        status,
        startAt: new Date('2026-10-26T00:00:00Z'),
        endAt: new Date('2026-10-26T01:00:00Z'),
      });
      expect(isLiveNow(t, now)).toBe(false);
      expect(isUpcoming(t, now)).toBe(false);
    }
  });

  it('honours an explicit live status even outside the window', () => {
    expect(isLiveNow(lt({ status: 'Live' }), now)).toBe(true);
  });

  it('is not live at the exact end time and is upcoming only before the start', () => {
    const t = lt({ startAt: new Date('2026-10-25T09:00:00Z'), endAt: now });
    expect(isLiveNow(t, now)).toBe(false);
    expect(isUpcoming(t, now)).toBe(false);
  });

  it('falls back to the status when no start time is set', () => {
    expect(isUpcoming(lt({ status: 'upcoming' }), now)).toBe(true);
    expect(isUpcoming(lt({ status: 'draft' }), now)).toBe(false);
    expect(isLiveNow(lt({ status: 'upcoming' }), now)).toBe(false);
  });
});

describe('catalog queries', () => {
  it('fetchExams reads active exams in order and maps them', async () => {
    queueTable('exams', { data: [{ id: 1, title: 'A', tests: [{ count: 2 }] }] });
    const exams = await fetchExams();
    expect(exams).toHaveLength(1);
    expect(exams[0]).toMatchObject({ id: '1', title: 'A', totalTests: 2 });
    const chain = callsTo('exams')[0].chain;
    expect(chain[0][0]).toBe('select');
    expect(chain[0][1]).toContain('tests(count)');
    expect(chain.slice(1)).toEqual([
      ['eq', 'is_active', true],
      ['order', 'order_index', { ascending: true }],
    ]);
  });

  it('fetchExams returns [] for null data and throws the Supabase error', async () => {
    queueTable('exams', { data: null }, { error: { message: 'boom' } });
    await expect(fetchExams()).resolves.toEqual([]);
    await expect(fetchExams()).rejects.toEqual({ message: 'boom' });
  });

  it('fetchExam looks up one exam and returns null when missing', async () => {
    queueTable('exams', { data: { id: 'e1', title: 'WBP' } }, { data: null });
    await expect(fetchExam('e1')).resolves.toMatchObject({ id: 'e1', title: 'WBP' });
    await expect(fetchExam('nope')).resolves.toBeNull();
    expect(callsTo('exams')[0].chain).toContainEqual(['eq', 'id', 'e1']);
    expect(methods('exams')).toContain('maybeSingle');
  });

  it('fetchSubjects reads active subjects', async () => {
    queueTable('subjects', { data: [{ id: 's', name: 'English' }] });
    const [s] = await fetchSubjects();
    expect(s).toMatchObject({ id: 's', nameBengali: 'ইংরেজি' });
    expect(callsTo('subjects')[0].chain).toContainEqual(['eq', 'is_active', true]);
  });

  it('fetchTopics filters by subject only when one is given', async () => {
    queueTable('chapters', { data: [] }, { data: [{ id: 'c', name: 'X (এক্স)' }] });
    await fetchTopics();
    expect(callsTo('chapters')[0].chain.filter((c) => c[0] === 'eq')).toEqual([
      ['eq', 'is_active', true],
    ]);
    const [t] = await fetchTopics('sub-1');
    expect(callsTo('chapters')[1].chain).toContainEqual(['eq', 'subject_id', 'sub-1']);
    expect(t).toMatchObject({ title: 'X', titleBengali: 'এক্স' });
  });

  it('fetchTopics throws on error', async () => {
    queueTable('chapters', { error: new Error('rls') });
    await expect(fetchTopics('s')).rejects.toThrow('rls');
  });

  it('fetchExamTests filters the exam and hides live-only papers', async () => {
    queueTable('tests', {
      data: [
        { id: 'a', title: 'Visible' },
        { id: 'b', title: 'Live paper', is_live_only: true },
      ],
    });
    const tests = await fetchExamTests('e9');
    expect(tests.map((t) => t.id)).toEqual(['a']);
    const chain = callsTo('tests')[0].chain;
    expect(chain).toContainEqual(['eq', 'exam_id', 'e9']);
    expect(chain).toContainEqual(['eq', 'is_active', true]);
    expect(chain.filter((c) => c[0] === 'order').map((c) => c[1])).toEqual([
      'order_index',
      'created_at',
    ]);
  });

  it('fetchAllTests and fetchTopicTests hide live-only papers too', async () => {
    queueTable(
      'tests',
      { data: [{ id: 'a', is_live_only: true }, { id: 'b' }] },
      { data: [{ id: 'c' }, { id: 'd', is_live_only: true }] }
    );
    expect((await fetchAllTests()).map((t) => t.id)).toEqual(['b']);
    expect((await fetchTopicTests('ch1')).map((t) => t.id)).toEqual(['c']);
    expect(callsTo('tests')[1].chain).toContainEqual(['eq', 'chapter_id', 'ch1']);
  });

  it('fetchTest returns the mapped test or null, and throws on error', async () => {
    queueTable(
      'tests',
      { data: { id: 't', title: 'One' } },
      { data: null },
      { error: { code: '500' } }
    );
    await expect(fetchTest('t')).resolves.toMatchObject({ id: 't', title: 'One' });
    await expect(fetchTest('t')).resolves.toBeNull();
    await expect(fetchTest('t')).rejects.toEqual({ code: '500' });
  });

  it('fetchLiveTests keeps only live and upcoming tests, filtered by exam', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T10:00:00Z'));
    queueTable('live_tests', {
      data: [
        { id: 'past', start_at: '2026-10-24T10:00:00Z', duration_minutes: 60 },
        { id: 'now', start_at: '2026-10-25T09:30:00Z', duration_minutes: 60 },
        { id: 'soon', start_at: '2026-10-26T09:30:00Z', duration_minutes: 60 },
        { id: 'cancelled', status: 'cancelled', start_at: '2026-10-26T09:30:00Z' },
      ],
    });
    const list = await fetchLiveTests('exam-1');
    expect(list.map((l) => l.id)).toEqual(['now', 'soon']);
    const chain = callsTo('live_tests')[0].chain;
    expect(chain).toContainEqual(['eq', 'is_published', true]);
    expect(chain).toContainEqual(['eq', 'exam_id', 'exam-1']);
    expect(chain.slice(-1)[0]).toEqual(['order', 'start_at', { ascending: true }]);
  });

  it('fetchLiveTests without an exam does not filter by exam and throws errors', async () => {
    queueTable('live_tests', { data: [] }, { error: { message: 'x' } });
    await expect(fetchLiveTests()).resolves.toEqual([]);
    expect(callsTo('live_tests')[0].chain.some((c) => c[1] === 'exam_id')).toBe(false);
    await expect(fetchLiveTests()).rejects.toEqual({ message: 'x' });
  });
});

describe('home banners', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T10:00:00Z'));
  });

  it('keeps active, in-window, home placements with an image, sorted by display order', async () => {
    queueTable('hero_banners', {
      data: [
        {
          id: 2,
          title: 'Second',
          image_url: ' https://img/2.png ',
          is_active: true,
          display_order: 2,
          placement: 'all',
        },
        {
          id: 1,
          title: 'First',
          image_url: 'https://img/1.png',
          is_active: true,
          display_order: 1,
        },
        { id: 3, image_url: 'https://img/3.png', is_active: false },
        { id: 4, image_url: 'https://img/4.png', is_active: true, placement: 'exams_page' },
        {
          id: 5,
          image_url: 'https://img/5.png',
          is_active: true,
          starts_at: '2026-11-01T00:00:00Z',
        },
        {
          id: 6,
          image_url: 'https://img/6.png',
          is_active: true,
          expires_at: '2026-10-01T00:00:00Z',
        },
        { id: 7, image_url: '', is_active: true },
      ],
    });
    const banners = await fetchHomeBanners();
    expect(banners.map((b) => b.id)).toEqual(['1', '2']);
    expect(banners[1]).toEqual({
      id: '2',
      title: 'Second',
      subtitle: null,
      badgeText: null,
      imageUrl: 'https://img/2.png',
      mobileImageUrl: null,
      showTextOverlay: false,
      ctaText: 'Start Now',
      ctaLink: '/exams',
      displayOrder: 2,
    });
  });

  it('turns on the text overlay for text_overlay banners and keeps custom CTAs', async () => {
    queueTable('hero_banners', {
      data: [
        {
          id: 'b',
          image_url: 'https://img/b.png',
          is_active: true,
          banner_type: 'text_overlay',
          primary_cta_text: 'Join',
          primary_cta_link: '/plans',
          mobile_image_url: 'https://img/m.png',
        },
      ],
    });
    const [b] = await fetchHomeBanners();
    expect(b).toMatchObject({
      showTextOverlay: true,
      ctaText: 'Join',
      ctaLink: '/plans',
      mobileImageUrl: 'https://img/m.png',
      displayOrder: 1,
    });
  });

  it('throws the query error', async () => {
    queueTable('hero_banners', { error: { message: 'denied' } });
    await expect(fetchHomeBanners()).rejects.toEqual({ message: 'denied' });
  });

  it('records a banner click through the RPC', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    await recordBannerClick('b-1');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_banner_click', { p_banner_id: 'b-1' });
  });
});

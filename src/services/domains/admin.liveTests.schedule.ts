import { requireSavedRow } from './admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { notifyExamsUpdated } from '@/lib/dataSync';
import { createTest, deleteTest } from './admin.tests';
import type { LiveTest, MockTest } from '@/types';
import {
  toDbStatusFields,
  fetchSourceTestsMap,
  enrichLiveTest,
  sortLiveTests,
} from './admin.liveTests.store';
import { syncLiveTestsToRemote, getLiveTests } from './admin.liveTests.read';

export interface ScheduleLiveTestInput {
  testId: string;
  startAt: string;
  registrationDeadline?: string;
  rankingEnabled?: boolean;
  subscriptionRequired?: boolean;
  title?: string;
  logo?: string;
  examLogo?: string;
  bgImageUrl?: string;
  cardBgImage?: string;
  totalQuestions?: number;
  durationMinutes?: number;
  totalMarks?: number;
  negativeMarking?: number;
  /** Admin-facing status; 'draft' is stored as an unpublished upcoming event. */
  status?: LiveTest['status'];
}

/** Schedule an existing test as a Live Test event */
/** Live Tests reference an existing Full Mock test (also enforced by a DB trigger). */
export function assertFullMockSource(testId: string, sourceTest: MockTest | null) {
  if (!testId) throw new Error('Select a Full Mock test to schedule as a Live Test.');
  if (!isSupabaseConfigured) return;
  if (!sourceTest) throw new Error('The selected source test no longer exists.');
  if (sourceTest.testType !== 'full_mock')
    throw new Error('Live Tests can only be scheduled from a Full Mock test.');
}

export async function scheduleLiveTest(input: ScheduleLiveTestInput): Promise<LiveTest> {
  if (!input.testId) throw new Error('Select a Full Mock test to schedule as a Live Test.');
  const currentList = await getLiveTests();

  // 1. Prevent duplicate active Live Test events for the same Test
  const isLocked = currentList.some(
    (lt) => lt.testId === input.testId && (lt.status === 'upcoming' || lt.status === 'live')
  );
  if (isLocked) {
    throw new Error(
      'This test is already scheduled for an active or upcoming Live Test event. Please cancel it or wait until it completes.'
    );
  }

  const id = `live-${input.testId}-${Date.now().toString().slice(-5)}`;
  const startAt = new Date(input.startAt).toISOString();
  const registrationDeadline = input.registrationDeadline
    ? new Date(input.registrationDeadline).toISOString()
    : startAt;

  // Fetch the real source test from Supabase (or localTests fallback)
  const sourceTestsMap = await fetchSourceTestsMap([input.testId]);
  const sourceTest = sourceTestsMap.get(input.testId) || null;
  assertFullMockSource(input.testId, sourceTest);

  const resolvedLogo = input.logo?.trim() || input.examLogo?.trim() || undefined;
  const resolvedBgImage = input.bgImageUrl?.trim() || input.cardBgImage?.trim() || undefined;
  const dbFields = toDbStatusFields(input.status || 'upcoming');
  const isPublished = dbFields.isPublished ?? true;

  const newLiveTest: LiveTest = enrichLiveTest(
    {
      id,
      test_id: input.testId,
      testId: input.testId,
      customTitle: input.title?.trim() || undefined,
      title: input.title?.trim() || sourceTest?.title || undefined,
      start_at: startAt,
      startAt,
      registration_deadline: registrationDeadline,
      registrationDeadline,
      status: dbFields.status,
      isPublished,
      ranking_enabled: input.rankingEnabled ?? true,
      rankingEnabled: input.rankingEnabled ?? true,
      subscription_required: input.subscriptionRequired ?? false,
      subscriptionRequired: input.subscriptionRequired ?? false,
      enrolledCount: 0,
      participantsCount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      logo: resolvedLogo,
      examLogo: resolvedLogo,
      bgImageUrl: resolvedBgImage,
      cardBgImage: resolvedBgImage,
      totalQuestions: input.totalQuestions,
      totalMarks: input.totalMarks,
      durationMinutes: input.durationMinutes,
      negativeMarking: input.negativeMarking,
    },
    sourceTest
  );

  // Persist to Tier 2 (app_settings) & Tier 3 (localStorage + in-memory)
  const updatedList = sortLiveTests([newLiveTest, ...currentList.filter((lt) => lt.id !== id)]);
  if (!isSupabaseConfigured) await syncLiveTestsToRemote(updatedList);

  // Also attempt Tier 1 (`public.live_tests` table) if migrated
  if (isSupabaseConfigured) {
    try {
      const instructionsWithMeta = resolvedBgImage
        ? JSON.stringify({
            instructions: newLiveTest.instructions || '',
            bgImageUrl: resolvedBgImage,
          })
        : newLiveTest.instructions;

      const payload = {
        id,
        test_id: input.testId,
        exam_id: sourceTest?.examId ?? null,
        start_at: startAt,
        registration_deadline: registrationDeadline,
        status: dbFields.status,
        ranking_enabled: input.rankingEnabled ?? true,
        subscription_required: input.subscriptionRequired ?? false,
        title: newLiveTest.title,
        scheduled_start_time: startAt,
        scheduled_end_time: newLiveTest.scheduledEndTime,
        duration_minutes: newLiveTest.durationMinutes,
        total_questions: newLiveTest.totalQuestions,
        total_marks: newLiveTest.totalMarks,
        negative_marking: newLiveTest.negativeMarking,
        instructions: instructionsWithMeta,
        is_published: isPublished,
        logo: newLiveTest.logo,
        exam_logo: newLiveTest.examLogo,
      };

      requireSavedRow(await supabase.from('live_tests').insert(payload).select('id').single(), id);
    } catch {
      throw new Error('Live-test persistence failed. Check the backend schema and permissions.');
    }
  }

  // Also sync to app_settings so that all clients receive the updated list
  if (isSupabaseConfigured) {
    try {
      await syncLiveTestsToRemote(updatedList);
    } catch {
      // ignore
    }
  }

  notifyExamsUpdated();
  return newLiveTest;
}

export interface CreateLiveTestWithPaperInput {
  examId: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  /** Target number of questions; the paper's real count follows its uploaded questions. */
  totalQuestions: number;
  totalMarks: number;
  negativeMarking: number;
  rankingEnabled?: boolean;
  subscriptionRequired?: boolean;
  logo?: string;
}

/**
 * Create a Live Test together with its own paper: a Full Mock test flagged live-only, so it
 * and its questions stay out of every catalog and the Question Bank. The event starts as a
 * Draft; the admin uploads the questions and then publishes it.
 */
export async function createLiveTestWithPaper(
  input: CreateLiveTestWithPaperInput
): Promise<LiveTest> {
  const title = input.title.trim();
  if (!input.examId) throw new Error('Select the exam for this Live Test.');
  if (!title) throw new Error('Title is required.');

  const slugBase = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const paper = await createTest({
    title,
    slug: `live-${slugBase || 'paper'}-${Date.now().toString(36)}`,
    examId: input.examId,
    testType: 'full_mock',
    durationMinutes: Number(input.durationMinutes),
    totalQuestions: Number(input.totalQuestions),
    totalMarks: Number(input.totalMarks),
    passingMarks: 0,
    negativeMarking: Number(input.negativeMarking),
    isPremium: Boolean(input.subscriptionRequired),
    orderIndex: 0,
    isActive: true,
    isLiveOnly: true,
    status: 'draft',
  });

  try {
    return await scheduleLiveTest({
      testId: paper.id,
      title,
      startAt: input.startAt,
      registrationDeadline: input.startAt,
      durationMinutes: Number(input.durationMinutes),
      totalQuestions: Number(input.totalQuestions),
      totalMarks: Number(input.totalMarks),
      negativeMarking: Number(input.negativeMarking),
      rankingEnabled: input.rankingEnabled ?? true,
      subscriptionRequired: Boolean(input.subscriptionRequired),
      logo: input.logo,
      examLogo: input.logo,
      status: 'draft',
    });
  } catch (err) {
    // Never leave a paper behind without its Live Test.
    await deleteTest(paper.id).catch(() => undefined);
    throw err;
  }
}

import { uploadValidatedImage, validateRasterFile } from '@/lib/rasterUploads';
import { requireSavedRow, deleteAdminRecord } from './admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { notifyExamsUpdated } from '@/lib/dataSync';
import {
  archiveTest,
  deleteTest,
  duplicateTest,
  getTestById,
  updateTest,
  validateTestForPublish,
} from './admin.tests';
import type { LiveTest, MockTest } from '@/types';
import {
  toDbStatusFields,
  fetchSourceTestsMap,
  enrichLiveTest,
  sortLiveTests,
} from './admin.liveTests.store';
import { syncLiveTestsToRemote, getLiveTests, getLiveTestById } from './admin.liveTests.read';
import { assertFullMockSource, scheduleLiveTest } from './admin.liveTests.schedule';

const PUBLISHED_EVENT_STATUSES: ReadonlyArray<LiveTest['status']> = [
  'upcoming',
  'scheduled',
  'live',
];

/**
 * Keep a live-only paper in step with its event. Edits to title, duration, negative marking and
 * access are copied onto the paper (the database refuses scoring edits once the event is
 * published). Publishing the event first validates and publishes the paper, and takes the
 * question count and marks from what was actually uploaded.
 */
async function syncLivePaper(
  existing: LiveTest,
  paper: MockTest,
  updates: Partial<LiveTest>
): Promise<Partial<LiveTest>> {
  const paperUpdates: Partial<MockTest> = {};
  const nextTitle = updates.title?.trim();
  if (nextTitle && nextTitle !== paper.title) paperUpdates.title = nextTitle;
  if (
    updates.durationMinutes !== undefined &&
    Number(updates.durationMinutes) !== Number(paper.durationMinutes)
  )
    paperUpdates.durationMinutes = Number(updates.durationMinutes);
  if (
    updates.negativeMarking !== undefined &&
    Number(updates.negativeMarking) !== Number(paper.negativeMarking)
  )
    paperUpdates.negativeMarking = Number(updates.negativeMarking);
  if (
    updates.subscriptionRequired !== undefined &&
    Boolean(updates.subscriptionRequired) !== Boolean(paper.isPremium)
  )
    paperUpdates.isPremium = Boolean(updates.subscriptionRequired);
  if (Object.keys(paperUpdates).length > 0) await updateTest(paper.id, paperUpdates);

  const publishing =
    updates.status !== undefined &&
    PUBLISHED_EVENT_STATUSES.includes(updates.status) &&
    (existing.status === 'draft' || paper.status !== 'published');
  if (!publishing) return updates;

  const validation = await validateTestForPublish(paper.id);
  if (!validation.isValid)
    throw new Error(
      `Upload this Live Test's questions before publishing it: ${validation.errors.join('; ')}`
    );
  if (paper.status !== 'published') await updateTest(paper.id, { status: 'published' });
  const fresh = await getTestById(paper.id);
  return fresh
    ? { ...updates, totalQuestions: fresh.totalQuestions, totalMarks: fresh.totalMarks }
    : updates;
}

/** Make an ended Live Test's paper an ordinary Full Mock that students can practise. */
export async function releaseLivePaperToPractice(id: string): Promise<MockTest> {
  const liveTest = await getLiveTestById(id);
  if (!liveTest) throw new Error('Live test not found.');
  if (!['ended', 'completed', 'cancelled'].includes(liveTest.status))
    throw new Error('A Live Test paper can be released to practice only after the Live Test ends.');
  const paper = (await fetchSourceTestsMap([liveTest.testId])).get(liveTest.testId);
  if (!paper) throw new Error('The Live Test paper no longer exists.');
  if (!paper.isLiveOnly) throw new Error('This paper is already available for practice.');
  const released = await updateTest(paper.id, { isLiveOnly: false });
  notifyExamsUpdated();
  return released;
}

/**
 * Duplicate a Live Test as a new Draft for tomorrow. A live-only paper is copied with its
 * questions, so the new event never shares (or locks) the original's paper.
 */
export async function duplicateLiveTest(id: string): Promise<LiveTest> {
  const liveTest = await getLiveTestById(id);
  if (!liveTest) throw new Error('Live test not found.');
  const startAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const logo = liveTest.logo || liveTest.examLogo || '/images/exams/logo_wbp.png';
  const common = {
    title: `${liveTest.title} (Copy)`,
    startAt,
    durationMinutes: liveTest.durationMinutes || 60,
    totalQuestions: liveTest.totalQuestions || 100,
    totalMarks: liveTest.totalMarks || 100,
    negativeMarking: liveTest.negativeMarking ?? 0.25,
    rankingEnabled: Boolean(liveTest.rankingEnabled),
    subscriptionRequired: Boolean(liveTest.subscriptionRequired),
    logo,
    examLogo: logo,
  };

  if (!liveTest.test?.isLiveOnly) {
    return scheduleLiveTest({
      ...common,
      testId: liveTest.testId,
      registrationDeadline: new Date(Date.now() + 23.5 * 3600 * 1000).toISOString(),
    });
  }

  const copy = await duplicateTest(liveTest.testId);
  if (!copy) throw new Error('The Live Test paper could not be copied.');
  try {
    return await scheduleLiveTest({
      ...common,
      testId: copy.id,
      registrationDeadline: startAt,
      status: 'draft',
    });
  } catch (err) {
    await deleteTest(copy.id).catch(() => undefined);
    throw err;
  }
}

/** Update Live Test schedule or status */
export async function updateLiveTest(id: string, updates: Partial<LiveTest>): Promise<LiveTest> {
  const currentList = await getLiveTests();
  const existing = currentList.find((lt) => lt.id === id);

  if (!existing) throw new Error('Live test not found.');
  // A running event's paper and timing are fixed: students are already answering it.
  if (existing.status === 'live') {
    if (updates.testId && updates.testId !== existing.testId)
      throw new Error('The source test of a running Live Test cannot be changed.');
    if (
      updates.durationMinutes !== undefined &&
      Number(updates.durationMinutes) !== Number(existing.durationMinutes)
    )
      throw new Error('The duration of a running Live Test cannot be changed.');
  }
  const testId = updates.testId || existing.testId;
  const sourceTestsMap = testId ? await fetchSourceTestsMap([testId]) : new Map<string, MockTest>();
  const sourceTest = sourceTestsMap.get(testId) || existing?.test || null;
  if (updates.testId && updates.testId !== existing?.testId)
    assertFullMockSource(updates.testId, sourceTestsMap.get(updates.testId) || null);
  if (sourceTest?.isLiveOnly && testId === existing.testId) {
    updates = await syncLivePaper(existing, sourceTest, updates);
  }

  // Map the requested status onto the stored columns (Draft = unpublished). Without an explicit
  // status, keep a cancellation and otherwise let deriveLiveTestStatus compute from the schedule.
  const dbFields = updates.status ? toDbStatusFields(updates.status) : null;
  const nextStatus =
    dbFields?.status ?? (existing.status === 'cancelled' ? 'cancelled' : 'upcoming');
  const nextIsPublished = dbFields?.isPublished ?? existing.isPublished;

  const updatedItem = enrichLiveTest(
    {
      ...(existing || { id, testId }),
      ...updates,
      status: nextStatus,
      isPublished: nextIsPublished,
      updatedAt: new Date().toISOString(),
    },
    sourceTest
  );

  const nextList = currentList.some((lt) => lt.id === id)
    ? currentList.map((lt) => (lt.id === id ? updatedItem : lt))
    : [updatedItem, ...currentList];

  if (!isSupabaseConfigured) await syncLiveTestsToRemote(sortLiveTests(nextList));

  if (isSupabaseConfigured) {
    try {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.title !== undefined) {
        payload.title = updates.title;
      }
      if (updates.logo !== undefined || updates.examLogo !== undefined) {
        payload.logo = updates.logo || updates.examLogo;
        payload.exam_logo = updates.logo || updates.examLogo;
      }
      if (updates.totalQuestions !== undefined) {
        payload.total_questions = updates.totalQuestions;
      }
      if (updates.durationMinutes !== undefined) {
        payload.duration_minutes = updates.durationMinutes;
      }
      if (updates.startAt) {
        payload.start_at = updates.startAt;
        payload.scheduled_start_time = updates.startAt;
        payload.scheduled_end_time = updatedItem.scheduledEndTime;
      }
      if (updates.registrationDeadline !== undefined) {
        payload.registration_deadline = updates.registrationDeadline;
      }
      if (dbFields) {
        payload.status = dbFields.status;
        if (dbFields.isPublished !== undefined) payload.is_published = dbFields.isPublished;
      }
      if (updates.rankingEnabled !== undefined) payload.ranking_enabled = updates.rankingEnabled;
      if (updates.subscriptionRequired !== undefined) {
        payload.subscription_required = updates.subscriptionRequired;
      }
      if (updates.enrolledCount !== undefined) {
        payload.enrolled_count = updates.enrolledCount;
      }

      let nextInstructions: string | undefined = updates.instructions;
      const targetBg = updates.bgImageUrl !== undefined ? updates.bgImageUrl : updates.cardBgImage;
      if (targetBg !== undefined) {
        const rawBase =
          updates.instructions !== undefined ? updates.instructions : existing.instructions || '';
        nextInstructions = targetBg
          ? JSON.stringify({
              instructions: rawBase,
              bgImageUrl: targetBg,
            })
          : rawBase;
      }

      requireSavedRow(
        await supabase
          .from('live_tests')
          .update({
            ...payload,
            ...(updates.testId ? { test_id: updates.testId } : {}),
            ...(nextInstructions !== undefined ? { instructions: nextInstructions } : {}),
          })
          .eq('id', id)
          .select('id')
          .single(),
        id
      );

      try {
        await syncLiveTestsToRemote(sortLiveTests(nextList));
      } catch {
        // ignore
      }
    } catch (err) {
      throw new Error(
        err instanceof Error && err.message
          ? `Live test could not be saved: ${err.message}`
          : 'Live test could not be saved. Check the backend schema and permissions.'
      );
    }
  }

  notifyExamsUpdated();
  return updatedItem;
}

/** Upload Exam/Test Logo for Live Test to Supabase Storage */
export async function uploadLiveTestLogo(file: File, _id: string = 'custom'): Promise<string> {
  validateRasterFile(file, 'banners');
  if (isSupabaseConfigured) return uploadValidatedImage(file, 'banners');
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.readAsDataURL(file);
  });
}

/** Upload Card Background Image for Live Test to Supabase Storage */
export async function uploadLiveTestBackground(
  file: File,
  _id: string = 'custom'
): Promise<string> {
  validateRasterFile(file, 'banners');
  if (isSupabaseConfigured) return uploadValidatedImage(file, 'banners');
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.readAsDataURL(file);
  });
}

/** Cancel a live test */
export async function cancelLiveTest(id: string): Promise<boolean> {
  return (await updateLiveTest(id, { status: 'cancelled' })).status === 'cancelled';
}

/** Delete a live test */
export async function deleteLiveTest(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const before = await getLiveTests();
    const target = before.find((lt) => lt.id === id);
    const deleted = await deleteAdminRecord('live_tests', id);
    // A live-only paper has no other home: archive it once no Live Test uses it any more
    // (archived, not deleted, so attempts and results stay intact).
    if (
      deleted &&
      target?.test?.isLiveOnly &&
      !before.some((lt) => lt.id !== id && lt.testId === target.testId)
    ) {
      await archiveTest(target.testId);
    }
    notifyExamsUpdated();
    return deleted;
  }
  const rows = await getLiveTests();
  if (!rows.some((r) => r.id === id)) throw new Error('Live test not found.');
  await syncLiveTestsToRemote(rows.filter((r) => r.id !== id));
  notifyExamsUpdated();
  return true;
}

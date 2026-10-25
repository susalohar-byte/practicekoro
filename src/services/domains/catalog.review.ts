import { readCompleteQuery } from '@/services/domains/admin.reporting';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MOCK_QUESTIONS, MOCK_ATTEMPTS, MOCK_MISTAKES, MOCK_BOOKMARKS } from '@/services/mockData';
import type { TestAttempt, MistakeItem, BookmarkItem } from '@/types';
import { localAttemptsStore } from '@/services/domains/localStore';
import type { BookmarkRow, MistakeRow, QuestionRow } from '@/services/domains/localStore';

type QuestionWithContext = QuestionRow & {
  chapters?: {
    name?: string;
    subjects?: { name?: string; exams?: { title?: string } | null } | null;
  } | null;
};

/** Section of the student catalog API: bookmark toggling, attempt history, mistakes & bookmarks (split from domains/catalog.ts, same behaviour). */
export const catalogReviewApi = {
  async toggleBookmark(userId: string, questionId: string, note?: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { data: existing, error: lookupError } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .maybeSingle();
      if (lookupError) throw new Error(lookupError.message || 'Bookmark lookup failed');
      if (existing) {
        await this.removeBookmarks(userId, [questionId]);
        return false;
      }
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          question_id: questionId,
          note: note || 'Bookmarked during practice review',
        })
        .select('id')
        .single();
      if (error) throw new Error(error.message || 'Bookmark save failed');
      if (!data?.id) throw new Error('Bookmark save was not confirmed');
      return true;
    }

    const existingIndex = MOCK_BOOKMARKS.findIndex(
      (b) => b.questionId === questionId && b.userId === userId
    );

    if (existingIndex >= 0) {
      MOCK_BOOKMARKS.splice(existingIndex, 1);
      return false; // Removed
    } else {
      const q = Object.values(MOCK_QUESTIONS)
        .flat()
        .find((item) => item.id === questionId);
      if (q) {
        MOCK_BOOKMARKS.unshift({
          id: 'bm-' + Date.now(),
          userId,
          questionId,
          question: q,
          note: note || 'Bookmarked during mock test review',
          createdAt: new Date().toISOString(),
        });
      }
      return true; // Added
    }
  },

  async getUserAttempts(userId: string, testIds?: string[]): Promise<TestAttempt[]> {
    if (testIds && testIds.length === 0) return [];
    // Merge any live session attempts with mock attempts if not on Supabase
    const sessionAttempts = Object.values(localAttemptsStore)
      .filter((a) => a.attempt.userId === userId && a.attempt.status === 'completed')
      .map((a) => a.attempt);

    if (!isSupabaseConfigured) {
      const combined = [...sessionAttempts, ...MOCK_ATTEMPTS];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
      return testIds ? unique.filter((attempt) => testIds.includes(attempt.testId)) : unique;
    }

    const data = await readCompleteQuery(() => {
      let query = supabase
        .from('test_attempts')
        .select(
          `
          *,
          tests (
            title,
            duration_minutes,
            total_questions,
            total_marks,
            is_premium,
            test_type,
            year,
            test_series_id,
            exams:exam_id (title),
            subjects:subject_id (name),
            chapters:chapter_id (name)
          )
        `,
          { count: 'exact' }
        )
        .eq('user_id', userId);
      if (testIds) query = query.in('test_id', testIds);
      return query.order('created_at', { ascending: false }).order('id', { ascending: false });
    });

    if (!data) throw new Error('Test history could not be loaded');
    if (data.length === 0) return [];
    return data.map((d) => {
      const test = d.tests;
      return {
        id: d.id,
        userId: d.user_id,
        testId: d.test_id,
        testSeriesId: test?.test_series_id ?? undefined,
        testTitle: test?.title || d.test_id,
        examTitle: test?.exams?.title,
        subjectName: test?.subjects?.name,
        chapterName: test?.chapters?.name,
        durationMinutes: test?.duration_minutes ? Number(test.duration_minutes) : undefined,
        totalQuestions: test?.total_questions ? Number(test.total_questions) : undefined,
        isPremium: Boolean(test?.is_premium),
        testType: test?.test_type,
        year: test?.year ? Number(test.year) : undefined,
        status: d.status,
        startTime: d.start_time,
        endTime: d.end_time ?? undefined,
        timeSpentSeconds: d.time_spent_seconds,
        score: Number(d.score),
        totalMarks: Number(d.total_marks || test?.total_marks || 0),
        correctCount: d.correct_count,
        wrongCount: d.wrong_count,
        skippedCount: d.skipped_count,
        accuracy: Number(d.accuracy),
        rank: d.rank ?? undefined,
        percentile: d.percentile ? Number(d.percentile) : undefined,
        createdAt: d.created_at,
      };
    });
  },

  async getMistakes(userId: string): Promise<MistakeItem[]> {
    if (!isSupabaseConfigured) return MOCK_MISTAKES.filter((m) => m.userId === userId || !m.userId);
    try {
      const { data, error } = await supabase
        .from('mistakes')
        .select(
          `
          id,
          user_id,
          question_id,
          wrong_count,
          is_resolved,
          last_reviewed_at,
          created_at,
          questions (
            *,
            chapters:chapters!questions_chapter_id_fkey (
              name,
              subjects:subjects!chapters_subject_id_fkey (
                name,
                exams:exams!subjects_exam_id_fkey (title)
              )
            )
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return [];
      return (data as unknown as Array<MistakeRow & { questions: QuestionWithContext }>).map(
        (d) => {
          const q = d.questions || {};
          const ch = q.chapters;
          const sub = ch?.subjects;
          const ex = sub?.exams;
          return {
            id: d.id,
            userId: d.user_id,
            questionId: d.question_id,
            wrongCount: d.wrong_count,
            isResolved: d.is_resolved,
            lastReviewedAt: d.last_reviewed_at ?? undefined,
            createdAt: d.created_at,
            examTitle: ex?.title,
            subjectName: sub?.name,
            chapterName: ch?.name,
            question: {
              id: String(q.id),
              chapterId: q.chapter_id ?? undefined,
              subjectId: q.subject_id ?? undefined,
              questionText: String(q.question_text),
              questionBengaliText: q.question_bengali_text
                ? String(q.question_bengali_text)
                : undefined,
              optionA: String(q.option_a),
              optionB: String(q.option_b),
              optionC: String(q.option_c),
              optionD: String(q.option_d),
              correctOption: (q.correct_option as 'A' | 'B' | 'C' | 'D') || 'A',
              explanation: q.explanation ? String(q.explanation) : undefined,
              explanationBengali: q.explanation_bengali ? String(q.explanation_bengali) : undefined,
              difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
              defaultMarks: Number(q.default_marks || 1),
              defaultNegativeMarks: Number(q.default_negative_marks || 0),
              isActive: Boolean(q.is_active),
              examTitle: ex?.title,
              subjectName: sub?.name,
              chapterName: ch?.name,
            },
          };
        }
      );
    } catch {
      return [];
    }
  },

  async resolveMistake(mistakeId: string, isResolved: boolean = true): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('mistakes')
          .update({
            is_resolved: isResolved,
            last_reviewed_at: new Date().toISOString(),
          })
          .eq('id', mistakeId);
        if (!error) return true;
      } catch (err) {
        console.error('resolveMistake Supabase error:', err);
      }
    }
    const idx = MOCK_MISTAKES.findIndex((m) => m.id === mistakeId);
    if (idx !== -1) {
      MOCK_MISTAKES[idx].isResolved = isResolved;
      MOCK_MISTAKES[idx].lastReviewedAt = new Date().toISOString();
      return true;
    }
    return false;
  },

  async getBookmarks(userId: string): Promise<BookmarkItem[]> {
    if (!isSupabaseConfigured) return [];
    const data = await readCompleteQuery(() =>
      supabase
        .from('bookmarks')
        .select(
          `
          id,
          user_id,
          question_id,
          note,
          created_at,
          questions (
            *,
            chapters:chapters!questions_chapter_id_fkey (
              name,
              subjects:subjects!chapters_subject_id_fkey (
                name,
                exams:exams!subjects_exam_id_fkey (title)
              )
            )
          )
        `,
          { count: 'exact' }
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
    );

    if (!data) throw new Error('Saved questions could not be loaded');
    if (data.length === 0) return [];
    return (data as unknown as Array<BookmarkRow & { questions: QuestionWithContext }>).map((d) => {
      const q = d.questions || {};
      const ch = q.chapters;
      const sub = ch?.subjects;
      const ex = sub?.exams;
      return {
        id: d.id,
        userId: d.user_id,
        questionId: d.question_id,
        note: d.note ?? undefined,
        createdAt: d.created_at,
        examTitle: ex?.title,
        subjectName: sub?.name,
        chapterName: ch?.name,
        question: {
          id: String(q.id),
          chapterId: q.chapter_id ?? undefined,
          subjectId: q.subject_id ?? undefined,
          questionText: String(q.question_text),
          questionBengaliText: q.question_bengali_text
            ? String(q.question_bengali_text)
            : undefined,
          optionA: String(q.option_a),
          optionB: String(q.option_b),
          optionC: String(q.option_c),
          optionD: String(q.option_d),
          correctOption: (q.correct_option as 'A' | 'B' | 'C' | 'D') || 'A',
          explanation: q.explanation ? String(q.explanation) : undefined,
          explanationBengali: q.explanation_bengali ? String(q.explanation_bengali) : undefined,
          difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
          defaultMarks: Number(q.default_marks || 1),
          defaultNegativeMarks: Number(q.default_negative_marks || 0),
          isActive: Boolean(q.is_active),
          examTitle: ex?.title,
          subjectName: sub?.name,
          chapterName: ch?.name,
        },
      };
    });
  },

  async removeBookmarks(userId: string, questionIds: string[]): Promise<boolean> {
    const ids = [...new Set(questionIds)];
    if (!userId) throw new Error('Sign in to update saved questions');
    if (!ids.length) return true;
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .in('question_id', ids);
      if (error) throw new Error(error.message || 'Saved questions could not be removed');
      // Verify the desired state. Removal is idempotent, never a toggle that can re-add a row.
      const { data: remaining, error: verifyError } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .in('question_id', ids)
        .limit(1);
      if (verifyError) throw new Error(verifyError.message || 'Removal could not be verified');
      if (!remaining || remaining.length)
        throw new Error('Removal was not confirmed. Refresh and retry.');
      return true;
    }
    for (let i = MOCK_BOOKMARKS.length - 1; i >= 0; i--) {
      if (MOCK_BOOKMARKS[i].userId === userId && ids.includes(MOCK_BOOKMARKS[i].questionId))
        MOCK_BOOKMARKS.splice(i, 1);
    }
    return true;
  },

  async clearAllBookmarks(userId: string): Promise<boolean> {
    if (!userId) throw new Error('Sign in to update saved questions');
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('bookmarks').delete().eq('user_id', userId);
      if (error) throw new Error(error.message || 'Saved questions could not be cleared');
      const { data: remaining, error: verifyError } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      if (verifyError) throw new Error(verifyError.message || 'Clear could not be verified');
      if (!remaining || remaining.length)
        throw new Error('Clear was not confirmed. Refresh and retry.');
      return true;
    }
    for (let i = MOCK_BOOKMARKS.length - 1; i >= 0; i--) {
      if (MOCK_BOOKMARKS[i].userId === userId) MOCK_BOOKMARKS.splice(i, 1);
    }
    return true;
  },
};

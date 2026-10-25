import { useMemo } from 'react';
import { useAllTests, useAttemptHistory } from './queries';

export interface ChapterProgress {
  completed: number;
  total: number;
  accuracy: number | null;
}

/**
 * Per-chapter progress from the student's real attempts: a chapter test counts as done once
 * it has a completed attempt. The app's chapter rows carry no progress columns, so this is
 * derived instead of read.
 */
export function useChapterProgress() {
  const tests = useAllTests();
  const history = useAttemptHistory();
  const map = useMemo(() => {
    const byChapter = new Map<string, ChapterProgress & { correct: number; answered: number }>();
    const testChapter = new Map<string, string>();
    for (const t of tests.data ?? []) {
      if (!t.chapterId) continue;
      testChapter.set(t.id, t.chapterId);
      const cur = byChapter.get(t.chapterId) ?? { completed: 0, total: 0, accuracy: null, correct: 0, answered: 0 };
      cur.total += 1;
      byChapter.set(t.chapterId, cur);
    }
    const seen = new Set<string>();
    for (const a of history.data ?? []) {
      const ch = testChapter.get(a.testId);
      if (!ch) continue;
      const cur = byChapter.get(ch)!;
      cur.correct += a.correctCount;
      cur.answered += a.correctCount + a.wrongCount;
      if (!seen.has(a.testId)) {
        seen.add(a.testId);
        cur.completed += 1;
      }
    }
    const out = new Map<string, ChapterProgress>();
    for (const [k, v] of byChapter) {
      out.set(k, { completed: v.completed, total: v.total, accuracy: v.answered > 0 ? v.correct / v.answered : null });
    }
    return out;
  }, [tests.data, history.data]);
  return { map, isLoading: tests.isLoading || history.isLoading };
}

export const isChapterDone = (p?: ChapterProgress) => !!p && p.total > 0 && p.completed >= p.total;
/** "Weak": attempted, and under 50% accuracy across the chapter's tests. */
export const isChapterWeak = (p?: ChapterProgress) => !!p && p.accuracy !== null && p.accuracy < 0.5;

import type { SolutionQuestion } from '@/types/models';

// Copies of bookmarked questions, kept in this browser per student. The bookmark itself is
// saved to the server (public.bookmarks); students cannot read question text outside a
// finished attempt, so the content shown on Saved Questions comes from here.

const key = (userId: string) => `pk-saved-questions:${userId}`;

export function readSavedQuestions(userId: string): Record<string, SolutionQuestion> {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as Record<string, SolutionQuestion>) : {};
  } catch {
    return {};
  }
}

export function writeSavedQuestion(userId: string, q: SolutionQuestion): void {
  try {
    const all = readSavedQuestions(userId);
    all[q.id] = q;
    localStorage.setItem(key(userId), JSON.stringify(all));
  } catch {
    /* storage blocked */
  }
}

export function deleteSavedQuestion(userId: string, questionId: string): void {
  try {
    const all = readSavedQuestions(userId);
    delete all[questionId];
    localStorage.setItem(key(userId), JSON.stringify(all));
  } catch {
    /* storage blocked */
  }
}

export function clearSavedQuestionsCache(userId: string): void {
  try {
    localStorage.removeItem(key(userId));
  } catch {
    /* ignore */
  }
}

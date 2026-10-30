import { supabase } from '@/lib/supabase';
import { AppError } from '@/lib/errors';
import { num } from '@/lib/format';
import { normalizeCategory } from '@/services/catalog';
import type {
  Attempt,
  AttemptRankings,
  OptionLetter,
  Question,
  ServerAttempt,
  SolutionQuestion,
} from '@/types/models';
import { OPTION_LETTERS } from '@/types/models';

// Server-graded tests, same RPC contract as AttemptRepository in the Flutter app.
// Questions arrive without answer keys; the server grades and reveals answers afterwards.

type Row = Record<string, unknown>;
type Text = string | null;
type Numeric = number | string | null;

/** A question as returned by get_student_exam_questions / get_attempt_solutions. */
interface QuestionRow extends Row {
  id: string | number;
  imageUrl?: Text;
}

interface StartAttemptRow {
  attempt_id?: string | null;
  start_time?: string | null;
  duration_minutes?: Numeric;
}

interface AttemptTestRow {
  id?: string | null;
  title?: Text;
  exam_id?: Text;
  test_type?: Text;
  total_marks?: Numeric;
  duration_minutes?: Numeric;
  is_live_only?: boolean | null;
}

interface AttemptResultRow {
  score?: Numeric;
  total_marks?: Numeric;
  percentage?: Numeric;
  accuracy?: Numeric;
  rank?: Numeric;
  total_candidates?: Numeric;
  percentile?: Numeric;
  passed?: boolean | null;
}

interface AttemptRow {
  id: string;
  test_id: string;
  score?: Numeric;
  total_marks?: Numeric;
  accuracy?: Numeric;
  correct_count?: Numeric;
  wrong_count?: Numeric;
  skipped_count?: Numeric;
  time_spent_seconds?: Numeric;
  end_time?: Text;
  created_at: string;
  rank?: Numeric;
  percentile?: Numeric;
  tests?: AttemptTestRow | AttemptTestRow[] | null;
  test_results?: AttemptResultRow | AttemptResultRow[] | null;
}

interface InProgressAttemptRow {
  id: string;
  test_id: string;
  start_time: string;
  tests?: AttemptTestRow | AttemptTestRow[] | null;
}

interface RankingScopeRow {
  id?: Text;
  name?: Text;
  rank?: Numeric;
  participants?: Numeric;
}

interface AttemptRankingsRow {
  testSeries?: RankingScopeRow | null;
  district?: RankingScopeRow | null;
  westBengal?: RankingScopeRow | null;
}

function letter(v: unknown): OptionLetter | null {
  const s = (v ?? '').toString().trim().toUpperCase();
  return (OPTION_LETTERS as string[]).includes(s) ? (s as OptionLetter) : null;
}

function toQuestion(r: QuestionRow, i: number): Question {
  const en = (r.questionText ?? '').toString();
  const bn = (r.questionBengaliText ?? '').toString().trim();
  return {
    id: String(r.id),
    order: num(r.questionOrder) ?? i + 1,
    textEnglish: en,
    textBengali: bn && bn !== en.trim() ? bn : null,
    imageUrl: r.imageUrl || null,
    options: {
      A: (r.optionA ?? '').toString(),
      B: (r.optionB ?? '').toString(),
      C: (r.optionC ?? '').toString(),
      D: (r.optionD ?? '').toString(),
    },
    marks: num(r.marks) ?? 1,
    negativeMarks: num(r.negativeMarks) ?? 0,
  };
}

export async function fetchQuestions(testId: string): Promise<Question[]> {
  const { data, error } = await supabase.rpc('get_student_exam_questions', { p_test_id: testId });
  if (error) throw error;
  return ((data as QuestionRow[]) ?? []).map(toQuestion);
}

export async function startAttempt(testId: string): Promise<ServerAttempt> {
  const { data, error } = await supabase.rpc('start_test_attempt', { p_test_id: testId });
  if (error) throw error;
  const r = (data ?? {}) as StartAttemptRow;
  const started = r.start_time ? new Date(r.start_time) : null;
  if (!r.attempt_id || !started || Number.isNaN(started.getTime())) {
    throw new AppError('The test could not be started. Please retry.');
  }
  return {
    id: String(r.attempt_id),
    testId,
    startedAt: started,
    durationMinutes: num(r.duration_minutes) ?? 0,
  };
}

/** AttemptRepository.formatAnswersPayload */
function payload(answers: Record<string, OptionLetter>) {
  return Object.entries(answers).map(([questionId, selectedOption]) => ({
    questionId,
    selectedOption,
  }));
}

/** Autosave; failures are ignored because submit sends every answer again. */
export async function saveAnswers(
  attemptId: string,
  answers: Record<string, OptionLetter>,
  seconds: number
): Promise<void> {
  try {
    await supabase.rpc('save_test_answers', {
      p_attempt_id: attemptId,
      p_answers: payload(answers),
      p_time_spent_seconds: Math.max(0, Math.round(seconds)),
    });
  } catch {
    /* submit resends everything */
  }
}

export async function submitAttempt(
  attemptId: string,
  answers: Record<string, OptionLetter>,
  seconds: number
): Promise<void> {
  const { data, error } = await supabase.rpc('submit_test_attempt', {
    p_attempt_id: attemptId,
    p_answers: payload(answers),
    p_time_spent_seconds: Math.max(0, Math.round(seconds)),
  });
  if (error) throw error;
  const r = (data ?? {}) as Row;
  if (r.success === false || r.total_marks == null) {
    throw new AppError('Your test could not be submitted. Please retry.');
  }
}

const ATTEMPT_COLUMNS =
  'id, test_id, status, score, total_marks, accuracy, correct_count, wrong_count, skipped_count, time_spent_seconds, start_time, end_time, created_at, rank, percentile, tests(title, exam_id, test_type, total_marks, is_live_only), test_results(score, total_marks, percentage, accuracy, rank, total_candidates, percentile, passed)';

function toAttempt(r: AttemptRow): Attempt {
  const t: AttemptTestRow = (Array.isArray(r.tests) ? r.tests[0] : r.tests) ?? {};
  const res: AttemptResultRow = (Array.isArray(r.test_results) ? r.test_results[0] : r.test_results) ?? {};
  const score = num(res.score) ?? num(r.score) ?? 0;
  const total = num(res.total_marks) || num(r.total_marks) || num(t.total_marks) || 0;
  const correct = num(r.correct_count) ?? 0;
  const wrong = num(r.wrong_count) ?? 0;
  return {
    id: String(r.id),
    testId: String(r.test_id),
    testTitle: t.title ?? 'Test',
    examId: t.exam_id ?? null,
    category: normalizeCategory(t.test_type),
    isLive: t.is_live_only === true,
    score,
    totalMarks: total,
    percentage: num(res.percentage) ?? (total > 0 ? (score / total) * 100 : 0),
    accuracy: num(res.accuracy) ?? num(r.accuracy) ?? (correct + wrong > 0 ? (correct / (correct + wrong)) * 100 : 0),
    correctCount: correct,
    wrongCount: wrong,
    skippedCount: num(r.skipped_count) ?? 0,
    timeSpentSeconds: num(r.time_spent_seconds) ?? 0,
    completedAt: new Date(r.end_time ?? r.created_at),
    rank: num(res.rank) ?? num(r.rank),
    totalCandidates: num(res.total_candidates),
    percentile: num(res.percentile) ?? num(r.percentile),
    passed: typeof res.passed === 'boolean' ? res.passed : null,
  };
}

/** The student's finished attempts, newest first (AttemptRepository.history). */
export async function fetchAttemptHistory(userId: string): Promise<Attempt[]> {
  const { data, error } = await supabase
    .from('test_attempts')
    .select(ATTEMPT_COLUMNS)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(toAttempt);
}

export async function fetchAttempt(attemptId: string): Promise<Attempt | null> {
  const { data, error } = await supabase
    .from('test_attempts')
    .select(ATTEMPT_COLUMNS)
    .eq('id', attemptId)
    .eq('status', 'completed')
    .maybeSingle();
  if (error) throw error;
  return data ? toAttempt(data) : null;
}

/** In-progress attempts the student can resume while time remains. */
export async function fetchInProgressAttempts(userId: string): Promise<
  { id: string; testId: string; testTitle: string; startedAt: Date; durationMinutes: number }[]
> {
  const { data, error } = await supabase
    .from('test_attempts')
    .select('id, test_id, start_time, tests(title, duration_minutes)')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('start_time', { ascending: false })
    .limit(10);
  if (error) throw error;
  return ((data ?? []) as InProgressAttemptRow[]).map((r) => {
    const t: AttemptTestRow = (Array.isArray(r.tests) ? r.tests[0] : r.tests) ?? {};
    return {
      id: String(r.id),
      testId: String(r.test_id),
      testTitle: t.title ?? 'Test',
      startedAt: new Date(r.start_time),
      durationMinutes: num(t.duration_minutes) ?? 0,
    };
  });
}

export async function fetchAttemptRankings(attemptId: string): Promise<AttemptRankings | null> {
  const { data, error } = await supabase.rpc('get_attempt_rankings', { p_attempt_id: attemptId });
  if (error) throw error;
  const r = (data ?? {}) as AttemptRankingsRow;
  const ts: RankingScopeRow = r.testSeries ?? {};
  const d: RankingScopeRow = r.district ?? {};
  const wb: RankingScopeRow = r.westBengal ?? {};
  return {
    testSeries: {
      id: ts.id ?? null,
      name: ts.name ?? null,
      rank: num(ts.rank),
      participants: num(ts.participants) ?? 0,
    },
    district: { name: d.name ?? null, rank: num(d.rank), participants: num(d.participants) ?? 0 },
    westBengal: { rank: num(wb.rank), participants: num(wb.participants) ?? 0 },
  };
}

export async function fetchSolutions(attemptId: string): Promise<SolutionQuestion[]> {
  const { data, error } = await supabase.rpc('get_attempt_solutions', { p_attempt_id: attemptId });
  if (error) throw error;
  return ((data as QuestionRow[]) ?? []).map((r, i) => ({
    ...toQuestion(r, i),
    selected: letter(r.selectedOption),
    correct: letter(r.correctOption),
    isCorrect: r.isCorrect === true,
    marksAwarded: num(r.marksAwarded) ?? 0,
    explanation: (r.explanation ?? '').toString().trim() || null,
    explanationBengali: (r.explanationBengali ?? '').toString().trim() || null,
    isBookmarked: r.isBookmarked === true,
  }));
}

// ---------------------------------------------------------------------------
// Local draft of an in-progress attempt, so a page refresh or a closed tab keeps the
// student's picks and Mark for Review flags. The server copy (save_test_answers) is what
// gets graded; this only restores the screen.
// ---------------------------------------------------------------------------

interface Draft {
  answers: Record<string, OptionLetter>;
  marked: string[];
  index: number;
}

const draftKey = (attemptId: string) => `pk-attempt-draft:${attemptId}`;

export function loadDraft(attemptId: string): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(attemptId));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(attemptId: string, draft: Draft): void {
  try {
    localStorage.setItem(draftKey(attemptId), JSON.stringify(draft));
  } catch {
    /* storage full or blocked */
  }
}

export function clearDraft(attemptId: string): void {
  try {
    localStorage.removeItem(draftKey(attemptId));
  } catch {
    /* ignore */
  }
}

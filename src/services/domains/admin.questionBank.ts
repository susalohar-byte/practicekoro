import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { loadAllPages } from '@/utils/loadAllPages';
import type { Question } from '@/types';
import { mapQuestionRow } from './admin.shared';
import { ADMIN_QUESTION_COLUMNS, searchOrFilterValue } from './admin.questions';

/**
 * Admin Question Bank list query, run on the server (one page at a time plus head counts)
 * instead of downloading the whole `questions` table into the browser.
 *
 * Every field mirrors one of the Question Bank filters. Name based filters carry both the raw
 * text (used by the in-browser demo store) and the ids it resolves to (used by Supabase).
 */
export interface QuestionBankQuery {
  /** true: only Live Test (live-only) questions; false: only bank questions. */
  liveOnly: boolean;
  /** Restrict to these question ids (a chosen Live Test paper); an empty list matches nothing. */
  questionIds?: string[];
  /** "By Exam" upload mode / view mode. */
  examMode?: boolean;
  /** "By Subject" upload mode / view mode. */
  subjectMode?: boolean;
  search?: string;
  /** Subjects / topics whose name contains the search text. */
  searchSubjectIds?: string[];
  searchChapterIds?: string[];
  /** Exam filter: source exam contains this text. */
  sourceExam?: string;
  /** Subject filter: subject name contains `subjectName` (resolved to `subjectIds`). */
  subjectName?: string;
  subjectIds?: string[];
  /** Topic filter: topic name contains `topicName` (resolved to `chapterIds`). */
  topicName?: string;
  chapterIds?: string[];
  /** Display type: 'pyq' | 'topic' | 'full mock'. */
  type?: string;
  /** Display status: 'published' | 'draft' | 'under_review' | 'archived'. */
  status?: string;
  sourceYear?: string;
  /** Source filter value: 'official pyq' | 'original' | … */
  source?: string;
}

export interface QuestionBankStats {
  total: number;
  examQuestions: number;
  subjectQuestions: number;
  liveQuestions: number;
  published: number;
  draft: number;
  underReview: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function displayType(q: Pick<Question, 'sourceType'>): string {
  if (q.sourceType === 'pyq') return 'pyq';
  if (q.sourceType === 'topic') return 'topic';
  return 'full mock';
}

function displayStatus(q: Pick<Question, 'status'>): string {
  const s = String(q.status || 'active').toLowerCase();
  return s === 'active' ? 'published' : s;
}

/** Which of the two source labels ('Official PYQ' / 'Original') a source filter value matches. */
function sourceMatches(source: string): { pyq: boolean; original: boolean } {
  const sel = source.toLowerCase();
  return { pyq: 'official pyq'.includes(sel), original: 'original'.includes(sel) };
}

function quotedList(ids: string[]): string {
  return ids.map((id) => `"${String(id).replace(/[\\"]/g, '\\$&')}"`).join(',');
}

function likeValue(text: string): string {
  return `%${text.replace(/[\\%_]/g, '\\$&')}%`;
}

/** True when the query can match no row at all (e.g. a name filter that resolves to nothing). */
export function questionBankQueryIsEmpty(query: QuestionBankQuery): boolean {
  if (query.questionIds && query.questionIds.length === 0) return true;
  if (query.subjectName && (!query.subjectIds || query.subjectIds.length === 0)) return true;
  if (query.topicName && (!query.chapterIds || query.chapterIds.length === 0)) return true;
  if (query.type && !['pyq', 'topic', 'full mock'].includes(query.type.toLowerCase())) return true;
  if (query.sourceYear && !/^\d+$/.test(query.sourceYear)) return true;
  if (query.source) {
    const m = sourceMatches(query.source);
    if (!m.pyq && !m.original) return true;
  }
  return false;
}

/** In-browser version of the query (demo store); the Supabase builder below mirrors it. */
export function matchesQuestionBankQuery(q: Question, query: QuestionBankQuery): boolean {
  if (query.liveOnly) {
    if (!q.isLiveOnly) return false;
    if (query.questionIds && !query.questionIds.includes(q.id)) return false;
  } else if (q.isLiveOnly) {
    return false;
  }

  if (query.examMode && q.uploadMode !== 'exam' && !q.sourceExam) return false;
  if (query.subjectMode && q.uploadMode === 'exam' && q.sourceExam) return false;

  if (query.search && query.search.trim()) {
    const term = query.search.toLowerCase().trim();
    const fields = [
      q.questionBengaliText,
      q.questionText,
      q.optionA,
      q.optionB,
      q.optionC,
      q.optionD,
      q.id,
      q.topicName,
      q.chapterName,
      q.sourceExam,
      q.subjectName,
    ];
    if (!fields.some((f) => f?.toLowerCase().includes(term))) return false;
  }

  if (query.sourceExam) {
    if (!q.sourceExam || !q.sourceExam.toLowerCase().includes(query.sourceExam.toLowerCase()))
      return false;
  }
  if (query.subjectName) {
    if (!q.subjectName || !q.subjectName.toLowerCase().includes(query.subjectName.toLowerCase()))
      return false;
  }
  if (query.topicName) {
    const top = q.topicName || q.chapterName || '';
    if (!top.toLowerCase().includes(query.topicName.toLowerCase())) return false;
  }
  if (query.type && displayType(q) !== query.type.toLowerCase()) return false;
  if (query.status && displayStatus(q) !== query.status.toLowerCase()) return false;
  if (query.sourceYear && String(q.sourceYear) !== query.sourceYear) return false;
  if (query.source) {
    const src = q.sourceType === 'pyq' ? 'official pyq' : 'original';
    if (!src.includes(query.source.toLowerCase())) return false;
  }
  return true;
}

/** Applies the query to a Supabase `questions` select. Callers check `questionBankQueryIsEmpty`. */
function applyQuestionBankQuery(builder: any, query: QuestionBankQuery): any {
  let q = builder.eq('is_live_only', query.liveOnly);
  if (query.liveOnly && query.questionIds) q = q.in('id', query.questionIds);

  // Database rows carry no upload mode, so "By Exam" means "names a source exam" and
  // "By Subject" keeps every bank question (same result the in-browser filter produced).
  if (query.examMode) q = q.not('source_exam', 'is', null).neq('source_exam', '');

  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    const pattern = searchOrFilterValue(term);
    const parts = [
      'question_text',
      'question_bengali_text',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'source_exam',
    ].map((col) => `${col}.ilike.${pattern}`);
    if (query.searchSubjectIds?.length)
      parts.push(`subject_id.in.(${quotedList(query.searchSubjectIds)})`);
    if (query.searchChapterIds?.length)
      parts.push(`chapter_id.in.(${quotedList(query.searchChapterIds)})`);
    if (UUID_RE.test(term)) parts.push(`id.eq.${term}`);
    q = q.or(parts.join(','));
  }

  if (query.sourceExam) q = q.ilike('source_exam', likeValue(query.sourceExam));
  if (query.subjectName && query.subjectIds) q = q.in('subject_id', query.subjectIds);
  if (query.topicName && query.chapterIds) q = q.in('chapter_id', query.chapterIds);

  if (query.type) {
    const type = query.type.toLowerCase();
    if (type === 'pyq') q = q.eq('source_type', 'pyq');
    else if (type === 'topic')
      q = q.or(
        'source_type.eq.topic,and(source_type.is.null,or(source_exam.is.null,source_exam.eq.""))'
      );
    else q = q.or('source_type.not.in.(pyq,topic),and(source_type.is.null,source_exam.neq."")');
  }

  if (query.status) {
    const status = query.status.toLowerCase();
    if (status === 'published') q = q.or('status.is.null,status.eq."",status.eq.active');
    else q = q.eq('status', status);
  }

  if (query.sourceYear) q = q.eq('source_year', Number(query.sourceYear));

  if (query.source) {
    const m = sourceMatches(query.source);
    if (m.pyq && !m.original) q = q.eq('source_type', 'pyq');
    else if (m.original && !m.pyq) q = q.or('source_type.is.null,source_type.neq.pyq');
  }
  return q;
}

/** One page of Question Bank rows plus the exact number of matching rows. */
export async function getQuestionBankPage(
  query: QuestionBankQuery,
  page: number,
  pageSize: number
): Promise<{ questions: Question[]; total: number }> {
  if (!isSupabaseConfigured) {
    throw new Error('getQuestionBankPage requires a configured backend.');
  }
  if (questionBankQueryIsEmpty(query)) return { questions: [], total: 0 };
  const size = Math.min(200, Math.max(1, Math.floor(pageSize) || 10));
  const from = (Math.max(1, Math.floor(page) || 1) - 1) * size;
  let builder = supabase
    .from('questions')
    .select(ADMIN_QUESTION_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  builder = applyQuestionBankQuery(builder, query).range(from, from + size - 1);
  const { data, error, count } = await builder;
  if (error) throw new Error(error.message);
  const rows = (data || []) as any[];
  return { questions: rows.map((r) => mapQuestionRow(r)), total: count ?? rows.length };
}

/** Every matching question id (only the id column), for "Select All N questions". */
export async function getQuestionBankIds(query: QuestionBankQuery): Promise<string[]> {
  if (!isSupabaseConfigured) {
    throw new Error('getQuestionBankIds requires a configured backend.');
  }
  if (questionBankQueryIsEmpty(query)) return [];
  const rows = await loadAllPages<{ id: string }>(async (limit, offset) => {
    let builder = supabase
      .from('questions')
      .select('id')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });
    builder = applyQuestionBankQuery(builder, query).range(offset, offset + limit - 1);
    const { data, error } = await builder;
    if (error) throw new Error(error.message);
    return (data || []) as { id: string }[];
  }, 1000);
  return rows.map((r) => String(r.id));
}

/** Question Bank stat cards, as head-only counts (no rows are transferred). */
export async function getQuestionBankStats(): Promise<QuestionBankStats> {
  if (!isSupabaseConfigured) {
    throw new Error('getQuestionBankStats requires a configured backend.');
  }
  const count = async (apply: (b: any) => any): Promise<number> => {
    const { count: n, error } = await apply(
      supabase.from('questions').select('id', { count: 'exact', head: true })
    );
    if (error) throw new Error(error.message);
    return n ?? 0;
  };
  const [total, liveQuestions, examQuestions, subjectQuestions, published, draft, underReview] =
    await Promise.all([
      count((b) => b),
      count((b) => b.eq('is_live_only', true)),
      count((b) =>
        b.eq('is_live_only', false).not('source_exam', 'is', null).neq('source_exam', '')
      ),
      count((b) =>
        b
          .eq('is_live_only', false)
          .or('source_exam.is.null,source_exam.eq.""')
          .not('subject_id', 'is', null)
      ),
      count((b) => b.or('status.is.null,status.eq."",status.eq.active')),
      count((b) => b.eq('status', 'draft')),
      count((b) => b.in('status', ['under_review', 'review'])),
    ]);
  return { total, examQuestions, subjectQuestions, liveQuestions, published, draft, underReview };
}

/** Stat cards computed in the browser (demo store), same definitions as the head counts. */
export function computeQuestionBankStats(questions: Question[]): QuestionBankStats {
  const bank = questions.filter((q) => !q.isLiveOnly);
  return {
    total: questions.length,
    examQuestions: bank.filter((q) => q.uploadMode === 'exam' || Boolean(q.sourceExam)).length,
    subjectQuestions: bank.filter(
      (q) => q.uploadMode === 'subject' || (!q.sourceExam && Boolean(q.subjectId || q.subjectName))
    ).length,
    liveQuestions: questions.length - bank.length,
    published: questions.filter((q) => displayStatus(q) === 'published').length,
    draft: questions.filter((q) => displayStatus(q) === 'draft').length,
    underReview: questions.filter((q) => {
      const s = displayStatus(q);
      return s === 'under_review' || s === 'review';
    }).length,
  };
}

export const adminQuestionBankApi = {
  getQuestionBankPage,
  getQuestionBankIds,
  getQuestionBankStats,
};

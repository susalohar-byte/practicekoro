import type { Question } from '@/types';
import type { Tables } from '@/types/database.generated';

type NameJoin = { name: string | null } | { name: string | null }[] | null;

/** A `questions` row (timestamps optional), optionally with the `subjects` / `chapters` name joins. */
export type QuestionRow = Omit<Tables<'questions'>, 'created_at' | 'updated_at'> & {
  subjects?: NameJoin;
  chapters?: NameJoin;
};

/** Name from a to-one join; an array-shaped join has no `.name`, as before. */
const joinName = (j: NameJoin | undefined) => (Array.isArray(j) ? undefined : j?.name || undefined);

/** Maps a raw Supabase `questions` row (with subject/chapter join) to the app Question model. */
export function mapQuestionRow(q: QuestionRow): Question {
  return {
    id: q.id,
    tags: Array.isArray(q.tags) ? (q.tags as string[]) : [],
    section: q.section || undefined,
    subtopic: q.subtopic || undefined,
    chapterId: q.chapter_id ?? q.topic_id ?? undefined,
    topicId: q.topic_id ?? q.chapter_id ?? undefined,
    subjectId: q.subject_id ?? undefined,
    questionText: q.question_text,
    questionBengaliText: q.question_bengali_text ?? undefined,
    imageUrl: q.image_url ?? undefined,
    optionA: q.option_a,
    optionB: q.option_b,
    optionC: q.option_c,
    optionD: q.option_d,
    correctOption: (q.correct_option as 'A' | 'B' | 'C' | 'D') || 'A',
    explanation: q.explanation ?? undefined,
    explanationBengali: q.explanation_bengali ?? undefined,
    difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
    defaultMarks: Number(q.default_marks ?? 1),
    // Questions never carry negative marks — scoring uses the test-level scheme.
    defaultNegativeMarks: Number(q.default_negative_marks || 0),
    questionType: q.question_type || 'mcq',
    sourceType: (q.source_type as 'topic' | 'pyq' | 'other') || (q.source_exam ? 'other' : 'topic'),
    sourceYear: q.source_year ? Number(q.source_year) : undefined,
    sourceExam: q.source_exam ?? undefined,
    sourcePaper: q.source_paper ?? undefined,
    sourceShift: q.source_shift ?? undefined,
    isActive: q.is_active,
    isLiveOnly: Boolean(q.is_live_only),
    status: (q.status as 'active' | 'archived' | 'draft') || 'active',
    subjectName: joinName(q.subjects),
    chapterName: joinName(q.chapters),
    topicName: joinName(q.chapters),
  };
}

export function parseSettingValue(raw: unknown): unknown {
  if (raw === null || raw === undefined) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }
    return trimmed.replace(/^"|"$/g, '');
  }
  return raw;
}

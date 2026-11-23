/** The two papers of exams held in stages. Single-paper exams use neither. */
export type ExamStage = 'Prelims' | 'Mains';
export const EXAM_STAGES: ExamStage[] = ['Prelims', 'Mains'];

const PRELIMS_RE = /\bprelim(s|inary|inaries)?\b|প্রিলি/i;
// Mains is also called the Final Written / Final Exam (e.g. WBP Constable).
const MAINS_RE = /\bmains?\b|\bfinal\s+(written|exam)\b|মেইন|মেন্স|ফাইনাল/i;

/**
 * 'Prelims', 'Mains' or null for a test, read from its paper name first, then its title.
 * Same rule the student app and web use for their Prelims / Mains filter.
 */
export function testStage(test: {
  paperName?: string | null;
  title?: string | null;
}): ExamStage | null {
  for (const text of [test.paperName, test.title]) {
    if (!text?.trim()) continue;
    const prelims = PRELIMS_RE.test(text);
    const mains = MAINS_RE.test(text);
    if (prelims && !mains) return 'Prelims';
    if (mains && !prelims) return 'Mains';
  }
  return null;
}

/** The stage word on its own in a paper name, e.g. "Prelims" in "Prelims Shift 1". */
const STAGE_WORD_RE =
  /\b(prelim(s|inary|inaries)?|mains?|final)\b|প্রিলি\S*|মেইন\S*|মেন্স\S*|ফাইনাল\S*/gi;

/**
 * Paper name with its Prelims / Mains word replaced by [stage] (or removed when null),
 * keeping any other detail such as the shift. Empty result → undefined.
 */
export function withStage(paperName: string | null | undefined, stage: ExamStage | null) {
  const rest = (paperName ?? '').replace(STAGE_WORD_RE, ' ').replace(/\s+/g, ' ').trim();
  return [stage, rest].filter(Boolean).join(' ') || undefined;
}

/** Test kinds that can carry a Prelims / Mains paper. */
export const hasExamStage = (testType: string | undefined) =>
  testType === 'full_mock' || testType === 'pyq';

/**
 * The paper_name to save when an existing test's paper is changed to [stage], or undefined when
 * the paper is unchanged ('' clears the paper name).
 */
export function stagePaperUpdate(
  test: { paperName?: string | null; title?: string | null },
  stage: ExamStage | null
): string | undefined {
  if (stage === testStage(test)) return undefined;
  return withStage(test.paperName, stage) ?? '';
}

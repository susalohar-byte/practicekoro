import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  tables: {} as Record<string, { data: unknown; error: unknown }>,
  from: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { from: m.from },
}));
vi.mock('@/lib/dataSync', () => ({ notifyExamsUpdated: vi.fn() }));
vi.mock('./catalog', () => ({ catalogApi: { syncTestExamAssociations: vi.fn() } }));

import { testTypeLinkErrors, validateTestForPublish, validateTestImportCsv } from './admin.tests';

const goodQuestion = {
  question_text: 'Q?',
  option_a: 'a',
  option_b: 'b',
  option_c: 'c',
  option_d: 'd',
  correct_option: 'A',
};

beforeEach(() => {
  vi.clearAllMocks();
  m.from.mockImplementation((table: string) => {
    const result = () => m.tables[table] ?? { data: null, error: null };
    const q: any = {
      select: () => q,
      eq: () => q,
      order: () => q,
      maybeSingle: async () => result(),
      then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
        Promise.resolve(result()).then(resolve, reject),
    };
    return q;
  });
});

function setTest(row: Record<string, unknown>, topicSubject?: string) {
  m.tables.tests = {
    data: { duration_minutes: 30, total_marks: 25, ...row },
    error: null,
  };
  m.tables.chapters = { data: topicSubject ? { subject_id: topicSubject } : null, error: null };
  m.tables.test_questions = {
    data: [{ question_id: 'q1', question_order: 1, questions: goodQuestion }],
    error: null,
  };
}

describe('testTypeLinkErrors (per-type rules)', () => {
  it('requires an exam for a Full Mock', () => {
    expect(testTypeLinkErrors({ testType: 'full_mock' })).toEqual([
      'A Full Mock test must be linked to an exam.',
    ]);
    expect(testTypeLinkErrors({ testType: 'full_mock', examId: 'e1' })).toEqual([]);
  });

  it('requires an exam and a valid year for an Official PYQ', () => {
    expect(testTypeLinkErrors({ testType: 'pyq', examId: 'e1' })).toEqual([
      'An Official PYQ needs an exam and an exam year.',
    ]);
    expect(testTypeLinkErrors({ testType: 'pyq', examId: 'e1', year: 1800 })).toEqual([
      'Exam year 1800 is not valid.',
    ]);
    expect(testTypeLinkErrors({ testType: 'pyq', examId: 'e1', year: 2023 })).toEqual([]);
  });

  it('requires subject + topic for a Topic Test, with the topic under the subject, exam optional', () => {
    expect(testTypeLinkErrors({ testType: 'topic', subjectId: 's1' })).toEqual([
      'A Topic Test needs a subject and a topic.',
    ]);
    expect(
      testTypeLinkErrors({ testType: 'topic', subjectId: 's1', chapterId: 't1' }, 's2')
    ).toEqual(['The selected topic does not belong to the selected subject.']);
    expect(
      testTypeLinkErrors({ testType: 'topic', subjectId: 's1', chapterId: 't1' }, 's1')
    ).toEqual([]);
  });
});

describe('validateTestForPublish', () => {
  it('publishes a Topic Test that has no exam', async () => {
    setTest({ test_type: 'topic', exam_id: null, subject_id: 's1', chapter_id: 't1' }, 's1');
    await expect(validateTestForPublish('t')).resolves.toEqual({ isValid: true, errors: [] });
  });

  it('rejects a Topic Test whose topic belongs to another subject', async () => {
    setTest({ test_type: 'topic', subject_id: 's1', chapter_id: 't1' }, 's9');
    const res = await validateTestForPublish('t');
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('The selected topic does not belong to the selected subject.');
  });

  it('rejects a Full Mock without an exam and a PYQ without a year', async () => {
    setTest({ test_type: 'full_mock', exam_id: null });
    expect((await validateTestForPublish('t')).errors).toContain(
      'A Full Mock test must be linked to an exam.'
    );
    setTest({ test_type: 'pyq', exam_id: 'e1', year: null });
    expect((await validateTestForPublish('t')).errors).toContain(
      'An Official PYQ needs an exam and an exam year.'
    );
  });

  it('accepts a PYQ with exam and year', async () => {
    setTest({ test_type: 'pyq', exam_id: 'e1', year: 2022 });
    await expect(validateTestForPublish('t')).resolves.toEqual({ isValid: true, errors: [] });
  });
});

describe('validateTestImportCsv', () => {
  const refs = {
    exams: [{ id: 'e1', title: 'WBP Constable' }],
    subjects: [
      { id: 's1', name: 'General Science' },
      { id: 's2', name: 'History' },
    ],
    chapters: [
      { id: 't1', name: 'Heat', subjectId: 's1' },
      { id: 't2', name: 'Mughals', subjectId: 's2' },
    ],
  };
  const header = 'title,testType,examName,subjectName,topicName,year,paperName';

  it('resolves valid rows of each type', () => {
    const rows = validateTestImportCsv(
      [
        header,
        'Full 1,full_mock,WBP Constable,,,,',
        'Heat test,topic,,General Science,Heat,,',
        '"PYQ, 2023",pyq,wbp constable,,,2023,',
      ].join('\n'),
      refs
    );
    expect(rows.map((r) => r.errors)).toEqual([[], [], []]);
    expect(rows[0].input).toMatchObject({ testType: 'full_mock', examId: 'e1', status: 'draft' });
    expect(rows[1].input).toMatchObject({
      testType: 'topic',
      examId: undefined,
      subjectId: 's1',
      chapterId: 't1',
    });
    expect(rows[2].input).toMatchObject({ title: 'PYQ, 2023', examId: 'e1', year: 2023 });
  });

  it('reports row-level errors instead of importing undefined links', () => {
    const rows = validateTestImportCsv(
      [
        header,
        'A,subject_mock,,History,,,',
        'B,weird,,,,,',
        'C,full_mock,Unknown Exam,,,,',
        'D,topic,,General Science,Mughals,,',
        'E,topic,,Nope,Heat,,',
        'F,pyq,WBP Constable,,,,',
        'G,topic,,History,,,',
      ].join('\n'),
      refs
    );
    expect(rows.every((r) => r.errors.length > 0 && !r.input)).toBe(true);
    expect(rows[0].errors[0]).toMatch(/legacy test type/);
    expect(rows[1].errors[0]).toMatch(/Unknown testType "weird"/);
    expect(rows[2].errors).toContain('Unknown exam "Unknown Exam".');
    expect(rows[3].errors).toContain(
      'Topic "Mughals" does not belong to subject "General Science".'
    );
    expect(rows[4].errors).toContain('Unknown subject "Nope".');
    expect(rows[5].errors).toContain('An Official PYQ needs an exam and an exam year.');
    expect(rows[6].errors).toContain('A Topic Test needs a subject and a topic.');
    expect(rows.map((r) => r.line)).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });
});

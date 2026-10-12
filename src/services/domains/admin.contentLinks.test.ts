import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabaseRuntime: { rpc: (...a: unknown[]) => rpc(...a), from: vi.fn() },
  isSupabaseConfigured: true,
}));

const { pruneTopicsToSubjects, saveExamCurriculum, saveSeriesTests, seriesTestIncompatibility } =
  await import('./admin.contentLinks');

describe('seriesTestIncompatibility', () => {
  const mock = { title: 'Mock 1', testType: 'full_mock', examId: 'wbp' };

  it('accepts anything in an exam-independent series', () => {
    expect(seriesTestIncompatibility({ examId: '' }, { ...mock, examId: 'ssc' })).toBeNull();
  });

  it('always accepts exam-independent topic tests', () => {
    expect(
      seriesTestIncompatibility({ examId: 'wbp' }, { title: 'Heat 01', testType: 'topic' })
    ).toBeNull();
  });

  it('accepts full mocks linked to the target exam directly or through test_exams', () => {
    expect(seriesTestIncompatibility({ examId: 'wbp' }, mock)).toBeNull();
    expect(
      seriesTestIncompatibility(
        { examId: 'wbp' },
        { ...mock, examId: 'ssc', associatedExamIds: ['ssc', 'wbp'] }
      )
    ).toBeNull();
  });

  it('explains why a PYQ for another exam is rejected', () => {
    expect(
      seriesTestIncompatibility(
        { examId: 'wbp' },
        { title: 'SSC 2023', testType: 'pyq', examId: 'ssc' }
      )
    ).toBe('Official PYQ for a different exam than this series targets');
  });
});

describe('pruneTopicsToSubjects', () => {
  it('keeps only topics whose parent subject is selected', () => {
    const topics = [
      { id: 'pct', subjectId: 'math' },
      { id: 'hist', subjectId: 'gk' },
    ];
    expect(pruneTopicsToSubjects(['pct', 'hist'], ['math'], topics)).toEqual(['pct']);
    expect(pruneTopicsToSubjects(['pct', 'unknown'], ['math'], topics)).toEqual(['pct']);
  });
});

describe('saves require database confirmation', () => {
  beforeEach(() => rpc.mockReset());

  it('saves exam curriculum through the atomic RPC', async () => {
    rpc.mockResolvedValue({
      data: { success: true, subject_count: 2, topic_count: 1 },
      error: null,
    });
    await expect(saveExamCurriculum('wbp', ['math', 'gs'], ['pct'])).resolves.toEqual({
      subjectCount: 2,
      topicCount: 1,
    });
    expect(rpc).toHaveBeenCalledWith('admin_save_exam_curriculum', {
      p_exam_id: 'wbp',
      p_subject_ids: ['math', 'gs'],
      p_topic_ids: ['pct'],
    });
  });

  it('surfaces the database rule message', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Topic "Percentage" belongs to a subject that is not selected' },
    });
    await expect(saveExamCurriculum('wbp', [], ['pct'])).rejects.toThrow(/not selected/);
  });

  it('rejects unconfirmed curriculum saves', async () => {
    rpc.mockResolvedValue({
      data: { success: true, subject_count: 1, topic_count: 0 },
      error: null,
    });
    await expect(saveExamCurriculum('wbp', ['math', 'gs'], [])).rejects.toThrow(/not confirmed/);
  });

  it('blocks duplicate tests before calling the database', async () => {
    await expect(saveSeriesTests('s1', ['t1', 't1'])).rejects.toThrow(/only once/);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('saves the ordered series list', async () => {
    rpc.mockResolvedValue({ data: { success: true, test_count: 2 }, error: null });
    await expect(saveSeriesTests('s1', ['t2', 't1'])).resolves.toBe(2);
    expect(rpc).toHaveBeenCalledWith('admin_set_series_tests', {
      p_series_id: 's1',
      p_test_ids: ['t2', 't1'],
    });
  });
});

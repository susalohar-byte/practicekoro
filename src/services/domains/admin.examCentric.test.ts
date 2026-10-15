import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  configured: true,
  rpc: vi.fn(),
  questionIds: [] as string[],
  saveTestQuestions: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return m.configured;
  },
  supabaseRuntime: { rpc: m.rpc },
}));
vi.mock('./admin.questions', () => ({
  getAllAdminQuestionIds: async () => m.questionIds,
}));
vi.mock('./admin.testQuestions', () => ({
  getTestAssignedQuestions: async () => [],
  saveTestQuestions: m.saveTestQuestions,
}));

import { saveExamSubjectTopicMappings } from './admin.examMappings';
import { createTest, generateTopicTests, TOPIC_TEST_QUESTION_COUNT } from './admin.tests';

beforeEach(() => {
  m.configured = true;
  m.rpc.mockReset();
  m.saveTestQuestions.mockReset();
});

describe('exam subject/topic mappings', () => {
  it('saves subjects and topics through the atomic RPC and requires confirmation', async () => {
    m.rpc.mockResolvedValue({
      data: { success: true, subject_count: 2, topic_count: 1 },
      error: null,
    });
    const result = await saveExamSubjectTopicMappings('wbp', ['s1', 's2', 's1'], ['t1']);
    expect(m.rpc).toHaveBeenCalledWith('admin_save_exam_subject_topics', {
      p_exam_id: 'wbp',
      p_subject_ids: ['s1', 's2'],
      p_topic_ids: ['t1'],
    });
    expect(result.subjectsPersisted).toBe(true);

    m.rpc.mockResolvedValue({
      data: { success: true, subject_count: 1, topic_count: 1 },
      error: null,
    });
    await expect(saveExamSubjectTopicMappings('wbp', ['s1', 's2'], ['t1'])).rejects.toThrow(
      'not confirmed'
    );
  });

  it('falls back to the topic-only RPC before the migration is applied', async () => {
    m.rpc
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST202', message: 'Could not find the function' },
      })
      .mockResolvedValueOnce({ data: { success: true, saved_count: 1 }, error: null });
    const result = await saveExamSubjectTopicMappings('wbp', ['s1'], ['t1']);
    expect(m.rpc).toHaveBeenLastCalledWith('admin_save_exam_topics', {
      p_exam_id: 'wbp',
      p_topic_ids: ['t1'],
    });
    expect(result.subjectsPersisted).toBe(false);
  });
});

describe('test type rules', () => {
  const base = {
    title: 'X',
    slug: 'x',
    durationMinutes: 10,
    totalQuestions: 0,
    totalMarks: 10,
    passingMarks: 0,
    negativeMarking: 0,
    isPremium: false,
    orderIndex: 0,
    isActive: false,
  };

  it('requires an exam for Full Mock and PYQ, but not for Topic Tests', async () => {
    m.configured = false;
    await expect(createTest({ ...base, testType: 'full_mock' })).rejects.toThrow('Exam');
    await expect(createTest({ ...base, testType: 'pyq', year: 2024 })).rejects.toThrow('Exam');
    await expect(createTest({ ...base, testType: 'topic', subjectId: 's1' })).rejects.toThrow(
      'Topic'
    );
    const topic = await createTest({
      ...base,
      slug: 'topic-no-exam',
      testType: 'topic',
      subjectId: 's1',
      chapterId: 'ch-no-exam',
    });
    expect(topic.examId).toBeUndefined();
  });
});

describe('topic test generation', () => {
  const input = {
    subjectId: 'history',
    chapterId: 'ch-generated-indus',
    topicName: 'Indus Valley Civilization',
    durationMinutes: 15,
    passingMarks: 4,
    negativeMarking: 0,
    isPremium: false,
  };

  it('splits unused questions into tests of 10 and leaves the remainder unused', async () => {
    m.configured = false;
    m.questionIds = Array.from({ length: 53 }, (_, i) => `q${53 - i}`); // newest first
    m.saveTestQuestions.mockResolvedValue({ success: true });

    const result = await generateTopicTests(input);

    expect(TOPIC_TEST_QUESTION_COUNT).toBe(10);
    expect(result.created.map((t) => t.title)).toEqual([
      'Indus Valley Civilization Test 01',
      'Indus Valley Civilization Test 02',
      'Indus Valley Civilization Test 03',
      'Indus Valley Civilization Test 04',
      'Indus Valley Civilization Test 05',
    ]);
    expect(result.leftover).toBe(3);
    expect(result.created.every((t) => t.testType === 'topic' && !t.examId)).toBe(true);
    // Question IDs are referenced, oldest first, never duplicated across tests.
    const assigned = m.saveTestQuestions.mock.calls.flatMap(([, qs]) =>
      qs.map((q: { questionId: string }) => q.questionId)
    );
    expect(assigned).toHaveLength(50);
    expect(new Set(assigned).size).toBe(50);
    expect(assigned[0]).toBe('q1');
  });

  it('refuses to generate when fewer than 10 unused questions exist', async () => {
    m.configured = false;
    m.questionIds = ['a', 'b', 'c'];
    await expect(generateTopicTests({ ...input, chapterId: 'ch-small' })).rejects.toThrow(
      'at least 10'
    );
  });
});

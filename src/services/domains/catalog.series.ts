import { readCompleteQuery } from '@/services/domains/admin.reporting';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { MockTest, TestSeries, TestSeriesAnalytics } from '@/types';
import { localTests } from '@/services/domains/localStore';

/** Section of the student catalog API: student test series & series analytics (split from domains/catalog.ts, same behaviour). */
export const catalogSeriesApi = {
  /**
   * Fetch active test series for the student Test Series catalog.
   * Returns test series created in Admin Panel with accurate test counts:
   * fullMockCount, topicTestCount, pyqTestCount, and total testCount.
   */
  async getStudentTestSeries(examId?: string): Promise<TestSeries[]> {
    if (!isSupabaseConfigured) return [];

    const data = await readCompleteQuery(() => {
      let query = supabase
        .from('test_series')
        .select(
          `
          *,
          exams:exam_id (id, title, category, slug),
          tests (id, test_type, is_active, status)
        `,
          { count: 'exact' }
        )
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .order('id', { ascending: true });

      if (examId) query = query.eq('exam_id', examId);

      return query;
    });

    return data.map((item: any) => {
      const rawTests = Array.isArray(item.tests) ? item.tests : [];
      const activeTests = rawTests.filter(
        (t: any) => t.is_active !== false && (t.status === 'published' || !t.status)
      );
      const count = activeTests.length;
      const fullMockCount = activeTests.filter((t: any) => t.test_type === 'full_mock').length;
      const pyqTestCount = activeTests.filter((t: any) => t.test_type === 'pyq').length;
      const topicTestCount = activeTests.filter(
        (t: any) =>
          t.test_type === 'topic' ||
          t.test_type === 'chapter_mock' ||
          t.test_type === 'subject_mock'
      ).length;

      return {
        id: item.id,
        examId: item.exam_id,
        title: item.title,
        slug: item.slug,
        description: item.description ?? undefined,
        iconUrl: item.icon_url || undefined,
        isPremium: Boolean(item.is_premium),
        orderIndex: Number(item.order_index || 0),
        isActive: Boolean(item.is_active),
        isPopular: Boolean(item.is_popular),
        createdAt: item.created_at,
        examTitle: item.exams?.title || undefined,
        examCategory: item.exams?.category || undefined,
        testCount: count,
        testsCount: count,
        fullMockCount,
        topicTestCount,
        pyqTestCount,
      };
    });
  },

  /**
   * Fetch active & published tests assigned to a specific test series for students.
   */
  async getSeriesTestsForStudent(seriesId: string): Promise<MockTest[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('tests')
      .select(
        `
          *,
          exams:exam_id (title),
          subjects:subject_id (name),
          chapters:chapter_id (name),
          test_series:test_series_id (title)
        `
      )
      .eq('test_series_id', seriesId)
      .eq('is_active', true)
      .eq('status', 'published')
      .order('order_index', { ascending: true });

    if (error) throw new Error(error.message || 'Series tests could not be loaded');
    if (!data) throw new Error('Series tests were not confirmed');
    if (data.length === 0) {
      return [];
    }

    return data
      .filter((item: any) => !item.is_live_only)
      .map((item: any) => ({
        id: item.id,
        examId: item.exam_id,
        subjectId: item.subject_id ?? undefined,
        chapterId: item.chapter_id ?? undefined,
        topicId: item.chapter_id ?? undefined,
        testSeriesId: item.test_series_id ?? undefined,
        title: item.title,
        slug: item.slug,
        description: item.description ?? undefined,
        testType: item.test_type,
        year: item.year ? Number(item.year) : undefined,
        paperName: item.paper_name ?? undefined,
        shift: item.shift ?? undefined,
        setName: item.set_name ?? undefined,
        examDate: item.exam_date ?? undefined,
        durationMinutes: Number(item.duration_minutes || 60),
        totalQuestions: Number(item.total_questions || 0),
        totalMarks: Number(item.total_marks || 0),
        passingMarks: Number(item.passing_marks || 0),
        negativeMarking: Number(item.negative_marking || 0),
        isPremium: Boolean(item.is_premium),
        orderIndex: Number(item.order_index || 0),
        isActive: Boolean(item.is_active),
        status: (item.status as 'draft' | 'published' | 'archived') || 'published',
        examTitle: item.exams?.title,
        subjectName: item.subjects?.name,
        chapterName: item.chapters?.name,
        topicName: item.chapters?.name,
        testSeriesTitle: item.test_series?.title,
      }));
  },

  /**
   * Fetches one database-aggregated, caller-scoped report for a test series.
   * The RPC returns latest-per-test metrics plus every completed attempt for
   * the trend and history, without issuing one query per test or answer.
   */
  async getTestSeriesAnalytics(seriesId: string): Promise<TestSeriesAnalytics> {
    const emptyReport = (totalTests: number): TestSeriesAnalytics => ({
      totalTests,
      testsAttempted: 0,
      overallScorePercent: 0,
      averageScorePercent: 0,
      accuracyPercent: 0,
      bestScorePercent: 0,
      completionPercent: 0,
      testTypeBreakdown: [],
      trend: [],
      subjects: [],
      weakTopics: [],
      history: [],
    });

    if (!isSupabaseConfigured) {
      const totalTests = localTests.filter(
        (test) => test.testSeriesId === seriesId && test.isActive && test.status === 'published'
      ).length;
      return emptyReport(totalTests);
    }

    const { data, error } = await supabase.rpc('get_test_series_analytics', {
      p_series_id: seriesId,
    });
    if (error) throw new Error(error.message || 'Failed to load series analytics');
    if (!data || typeof data !== 'object' || Array.isArray(data))
      throw new Error('Series results were not confirmed by the server');
    return data as unknown as TestSeriesAnalytics;
  },
};

import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Exam, Subject, Chapter } from '@/types';
import type { ChapterRow, SubjectRow } from '@/services/domains/localStore';

/** Section of the student catalog API: daily content, leaderboard, live updates, exams, subjects & chapters (split from domains/catalog.ts, same behaviour). */
export const catalogContentApi = {
  async getDailyContent(): Promise<Record<string, unknown>> {
    if (!isSupabaseConfigured) return {};
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', 'daily_content')
      .maybeSingle();
    if (error) throw new Error(error.message || 'Failed to load daily student content');
    if (!data?.value) return {};
    const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  },

  async getAppLeaderboard(
    scope: 'all_india' | 'west_bengal' | 'district' = 'west_bengal',
    district?: string,
    examName?: string,
    from?: string
  ) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.rpc('get_app_leaderboard', {
      p_scope: scope,
      p_district: district ?? null,
      p_exam_name: examName ?? null,
      p_from: from ?? null,
    });
    if (error) throw new Error(error.message || 'Failed to load leaderboard');
    return (data || []) as Array<{
      rank: number;
      display_name: string;
      average_percentage: number;
      district: string | null;
      tests_count: number;
    }>;
  },

  subscribeToStudentCatalogUpdates(callback: () => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel('student-catalog-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'test_series' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tests' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chapters' }, callback)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },

  async getExams(): Promise<Exam[]> {
    if (!isSupabaseConfigured) return [];
    const [examsRes, testsRes, testExamsRes] = await Promise.all([
      supabase
        .from('exams')
        .select('id, title, slug, description, category, icon_name, banner_url, order_index, is_active')
        .eq('is_active', true)
        .order('order_index', { ascending: true }),
      supabase
        .from('tests')
        .select('id, exam_id, total_questions')
        .eq('is_active', true)
        .eq('status', 'published'),
      supabase.from('test_exams').select('test_id, exam_id'),
    ]);

    const data = examsRes.data;
    const error = examsRes.error || testsRes.error || testExamsRes.error;
    if (error) throw new Error(error.message || 'Exams could not be loaded');
    if (!data) throw new Error('Exam records were not confirmed');
    if (data.length === 0) return [];

    const statsMap: Record<string, { testsCount: number; questionsCount: number }> = {};
    data.forEach((e: { id: string }) => {
      statsMap[e.id] = { testsCount: 0, questionsCount: 0 };
    });

    if (testsRes.data) {
      testsRes.data.forEach(
        (t: { id: string; exam_id?: string | null; total_questions?: number | null }) => {
          const targetExamIds = new Set<string>();
          if (t.exam_id && statsMap[t.exam_id]) targetExamIds.add(t.exam_id);
          if (testExamsRes.data) {
            testExamsRes.data
              .filter((te: { test_id: string; exam_id: string }) => te.test_id === t.id)
              .forEach((te: { test_id: string; exam_id: string }) => {
                if (statsMap[te.exam_id]) targetExamIds.add(te.exam_id);
              });
          }
          targetExamIds.forEach((examId) => {
            statsMap[examId].testsCount += 1;
            statsMap[examId].questionsCount += t.total_questions || 0;
          });
        }
      );
    }

    return (data as any[]).map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description ?? undefined,
      category: item.category,
      iconName: item.icon_name,
      bannerUrl: item.banner_url ?? undefined,
      orderIndex: item.order_index,
      isActive: item.is_active,
      testsCount: statsMap[item.id]?.testsCount ?? 0,
      questionsCount: statsMap[item.id]?.questionsCount ?? 0,
    }));
  },

  async getExamBySlug(slug: string): Promise<Exam | null> {
    if (!isSupabaseConfigured) return null;
    const { data: item, error } = await supabase
      .from('exams')
      .select('id, title, slug, description, category, icon_name, banner_url, order_index, is_active')
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .eq('is_active', true)
      .maybeSingle();
    if (error || !item) return null;

    const [testsCountRes, questionsRes] = await Promise.all([
      supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', item.id)
        .eq('is_active', true)
        .eq('status', 'published'),
      supabase
        .from('tests')
        .select('total_questions')
        .eq('exam_id', item.id)
        .eq('is_active', true)
        .eq('status', 'published'),
    ]);

    const totalQ = (questionsRes.data || []).reduce(
      (acc: number, t: { total_questions?: number | null }) => acc + (t.total_questions || 0),
      0
    );

    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description ?? undefined,
      category: item.category,
      iconName: item.icon_name,
      bannerUrl: item.banner_url ?? undefined,
      orderIndex: item.order_index,
      isActive: item.is_active,
      testsCount: testsCountRes.count ?? 0,
      questionsCount: totalQ,
    };
  },

  async getSubjects(examId?: string): Promise<Subject[]> {
    if (!isSupabaseConfigured) return [];
    try {
      let query = supabase
        .from('subjects')
        .select('id, exam_id, name, slug, description, icon_name, order_index, is_active')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      // Include universal subjects (exam_id IS NULL) alongside exam-specific ones
      if (examId) {
        query = query.or(`exam_id.eq.${examId},exam_id.is.null`);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) return [];
      return (data as SubjectRow[]).map((item) => ({
        id: item.id,
        examId: item.exam_id ?? undefined,
        name: item.name,
        slug: item.slug,
        description: item.description ?? undefined,
        iconName: item.icon_name,
        orderIndex: item.order_index,
        isActive: item.is_active,
      }));
    } catch {
      return [];
    }
  },

  async getChapters(subjectId: string): Promise<Chapter[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, subject_id, name, slug, description, icon_name, order_index, is_active')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error || !data || data.length === 0) return [];
      return (data as ChapterRow[]).map((item) => ({
        id: item.id,
        subjectId: item.subject_id,
        name: item.name,
        slug: item.slug,
        description: item.description ?? undefined,
        iconName: (item as any).icon_name || (item as any).iconName || undefined,
        orderIndex: item.order_index,
        isActive: item.is_active,
      }));
    } catch {
      return [];
    }
  },

  async getAllChapters(): Promise<Chapter[]> {
    if (!isSupabaseConfigured) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, subject_id, name, slug, description, icon_name, parent_id, order_index, is_active')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error || !data || data.length === 0) return [];
      return (data as ChapterRow[]).map((item) => ({
        id: item.id,
        subjectId: item.subject_id,
        name: item.name,
        slug: item.slug,
        description: item.description ?? undefined,
        iconName: (item as any).icon_name || (item as any).iconName || undefined,
        parentId: item.parent_id ?? undefined,
        orderIndex: item.order_index,
        isActive: item.is_active,
      }));
    } catch {
      return [];
    }
  },

  async getExamTopicMappings(examId: string): Promise<string[]> {
    if (!isSupabaseConfigured) return [];
    // Errors propagate: an empty list would read as "no topics mapped" and a
    // subsequent admin save would wipe the real mappings.
    const { data, error } = await supabase
      .from('exam_topics')
      .select('topic_id')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });
    if (error) throw new Error(error.message || 'Exam topic mappings could not be loaded.');
    return (data || []).map((r: { topic_id: string }) => r.topic_id);
  },

  async getExamSubjectsWithTopics(examId: string): Promise<
    {
      subject: Subject;
      topics: Chapter[];
    }[]
  > {
    try {
      const [fetchedSubjects, allChapters, mappedTopicIds] = await Promise.all([
        this.getSubjects(examId),
        this.getAllChapters(),
        this.getExamTopicMappings(examId),
      ]);
      let allSubjects = fetchedSubjects;

      // If no exam-specific subjects were found, fallback to universal active subjects
      if (!allSubjects || allSubjects.length === 0) {
        allSubjects = await this.getSubjects();
      }

      const mappedSet = new Set(mappedTopicIds);
      const hasMappings = mappedTopicIds.length > 0;

      const result: { subject: Subject; topics: Chapter[] }[] = [];
      for (const subject of allSubjects) {
        const subChapters = allChapters.filter(
          (c) => c.subjectId === subject.id && (!hasMappings || mappedSet.has(c.id))
        );
        if (subChapters.length > 0) {
          result.push({ subject, topics: subChapters });
        }
      }
      return result;
    } catch (err) {
      console.error('Error in getExamSubjectsWithTopics:', err);
      return [];
    }
  },
};

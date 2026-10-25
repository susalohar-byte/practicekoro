import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { MockTest, Question, StudentTestQuestion } from '@/types';

/** Section of the student catalog API: test listing, exam associations & test questions (split from domains/catalog.ts, same behaviour). */
export const catalogTestsApi = {
  async getTests(chapterId?: string, examId?: string): Promise<MockTest[]> {
    if (!isSupabaseConfigured) {
      return [];
    }
    try {
      let assocTestIds: string[] = [];
      if (examId) {
        try {
          const { data: assocData } = await supabase
            .from('test_exams')
            .select('test_id')
            .eq('exam_id', examId);
          if (assocData && assocData.length > 0) {
            assocTestIds = assocData.map((a) => a.test_id);
          }
        } catch (e) {
          console.warn('Could not query test_exams table, fallback to exam_id', e);
        }
      }

      let query = supabase
        .from('tests')
        .select(
          '*, exams:exam_id(title), subjects:subject_id(name), chapters:chapter_id(name), test_series:test_series_id(title)'
        )
        .eq('is_active', true)
        .eq('status', 'published');
      if (chapterId) query = query.eq('chapter_id', chapterId);
      if (examId) {
        if (assocTestIds.length > 0) {
          query = query.or(`id.in.(${assocTestIds.join(',')}),exam_id.eq.${examId}`);
        } else {
          query = query.eq('exam_id', examId);
        }
      }
      const { data, error } = await query.order('order_index', { ascending: true });

      if (error || !data || data.length === 0) {
        return [];
      }
      // Live Test papers are opened from the Live Test, never from the practice list.
      return data
        .filter((item) => !item.is_live_only)
        .map((item) => ({
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
          durationMinutes: item.duration_minutes,
          totalQuestions: item.total_questions,
          totalMarks: Number(item.total_marks),
          passingMarks: Number(item.passing_marks),
          negativeMarking: Number(item.negative_marking),
          isPremium: item.is_premium,
          orderIndex: item.order_index,
          isActive: item.is_active,
          status: (item.status as 'draft' | 'published' | 'archived') || 'published',
          examTitle: item.exams?.title,
          subjectName: item.subjects?.name,
          chapterName: item.chapters?.name,
          topicName: item.chapters?.name,
          testSeriesTitle: item.test_series?.title,
        }));
    } catch {
      return [];
    }
  },

  async getTestsForExam(
    examId: string,
    category?: 'full_mock' | 'pyq' | 'topic'
  ): Promise<MockTest[]> {
    if (category === 'topic') {
      if (!isSupabaseConfigured) return [];

      try {
        let assocTestIds: string[] = [];
        try {
          const { data: assocData } = await supabase
            .from('test_exams')
            .select('test_id')
            .eq('exam_id', examId);
          if (assocData && assocData.length > 0) {
            assocTestIds = assocData.map((a) => a.test_id);
          }
        } catch (e) {
          console.warn('Could not query test_exams table', e);
        }

        let query = supabase
          .from('tests')
          .select(
            '*, exams:exam_id(title), subjects:subject_id(name), chapters:chapter_id(name), test_series:test_series_id(title)'
          )
          .eq('is_active', true)
          .eq('status', 'published')
          .in('test_type', ['topic', 'chapter_mock', 'subject_mock']);

        if (assocTestIds.length > 0) {
          query = query.or(
            `id.in.(${assocTestIds.join(',')}),exam_id.eq.${examId},exam_id.is.null`
          );
        } else {
          query = query.or(`exam_id.eq.${examId},exam_id.is.null`);
        }

        const { data, error } = await query.order('order_index', { ascending: true });
        if (error || !data || data.length === 0) {
          return [];
        }

        return data.map((item) => ({
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
          durationMinutes: item.duration_minutes,
          totalQuestions: item.total_questions,
          totalMarks: Number(item.total_marks),
          passingMarks: Number(item.passing_marks),
          negativeMarking: Number(item.negative_marking),
          isPremium: item.is_premium,
          orderIndex: item.order_index,
          isActive: item.is_active,
          status: (item.status as 'draft' | 'published' | 'archived') || 'published',
          examTitle: item.exams?.title,
          subjectName: item.subjects?.name,
          chapterName: item.chapters?.name,
          topicName: item.chapters?.name,
          testSeriesTitle: item.test_series?.title,
        }));
      } catch {
        return [];
      }
    }

    const allTests = await this.getTests(undefined, examId);
    if (!category) return allTests;

    if (category === 'full_mock') {
      return allTests.filter((t) => t.testType === 'full_mock');
    }
    if (category === 'pyq') {
      return allTests.filter((t) => t.testType === 'pyq');
    }
    return allTests;
  },

  async getTestExamAssociations(testId: string): Promise<string[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('test_exams')
        .select('exam_id')
        .eq('test_id', testId);
      if (error || !data) return [];
      return data.map((d) => d.exam_id);
    } catch {
      return [];
    }
  },

  async associateTestWithExam(testId: string, examId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const { error } = await supabase
        .from('test_exams')
        .upsert({ test_id: testId, exam_id: examId }, { onConflict: 'test_id,exam_id' });
      return !error;
    } catch {
      return false;
    }
  },

  async dissociateTestFromExam(testId: string, examId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const { error } = await supabase
        .from('test_exams')
        .delete()
        .eq('test_id', testId)
        .eq('exam_id', examId);
      return !error;
    } catch {
      return false;
    }
  },

  async syncTestExamAssociations(testId: string, examIds: string[]): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    const { data, error } = await supabase.rpc('admin_save_test_exams', {
      p_test_id: testId,
      p_exam_ids: examIds,
    });
    if (error) throw new Error(error.message);
    if (data?.success !== true || data.saved_count !== examIds.length)
      throw new Error('Exam association save was not confirmed');
    return true;
  },

  async getTestById(testId: string): Promise<MockTest | null> {
    if (!isSupabaseConfigured) return null;

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
      .eq('id', testId)
      .eq('is_active', true)
      .eq('status', 'published')
      .maybeSingle();
    if (error) throw new Error(error.message || 'Test details could not be loaded');
    if (!data) return null;
    const row = data as any;
    return {
      id: row.id,
      examId: row.exam_id ?? undefined,
      subjectId: row.subject_id ?? undefined,
      chapterId: row.chapter_id ?? undefined,
      testSeriesId: row.test_series_id ?? undefined,
      title: row.title,
      slug: row.slug,
      description: row.description ?? undefined,
      testType: row.test_type,
      year: 'year' in row && row.year ? Number(row.year) : undefined,
      paperName: row.paper_name ?? undefined,
      shift: row.shift ?? undefined,
      setName: row.set_name ?? undefined,
      examDate: row.exam_date ?? undefined,
      durationMinutes: row.duration_minutes,
      totalQuestions: row.total_questions,
      totalMarks: Number(row.total_marks),
      passingMarks: Number(row.passing_marks),
      negativeMarking: Number(row.negative_marking),
      isPremium: row.is_premium,
      orderIndex: row.order_index,
      isActive: row.is_active,
      status: row.status || 'published',
      examTitle: row.exams?.title || undefined,
      subjectName: row.subjects?.name || undefined,
      chapterName: row.chapters?.name || undefined,
      topicName: row.chapters?.name || undefined,
      testSeriesTitle: row.test_series?.title || undefined,
    };
  },

  async getStudentTestQuestions(testId: string): Promise<StudentTestQuestion[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('get_student_exam_questions', {
        p_test_id: testId,
      });
      if (error) {
        throw new Error(error.message || 'Failed to fetch exam questions');
      }
      if (Array.isArray(data)) {
        return data as StudentTestQuestion[];
      }
      return [];
    }

    return [];
  },

  async getTestQuestions(testId: string): Promise<Question[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select(
          `
          question_order,
          marks,
          negative_marks,
          questions (
            id,
            chapter_id,
            subject_id,
            image_url,
            question_text,
            question_bengali_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            explanation,
            explanation_bengali,
            difficulty,
            default_marks,
            default_negative_marks,
            is_active
          )
        `
        )
        .eq('test_id', testId)
        .order('question_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return [];
      }

      return (
        data as unknown as Array<{
          question_order: number;
          marks: number;
          negative_marks: number;
          questions: Record<string, unknown>;
        }>
      ).map((item) => {
        const q = item.questions;
        return {
          id: String(q.id),
          chapterId: q.chapter_id ? String(q.chapter_id) : undefined,
          subjectId: q.subject_id ? String(q.subject_id) : undefined,
          questionText: String(q.question_text),
          questionBengaliText: q.question_bengali_text
            ? String(q.question_bengali_text)
            : undefined,
          imageUrl: q.image_url ? String(q.image_url) : undefined,
          optionA: String(q.option_a),
          optionB: String(q.option_b),
          optionC: String(q.option_c),
          optionD: String(q.option_d),
          correctOption: (q.correct_option as 'A' | 'B' | 'C' | 'D') || 'A',
          explanation: q.explanation ? String(q.explanation) : undefined,
          explanationBengali: q.explanation_bengali ? String(q.explanation_bengali) : undefined,
          difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
          defaultMarks: Number(item.marks || q.default_marks || 1),
          defaultNegativeMarks: Number(item.negative_marks || q.default_negative_marks || 0),
          isActive: Boolean(q.is_active),
        };
      });
    } catch {
      return [];
    }
  },
};

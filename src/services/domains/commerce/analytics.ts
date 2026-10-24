import { getAuthoritativeAnalytics } from '@/services/domains/admin.analytics';
import {
  getDashboardOverview,
  getAuthoritativeRevenueRange,
} from '@/services/domains/admin.reporting';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  AdminDashboardStats,
  AdminDashboardV2Stats,
  DateRangePreset,
  DateRangeRevenueStats,
  DateRangeDailyPoint,
  StudentRankRow,
  QuestionInsightRow,
  TopicInsightRow,
  SubjectInsightRow,
  PerformanceTrendPoint,
  PlatformAnalyticsData,
} from '@/types';
import {
  localExams,
  localSubjects,
  localChapters,
  localTestSeries,
  localTests,
  localQuestions,
  localPayments,
  localStudents,
} from '@/services/domains/localStore';

import type {
  AnalyticsAnswerRow,
  AnalyticsAttemptRow,
  AnalyticsQuestionInfo,
  AnalyticsStudent,
} from '@/services/domains/commerce/rows';

/** Dashboard statistics, revenue ranges and platform analytics. */

export const analyticsApi = {
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const studentCount = 0;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('get_admin_dashboard_counts');
        if (!error && data) {
          return {
            totalExams: Number(data.total_exams || 0),
            activeExams: Number(data.total_exams || 0),
            totalSubjects: Number(data.total_subjects || 0),
            totalChapters: Number(data.total_chapters || 0),
            totalTestSeries: Number(data.total_test_series || 0),
            totalTests: Number(data.total_tests || 0),
            publishedTests: Number(data.published_tests || 0),
            draftTests: Number(data.draft_tests || 0),
            archivedTests: Number(data.archived_tests || 0),
            totalQuestions: Number(data.total_questions || 0),
            activeQuestions: Number(data.total_questions || 0),
            totalAttempts: Number(data.total_attempts || 0),
            completedAttempts: Number(data.completed_attempts || 0),
            totalStudents: Number(data.total_students || 0),
          };
        }
      } catch (err) {
        console.warn('Fallback to local stats calculation', err);
      }

      try {
        const [
          examsRes,
          subjectsRes,
          chaptersRes,
          testSeriesRes,
          testsRes,
          questionsRes,
          attemptsRes,
          profilesRes,
        ] = await Promise.all([
          supabase.from('exams').select('*', { count: 'exact', head: true }),
          supabase.from('subjects').select('*', { count: 'exact', head: true }),
          supabase.from('chapters').select('*', { count: 'exact', head: true }),
          supabase.from('test_series').select('*', { count: 'exact', head: true }),
          supabase.from('tests').select('status'),
          supabase.from('questions').select('is_active, status'),
          supabase.from('test_attempts').select('status'),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student'),
        ]);

        const tests = (Array.isArray(testsRes.data) ? testsRes.data : []) as {
          status: string | null;
        }[];
        const questions = (Array.isArray(questionsRes.data) ? questionsRes.data : []) as {
          is_active: boolean | null;
          status: string | null;
        }[];
        const attempts = (Array.isArray(attemptsRes.data) ? attemptsRes.data : []) as {
          status: string | null;
        }[];

        return {
          totalExams: examsRes.count ?? 0,
          activeExams: examsRes.count ?? 0,
          totalSubjects: subjectsRes.count ?? 0,
          totalChapters: chaptersRes.count ?? 0,
          totalTestSeries: testSeriesRes.count ?? 0,
          totalTests: tests.length,
          publishedTests: tests.filter((t) => t.status === 'published').length,
          draftTests: tests.filter((t) => t.status === 'draft').length,
          archivedTests: tests.filter((t) => t.status === 'archived').length,
          totalQuestions: questions.length,
          activeQuestions: questions.filter((q) => q.is_active && q.status !== 'archived').length,
          totalAttempts: attempts.length,
          completedAttempts: attempts.filter((a) => a.status === 'completed').length,
          totalStudents: profilesRes.count ?? 0,
        };
      } catch (err) {
        console.warn('Fallback direct stats calculation failed:', err);
        return {
          totalExams: 0,
          activeExams: 0,
          totalSubjects: 0,
          totalChapters: 0,
          totalTestSeries: 0,
          totalTests: 0,
          publishedTests: 0,
          draftTests: 0,
          archivedTests: 0,
          totalQuestions: 0,
          activeQuestions: 0,
          totalAttempts: 0,
          completedAttempts: 0,
          totalStudents: 0,
        };
      }
    }

    return {
      totalExams: localExams.length,
      activeExams: localExams.filter((e) => e.isActive).length,
      totalSubjects: localSubjects.length,
      totalChapters: localChapters.length,
      totalTestSeries: localTestSeries.length,
      totalTests: localTests.length,
      publishedTests: localTests.filter((t) => t.status === 'published').length,
      draftTests: localTests.filter((t) => t.status === 'draft').length,
      archivedTests: localTests.filter((t) => t.status === 'archived').length,
      totalQuestions: localQuestions.length,
      activeQuestions: localQuestions.filter((q) => q.isActive && q.status !== 'archived').length,
      totalAttempts: 0,
      completedAttempts: 0,
      totalStudents: studentCount,
    };
  },

  async getAdminDashboardV2Stats(): Promise<AdminDashboardV2Stats> {
    if (isSupabaseConfigured) return getDashboardOverview();

    return {
      totalRevenue: 0,
      todayRevenue: 0,
      monthRevenue: 0,
      yearRevenue: 0,
      revenueTrend: [],
      totalStudents: 0,
      newStudents: 0,
      activeStudents: 0,
      freeStudents: 0,
      proStudents: 0,
      activeSubscriptions: 0,
      totalExams: localExams.length,
      totalTests: localTests.length,
      topicTests: localTests.filter((t) => t.testType === 'chapter_mock' || t.testType === 'topic')
        .length,
      fullMockTests: localTests.filter((t) => t.testType === 'full_mock').length,
      pyqTests: localTests.filter((t) => t.testType === 'pyq').length,
      totalQuestions: localQuestions.length,
      topicQuestions: localQuestions.filter((q) => q.chapterId).length,
      fullMockQuestions: localQuestions.filter((q) => !q.chapterId && q.id.includes('fm')).length,
      pyqQuestions: localQuestions.filter((q) => !q.chapterId && q.id.includes('pyq')).length,
      recentActivity: [],
    };
  },

  /**
   * Retrieves dynamically filtered revenue analytics, transactions, order value, student signups,
   * and day-by-day trends for any preset or custom date range (e.g. 1st Jan to 15th Jan).
   */
  async getDateRangeRevenueStats(
    startDateStr?: string,
    endDateStr?: string,
    preset: DateRangePreset = 'this_month'
  ): Promise<DateRangeRevenueStats> {
    if (isSupabaseConfigured) return getAuthoritativeRevenueRange(startDateStr, endDateStr, preset);
    const now = new Date();

    // Determine effective start and end dates
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const formatLocalDate = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (preset === 'yesterday') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (preset === '7d' || (preset as string) === 'last_7_days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    } else if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (preset === '30d' || (preset as string) === 'last_30_days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    } else if (preset === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else if (preset === 'custom' && startDateStr) {
      const [sy, sm, sd] = startDateStr.split('-').map(Number);
      start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      if (endDateStr) {
        const [ey, em, ed] = endDateStr.split('-').map(Number);
        end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      }
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const startTime = start.getTime();
    const endTime = end.getTime();

    let payments: { amount: number; created_at: string; status: string }[] = [];
    let studentSignupsCount = 0;
    const studentSignupsByDate: Record<string, number> = {};

    // Local Fallback ONLY if Supabase not configured
    if (!isSupabaseConfigured && payments.length === 0) {
      payments = localPayments
        .filter((p) => {
          if (!p.createdAt) return false;
          const t = new Date(p.createdAt).getTime();
          return t >= startTime && t <= endTime && p.status === 'completed';
        })
        .map((p) => ({
          amount: p.amount,
          created_at: p.createdAt,
          status: p.status,
        }));

      const filteredStudents = localStudents.filter((s) => {
        if (!s.createdAt) return false;
        const t = new Date(s.createdAt).getTime();
        return t >= startTime && t <= endTime;
      });

      studentSignupsCount = filteredStudents.length;
      filteredStudents.forEach((s) => {
        const d = formatLocalDate(new Date(s.createdAt));
        studentSignupsByDate[d] = (studentSignupsByDate[d] || 0) + 1;
      });
    }

    // Calculate aggregated metrics
    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalTransactions = payments.length;
    const avgOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    // Build Daily Trend
    const dailyMap = new Map<string, { amount: number; transactions: number; signups: number }>();
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0);
    const endMid = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12, 0, 0);

    while (cur <= endMid) {
      const key = formatLocalDate(cur);
      if (!dailyMap.has(key)) {
        dailyMap.set(key, {
          amount: 0,
          transactions: 0,
          signups: studentSignupsByDate[key] || 0,
        });
      }
      cur.setDate(cur.getDate() + 1);
    }

    payments.forEach((p) => {
      if (p.created_at) {
        const key = formatLocalDate(new Date(p.created_at));
        if (dailyMap.has(key)) {
          const entry = dailyMap.get(key)!;
          entry.amount += Number(p.amount || 0);
          entry.transactions += 1;
        }
      }
    });

    const dailyTrend: DateRangeDailyPoint[] = Array.from(dailyMap.entries()).map(
      ([dateStr, val]) => {
        const d = new Date(dateStr + 'T12:00:00');
        const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return {
          date: dateStr,
          label,
          amount: val.amount,
          transactions: val.transactions,
          signups: val.signups,
        };
      }
    );

    const presetLabels: Record<string, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      '7d': 'Last 7 Days',
      last_7_days: 'Last 7 Days',
      this_month: 'This Month',
      '30d': 'Last 30 Days',
      last_30_days: 'Last 30 Days',
      this_year: 'This Year',
      custom: `${formatLocalDate(start)} to ${formatLocalDate(end)}`,
    };

    return {
      startDate: formatLocalDate(start),
      endDate: formatLocalDate(end),
      preset,
      label: presetLabels[preset] || 'Selected Range',
      totalRevenue,
      totalTransactions,
      transactionCount: totalTransactions,
      avgOrderValue,
      averageOrderValue: avgOrderValue,
      newStudentSignups: studentSignupsCount,
      newSignupsCount: studentSignupsCount,
      dailyTrend,
    };
  },

  /**
   * Retrieves comprehensive Platform Analytics & Reports:
   * 1. Student Performance (Total, Active, Tests Attempted, Questions Answered, Overall Accuracy, Trend)
   * 2. Complete Student Rankings (Rank, Name, Email, Tests, Questions, Accuracy, Score)
   * 3. Question & Topic Insights (Most Wrong Questions, Weakest Topics, Weakest Subjects)
   * 4. Revenue (Total, Monthly, Paid Students, Active Subscriptions, Revenue Trend)
   */
  async getPlatformAnalyticsOverview(
    preset: DateRangePreset = 'this_month',
    startDateStr?: string,
    endDateStr?: string
  ): Promise<PlatformAnalyticsData> {
    if (isSupabaseConfigured) return getAuthoritativeAnalytics(preset, startDateStr, endDateStr);
    // 1. Revenue & Trend calculations
    const revenueRangeStats = await this.getDateRangeRevenueStats(startDateStr, endDateStr, preset);

    let totalRevenue = revenueRangeStats.totalRevenue;
    let monthlyRevenue = 0;
    let paidStudents = 0;
    let activeSubscriptions = 0;

    let studentProfiles: AnalyticsStudent[] = [];
    const attempts: AnalyticsAttemptRow[] = [];
    const answersData: AnalyticsAnswerRow[] = [];
    const activeSubUserIds = new Set<string>();

    // Fallback ONLY if local mode (Supabase not configured)
    if (!isSupabaseConfigured && studentProfiles.length === 0) {
      studentProfiles = localStudents.map((s) => ({
        id: s.id,
        full_name: s.fullName,
        email: s.email,
        role: 'student',
        created_at: s.createdAt,
      }));
    }

    // Compute Student Performance metrics
    const totalStudents = studentProfiles.length;
    const activeStudentIds = new Set(attempts.map((a) => a.user_id).filter(Boolean));
    const activeStudents =
      activeStudentIds.size > 0
        ? activeStudentIds.size
        : !isSupabaseConfigured
          ? Math.min(totalStudents, Math.ceil(totalStudents * 0.7))
          : 0;
    const testsAttempted = attempts.length > 0 ? attempts.length : !isSupabaseConfigured ? 48 : 0;

    const totalCorrect = attempts.reduce((acc, curr) => acc + Number(curr.correct_count || 0), 0);
    const totalWrong = attempts.reduce((acc, curr) => acc + Number(curr.wrong_count || 0), 0);
    const questionsAnswered = totalCorrect + totalWrong;

    // questionsAnswered, totalCorrect, totalWrong directly from real attempts data

    const overallAccuracy =
      questionsAnswered > 0 ? Number(((totalCorrect / questionsAnswered) * 100).toFixed(1)) : 0;

    // Group attempts by user for individual ranking
    const studentStatsMap = new Map<
      string,
      {
        totalTests: number;
        questionsAttempted: number;
        correctCount: number;
        totalScore: number;
        lastActive?: string;
      }
    >();

    attempts.forEach((att) => {
      if (!att.user_id) return;
      const prev = studentStatsMap.get(att.user_id) || {
        totalTests: 0,
        questionsAttempted: 0,
        correctCount: 0,
        totalScore: 0,
        lastActive: att.created_at,
      };

      const qAtt = Number(att.correct_count || 0) + Number(att.wrong_count || 0);
      prev.totalTests += 1;
      prev.questionsAttempted += qAtt;
      prev.correctCount += Number(att.correct_count || 0);
      prev.totalScore += Number(att.score || 0);
      if (!prev.lastActive || new Date(att.created_at) > new Date(prev.lastActive)) {
        prev.lastActive = att.created_at;
      }
      studentStatsMap.set(att.user_id, prev);
    });

    // Build Student Rankings
    const studentRankings: StudentRankRow[] = studentProfiles
      .map((student, idx) => {
        const stats = studentStatsMap.get(student.id);

        let totalTests = stats?.totalTests || 0;
        let questionsAttempted = stats?.questionsAttempted || 0;
        let correctCount = stats?.correctCount || 0;
        let totalScore = stats?.totalScore || 0;
        const lastActive = stats?.lastActive || student.created_at;

        // Provide realistic demo scoring ONLY when Supabase is not configured
        if (!isSupabaseConfigured && totalTests === 0 && attempts.length === 0) {
          totalTests = Math.max(1, 15 - (idx % 12));
          questionsAttempted = totalTests * 20;
          const sampleAcc = Math.max(45, 96 - idx * 4.5);
          correctCount = Math.round((questionsAttempted * sampleAcc) / 100);
          totalScore = Number(
            (correctCount * 2 - (questionsAttempted - correctCount) * 0.5).toFixed(1)
          );
        }

        const accuracy =
          questionsAttempted > 0
            ? Number(((correctCount / questionsAttempted) * 100).toFixed(1))
            : 0;

        return {
          rank: 0, // Assigned after sorting
          userId: student.id,
          name: student.full_name || 'Aspirant Student',
          email: student.email || '',
          totalTests,
          questionsAttempted,
          correctCount,
          accuracy,
          totalScore,
          isPro: activeSubUserIds.has(student.id) || (!isSupabaseConfigured && idx % 3 === 0),
          lastActive,
        };
      })
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return b.totalTests - a.totalTests;
      })
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      }));

    const topStudent = studentRankings.length > 0 ? studentRankings[0] : undefined;

    // Build Performance Trend (last 7 data points)
    const trendMap = new Map<
      string,
      { attempts: number; totalScore: number; count: number; totalAcc: number }
    >();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      trendMap.set(dateKey, { attempts: 0, totalScore: 0, count: 0, totalAcc: 0 });
    }

    attempts.forEach((att) => {
      const dateKey = (att.created_at || '').slice(0, 10);
      if (trendMap.has(dateKey)) {
        const item = trendMap.get(dateKey)!;
        item.attempts += 1;
        item.totalScore += Number(att.score || 0);
        item.totalAcc += Number(att.accuracy || 0);
        item.count += 1;
      }
    });

    const performanceTrend: PerformanceTrendPoint[] = Array.from(trendMap.entries()).map(
      ([dateStr, val], idx) => {
        const d = new Date(dateStr + 'T12:00:00');
        const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const attemptsCount =
          val.attempts > 0 ? val.attempts : !isSupabaseConfigured ? Math.max(3, (idx + 2) * 2) : 0;
        const averageAccuracy =
          val.count > 0
            ? Number((val.totalAcc / val.count).toFixed(1))
            : !isSupabaseConfigured
              ? Number((72 + (idx % 4) * 3).toFixed(1))
              : 0;
        const averageScore =
          val.count > 0
            ? Number((val.totalScore / val.count).toFixed(1))
            : !isSupabaseConfigured
              ? Number((38 + idx * 4).toFixed(1))
              : 0;

        return {
          date: dateStr,
          label,
          attemptsCount,
          averageAccuracy,
          averageScore,
        };
      }
    );

    // ─── Question & Topic Insights ──────────────────────────────────────
    const mostWrongQuestions: QuestionInsightRow[] = [];
    const topicMap = new Map<
      string,
      { chapterName: string; subjectName: string; total: number; correct: number }
    >();
    const subjectMap = new Map<string, { subjectName: string; total: number; correct: number }>();

    if (answersData.length > 0) {
      const qMap = new Map<
        string,
        { qInfo: AnalyticsQuestionInfo; wrong: number; correct: number; total: number }
      >();

      answersData.forEach((row) => {
        const qId = row.question_id;
        const isCorrect = Boolean(row.is_correct);
        const qInfo = row.questions || {};

        if (!qMap.has(qId)) {
          qMap.set(qId, { qInfo, wrong: 0, correct: 0, total: 0 });
        }
        const item = qMap.get(qId)!;
        item.total += 1;
        if (isCorrect) item.correct += 1;
        else item.wrong += 1;

        // Topics (chapters)
        const chapName = qInfo.chapters?.name || qInfo.chapter_id || 'General Topic';
        const subName = qInfo.subjects?.name || qInfo.subject_id || 'General Subject';
        const chapKey = `${chapName}___${subName}`;

        if (!topicMap.has(chapKey)) {
          topicMap.set(chapKey, {
            chapterName: chapName,
            subjectName: subName,
            total: 0,
            correct: 0,
          });
        }
        const tItem = topicMap.get(chapKey)!;
        tItem.total += 1;
        if (isCorrect) tItem.correct += 1;

        // Subjects
        if (!subjectMap.has(subName)) {
          subjectMap.set(subName, { subjectName: subName, total: 0, correct: 0 });
        }
        const sItem = subjectMap.get(subName)!;
        sItem.total += 1;
        if (isCorrect) sItem.correct += 1;
      });

      // Top Wrong Questions
      Array.from(qMap.entries()).forEach(([qId, data]) => {
        const failureRate =
          data.total > 0 ? Number(((data.wrong / data.total) * 100).toFixed(1)) : 0;
        const accuracyRate =
          data.total > 0 ? Number(((data.correct / data.total) * 100).toFixed(1)) : 0;

        mostWrongQuestions.push({
          questionId: qId,
          questionText: data.qInfo.question_text || 'Mock Practice Question',
          questionBengaliText: data.qInfo.question_bengali_text ?? undefined,
          subjectName: data.qInfo.subjects?.name || 'General Subject',
          chapterName: data.qInfo.chapters?.name || 'Core Topic',
          difficulty: data.qInfo.difficulty || 'medium',
          totalAttempts: data.total,
          wrongCount: data.wrong,
          failureRate,
          accuracyRate,
        });
      });

      mostWrongQuestions.sort(
        (a, b) => b.failureRate - a.failureRate || b.wrongCount - a.wrongCount
      );
    }

    // If answers data was empty AND Supabase is not configured, provide demo diagnostic items
    if (!isSupabaseConfigured && mostWrongQuestions.length === 0) {
      localQuestions.slice(0, 5).forEach((q, idx) => {
        const sub = localSubjects.find((s) => s.id === q.subjectId)?.name || 'General Science';
        const chap = localChapters.find((c) => c.id === q.chapterId)?.name || 'Fundamental Concept';
        const attemptsCount = 28 - idx * 3;
        const failureRate = Number((82.5 - idx * 4.2).toFixed(1));
        const wrongCount = Math.round((attemptsCount * failureRate) / 100);

        mostWrongQuestions.push({
          questionId: q.id,
          questionText: q.questionText,
          questionBengaliText: q.questionBengaliText,
          subjectName: sub,
          chapterName: chap,
          difficulty: q.difficulty || 'hard',
          totalAttempts: attemptsCount,
          wrongCount,
          failureRate,
          accuracyRate: Number((100 - failureRate).toFixed(1)),
        });
      });
    }

    // Weakest Topics
    const weakestTopics: TopicInsightRow[] = [];
    if (topicMap.size > 0) {
      Array.from(topicMap.entries()).forEach(([key, val]) => {
        const accuracyRate =
          val.total > 0 ? Number(((val.correct / val.total) * 100).toFixed(1)) : 0;
        weakestTopics.push({
          chapterId: key,
          chapterName: val.chapterName,
          subjectName: val.subjectName,
          totalQuestionsAttempted: val.total,
          accuracyRate,
        });
      });
      weakestTopics.sort((a, b) => a.accuracyRate - b.accuracyRate);
    } else if (!isSupabaseConfigured) {
      // Mock weakest topics (local demo mode only)
      const sampleTopics = [
        { name: 'Indian Constitution & Polity', sub: 'Polity & Governance', acc: 38.4, total: 142 },
        { name: 'Arithmetic & Number Systems', sub: 'Mathematics', acc: 42.1, total: 198 },
        { name: 'Medieval Bengal History', sub: 'History', acc: 46.8, total: 110 },
        { name: 'General Science & Optics', sub: 'Physics & Chemistry', acc: 51.2, total: 165 },
        { name: 'Logical Reasoning & Puzzles', sub: 'Reasoning Ability', acc: 54.7, total: 180 },
      ];
      sampleTopics.forEach((st, idx) => {
        weakestTopics.push({
          chapterId: `topic_${idx + 1}`,
          chapterName: st.name,
          subjectName: st.sub,
          totalQuestionsAttempted: st.total,
          accuracyRate: st.acc,
        });
      });
    }

    // Weakest Subjects
    const weakestSubjects: SubjectInsightRow[] = [];
    if (subjectMap.size > 0) {
      Array.from(subjectMap.entries()).forEach(([key, val]) => {
        const accuracyRate =
          val.total > 0 ? Number(((val.correct / val.total) * 100).toFixed(1)) : 0;
        weakestSubjects.push({
          subjectId: key,
          subjectName: val.subjectName,
          totalQuestionsAttempted: val.total,
          accuracyRate,
        });
      });
      weakestSubjects.sort((a, b) => a.accuracyRate - b.accuracyRate);
    } else if (!isSupabaseConfigured) {
      // Mock weakest subjects (local demo mode only)
      const sampleSubjects = [
        { name: 'Polity & Constitution', acc: 41.5, total: 240 },
        { name: 'Mathematics & Numerical Ability', acc: 47.3, total: 320 },
        { name: 'General Science', acc: 52.8, total: 290 },
        { name: 'Indian History & INM', acc: 56.4, total: 380 },
        { name: 'General Mental Ability', acc: 61.2, total: 210 },
      ];
      sampleSubjects.forEach((ss, idx) => {
        weakestSubjects.push({
          subjectId: `subj_${idx + 1}`,
          subjectName: ss.name,
          totalQuestionsAttempted: ss.total,
          accuracyRate: ss.acc,
        });
      });
    }

    // Revenue fallbacks ONLY if in local mode
    if (!isSupabaseConfigured && totalRevenue === 0 && localPayments.length > 0) {
      totalRevenue = localPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      monthlyRevenue = Math.round(totalRevenue * 0.45);
      paidStudents = Math.max(1, Math.round(totalStudents * 0.35));
      activeSubscriptions = Math.max(1, Math.round(paidStudents * 0.8));
    }

    const localDistricts = [
      { district: 'Kolkata', studentCount: Math.max(1, Math.round(totalStudents * 0.4)) },
      { district: 'North 24 Parganas', studentCount: Math.max(1, Math.round(totalStudents * 0.3)) },
      { district: 'Howrah', studentCount: Math.max(1, Math.round(totalStudents * 0.2)) },
      {
        district: 'Not specified',
        studentCount: Math.max(0, totalStudents - Math.round(totalStudents * 0.9)),
      },
    ].filter((d) => d.studentCount > 0);

    const localGenders = [
      { gender: 'Male', studentCount: Math.max(1, Math.round(totalStudents * 0.52)) },
      { gender: 'Female', studentCount: Math.max(1, Math.round(totalStudents * 0.41)) },
      { gender: 'Other', studentCount: Math.max(0, Math.round(totalStudents * 0.02)) },
      {
        gender: 'Not specified',
        studentCount: Math.max(0, totalStudents - Math.round(totalStudents * 0.95)),
      },
    ].filter((g) => g.studentCount > 0);

    return {
      demographics: {
        districts: localDistricts,
        genders: localGenders,
      },
      historicalSubjectTrends: [],
      studentPerformance: {
        totalStudents,
        activeStudents,
        testsAttempted,
        questionsAnswered,
        overallAccuracy,
        topStudent,
        performanceTrend,
      },
      studentRankings,
      questionInsights: {
        mostWrongQuestions: mostWrongQuestions.slice(0, 5),
        weakestTopics: weakestTopics.slice(0, 5),
        weakestSubjects: weakestSubjects.slice(0, 5),
      },
      revenue: {
        totalRevenue,
        monthlyRevenue: isSupabaseConfigured
          ? monthlyRevenue
          : monthlyRevenue || Math.round(totalRevenue * 0.4),
        paidStudents: isSupabaseConfigured
          ? paidStudents
          : paidStudents || Math.max(1, Math.round(totalStudents * 0.35)),
        activeSubscriptions: isSupabaseConfigured
          ? activeSubscriptions
          : activeSubscriptions || Math.max(1, Math.round(paidStudents * 0.8)),
        revenueTrend: revenueRangeStats.dailyTrend,
      },
    };
  },
};

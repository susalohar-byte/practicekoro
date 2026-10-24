import { deleteAdminRecord } from '@/services/domains/admin.mutations';
import { accountManagementApi } from '@/services/domains/accountManagement';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/authPolicy';
import type {
  AdminSubscriptionRow,
  AdminPaymentRow,
  AdminStudentRow,
  AdminStudentDetails,
  AdminBatch,
  TestAttempt,
} from '@/types';

import type {
  StudentBatchRow,
  StudentNote,
  StudentNoteRow,
  StudentProfileRow,
  StudentSubscriptionRow,
} from '@/services/domains/commerce/rows';

/** Student directory, details, internal notes, profile edits and batches. */

export const studentsApi = {
  async getAdminStudents(
    search?: string,
    filterPlan?: string,
    filterStatus?: string,
    limit = 200,
    offset = 0
  ): Promise<AdminStudentRow[]> {
    if (isSupabaseConfigured) {
      // Attempt 1: RPC function (most complete data)
      try {
        const { data, error } = await supabase.rpc('get_admin_students', {
          p_search: search || null,
          p_plan: filterPlan === 'all' ? null : filterPlan || null,
          p_status: filterStatus === 'all' ? null : filterStatus || null,
          p_limit: limit,
          p_offset: offset,
        });

        if (!error && Array.isArray(data)) {
          return data
            .filter((d) => {
              const email = (d.email || '').toLowerCase().trim();
              return !isAdminEmail(email);
            })
            .map((d) => ({
              id: d.id,
              fullName: d.full_name || 'Aspirant',
              email: d.email || '',
              phone: d.phone || undefined,
              avatarUrl: d.avatar_url || undefined,
              createdAt: d.created_at,
              planTitle: d.plan_title || 'Free Plan',
              planId: d.plan_id || 'plan_free',
              subscriptionStatus: d.subscription_status || 'none',
              isPro: Boolean(d.is_pro),
              expiresAt: d.expires_at || undefined,
              totalAttempts: Number(d.total_attempts || 0),
              lastActive: d.last_active || d.created_at,
              category: d.category || undefined,
              gender: d.gender || undefined,
              district: d.district || undefined,
              state: d.state || undefined,
              targetExamTitle: d.target_exam_title || undefined,
            }));
        }
        if (error) {
          console.warn('RPC get_admin_students failed:', error.message, error.code);
        }
      } catch (err) {
        console.warn('RPC get_admin_students exception:', err);
      }

      // Attempt 2: Direct query on profiles (simple, no nested join)
      try {
        let query = supabase
          .from('profiles')
          .select(
            'id, full_name, email, phone, avatar_url, role, created_at, category, gender, district, state, target_exam_title'
          )
          .eq('role', 'student')
          .order('created_at', { ascending: false })
          .order('id')
          .range(offset, offset + limit - 1);

        if (search) {
          query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: profileData, error: profileError } = await query;
        if (profileError) {
          console.warn('Direct profiles query failed:', profileError.message);
        }

        if (!profileError && Array.isArray(profileData) && profileData.length === 0) return [];
        if (!profileError && Array.isArray(profileData) && profileData.length > 0) {
          // Filter out admins
          const studentProfiles = (profileData as StudentProfileRow[]).filter((d) => {
            const email = (d.email || '').toLowerCase().trim();
            if (isAdminEmail(email)) {
              return false;
            }
            if (d.role === 'admin') return false;
            return true;
          });

          // Fetch subscriptions separately to avoid ambiguous FK join issues
          const userIds = studentProfiles.map((p) => p.id);
          const subsMap: Record<string, StudentSubscriptionRow> = {};
          const attemptsMap: Record<
            string,
            { count: number; lastActive?: string; avgScore?: number | null }
          > = {};

          if (userIds.length > 0) {
            try {
              const [subsRes, attRes] = await Promise.all([
                supabase
                  .from('subscriptions')
                  .select('user_id, plan_id, status, expires_at, subscription_plans(title)')
                  .in('user_id', userIds)
                  .order('created_at', { ascending: false }),
                supabase
                  .from('test_attempts')
                  .select('user_id, created_at, score, total_marks, status')
                  .in('user_id', userIds)
                  .order('created_at', { ascending: false }),
              ]);

              if (Array.isArray(subsRes.data)) {
                for (const s of subsRes.data as unknown as StudentSubscriptionRow[]) {
                  // Keep only the most recent subscription per user
                  if (!subsMap[s.user_id]) {
                    subsMap[s.user_id] = s;
                  }
                }
              }

              if (Array.isArray(attRes.data)) {
                const userScores: Record<string, number[]> = {};
                for (const a of attRes.data as {
                  user_id: string;
                  created_at: string;
                  score: number | null;
                  total_marks: number | null;
                  status: string | null;
                }[]) {
                  if (!attemptsMap[a.user_id]) {
                    attemptsMap[a.user_id] = { count: 1, lastActive: a.created_at };
                  } else {
                    attemptsMap[a.user_id].count += 1;
                  }
                  if (a.status === 'completed' || (a.score != null && Number(a.score) > 0)) {
                    if (!userScores[a.user_id]) userScores[a.user_id] = [];
                    const tot = Number(a.total_marks);
                    const sc = Number(a.score);
                    const pct = tot > 0 ? (sc / tot) * 100 : sc;
                    userScores[a.user_id].push(Math.min(100, Math.max(0, pct)));
                  }
                }
                for (const uid of Object.keys(userScores)) {
                  const arr = userScores[uid];
                  if (arr.length > 0) {
                    const avg = Math.round(arr.reduce((sum, v) => sum + v, 0) / arr.length);
                    if (attemptsMap[uid]) {
                      attemptsMap[uid].avgScore = avg;
                    }
                  }
                }
              }
            } catch {
              // Related data lookup is optional - students still show without it
            }
          }

          return studentProfiles
            .map((d): AdminStudentRow => {
              const sub = subsMap[d.id];
              const isPro = sub?.status === 'active';
              const planTitle =
                sub?.subscription_plans?.title || (isPro ? 'Pro Pass' : 'Free Aspirant');

              return {
                id: d.id,
                fullName: d.full_name || 'Registered Aspirant',
                email: d.email || '',
                phone: d.phone || undefined,
                avatarUrl: d.avatar_url || undefined,
                createdAt: d.created_at,
                planTitle,
                planId: sub?.plan_id || 'plan_free',
                subscriptionStatus: sub?.status || 'none',
                isPro,
                expiresAt: sub?.expires_at || undefined,
                totalAttempts: attemptsMap[d.id]?.count || 0,
                avgScore: attemptsMap[d.id]?.avgScore ?? null,
                lastActive: attemptsMap[d.id]?.lastActive || d.created_at,
                category: d.category || undefined,
                gender: d.gender || undefined,
                district: d.district || undefined,
                state: d.state || undefined,
                targetExamTitle: d.target_exam_title || undefined,
              };
            })
            .filter((st) => {
              if (filterPlan === 'pro' && !st.isPro) return false;
              if (filterPlan === 'free' && st.isPro) return false;
              if (filterStatus === 'active' && !st.isPro) return false;
              if (filterStatus === 'expired' && st.subscriptionStatus !== 'expired') return false;
              return true;
            });
        }
      } catch (err) {
        console.warn('Direct profiles query exception:', err);
      }
    }

    if (isSupabaseConfigured) throw new Error('Could not load students from the backend.');
    return [];
  },

  async getAdminStudentDetails(userId: string): Promise<AdminStudentDetails | null> {
    // The student list is paged (newest 200 by default), so narrow it to this
    // student's email first; otherwise older students would never be found.
    let search: string | undefined;
    if (isSupabaseConfigured) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle();
      if (profileError) throw new Error(profileError.message);
      search = profile?.email || undefined;
    }
    const students = await this.getAdminStudents(search);
    const student = students.find((s) => s.id === userId);
    if (!student) return null;

    let attempts: TestAttempt[] = [];
    let payments: AdminPaymentRow[] = [];
    let subscriptions: AdminSubscriptionRow[] = [];

    if (isSupabaseConfigured) {
      try {
        const [attRes, payRes, subRes] = await Promise.all([
          supabase
            .from('test_attempts')
            .select('*, tests(title)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('subscriptions')
            .select('*, subscription_plans(title)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        ]);

        if (attRes.data && attRes.data.length > 0) {
          attempts = attRes.data.map((a) => ({
            id: a.id,
            userId: a.user_id,
            testId: a.test_id,
            testTitle: (a.tests as { title?: string })?.title || 'Practice Mock Test',
            status: a.status,
            startTime: a.start_time,
            endTime: a.end_time,
            timeSpentSeconds: a.time_spent_seconds,
            score: Number(a.score),
            totalMarks: Number(a.total_marks),
            correctCount: a.correct_count,
            wrongCount: a.wrong_count,
            skippedCount: a.skipped_count,
            accuracy: Number(a.accuracy),
            rank: a.rank,
            percentile: Number(a.percentile),
            createdAt: a.created_at,
          }));
        }

        if (payRes.data) {
          payments = payRes.data.map((p) => ({
            id: p.id,
            userId: p.user_id,
            studentName: student.fullName,
            studentEmail: student.email,
            amount: Number(p.amount),
            currency: p.currency,
            gateway: p.gateway,
            orderId: p.order_id,
            transactionId: p.transaction_id,
            status: p.status,
            refundId: p.refund_id || undefined,
            refundAmount: p.refund_amount == null ? undefined : Number(p.refund_amount),
            refundReason: p.refund_reason || undefined,
            refundedAt: p.refunded_at || undefined,
            createdAt: p.created_at,
          }));
        }

        if (subRes.data) {
          subscriptions = subRes.data.map((s) => ({
            id: s.id,
            userId: s.user_id,
            studentName: student.fullName,
            studentEmail: student.email,
            planId: s.plan_id,
            planTitle: (s.subscription_plans as { title?: string })?.title || 'Pro Pass',
            status: s.status,
            startsAt: s.starts_at,
            expiresAt: s.expires_at,
            daysRemaining: Math.max(
              0,
              Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / (24 * 3600 * 1000))
            ),
            createdAt: s.created_at,
          }));
        }
      } catch (err) {
        console.warn('Error loading student details:', err);
      }
    }

    return {
      ...student,
      recentAttempts: attempts,
      paymentHistory: payments,
      subscriptionHistory: subscriptions,
    };
  },

  async getStudentNotes(studentId: string): Promise<StudentNote[]> {
    if (isSupabaseConfigured) {
      {
        const { data, error } = await supabase
          .from('student_notes')
          .select('id, author_name, note, created_at')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (Array.isArray(data)) {
          return (data as StudentNoteRow[]).map((d) => ({
            id: d.id,
            author: d.author_name || 'Staff Admin',
            text: d.note,
            createdAt: new Date(d.created_at).toLocaleString('en-GB'),
          }));
        }
      }
    }
    return [];
  },

  async createStudentNote(
    studentId: string,
    note: string,
    authorName = 'Admin Staff'
  ): Promise<{ success: boolean; note?: StudentNote; error?: string }> {
    if (!note.trim()) {
      return { success: false, error: 'Note text cannot be empty.' };
    }
    if (isSupabaseConfigured) {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const authorId = userRes?.user?.id || null;

        const { data, error } = await supabase
          .from('student_notes')
          .insert({
            student_id: studentId,
            author_id: authorId,
            author_name: authorName,
            note: note.trim(),
          })
          .select('id, author_name, note, created_at')
          .single();

        if (error) return { success: false, error: error.message };
        return {
          success: true,
          note: {
            id: data.id,
            author: data.author_name,
            text: data.note,
            createdAt: new Date(data.created_at).toLocaleString('en-GB'),
          },
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Create note failed',
        };
      }
    }
    return { success: false, error: 'Backend is required.' };
  },

  async deleteStudentNote(noteId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) return { success: false, error: 'Backend required' };
    try {
      await deleteAdminRecord('student_notes', noteId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Delete failed' };
    }
  },

  updateStudentProfile(
    userId: string,
    updates: {
      fullName?: string;
      email?: string;
      phone?: string;
      targetExam?: string;
      district?: string;
      status?: string;
    }
  ) {
    return accountManagementApi.updateStudentProfile(userId, updates);
  },

  deleteStudentProfile(userId: string) {
    return accountManagementApi.deleteStudentProfile(userId);
  },

  async getAdminBatches(): Promise<AdminBatch[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('student_batches')
      .select('id, name, description, is_active, created_at, student_batch_members(count)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data || []) as StudentBatchRow[]).map((batch) => ({
      id: batch.id,
      name: batch.name,
      description: batch.description || undefined,
      memberCount: Number(batch.student_batch_members?.[0]?.count || 0),
      isActive: Boolean(batch.is_active),
      createdAt: batch.created_at,
    }));
  },

  async createAdminBatch(
    name: string,
    description?: string
  ): Promise<{ success: boolean; batchId?: string; error?: string }> {
    if (!isSupabaseConfigured) return { success: true, batchId: `local-${Date.now()}` };
    const { data, error } = await supabase
      .from('student_batches')
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select('id')
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, batchId: data?.id };
  },

  async bulkAssignStudentsToBatch(
    batchId: string,
    userIds: string[]
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    if (userIds.length === 0) return { success: true, count: 0 };
    if (!isSupabaseConfigured) return { success: true, count: userIds.length };
    try {
      const { data, error } = await supabase.rpc('bulk_assign_students_to_batch', {
        p_batch_id: batchId,
        p_user_ids: userIds,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, count: Number(data || userIds.length) };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Bulk batch assignment failed',
      };
    }
  },
};

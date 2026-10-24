import { deleteAdminRecord } from '@/services/domains/admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  enrichAdminSubscriptionAvatars,
  enrichAdminSubscriptionPayments,
} from '@/services/domains/admin.financialDetails';
import { MOCK_SUBSCRIPTION_PLANS } from '@/services/mockData';
import type { AdminSubscriptionRow, SubscriptionPlan } from '@/types';
import type { SubscriptionJoinRow } from '@/services/domains/commerce/rows';

/** Subscription plans and student subscription lifecycle (grant, cancel, extend, change). */

export const subscriptionsApi = {
  async getAdminSubscriptions(
    status?: string,
    search?: string,
    limit = 50,
    offset = 0
  ): Promise<AdminSubscriptionRow[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('get_admin_subscriptions', {
          p_status: status || null,
          p_search: search || null,
          p_limit: limit,
          p_offset: offset,
        });

        if (!error && Array.isArray(data)) {
          const rawRows: AdminSubscriptionRow[] = data.map((d) => ({
            id: d.id,
            userId: d.user_id,
            studentName: d.student_name || 'Unknown student',
            studentEmail: d.student_email || '',
            studentPhone: d.student_phone || undefined,
            avatarUrl: d.avatar_url || d.student_avatar || undefined,
            planId: d.plan_id,
            planTitle: d.plan_title || 'Unknown plan',
            status: d.status,
            startsAt: d.starts_at,
            expiresAt: d.expires_at,
            paymentId: d.payment_id || undefined,
            daysRemaining: Number(d.days_remaining || 0),
            createdAt: d.created_at,
          }));
          const enrichedWithAvatars = await enrichAdminSubscriptionAvatars(rawRows);
          return enrichAdminSubscriptionPayments(enrichedWithAvatars);
        }
      } catch (err) {
        console.warn('Could not fetch admin subscriptions from RPC, trying direct query:', err);
      }

      // Direct fallback query against Supabase subscriptions table
      try {
        let query = supabase
          .from('subscriptions')
          .select(
            `
            id,
            user_id,
            plan_id,
            status,
            starts_at,
            expires_at,
            payment_id,
            created_at,
            profiles:user_id(full_name, email, phone, avatar_url),
            subscription_plans:plan_id(title)
          `
          )
          .order('created_at', { ascending: false })
          .order('id')
          .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          // Many-to-one joins (profiles, subscription_plans) come back as single objects.
          const rawRows: AdminSubscriptionRow[] = (data as unknown as SubscriptionJoinRow[])
            .filter((d) => {
              if (!search) return true;
              const s = search.toLowerCase();
              const name = d.profiles?.full_name?.toLowerCase() || '';
              const email = d.profiles?.email?.toLowerCase() || '';
              return name.includes(s) || email.includes(s);
            })
            .map((d) => {
              const now = Date.now();
              const exp = new Date(d.expires_at).getTime();
              const daysRemaining = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));
              return {
                id: d.id,
                userId: d.user_id,
                studentName: d.profiles?.full_name || 'Registered Student',
                studentEmail: d.profiles?.email || '',
                studentPhone: d.profiles?.phone || undefined,
                avatarUrl: d.profiles?.avatar_url || undefined,
                planId: d.plan_id,
                planTitle: d.subscription_plans?.title || 'Unknown plan',
                status: d.status,
                startsAt: d.starts_at,
                expiresAt: d.expires_at,
                paymentId: d.payment_id || undefined,
                daysRemaining,
                createdAt: d.created_at,
              };
            });
          const enrichedWithAvatars = await enrichAdminSubscriptionAvatars(rawRows);
          return enrichAdminSubscriptionPayments(enrichedWithAvatars);
        }
      } catch (err) {
        console.warn('Direct query on subscriptions failed:', err);
      }
    }

    // Never label a failed backend read as a complete empty dataset.
    if (isSupabaseConfigured) throw new Error('Could not load subscriptions from the backend.');
    return [];
  },

  async updateSubscriptionPlan(
    id: string,
    updates: Partial<SubscriptionPlan>
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, unknown> = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.price !== undefined) payload.price = updates.price;
        if (updates.originalPrice !== undefined) payload.original_price = updates.originalPrice;
        if (updates.durationDays !== undefined) payload.duration_days = updates.durationDays;
        if (updates.renewalWindowDays !== undefined)
          payload.renewal_window_days = updates.renewalWindowDays;
        if (updates.features !== undefined) payload.features = updates.features;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (updates.currency !== undefined) payload.currency = updates.currency;

        const { data, error } = await supabase
          .from('subscription_plans')
          .update(payload)
          .eq('id', id)
          .select('id');
        if (error) return { success: false, error: error.message };
        if (!data || data.length === 0) {
          return { success: false, error: 'Subscription plan not found or no rows updated.' };
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
      }
    }
    const idx = MOCK_SUBSCRIPTION_PLANS.findIndex((p) => p.id === id);
    if (idx !== -1) {
      MOCK_SUBSCRIPTION_PLANS[idx] = { ...MOCK_SUBSCRIPTION_PLANS[idx], ...updates };
    }
    return { success: true };
  },

  async createSubscriptionPlan(
    plan: SubscriptionPlan
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .insert({
            id: plan.id,
            name: plan.name || plan.title,
            title: plan.title,
            description: plan.description,
            duration_days: plan.durationDays,
            price: plan.price,
            original_price: plan.originalPrice,
            currency: plan.currency || 'INR',
            features: plan.features,
            is_active: plan.isActive,
            order_index: plan.orderIndex || 1,
            renewal_window_days: plan.renewalWindowDays ?? null,
          })
          .select('id');
        if (error) return { success: false, error: error.message };
        if (!data || data.length === 0) {
          return { success: false, error: 'Failed to insert subscription plan.' };
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Creation failed' };
      }
    }
    const existingIdx = MOCK_SUBSCRIPTION_PLANS.findIndex((p) => p.id === plan.id);
    if (existingIdx !== -1) {
      MOCK_SUBSCRIPTION_PLANS[existingIdx] = plan;
    } else {
      MOCK_SUBSCRIPTION_PLANS.push(plan);
    }
    return { success: true };
  },

  async deleteSubscriptionPlan(
    id: string
  ): Promise<{ success: boolean; archived?: boolean; error?: string; message?: string }> {
    if (id === 'plan_free')
      return {
        success: false,
        error: 'The Free Starter plan (plan_free) cannot be deleted as it is a core system tier.',
      };
    if (isSupabaseConfigured) {
      try {
        await deleteAdminRecord('subscription_plans', id);
        return { success: true, archived: false };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : 'Deletion failed. Deactivate the plan instead if it has linked billing records.',
        };
      }
    }
    const i = MOCK_SUBSCRIPTION_PLANS.findIndex((p) => p.id === id);
    if (i < 0) return { success: false, error: 'Plan not found' };
    MOCK_SUBSCRIPTION_PLANS.splice(i, 1);
    return { success: true };
  },

  async grantStudentSubscription(
    userId: string,
    planId: string,
    durationDays: number
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const startsAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
        const { error } = await supabase.from('subscriptions').insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          starts_at: startsAt,
          expires_at: expiresAt,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Grant subscription failed',
        };
      }
    }
    return { success: true };
  },

  async revokeStudentSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            expires_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('status', 'active');
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Revoke subscription failed',
        };
      }
    }
    return { success: true };
  },

  async cancelSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string; expiresAt?: string }> {
    if (!subscriptionId.trim()) {
      return { success: false, error: 'A subscription ID is required.' };
    }
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            expires_at: new Date().toISOString(),
          })
          .eq('id', subscriptionId)
          .eq('status', 'active')
          .select('id, status, expires_at')
          .maybeSingle();
        if (error) return { success: false, error: error.message };
        if (!data || data.id !== subscriptionId || data.status !== 'cancelled') {
          return {
            success: false,
            error: 'No active subscription was cancelled. Refresh and try again.',
          };
        }
        return { success: true, expiresAt: data.expires_at };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Cancel subscription failed',
        };
      }
    }
    return { success: false, error: 'Subscription cancellation requires a configured backend.' };
  },

  async extendSubscription(
    subscriptionId: string | number,
    days: number
  ): Promise<{ success: boolean; newExpiresAt?: string; error?: string }> {
    if (!Number.isInteger(days) || days <= 0)
      return { success: false, error: 'Extension must be a positive number of days.' };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('admin_modify_subscription', {
        p_id: String(subscriptionId),
        p_action: 'extend',
        p_days: days,
        p_plan_id: null,
      });
      if (error || data?.success !== true || data?.id !== String(subscriptionId))
        return { success: false, error: error?.message || 'Subscription update was not confirmed' };
      return { success: true, newExpiresAt: data.expires_at };
    }
    return { success: true };
  },

  async changeSubscriptionPlan(
    subscriptionId: string | number,
    newPlanId: string,
    start: 'today' | 'stack' = 'today'
  ): Promise<{ success: boolean; newExpiresAt?: string; planTitle?: string; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const idStr = String(subscriptionId);
        // Look up target plan
        const { data: plan, error: planErr } = await supabase
          .from('subscription_plans')
          .select('id, title, duration_days, is_active')
          .eq('id', newPlanId)
          .maybeSingle();

        if (planErr) return { success: false, error: planErr.message };
        if (!plan || !plan.is_active)
          return { success: false, error: 'Choose an active backend plan.' };

        // Look up current subscription
        const { data: sub, error: fetchErr } = await supabase
          .from('subscriptions')
          .select('id, expires_at, status')
          .eq('id', idStr)
          .maybeSingle();

        if (fetchErr) return { success: false, error: fetchErr.message };
        if (!sub) return { success: false, error: 'Subscription record not found.' };

        // Compute new expiry based on plan's configured duration
        const durationDays = Number(plan.duration_days);
        if (!Number.isInteger(durationDays) || durationDays <= 0)
          return { success: false, error: 'Plan duration must be positive.' };
        // 'today' starts the new plan period now; 'stack' adds it after the current
        // expiry while time remains. The admin's Change Plan preview uses the same rule.
        const currentExpiry = Date.parse(sub.expires_at || '');
        const baseDate =
          start === 'stack' && Number.isFinite(currentExpiry) && currentExpiry > Date.now()
            ? new Date(currentExpiry)
            : new Date();
        baseDate.setDate(baseDate.getDate() + durationDays);
        const newExpiresAt = baseDate.toISOString();

        const { data: updated, error: updateErr } = await supabase
          .from('subscriptions')
          .update({
            plan_id: plan.id,
            expires_at: newExpiresAt,
            status: 'active',
          })
          .eq('id', idStr)
          .select('id, plan_id, expires_at');

        if (updateErr) return { success: false, error: updateErr.message };
        if (!updated || updated.length === 0) {
          return { success: false, error: 'Failed to update plan (0 rows affected).' };
        }

        return {
          success: true,
          newExpiresAt: updated[0].expires_at,
          planTitle: plan.title,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Change plan failed',
        };
      }
    }
    return { success: false, error: 'Backend is required.' };
  },

  async createAdminSubscription(params: {
    studentName?: string;
    studentEmail: string;
    planId: string;
    planTitle?: string;
    amount?: number;
    paymentMethod?: string;
    durationDays?: number;
  }): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const email = params.studentEmail.trim().toLowerCase();
        // 1. Look up real registered student account
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, account_status')
          .ilike('email', email)
          .maybeSingle();

        if (profileErr) return { success: false, error: profileErr.message };
        if (!profile || profile.role !== 'student' || profile.account_status === 'inactive') {
          return {
            success: false,
            error: `No registered student account found for email "${email}". The student must register an account first.`,
          };
        }

        // 2. Look up configured subscription plan
        const { data: plan, error: planErr } = await supabase
          .from('subscription_plans')
          .select('id, title, duration_days, is_active')
          .eq('id', params.planId)
          .maybeSingle();

        if (planErr) return { success: false, error: planErr.message };
        if (!plan) {
          return { success: false, error: `Subscription plan "${params.planId}" not found.` };
        }
        if (!plan.is_active) {
          return {
            success: false,
            error: `Subscription plan "${plan.title}" is currently deactivated.`,
          };
        }

        const durationDays = Number(plan.duration_days);
        if (!Number.isInteger(durationDays) || durationDays <= 0)
          return { success: false, error: 'Choose a plan with a valid positive duration.' };
        const startsAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();

        // 3. Insert real subscription grant
        const { data: newSub, error: subErr } = await supabase
          .from('subscriptions')
          .insert({
            user_id: profile.id,
            plan_id: plan.id,
            status: 'active',
            starts_at: startsAt,
            expires_at: expiresAt,
          })
          .select('id')
          .maybeSingle();

        if (subErr || !newSub) {
          return { success: false, error: subErr?.message || 'Failed to create subscription.' };
        }
        return { success: true, subscriptionId: newSub.id };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Create subscription failed',
        };
      }
    }
    return { success: false, error: 'Backend is required.' };
  },

  async bulkGrantStudentSubscription(
    userIds: string[],
    planId: string,
    durationDays: number
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    if (userIds.length === 0) return { success: true, count: 0 };
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('bulk_grant_student_subscription', {
          p_user_ids: userIds,
          p_plan_id: planId,
          p_duration_days: durationDays,
        });
        if (error) return { success: false, error: error.message };
        return { success: true, count: Number(data || userIds.length) };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Bulk subscription assignment failed',
        };
      }
    }
    return { success: true, count: userIds.length };
  },
};

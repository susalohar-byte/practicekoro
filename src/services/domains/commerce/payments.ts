import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  enrichAdminPaymentAvatars,
  enrichAdminPaymentSubscriptions,
} from '@/services/domains/admin.financialDetails';
import { logAdminActivity } from '@/services/domains/auditLog';
import type { AdminPaymentRow, ProcessRefundRequest, ProcessRefundResponse } from '@/types';
import type {
  EdgeFunctionError,
  PaymentJoinRow,
  PaymentRecordRow,
  StoredStudent,
} from '@/services/domains/commerce/rows';
import { localPayments } from '@/services/domains/localStore';

/** Payment listing and refunds. */

export const paymentsApi = {
  async getAdminPayments(
    status?: string,
    search?: string,
    limit = 50,
    offset = 0
  ): Promise<AdminPaymentRow[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('get_admin_payments', {
          p_status: status || null,
          p_search: search || null,
          p_limit: limit,
          p_offset: offset,
        });

        if (!error && Array.isArray(data)) {
          const rawRows: AdminPaymentRow[] = data.map((d) => ({
            id: d.id,
            userId: d.user_id,
            studentName: d.student_name || 'Student Aspirant',
            studentEmail: d.student_email || '',
            avatarUrl: d.avatar_url || d.student_avatar || undefined,
            planId: d.plan_id || undefined,
            planTitle: d.plan_title || 'Pro Pass',
            amount: Number(d.amount),
            currency: d.currency || 'INR',
            gateway: d.gateway || 'razorpay',
            orderId: d.order_id || undefined,
            razorpayOrderId: d.razorpay_order_id || undefined,
            transactionId: d.transaction_id || undefined,
            razorpayPaymentId: d.razorpay_payment_id || undefined,
            status: d.status,
            refundId: d.refund_id || undefined,
            refundAmount: d.refund_amount == null ? undefined : Number(d.refund_amount),
            refundReason: d.refund_reason || undefined,
            refundedAt: d.refunded_at || undefined,
            requiresRefund: d.requires_refund === true || undefined,
            purchaseType: d.purchase_type || undefined,
            createdAt: d.created_at,
          }));
          const enrichedWithAvatars = await enrichAdminPaymentAvatars(rawRows);
          return enrichAdminPaymentSubscriptions(enrichedWithAvatars);
        }
      } catch (err) {
        console.warn('Could not fetch admin payments from RPC, trying direct query:', err);
      }

      // Direct fallback query against Supabase payments table
      try {
        let query = supabase
          .from('payments')
          .select(
            `
            id,
            user_id,
            plan_id,
            amount,
            currency,
            gateway,
            order_id,
            razorpay_order_id,
            transaction_id,
            razorpay_payment_id,
            status,
            refund_id,
            refund_amount,
            refund_reason,
            refunded_at,
            created_at,
            purchase_type,
            requires_refund:raw_response->>requires_refund,
            profiles:user_id(full_name, email, avatar_url),
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
          const rawRows: AdminPaymentRow[] = (data as unknown as PaymentJoinRow[])
            .filter((d) => {
              if (!search) return true;
              const s = search.toLowerCase();
              const name = d.profiles?.full_name?.toLowerCase() || '';
              const email = d.profiles?.email?.toLowerCase() || '';
              const orderId = (d.order_id || d.razorpay_order_id || '').toLowerCase();
              return name.includes(s) || email.includes(s) || orderId.includes(s);
            })
            .map((d) => ({
              id: d.id,
              userId: d.user_id,
              studentName: d.profiles?.full_name || 'Registered Student',
              studentEmail: d.profiles?.email || '',
              avatarUrl: d.profiles?.avatar_url || undefined,
              planId: d.plan_id || undefined,
              planTitle: d.subscription_plans?.title || 'Pro Pass',
              amount: Number(d.amount || 0),
              currency: d.currency || 'INR',
              gateway: d.gateway || 'razorpay',
              orderId: d.order_id || undefined,
              razorpayOrderId: d.razorpay_order_id || undefined,
              transactionId: d.transaction_id || undefined,
              razorpayPaymentId: d.razorpay_payment_id || undefined,
              status: d.status,
              refundId: d.refund_id || undefined,
              refundAmount: d.refund_amount == null ? undefined : Number(d.refund_amount),
              refundReason: d.refund_reason || undefined,
              refundedAt: d.refunded_at || undefined,
              requiresRefund: String(d.requires_refund) === 'true' || undefined,
              purchaseType: d.purchase_type || undefined,
              createdAt: d.created_at,
            }));
          const enrichedWithAvatars = await enrichAdminPaymentAvatars(rawRows);
          return enrichAdminPaymentSubscriptions(enrichedWithAvatars);
        }
      } catch (err) {
        console.warn('Direct query on payments failed:', err);
      }
    }

    if (isSupabaseConfigured) throw new Error('Could not load payments from the backend.');
    return [];
  },

  async markPaymentRefunded(
    paymentId: string,
    refundAmount: number,
    refundId?: string,
    refundReason?: string,
    revokeSubscription = true
  ): Promise<{ success: boolean; error?: string }> {
    const finalRefundId = refundId?.trim() || `rfnd_${Date.now()}`;
    const cleanReason = refundReason?.trim() || 'Admin initiated refund';
    const nowIso = new Date().toISOString();

    let rpcWorked = false;
    let paymentRecord: PaymentRecordRow | null = null;

    if (isSupabaseConfigured) {
      try {
        // 1. Attempt authoritative RPC mark_payment_refunded
        const { error: rpcErr } = await supabase.rpc('mark_payment_refunded', {
          p_payment_id: paymentId,
          p_refund_amount: refundAmount,
          p_refund_id: finalRefundId,
          p_refund_reason: cleanReason,
        });

        if (!rpcErr) {
          rpcWorked = true;
        } else {
          console.warn(
            'RPC mark_payment_refunded call returned error, falling back to direct SQL update:',
            rpcErr
          );
        }
      } catch (err) {
        console.warn('RPC mark_payment_refunded error:', err);
      }

      // 2. Direct database fallback if RPC failed or was unavailable
      if (!rpcWorked) {
        try {
          // Fetch payment to resolve user_id, plan_id, amount
          const { data: payData } = await supabase
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .maybeSingle();

          paymentRecord = payData;

          // Update payments table row
          const { error: payUpdateErr } = await supabase
            .from('payments')
            .update({
              status: 'refunded',
              refund_amount: refundAmount,
              refund_id: finalRefundId,
              refund_reason: cleanReason,
              refunded_at: nowIso,
              updated_at: nowIso,
            })
            .eq('id', paymentId);

          if (payUpdateErr) {
            console.error('Direct payments update failed:', payUpdateErr);
            return { success: false, error: payUpdateErr.message };
          }

          // Revoke active subscription if requested
          if (revokeSubscription && payData) {
            await supabase
              .from('subscriptions')
              .update({
                status: 'cancelled',
                expires_at: nowIso,
                updated_at: nowIso,
              })
              .or(
                `payment_id.eq.${paymentId},and(user_id.eq.${payData.user_id},plan_id.eq.${payData.plan_id})`
              )
              .eq('status', 'active');

            try {
              await supabase
                .from('profiles')
                .update({ is_pro: false, updated_at: nowIso })
                .eq('id', payData.user_id);
            } catch {
              // ignore if is_pro column is not present
            }
          }
        } catch (dbErr) {
          console.error('Direct fallback refund database failure:', dbErr);
          return {
            success: false,
            error: dbErr instanceof Error ? dbErr.message : 'Database update failed',
          };
        }
      }

      // 3. Log audit event
      try {
        await logAdminActivity({
          action: 'PAYMENT_REFUND_PROCESSED',
          entityType: 'payments',
          entityId: paymentId,
          entityName: `Payment Refund ₹${refundAmount}`,
          details: {
            payment_id: paymentId,
            refund_id: finalRefundId,
            refund_amount: refundAmount,
            reason: cleanReason,
            revoked_subscription: revokeSubscription,
            method: rpcWorked ? 'rpc' : 'direct_sql',
          },
        });
      } catch (auditErr) {
        console.warn('Audit log write failed:', auditErr);
      }
    }

    // 4. Always synchronize local storage stores (for demo mode / offline consistency)
    try {
      if (typeof window !== 'undefined') {
        const storedPayments = localStorage.getItem('practicekoro_payments');
        if (storedPayments) {
          const list = JSON.parse(storedPayments) as AdminPaymentRow[];
          const updated = list.map((p: AdminPaymentRow) =>
            p.id === paymentId
              ? {
                  ...p,
                  status: 'refunded',
                  refundAmount,
                  refundId: finalRefundId,
                  refundReason: cleanReason,
                  refundedAt: nowIso,
                }
              : p
          );
          localStorage.setItem('practicekoro_payments', JSON.stringify(updated));
        }

        const memIdx = localPayments.findIndex((p) => p.id === paymentId);
        if (memIdx !== -1) {
          Object.assign(localPayments[memIdx], {
            status: 'refunded',
            refundAmount,
            refundId: finalRefundId,
            refundReason: cleanReason,
            refundedAt: nowIso,
          } satisfies Partial<AdminPaymentRow>);
        }

        if (revokeSubscription && paymentRecord?.user_id) {
          const storedStudents = localStorage.getItem('practicekoro_students');
          if (storedStudents) {
            const students = JSON.parse(storedStudents) as StoredStudent[];
            const updatedStudents = students.map((s) =>
              s.id === paymentRecord.user_id
                ? { ...s, isPro: false, subscriptionStatus: 'cancelled' }
                : s
            );
            localStorage.setItem('practicekoro_students', JSON.stringify(updatedStudents));
          }
        }
      }
    } catch (localErr) {
      console.warn('Local storage sync error:', localErr);
    }

    return { success: true };
  },

  /**
   * Unified authoritative refund processor.
   * Supports both automated Razorpay API refunds via Supabase Edge Function
   * and manual/dashboard recorded refunds.
   */
  async processPaymentRefund(params: ProcessRefundRequest): Promise<ProcessRefundResponse> {
    const {
      paymentId,
      refundAmount,
      refundReason,
      refundMode = 'manual',
      refundId,
      revokeSubscription = true,
      notes,
    } = params;

    // Refunds change payment rows, which only the trusted server function may write
    // (payments are service-role only), so both modes go through the Edge Function.
    if (isSupabaseConfigured) {
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
          'process-razorpay-refund',
          {
            body: {
              paymentId,
              refundAmount,
              reason: refundReason,
              notes: notes ? { remarks: notes } : undefined,
              revokeSubscription,
              mode: refundMode,
              refundId: refundMode === 'manual' ? refundId?.trim() || undefined : undefined,
            },
          }
        );

        if (edgeError) {
          let detail = edgeError.message || 'Refund processing failed';
          try {
            const json = (edgeError as EdgeFunctionError).context?.json;
            if (typeof json === 'function') {
              const body = await json.call((edgeError as EdgeFunctionError).context);
              if (body?.error) detail = body.error;
            }
          } catch {
            // ignore
          }
          return {
            success: false,
            error:
              refundMode === 'gateway'
                ? `${detail}. If you refund it in the Razorpay Dashboard instead, record it using "Record Manual Refund".`
                : detail,
          };
        }

        if (!edgeData?.success || !edgeData.refundId) {
          return {
            success: false,
            error: edgeData?.error || 'Refund could not be completed',
          };
        }

        return {
          success: true,
          refundId: edgeData.refundId,
          refundAmount,
          status: 'refunded',
          revokedSubscription: Boolean(edgeData.revokedSubscription),
          gatewayResponse: edgeData.gatewayResponse,
        };
      } catch (err) {
        return {
          success: false,
          error:
            (err instanceof Error && err.message) || 'Failed to connect to the refund service.',
        };
      }
    }

    // 2. Manual / Recorded refund mode
    const finalRefundId = refundId?.trim() || `rfnd_manual_${Date.now()}`;
    const result = await this.markPaymentRefunded(
      paymentId,
      refundAmount,
      finalRefundId,
      refundReason,
      revokeSubscription
    );

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to record refund in database' };
    }

    return {
      success: true,
      refundId: finalRefundId,
      refundAmount,
      status: 'refunded',
      revokedSubscription: revokeSubscription,
    };
  },
};

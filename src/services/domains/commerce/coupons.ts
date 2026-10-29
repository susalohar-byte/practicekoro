import { readCompleteQuery } from '@/services/domains/admin.reporting';
import { requireSavedRow, deleteAdminRecord } from '@/services/domains/admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { CouponItem, CouponValidationResult } from '@/types';
import type { CouponRow, CouponWrite } from '@/services/domains/commerce/rows';
import { localCoupons } from '@/services/domains/localStore';

/** Coupon CRUD and checkout validation. */

export const couponsApi = {
  // --------------------------------------------------------------------------
  // COUPONS & DISCOUNTS API
  // --------------------------------------------------------------------------
  async getAdminCoupons(): Promise<CouponItem[]> {
    if (!isSupabaseConfigured) return localCoupons;
    const data = await readCompleteQuery(() =>
      supabase
        .from('coupons')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
    );
    return (data as CouponRow[]).map((d) => ({
      id: d.id,
      code: d.code,
      title: d.title || undefined,
      description: d.description || undefined,
      discountType: d.discount_type,
      discountValue: Number(d.discount_value),
      maxDiscountAmount: d.max_discount_amount ? Number(d.max_discount_amount) : undefined,
      minOrderAmount: Number(d.min_order_amount || 0),
      maxUses: d.max_uses ? Number(d.max_uses) : undefined,
      usedCount: Number(d.used_count || 0),
      maxUsesPerUser: Number(d.max_uses_per_user || 1),
      applicablePlanId: d.applicable_plan_id || undefined,
      validFrom: d.valid_from,
      validUntil: d.valid_until || undefined,
      isActive: Boolean(d.is_active),
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  },

  async createAdminCoupon(
    coupon: Omit<CouponItem, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; coupon?: CouponItem; error?: string }> {
    const normalizedCode = coupon.code.trim().toUpperCase();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .insert({
            code: normalizedCode,
            title: coupon.title?.trim() || null,
            description: coupon.description || null,
            discount_type: coupon.discountType,
            discount_value: coupon.discountValue,
            max_discount_amount: coupon.maxDiscountAmount || null,
            min_order_amount: coupon.minOrderAmount || 0,
            max_uses: coupon.maxUses || null,
            max_uses_per_user: coupon.maxUsesPerUser || 1,
            applicable_plan_id: coupon.applicablePlanId || null,
            valid_from: coupon.validFrom || new Date().toISOString(),
            valid_until: coupon.validUntil || null,
            is_active: coupon.isActive ?? true,
          })
          .select()
          .single();

        if (error) return { success: false, error: error.message };

        const newCoupon: CouponItem = {
          id: data.id,
          code: data.code,
          title: data.title || undefined,
          description: data.description || undefined,
          discountType: data.discount_type,
          discountValue: Number(data.discount_value),
          maxDiscountAmount: data.max_discount_amount
            ? Number(data.max_discount_amount)
            : undefined,
          minOrderAmount: Number(data.min_order_amount || 0),
          maxUses: data.max_uses ? Number(data.max_uses) : undefined,
          usedCount: Number(data.used_count || 0),
          maxUsesPerUser: Number(data.max_uses_per_user || 1),
          applicablePlanId: data.applicable_plan_id || undefined,
          validFrom: data.valid_from,
          validUntil: data.valid_until || undefined,
          isActive: Boolean(data.is_active),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        return { success: true, coupon: newCoupon };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Create coupon failed',
        };
      }
    }

    const fallbackCoupon: CouponItem = {
      ...coupon,
      id: 'local_coupon_' + Date.now(),
      code: normalizedCode,
      usedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localCoupons.unshift(fallbackCoupon);
    return { success: true, coupon: fallbackCoupon };
  },

  async updateAdminCoupon(
    id: string,
    updates: Partial<CouponItem>
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const payload: CouponWrite = { updated_at: new Date().toISOString() };
        if (updates.code) payload.code = updates.code.trim().toUpperCase();
        if (updates.title !== undefined) payload.title = updates.title.trim() || null;
        if (updates.description !== undefined) payload.description = updates.description || null;
        if (updates.discountType) payload.discount_type = updates.discountType;
        if (updates.discountValue !== undefined) payload.discount_value = updates.discountValue;
        if (updates.maxDiscountAmount !== undefined)
          payload.max_discount_amount = updates.maxDiscountAmount || null;
        if (updates.minOrderAmount !== undefined) payload.min_order_amount = updates.minOrderAmount;
        if (updates.maxUses !== undefined) payload.max_uses = updates.maxUses || null;
        if (updates.maxUsesPerUser !== undefined)
          payload.max_uses_per_user = updates.maxUsesPerUser;
        if (updates.applicablePlanId !== undefined)
          payload.applicable_plan_id = updates.applicablePlanId || null;
        if (updates.validFrom) payload.valid_from = updates.validFrom;
        if (updates.validUntil !== undefined) payload.valid_until = updates.validUntil || null;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;

        const { data: confirmed, error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', id)
          .select('id')
          .single();
        requireSavedRow({ data: confirmed, error }, id);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Update coupon failed',
        };
      }
    }

    const idx = localCoupons.findIndex((c) => c.id === id);
    if (idx !== -1) {
      localCoupons[idx] = { ...localCoupons[idx], ...updates, updatedAt: new Date().toISOString() };
    }
    return { success: true };
  },

  async deleteAdminCoupon(id: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        await deleteAdminRecord('coupons', id);
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Delete failed' };
      }
    }
    const i = localCoupons.findIndex((c) => c.id === id);
    if (i < 0) return { success: false, error: 'Coupon not found' };
    localCoupons.splice(i, 1);
    return { success: true };
  },

  async validateCoupon(
    code: string,
    planId: string,
    amount: number,
    userId?: string
  ): Promise<CouponValidationResult> {
    const normalizedCode = code.trim().toUpperCase();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('validate_coupon_code', {
          p_code: normalizedCode,
          p_plan_id: planId,
          p_amount: amount,
          p_user_id: userId || null,
        });

        if (!error && data) {
          return {
            valid: Boolean(data.valid),
            couponId: data.coupon_id,
            code: data.code,
            discountType: data.discount_type,
            discountValue: data.discount_value ? Number(data.discount_value) : undefined,
            discountAmount: Number(data.discount_amount || 0),
            finalPrice: Number(data.final_price ?? amount),
            message: data.message || (data.valid ? 'Coupon applied!' : 'Invalid coupon'),
          };
        }
      } catch (err) {
        console.warn('Coupon validation RPC error:', err);
      }
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: amount,
        message: 'Invalid or inactive coupon code.',
      };
    }

    // Local evaluation fallback
    const matched = localCoupons.find((c) => c.code.toUpperCase() === normalizedCode && c.isActive);
    if (!matched) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: amount,
        message: 'Invalid or inactive coupon code.',
      };
    }

    if (matched.validUntil && new Date(matched.validUntil) < new Date()) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: amount,
        message: 'This coupon code has expired.',
      };
    }

    if (matched.applicablePlanId && matched.applicablePlanId !== planId) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: amount,
        message: 'This coupon is not valid for the selected plan.',
      };
    }

    if (amount < matched.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: amount,
        message: `Minimum order value of Rs. ${matched.minOrderAmount} required for this coupon.`,
      };
    }

    let discount = 0;
    if (matched.discountType === 'percentage') {
      discount = (amount * matched.discountValue) / 100;
      if (matched.maxDiscountAmount && discount > matched.maxDiscountAmount) {
        discount = matched.maxDiscountAmount;
      }
    } else {
      discount = matched.discountValue;
    }

    discount = Math.min(discount, amount);
    const finalPrice = Math.max(0, amount - discount);

    return {
      valid: true,
      couponId: matched.id,
      code: matched.code,
      discountType: matched.discountType,
      discountValue: matched.discountValue,
      discountAmount: Math.round(discount * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      message: 'Coupon code applied successfully!',
    };
  },
};

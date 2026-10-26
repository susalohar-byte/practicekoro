import { csvCell } from '@/utils/csvExport';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { api } from '@/services/api';
import type { CouponItem } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { parseKolkataEndOfDay, parseKolkataStartOfDay } from '@/services/domains/admin.dashboard';
import { couponFormDate, CouponRowItem } from './couponsUtils';
import { INITIAL_COUPONS } from './demoCoupons';

export function useAdminCoupons() {
  const [pageLoading, setPageLoading] = useState(true);
  const [couponsList, setCouponsList] = useState<CouponRowItem[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const stored = localStorage.getItem('practicekoro_admin_coupons_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_COUPONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('practicekoro_admin_coupons_v2', JSON.stringify(couponsList));
    } catch {
      // ignore
    }
  }, [couponsList]);

  const [availablePlans, setAvailablePlans] = useState<
    { id: string; title: string; price: number }[]
  >([]);

  // Load backend active plans
  useEffect(() => {
    let isMounted = true;
    api
      .getSubscriptionPlans(true)
      .then((plans) => {
        if (!isMounted || !plans) return;
        setAvailablePlans(plans.map((p) => ({ id: p.id, title: p.title, price: p.price })));
      })
      .catch((err) => {
        console.warn('Failed to load subscription plans for coupons:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const [recordsError, setRecordsError] = useState('');
  const loadCoupons = useCallback(async () => {
    setRecordsError('');
    setPageLoading(true);
    try {
      const remote = await api.getAdminCoupons();
      if (!remote || remote.length === 0) {
        if (isSupabaseConfigured) setCouponsList([]);
        return true;
      }
      const mapped: CouponRowItem[] = remote.map((c) => {
        const isPct = c.discountType === 'percentage';
        const validFromStr = c.validFrom
          ? new Date(c.validFrom).toLocaleDateString('en-GB', {
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Immediate';
        const validUntilStr = c.validUntil
          ? new Date(c.validUntil).toLocaleDateString('en-GB', {
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'No Expiry';
        // An enabled coupon is only live inside its validity window.
        const nowMs = Date.now();
        const startsLater = Boolean(c.validFrom && Date.parse(c.validFrom) > nowMs);
        const hasEnded = Boolean(c.validUntil && Date.parse(c.validUntil) < nowMs);
        const status: CouponRowItem['status'] =
          !c.isActive || hasEnded ? 'Expired' : startsLater ? 'Scheduled' : 'Active';
        const isAct = status === 'Active';

        let planName = 'All Plans';
        let planBadge = 'bg-[#DBEAFE] text-[#1E40AF]';
        if (c.applicablePlanId) {
          const matched = availablePlans.find((p) => p.id === c.applicablePlanId);
          planName = matched ? matched.title : 'Specific Plan';
          planBadge = 'bg-[#EDE9FE] text-[#6D28D9]';
        }

        return {
          source: c,
          id: c.id,
          code: c.code,
          title: c.code.replace(/_/g, ' '),
          subtitle: c.description || 'Special Discount',
          discountType: isPct ? 'percentage' : 'fixed',
          discountValue: c.discountValue,
          maxDiscount: c.maxDiscountAmount,
          applicablePlans: planName,
          planBadgeClass: planBadge,
          usedCount: c.usedCount,
          totalLimit: c.maxUses ?? 0,
          validFrom: validFromStr,
          validUntil: validUntilStr,
          status,
          statusBadgeClass: isAct
            ? 'bg-[#DCFCE7] text-[#15803D]'
            : status === 'Scheduled'
              ? 'bg-[#FEF3C7] text-[#B45309]'
              : 'bg-[#FEE2E2] text-[#DC2626]',
          description: c.description,
          isFirstTimeOnly: c.maxUsesPerUser === 1,
        };
      });
      setCouponsList(mapped);
      return true;
    } catch (err) {
      console.warn('Failed to load coupons from database:', err);
      if (isSupabaseConfigured) setCouponsList([]);
      setRecordsError(err instanceof Error ? err.message : 'Coupons could not be loaded.');
      return false;
    } finally {
      setPageLoading(false);
    }
  }, [availablePlans]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // Checkbox selection
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<(number | string)[]>([]);

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPlan, setFilterPlan] = useState('All Plans');
  const [filterType, setFilterType] = useState('All Types');
  const [filterAdmin, setFilterAdmin] = useState('All Admins');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Active Row Action menu
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for "Create New Coupon" panel
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [formCode, setFormCode] = useState('WELCOME50');
  const [formTitle, setFormTitle] = useState('Welcome Offer');
  const [formDescription, setFormDescription] = useState('Get 50% off on your first subscription.');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('50');
  const [formMaxDiscount, setFormMaxDiscount] = useState('100');
  const [formApplicablePlanId, setFormApplicablePlanId] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState('500');
  const [formValidFrom, setFormValidFrom] = useState(todayDateStr);
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formActiveImmediately, setFormActiveImmediately] = useState(true);
  const [formFirstTimeOnly, setFormFirstTimeOnly] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const submitLock = useRef(false);
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);
  const [isDeletingCouponId, setIsDeletingCouponId] = useState<string | number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const beginEditing = (row: CouponRowItem) => {
    if (!row.source || submitLock.current) return;
    const c = row.source;
    setEditingCoupon(c);
    setFormCode(c.code);
    setFormTitle(row.title);
    setFormDescription(c.description || '');
    setFormDiscountType(c.discountType);
    setFormDiscountValue(String(c.discountValue));
    setFormMaxDiscount(c.maxDiscountAmount == null ? '' : String(c.maxDiscountAmount));
    setFormApplicablePlanId(c.applicablePlanId || '');
    setFormUsageLimit(c.maxUses == null ? '' : String(c.maxUses));
    setFormValidFrom(couponFormDate(c.validFrom));
    setFormValidUntil(couponFormDate(c.validUntil));
    setFormActiveImmediately(c.isActive);
    setFormFirstTimeOnly(c.maxUsesPerUser === 1);
    setActiveMenuId(null);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    if (activeMenuId !== null) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [activeMenuId]);

  // Generate random coupon code
  const handleGenerateCode = () => {
    const prefixes = ['SAVE', 'FESTIVE', 'EXAM', 'SUPER', 'OFFER', 'TOPPER'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(Math.random() * 8 + 2) * 10;
    const generated = `${p}${num}`;
    setFormCode(generated);
    showToast(`Generated promo code: ${generated}`);
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return couponsList.filter((item) => {
      if (filterStatus !== 'All Status' && item.status !== filterStatus) return false;
      if (filterPlan !== 'All Plans' && !item.applicablePlans.includes(filterPlan)) return false;
      if (filterType !== 'All Types') {
        if (filterType === 'Percentage' && item.discountType !== 'percentage') return false;
        if (filterType === 'Fixed Amount' && item.discountType !== 'fixed') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.code.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [couponsList, filterStatus, filterPlan, filterType, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCheckboxes([]);
  }, [searchQuery, filterStatus, filterPlan, filterType, rowsPerPage]);
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCheckboxes(filteredRows.map((r) => r.id));
    } else {
      setSelectedCheckboxes([]);
    }
  };

  const handleToggleRow = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCheckboxes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Create Coupon Submit
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current) return;

    if (!formCode.trim()) {
      showToast('Coupon code is required.');
      return;
    }

    const discountNum = Number(formDiscountValue);
    if (isNaN(discountNum) || discountNum <= 0) {
      showToast('Discount value must be greater than 0.');
      return;
    }
    if (formDiscountType === 'percentage' && discountNum > 100) {
      showToast('Percentage discount cannot exceed 100%.');
      return;
    }

    if (formValidFrom && formValidUntil) {
      const fromTime = new Date(formValidFrom).getTime();
      const untilTime = new Date(formValidUntil).getTime();
      if (fromTime > untilTime) {
        showToast('Valid From date cannot be after Valid Until date.');
        return;
      }
    }

    const maxDiscountNum = formMaxDiscount.trim() ? Number(formMaxDiscount) : undefined;
    if (maxDiscountNum !== undefined && (isNaN(maxDiscountNum) || maxDiscountNum <= 0)) {
      showToast('Maximum discount must be a positive number if provided.');
      return;
    }

    const maxUsesNum = formUsageLimit.trim() ? Number(formUsageLimit) : undefined;
    if (maxUsesNum !== undefined && (isNaN(maxUsesNum) || maxUsesNum < 0)) {
      showToast('Usage limit must be a valid non-negative number.');
      return;
    }

    submitLock.current = true;
    setIsSubmittingCoupon(true);

    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || undefined,
        discountType: formDiscountType,
        discountValue: discountNum,
        maxDiscountAmount: maxDiscountNum ?? 0,
        minOrderAmount: editingCoupon?.minOrderAmount ?? 0,
        maxUses: maxUsesNum ?? 0,
        maxUsesPerUser: formFirstTimeOnly
          ? 1
          : editingCoupon?.maxUsesPerUser === 1
            ? 5
            : (editingCoupon?.maxUsesPerUser ?? 5),
        applicablePlanId: formApplicablePlanId,
        // Coupon days are Indian calendar days, whatever the admin's browser timezone.
        validFrom:
          editingCoupon && formValidFrom === couponFormDate(editingCoupon.validFrom)
            ? editingCoupon.validFrom
            : formValidFrom
              ? parseKolkataStartOfDay(formValidFrom).toISOString()
              : new Date().toISOString(),
        validUntil:
          editingCoupon && formValidUntil === couponFormDate(editingCoupon.validUntil)
            ? editingCoupon.validUntil
            : formValidUntil
              ? parseKolkataEndOfDay(formValidUntil).toISOString()
              : '',
        isActive: formActiveImmediately,
      };
      const res = editingCoupon
        ? await api.updateAdminCoupon(editingCoupon.id, payload)
        : await api.createAdminCoupon(payload);

      if (!res.success || (!editingCoupon && !('coupon' in res && res.coupon))) {
        showToast(res.error || 'Failed to create coupon on backend.');
        setIsSubmittingCoupon(false);
        return;
      }

      const refreshed = await loadCoupons();
      showToast(
        `Coupon "${payload.code}" ${editingCoupon ? 'updated' : 'created'} successfully!${refreshed ? '' : ' Reload failed; please retry loading. Do not create a duplicate.'}`
      );
      setEditingCoupon(null);
      setFormCode('');
      setFormTitle('');
      setFormDescription('');
      setFormDiscountValue('20');
      setFormMaxDiscount('');
      setFormApplicablePlanId('');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error creating coupon.');
    } finally {
      submitLock.current = false;
      setIsSubmittingCoupon(false);
    }
  };

  // Export CSV
  const handleExportCoupons = () => {
    const headers = [
      'Coupon Code',
      'Title',
      'Discount Type',
      'Discount Value',
      'Applicable Plans',
      'Usage',
      'Validity',
      'Status',
    ];
    const rows = filteredRows.map((c) => [
      c.code,
      c.title,
      c.discountType,
      c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`,
      c.applicablePlans,
      `${c.usedCount}/${c.totalLimit}`,
      `${c.validFrom} - ${c.validUntil}`,
      c.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(csvCell).join(','))].join('\n');
    const encodedUri =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(csvContent.replace(/^data:text\/csv;charset=utf-8,/, ''));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `practicekoro_coupons_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Coupons data exported successfully.');
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: number | string) => {
    if (isDeletingCouponId === id) return;
    setIsDeletingCouponId(id);
    setActiveMenuId(null);

    try {
      const res = await api.deleteAdminCoupon(String(id));
      if (!res.success) {
        showToast(res.error || 'Failed to delete coupon on backend.');
        setIsDeletingCouponId(null);
        return;
      }
      setCouponsList((prev) => prev.filter((c) => c.id !== id));
      showToast('Coupon removed successfully.');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error deleting coupon.');
    } finally {
      setIsDeletingCouponId(null);
    }
  };

  // Copy Code
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Coupon code ${code} copied to clipboard!`);
    setActiveMenuId(null);
  };

  return {
    pageLoading,
    setPageLoading,
    couponsList,
    setCouponsList,
    availablePlans,
    setAvailablePlans,
    recordsError,
    setRecordsError,
    loadCoupons,
    selectedCheckboxes,
    setSelectedCheckboxes,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPlan,
    setFilterPlan,
    filterType,
    setFilterType,
    filterAdmin,
    setFilterAdmin,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    activeMenuId,
    setActiveMenuId,
    toastMessage,
    setToastMessage,
    todayDateStr,
    formCode,
    setFormCode,
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    formDiscountType,
    setFormDiscountType,
    formDiscountValue,
    setFormDiscountValue,
    formMaxDiscount,
    setFormMaxDiscount,
    formApplicablePlanId,
    setFormApplicablePlanId,
    formUsageLimit,
    setFormUsageLimit,
    formValidFrom,
    setFormValidFrom,
    formValidUntil,
    setFormValidUntil,
    formActiveImmediately,
    setFormActiveImmediately,
    formFirstTimeOnly,
    setFormFirstTimeOnly,
    editingCoupon,
    setEditingCoupon,
    submitLock,
    isSubmittingCoupon,
    setIsSubmittingCoupon,
    isDeletingCouponId,
    setIsDeletingCouponId,
    showToast,
    beginEditing,
    handleGenerateCode,
    filteredRows,
    pageCount,
    handleSelectAll,
    handleToggleRow,
    handleCreateCoupon,
    handleExportCoupons,
    handleDeleteCoupon,
    handleCopy,
  };
}

export type AdminCouponsState = ReturnType<typeof useAdminCoupons>;

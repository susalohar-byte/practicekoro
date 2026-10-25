import { csvCell } from '@/utils/csvExport';
import React, { useEffect, useMemo, useState } from 'react';
import {
  cashFlowChart,
  paymentChart,
  paymentInRange,
  paymentRange,
  recordedRefundAmount,
  refundInCashFlowRange,
  retainedPaymentAmount,
} from '@/utils/adminPaymentReporting';
import { api } from '@/services/api';
import type { AdminPaymentRow } from '@/types';
import {
  getAdminPaymentDisplayStatus,
  getAdminSubscriptionDisplay,
} from '@/utils/adminFinancialDisplay';
import { type PaymentItem, downloadReceiptDocument } from './paymentsUtils';

export function useAdminPayments() {
  const [paymentsList, setPaymentsList] = useState<PaymentItem[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<number | string>('');
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState<boolean>(false);

  // Load real payments from database on mount
  useEffect(() => {
    let isMounted = true;
    api
      .getAllAdminPayments()
      .then((remote) => {
        if (!isMounted) return;
        setRecordsLoading(false);
        if (!remote || remote.length === 0) {
          setPaymentsList([]);
          setSelectedRowId('');
          return;
        }
        const mapped: PaymentItem[] = remote.map((d) => {
          const dDate = new Date(d.createdAt || Date.now());
          const dateStr = dDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const timeStr = dDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });

          const { status: displayStatus, badgeClass: statusBadge } =
            getAdminPaymentDisplayStatus(d);
          const subscription = getAdminSubscriptionDisplay(d);

          let method: 'Razorpay' | 'UPI' | 'PhonePe' | 'Credit Card' | '—' = '—';
          if (d.gateway === 'razorpay') method = 'Razorpay';
          else if (d.gateway === 'credit_card') method = 'Credit Card';
          else if (d.gateway === 'phonepe') method = 'PhonePe';
          else if (d.gateway === 'upi') method = 'UPI';

          const avatar = (d.avatarUrl || '').trim();
          return {
            id: d.id,
            studentName: d.studentName || 'Student Aspirant',
            studentEmail: d.studentEmail || '',
            avatarType: avatar ? 'photo' : 'initials',
            avatarSrc: avatar || undefined,
            avatarInitials: (d.studentName || 'Student')
              .split(/\s+/)
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase(),
            avatarBgColor: 'bg-blue-100',
            avatarTextColor: 'text-blue-700',
            plan: d.planTitle || 'Plan unavailable',
            planDuration: `${d.planTitle || 'Plan unavailable'}`,
            planBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
            amount: d.amount,
            paymentMethod: method,
            transactionId: d.transactionId || d.razorpayPaymentId || 'Unavailable',
            date: dateStr,
            time: timeStr,
            status: displayStatus,
            sourcePayment: d,
            statusBadgeClass: statusBadge,
            gatewayOrderId: d.orderId || d.razorpayOrderId,
            paymentId: d.razorpayPaymentId || d.transactionId,
            bankReference: d.transactionId,
            subscriptionValidTill: subscription.validTill,
            subscriptionDaysLeft: subscription.daysRemaining,
            subscriptionActive: subscription.active,
          };
        });
        setPaymentsList(mapped);
        setSelectedRowId((prev) => {
          if (!prev) return '';
          return mapped.some((m) => m.id === prev) ? prev : '';
        });
      })
      .catch((err) => {
        console.warn('Failed to load admin payments from database:', err);
        if (isMounted) {
          setRecordsLoading(false);
          setRecordsError(
            'Payments could not be fully loaded. Totals and exports are unavailable; please refresh.'
          );
        }
        if (isMounted) setPaymentsList([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Checkbox selection state
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<(number | string)[]>([]);

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPlan, setFilterPlan] = useState('All Plans');
  const [filterMethod, setFilterMethod] = useState('All Payment Gateways');

  // Time range selector
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [attributionMode, setAttributionMode] = useState<'accrual' | 'cashflow'>('accrual');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals & notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [refundModalPayment, setRefundModalPayment] = useState<AdminPaymentRow | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    if (activeMenuId !== null) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [activeMenuId]);

  // Selected payment record
  const selectedPayment = useMemo(() => {
    if (!selectedRowId) return null;
    return paymentsList.find((p) => p.id === selectedRowId) || null;
  }, [paymentsList, selectedRowId]);

  const range = useMemo(() => paymentRange(timeRange), [timeRange]);
  const periodPayments = useMemo(
    () => paymentsList.filter((p) => paymentInRange(p.sourcePayment, range)),
    [paymentsList, range]
  );
  const chartPoints = useMemo(
    () =>
      attributionMode === 'cashflow'
        ? cashFlowChart(
            paymentsList.map((p) => p.sourcePayment),
            range
          )
        : paymentChart(
            periodPayments.map((p) => p.sourcePayment),
            range
          ),
    [attributionMode, paymentsList, periodPayments, range]
  );

  const cashFlowStats = useMemo(() => {
    const grossInflow = periodPayments
      .filter((p) => p.status === 'Success' || p.status === 'Refunded')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const periodDisbursedRefunds = paymentsList.filter((p) =>
      refundInCashFlowRange(p.sourcePayment, range)
    );
    const refundOutflow = periodDisbursedRefunds.reduce(
      (sum, p) => sum + recordedRefundAmount(p.sourcePayment),
      0
    );

    const netCashFlow = grossInflow - refundOutflow;
    return {
      grossInflow,
      refundOutflow,
      netCashFlow,
      refundCount: periodDisbursedRefunds.length,
    };
  }, [paymentsList, periodPayments, range]);
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCheckboxes([]);
  }, [timeRange]);
  // Computed summary metrics
  const totalRevenue = useMemo(() => {
    return periodPayments
      .filter((p) => p.status === 'Success')
      .reduce((sum, p) => sum + retainedPaymentAmount(p.sourcePayment), 0);
  }, [periodPayments]);

  const totalPayments = periodPayments.length;

  const successfulPayments = useMemo(() => {
    return periodPayments.filter((p) => p.status === 'Success').length;
  }, [periodPayments]);

  const failedPayments = useMemo(() => {
    return periodPayments.filter((p) => p.status === 'Failed').length;
  }, [periodPayments]);

  const refundedPayments = useMemo(() => {
    return periodPayments.filter((p) => p.status === 'Refunded').length;
  }, [periodPayments]);

  const successRate =
    totalPayments > 0 ? `${Math.round((successfulPayments / totalPayments) * 100)}%` : '0%';

  const methodStats = useMemo(() => {
    const total = totalRevenue || 1;
    const calc = (m: string) => {
      const items = periodPayments.filter((p) => p.paymentMethod === m && p.status === 'Success');
      const sum = items.reduce((acc, p) => acc + retainedPaymentAmount(p.sourcePayment), 0);
      const pct = totalRevenue > 0 ? Math.round((sum / total) * 100) : 0;
      return { sum, pct, count: items.length };
    };
    const otherItems = periodPayments.filter(
      (p) =>
        !['UPI', 'Razorpay', 'PhonePe', 'Credit Card'].includes(p.paymentMethod) &&
        p.status === 'Success'
    );
    const otherSum = otherItems.reduce((acc, p) => acc + retainedPaymentAmount(p.sourcePayment), 0);
    return {
      upi: calc('UPI'),
      razorpay: calc('Razorpay'),
      phonepe: calc('PhonePe'),
      card: calc('Credit Card'),
      other: {
        sum: otherSum,
        count: otherItems.length,
        pct: totalRevenue > 0 ? Math.round((otherSum / totalRevenue) * 100) : 0,
      },
    };
  }, [periodPayments, totalRevenue]);

  const methodsList = useMemo(() => {
    return [
      { id: 'razorpay', name: 'Razorpay', ...methodStats.razorpay, color: '#06B6D4' },
      { id: 'upi', name: 'UPI', ...methodStats.upi, color: '#0284C7' },
      { id: 'phonepe', name: 'PhonePe', ...methodStats.phonepe, color: '#A855F7' },
      { id: 'card', name: 'Credit/Debit Card', ...methodStats.card, color: '#F59E0B' },
      { id: 'other', name: 'Other', ...methodStats.other, color: '#64748B' },
    ];
  }, [methodStats]);

  const topMethod = useMemo(() => {
    const active = methodsList.filter((m) => m.sum > 0);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => b.sum - a.sum)[0];
  }, [methodsList]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return periodPayments.filter((item) => {
      if (filterStatus !== 'All Status' && item.status !== filterStatus) return false;
      if (filterPlan !== 'All Plans' && !item.plan.includes(filterPlan.replace(' Plans', '')))
        return false;
      if (filterMethod !== 'All Payment Gateways' && item.paymentMethod !== filterMethod)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.studentName.toLowerCase().includes(q) ||
          item.studentEmail.toLowerCase().includes(q) ||
          item.transactionId.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [periodPayments, filterStatus, filterPlan, filterMethod, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCheckboxes([]);
  }, [searchQuery, filterStatus, filterPlan, filterMethod, rowsPerPage]);
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  // Handle Select All Checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCheckboxes(filteredRows.map((r) => r.id));
    } else {
      setSelectedCheckboxes([]);
    }
  };

  const handleToggleRowCheckbox = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCheckboxes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Export CSV
  const handleExportPayments = () => {
    if (recordsLoading || recordsError) return;
    const headers = [
      'Transaction ID',
      'Student Name',
      'Student Email',
      'Plan',
      'Amount',
      'Payment Gateway',
      'Date',
      'Status',
      'Gateway Order ID',
      'Bank Reference',
    ];
    const rows = filteredRows.map((p) => [
      p.transactionId,
      p.studentName,
      p.studentEmail,
      p.plan,
      p.amount,
      p.paymentMethod,
      `${p.date} ${p.time}`,
      p.status,
      p.gatewayOrderId || 'N/A',
      p.bankReference || 'N/A',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(csvCell).join(','))].join('\n');
    const encodedUri =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(csvContent.replace(/^data:text\/csv;charset=utf-8,/, ''));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `practicekoro_payments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Payment records exported to CSV successfully.');
  };

  // Download Payment Receipt / Transaction Summary
  const handleDownloadInvoice = () => {
    if (!selectedPayment) return;
    downloadReceiptDocument(selectedPayment);
    showToast(`Payment receipt downloaded for ${selectedPayment.transactionId}`);
  };

  // Send Receipt Action (download receipt and clarify email availability)
  const handleSendReceipt = () => {
    if (!selectedPayment) return;
    downloadReceiptDocument(selectedPayment);
    showToast(`Receipt downloaded for ${selectedPayment.transactionId}. No email was sent.`);
  };

  // Open Refund Dialog
  const handleOpenRefund = (payment: PaymentItem) => {
    if (payment.status !== 'Success') return;
    setRefundModalPayment(payment.sourcePayment);
    setIsRefundModalOpen(true);
  };

  // Revoke only the linked subscription; do not change settled payment history.
  const handleCancelPayment = async () => {
    if (!selectedPayment || isCancellingSubscription) return;
    const target = selectedPayment;
    const subscriptionId = target.sourcePayment.subscriptionId;
    if (!subscriptionId || target.subscriptionActive !== true) {
      showToast('No active linked subscription is available to cancel.', 'error');
      return;
    }
    if (!window.confirm(`Cancel subscription and revoke plan access for ${target.studentName}?`))
      return;

    setIsCancellingSubscription(true);
    try {
      const result = await api.cancelSubscription(subscriptionId);
      if (!result.success) {
        showToast(result.error || 'Could not cancel the subscription.', 'error');
        return;
      }
      setPaymentsList((prev) =>
        prev.map((p) => {
          if (p.sourcePayment.subscriptionId !== subscriptionId) return p;
          const sourcePayment: AdminPaymentRow = {
            ...p.sourcePayment,
            subscriptionStatus: 'cancelled',
            subscriptionExpiresAt: result.expiresAt || p.sourcePayment.subscriptionExpiresAt,
          };
          const subscription = getAdminSubscriptionDisplay(sourcePayment);
          return {
            ...p,
            sourcePayment,
            subscriptionActive: false,
            subscriptionValidTill: subscription.validTill,
            subscriptionDaysLeft: 0,
          };
        })
      );
      showToast(`Subscription cancelled for ${target.studentName}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not cancel the subscription.', 'error');
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  return {
    setPaymentsList,
    recordsLoading,
    recordsError,
    selectedRowId,
    setSelectedRowId,
    isDetailsPanelOpen,
    setIsDetailsPanelOpen,
    selectedCheckboxes,
    setSelectedCheckboxes,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPlan,
    setFilterPlan,
    filterMethod,
    setFilterMethod,
    timeRange,
    setTimeRange,
    attributionMode,
    setAttributionMode,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    toastMessage,
    toastType,
    isCancellingSubscription,
    refundModalPayment,
    isRefundModalOpen,
    setIsRefundModalOpen,
    activeMenuId,
    setActiveMenuId,
    showToast,
    selectedPayment,
    range,
    chartPoints,
    cashFlowStats,
    totalRevenue,
    totalPayments,
    successfulPayments,
    failedPayments,
    refundedPayments,
    successRate,
    methodsList,
    topMethod,
    filteredRows,
    pageCount,
    handleSelectAll,
    handleToggleRowCheckbox,
    handleExportPayments,
    handleDownloadInvoice,
    handleSendReceipt,
    handleOpenRefund,
    handleCancelPayment,
  };
}

export type AdminPaymentsState = ReturnType<typeof useAdminPayments>;

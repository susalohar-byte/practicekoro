import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/services/api';
import type { DateRangePreset, AdminPaymentRow, PlatformAnalyticsData } from '@/types';
import { getKolkataDateString } from '@/services/domains/admin.dashboard';
import { exportToCsv } from './revenueAnalyticsUtils';

export function useAdminRevenueAnalytics() {
  const [preset, setPreset] = useState<DateRangePreset>('this_month');
  // Default custom range: first day of the current Kolkata month through Kolkata today.
  const [customStartDate, setCustomStartDate] = useState<string>(
    () => `${getKolkataDateString(new Date()).slice(0, 7)}-01`
  );
  const [customEndDate, setCustomEndDate] = useState<string>(() =>
    getKolkataDateString(new Date())
  );

  const [analyticsData, setAnalyticsData] = useState<PlatformAnalyticsData | null>(null);
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Student Leaderboard / Rank Modal State
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [rankSearchQuery, setRankSearchQuery] = useState('');
  const [rankCurrentPage, setRankCurrentPage] = useState(1);
  const pageSize = 10;

  // Transactions State
  const [transactionSearch, setTransactionSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>(
    'all'
  );

  const loadAllAnalytics = useCallback(
    async (selectedPreset: DateRangePreset, start?: string, end?: string) => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const [overview, paymentsData] = await Promise.all([
          api.getPlatformAnalyticsOverview(
            selectedPreset,
            selectedPreset === 'custom' ? start : undefined,
            selectedPreset === 'custom' ? end : undefined
          ),
          api.getAllAdminPayments(),
        ]);

        setAnalyticsData(overview);
        setPayments(paymentsData || []);
      } catch (err) {
        console.error('Failed to load platform analytics:', err);
        // Never leave previous-range figures on screen as if they matched the new range.
        setAnalyticsData(null);
        setPayments([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load analytics.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (preset !== 'custom') {
      loadAllAnalytics(preset);
    }
  }, [loadAllAnalytics, preset]);

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    setPreset('custom');
    loadAllAnalytics('custom', customStartDate, customEndDate);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllAnalytics(preset, customStartDate, customEndDate);
  };

  // Filtered student rankings for Rank modal
  const filteredRankings = useMemo(() => {
    if (!analyticsData?.studentRankings) return [];
    const query = rankSearchQuery.trim().toLowerCase();
    if (!query) return analyticsData.studentRankings;

    return analyticsData.studentRankings.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        String(s.rank).includes(query)
    );
  }, [analyticsData?.studentRankings, rankSearchQuery]);

  // Paginated rankings
  const totalRankPages = Math.max(1, Math.ceil(filteredRankings.length / pageSize));
  const paginatedRankings = useMemo(() => {
    const startIndex = (rankCurrentPage - 1) * pageSize;
    return filteredRankings.slice(startIndex, startIndex + pageSize);
  }, [filteredRankings, rankCurrentPage]);

  // Reset page when search changes
  useEffect(() => {
    setRankCurrentPage(1);
  }, [rankSearchQuery]);

  // Filter payments within transaction search
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (transactionSearch.trim()) {
        const q = transactionSearch.toLowerCase();
        return (
          p.studentName?.toLowerCase().includes(q) ||
          p.studentEmail?.toLowerCase().includes(q) ||
          p.orderId?.toLowerCase().includes(q) ||
          p.planTitle?.toLowerCase().includes(q) ||
          p.gateway?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, statusFilter, transactionSearch]);

  // Export Student Rankings CSV
  const handleExportRankingsCsv = () => {
    if (!analyticsData?.studentRankings) return;
    const headers = [
      'Rank',
      'Name',
      'Email',
      'Total Tests',
      'Questions Attempted',
      'Accuracy (%)',
      'Total Score',
    ];
    const rows = analyticsData.studentRankings.map((s) => [
      `#${s.rank}`,
      s.name,
      s.email,
      s.totalTests,
      s.questionsAttempted,
      `${s.accuracy}%`,
      s.totalScore,
    ]);
    exportToCsv(
      `PracticeKoro_Student_Rankings_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  // Export Revenue Report CSV
  const handleExportRevenueCsv = () => {
    const headers = [
      'Transaction ID',
      'Student Name',
      'Student Email',
      'Plan Title',
      'Amount (INR)',
      'Gateway',
      'Status',
      'Date & Time (IST)',
    ];

    const rows = filteredPayments.map((p) => [
      p.orderId || p.razorpayOrderId || p.id,
      p.studentName,
      p.studentEmail,
      p.planTitle || 'Pro Subscription',
      p.amount,
      p.gateway || 'Razorpay',
      p.status,
      new Date(p.createdAt || p.created_at || Date.now()).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
      }),
    ]);

    exportToCsv(
      `PracticeKoro_Revenue_Transactions_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  return {
    preset,
    setPreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    analyticsData,
    payments,
    isLoading,
    isRefreshing,
    loadError,
    isRankModalOpen,
    setIsRankModalOpen,
    rankSearchQuery,
    setRankSearchQuery,
    rankCurrentPage,
    setRankCurrentPage,
    pageSize,
    transactionSearch,
    setTransactionSearch,
    statusFilter,
    setStatusFilter,
    handleApplyCustomRange,
    handleRefresh,
    filteredRankings,
    totalRankPages,
    paginatedRankings,
    filteredPayments,
    handleExportRankingsCsv,
    handleExportRevenueCsv,
  };
}

export type AdminRevenueAnalyticsState = ReturnType<typeof useAdminRevenueAnalytics>;

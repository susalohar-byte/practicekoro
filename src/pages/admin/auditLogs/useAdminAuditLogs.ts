import { csvCell } from '@/utils/csvExport';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AUDIT_PAGE_SIZE, mapAuditLog, type AuditLogItem } from './auditLogsUtils';
import { INITIAL_AUDIT_LOGS } from './demoAuditLogs';

export function useAdminAuditLogs() {
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [logsList, setLogsList] = useState<AuditLogItem[]>(
    isSupabaseConfigured ? [] : INITIAL_AUDIT_LOGS
  );

  // Selected Log (Defaults to neutral unselected state)
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState<boolean>(false);

  // Server-side pagination: logs are fetched in pages via offset; older pages load on demand.
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadLogsPage = useCallback(async (offset: number) => {
    const { logs, total } = await api.getAdminAuditLogs({ limit: AUDIT_PAGE_SIZE, offset });
    const mapped = (logs || []).map((log, idx) => mapAuditLog(log, offset + idx));
    return { mapped, total };
  }, []);

  // Fetch real audit logs on mount
  useEffect(() => {
    let isMounted = true;
    setPageLoading(true);
    loadLogsPage(0)
      .then(({ mapped, total }) => {
        if (!isMounted) return;
        if (mapped.length === 0) {
          if (isSupabaseConfigured) {
            setLogsList([]);
            setServerTotal(total);
            setSelectedLogId('');
            setIsDetailsPanelOpen(false);
          }
          return;
        }
        setLogsList(mapped);
        setServerTotal(total);
        setSelectedLogId((prev) => {
          if (!prev) return '';
          return mapped.some((m) => m.id === prev) ? prev : '';
        });
      })
      .catch((err) => {
        if (isMounted) {
          setLogsList([]);
          setLoadError(err instanceof Error ? err.message : 'Audit logs could not be loaded');
        }
      })
      .finally(() => {
        if (isMounted) setPageLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [loadLogsPage]);

  const hasMoreLogs = serverTotal !== null && logsList.length < serverTotal;
  const handleLoadOlderLogs = async () => {
    if (isLoadingMore || !hasMoreLogs) return;
    setIsLoadingMore(true);
    try {
      const { mapped, total } = await loadLogsPage(logsList.length);
      setLogsList((prev) => {
        const seen = new Set(prev.map((l) => l.id));
        return [...prev, ...mapped.filter((l) => !seen.has(l.id))];
      });
      setServerTotal(total);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Older audit logs could not be loaded');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Checkbox selections in table
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('All Admins');
  const [filterAction, setFilterAction] = useState('All Actions');
  const [filterResource, setFilterResource] = useState('All Resources');
  const [filterSeverity, setFilterSeverity] = useState('All Levels');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Dropdown menus
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopiedJson, setIsCopiedJson] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
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

  // Selected audit log record
  const selectedLog = useMemo(() => {
    if (!selectedLogId) return null;
    return logsList.find((l) => l.id === selectedLogId) || null;
  }, [logsList, selectedLogId]);

  const mostActiveArea = useMemo(() => {
    if (logsList.length === 0) return { area: 'None', count: 0 };
    const counts: Record<string, number> = {};
    for (const l of logsList) {
      counts[l.resource] = (counts[l.resource] || 0) + 1;
    }
    let top = 'None';
    let max = 0;
    for (const [res, cnt] of Object.entries(counts)) {
      if (cnt > max) {
        max = cnt;
        top = res;
      }
    }
    return { area: top, count: max };
  }, [logsList]);

  const adminOptions = useMemo(
    () => Array.from(new Set(logsList.map((l) => l.adminName).filter(Boolean))).sort(),
    [logsList]
  );

  // Filtered rows
  const filteredLogs = useMemo(() => {
    return logsList.filter((log) => {
      if (filterAdmin !== 'All Admins' && log.adminName !== filterAdmin) return false;
      if (filterAction !== 'All Actions' && log.action !== filterAction) return false;
      if (filterResource !== 'All Resources' && log.resource !== filterResource) return false;
      if (filterSeverity !== 'All Levels' && log.severity !== filterSeverity) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          log.adminName.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.resource.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.ipAddress.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [logsList, filterAdmin, filterAction, filterResource, filterSeverity, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredLogs.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Export CSV
  const handleExportLogs = () => {
    const headers = [
      'Date',
      'Time',
      'Admin',
      'Email',
      'Action',
      'Resource',
      'Details',
      'IP Address',
      'Severity',
    ];
    const rows = filteredLogs.map((l) => [
      l.date,
      l.time,
      l.adminName,
      l.adminEmail,
      l.action,
      l.resource,
      l.fullDetails || l.details,
      l.ipAddress,
      l.severity,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(csvCell).join(','))].join('\n');
    const encodedUri =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(csvContent.replace(/^data:text\/csv;charset=utf-8,/, ''));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `practicekoro_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported audit logs successfully.');
  };

  // Copy JSON details
  const handleCopyJson = () => {
    if (selectedLog?.jsonData) {
      navigator.clipboard.writeText(JSON.stringify(selectedLog.jsonData, null, 2));
      setIsCopiedJson(true);
      showToast('Copied JSON data to clipboard.');
      setTimeout(() => setIsCopiedJson(false), 2000);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterAdmin('All Admins');
    setFilterAction('All Actions');
    setFilterResource('All Resources');
    setFilterSeverity('All Levels');
    showToast('Audit log filters reset.');
  };

  return {
    pageLoading,
    setPageLoading,
    loadError,
    setLoadError,
    logsList,
    setLogsList,
    selectedLogId,
    setSelectedLogId,
    isDetailsPanelOpen,
    setIsDetailsPanelOpen,
    serverTotal,
    setServerTotal,
    isLoadingMore,
    setIsLoadingMore,
    loadLogsPage,
    hasMoreLogs,
    handleLoadOlderLogs,
    selectedIds,
    setSelectedIds,
    searchQuery,
    setSearchQuery,
    filterAdmin,
    setFilterAdmin,
    filterAction,
    setFilterAction,
    filterResource,
    setFilterResource,
    filterSeverity,
    setFilterSeverity,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    activeMenuId,
    setActiveMenuId,
    toastMessage,
    setToastMessage,
    isCopiedJson,
    setIsCopiedJson,
    showToast,
    selectedLog,
    mostActiveArea,
    adminOptions,
    filteredLogs,
    totalPages,
    handleSelectAll,
    handleToggleRow,
    handleExportLogs,
    handleCopyJson,
    handleResetFilters,
  };
}

export type AdminAuditLogsState = ReturnType<typeof useAdminAuditLogs>;

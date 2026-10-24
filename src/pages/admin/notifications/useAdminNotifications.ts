import { csvCell } from '@/utils/csvExport';
import { runConfirmedBatch, requireSuccess } from '@/services/domains/admin.mutations';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { notificationDateInput, notificationDateMatches } from '@/utils/adminNotificationDates';
import { api } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { sendFcmPush } from '@/services/domains/fcmGateway';
import {
  NotificationCategory,
  NotificationRecord,
  NotificationStatus,
  SMS_BROADCAST_DISABLED_MESSAGE,
} from './notificationTypes';
import { INITIAL_NOTIFICATIONS_42 } from './sampleNotifications';
import { toLocalDateTimeInput } from './notificationUtils';

export function useAdminNotifications() {
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Master notification records initialized with 42 items matching screenshot numbers
  const [notificationsList, setNotificationsList] = useState<NotificationRecord[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const stored = localStorage.getItem('practicekoro_admin_notifications_v5');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATIONS_42;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(
        'practicekoro_admin_notifications_v5',
        JSON.stringify(notificationsList)
      );
    } catch {
      // ignore
    }
  }, [notificationsList]);

  // Load real notifications from backend (Supabase / localStore)
  const loadBackendNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const remote = await api.getNotifications();
      if (remote && Array.isArray(remote)) {
        const mapped: NotificationRecord[] = remote.map((r, idx) => {
          const eventAt = r.status === 'scheduled' ? r.scheduledAt : r.sentAt || r.createdAt;
          const parsedDate = eventAt ? new Date(eventAt) : null;
          const dateObj = parsedDate && Number.isFinite(parsedDate.getTime()) ? parsedDate : null;
          return {
            id: r.id,
            num: idx + 1,
            title: r.title,
            message: r.message,
            type: (r.type || 'General') as NotificationCategory,
            audience:
              r.targetAudience === 'all'
                ? 'All Students'
                : r.targetAudience === 'pro'
                  ? 'Pro Members'
                  : r.targetAudience || 'All Students',
            targetAudience: r.targetAudience,
            audienceCount: 'All',
            status: r.status === 'sent' ? 'Sent' : r.status === 'scheduled' ? 'Scheduled' : 'Draft',
            sentAtDate: dateObj?.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            sentAtTime: dateObj?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stats: undefined,
            actionLink: r.actionLink,
            scheduledAt: r.scheduledAt,
            eventAt,
            sendPush: false,
            sendEmail: r.channel === 'both',
          };
        });

        if (isSupabaseConfigured) {
          setNotificationsList(mapped);
        } else {
          setNotificationsList((prev) => {
            const merged = [...prev];
            mapped.forEach((item) => {
              if (!merged.some((m) => m.id === item.id)) {
                merged.unshift(item);
              }
            });
            return merged;
          });
        }
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Notifications could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackendNotifications();
  }, [loadBackendNotifications]);

  // Tab filter: 'All' | 'Scheduled' | 'Sent' | 'Drafts'
  const [activeTab, setActiveTab] = useState<'All' | 'Scheduled' | 'Sent' | 'Drafts'>('All');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Date range filter
  const [dateRangePreset, setDateRangePreset] = useState('All Time');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(() =>
    notificationDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [customEndDate, setCustomEndDate] = useState(() => notificationDateInput());

  // Table selection checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action Menu dropdown state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Detailed Modal state
  const [inspectingItem, setInspectingItem] = useState<NotificationRecord | null>(null);

  // Currently focused/active row for preview in the mobile mockup (neutral initial state - no selection by default)
  const [activePreviewItem, setActivePreviewItem] = useState<NotificationRecord | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Form State in Right Panel
  const [formTab, setFormTab] = useState<'General' | 'Audience' | 'Schedule'>('General');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<NotificationStatus | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState<NotificationCategory>('General');
  const [formActionLink, setFormActionLink] = useState('');
  const [formSendPush, setFormSendPush] = useState(true);
  const [formSendEmail, setFormSendEmail] = useState(false);
  const [formSendSms, setFormSendSms] = useState(false);
  const [formAudience, setFormAudience] = useState('All Students');
  const [, setFormAudienceCount] = useState('12,480');
  const [formScheduledDate, setFormScheduledDate] = useState('2026-09-20T10:00');
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);

  // Calculate filtered notifications
  const filteredNotifications = useMemo(() => {
    return notificationsList.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'Scheduled' && item.status !== 'Scheduled') return false;
      if (activeTab === 'Sent' && item.status !== 'Sent') return false;
      if (activeTab === 'Drafts' && item.status !== 'Draft') return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.audience.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Filter raw timestamps, not locale-formatted labels. Demo records retain label support.
      const dateValue = item.eventAt || item.scheduledAt || item.sentAtDate;
      if (!notificationDateMatches(dateValue, dateRangePreset, customStartDate, customEndDate))
        return false;

      return true;
    });
  }, [notificationsList, activeTab, searchQuery, dateRangePreset, customStartDate, customEndDate]);

  // Tab counts dynamically computed
  const tabCounts = useMemo(() => {
    const scheduled = notificationsList.filter((n) => n.status === 'Scheduled').length;
    const sent = notificationsList.filter((n) => n.status === 'Sent').length;
    const drafts = notificationsList.filter((n) => n.status === 'Draft').length;
    return {
      all: notificationsList.length,
      scheduled,
      sent,
      drafts,
    };
  }, [notificationsList]);

  // Top metric numbers computed or referencing default benchmark
  const metrics = useMemo(() => {
    const sentCount = notificationsList.filter((n) => n.status === 'Sent').length;
    if (isSupabaseConfigured) {
      return {
        totalSentFormatted: sentCount.toLocaleString('en-IN'),
        deliveredFormatted: 'Unavailable',
        openedFormatted: 'Unavailable',
        clickedFormatted: 'Unavailable',
        failedFormatted: 'Unavailable',
        sentNoticesCount: sentCount,
      };
    }
    return {
      totalSentFormatted: '1,24,860',
      deliveredFormatted: '1,20,450',
      openedFormatted: '98,320',
      clickedFormatted: '24,860',
      failedFormatted: '4,410',
      sentNoticesCount: sentCount,
    };
  }, [notificationsList]);

  // Handle select all checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Select a notification to preview in the mobile screen
  const handleSelectToPreview = (item: NotificationRecord) => {
    setActivePreviewItem(item);
  };

  // Start editing a notification
  const handleStartEdit = (item: NotificationRecord) => {
    setEditingId(item.id);
    setEditingStatus(item.status);
    setFormTitle(item.title);
    setFormMessage(item.message);
    setFormType(item.type);
    setFormActionLink(item.actionLink || '');
    setFormAudience(item.audience);
    setFormAudienceCount(item.audienceCount);
    setFormSendPush(item.sendPush ?? true);
    setFormSendEmail(item.sendEmail ?? false);
    const scheduled = item.scheduledAt ? new Date(item.scheduledAt) : null;
    setFormScheduledDate(
      scheduled && Number.isFinite(scheduled.getTime())
        ? toLocalDateTimeInput(scheduled)
        : '2026-09-20T10:00'
    );
    setFormTab(item.status === 'Scheduled' ? 'Schedule' : 'General');

    // Scroll to form and focus
    const el = document.getElementById('create-notification-panel');
    el?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => titleInputRef.current?.focus(), 200);
    showToast(`Loaded "${item.title}" into editor.`);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingStatus(null);
    setFormTitle('');
    setFormMessage('');
    setFormType('General');
    setFormActionLink('');
    setFormAudience('All Students');
    setFormAudienceCount('12,480');
    setFormTab('General');
    showToast('Editing cancelled.');
  };

  // Submit new notification or update existing
  const handleSaveNotification = async (isDraft: boolean) => {
    if (formIsSubmitting) return;
    if (!formTitle.trim() || !formMessage.trim()) {
      showToast('Title and message are required.');
      return;
    }
    if (formSendEmail) {
      showToast(
        'Email delivery is not configured. Turn off Email; this saves in-app notifications only.'
      );
      return;
    }
    if (formSendSms) {
      showToast(SMS_BROADCAST_DISABLED_MESSAGE);
      return;
    }
    setFormIsSubmitting(true);
    try {
      // Editing keeps the record's existing status unless the admin explicitly saves it as a
      // draft or chooses the Schedule tab.
      const keptStatus =
        editingId && editingStatus === 'Draft'
          ? 'draft'
          : editingId && editingStatus === 'Scheduled'
            ? 'scheduled'
            : 'sent';
      const status = isDraft ? 'draft' : formTab === 'Schedule' ? 'scheduled' : keptStatus;
      const wasAlreadySent = Boolean(editingId) && editingStatus === 'Sent';
      const input = {
        title: formTitle.trim(),
        message: formMessage.trim(),
        targetAudience:
          formAudience === 'All Students'
            ? 'all'
            : formAudience === 'Pro Members'
              ? 'pro'
              : formAudience === 'Free Members'
                ? 'free'
                : formAudience,
        channel: 'in_app' as const,
        status: status as 'draft' | 'scheduled' | 'sent',
        scheduledAt: status === 'scheduled' ? new Date(formScheduledDate).toISOString() : undefined,
        actionLink: formActionLink.trim(),
        type: formType,
      };
      if (editingId) await api.updateNotification(editingId, input);
      else {
        const result = requireSuccess(await api.createNotification(input));
        if (!result.notification?.id) throw new Error('Saved notification ID is missing.');
      }

      const deliveryChannels: string[] = ['In-App'];
      let pushNote = '';

      // Dispatch external FCM Push Notification if enabled (only on first publish)
      if (status === 'sent' && !wasAlreadySent && formSendPush) {
        try {
          const settings = await api.getAppSettings();
          const serverKey = String(
            settings.find((s) => s.id === 'gateway_fcm_server_key')?.value || ''
          );
          const projectId = String(
            settings.find((s) => s.id === 'gateway_fcm_project_id')?.value || 'practicekoro-app'
          );
          const pushRes = await sendFcmPush({
            serverKey,
            projectId,
            title: formTitle.trim(),
            body: formMessage.trim(),
            actionUrl: formActionLink.trim() || 'https://practicekoro.online/',
            topic:
              formAudience === 'Pro Members'
                ? 'pro_students'
                : formAudience === 'Free Members'
                  ? 'free_students'
                  : 'all_students',
          });
          if (pushRes.success && !pushRes.isSimulated) {
            deliveryChannels.push('FCM Push');
          } else {
            pushNote = ' Push notification was not delivered (FCM is not configured server-side).';
          }
        } catch {
          pushNote = ' Push notification could not be dispatched.';
        }
      }

      const wasEditing = Boolean(editingId);
      setEditingId(null);
      setEditingStatus(null);
      setFormTitle('');
      setFormMessage('');
      setFormActionLink('');
      await loadBackendNotifications();
      if (status === 'draft') showToast(wasEditing ? 'Draft updated.' : 'Draft saved.');
      else if (status === 'scheduled')
        showToast(
          `Notification ${wasEditing ? 'updated and ' : ''}scheduled for ${new Date(
            formScheduledDate
          ).toLocaleString()}.`
        );
      else if (wasAlreadySent) showToast('Sent notification updated.');
      else showToast(`Notification published via ${deliveryChannels.join(' + ')}.${pushNote}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setFormIsSubmitting(false);
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      requireSuccess(await api.deleteNotification(id));
      setNotificationsList((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      setActivePreviewItem((prev) => (prev?.id === id ? null : prev));
      showToast('Notification deleted.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!selectedIds.length || !window.confirm('Delete selected notifications?')) return;
    const batch = await runConfirmedBatch(selectedIds, (id) => api.deleteNotification(id));
    const gone = new Set(batch.results.map((r) => r.input));
    setNotificationsList((prev) => prev.filter((n) => !gone.has(n.id)));
    setSelectedIds(batch.failures.map((f) => f.input));
    setActivePreviewItem((prev) => (prev && gone.has(prev.id) ? null : prev));
    showToast(
      gone.size +
        ' deleted; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : '')
    );
  };

  // Bulk Send Selected Drafts/Scheduled
  const handleBulkSend = async () => {
    const batch = await runConfirmedBatch(selectedIds, (id) => api.sendNotificationNow(id));
    setSelectedIds(batch.failures.map((f) => f.input));
    await loadBackendNotifications();
    showToast(
      batch.results.length +
        ' in-app notifications published; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : '')
    );
  };

  // Send Now for scheduled / draft item
  const handleSendNow = async (id: string) => {
    try {
      requireSuccess(await api.sendNotificationNow(id));
      await loadBackendNotifications();
      showToast('In-app notification published.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Publish failed');
    }
  };

  // Duplicate notice
  const handleDuplicate = async (item: NotificationRecord) => {
    try {
      const saved = requireSuccess(
        await api.createNotification({
          title: item.title + ' (Copy)',
          message: item.message,
          targetAudience: item.targetAudience || item.audience,
          channel: 'in_app',
          status: 'draft',
          type: item.type,
          actionLink: item.actionLink,
        })
      );
      if (!saved.notification?.id) throw new Error('Saved ID missing');
      await loadBackendNotifications();
      showToast('Duplicate draft saved.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Duplicate failed');
    }
  };

  // Export selected or all to CSV
  const handleExportCSV = (recordsToExport = notificationsList) => {
    const rows = recordsToExport.map((n) =>
      [
        n.num,
        n.title,
        n.type,
        n.audience,
        n.status,
        n.sentAtDate || n.scheduledAt || '',
        n.stats ? `${n.stats.delivered}% / ${n.stats.opened}% / ${n.stats.clicked}%` : 'N/A',
      ]
        .map(csvCell)
        .join(',')
    );
    const csvContent =
      '#,Title,Type,Audience,Status,Date,Stats (Delivered/Opened/Clicked)\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PracticeKoro_Notifications_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${recordsToExport.length} notifications to CSV.`);
  };

  // Effective preview title and message
  const displayPreviewTitle = formTitle.trim() || activePreviewItem?.title || 'Notification Title';
  const displayPreviewMessage =
    formMessage.trim() || activePreviewItem?.message || 'Notification message will appear here...';

  return {
    titleInputRef,
    notificationsList,
    setNotificationsList,
    isLoading,
    setIsLoading,
    loadBackendNotifications,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    dateRangePreset,
    setDateRangePreset,
    showDatePicker,
    setShowDatePicker,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    selectedIds,
    setSelectedIds,
    activeMenuId,
    setActiveMenuId,
    inspectingItem,
    setInspectingItem,
    activePreviewItem,
    setActivePreviewItem,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    toastMessage,
    setToastMessage,
    showToast,
    formTab,
    setFormTab,
    editingId,
    setEditingId,
    editingStatus,
    setEditingStatus,
    formTitle,
    setFormTitle,
    formMessage,
    setFormMessage,
    formType,
    setFormType,
    formActionLink,
    setFormActionLink,
    formSendPush,
    setFormSendPush,
    formSendEmail,
    setFormSendEmail,
    formSendSms,
    setFormSendSms,
    formAudience,
    setFormAudience,
    setFormAudienceCount,
    formScheduledDate,
    setFormScheduledDate,
    formIsSubmitting,
    setFormIsSubmitting,
    filteredNotifications,
    tabCounts,
    metrics,
    handleSelectAll,
    handleToggleRow,
    handleSelectToPreview,
    handleStartEdit,
    handleCancelEdit,
    handleSaveNotification,
    handleDelete,
    handleBulkDelete,
    handleBulkSend,
    handleSendNow,
    handleDuplicate,
    handleExportCSV,
    displayPreviewTitle,
    displayPreviewMessage,
  };
}

export type AdminNotificationsState = ReturnType<typeof useAdminNotifications>;

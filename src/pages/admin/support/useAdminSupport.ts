import React, { useState, useMemo, useEffect } from 'react';
import { api } from '@/services/api';
import type { SupportTicketItem } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { TicketCategory, TicketPriority, TicketRecord, TicketStatus } from './supportTypes';
import { mapAdminSupportTicket, supportMessageToChat } from './supportMapping';
import { INITIAL_TICKETS } from './supportSampleTickets';

export function useAdminSupport() {
  const [pageLoading, setPageLoading] = useState(true);
  const [ticketsList, setTicketsList] = useState<TicketRecord[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const stored = localStorage.getItem('practicekoro_admin_support_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_TICKETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('practicekoro_admin_support_v2', JSON.stringify(ticketsList));
    } catch {
      // ignore
    }
  }, [ticketsList]);

  // Load live support tickets from Supabase database on mount
  useEffect(() => {
    let isMounted = true;
    setPageLoading(true);
    api
      .getSupportTickets()
      .then((remote) => {
        if (!isMounted) return;
        if (!remote || remote.length === 0) {
          if (isSupabaseConfigured) {
            setTicketsList([]);
            setSelectedTicketId('');
          }
          return;
        }
        const mapped = remote.map(mapAdminSupportTicket);
        setTicketsList(mapped);
        setSelectedTicketId((prev) => {
          if (!prev) return '';
          return mapped.some((m) => m.id === prev) ? prev : '';
        });
      })
      .catch((err) => {
        setToastError(true);
        setToastMessage(
          err instanceof Error ? err.message : 'Support tickets could not be loaded.'
        );
      })
      .finally(() => {
        if (isMounted) setPageLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Selected Ticket in Right Panel (Neutral initial state - nothing selected by default)
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');

  // Search in filters
  const [filterSearch, setFilterSearch] = useState('');

  // Status Checkbox filters
  const [filterStatus, setFilterStatus] = useState<string[]>(['All']);

  // Category Checkbox filters
  const [filterCategory, setFilterCategory] = useState<string[]>([]);

  // Priority Checkbox filters
  const [filterPriority, setFilterPriority] = useState<string[]>(['All']);

  // Sort order
  const [sortBy, setSortBy] = useState<'Latest' | 'Oldest' | 'High Priority'>('Latest');

  // Reply tab in details panel: 'Reply' | 'Internal Note'
  const [composerTab, setComposerTab] = useState<'Reply' | 'Internal Note'>('Reply');
  const [replyText, setReplyText] = useState('');

  // Status dropdown toggle in details header
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal: New Ticket
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('Payment Issue');
  const [newPriority, setNewPriority] = useState<TicketPriority>('High');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const showToast = (msg: string, error = false) => {
    setToastError(error);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setIsStatusDropdownOpen(false);
    if (isStatusDropdownOpen) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [isStatusDropdownOpen]);

  // Active selected ticket
  const activeTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return ticketsList.find((t) => t.id === selectedTicketId) || null;
  }, [ticketsList, selectedTicketId]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    let result = [...ticketsList];

    // Status filter
    if (!filterStatus.includes('All') && filterStatus.length > 0) {
      result = result.filter((t) => filterStatus.includes(t.status));
    }

    // Category filter
    if (filterCategory.length > 0) {
      result = result.filter((t) => filterCategory.includes(t.category));
    }

    // Priority filter
    if (!filterPriority.includes('All') && filterPriority.length > 0) {
      result = result.filter((t) => filterPriority.includes(t.priority));
    }

    // Search query
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.studentName.toLowerCase().includes(q) ||
          t.studentEmail.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.message.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'Latest') {
      // keep original order or by id
    } else if (sortBy === 'Oldest') {
      result.reverse();
    } else if (sortBy === 'High Priority') {
      result.sort((a, b) => (a.priority === 'High' ? -1 : b.priority === 'High' ? 1 : 0));
    }

    return result;
  }, [ticketsList, filterStatus, filterCategory, filterPriority, filterSearch, sortBy]);

  // Handle status checkbox toggle
  const toggleStatusCheckbox = (statusName: string) => {
    if (statusName === 'All') {
      setFilterStatus(['All']);
      return;
    }
    setFilterStatus((prev) => {
      const withoutAll = prev.filter((s) => s !== 'All');
      if (withoutAll.includes(statusName)) {
        const next = withoutAll.filter((s) => s !== statusName);
        return next.length === 0 ? ['All'] : next;
      } else {
        return [...withoutAll, statusName];
      }
    });
  };

  // Handle category checkbox toggle
  const toggleCategoryCheckbox = (catName: string) => {
    setFilterCategory((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  // Handle priority checkbox toggle
  const togglePriorityCheckbox = (prioName: string) => {
    if (prioName === 'All') {
      setFilterPriority(['All']);
      return;
    }
    setFilterPriority((prev) => {
      const withoutAll = prev.filter((p) => p !== 'All');
      if (withoutAll.includes(prioName)) {
        const next = withoutAll.filter((p) => p !== prioName);
        return next.length === 0 ? ['All'] : next;
      } else {
        return [...withoutAll, prioName];
      }
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterSearch('');
    setFilterStatus(['All']);
    setFilterCategory([]);
    setFilterPriority(['All']);
    showToast('Filters reset.');
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!activeTicket || isWorking) return;
    const target = activeTicket;
    setIsWorking(true);
    try {
      const status =
        newStatus === 'In Progress'
          ? 'pending'
          : (newStatus.toLowerCase() as 'open' | 'resolved' | 'closed');
      const result = await api.updateSupportTicket(target.id, { status });
      if (!result.success) {
        showToast(result.error || 'Status update failed.', true);
        return;
      }
      setTicketsList((prev) =>
        prev.map((t) => (t.id === target.id ? { ...t, status: newStatus } : t))
      );
      showToast(`Updated ticket ${target.ticketNumber} to ${newStatus}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.', true);
    } finally {
      setIsWorking(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeTicket || isWorking) return;
    const targetId = activeTicket.id;
    const body = replyText.trim();
    const internal = composerTab === 'Internal Note';
    setIsWorking(true);
    try {
      const result = await api.sendSupportTicketMessage(targetId, body, internal);
      if (!result.success || !result.message) {
        showToast(result.error || 'Message was not saved.', true);
        return;
      }
      const message = supportMessageToChat(result.message);
      setTicketsList((prev) =>
        prev.map((t) => (t.id === targetId ? { ...t, messages: [...t.messages, message] } : t))
      );
      setReplyText('');
      showToast(
        internal
          ? 'Internal note saved. Only support staff can see it.'
          : 'Reply saved to the student portal.'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Message delivery failed.', true);
    } finally {
      setIsWorking(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWorking) return;
    if (!newStudentName.trim() || !newSubject.trim() || !newMessage.trim()) {
      showToast('Name, subject, and message are required.', true);
      return;
    }
    const categories: Record<TicketCategory, SupportTicketItem['category']> = {
      'Payment Issue': 'Payment Issue',
      Subscription: 'Subscription Issue',
      'Technical Issue': 'Technical Issue',
      'Content Related': 'Test Issue',
      'Account Related': 'Account Issue',
      'Refund Request': 'Payment Issue',
      Other: 'Other',
    };
    setIsWorking(true);
    try {
      const result = await api.createSupportTicket({
        studentName: newStudentName.trim(),
        studentEmail: newStudentEmail.trim(),
        subject: newSubject.trim(),
        issue: newMessage.trim(),
        category: categories[newCategory],
        priority: newPriority.toLowerCase() as 'high' | 'medium' | 'low',
        status: 'open',
      });
      if (!result.success || !result.ticket) {
        showToast(result.error || 'Ticket creation was not confirmed.', true);
        return;
      }
      const saved = mapAdminSupportTicket(result.ticket);
      setTicketsList((prev) => [saved, ...prev]);
      setSelectedTicketId(saved.id);
      setIsCreateModalOpen(false);
      setNewStudentName('');
      setNewStudentEmail('');
      setNewSubject('');
      setNewMessage('');
      showToast(`Created ticket ${saved.ticketNumber}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ticket creation failed.', true);
    } finally {
      setIsWorking(false);
    }
  };

  return {
    pageLoading,
    ticketsList,
    setTicketsList,
    selectedTicketId,
    setSelectedTicketId,
    filterSearch,
    setFilterSearch,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filterPriority,
    setFilterPriority,
    sortBy,
    setSortBy,
    composerTab,
    setComposerTab,
    replyText,
    setReplyText,
    isStatusDropdownOpen,
    setIsStatusDropdownOpen,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    isCreateModalOpen,
    setIsCreateModalOpen,
    newStudentName,
    setNewStudentName,
    newStudentEmail,
    setNewStudentEmail,
    newSubject,
    setNewSubject,
    newMessage,
    setNewMessage,
    newCategory,
    setNewCategory,
    newPriority,
    setNewPriority,
    toastMessage,
    setToastMessage,
    toastError,
    setToastError,
    isWorking,
    showToast,
    activeTicket,
    filteredTickets,
    toggleStatusCheckbox,
    toggleCategoryCheckbox,
    togglePriorityCheckbox,
    handleResetFilters,
    handleUpdateStatus,
    handleSendReply,
    handleCreateSubmit,
  };
}

export type AdminSupportState = ReturnType<typeof useAdminSupport>;

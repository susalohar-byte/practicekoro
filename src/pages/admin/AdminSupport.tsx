import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { useAdminSupport } from './support/useAdminSupport';
import { SupportToast } from './support/SupportToast';
import { SupportPageHeader } from './support/SupportPageHeader';
import { SupportKpiCards } from './support/SupportKpiCards';
import { SupportFiltersSidebar } from './support/SupportFiltersSidebar';
import { SupportTicketList } from './support/SupportTicketList';
import { SupportTicketDetailsPanel } from './support/SupportTicketDetailsPanel';
import { CreateSupportTicketModal } from './support/CreateSupportTicketModal';
export type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  ChatMessage,
  AttachmentItem,
  TicketRecord,
} from './support/supportTypes';
export { supportMessageToChat, mapAdminSupportTicket } from './support/supportMapping';

// ============================================================================
// MAIN COMPONENT: ADMIN SUPPORT
// ============================================================================

export const AdminSupport: React.FC = () => {
  const supportState = useAdminSupport();
  const { pageLoading } = supportState;

  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      <SupportToast supportState={supportState} />

      {/* ==================================================================== */}
      {/* 1. HEADER & TOP ACTIONS                                              */}
      {/* ==================================================================== */}
      <SupportPageHeader supportState={supportState} />

      {/* ==================================================================== */}
      {/* 2. FIVE SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <SupportKpiCards supportState={supportState} />

      {/* ==================================================================== */}
      {/* 3. THREE-COLUMN MAIN LAYOUT                                          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMN 1: FILTERS SIDEBAR (lg:col-span-3) */}
        <SupportFiltersSidebar supportState={supportState} />

        {/* COLUMN 2: TICKETS LIST (lg:col-span-5) */}
        <SupportTicketList supportState={supportState} />

        {/* COLUMN 3: TICKET DETAILS & CONVERSATION PANEL (lg:col-span-4) */}
        <SupportTicketDetailsPanel supportState={supportState} />
      </div>

      {/* ==================================================================== */}
      {/* 4. MODAL: CREATE NEW TICKET                                          */}
      {/* ==================================================================== */}
      <CreateSupportTicketModal supportState={supportState} />
    </div>,
    { label: 'Loading support…', variant: 'detail' }
  );
};

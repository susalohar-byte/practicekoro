import type { TicketCategory, TicketPriority, TicketStatus } from './supportTypes';

// Category Badge Helper
export const getCategoryBadgeClass = (category: TicketCategory) => {
  switch (category) {
    case 'Payment Issue':
      return 'bg-[#FEE2E2] text-[#DC2626] border border-rose-200/80';
    case 'Subscription':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border border-blue-200/80';
    case 'Content Related':
      return 'bg-[#EDE9FE] text-[#7C3AED] border border-purple-200/80';
    case 'Account Related':
      return 'bg-[#E0F2FE] text-[#0284C7] border border-sky-200/80';
    case 'Refund Request':
      return 'bg-[#F3E8FF] text-[#9333EA] border border-purple-200/80';
    case 'Technical Issue':
      return 'bg-[#E0F2FE] text-[#0284C7] border border-sky-200/80';
    case 'Other':
    default:
      return 'bg-[#DCFCE7] text-[#15803D] border border-emerald-200/80';
  }
};

// Status Badge Helper
export const getStatusBadgeClass = (status: TicketStatus) => {
  switch (status) {
    case 'Resolved':
      return 'bg-[#DCFCE7] text-[#15803D] border border-emerald-200/80';
    case 'In Progress':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border border-blue-200/80';
    case 'Open':
      return 'bg-[#FEE2E2] text-[#DC2626] border border-rose-200/80';
    case 'Closed':
      return 'bg-slate-100 text-slate-600 border border-slate-200/80';
  }
};

// Priority Badge Helper
export const getPriorityBadgeClass = (priority: TicketPriority) => {
  switch (priority) {
    case 'High':
      return 'bg-[#FEF3C7] text-[#B45309] border border-amber-200/80';
    case 'Medium':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border border-blue-200/80';
    case 'Low':
      return 'bg-slate-100 text-slate-600 border border-slate-200/80';
  }
};

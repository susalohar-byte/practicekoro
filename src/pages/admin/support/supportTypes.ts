// ============================================================================
// DATA TYPES & INTERFACES
// ============================================================================

export type TicketCategory =
  | 'Payment Issue'
  | 'Subscription'
  | 'Technical Issue'
  | 'Content Related'
  | 'Account Related'
  | 'Refund Request'
  | 'Other';

export type TicketPriority = 'High' | 'Medium' | 'Low';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface ChatMessage {
  id: string;
  sender: 'student' | 'support' | 'internal_note';
  senderName: string;
  avatarText: string;
  avatarBgColor: string;
  time: string;
  message: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'pdf';
  url?: string;
}

export interface TicketRecord {
  id: string;
  ticketNumber: string; // e.g. '#PKT-1048'
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  avatarText: string;
  avatarBgColor: string;
  subject: string;
  excerpt: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  dateStr: string;
  channel: string;
  attachments?: AttachmentItem[];
  messages: ChatMessage[];
}

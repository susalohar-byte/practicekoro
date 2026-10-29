import type { SupportTicketItem, SupportTicketMessage } from '@/types';
import type { ChatMessage, TicketCategory, TicketRecord, TicketStatus } from './supportTypes';

export function supportMessageToChat(m: SupportTicketMessage): ChatMessage {
  return {
    id: m.id,
    sender: m.authorKind,
    senderName: m.authorName,
    avatarText: m.authorKind === 'internal_note' ? 'N' : 'S',
    avatarBgColor: 'bg-blue-600 text-white',
    time: new Date(m.createdAt).toLocaleString('en-GB'),
    message: m.body,
  };
}
export function mapAdminSupportTicket(t: SupportTicketItem): TicketRecord {
  const raw = t.category.toLowerCase();
  const category: TicketCategory = raw.includes('subscription')
    ? 'Subscription'
    : raw.includes('pay')
      ? 'Payment Issue'
      : raw.includes('account')
        ? 'Account Related'
        : raw.includes('test') || raw.includes('tech')
          ? 'Technical Issue'
          : 'Other';
  const status: TicketStatus =
    t.status === 'pending'
      ? 'In Progress'
      : t.status === 'closed'
        ? 'Closed'
        : t.status === 'resolved'
          ? 'Resolved'
          : 'Open';
  const dateStr = new Date(t.createdAt).toLocaleString('en-GB');
  return {
    id: t.id,
    ticketNumber: `#PKT-${t.id.slice(0, 8)}`,
    studentName: t.studentName,
    studentEmail: t.studentEmail,
    studentPhone: 'Unavailable',
    avatarText: t.studentName.slice(0, 2).toUpperCase(),
    avatarBgColor: 'bg-blue-100 text-blue-600',
    subject: t.subject,
    excerpt: t.issue.slice(0, 60),
    message: t.issue,
    category,
    priority:
      t.priority === 'urgent' || t.priority === 'high'
        ? 'High'
        : t.priority === 'low'
          ? 'Low'
          : 'Medium',
    status,
    dateStr,
    channel: 'Student Portal',
    messagesLoaded: t.messages !== undefined,
    messages: [
      {
        id: `initial-${t.id}`,
        sender: 'student',
        senderName: t.studentName,
        avatarText: t.studentName.slice(0, 2),
        avatarBgColor: 'bg-blue-100',
        time: dateStr,
        message: t.issue,
      },
      ...(t.messages || []).map(supportMessageToChat),
    ],
  };
}

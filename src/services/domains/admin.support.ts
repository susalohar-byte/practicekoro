import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localSupportTickets } from '@/services/domains/localStore';
import { loadAllPages } from '@/utils/loadAllPages';
import type { SupportTicketItem, SupportTicketMessage } from '@/types';
import type { Tables } from '@/types/database.generated';

/** The `support_ticket_messages` columns in `SUPPORT_MESSAGE_COLUMNS`. */
type SupportMessageRow = Omit<Tables<'support_ticket_messages'>, 'author_id'>;
/** The `support_tickets` columns in `SUPPORT_TICKET_COLUMNS`, optionally with its messages. */
type SupportTicketRow = Tables<'support_tickets'> & {
  support_ticket_messages?: SupportMessageRow[] | null;
};

export const mapSupportMessage = (d: SupportMessageRow): SupportTicketMessage => ({
  id: d.id,
  ticketId: d.ticket_id,
  authorName: d.author_name,
  authorKind: d.author_kind as SupportTicketMessage['authorKind'],
  body: d.body,
  createdAt: d.created_at,
});
export const mapSupportTicket = (d: SupportTicketRow): SupportTicketItem => ({
  id: d.id,
  userId: d.user_id || undefined,
  studentName: d.student_name || 'Student',
  studentEmail: d.student_email || '',
  subject: d.subject,
  issue: d.issue,
  category: d.category as SupportTicketItem['category'],
  priority: d.priority as SupportTicketItem['priority'],
  status: d.status as SupportTicketItem['status'],
  assignedTo: d.assigned_to || undefined,
  resolutionNotes: d.resolution_notes || undefined,
  createdAt: d.created_at,
  updatedAt: d.updated_at,
  messages: (d.support_ticket_messages || [])
    .map(mapSupportMessage)
    .sort((a: SupportTicketMessage, b: SupportTicketMessage) =>
      a.createdAt.localeCompare(b.createdAt)
    ),
});
const SUPPORT_TICKET_COLUMNS =
  'id, user_id, student_name, student_email, subject, issue, category, priority, status, ' +
  'assigned_to, resolution_notes, created_at, updated_at';
const SUPPORT_MESSAGE_COLUMNS = 'id, ticket_id, author_name, author_kind, body, created_at';

/** How many of the newest tickets the admin inbox loads. */
export const SUPPORT_TICKETS_LIMIT = 500;

/**
 * Newest admin support tickets (explicit columns, newest first, capped). The conversation of a
 * ticket is not included: `messages` is left undefined and loaded with
 * `getSupportTicketMessages` when the ticket is opened.
 */
export async function getSupportTickets(
  options: { limit?: number } = {}
): Promise<SupportTicketItem[]> {
  if (!isSupabaseConfigured) return [...localSupportTickets];
  const limit = Math.max(1, Math.min(options.limit ?? SUPPORT_TICKETS_LIMIT, 1000));
  const { data, error } = await supabase
    .from('support_tickets')
    .select<string, SupportTicketRow>(SUPPORT_TICKET_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id')
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []).map((d) => ({
    ...mapSupportTicket(d),
    messages: undefined,
  }));
}

/** The messages (replies and internal notes) of one ticket, oldest first. */
export async function getSupportTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
  if (!isSupabaseConfigured) {
    return localSupportTickets.find((t) => t.id === ticketId)?.messages || [];
  }
  const { data, error } = await supabase
    .from('support_ticket_messages')
    .select<string, SupportMessageRow>(SUPPORT_MESSAGE_COLUMNS)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .order('id');
  if (error) throw new Error(error.message);
  return (data || []).map(mapSupportMessage);
}
export async function updateSupportTicket(
  id: string,
  updates: Partial<SupportTicketItem>
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.resolutionNotes !== undefined) payload.resolution_notes = updates.resolutionNotes;
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo || null;
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(payload)
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (error || data?.id !== id)
        return { success: false, error: error?.message || 'Ticket update was not confirmed.' };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed.' };
    }
  }
  const index = localSupportTickets.findIndex((t) => t.id === id);
  if (index < 0) return { success: false, error: 'Ticket not found.' };
  localSupportTickets[index] = {
    ...localSupportTickets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return { success: true };
}
export async function createSupportTicket(
  ticket: Omit<SupportTicketItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; error?: string; ticketId?: string; ticket?: SupportTicketItem }> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('create_support_ticket', {
        p_student_name: ticket.studentName,
        p_student_email: ticket.studentEmail,
        p_subject: ticket.subject,
        p_issue: ticket.issue,
        p_category: ticket.category || 'Other',
        p_priority: ticket.priority || 'medium',
        p_user_id: ticket.userId || null,
      });
      if (error || data?.success !== true || !data?.ticket?.id)
        return {
          success: false,
          error: error?.message || data?.error || 'Ticket creation was not confirmed.',
        };
      const saved = mapSupportTicket(data.ticket);
      return { success: true, ticketId: saved.id, ticket: saved };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Ticket creation failed.',
      };
    }
  }
  const saved: SupportTicketItem = {
    ...ticket,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localSupportTickets.unshift(saved);
  return { success: true, ticketId: saved.id, ticket: saved };
}
export async function sendSupportTicketMessage(
  ticketId: string,
  body: string,
  internal = false
): Promise<{ success: boolean; error?: string; message?: SupportTicketMessage }> {
  if (!body.trim()) return { success: false, error: 'A message is required.' };
  if (!isSupabaseConfigured)
    return { success: false, error: 'Message delivery requires a configured backend.' };
  try {
    const { data, error } = await supabase.rpc('send_support_ticket_message', {
      p_ticket_id: ticketId,
      p_body: body.trim(),
      p_internal: internal,
    });
    if (error || data?.success !== true || !data?.message?.id)
      return {
        success: false,
        error: error?.message || data?.error || 'Message save was not confirmed.',
      };
    return { success: true, message: mapSupportMessage(data.message) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Message delivery failed.',
    };
  }
}
export async function getStudentSupportTickets(userId?: string): Promise<SupportTicketItem[]> {
  if (!isSupabaseConfigured) return localSupportTickets.filter((t) => t.userId === userId);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) throw new Error('Sign in to view your tickets.');
  const actorId = authData.user.id;
  if (userId && userId !== actorId) throw new Error('You can only view your own support tickets.');
  return loadAllPages(async (limit, offset) => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, support_ticket_messages(*)')
      .eq('user_id', actorId)
      .order('created_at', { ascending: false })
      .order('id')
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return (data || []).map((d) => {
      const ticket = mapSupportTicket(d);
      return {
        ...ticket,
        messages: ticket.messages?.filter((m) => m.authorKind !== 'internal_note'),
      };
    });
  });
}
export const adminSupportApi = {
  getSupportTickets,
  getSupportTicketMessages,
  updateSupportTicket,
  createSupportTicket,
  getStudentSupportTickets,
  sendSupportTicketMessage,
};

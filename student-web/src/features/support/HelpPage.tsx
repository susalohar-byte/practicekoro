import { useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronDown, ChevronRight, Clock, Headphones, Inbox, Mail, MessageCircle, Phone, Send, Ticket, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fmtDate, fmtTime } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { useAuth } from '@/auth/AuthProvider';
import { qk, useProfile, useSupportContact, useTicketMessages, useTickets } from '@/hooks/queries';
import { createTicket, sendTicketMessage, ticketNumber } from '@/services/account';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DialogHero, Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import type { SupportTicket } from '@/types/models';

const CATEGORIES = ['Payment Issue', 'Subscription', 'Technical Issue', 'Content Related', 'Account Related', 'Other'];

const FAQS = [
  ['Where are my results saved?', 'Results, bookmarks and your profile are saved to your PracticeKoro account, so they appear on the web and in the mobile app.'],
  [
    "Why don't I see a state rank or cutoff?",
    'Ranks and cutoffs need everyone\'s results for the same test. They are shown only when that real data is available, never as estimates. Add your district in your profile to see district ranks.',
  ],
  ['How is my score calculated?', "Each correct answer adds that question's marks. If the test has negative marking, each wrong answer subtracts it. Skipped questions score zero."],
  ['What happens if I close the tab during a test?', 'Your answers are saved as you pick them. Open the same test again while time remains to continue; the timer keeps running on the server.'],
];

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === 'resolved') return { label: 'RESOLVED', cls: 'bg-[#DCFCE7] text-success' };
  if (s === 'pending' || s.includes('progress')) return { label: 'IN PROGRESS', cls: 'bg-[#FEF3C7] text-[#D97706]' };
  if (s === 'closed') return { label: 'CLOSED', cls: 'bg-[#F1F5F9] text-[#64748B]' };
  return { label: 'OPEN', cls: 'bg-[#DBEAFE] text-brand' };
}

function ContactRow({ icon, color, title, subtitle, href, badge, onClick }: { icon: ReactNode; color: string; title: string; subtitle: string; href?: string; badge?: ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl [&>svg]:h-[22px] [&>svg]:w-[22px]" style={{ background: `${color}1F`, color }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[14px] font-semibold text-ink">{title}</span>
        <span className="block truncate text-[12px] text-muted">{subtitle}</span>
      </span>
      {badge}
      <ChevronRight className="h-5 w-5 text-faint" />
    </>
  );
  const cls = 'flex min-h-[64px] w-full items-center gap-3.5 px-1 py-2.5 hover:bg-surface/60';
  return href ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function CreateTicketModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (t: SupportTicket) => void }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const toast = useToast();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [issue, setIssue] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      subject: subject.trim() ? null : 'Please enter a short subject',
      issue: issue.trim().length < 5 ? 'Please describe the issue in at least 5 characters' : null,
    };
    setErrors(next);
    if (next.subject || next.issue || !user) return;
    setBusy(true);
    try {
      const t = await createTicket({
        userId: user.id,
        name: profile?.fullName || 'Student',
        email: profile?.email || user.email || '',
        subject,
        issue,
        category,
      });
      setSubject('');
      setIssue('');
      onCreated(t);
    } catch (err) {
      toast(`Failed to submit ticket: ${friendlyError(err)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Raise a Support Ticket" size="md">
      <p className="-mt-2 mb-4 text-[12.5px] text-muted">Submit your issue directly to the admin support desk.</p>
      <form onSubmit={submit} noValidate>
        <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">Category</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={cn('rounded-full px-3 py-1.5 text-[13px]', category === c ? 'bg-primary font-bold text-white' : 'bg-[#F1F5F9] text-ink-soft')}>
              {c}
            </button>
          ))}
        </div>
        <label className="mb-3.5 block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Payment deducted but Pro not active" className={cn('h-12 w-full rounded-xl border bg-[#F8FAFC] px-3.5 text-[14.5px] outline-none focus:border-primary', errors.subject ? 'border-danger' : 'border-line')} />
          {errors.subject && <span className="mt-1 block text-[12.5px] text-danger">{errors.subject}</span>}
        </label>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Description / Details</span>
          <textarea value={issue} onChange={(e) => setIssue(e.target.value)} rows={4} placeholder="Provide detailed information about the problem..." className={cn('w-full rounded-xl border bg-[#F8FAFC] px-3.5 py-3 text-[14.5px] outline-none focus:border-primary', errors.issue ? 'border-danger' : 'border-line')} />
          {errors.issue && <span className="mt-1 block text-[12.5px] text-danger">{errors.issue}</span>}
        </label>
        <Button type="submit" block size="lg" loading={busy} icon={<Send className="h-4 w-4" />}>
          Submit Ticket
        </Button>
      </form>
    </Modal>
  );
}

function TicketDetail({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const st = statusBadge(ticket.status);
  const conversation = useTicketMessages(ticket.id);
  const messages = conversation.data ?? [];

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !user) return;
    setBusy(true);
    try {
      await sendTicketMessage({ ticketId: ticket.id, body });
      setBody('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.ticketMessages(ticket.id) }),
        queryClient.invalidateQueries({ queryKey: qk.tickets(user.id) }),
      ]);
    } catch (err) {
      toast(`Failed to send message: ${friendlyError(err)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="lg" title={<span className="flex items-center gap-2">{ticketNumber(ticket.id)} <span className={cn('rounded px-1.5 py-0.5 text-[10.5px] font-bold', st.cls)}>{st.label}</span></span>}>
      <p className="text-[15px] font-bold text-ink">{ticket.subject}</p>
      <p className="text-[11.5px] text-muted">
        Created on {fmtDate(ticket.createdAt)}, {fmtTime(ticket.createdAt)}
      </p>
      <div className="mt-4 rounded-xl border border-line bg-[#F8FAFC] p-3.5">
        <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-bold text-primary">{ticket.category}</span>
        <p className="mt-2 whitespace-pre-line text-[13.5px] text-ink-soft">{ticket.issue}</p>
      </div>
      {ticket.resolutionNotes && (
        <div className="mt-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3.5">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#166534]">
            <BadgeCheck className="h-4 w-4" /> Resolution Note from Admin
          </p>
          <p className="mt-1 whitespace-pre-line text-[13px] text-[#14532D]">{ticket.resolutionNotes}</p>
        </div>
      )}
      {conversation.isLoading && (
        <div className="mt-5 flex justify-center">
          <Spinner />
        </div>
      )}
      {conversation.isError && <p className="mt-5 text-[13px] text-muted">The conversation could not be loaded.</p>}
      {messages.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[13px] font-bold text-ink">Conversation</p>
          <div className="space-y-2.5">
            {messages.map((m) => {
              const mine = m.authorKind === 'student';
              return (
                <div key={m.id} className={cn('max-w-[78%] rounded-xl border px-3 py-2', mine ? 'ml-auto border-primary/20 bg-primary-soft' : 'border-[#E2E8F0] bg-[#F1F5F9]')}>
                  <p className="text-[11.5px] font-bold text-[#334155]">{mine ? 'You' : `Support Admin (${m.authorName})`}</p>
                  <p className="whitespace-pre-line text-[13.5px] text-ink">{m.body}</p>
                  <p className="mt-0.5 text-right text-[10.5px] text-muted">{fmtTime(m.createdAt)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {ticket.status.toLowerCase() !== 'closed' && (
        <form onSubmit={send} className="mt-5 flex gap-2">
          <label className="flex-1">
            <span className="sr-only">Message to support</span>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              placeholder="Type your message to support..."
              className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] outline-none focus:border-primary"
            />
          </label>
          <Button type="submit" aria-label="Send" loading={busy} disabled={!body.trim()} icon={!busy && <Send className="h-4 w-4" />} />
        </form>
      )}
    </Modal>
  );
}

export default function HelpPage() {
  const { user } = useAuth();
  const contact = useSupportContact();
  const tickets = useTickets();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<SupportTicket | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [faq, setFaq] = useState<number | null>(null);
  const c = contact.data;
  const openTicket = (tickets.data ?? []).find((t) => t.id === openId) ?? null;
  const wa = c?.whatsapp ? c.whatsapp.replace(/\D/g, '') : '';
  const waNumber = wa.length === 10 ? `91${wa}` : wa;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Help & Support" back="/profile" />
      <Card className="flex items-center gap-3.5 border-transparent bg-primary-soft p-4 shadow-none">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Headphones className="h-6 w-6" />
        </span>
        <span>
          <span className="block text-[14px] font-semibold text-ink">We are here to help</span>
          <span className="block text-[12px] text-muted">Raise a ticket, reach via WhatsApp or Email for instant resolution.</span>
        </span>
      </Card>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <section>
          <h2 className="mb-2.5 mt-7 text-[16.5px] font-bold text-ink">Contact us</h2>
          <Card className="divide-y divide-line px-3">
            <ContactRow
              icon={<Ticket />}
              color="#6366F1"
              title="Raise a Support Ticket"
              subtitle="Submit query & track status directly with admin"
              badge={<span className="rounded-md bg-[#6366F1]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#4F46E5]">TICKET DESK</span>}
              onClick={() => setCreateOpen(true)}
            />
            {c?.email && <ContactRow icon={<Mail />} color="#1F48E8" title="Email support" subtitle={c.email} href={`mailto:${c.email}?subject=${encodeURIComponent('PracticeKoro Help & Support')}`} />}
            {waNumber && (
              <ContactRow
                icon={<MessageCircle />}
                color="#25D366"
                title="WhatsApp support"
                subtitle={`${c?.whatsapp} • Instant Chat`}
                badge={<span className="rounded-md bg-[#25D366]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#1E7E34]">FAST REPLY</span>}
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Hello PracticeKoro Support, I need help with the app.')}`}
              />
            )}
            {c?.phone && <ContactRow icon={<Phone />} color="#0284C7" title="Helpline call" subtitle={c.phone} href={`tel:${c.phone.replace(/\s/g, '')}`} />}
          </Card>
          {c?.hours && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-muted">
              <Clock className="h-3.5 w-3.5" /> Support Hours: {c.hours}
            </p>
          )}

          <h2 className="mb-2.5 mt-7 text-[16.5px] font-bold text-ink">Common questions</h2>
          <Card className="divide-y divide-line px-4">
            {FAQS.map(([q, a], i) => (
              <div key={q}>
                <button type="button" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? null : i)} className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-[14px] font-semibold text-ink">
                  {q}
                  <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted transition-transform', faq === i && 'rotate-180')} />
                </button>
                {faq === i && <p className="pb-3.5 text-[13.5px] leading-relaxed text-ink-soft">{a}</p>}
              </div>
            ))}
          </Card>
        </section>

        <section>
          <h2 className="mb-2.5 mt-7 text-[16.5px] font-bold text-ink">My Support Tickets</h2>
          {tickets.isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : tickets.isError ? (
            <Card className="p-4 text-[13px] text-muted">Your tickets could not be loaded.</Card>
          ) : (tickets.data ?? []).length === 0 ? (
            <Card className="flex flex-col items-center p-6 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] text-muted">
                <Inbox className="h-5 w-5" />
              </span>
              <p className="mt-2 text-[13px] font-bold text-ink">No support tickets yet</p>
              <p className="text-[11.5px] text-muted">Need help? Raise a ticket to track resolution.</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setCreateOpen(true)}>
                Raise Ticket
              </Button>
            </Card>
          ) : (
            <Card className="divide-y divide-line">
              {(tickets.data ?? []).map((t) => {
                const st = statusBadge(t.status);
                return (
                  <button key={t.id} type="button" onClick={() => setOpenId(t.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface/60">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366F1]/10 text-[#6366F1]">
                      <Ticket className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[12px] font-extrabold text-[#4F46E5]">{ticketNumber(t.id)}</span>
                        <span className={cn('rounded px-1.5 py-0.5 text-[10.5px] font-bold', st.cls)}>{st.label}</span>
                      </span>
                      <span className="block truncate text-[13px] font-bold text-ink">{t.subject}</span>
                      <span className="block text-[11px] text-muted">
                        {t.category} • {fmtDate(t.createdAt)}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-faint" />
                  </button>
                );
              })}
            </Card>
          )}
        </section>
      </div>

      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(t) => {
          setCreateOpen(false);
          setCreated(t);
          if (user) void queryClient.invalidateQueries({ queryKey: qk.tickets(user.id) });
        }}
      />
      <Modal open={!!created} onClose={() => setCreated(null)} hideClose size="sm">
        <DialogHero
          icon={<CheckCircle2 />}
          tone="success"
          title="Ticket Created Successfully"
          message={`Your ticket ${created ? ticketNumber(created.id) : ''} has been received by our support team. We will resolve it promptly.`}
        />
        <Button block className="mt-6" onClick={() => setCreated(null)}>
          Got it
        </Button>
      </Modal>
      {openTicket && <TicketDetail ticket={openTicket} onClose={() => setOpenId(null)} />}
    </div>
  );
}

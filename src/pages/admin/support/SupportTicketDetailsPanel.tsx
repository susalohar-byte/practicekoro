import {
  MessageSquare,
  ChevronDown,
  MoreHorizontal,
  Phone,
  Paperclip,
  Image as ImageIcon,
  Link as LinkIcon,
  Smile,
  Download,
  FileText,
  Check,
  X,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TicketStatus } from './supportTypes';
import { getCategoryBadgeClass, getPriorityBadgeClass, getStatusBadgeClass } from './supportBadges';
import type { AdminSupportState } from './useAdminSupport';

export interface SupportTicketDetailsPanelProps {
  supportState: AdminSupportState;
}

export function SupportTicketDetailsPanel({ supportState }: SupportTicketDetailsPanelProps) {
  const {
    activeTicket,
    filteredTickets,
    isStatusDropdownOpen,
    setIsStatusDropdownOpen,
    handleUpdateStatus,
    setSelectedTicketId,
    showToast,
    composerTab,
    setComposerTab,
    replyText,
    setReplyText,
    handleSendReply,
    isWorking,
  } = supportState;
  return (
    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4">
      {!activeTicket ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No Ticket Selected</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {filteredTickets.length === 0
              ? 'No support tickets found in system.'
              : 'Select a support ticket from the list to view its messages and details.'}
          </p>
        </div>
      ) : (
        <>
          {/* Header Line */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-sm text-slate-900">{activeTicket.ticketNumber}</span>

            <div className="flex items-center gap-2">
              {/* Status Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsStatusDropdownOpen(!isStatusDropdownOpen);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors',
                    getStatusBadgeClass(activeTicket.status)
                  )}
                >
                  <span>{activeTicket.status}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isStatusDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                    {(['Open', 'In Progress', 'Resolved', 'Closed'] as TicketStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          handleUpdateStatus(st);
                          setIsStatusDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                      >
                        <span>{st}</span>
                        {activeTicket.status === st && (
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedTicketId('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ticket Subject Title */}
          <h3 className="font-bold text-base text-slate-900 leading-snug">
            {activeTicket.subject}
          </h3>

          {/* Student Info Card */}
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                  activeTicket.avatarBgColor
                )}
              >
                {activeTicket.avatarText}
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block leading-tight">
                  {activeTicket.studentName}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {activeTicket.studentEmail}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{activeTicket.studentPhone}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">{activeTicket.dateStr}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {activeTicket.channel}
              </span>
            </div>
          </div>

          {/* Badges line */}
          <div className="flex items-center gap-2 pt-1">
            <span
              className={cn(
                'px-2.5 py-0.5 rounded text-[11px] font-semibold',
                getCategoryBadgeClass(activeTicket.category)
              )}
            >
              {activeTicket.category}
            </span>
            <span
              className={cn(
                'px-2.5 py-0.5 rounded text-[11px] font-semibold',
                getPriorityBadgeClass(activeTicket.priority)
              )}
            >
              {activeTicket.priority} Priority
            </span>
          </div>

          {/* Original Message Description */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-900 block">Message</span>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              {activeTicket.message}
            </p>
          </div>

          {/* Attachments Section */}
          {activeTicket.attachments && activeTicket.attachments.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {activeTicket.attachments.map((att) => (
                <div
                  key={att.id}
                  className="border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {att.type === 'image' ? (
                      <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-800 block truncate">
                        {att.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{att.size}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => showToast(`Downloaded ${att.name}`)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Conversation Thread */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {activeTicket.messages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0',
                        msg.avatarBgColor
                      )}
                    >
                      {msg.avatarText}
                    </div>
                    <span className="font-bold text-slate-900">{msg.senderName}</span>
                    <span className="text-slate-400 text-[10px]">{msg.time}</span>
                  </div>

                  {msg.sender === 'support' && (
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div
                  className={cn(
                    'text-xs leading-relaxed p-3 rounded-xl border',
                    msg.sender === 'support'
                      ? 'bg-slate-50 border-slate-100 text-slate-700'
                      : msg.sender === 'internal_note'
                        ? 'bg-amber-50/70 border-amber-200/60 text-amber-900'
                        : 'bg-white border-slate-100 text-slate-700'
                  )}
                >
                  <p className="whitespace-pre-line">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Composer / Reply Section */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            {/* Tabs: Reply | Internal Note */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setComposerTab('Reply')}
                className={cn(
                  'px-3.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                  composerTab === 'Reply'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Reply
              </button>
              <button
                onClick={() => setComposerTab('Internal Note')}
                className={cn(
                  'px-3.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                  composerTab === 'Internal Note'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Internal Note
              </button>
            </div>

            {/* Input Box */}
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  composerTab === 'Reply'
                    ? 'Type your reply...'
                    : 'Type private note for admin team...'
                }
                className="w-full p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
              />

              {/* Bottom Toolbar */}
              <div className="bg-slate-50/60 border-t border-slate-100 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <button
                    type="button"
                    onClick={() => showToast('Attachment picker opened')}
                    className="hover:text-slate-700 p-1 rounded cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Image uploader opened')}
                    className="hover:text-slate-700 p-1 rounded cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Insert link')}
                    className="hover:text-slate-700 p-1 rounded cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Emoji picker')}
                    className="hover:text-slate-700 p-1 rounded cursor-pointer"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={isWorking || !replyText.trim()}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Send Reply</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

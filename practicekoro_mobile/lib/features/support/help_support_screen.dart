import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/components/ui.dart';
import '../../data/models/support_ticket_model.dart';
import '../../data/repositories/support_repository.dart';
import 'ticket_sheet.dart';

/// Support channels configured from Supabase (Tickets, WhatsApp, Email, Phone)
/// plus answers to common questions about how the app works.
class HelpSupportScreen extends ConsumerWidget {
  const HelpSupportScreen({super.key});

  static const _faqs = [
    (
      'Where are my results saved?',
      'Results, bookmarks and your profile are saved on this phone. They stay '
          'until you clear the app data or uninstall the app.',
    ),
    (
      'Why don\'t I see a state rank or cutoff?',
      'Ranks and cutoffs need everyone\'s results for the same test. They are '
          'shown only when that real data is available, never as estimates.',
    ),
    (
      'How is my score calculated?',
      'Each correct answer adds that question\'s marks. If the test has '
          'negative marking, each wrong answer subtracts it. Skipped questions '
          'score zero.',
    ),
    (
      'How do I change the question language?',
      'Open Settings and choose বাংলা (Bengali) or English.',
    ),
  ];

  void _openCreateTicket(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const CreateTicketSheet(),
    );
  }

  void _openTicketDetail(BuildContext context, SupportTicketModel ticket) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => TicketDetailSheet(ticket: ticket),
    );
  }

  Future<void> _openWhatsApp(BuildContext context, String rawNumber) async {
    final digits = rawNumber.replaceAll(RegExp(r'[^0-9]'), '');
    final phone = (digits.startsWith('91') || digits.length > 10)
        ? digits
        : '91$digits';
    final uri = Uri.parse(
      'https://wa.me/$phone?text=${Uri.encodeComponent('Hello PracticeKoro Support, I need help with the app.')}',
    );

    final opened = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    ).catchError((_) => false);

    if (!context.mounted) return;
    if (!opened) {
      await Clipboard.setData(ClipboardData(text: rawNumber));
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Could not launch WhatsApp. WhatsApp number copied: $rawNumber',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _email(BuildContext context, String emailAddress) async {
    final opened = await launchUrl(
      Uri(
        scheme: 'mailto',
        path: emailAddress,
        query: 'subject=PracticeKoro Help & Support',
      ),
      mode: LaunchMode.externalApplication,
    ).catchError((_) => false);

    if (!context.mounted) return;
    if (!opened) {
      await Clipboard.setData(ClipboardData(text: emailAddress));
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Could not open your email app. Email copied: $emailAddress',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _callPhone(BuildContext context, String phone) async {
    final opened = await launchUrl(
      Uri(scheme: 'tel', path: phone),
      mode: LaunchMode.externalApplication,
    ).catchError((_) => false);

    if (!context.mounted) return;
    if (!opened) {
      await Clipboard.setData(ClipboardData(text: phone));
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Could not initiate call. Phone number copied: $phone',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final supportAsync = ref.watch(supportSettingsProvider);
    final settings =
        supportAsync.value ?? const SupportContactSettings();

    return UIPage(
      appBar: const UITitleBar('Help & Support', fallbackRoute: '/profile'),
      children: [
        UICard(
          color: UI.primarySoft,
          border: UI.primarySoft,
          raised: false,
          child: Row(
            children: [
              const UIIconBadge(Icons.support_agent_rounded, size: 48),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('We are here to help', style: UI.bodyStrong),
                    SizedBox(height: 2),
                    Text(
                      'Raise a ticket, reach via WhatsApp or Email for instant resolution.',
                      style: UI.caption,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const UISection('Contact us'),
        UIGroup(
          children: [
            // 1. Support Ticket Desk (directly linked to admin support)
            UIRow(
              icon: Icons.confirmation_number_rounded,
              iconColor: const Color(0xFF6366F1),
              title: 'Raise a Support Ticket',
              subtitle: 'Submit query & track status directly with admin',
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'TICKET DESK',
                  style: TextStyle(
                    color: Color(0xFF4F46E5),
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              onTap: () => _openCreateTicket(context),
            ),

            // 2. Email Support (always present as configured)
            UIRow(
              icon: Icons.mail_outline_rounded,
              iconColor: UI.primary,
              title: 'Email support',
              subtitle: settings.email,
              onTap: () => _email(context, settings.email),
            ),

            // 3. WhatsApp Support
            UIRow(
              icon: Icons.chat_rounded,
              iconColor: const Color(0xFF25D366),
              title: 'WhatsApp support',
              subtitle: '${settings.whatsapp} • Instant Chat',
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF25D366).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'FAST REPLY',
                  style: TextStyle(
                    color: Color(0xFF1E7E34),
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              onTap: () => _openWhatsApp(context, settings.whatsapp),
            ),

            // 4. Phone Helpline Call
            UIRow(
              icon: Icons.phone_outlined,
              iconColor: const Color(0xFF0284C7),
              title: 'Helpline call',
              subtitle: settings.phone,
              onTap: () => _callPhone(context, settings.phone),
            ),
          ],
        ),

        if (settings.hours.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: Row(
              children: [
                const Icon(
                  Icons.access_time_rounded,
                  size: 14,
                  color: UI.textSoft,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Support Hours: ${settings.hours}',
                    style: UI.caption.copyWith(
                      color: UI.textSoft,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),

        const SizedBox(height: 10),

        // My Support Tickets Section
        const UISection('My Support Tickets'),
        _TicketsSection(
          onOpenTicket: (ticket) => _openTicketDetail(context, ticket),
          onCreateTicket: () => _openCreateTicket(context),
        ),

        const SizedBox(height: 10),

        const UISection('Common questions'),
        UIGroup(
          children: [
            for (final (q, a) in _faqs)
              // Own Material so the tile's ink splash shows above the group card.
              Material(
                type: MaterialType.transparency,
                child: Theme(
                data: Theme.of(
                  context,
                ).copyWith(dividerColor: Colors.transparent),
                child: ExpansionTile(
                  tilePadding: const EdgeInsets.symmetric(horizontal: 4),
                  childrenPadding: const EdgeInsets.fromLTRB(4, 0, 4, 14),
                  expandedCrossAxisAlignment: CrossAxisAlignment.start,
                  title: Text(q, style: UI.bodyStrong),
                  children: [
                    Text(a, style: UI.body.copyWith(color: UI.textSoft)),
                  ],
                ),
              ),
              ),
          ],
        ),
      ],
    );
  }
}

class _TicketsSection extends ConsumerWidget {
  final ValueChanged<SupportTicketModel> onOpenTicket;
  final VoidCallback onCreateTicket;

  const _TicketsSection({
    required this.onOpenTicket,
    required this.onCreateTicket,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticketsAsync = ref.watch(studentTicketsProvider);

    return ticketsAsync.when(
      data: (tickets) {
        if (tickets.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: UI.line),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF1F5F9),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.inbox_outlined,
                    size: 22,
                    color: UI.muted,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'No support tickets yet',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: UI.text,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Need help? Raise a ticket to track resolution.',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: UI.muted,
                        ),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: onCreateTicket,
                  style: TextButton.styleFrom(
                    foregroundColor: UI.primary,
                    textStyle: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  child: const Text('Raise Ticket'),
                ),
              ],
            ),
          );
        }

        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: UI.line),
          ),
          child: Column(
            children: [
              for (int i = 0; i < tickets.length; i++) ...[
                if (i > 0) const Divider(height: 1, color: UI.line),
                InkWell(
                  onTap: () => onOpenTicket(tickets[i]),
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: const Color(0xFF6366F1).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.confirmation_number_outlined,
                            color: Color(0xFF6366F1),
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    tickets[i].ticketNumber,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF4F46E5),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  _StatusBadge(status: tickets[i].status),
                                ],
                              ),
                              const SizedBox(height: 3),
                              Text(
                                tickets[i].subject,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: UI.text,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${tickets[i].category} • ${DateFormat('dd MMM yyyy').format(tickets[i].createdAt.toLocal())}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: UI.muted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right_rounded,
                          color: UI.muted,
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      },
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(12),
          child: CircularProgressIndicator(strokeWidth: 2, color: UI.primary),
        ),
      ),
      error: (err, stack) => const SizedBox.shrink(),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;

    final s = status.toLowerCase();
    if (s == 'resolved') {
      bg = const Color(0xFFDCFCE7);
      fg = const Color(0xFF16A34A);
      label = 'Resolved';
    } else if (s == 'pending' || s == 'in progress') {
      bg = const Color(0xFFFEF3C7);
      fg = const Color(0xFFD97706);
      label = 'In Progress';
    } else if (s == 'closed') {
      bg = const Color(0xFFF1F5F9);
      fg = const Color(0xFF64748B);
      label = 'Closed';
    } else {
      bg = const Color(0xFFDBEAFE);
      fg = const Color(0xFF0158FC);
      label = 'Open';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }
}

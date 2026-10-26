import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/components/ui.dart';
import '../../data/models/support_ticket_model.dart';
import '../../data/repositories/profile_repository.dart';
import '../../data/repositories/support_repository.dart';

class CreateTicketSheet extends ConsumerStatefulWidget {
  const CreateTicketSheet({super.key});

  @override
  ConsumerState<CreateTicketSheet> createState() => _CreateTicketSheetState();
}

class _CreateTicketSheetState extends ConsumerState<CreateTicketSheet> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _issueController = TextEditingController();

  String _selectedCategory = 'Payment Issue';
  final String _priority = 'medium';
  bool _isSubmitting = false;

  final List<String> _categories = const [
    'Payment Issue',
    'Subscription',
    'Technical Issue',
    'Content Related',
    'Account Related',
    'Other',
  ];

  @override
  void dispose() {
    _subjectController.dispose();
    _issueController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final profile = ref.read(studentProfileProvider);
      final ticket = await ref
          .read(studentTicketsProvider.notifier)
          .submitTicket(
            subject: _subjectController.text.trim(),
            issue: _issueController.text.trim(),
            category: _selectedCategory,
            priority: _priority,
            studentName: profile.fullName.isNotEmpty ? profile.fullName : null,
            studentEmail: profile.email.isNotEmpty ? profile.email : null,
          );

      if (!mounted) return;
      Navigator.pop(context);

      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          contentPadding: const EdgeInsets.all(22),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: const BoxDecoration(
                  color: Color(0xFFDCFCE7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: Color(0xFF16A34A),
                  size: 32,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Ticket Created Successfully',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: UI.text,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Your ticket ${ticket.ticketNumber} has been received by our support team. We will resolve it promptly.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: UI.textSoft,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: UI.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Got it'),
                ),
              ),
            ],
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e is SupportTicketFailure ? e.toString() : 'Failed to submit ticket: $e',
          ),
          backgroundColor: UI.danger,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Raise a Support Ticket',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: UI.text,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: UI.muted),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Submit your issue directly to the admin support desk.',
                style: TextStyle(fontSize: 12.5, color: UI.muted),
              ),
              const SizedBox(height: 16),

              // Category selector
              const Text(
                'Category',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: UI.text,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final cat in _categories)
                    ChoiceChip(
                      label: Text(
                        cat,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: _selectedCategory == cat
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: _selectedCategory == cat
                              ? Colors.white
                              : UI.textSoft,
                        ),
                      ),
                      selected: _selectedCategory == cat,
                      selectedColor: UI.primary,
                      backgroundColor: const Color(0xFFF1F5F9),
                      onSelected: (val) {
                        if (val) setState(() => _selectedCategory = cat);
                      },
                    ),
                ],
              ),
              const SizedBox(height: 16),

              // Subject input
              const Text(
                'Subject',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: UI.text,
                ),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _subjectController,
                decoration: InputDecoration(
                  hintText: 'e.g. Payment deducted but Pro not active',
                  hintStyle: const TextStyle(fontSize: 13, color: UI.muted),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: UI.line),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: UI.line),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: UI.primary, width: 1.5),
                  ),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Please enter a short subject';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Description input
              const Text(
                'Description / Details',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: UI.text,
                ),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _issueController,
                maxLines: 4,
                decoration: InputDecoration(
                  hintText: 'Provide detailed information about the problem...',
                  hintStyle: const TextStyle(fontSize: 13, color: UI.muted),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: UI.line),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: UI.line),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: UI.primary, width: 1.5),
                  ),
                ),
                validator: (val) {
                  if (val == null || val.trim().length < 5) {
                    return 'Please describe the issue in at least 5 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // Submit button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: UI.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.send_rounded, size: 16),
                            SizedBox(width: 8),
                            Text(
                              'Submit Ticket',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class TicketDetailSheet extends ConsumerStatefulWidget {
  final SupportTicketModel ticket;

  const TicketDetailSheet({super.key, required this.ticket});

  @override
  ConsumerState<TicketDetailSheet> createState() => _TicketDetailSheetState();
}

class _TicketDetailSheetState extends ConsumerState<TicketDetailSheet> {
  final _replyController = TextEditingController();
  bool _isSending = false;
  late SupportTicketModel _ticket;

  @override
  void initState() {
    super.initState();
    _ticket = widget.ticket;
  }

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  Future<void> _sendReply() async {
    final text = _replyController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isSending = true);

    try {
      final profile = ref.read(studentProfileProvider);
      final msg = await const SupportRepository().sendTicketMessage(
        ticketId: _ticket.id,
        body: text,
        authorName: profile.fullName.isNotEmpty ? profile.fullName : 'Student',
      );

      if (!mounted) return;

      if (msg != null) {
        setState(() {
          _ticket = _ticket.copyWith(
            messages: [..._ticket.messages, msg],
          );
          _replyController.clear();
          _isSending = false;
        });
        ref.read(studentTicketsProvider.notifier).refresh();
      } else {
        setState(() => _isSending = false);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSending = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send message: $e')),
      );
    }
  }

  Color _statusColor(String status) {
    final s = status.toLowerCase();
    if (s == 'resolved') return const Color(0xFF16A34A);
    if (s == 'pending' || s == 'in progress') return const Color(0xFFD97706);
    if (s == 'closed') return const Color(0xFF64748B);
    return const Color(0xFF0158FC);
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(_ticket.status);

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    _ticket.ticketNumber,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: UI.text,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _ticket.displayStatus.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, color: UI.muted),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            _ticket.subject,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: UI.text,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Created on ${DateFormat('dd MMM yyyy, hh:mm a').format(_ticket.createdAt.toLocal())}',
            style: const TextStyle(fontSize: 11.5, color: UI.muted),
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: UI.line),
          const SizedBox(height: 12),

          // Message history / Ticket details
          Expanded(
            child: ListView(
              children: [
                // Original Issue Box
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: UI.line),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Original Issue',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              color: UI.muted,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: UI.primarySoft,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              _ticket.category,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: UI.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _ticket.issue,
                        style: const TextStyle(
                          fontSize: 13,
                          color: UI.text,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),

                if (_ticket.resolutionNotes != null &&
                    _ticket.resolutionNotes!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(
                              Icons.verified_rounded,
                              size: 16,
                              color: Color(0xFF16A34A),
                            ),
                            SizedBox(width: 6),
                            Text(
                              'Resolution Note from Admin',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF16A34A),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _ticket.resolutionNotes!,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF14532D),
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 16),
                if (_ticket.messages.isNotEmpty) ...[
                  const Text(
                    'Conversation',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: UI.text,
                    ),
                  ),
                  const SizedBox(height: 10),
                  for (final msg in _ticket.messages) ...[
                    Align(
                      alignment: msg.isFromAdmin
                          ? Alignment.centerLeft
                          : Alignment.centerRight,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.78,
                        ),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: msg.isFromAdmin
                              ? const Color(0xFFF1F5F9)
                              : UI.primarySoft,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: msg.isFromAdmin
                                ? const Color(0xFFE2E8F0)
                                : UI.primary.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  msg.isFromAdmin
                                      ? 'Support Admin (${msg.authorName})'
                                      : 'You',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: msg.isFromAdmin
                                        ? const Color(0xFF334155)
                                        : UI.primary,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  DateFormat('hh:mm a').format(msg.createdAt.toLocal()),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: UI.muted,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              msg.body,
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: UI.text,
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ],
            ),
          ),

          // Reply input box
          if (!_ticket.isClosed) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _replyController,
                    decoration: InputDecoration(
                      hintText: 'Type your message to support...',
                      hintStyle: const TextStyle(fontSize: 12.5, color: UI.muted),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: UI.line),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: UI.line),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  icon: _isSending
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send_rounded, size: 18),
                  style: IconButton.styleFrom(
                    backgroundColor: UI.primary,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: _isSending ? null : _sendReply,
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

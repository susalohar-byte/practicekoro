import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/components/ui.dart';

const supportEmail = 'support@practicekoro.com';

/// Support channels the app actually has (email) plus answers to common
/// questions about how the app works today.
class HelpSupportScreen extends StatelessWidget {
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

  Future<void> _email(BuildContext context) async {
    final opened = await launchUrl(
      Uri(
        scheme: 'mailto',
        path: supportEmail,
        query: 'subject=PracticeKoro help',
      ),
      mode: LaunchMode.externalApplication,
    ).catchError((_) => false);
    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open your email app.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
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
                      'Write to us with questions, feedback or a wrong answer you spotted.',
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
            UIRow(
              icon: Icons.mail_outline_rounded,
              title: 'Email support',
              subtitle: supportEmail,
              onTap: () => _email(context),
            ),
          ],
        ),
        const UISection('Common questions'),
        UIGroup(
          children: [
            for (final (q, a) in _faqs)
              Theme(
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
          ],
        ),
      ],
    );
  }
}

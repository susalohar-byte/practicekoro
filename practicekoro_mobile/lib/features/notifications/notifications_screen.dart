import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';

/// Notifications inbox. PracticeKoro notifications are addressed to signed-in
/// students, and the app has no sign-in yet, so there is nothing to list.
/// This screen never shows invented notifications.
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return UIPage(
      appBar: const UITitleBar('Notifications', fallbackRoute: '/home'),
      children: [
        const SizedBox(height: 24),
        UIMessage(
          icon: Icons.notifications_none_rounded,
          title: 'No notifications yet',
          message:
              'Test announcements and updates for your account will appear here.',
          actionLabel: 'Browse tests',
          onAction: () => context.go('/exams'),
        ),
      ],
    );
  }
}

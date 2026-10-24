import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/components/ui.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/profile_repository.dart';

/// Preference keys shared with the rest of the app (saved on this device).
const dailyReminderKey = 'daily_reminder';
const privacyPolicyUrl = 'https://practicekoro.online/privacy';
const appVersionLabel = 'PracticeKoro · Version 2.1.0';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _reminder = false;

  @override
  void initState() {
    super.initState();
    SharedPreferences.getInstance().then((prefs) {
      if (!mounted) return;
      setState(() {
        _reminder = prefs.getBool(dailyReminderKey) ?? false;
      });
    });
  }

  Future<void> _setReminder(bool value) async {
    setState(() => _reminder = value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(dailyReminderKey, value);
  }

  Future<void> _openPrivacy() async {
    final opened = await launchUrl(
      Uri.parse(privacyPolicyUrl),
      mode: LaunchMode.externalApplication,
    ).catchError((_) => false);
    if (!opened && mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Could not open the link.')));
    }
  }

  Future<void> _logout() async {
    final ok = await showUIConfirmSheet(
      context,
      title: 'Log out?',
      message:
          'Your results are saved to your account. You can log in again anytime.',
      confirmLabel: 'Log Out',
      confirmColor: UI.danger,
    );
    if (!ok) return;
    await const AuthRepository().signOut();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return UIPage(
      appBar: const UITitleBar('Settings', fallbackRoute: '/profile'),
      children: [
        const UISection(
          'Membership & Subscription',
          padding: EdgeInsets.only(top: 4, bottom: 10),
        ),
        UIGroup(
          children: [
            Consumer(
              builder: (context, ref, _) {
                final isPro = ref.watch(studentProfileProvider).isPro;
                return UIRow(
                  icon: Icons.workspace_premium_rounded,
                  iconColor: UI.gold,
                  title: 'Plans',
                  subtitle: isPro
                      ? 'Active Pro Pass · View & Manage'
                      : 'View subscription packages & get Pro',
                  trailing: isPro
                      ? const UITag('PRO', color: UI.gold)
                      : const UITag('Get Pro', color: UI.primary),
                  onTap: () => context.push('/plans'),
                );
              },
            ),
          ],
        ),
        const UISection(
          'Notifications',
          padding: EdgeInsets.only(top: 4, bottom: 10),
        ),
        UIGroup(
          children: [
            UIRow(
              icon: Icons.notifications_none_rounded,
              iconColor: UI.orange,
              title: 'Daily practice reminder',
              subtitle: 'Saved on this device',
              showChevron: false,
              onTap: () => _setReminder(!_reminder),
              trailing: Switch(value: _reminder, onChanged: _setReminder),
            ),
          ],
        ),
        const UISection('About'),
        UIGroup(
          children: [
            UIRow(
              icon: Icons.shield_outlined,
              iconColor: UI.teal,
              title: 'Privacy Policy',
              onTap: _openPrivacy,
            ),
            UIRow(
              icon: Icons.support_agent_rounded,
              iconColor: UI.primary,
              title: 'Help & Support',
              onTap: () => context.push('/help'),
            ),
            const UIRow(
              icon: Icons.info_outline_rounded,
              iconColor: UI.muted,
              title: 'App version',
              subtitle: appVersionLabel,
              showChevron: false,
            ),
          ],
        ),
        const SizedBox(height: 16),
        UIGroup(
          children: [
            UIRow(
              icon: Icons.logout_rounded,
              iconColor: UI.danger,
              title: 'Logout',
              titleColor: UI.danger,
              showChevron: false,
              onTap: _logout,
            ),
          ],
        ),
      ],
    );
  }
}

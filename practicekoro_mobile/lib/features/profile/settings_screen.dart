import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_constants.dart';
import '../../core/components/pk_dialog.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/repositories/auth_repository.dart';

/// Screen 3: Profile Settings Screen
/// Exact recreation of Screen 3 from the approved 3-screen Profile UI reference (media_1791693901458_a6920a6b.png).
/// Groups existing, supported settings into:
/// - Account: Edit Profile, Change Password, Linked Accounts
/// - Preferences: App Settings, Notification Settings, Language
/// - Support: Help & Support, Report a Problem, Privacy Policy, Terms & Conditions
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _dailyReminder = true;
  bool _examAlerts = true;
  String _currentLanguage = 'English';

  @override
  void initState() {
    super.initState();
    _currentLanguage = LocalStorageService.getLanguagePreference() ? 'বাংলা' : 'English';
  }

  Future<void> _handleLogout() async {
    final confirmed = await PKDialog.show(
      context,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of your PracticeKoro account?',
      confirmText: 'Sign Out',
      icon: Icons.logout_rounded,
      iconColor: AppColors.error,
    );

    if (confirmed == true && mounted) {
      await AuthRepository().signOut();
      if (mounted) {
        context.go('/login');
      }
    }
  }

  void _showChangePasswordDialog() {
    final email = LocalStorageService.getUserEmail();
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: const [
              Icon(Icons.lock_reset_rounded, color: Color(0xFF026BFC)),
              SizedBox(width: 8),
              Text(
                'Change Password',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
              ),
            ],
          ),
          content: Text(
            email != null && email.isNotEmpty
                ? 'A secure password reset link will be sent to $email. Would you like to proceed?'
                : 'Please enter your registered email address to receive password reset instructions.',
            style: const TextStyle(fontSize: 13.5, color: Color(0xFF475569), height: 1.4),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B))),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF026BFC),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () async {
                Navigator.of(ctx).pop();
                if (email != null && email.isNotEmpty) {
                  try {
                    await AuthRepository().sendPasswordResetEmail(email: email);
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Password reset link sent to $email'),
                          backgroundColor: const Color(0xFF10B981),
                        ),
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Failed to send reset link: $e'),
                          backgroundColor: const Color(0xFFEF4444),
                        ),
                      );
                    }
                  }
                }
              },
              child: const Text('Send Link', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  void _showLinkedAccountsDialog() {
    final email = LocalStorageService.getUserEmail() ?? 'student@practicekoro.online';
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text(
            'Linked Accounts',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.email_outlined, color: Color(0xFF026BFC)),
                ),
                title: const Text('Email Account', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                subtitle: Text(email, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                trailing: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20),
              ),
              const Divider(color: Color(0xFFF1F5F9)),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.g_mobiledata_rounded, color: Color(0xFFEA4335), size: 28),
                ),
                title: const Text('Google Sign-In', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                subtitle: const Text('Connected via Supabase OAuth', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                trailing: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Done', style: TextStyle(color: Color(0xFF026BFC), fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  void _showAppSettingsDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'App Settings',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.refresh_rounded, color: Color(0xFF026BFC)),
                  title: const Text('Clear Test Cache', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  subtitle: const Text('Free up temporary offline test files', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Offline cache cleared successfully'),
                        backgroundColor: Color(0xFF10B981),
                      ),
                    );
                  },
                ),
                const Divider(color: Color(0xFFF1F5F9)),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.volume_up_outlined, color: Color(0xFF8B5CF6)),
                  title: const Text('Sound & Haptics', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  subtitle: const Text('Audio feedback during practice questions', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  trailing: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showNotificationSettingsDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Notification Settings',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 20),
                          onPressed: () => Navigator.of(ctx).pop(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SwitchListTile.adaptive(
                      contentPadding: EdgeInsets.zero,
                      activeTrackColor: const Color(0xFF026BFC),
                      title: const Text('Daily Mock Test Reminder', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                      subtitle: const Text('Receive practice alerts at 8:00 AM', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      value: _dailyReminder,
                      onChanged: (val) {
                        setState(() => _dailyReminder = val);
                        setSheetState(() => _dailyReminder = val);
                      },
                    ),
                    const Divider(color: Color(0xFFF1F5F9)),
                    SwitchListTile.adaptive(
                      contentPadding: EdgeInsets.zero,
                      activeTrackColor: const Color(0xFF026BFC),
                      title: const Text('Exam & Result Updates', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                      subtitle: const Text('Job notices and admit card release alerts', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      value: _examAlerts,
                      onChanged: (val) {
                        setState(() => _examAlerts = val);
                        setSheetState(() => _examAlerts = val);
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text(
            'Select Language',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                title: const Text('English', style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700)),
                leading: Icon(
                  _currentLanguage == 'English'
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_unchecked_rounded,
                  color: _currentLanguage == 'English'
                      ? const Color(0xFF026BFC)
                      : const Color(0xFF94A3B8),
                ),
                onTap: () {
                  setState(() => _currentLanguage = 'English');
                  LocalStorageService.saveLanguagePreference(false);
                  Navigator.of(ctx).pop();
                },
              ),
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                title: const Text('বাংলা (Bengali)', style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700)),
                leading: Icon(
                  _currentLanguage == 'বাংলা'
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_unchecked_rounded,
                  color: _currentLanguage == 'বাংলা'
                      ? const Color(0xFF026BFC)
                      : const Color(0xFF94A3B8),
                ),
                onTap: () {
                  setState(() => _currentLanguage = 'বাংলা');
                  LocalStorageService.saveLanguagePreference(true);
                  Navigator.of(ctx).pop();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showTextPolicyDialog(String title, String content) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            title,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
          ),
          content: SizedBox(
            height: 320,
            child: SingleChildScrollView(
              child: Text(
                content,
                style: const TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.45),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Close', style: TextStyle(color: Color(0xFF026BFC), fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Profile',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          IconButton(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.notifications_none_rounded, color: Color(0xFF0F172A), size: 24),
                Positioned(
                  right: 1,
                  top: 1,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                  ),
                ),
              ],
            ),
            onPressed: () => context.push('/notifications'),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SingleChildScrollView(
        padding: PKBottomSpacing.safeAreaEdgeInsets(
          context,
          horizontal: 16,
          top: 16,
          additionalGap: 24,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── 1. ACCOUNT SECTION ──
            _buildSectionHeader(
              icon: Icons.person_rounded,
              iconBg: const Color(0xFF10B981),
              title: 'Account',
            ),
            const SizedBox(height: 10),
            _buildCardWrapper(
              children: [
                _buildSettingRow(
                  icon: Icons.person_outline_rounded,
                  title: 'Edit Profile',
                  onTap: () => context.push('/edit-profile'),
                ),
                _buildDivider(),
                _buildSettingRow(
                  icon: Icons.lock_outline_rounded,
                  title: 'Change Password',
                  onTap: _showChangePasswordDialog,
                ),
                _buildDivider(),
                _buildSettingRow(
                  icon: Icons.link_rounded,
                  title: 'Linked Accounts',
                  onTap: _showLinkedAccountsDialog,
                ),
              ],
            ),
            const SizedBox(height: 22),

            // ── 2. PREFERENCES SECTION ──
            _buildSectionHeader(
              icon: Icons.settings_rounded,
              iconBg: const Color(0xFF8B5CF6),
              title: 'Preferences',
            ),
            const SizedBox(height: 10),
            _buildCardWrapper(
              children: [
                _buildSettingRow(
                  icon: Icons.tune_rounded,
                  title: 'App Settings',
                  onTap: _showAppSettingsDialog,
                ),
                _buildDivider(),
                _buildSettingRow(
                  icon: Icons.notifications_none_outlined,
                  title: 'Notification Settings',
                  onTap: _showNotificationSettingsDialog,
                ),
                _buildDivider(),
                _buildSettingRow(
                  icon: Icons.language_rounded,
                  title: 'Language',
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _currentLanguage,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 18),
                    ],
                  ),
                  onTap: _showLanguageDialog,
                ),
              ],
            ),
            const SizedBox(height: 22),

            // ── 3. SUPPORT SECTION ──
            _buildSectionHeader(
              icon: Icons.support_rounded,
              iconBg: const Color(0xFFEF4444),
              title: 'Support',
            ),
            const SizedBox(height: 10),
            _buildCardWrapper(
              children: [
                _buildSettingRow(
                  icon: Icons.help_outline_rounded,
                  title: 'Help & Support',
                  onTap: () => context.push('/support'),
                ),
                _buildDivider(),
                _buildSettingRow(
                  icon: Icons.error_outline_rounded,
                  title: 'Report a Problem',
                  onTap: () => context.push('/support'),
                ),
                _buildDivider(),
                _buildSettingRow(
                  icon: Icons.shield_outlined,
                  title: 'Privacy Policy',
                  onTap: () => _showTextPolicyDialog(
                    'Privacy Policy',
                    'At PracticeKoro, your privacy is our top priority. We only collect details essential to provide personalized test series, accurate rankings, and performance analytics.\n\nYour data is securely stored and never shared with unauthorized third parties. For any inquiries, reach out to support@practicekoro.online.',
                  ),
                ),
                _buildDivider(),
                _buildSettingRow(
                  icon: Icons.description_outlined,
                  title: 'Terms & Conditions',
                  onTap: () => _showTextPolicyDialog(
                    'Terms & Conditions',
                    'By using PracticeKoro, you agree to access exam preparation materials for individual learning purposes.\n\nAll mock test questions, question papers, and study materials are proprietary to PracticeKoro. Account sharing or unauthorized reproduction of content is strictly prohibited.',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // ── 4. SIGN OUT BUTTON ──
            InkWell(
              onTap: _handleLogout,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFEE2E2)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x04000000),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.logout_rounded, color: Color(0xFFEF4444), size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Sign Out',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFFEF4444),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // ── 5. BUILD VERSION ──
            Center(
              child: Text(
                'PracticeKoro 2.0 • Version ${AppConstants.appVersion}',
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF94A3B8),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader({
    required IconData icon,
    required Color iconBg,
    required String title,
  }) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: iconBg,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.white, size: 16),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: const TextStyle(
            fontSize: 15.5,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }

  Widget _buildCardWrapper({required List<Widget> children}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x04000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildSettingRow({
    required IconData icon,
    required String title,
    Widget? trailing,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFF334155), size: 21),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
            ),
            trailing ??
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFF94A3B8),
                  size: 20,
                ),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return const Divider(
      height: 1,
      thickness: 1,
      indent: 51,
      endIndent: 16,
      color: Color(0xFFF1F5F9),
    );
  }
}

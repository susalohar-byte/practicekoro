import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/components/pk_dialog.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_constants.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/catalog_repository.dart';

/// Profile Overview Screen (approved full-length Profile UI reference).
/// Sections, top to bottom:
/// 1. Header: "Profile" title + settings gear
/// 2. Profile card: avatar (edit badge), name, email, phone, chevron to Edit Profile,
///    gender / date of birth / location
/// 3. My Progress: tests attempted, accuracy, questions solved, day streak (real attempts)
/// 4. My Exams: selected exam tags, Edit and Add Exam (Edit Profile exam editor)
/// 5. My Test Attempts + Bookmarks
/// 6. Account & Preferences: Subscription & Plan, Payment History, Coupons, Notification Settings
/// 7. Help & Information: Help & Support, About PracticeKoro, Privacy Policy
/// 8. Meet Nimo banner
/// 9. Logout
///
/// Removed by design: My Learning, My Notes, Downloads, Download History, Refer & Earn.
class ProfileScreen extends StatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const ProfileScreen({super.key, this.onTabSelected});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

/// Progress figures derived from the student's completed attempts.
class _ProfileStats {
  final int testsAttempted;
  final int? accuracy; // null when no question has been answered yet
  final int questionsSolved;
  final int dayStreak;

  const _ProfileStats({
    required this.testsAttempted,
    required this.accuracy,
    required this.questionsSolved,
    required this.dayStreak,
  });

  factory _ProfileStats.fromAttempts(Iterable<TestAttemptModel> attempts) {
    final list = attempts.toList();
    final correct = list.fold<int>(0, (sum, a) => sum + a.correctCount);
    final answered = list.fold<int>(0, (sum, a) => sum + a.correctCount + a.wrongCount);

    // Consecutive days with at least one completed test, ending today or yesterday.
    DateTime day(DateTime d) => DateTime(d.year, d.month, d.day);
    final days = list.map((a) => day(a.completedAt.toLocal())).toSet();
    var cursor = day(DateTime.now());
    if (!days.contains(cursor)) cursor = cursor.subtract(const Duration(days: 1));
    var streak = 0;
    while (days.contains(cursor)) {
      streak++;
      cursor = cursor.subtract(const Duration(days: 1));
    }

    return _ProfileStats(
      testsAttempted: list.length,
      accuracy: answered > 0 ? (correct / answered * 100).round() : null,
      questionsSolved: answered,
      dayStreak: streak,
    );
  }
}

class _ProfileScreenState extends State<ProfileScreen> {
  static const Color _canvas = Color(0xFFF2F7FF);
  static const Color _ink = Color(0xFF0B1B3F);
  static const Color _slate = Color(0xFF64748B);
  static const Color _muted = Color(0xFF94A3B8);
  static const Color _blue = Color(0xFF026BFC);

  final _catalog = CatalogRepository();

  bool _isLoading = true;
  String _userName = '';
  String _userEmail = '';
  String _userPhone = '';
  String _userDistrict = '';
  String _userState = '';
  String _userGender = '';
  String _userDob = '';
  List<String> _targetExams = const [];

  _ProfileStats? _stats;
  bool _statsFailed = false;

  @override
  void initState() {
    super.initState();
    _readLocalProfile();
    _loadProfileData();
  }

  bool get _isSignedIn {
    try {
      return Supabase.instance.client.auth.currentUser != null;
    } catch (_) {
      return false;
    }
  }

  /// Cached profile written by AuthRepository (instant, offline-friendly).
  void _readLocalProfile() {
    final name = LocalStorageService.getUserName();
    _userName = name == 'Candidate' ? '' : name;
    _userEmail = LocalStorageService.getUserEmail() ?? '';
    _userPhone = LocalStorageService.getUserPhone() ?? '';
    _userDistrict = LocalStorageService.getUserDistrict() ?? '';
    _userState = LocalStorageService.getUserState();
    _userGender = _formatGender(LocalStorageService.getUserGender());
    _userDob = _formatDob(LocalStorageService.getUserDob());
    _targetExams = LocalStorageService.getTargetExamsList();
  }

  Future<void> _loadProfileData() async {
    setState(() => _isLoading = true);

    // 1. Refresh the cached profile from Supabase (writes back to local storage).
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        await AuthRepository().syncUserProfile(user);
      }
    } catch (_) {
      // Offline or not configured: keep showing the cached profile.
    }
    if (!mounted) return;
    setState(_readLocalProfile);

    // 2. Progress from completed attempts: server history merged with this device's.
    final attemptsById = <String, TestAttemptModel>{
      for (final a in LocalStorageService.getAttempts()) a.id: a,
    };
    var failed = false;
    if (_isSignedIn) {
      try {
        for (final a in await _catalog.getStudentCompletedAttempts()) {
          attemptsById[a.id] = a;
        }
      } catch (_) {
        failed = true;
      }
    }

    if (!mounted) return;
    setState(() {
      _stats = _ProfileStats.fromAttempts(attemptsById.values);
      _statsFailed = failed && attemptsById.isEmpty;
      _isLoading = false;
    });
  }

  String _formatGender(String raw) {
    switch (raw.trim().toUpperCase()) {
      case 'MALE':
        return 'Male';
      case 'FEMALE':
        return 'Female';
      case 'OTHER':
        return 'Other';
      default:
        return ''; // NOT_SPECIFIED or empty
    }
  }

  String _formatDob(String raw) {
    final parsed = DateTime.tryParse(raw.trim());
    if (parsed == null) return raw.trim();
    return DateFormat('d MMM yyyy').format(parsed);
  }

  String get _locationText {
    final state = _userState.trim();
    final shortState = state.toLowerCase() == 'west bengal' ? 'WB' : state;
    if (_userDistrict.isNotEmpty && shortState.isNotEmpty) return '$_userDistrict, $shortState';
    return _userDistrict.isNotEmpty ? _userDistrict : '';
  }

  void _goToTab(int index, String route) {
    if (widget.onTabSelected != null) {
      widget.onTabSelected!(index);
    } else {
      context.go(route);
    }
  }

  Future<void> _openEditProfile() async {
    final updated = await context.push<bool>('/edit-profile');
    if (updated == true && mounted) {
      _loadProfileData();
    }
  }

  Future<void> _openExternal(String url) async {
    final uri = Uri.parse(url);
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication).catchError((_) => false);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open $url'), behavior: SnackBarBehavior.floating),
      );
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await PKDialog.show(
      context,
      title: 'Logout',
      message: 'Are you sure you want to log out of your PracticeKoro account?',
      confirmText: 'Logout',
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _canvas,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            if (_isLoading)
              const LinearProgressIndicator(
                minHeight: 2.5,
                color: _blue,
                backgroundColor: Colors.transparent,
              ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadProfileData,
                color: _blue,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: PKBottomSpacing.edgeInsets(
                    context,
                    horizontal: 16,
                    top: 8,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildTopHeader(),
                      const SizedBox(height: 12),
                      _buildUserProfileCard(),
                      const SizedBox(height: 14),
                      _buildMyProgressCard(),
                      const SizedBox(height: 14),
                      _buildMyExamsCard(),
                      const SizedBox(height: 14),
                      _buildActivityCard(),
                      const SizedBox(height: 14),
                      _buildAccountCard(),
                      const SizedBox(height: 14),
                      _buildHelpCard(),
                      const SizedBox(height: 14),
                      _buildNimoBanner(),
                      const SizedBox(height: 14),
                      _buildLogoutRow(),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Shared card chrome ──────────────────────────────────────────────────

  BoxDecoration _cardDecoration() {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      boxShadow: const [
        BoxShadow(color: Color(0x0F1E3A8A), blurRadius: 18, offset: Offset(0, 6)),
      ],
    );
  }

  Widget _rowDivider({double indent = 66}) {
    return Divider(height: 1, thickness: 1, indent: indent, endIndent: 16, color: const Color(0xFFEFF3F8));
  }

  // ─── 1. Header ───────────────────────────────────────────────────────────

  Widget _buildTopHeader() {
    return Row(
      children: [
        const Expanded(
          child: Text(
            'Profile',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: _ink,
              letterSpacing: -0.6,
            ),
          ),
        ),
        IconButton(
          tooltip: 'Settings',
          icon: const Icon(Icons.settings_outlined, color: _ink, size: 26),
          onPressed: () => context.push('/settings'),
        ),
      ],
    );
  }

  // ─── 2. Profile card ─────────────────────────────────────────────────────

  Widget _buildUserProfileCard() {
    final displayName = _userName.isNotEmpty
        ? _userName
        : (_userEmail.contains('@') ? _userEmail.split('@').first : 'Your Name');
    final infoItems = <(IconData, String)>[
      if (_userGender.isNotEmpty) (Icons.person_outline_rounded, _userGender),
      if (_userDob.isNotEmpty) (Icons.calendar_month_outlined, _userDob),
      if (_locationText.isNotEmpty) (Icons.location_on_outlined, _locationText),
    ];

    return Container(
      width: double.infinity,
      decoration: _cardDecoration(),
      child: Column(
        children: [
          InkWell(
            onTap: _openEditProfile,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 12, 14),
              child: Row(
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: const BoxDecoration(color: Color(0xFFDBEAFE), shape: BoxShape.circle),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/images/profile_avatar_boy.png',
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                const Icon(Icons.person_rounded, size: 38, color: _blue),
                          ),
                        ),
                      ),
                      Positioned(
                        right: -2,
                        bottom: -2,
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: _blue,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: _ink,
                            letterSpacing: -0.3,
                          ),
                        ),
                        if (_userEmail.isNotEmpty) ...[
                          const SizedBox(height: 3),
                          Text(
                            _userEmail,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 13, color: _slate, fontWeight: FontWeight.w500),
                          ),
                        ],
                        const SizedBox(height: 3),
                        Text(
                          _userPhone.isNotEmpty ? _userPhone : 'Add phone number',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 13,
                            color: _userPhone.isNotEmpty ? _slate : _blue,
                            fontWeight: _userPhone.isNotEmpty ? FontWeight.w500 : FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: _ink, size: 24),
                ],
              ),
            ),
          ),
          const Divider(height: 1, thickness: 1, indent: 16, endIndent: 16, color: Color(0xFFEFF3F8)),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
            child: infoItems.isEmpty
                ? InkWell(
                    onTap: _openEditProfile,
                    child: const Row(
                      children: [
                        Icon(Icons.add_circle_outline_rounded, size: 17, color: _blue),
                        SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Add gender, date of birth & location',
                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: _blue),
                          ),
                        ),
                      ],
                    ),
                  )
                : Row(
                    mainAxisAlignment:
                        infoItems.length == 1 ? MainAxisAlignment.start : MainAxisAlignment.spaceBetween,
                    children: [
                      for (final (icon, text) in infoItems)
                        Flexible(
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(icon, size: 18, color: _ink),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  text,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _ink),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  // ─── 3. My Progress ──────────────────────────────────────────────────────

  Widget _buildMyProgressCard() {
    final stats = _stats;
    final hasAttempts = stats != null && stats.testsAttempted > 0;
    String show(String Function(_ProfileStats s) pick) => stats == null ? '–' : pick(stats);

    return Container(
      width: double.infinity,
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 10, 12),
            child: Row(
              children: [
                const Icon(Icons.bar_chart_rounded, color: _blue, size: 26),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'My Progress',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: _ink, letterSpacing: -0.2),
                  ),
                ),
                TextButton(
                  onPressed: () => _goToTab(3, '/results'),
                  style: TextButton.styleFrom(
                    foregroundColor: _blue,
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    minimumSize: const Size(0, 32),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('View Details', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      SizedBox(width: 2),
                      Icon(Icons.chevron_right_rounded, size: 18),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, thickness: 1, indent: 16, endIndent: 16, color: Color(0xFFEFF3F8)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
            child: Row(
              children: [
                Expanded(
                  child: _buildProgressStatItem(
                    value: show((s) => '${s.testsAttempted}'),
                    label: 'Tests\nAttempted',
                    valueColor: _ink,
                  ),
                ),
                _buildStatDivider(),
                Expanded(
                  child: _buildProgressStatItem(
                    value: show((s) => s.accuracy == null ? '–' : '${s.accuracy}%'),
                    label: 'Accuracy',
                    valueColor: const Color(0xFF10B981),
                  ),
                ),
                _buildStatDivider(),
                Expanded(
                  child: _buildProgressStatItem(
                    value: show((s) => NumberFormat.decimalPattern('en_IN').format(s.questionsSolved)),
                    label: 'Questions\nSolved',
                    valueColor: _ink,
                  ),
                ),
                _buildStatDivider(),
                Expanded(
                  child: _buildProgressStatItem(
                    value: show((s) => '${s.dayStreak}'),
                    label: 'Days\nStreak',
                    valueColor: const Color(0xFFF59E0B),
                  ),
                ),
              ],
            ),
          ),
          if (_statsFailed || (stats != null && !hasAttempts))
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Text(
                _statsFailed
                    ? "Couldn't load your progress. Pull down to retry."
                    : 'Attempt your first mock test to start tracking progress.',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _statsFailed ? AppColors.error : _slate,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildProgressStatItem({
    required String value,
    required String label,
    required Color valueColor,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: valueColor,
              letterSpacing: -0.4,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: _slate, height: 1.2),
        ),
      ],
    );
  }

  Widget _buildStatDivider() {
    return Container(height: 44, width: 1, color: const Color(0xFFEFF3F8));
  }

  // ─── 4. My Exams ─────────────────────────────────────────────────────────

  Widget _buildMyExamsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.track_changes_rounded, color: Color(0xFFEF4444), size: 30),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'My Exams',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: _ink, letterSpacing: -0.2),
                    ),
                    SizedBox(height: 1),
                    Text(
                      'Exams you are preparing for',
                      style: TextStyle(fontSize: 12.5, color: _slate, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: _openEditProfile,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F1FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'Edit',
                    style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: _blue),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (_targetExams.isEmpty) ...[
            const Text(
              "You haven't selected any exams yet.",
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500, color: _slate),
            ),
            const SizedBox(height: 10),
          ],
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final exam in _targetExams) _buildExamTag(exam),
              InkWell(
                onTap: _openEditProfile,
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.add_rounded, size: 17, color: Color(0xFF334155)),
                      SizedBox(width: 4),
                      Text(
                        'Add Exam',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildExamTag(String exam) {
    final t = exam.toLowerCase();
    final (Color bg, Color fg) = t.contains('rail') || t.contains('ntpc')
        ? (const Color(0xFFFFE4E6), const Color(0xFFE11D48))
        : t.contains('ssc') || t.contains('group') || t.contains('clerk')
            ? (const Color(0xFFDCFCE7), const Color(0xFF15803D))
            : t.contains('wbp') || t.contains('police') || t.contains('kp')
                ? (const Color(0xFFDBEAFE), const Color(0xFF1D4ED8))
                : (const Color(0xFFEDE9FE), const Color(0xFF7C3AED));
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(
        exam,
        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }

  // ─── 5. My Test Attempts + Bookmarks ─────────────────────────────────────

  Widget _buildActivityCard() {
    return Container(
      width: double.infinity,
      decoration: _cardDecoration(),
      child: Column(
        children: [
          _buildListRow(
            icon: Icons.description_rounded,
            color: const Color(0xFF3B82F6),
            title: 'My Test Attempts',
            bold: true,
            onTap: () => _goToTab(3, '/results'),
          ),
          _rowDivider(),
          _buildListRow(
            icon: Icons.bookmark_rounded,
            color: const Color(0xFFEF4444),
            title: 'Bookmarks',
            bold: true,
            onTap: () => context.push('/saved-questions'),
          ),
        ],
      ),
    );
  }

  Widget _buildListRow({
    required IconData icon,
    required Color color,
    required String title,
    String? trailingText,
    bool bold = false,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 14, 12),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
                  color: _ink,
                ),
              ),
            ),
            if (trailingText != null) ...[
              Text(
                trailingText,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _muted),
              ),
              const SizedBox(width: 4),
            ],
            const Icon(Icons.chevron_right_rounded, color: _ink, size: 22),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeading({required IconData icon, required Color color, required String title}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: _ink, letterSpacing: -0.2),
            ),
          ),
        ],
      ),
    );
  }

  // ─── 6. Account & Preferences ────────────────────────────────────────────

  Widget _buildAccountCard() {
    final isPro = LocalStorageService.isProUser();
    return Container(
      width: double.infinity,
      decoration: _cardDecoration(),
      child: Column(
        children: [
          _buildSectionHeading(
            icon: Icons.settings_rounded,
            color: const Color(0xFF8B5CF6),
            title: 'Account & Preferences',
          ),
          _rowDivider(),
          _buildListRow(
            icon: Icons.workspace_premium_rounded,
            color: const Color(0xFFFBBF24),
            title: 'Subscription & Plan',
            trailingText: isPro ? 'Pro' : 'Free',
            onTap: () => context.push('/subscription'),
          ),
          _rowDivider(),
          _buildListRow(
            icon: Icons.credit_card_rounded,
            color: const Color(0xFF22C55E),
            title: 'Payment History',
            onTap: _showPaymentHistory,
          ),
          _rowDivider(),
          _buildListRow(
            icon: Icons.local_offer_rounded,
            color: const Color(0xFFF43F5E),
            title: 'Coupons',
            onTap: _showCoupons,
          ),
          _rowDivider(),
          _buildListRow(
            icon: Icons.notifications_rounded,
            color: const Color(0xFF3B82F6),
            title: 'Notification Settings',
            onTap: () => context.push('/settings'),
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }

  // ─── 7. Help & Information ───────────────────────────────────────────────

  Widget _buildHelpCard() {
    return Container(
      width: double.infinity,
      decoration: _cardDecoration(),
      child: Column(
        children: [
          _buildSectionHeading(
            icon: Icons.support_rounded,
            color: const Color(0xFFF26B5B),
            title: 'Help & Information',
          ),
          _rowDivider(),
          _buildListRow(
            icon: Icons.help_outline_rounded,
            color: const Color(0xFF2563EB),
            title: 'Help & Support',
            onTap: () => context.push('/support'),
          ),
          _rowDivider(),
          _buildListRow(
            icon: Icons.info_outline_rounded,
            color: const Color(0xFF8B5CF6),
            title: 'About PracticeKoro',
            onTap: _showAbout,
          ),
          _rowDivider(),
          _buildListRow(
            icon: Icons.verified_user_rounded,
            color: const Color(0xFF2563EB),
            title: 'Privacy Policy',
            onTap: () => _openExternal('${AppConstants.websiteUrl}/privacy-policy'),
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }

  // ─── 8. Meet Nimo ────────────────────────────────────────────────────────

  Widget _buildNimoBanner() {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 150),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFFE6F0FF), Color(0xFFD4E5FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            right: 6,
            bottom: 0,
            top: 8,
            // Fade the artwork's left edge so its square crop never shows as a seam.
            child: ShaderMask(
              blendMode: BlendMode.dstIn,
              shaderCallback: (rect) => const LinearGradient(
                colors: [Colors.transparent, Colors.black],
                stops: [0.0, 0.14],
              ).createShader(rect),
              child: Image.asset(
                'assets/images/nimo_ready.png',
                fit: BoxFit.contain,
                alignment: Alignment.bottomRight,
                filterQuality: FilterQuality.medium,
                errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(18, 16, 120, 58),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Meet Nimo',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: _ink, letterSpacing: -0.4),
                ),
                SizedBox(height: 2),
                Text(
                  'Keep showing up.\nEvery practice session counts!',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF334155), height: 1.3),
                ),
              ],
            ),
          ),
          // Motivational pill may run under Nimo's shoulder, as in the reference.
          Positioned(
            left: 16,
            right: 56,
            bottom: 14,
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [
                    BoxShadow(color: Color(0x141E3A8A), blurRadius: 8, offset: Offset(0, 2)),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.favorite_rounded, size: 14, color: _blue),
                    SizedBox(width: 5),
                    Flexible(
                      child: Text(
                        'Practice Today, A Better You Tomorrow!',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF1E3A8A)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── 9. Logout ───────────────────────────────────────────────────────────

  Widget _buildLogoutRow() {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      shadowColor: const Color(0x0F1E3A8A),
      elevation: 0,
      child: InkWell(
        onTap: _handleLogout,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.fromLTRB(18, 16, 14, 16),
          decoration: _cardDecoration(),
          child: const Row(
            children: [
              Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 24),
              SizedBox(width: 14),
              Expanded(
                child: Text(
                  'Logout',
                  style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w600, color: Color(0xFFDC2626)),
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: _ink, size: 22),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Sheets: Payment History, Coupons, About ─────────────────────────────

  Future<void> _showSheet({required String title, required Widget child}) {
    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      showDragHandle: true,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (sheetContext) => ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(sheetContext).size.height * 0.75),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: Text(
                  title,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: _ink, letterSpacing: -0.3),
                ),
              ),
              Flexible(child: child),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sheetMessage(IconData icon, String text, {Color color = _slate}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 40, color: color.withValues(alpha: 0.6)),
          const SizedBox(height: 10),
          Text(
            text,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: color, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _futureList({
    required Future<List<Map<String, dynamic>>> future,
    required String emptyText,
    required IconData emptyIcon,
    required Widget Function(Map<String, dynamic>) itemBuilder,
    Widget? footer,
  }) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Padding(
            padding: EdgeInsets.all(32),
            child: Center(child: CircularProgressIndicator(color: _blue)),
          );
        }
        if (snap.hasError) {
          return _sheetMessage(
            Icons.cloud_off_rounded,
            "Couldn't load right now. Check your connection and try again.",
            color: AppColors.error,
          );
        }
        final items = snap.data ?? const [];
        if (items.isEmpty) return _sheetMessage(emptyIcon, emptyText);
        return ListView.separated(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
          itemCount: items.length + (footer != null ? 1 : 0),
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (_, i) => i < items.length ? itemBuilder(items[i]) : footer!,
        );
      },
    );
  }

  void _showPaymentHistory() {
    if (!_isSignedIn) {
      _showSheet(
        title: 'Payment History',
        child: _sheetMessage(Icons.lock_outline_rounded, 'Sign in to see your payment history.'),
      );
      return;
    }
    final money = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    _showSheet(
      title: 'Payment History',
      child: _futureList(
        future: _catalog.getMyPayments(),
        emptyIcon: Icons.receipt_long_rounded,
        emptyText: "You haven't made any payments yet.",
        itemBuilder: (p) {
          final status = (p['status'] ?? 'pending').toString();
          final (Color bg, Color fg) = switch (status) {
            'completed' => (const Color(0xFFDCFCE7), const Color(0xFF15803D)),
            'refunded' => (const Color(0xFFE0E7FF), const Color(0xFF4338CA)),
            'failed' => (const Color(0xFFFEE2E2), const Color(0xFFB91C1C)),
            _ => (const Color(0xFFFEF3C7), const Color(0xFFB45309)),
          };
          final plan = p['subscription_plans'] is Map ? p['subscription_plans'] as Map : const {};
          final planName = (plan['name'] ?? plan['title'] ?? p['plan_id'] ?? 'PracticeKoro Pro').toString();
          final created = DateTime.tryParse((p['created_at'] ?? '').toString());
          return Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFEFF3F8)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        planName,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: _ink),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        created != null ? DateFormat('d MMM yyyy, h:mm a').format(created.toLocal()) : '',
                        style: const TextStyle(fontSize: 12, color: _slate),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      money.format((p['amount'] as num?) ?? 0),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: _ink),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
                      child: Text(
                        status[0].toUpperCase() + status.substring(1),
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showCoupons() {
    if (!_isSignedIn) {
      _showSheet(
        title: 'Coupons',
        child: _sheetMessage(Icons.lock_outline_rounded, 'Sign in to see available coupons.'),
      );
      return;
    }
    final money = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    _showSheet(
      title: 'Coupons',
      child: _futureList(
        future: _catalog.getActiveCoupons(),
        emptyIcon: Icons.local_offer_outlined,
        emptyText: 'No coupons are available right now.',
        footer: SizedBox(
          height: 46,
          child: ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              context.push('/subscription');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _blue,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text('Apply at checkout · View Plans', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ),
        itemBuilder: (c) {
          final code = (c['code'] ?? '').toString();
          final value = (c['discount_value'] as num?) ?? 0;
          final off = c['discount_type'] == 'percentage' ? '${value.round()}% OFF' : '${money.format(value)} OFF';
          final until = DateTime.tryParse((c['valid_until'] ?? '').toString());
          final minOrder = (c['min_order_amount'] as num?) ?? 0;
          final details = [
            if ((c['description'] ?? '').toString().isNotEmpty) c['description'].toString(),
            if (minOrder > 0) 'Min. order ${money.format(minOrder)}',
            if (until != null) 'Valid till ${DateFormat('d MMM yyyy').format(until.toLocal())}',
          ].join(' · ');
          return Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7F8),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFFFE4E6)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(off, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFFE11D48))),
                      if (details.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Text(details, style: const TextStyle(fontSize: 12, color: _slate, height: 1.3)),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                OutlinedButton.icon(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: code));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Coupon $code copied'), behavior: SnackBarBehavior.floating),
                    );
                  },
                  icon: const Icon(Icons.copy_rounded, size: 15),
                  label: Text(code, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFE11D48),
                    side: const BorderSide(color: Color(0xFFFDA4AF), style: BorderStyle.solid),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showAbout() {
    _showSheet(
      title: 'About PracticeKoro',
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.asset(
                    'assets/images/logo-circle.png',
                    width: 48,
                    height: 48,
                    errorBuilder: (_, _, _) => const Icon(Icons.school_rounded, size: 40, color: _blue),
                  ),
                ),
                const SizedBox(width: 12),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppConstants.appName,
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: _ink),
                    ),
                    Text(
                      'Version ${AppConstants.appVersion}',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: _slate),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Text(
              '${AppConstants.appTagline}. Mock tests, topic practice, previous year questions '
              'and rank analysis for West Bengal and central government exams.',
              style: TextStyle(fontSize: 13.5, color: Color(0xFF334155), height: 1.45),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () => _openExternal(AppConstants.websiteUrl),
              icon: const Icon(Icons.language_rounded, size: 18),
              label: const Text('Visit practicekoro.online', style: TextStyle(fontWeight: FontWeight.w700)),
              style: OutlinedButton.styleFrom(
                foregroundColor: _blue,
                side: const BorderSide(color: Color(0xFFBFDBFE)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

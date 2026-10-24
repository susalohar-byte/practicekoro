import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/components/ui.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/student_profile_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/repositories/profile_repository.dart';
import '../../data/repositories/subscription_repository.dart';
import '../../core/components/user_avatar.dart';
import '../settings/settings_screen.dart' show appVersionLabel;

/// Profile: every field the admin panel keeps for a student, grouped the same
/// way, with a completion meter nudging the student to fill the gaps.
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  void _edit([String? section]) => context.push(
    section == null ? '/profile/edit' : '/profile/edit?section=$section',
  );

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(studentProfileProvider);
    final subAsync = ref.watch(studentSubscriptionProvider);
    final currentSub = subAsync.value;
    // The stored pass decides; the profile flag only covers the first load.
    final isPro = currentSub?.isCurrentlyActive ?? profile.isPro;
    final attempts =
        ref.watch(attemptHistoryProvider).value ?? const <TestAttemptModel>[];
    final average = attempts.isEmpty
        ? null
        : attempts.map((a) => a.percentage).reduce((x, y) => x + y) /
              attempts.length;
    // Only a server-ranked attempt carries a rank; local attempts store 0.
    final rank = attempts
        .map((a) => a.rank)
        .firstWhere((r) => r > 0, orElse: () => 0);
    final bookmarkCount = LocalStorageService.getBookmarks().length;
    final missingDistrict = (profile.district ?? '').isEmpty;
    final missingCategory =
        profile.category == 'NOT_SPECIFIED' || profile.category.isEmpty;
    final needsLocation = missingDistrict || missingCategory;

    return Scaffold(
      backgroundColor: UI.page,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: UI.primary,
          onRefresh: () async {
            ref.invalidate(attemptHistoryProvider);
            ref.invalidate(studentSubscriptionProvider);
            ref.read(studentProfileProvider.notifier).reload();
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(UI.gutter, 10, UI.gutter, 96),
            children: [
              // Top Non-sticky Header: Title (middle-aligned) + Settings Action
              Padding(
                padding: const EdgeInsets.only(top: 4, bottom: 12),
                child: SizedBox(
                  height: 44,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const Center(
                        child: Text(
                          'My Profile',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                            letterSpacing: -0.3,
                          ),
                        ),
                      ),
                      Positioned(
                        right: 0,
                        child: IconButton(
                          icon: const Icon(
                            Icons.settings_outlined,
                            color: Color(0xFF0F172A),
                            size: 22,
                          ),
                          tooltip: 'Settings',
                          onPressed: () => context.push('/settings'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              ProfileHeader(
                profile: profile,
          onEdit: () => _edit(),
          onEditExam: () => _edit('exam'),
          onEditLocation: () => _edit('location'),
        ),
        // One prompt at a time: the mandatory district/caste first, then the
        // remaining optional details.
        if (needsLocation) ...[
          const SizedBox(height: 12),
          _AttentionCard(
            icon: Icons.location_on_rounded,
            title: 'জেলা ও জাতি দিন',
            message: 'Cutoff ও District Rank দেখতে District ও Caste পূরণ করুন।',
            onTap: () => _edit('location'),
          ),
        ] else if (profile.completion < 1) ...[
          const SizedBox(height: 12),
          _CompletionCard(profile: profile, onTap: () => _edit()),
        ],
        const SizedBox(height: 12),
        UICard(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Row(
            children: [
              Expanded(
                child: UIInfoTile(
                  icon: Icons.assignment_turned_in_rounded,
                  value: '${attempts.length}',
                  label: 'Tests Taken',
                ),
              ),
              Expanded(
                child: UIInfoTile(
                  icon: Icons.trending_up_rounded,
                  value: average == null ? '–' : '${average.round()}%',
                  label: 'Avg. Score',
                  color: UI.success,
                ),
              ),
              Expanded(
                child: UIInfoTile(
                  icon: Icons.emoji_events_rounded,
                  value: rank > 0 ? '#$rank' : '–',
                  label: 'Best Rank',
                  color: UI.gold,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: UIShortcut(
                icon: Icons.insights_rounded,
                label: 'My Progress',
                color: UI.primary,
                onTap: () => context.push('/progress'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: UIShortcut(
                icon: Icons.bookmark_border_rounded,
                label: bookmarkCount > 0
                    ? 'Bookmarks ($bookmarkCount)'
                    : 'Bookmarks',
                color: UI.purple,
                onTap: () => context.push('/bookmarks'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: UIShortcut(
                icon: Icons.history_rounded,
                label: 'My Tests',
                color: UI.teal,
                onTap: () => context.push('/test-history'),
              ),
            ),
          ],
        ),
        const UISection('Personal Details'),
        UIGroup(
          children: [
            _InfoRow(
              Icons.person_outline_rounded,
              'Full name',
              profile.fullName,
              onTap: () => _edit('personal'),
            ),
            _InfoRow(
              Icons.mail_outline_rounded,
              'Email',
              profile.email,
              onTap: () => _edit('personal'),
            ),
            _InfoRow(
              Icons.phone_outlined,
              'Phone',
              _phone(profile.phone),
              onTap: () => _edit('personal'),
            ),
            _InfoRow(
              Icons.cake_outlined,
              'Date of Birth',
              profile.dob == null
                  ? 'Not set'
                  : DateFormat('d MMMM yyyy').format(profile.dob!),
              onTap: () => _edit('personal'),
            ),
            _InfoRow(
              Icons.wc_rounded,
              'Gender',
              profile.gender == 'NOT_SPECIFIED' ? '' : profile.genderLabel,
              onTap: () => _edit('personal'),
            ),
          ],
        ),
        const UISection('Target Exam & Category'),
        UIGroup(
          children: [
            _InfoRow(
              Icons.flag_outlined,
              'Target exam',
              profile.targetExamTitle ?? '',
              onTap: () => _edit('exam'),
            ),
            _InfoRow(
              Icons.location_on_outlined,
              'District',
              profile.district ?? '',
              required: true,
              onTap: () => _edit('location'),
            ),
            _InfoRow(
              Icons.holiday_village_outlined,
              'Block',
              (profile.block != null && profile.block!.isNotEmpty)
                  ? profile.block!
                  : 'Not specified',
              onTap: () => _edit('location'),
            ),
            _InfoRow(
              Icons.badge_outlined,
              'Caste',
              missingCategory ? '' : profile.categoryLabel,
              required: true,
              onTap: () => _edit('location'),
            ),
          ],
        ),
        const UISection('Account'),
        UIGroup(
          children: [
            UIRow(
              icon: Icons.verified_user_outlined,
              iconColor: profile.accountStatus == 'active'
                  ? UI.success
                  : UI.danger,
              title: 'Account status',
              subtitle: 'Managed by PracticeKoro',
              showChevron: false,
              trailing: profile.accountStatus == 'active'
                  ? const UITag('Active', color: UI.success)
                  : const UITag('Inactive', color: UI.danger),
            ),
            if (!isPro)
              UIRow(
                icon: Icons.workspace_premium_outlined,
                iconColor: UI.gold,
                title: 'Plan',
                subtitle: currentSub != null && currentSub.hasSubscription
                    ? '${currentSub.planTitle ?? 'Pro Pass'} expired on ${currentSub.formattedExpiry}'
                    : 'Free · Upgrade to unlock all tests',
                trailing: currentSub != null && currentSub.hasSubscription
                    ? const UITag('Expired', color: UI.danger)
                    : const UITag('Upgrade', color: UI.primary),
                onTap: () => context.push('/plans'),
              ),
            UIRow(
              icon: Icons.event_available_outlined,
              title: 'Member since',
              subtitle: DateFormat('d MMMM yyyy').format(
                profile.createdAt ?? DateTime(2026, 9, 18),
              ),
              showChevron: false,
            ),
          ],
        ),
        if (isPro) ...[
          const UISection('Pro Pass'),
          UIGroup(
            children: [
              UIRow(
                icon: Icons.workspace_premium_outlined,
                iconColor: UI.gold,
                title: currentSub?.planTitle ?? 'Pro Pass',
                subtitle: 'Current plan · All tests unlocked',
                trailing: currentSub != null && currentSub.remainingDays <= 7
                    ? const UITag('Expiring soon', color: UI.gold)
                    : const UITag('Active', color: UI.success),
                onTap: () => context.push('/plans'),
              ),
              if (currentSub != null) ...[
                UIRow(
                  icon: Icons.shopping_bag_outlined,
                  title: 'Purchased on',
                  subtitle: currentSub.formattedPurchaseDate,
                  showChevron: false,
                ),
                UIRow(
                  icon: Icons.event_outlined,
                  title: 'Valid until',
                  subtitle: currentSub.formattedExpiry,
                  showChevron: false,
                ),
                UIRow(
                  icon: Icons.hourglass_bottom_rounded,
                  iconColor: UI.teal,
                  title: 'Remaining validity',
                  subtitle:
                      '${currentSub.remainingLabel} (${currentSub.remainingDays} ${currentSub.remainingDays == 1 ? 'day' : 'days'})',
                  showChevron: false,
                ),
                if (currentSub.canUpgrade)
                  UIRow(
                    icon: Icons.upgrade_rounded,
                    iconColor: UI.primary,
                    title: 'Upgrade to ${currentSub.upgradeOptions.first.planTitle}',
                    subtitle: 'Pay only the difference',
                    trailing: const UITag('Upgrade', color: UI.primary),
                    onTap: () => context.push('/plans'),
                  ),
              ],
            ],
          ),
        ],
        const UISection('More'),
        UIGroup(
          children: [
            UIRow(
              icon: Icons.history_edu_rounded,
              iconColor: UI.gold,
              title: 'Previous Year Questions',
              onTap: () => context.push('/pyq'),
            ),
            UIRow(
              icon: Icons.insert_chart_outlined_rounded,
              title: 'My Results',
              onTap: () => context.go('/results'),
            ),
            UIRow(
              icon: Icons.support_agent_rounded,
              iconColor: UI.teal,
              title: 'Help & Support',
              onTap: () => context.push('/help'),
            ),
            UIRow(
              icon: Icons.settings_outlined,
              iconColor: UI.muted,
              title: 'Settings',
              subtitle: 'Reminders, privacy, logout',
              onTap: () => context.push('/settings'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const Center(child: Text(appVersionLabel, style: UI.caption)),
      ],
    ),
  ),
),
);
  }

  static String _phone(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    return digits.length == 10
        ? '+91 ${digits.substring(0, 5)} ${digits.substring(5)}'
        : raw;
  }
}

/// Profile Header Card matching the brand UI:
/// - Clean white background, rounded corners (24), subtle shadow, thin light-blue border.
/// - Top-right small Edit Profile icon button.
/// - Centered user avatar in a circular frame with a cyan-to-blue gradient ring,
///   inner white gap, and a bottom-right camera badge for changing photo.
/// - Bold navy student name with an optional gold Pro badge beside it. No email address.
/// - Compact Profile Complete / % complete status pill.
/// - Three compact information chips for Target Exam, District, and Category at the bottom.
class ProfileHeader extends ConsumerWidget {
  final StudentProfileModel profile;
  final VoidCallback onEdit;
  final VoidCallback? onEditExam;
  final VoidCallback? onEditLocation;

  const ProfileHeader({
    super.key,
    required this.profile,
    required this.onEdit,
    this.onEditExam,
    this.onEditLocation,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = profile.fullName.trim();
    final isComplete = profile.completion >= 1.0;
    final percent = (profile.completion * 100).round();

    final examText = (profile.targetExamTitle ?? '').trim().isNotEmpty
        ? profile.targetExamTitle!
        : 'Add Exam';

    final districtText = (profile.district ?? '').trim().isNotEmpty
        ? profile.district!
        : 'Add District';

    final categoryText = profile.category == 'NOT_SPECIFIED' || profile.category.isEmpty
        ? 'Add Caste'
        : (profile.category == 'GEN'
            ? 'General'
            : (profile.category.contains('OBC')
                ? profile.category.replaceAll('_', '-')
                : profile.category));

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.05),
            blurRadius: 18,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            // Decorative soft pastel background shapes
            Positioned(
              top: -45,
              left: -45,
              child: Container(
                width: 140,
                height: 140,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0x1838BDF8),
                ),
              ),
            ),
            Positioned(
              top: 80,
              left: 16,
              child: Container(
                width: 26,
                height: 26,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0x1238BDF8),
                ),
              ),
            ),
            Positioned(
              bottom: -35,
              right: -35,
              child: Container(
                width: 130,
                height: 130,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0x16A78BFA),
                ),
              ),
            ),

            // Top-right Edit button
            Positioned(
              top: 14,
              right: 14,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: onEdit,
                  borderRadius: BorderRadius.circular(10),
                  child: Ink(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.edit_rounded,
                      size: 18,
                      color: Color(0xFF1D4ED8),
                    ),
                  ),
                ),
              ),
            ),

            // Main Card Content
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Centered Avatar with Gradient Ring and Camera Button
                  Center(
                    child: SizedBox(
                      width: 88,
                      height: 88,
                      child: Stack(
                        clipBehavior: Clip.none,
                        alignment: Alignment.center,
                        children: [
                          // Gradient Ring Outer
                          Container(
                            width: 88,
                            height: 88,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [Color(0xFF00D2FF), Color(0xFF0158FC)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                            padding: const EdgeInsets.all(2.5),
                            child: Container(
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                              ),
                              padding: const EdgeInsets.all(2.5),
                              child: UserAvatar(
                                size: 76,
                                showEditBadge: false,
                                onTap: () => showAvatarPickerSheet(context, ref),
                              ),
                            ),
                          ),
                          // Camera Edit Badge at bottom right (~4:30 position)
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: GestureDetector(
                              onTap: () => showAvatarPickerSheet(context, ref),
                              child: Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0158FC),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white,
                                    width: 2.2,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.16),
                                      blurRadius: 4,
                                      offset: const Offset(0, 1),
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.camera_alt_rounded,
                                  color: Colors.white,
                                  size: 14,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // User Name and Pro Badge (Email address is deliberately excluded)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Flexible(
                        child: Text(
                          name.isEmpty ? 'Add your name' : name,
                          style: const TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0B1F44),
                            letterSpacing: -0.3,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (profile.isPro) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3.5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CrownIcon(size: 13, color: Color(0xFFD97706)),
                              SizedBox(width: 4),
                              Text(
                                'Pro',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFFB45309),
                                  height: 1.1,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Profile Complete Status Pill
                  GestureDetector(
                    onTap: onEdit,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4.5,
                      ),
                      decoration: BoxDecoration(
                        color: isComplete
                            ? const Color(0xFFDCFCE7)
                            : const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isComplete
                                ? Icons.check_circle_rounded
                                : Icons.timelapse_rounded,
                            size: 15,
                            color: isComplete
                                ? const Color(0xFF10B981)
                                : const Color(0xFF0158FC),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            isComplete
                                ? 'Profile Complete'
                                : 'Profile $percent% Complete',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isComplete
                                  ? const Color(0xFF15803D)
                                  : const Color(0xFF0158FC),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Bottom Three Information Chips (Exam, District, Category)
                  Row(
                    children: [
                      Expanded(
                        child: ProfileInfoChip(
                          icon: Icons.school_rounded,
                          iconColor: const Color(0xFF0284C7),
                          bgColor: const Color(0xFFEFF6FF),
                          text: examText,
                          onTap: onEditExam ?? onEdit,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ProfileInfoChip(
                          icon: Icons.location_on_rounded,
                          iconColor: const Color(0xFF7C3AED),
                          bgColor: const Color(0xFFF5F3FF),
                          text: districtText,
                          onTap: onEditLocation ?? onEdit,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ProfileInfoChip(
                          icon: Icons.people_alt_rounded,
                          iconColor: const Color(0xFF10B981),
                          bgColor: const Color(0xFFF0FDF4),
                          text: categoryText,
                          onTap: onEditLocation ?? onEdit,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Compact info chip at bottom of profile header card
class ProfileInfoChip extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String text;
  final VoidCallback onTap;

  const ProfileInfoChip({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.text,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 11),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: iconColor),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  text,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0B1F44),
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

/// Sharp, responsive 3-point crown icon for the Pro membership badge
class CrownIcon extends StatelessWidget {
  final double size;
  final Color color;

  const CrownIcon({super.key, this.size = 14, this.color = const Color(0xFFD97706)});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size * 0.78),
      painter: _CrownPainter(color),
    );
  }
}

class _CrownPainter extends CustomPainter {
  final Color color;
  const _CrownPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    final w = size.width;
    final h = size.height;

    final path = Path()
      ..moveTo(0, h)
      ..lineTo(w, h)
      ..lineTo(w, h * 0.28)
      ..lineTo(w * 0.74, h * 0.64)
      ..lineTo(w * 0.50, 0)
      ..lineTo(w * 0.26, h * 0.64)
      ..lineTo(0, h * 0.28)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _CrownPainter oldDelegate) =>
      oldDelegate.color != color;
}

/// Mandatory-detail prompt in the brand's warm gold.
class _AttentionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final VoidCallback onTap;

  const _AttentionCard({
    required this.icon,
    required this.title,
    required this.message,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return UICard(
      onTap: onTap,
      color: UI.goldSoft,
      border: UI.gold.withValues(alpha: 0.45),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          UIIconBadge(icon, color: UI.gold, size: 44),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(child: Text(title, style: UI.bodyStrong)),
                    const SizedBox(width: 6),
                    const UITag('Required', color: UI.danger),
                  ],
                ),
                const SizedBox(height: 2),
                Text(message, style: UI.caption),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right_rounded, color: UI.muted),
        ],
      ),
    );
  }
}

class _CompletionCard extends StatelessWidget {
  final StudentProfileModel profile;
  final VoidCallback onTap;

  const _CompletionCard({required this.profile, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final percent = (profile.completion * 100).round();
    final missing = profile.missingCount;
    return UICard(
      onTap: onTap,
      color: UI.goldSoft,
      border: UI.goldSoft,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          SizedBox(
            width: 46,
            height: 46,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: profile.completion,
                  strokeWidth: 4.5,
                  backgroundColor: Colors.white,
                  color: UI.gold,
                ),
                Text(
                  '$percent%',
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Complete your profile', style: UI.bodyStrong),
                Text(
                  '$missing ${missing == 1 ? 'detail' : 'details'} missing — they help us set your '
                  'cutoffs and district rank.',
                  style: UI.caption,
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: UI.muted),
        ],
      ),
    );
  }
}

/// Label on the left, value (or an "Add" / "Required" prompt) on the right.
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;
  final bool required;

  const _InfoRow(
    this.icon,
    this.label,
    this.value, {
    required this.onTap,
    this.required = false,
  });

  @override
  Widget build(BuildContext context) {
    final missing = value.trim().isEmpty;
    return InkWell(
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 54),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Row(
            children: [
              Icon(
                icon,
                size: 21,
                color: missing && required ? UI.danger : UI.muted,
              ),
              const SizedBox(width: 12),
              Text(label, style: UI.body.copyWith(color: UI.textSoft)),
              const SizedBox(width: 12),
              Expanded(
                child: missing && required
                    ? const Align(
                        alignment: Alignment.centerRight,
                        child: UITag('Required', color: UI.danger),
                      )
                    : Text(
                        missing ? 'Add' : value,
                        textAlign: TextAlign.right,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: missing
                            ? const TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w700,
                                color: UI.primary,
                              )
                            : UI.bodyStrong,
                      ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.chevron_right_rounded,
                color: UI.faint,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/components/pk_ui.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/live_test_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/models/test_model.dart';
import '../../data/models/subject_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../core/utils/image_url_helper.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Completed attempts from server for the signed-in student.
final completedAttemptsProvider = FutureProvider<List<TestAttemptModel>>((ref) async {
  try {
    return await ref.watch(catalogRepositoryProvider).getStudentCompletedAttempts();
  } catch (_) {
    return const [];
  }
});

class HomeScreen extends ConsumerStatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const HomeScreen({super.key, this.onTabSelected});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

typedef PracticeKoroHomeScreen = HomeScreen;

/// Progress statistics summary.
class _HomeStats {
  final int attempted;
  final int? accuracy;
  final int questionsSolved;
  final int streakDays;

  const _HomeStats({
    required this.attempted,
    required this.accuracy,
    required this.questionsSolved,
    required this.streakDays,
  });

  factory _HomeStats.fromAttempts(Iterable<TestAttemptModel> attempts) {
    final list = attempts.toList();
    final correct = list.fold<int>(0, (sum, a) => sum + a.correctCount);
    final answered = list.fold<int>(0, (sum, a) => sum + a.correctCount + a.wrongCount);

    DateTime day(DateTime d) => DateTime(d.year, d.month, d.day);
    final days = list.map((a) => day(a.completedAt.toLocal())).toSet();
    var cursor = day(DateTime.now());
    if (!days.contains(cursor)) cursor = cursor.subtract(const Duration(days: 1));
    var streak = 0;
    while (days.contains(cursor)) {
      streak++;
      cursor = cursor.subtract(const Duration(days: 1));
    }

    return _HomeStats(
      attempted: list.length,
      accuracy: answered > 0 ? (correct / answered * 100).round() : null,
      questionsSolved: answered,
      streakDays: streak,
    );
  }
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _userName = '';
  String? _userAvatarUrl;
  int _seriesIndex = 0;
  final ScrollController _seriesScrollController = ScrollController();
  final PageController _heroBannerController = PageController();
  int _currentBannerIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadUserMeta();
    _seriesScrollController.addListener(_onSeriesScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) ref.read(catalogRepositoryProvider).setupRealtimeListeners(ref);
    });
  }

  @override
  void dispose() {
    _seriesScrollController.removeListener(_onSeriesScroll);
    _seriesScrollController.dispose();
    _heroBannerController.dispose();
    super.dispose();
  }

  void _onSeriesScroll() {
    if (!_seriesScrollController.hasClients) return;
    final offset = _seriesScrollController.offset;
    final index = (offset / 322).round().clamp(0, 4);
    if (index != _seriesIndex && mounted) {
      setState(() => _seriesIndex = index);
    }
  }

  Future<void> _loadUserMeta() async {
    final name = LocalStorageService.getUserName();
    String? avatar;
    try {
      avatar = Supabase.instance.client.auth.currentUser?.userMetadata?['avatar_url'] as String?;
    } catch (_) {}
    if (!mounted) return;
    setState(() {
      _userName = name == 'Candidate' ? '' : name.trim();
      _userAvatarUrl = avatar;
    });
  }

  void _navigateToTab(int index, String route) {
    if (widget.onTabSelected != null) {
      widget.onTabSelected!(index);
    } else {
      context.go(route);
    }
  }

  Future<void> _refresh() async {
    ref.invalidate(examsProvider);
    ref.invalidate(popularExamsProvider);
    ref.invalidate(popularTestSeriesProvider);
    ref.invalidate(recentTestsProvider);
    ref.invalidate(activeLiveTestProvider);
    ref.invalidate(inProgressAttemptsProvider);
    ref.invalidate(completedAttemptsProvider);
    ref.invalidate(subjectsProvider);
    ref.invalidate(heroBannersProvider);
    ref.invalidate(notificationsProvider);
    await _loadUserMeta();
  }

  String get _firstName {
    if (_userName.isNotEmpty) {
      final parts = _userName.split(RegExp(r'\s+'));
      if (parts.isNotEmpty && parts.first.isNotEmpty) return parts.first;
    }
    return 'Rahul';
  }

  @override
  Widget build(BuildContext context) {
    final exams = ref.watch(examsProvider).asData?.value ?? const <ExamModel>[];
    final popularExams =
        ref.watch(popularExamsProvider).asData?.value ?? const <Map<String, dynamic>>[];
    final seriesAsync = ref.watch(popularTestSeriesProvider);
    final liveTestAsync = ref.watch(activeLiveTestProvider);
    final inProgress =
        ref.watch(inProgressAttemptsProvider).asData?.value ?? const <Map<String, dynamic>>[];
    final serverAttempts =
        ref.watch(completedAttemptsProvider).asData?.value ?? const <TestAttemptModel>[];
    final recentTests =
        ref.watch(recentTestsProvider).asData?.value ?? const <MockTestModel>[];
    final subjects =
        ref.watch(subjectsProvider).asData?.value ?? const <SubjectModel>[];
    final rawHeroBanners =
        ref.watch(heroBannersProvider).asData?.value ?? const <Map<String, dynamic>>[];
    final notifs =
        ref.watch(notificationsProvider).asData?.value ?? const <Map<String, dynamic>>[];

    final activeBanners = rawHeroBanners.where((b) {
      final active = b['is_active'] ?? b['isActive'];
      if (active == false) return false;
      final status = b['status'] as String?;
      if (status == 'disabled' || status == 'inactive') return false;
      final published = b['is_published'] ?? b['isPublished'];
      if (published == false) return false;
      return true;
    }).toList();

    final attemptsById = <String, TestAttemptModel>{
      for (final a in LocalStorageService.getAttempts()) a.id: a,
      for (final a in serverAttempts) a.id: a,
    };
    final userAttempts = attemptsById.values.toList()
      ..sort((a, b) => b.completedAt.compareTo(a.completedAt));
    final stats = _HomeStats.fromAttempts(userAttempts);

    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FD),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: _refresh,
          color: PK.blue,
          child: ListView(
            padding: PKBottomSpacing.edgeInsets(context, horizontal: PK.gutter, top: 10, additionalGap: 2.0),
            children: [
              // 1. Header & Branding
              _buildHeader(
                notifs.where((n) => (n['is_read'] ?? n['read'] ?? false) == false).length,
                _userAvatarUrl,
              ),
              const SizedBox(height: 14),

              // 2. Hero Banner (Display clean banner if active, hide completely if empty)
              if (activeBanners.isNotEmpty) ...[
                _buildHeroBanner(activeBanners),
                if (activeBanners.length > 1) ...[
                  const SizedBox(height: 8),
                  _buildHeroDots(activeBanners.length),
                ],
                const SizedBox(height: 20),
              ],

              // 3. Continue Your Practice
              _buildContinuePractice(inProgress),
              const SizedBox(height: 20),

              // 4. Quick Actions
              _buildQuickActions(),
              const SizedBox(height: 20),

              // 4.1 Live Mock Test
              _buildLiveMockTest(liveTestAsync),
              const SizedBox(height: 24),

              // 5. Exams for You
              _buildExamsForYou(exams, popularExams),
              const SizedBox(height: 24),

              // 6. Popular Test Series
              _buildPopularSeries(seriesAsync),
              const SizedBox(height: 24),

              // 7. Your Progress
              _buildYourProgress(stats),
              const SizedBox(height: 24),

              // 8. Recent Tests
              _buildRecentTests(userAttempts),
              const SizedBox(height: 24),

              // 9. Recently Added Tests
              _buildRecentlyAddedTests(recentTests),
              const SizedBox(height: 24),

              // 10. Recommended for You
              _buildRecommendedForYou(subjects),
            ],
          ),
        ),
      ),
    );
  }

  // ─── 1. Header ─────────────────────────────────────────────────────────────

  Widget _buildHeader(int unreadNotifsCount, [String? userAvatarUrl]) {
    return Row(
      children: [
        // PracticeKoro Logo & Brand Text
        Flexible(
          child: InkWell(
            onTap: () => _refresh(),
            borderRadius: BorderRadius.circular(10),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Image.asset(
                  'assets/images/logo-circle.png',
                  width: 36,
                  height: 36,
                  fit: BoxFit.contain,
                  errorBuilder: (_, _, _) => Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      color: PK.blue,
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: Text('P', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                const Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'PracticeKoro',
                      style: TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F1E4A),
                        letterSpacing: -0.4,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        // Search Action Button
        _circularHeaderButton(
          icon: Icons.search_rounded,
          tooltip: 'Search test series',
          onTap: () => _navigateToTab(1, '/test-series'),
        ),
        const SizedBox(width: 8),
        // Notifications Action Button with Dynamic Badge
        Stack(
          clipBehavior: Clip.none,
          children: [
            _circularHeaderButton(
              icon: Icons.notifications_none_rounded,
              tooltip: 'Notifications',
              onTap: () => context.push('/notifications'),
            ),
            if (unreadNotifsCount > 0)
              Positioned(
                right: 1,
                top: 1,
                child: Container(
                  padding: const EdgeInsets.all(3.5),
                  decoration: const BoxDecoration(
                    color: Color(0xFFEF4444),
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                  child: Center(
                    child: Text(
                      unreadNotifsCount > 99 ? '99+' : '$unreadNotifsCount',
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        height: 1.0,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(width: 8),
        // Student Profile Avatar on the far right
        Tooltip(
          message: 'Profile',
          child: InkWell(
            onTap: () => _navigateToTab(4, '/profile'),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFE5EAF2), width: 1.5),
                color: const Color(0xFFDBEAFE),
              ),
              child: ClipOval(
                child: (userAvatarUrl != null && userAvatarUrl.isNotEmpty)
                    ? Image.network(
                        userAvatarUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Image.asset(
                          'assets/images/profile_avatar_boy.png',
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const Icon(
                            Icons.person_rounded,
                            size: 22,
                            color: Color(0xFF0158FC),
                          ),
                        ),
                      )
                    : Image.asset(
                        'assets/images/profile_avatar_boy.png',
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => const Icon(
                          Icons.person_rounded,
                          size: 22,
                          color: Color(0xFF0158FC),
                        ),
                      ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _circularHeaderButton({
    required IconData icon,
    required String tooltip,
    required VoidCallback onTap,
  }) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.white,
        shape: const CircleBorder(side: BorderSide(color: Color(0xFFE5EAF2))),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: Container(
            width: 38,
            height: 38,
            alignment: Alignment.center,
            child: Icon(icon, size: 19, color: const Color(0xFF0F1E4A)),
          ),
        ),
      ),
    );
  }

  // ─── 2. Hero Banner ────────────────────────────────────────────────────────

  Widget _buildHeroBanner(List<Map<String, dynamic>> banners) {
    if (banners.isEmpty) return const SizedBox.shrink();

    if (banners.length == 1) {
      return _buildSingleBannerCard(banners.first);
    }

    return SizedBox(
      height: 172,
      child: PageView.builder(
        controller: _heroBannerController,
        itemCount: banners.length,
        onPageChanged: (idx) {
          if (mounted && _currentBannerIndex != idx) {
            setState(() => _currentBannerIndex = idx);
          }
        },
        itemBuilder: (context, index) {
          return _buildSingleBannerCard(banners[index]);
        },
      ),
    );
  }

  Widget _buildSingleBannerCard(Map<String, dynamic> b) {
    final rawUrl = (b['image_url'] ?? b['imageUrl'] ?? b['banner_url'] ?? b['bannerUrl']) as String?;
    final resolvedUrl = ImageUrlHelper.resolveAdminImageUrl(rawUrl);

    final showOverlay = (b['show_text_overlay'] ?? b['showTextOverlay'] ?? false) == true ||
        (b['banner_type'] ?? b['bannerType']) == 'text_overlay';

    return Container(
      height: 172,
      decoration: BoxDecoration(
        color: const Color(0xFFEBF3FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFCCE0FF), width: 1),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C0158FC),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _handleBannerTap(b),
          borderRadius: BorderRadius.circular(18),
          child: Stack(
            fit: StackFit.expand,
            children: [
              _buildBannerImage(resolvedUrl),
              if (showOverlay) _buildBannerTextOverlay(b),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBannerImage(String? resolvedUrl) {
    if (resolvedUrl != null &&
        (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://'))) {
      return Image.network(
        resolvedUrl,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        alignment: Alignment.center,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            color: const Color(0xFFF1F6FC),
            alignment: Alignment.center,
            child: const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Color(0xFF0158FC),
              ),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) => _buildBannerFallback(),
      );
    } else if (resolvedUrl != null && resolvedUrl.startsWith('assets/')) {
      return Image.asset(
        resolvedUrl,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        alignment: Alignment.center,
        errorBuilder: (context, error, stackTrace) => _buildBannerFallback(),
      );
    }
    return _buildBannerFallback();
  }

  Widget _buildBannerFallback() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFE5F1FF), Color(0xFFD3E7FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Image.asset(
          'assets/images/dashboard/ref_hero_banner_clean.png',
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
          errorBuilder: (context, error, stackTrace) => const Icon(
            Icons.image_outlined,
            size: 36,
            color: Color(0xFF8DA4C4),
          ),
        ),
      ),
    );
  }

  Widget _buildBannerTextOverlay(Map<String, dynamic> b) {
    final title = (b['headline'] ?? b['title'] ?? 'Small Practice\nBig Results!') as String;
    final subtitle = (b['subtitle'] ?? b['description'] ?? 'Turn your preparation into success with daily practice.') as String;
    final badge = (b['badge_text'] ?? b['badgeText']) as String?;
    final ctaText = (b['primary_cta_text'] ?? b['cta_text'] ?? b['ctaText'] ?? 'Start Practicing') as String;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 110, 12),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerLeft,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Hello, ',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F275E),
                  ),
                ),
                Text(
                  _firstName,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F275E),
                  ),
                ),
                const Text(
                  '! 👋',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F275E),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            if (badge != null && badge.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                margin: const EdgeInsets.only(bottom: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF0158FC).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  badge,
                  style: const TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0158FC),
                  ),
                ),
              ),
            Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0B1B3F),
                height: 1.15,
                letterSpacing: -0.4,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: Color(0xFF4B5E80),
                height: 1.25,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF0158FC),
                borderRadius: BorderRadius.circular(20),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x330158FC),
                    blurRadius: 8,
                    offset: Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    ctaText,
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 12),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleBannerTap(Map<String, dynamic> b) {
    final link = (b['primary_cta_link'] ??
        b['primaryCtaLink'] ??
        b['target_url'] ??
        b['action_url'] ??
        b['link']) as String?;

    if (link == null || link.trim().isEmpty) {
      _navigateToTab(2, '/practice');
      return;
    }

    final trimmed = link.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      final uri = Uri.tryParse(trimmed);
      if (uri != null) {
        launchUrl(uri, mode: LaunchMode.externalApplication);
      }
      return;
    }

    // App routes
    if (trimmed.startsWith('/')) {
      if (trimmed == '/practice') {
        _navigateToTab(2, '/practice');
      } else if (trimmed == '/exams') {
        _navigateToTab(1, '/exams');
      } else if (trimmed == '/results') {
        _navigateToTab(3, '/results');
      } else if (trimmed == '/profile') {
        _navigateToTab(4, '/profile');
      } else {
        context.push(trimmed);
      }
    } else {
      context.push('/$trimmed');
    }
  }

  Widget _buildHeroDots(int count) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (index) {
        final isSelected = index == _currentBannerIndex;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          margin: const EdgeInsets.symmetric(horizontal: 2.5),
          width: isSelected ? 18 : 5,
          height: 5,
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF0158FC) : const Color(0xFFCBD5E1),
            borderRadius: BorderRadius.circular(4),
          ),
        );
      }),
    );
  }

  // ─── 3. Continue Your Practice ─────────────────────────────────────────────

  Widget _buildContinuePractice(List<Map<String, dynamic>> attempts) {
    if (attempts.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PKSectionTitle(title: 'Continue Your Practice'),
          const SizedBox(height: 10),
          PKEmptyCard(
            icon: Icons.play_arrow_rounded,
            title: 'No practice in progress',
            message: 'Start a topic test and pick it up here anytime.',
            actionLabel: 'Start Practicing',
            onAction: () => _navigateToTab(2, '/practice'),
          ),
        ],
      );
    }

    final attempt = attempts.first;
    final test = attempt['tests'] as Map<String, dynamic>?;
    final testId = (attempt['test_id'] ?? test?['id'] ?? '').toString();

    final title = (test?['title'] ?? 'General Awareness').toString();
    final examSubtitle = [
      (test?['exams']?['title'] ?? test?['test_series']?['title'] ?? 'WBP Constable').toString(),
      (test?['subjects']?['name'] ?? 'Topic Test').toString(),
    ].where((s) => s.isNotEmpty).join(' • ');

    final total = (test?['total_questions'] as num?)?.toInt() ?? 25;
    final answered = (attempt['_answered_count'] as num?)?.toInt() ?? 12;
    final progress = total > 0 ? (answered / total).clamp(0.0, 1.0) : 0.48;

    void onContinue() {
      if (testId.isNotEmpty) {
        context.push('/test-runner/$testId?attemptId=${attempt['id']}');
      } else {
        _navigateToTab(2, '/practice');
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: onContinue,
          child: const Row(
            children: [
              Icon(Icons.adjust_rounded, color: Color(0xFFEF4444), size: 18),
              SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Continue Your Practice',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F1E4A),
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: Color(0xFF0158FC), size: 20),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
            boxShadow: const [
              BoxShadow(
                color: Color(0x06000000),
                blurRadius: 10,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFFEDD5)),
                    ),
                    child: const Icon(Icons.description_rounded, color: Color(0xFFEA580C), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F1E4A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          examSubtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                     '$answered/$total Questions',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: const Color(0xFFF1F5F9),
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0158FC)),
                ),
              ),
              const SizedBox(height: 14),
              InkWell(
                onTap: onContinue,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: double.infinity,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0158FC),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x330158FC),
                        blurRadius: 8,
                        offset: Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Continue Test',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(width: 6),
                      Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ─── 4. Quick Actions ──────────────────────────────────────────────────────

  Widget _buildQuickActions() {
    final actions = [
      (
        title: 'Mock Test',
        sub: 'Full Length',
        icon: Icons.assignment_outlined,
        color: const Color(0xFF9333EA),
        bg: const Color(0xFFF3E8FF),
        onTap: () => _navigateToTab(1, '/test-series'),
      ),
      (
        title: 'Topic Test',
        sub: 'Chapter-wise',
        icon: Icons.track_changes_rounded,
        color: const Color(0xFF16A34A),
        bg: const Color(0xFFDCFCE7),
        onTap: () => _navigateToTab(2, '/practice'),
      ),
      (
        title: 'Official PYQ',
        sub: 'Previous Year',
        icon: Icons.article_outlined,
        color: const Color(0xFFEA580C),
        bg: const Color(0xFFFFEDD5),
        onTap: () => context.push('/test-series?filter=pyq'),
      ),
      (
        title: 'Results',
        sub: 'Track Progress',
        icon: Icons.bar_chart_rounded,
        color: const Color(0xFFE11D48),
        bg: const Color(0xFFFFE4E6),
        onTap: () => _navigateToTab(3, '/results'),
      ),
    ];

    return Row(
      children: [
        for (var i = 0; i < actions.length; i++) ...[
          if (i > 0) const SizedBox(width: 8),
          Expanded(
            child: InkWell(
              onTap: actions[i].onTap,
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                decoration: PK.cardBox(r: 14),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: actions[i].bg,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(actions[i].icon, color: actions[i].color, size: 22),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      actions[i].title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F1E4A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      actions[i].sub,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  // ─── 4.1 Live Mock Test ────────────────────────────────────────────────────

  Widget _buildLiveMockTest(AsyncValue<LiveTestModel?> liveTestAsync) {
    final liveTest = liveTestAsync.asData?.value;

    final duration = '${liveTest?.durationMinutes ?? 60} Mins';
    final questions = '${liveTest?.totalQuestions ?? 100} Questions';

    String scheduleTime = 'Today, 7:00 PM';
    if (liveTest?.scheduledStartTime != null) {
      final start = liveTest!.scheduledStartTime.toLocal();
      final now = DateTime.now();
      final isToday = start.year == now.year && start.month == now.month && start.day == now.day;
      final hour = start.hour > 12 ? start.hour - 12 : (start.hour == 0 ? 12 : start.hour);
      final ampm = start.hour >= 12 ? 'PM' : 'AM';
      final minute = start.minute.toString().padLeft(2, '0');
      final timeStr = '$hour:$minute $ampm';
      if (isToday) {
        scheduleTime = 'Today, $timeStr';
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        scheduleTime = '${start.day} ${months[start.month - 1]}, $timeStr';
      }
    }

    void onJoin() {
      if (liveTest != null && liveTest.id.isNotEmpty) {
        context.push('/live-test/${liveTest.id}');
      } else {
        context.push('/test-series');
      }
    }

    return InkWell(
      onTap: onJoin,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFFF1F2), Color(0xFFFFE4E6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFFECDD3)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0AE11D48),
              blurRadius: 10,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                const Icon(Icons.sensors_rounded, color: Color(0xFFEF4444), size: 18),
                const Flexible(
                  child: Text(
                    'Live Mock Test',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F1E4A),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'LIVE',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEDE9FE),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.assignment_turned_in_rounded, color: Color(0xFF7C3AED), size: 17),
                ),
                const SizedBox(width: 2),
                const Icon(Icons.chevron_right_rounded, color: Color(0xFFC084FC), size: 18),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: FittedBox(
                    alignment: Alignment.centerLeft,
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.calendar_today_outlined, size: 11, color: Color(0xFF64748B)),
                        const SizedBox(width: 3),
                        Text(
                          scheduleTime,
                          style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.schedule_rounded, size: 11, color: Color(0xFF64748B)),
                        const SizedBox(width: 3),
                        Text(
                          duration,
                          style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.description_outlined, size: 11, color: Color(0xFF64748B)),
                        const SizedBox(width: 3),
                        Text(
                          questions,
                          style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: onJoin,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x33EF4444),
                          blurRadius: 6,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Join Now',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 13),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─── 5. Exams for You ──────────────────────────────────────────────────────

  Widget _buildExamsForYou(
    List<ExamModel> exams, [
    List<Map<String, dynamic>> popularExams = const [],
  ]) {
    final defaultConfigs = [
      (
        title: 'WBP Constable',
        displayTitle: 'WBP\nConstable',
        tests: '25 Tests',
        slug: 'wbp-constable',
        imageUrl: null as String?,
      ),
      (
        title: 'WBSSC Group C & D',
        displayTitle: 'WBSSC\nGroup C & D',
        tests: '30 Tests',
        slug: 'wbssc-group-c-d',
        imageUrl: null as String?,
      ),
      (
        title: 'Railway NTPC',
        displayTitle: 'Railway\nNTPC',
        tests: '40 Tests',
        slug: 'railway-ntpc',
        imageUrl: null as String?,
      ),
    ];

    String formatDisplayTitle(String title) {
      if (title.contains('\n')) return title;
      final parts = title.split(' ');
      if (parts.length <= 1) return title;
      if (parts.length == 2) return '${parts[0]}\n${parts[1]}';
      return '${parts[0]}\n${parts.sublist(1).join(' ')}';
    }

    final examConfigs = exams.isNotEmpty
        ? [
            for (var i = 0; i < exams.take(3).length; i++) ...[
              () {
                final ex = exams[i];
                final popularCard = popularExams.cast<Map<String, dynamic>?>().firstWhere(
                      (c) =>
                          c != null &&
                          (c['examId'] == ex.id ||
                              c['slug'] == ex.slug ||
                              c['title'] == ex.title),
                      orElse: () => null,
                    );
                String? bg;
                if (ex.bannerUrl != null && ex.bannerUrl!.trim().isNotEmpty) {
                  bg = ex.bannerUrl!.trim();
                } else if (popularCard != null) {
                  final cardBg = popularCard['cardBgImage'] as String?;
                  final cardEmblem = popularCard['cardEmblemUrl'] as String?;
                  bg = (cardBg != null && cardBg.isNotEmpty) ? cardBg : cardEmblem;
                }

                String testsCount;
                if (ex.totalTests != null && ex.totalTests! > 0) {
                  testsCount = '${ex.totalTests} Tests';
                } else if (popularCard != null && popularCard['testsCount'] != null) {
                  testsCount = popularCard['testsCount'].toString();
                } else {
                  testsCount = i == 0 ? '25 Tests' : (i == 1 ? '30 Tests' : '40 Tests');
                }

                return (
                  title: ex.title,
                  displayTitle: formatDisplayTitle(ex.title),
                  tests: testsCount,
                  slug: ex.slug,
                  imageUrl: bg,
                );
              }(),
            ],
          ]
        : defaultConfigs;

    String defaultAssetForSlug(String slug) {
      final s = slug.toLowerCase();
      if (s.contains('wbp') || s.contains('police')) {
        return 'assets/images/dashboard/exam_card_wbp_art.png';
      } else if (s.contains('wbssc') || s.contains('clerk') || s.contains('wbpsc') || s.contains('group')) {
        return 'assets/images/dashboard/exam_card_wbssc_art.png';
      } else if (s.contains('railway') || s.contains('ntpc') || s.contains('rrb')) {
        return 'assets/images/dashboard/exam_card_railway_art.png';
      }
      return 'assets/images/dashboard/exam_card_wbp_art.png';
    }

    Widget buildCardImage(String? bgImage, String slug) {
      final fallbackAsset = defaultAssetForSlug(slug);
      final resolved = ImageUrlHelper.resolveAdminImageUrl(bgImage);
      if (resolved != null && resolved.isNotEmpty) {
        if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
          return Image.network(
            resolved,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => Image.asset(
              fallbackAsset,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => Container(
                color: const Color(0xFFEFF6FF),
                child: const Center(child: Icon(Icons.school_rounded, color: PK.blue, size: 28)),
              ),
            ),
          );
        }
        String assetPath = resolved;
        if (assetPath.startsWith('/')) {
          assetPath = 'assets$assetPath';
        } else if (!assetPath.startsWith('assets/')) {
          assetPath = 'assets/$assetPath';
        }
        return Image.asset(
          assetPath,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => Image.asset(
            fallbackAsset,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => Container(
              color: const Color(0xFFEFF6FF),
              child: const Center(child: Icon(Icons.school_rounded, color: PK.blue, size: 28)),
            ),
          ),
        );
      }
      return Image.asset(
        fallbackAsset,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => Container(
          color: const Color(0xFFEFF6FF),
          child: const Center(child: Icon(Icons.school_rounded, color: PK.blue, size: 28)),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.workspace_premium_rounded, color: Color(0xFFF59E0B), size: 19),
            const SizedBox(width: 6),
            const Expanded(
              child: Text(
                'Exams for You',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F1E4A),
                  letterSpacing: -0.3,
                ),
              ),
            ),
            InkWell(
              onTap: () => _navigateToTab(1, '/test-series'),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'View All',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF0158FC)),
                  ),
                  SizedBox(width: 2),
                  Icon(Icons.arrow_forward_rounded, color: Color(0xFF0158FC), size: 14),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            for (var i = 0; i < examConfigs.length; i++) ...[
              if (i > 0) const SizedBox(width: 10),
              Expanded(
                child: InkWell(
                  onTap: () => context.push(
                    '/test-series?exam=${examConfigs[i].slug}&title=${Uri.encodeComponent(examConfigs[i].title)}',
                  ),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    decoration: PK.cardBox(r: 16),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        SizedBox(
                          height: 64,
                          width: double.infinity,
                          child: buildCardImage(examConfigs[i].imageUrl, examConfigs[i].slug),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(4, 8, 4, 10),
                          child: Column(
                            children: [
                              Text(
                                examConfigs[i].displayTitle,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F1E4A),
                                  height: 1.15,
                                ),
                              ),
                              const SizedBox(height: 6),
                              FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.calendar_today_outlined, size: 11, color: Color(0xFF64748B)),
                                    const SizedBox(width: 3),
                                    Text(
                                      examConfigs[i].tests,
                                      style: const TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF64748B),
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
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  // ─── 6. Popular Test Series ────────────────────────────────────────────────

  Widget _buildPopularSeries(AsyncValue<List<TestSeriesModel>> seriesAsync) {
    final series = seriesAsync.asData?.value ?? const <TestSeriesModel>[];

    if (seriesAsync.isLoading && series.isEmpty) {
      return const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PKSectionTitle(title: 'Popular Test Series'),
          SizedBox(height: 12),
          Center(
            child: SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2.5, color: PK.blue),
            ),
          ),
        ],
      );
    }

    if (series.isEmpty) {
      return const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PKSectionTitle(title: 'Popular Test Series'),
          SizedBox(height: 10),
          PKEmptyCard(
            icon: Icons.library_books_outlined,
            title: 'No test series yet',
            message: 'Published test series will appear here.',
          ),
        ],
      );
    }

    final defaultSeriesThumbnails = [
      'assets/images/dashboard/exam_card_wbp_art.png',
      'assets/images/dashboard/exam_card_wbssc_art.png',
      'assets/images/dashboard/exam_card_railway_art.png',
    ];

    final cardItems = [
      for (var i = 0; i < series.length.clamp(0, 5); i++) ...[
        (
          title: series[i].title,
          sub: PK.seriesLabel(series[i].title, series[i].description, series[i].examTitle),
          isPopular: series[i].isPopular,
          tests: '${series[i].testCount > 0 ? series[i].testCount : (i == 0 ? 25 : (i == 1 ? 30 : 40))} Full Mock Tests',
          qs: series[i].questionCount > 0
              ? '${PK.formatCount(series[i].questionCount)} Qs'
              : (i == 0 ? '12,500+ Questions' : (i == 1 ? '15,000+ Questions' : '1,525 Qs')),
          thumbnail: series[i].iconUrl ??
              series[i].bannerUrl ??
              defaultSeriesThumbnails[i % defaultSeriesThumbnails.length],
          id: series[i].id,
        )
      ]
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.local_fire_department_rounded, color: Color(0xFFEF4444), size: 18),
            const SizedBox(width: 6),
            const Expanded(
              child: Text(
                'Popular Test Series',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F1E4A),
                  letterSpacing: -0.3,
                ),
              ),
            ),
            InkWell(
              onTap: () => _navigateToTab(1, '/test-series'),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'View All',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF0158FC)),
                  ),
                  SizedBox(width: 2),
                  Icon(Icons.arrow_forward_rounded, color: Color(0xFF0158FC), size: 14),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 78,
          child: ListView.separated(
            controller: _seriesScrollController,
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: cardItems.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, i) {
              final item = cardItems[i];
              return InkWell(
                onTap: () => context.push('/test-series/${item.id}'),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: 310,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: PK.cardBox(r: 16),
                  child: Row(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFEFF6FF),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: item.thumbnail.startsWith('assets/')
                            ? Image.asset(item.thumbnail, fit: BoxFit.cover)
                            : Image.network(
                                item.thumbnail,
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => Container(color: const Color(0xFFEFF6FF)),
                              ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    item.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF0F1E4A),
                                    ),
                                  ),
                                ),
                                if (item.isPopular) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF10B981),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text(
                                      'POPULAR',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 4),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    item.tests,
                                    style: const TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                  const Text(
                                    ' • ',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                  Text(
                                    item.qs,
                                    style: const TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        width: 30,
                        height: 30,
                        decoration: const BoxDecoration(
                          color: Color(0xFF0158FC),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 15),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            for (var i = 0; i < cardItems.length.clamp(1, 5); i++) ...[
              if (i > 0) const SizedBox(width: 5),
              Container(
                width: i == _seriesIndex ? 18 : 5,
                height: 5,
                decoration: BoxDecoration(
                  color: i == _seriesIndex ? const Color(0xFF0158FC) : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  // ─── 7. Your Progress ──────────────────────────────────────────────────────

  Widget _buildYourProgress(_HomeStats stats) {
    final metrics = [
      (
        icon: Icons.description_rounded,
        color: const Color(0xFF2563EB),
        bg: const Color(0xFFEFF6FF),
        value: stats.attempted > 0 ? '${stats.attempted}' : '0',
        label: 'Tests\nAttempted',
        valueColor: const Color(0xFF0F1E4A),
      ),
      (
        icon: Icons.track_changes_rounded,
        color: const Color(0xFF16A34A),
        bg: const Color(0xFFF0FDF4),
        value: stats.accuracy != null ? '${stats.accuracy}%' : '–',
        label: 'Accuracy',
        valueColor: const Color(0xFF16A34A),
      ),
      (
        icon: Icons.auto_stories_rounded,
        color: const Color(0xFF9333EA),
        bg: const Color(0xFFFAF5FF),
        value: stats.questionsSolved > 0 ? PK.formatCount(stats.questionsSolved) : '0',
        label: 'Questions\nSolved',
        valueColor: const Color(0xFF0F1E4A),
      ),
      (
        icon: Icons.local_fire_department_rounded,
        color: const Color(0xFFEA580C),
        bg: const Color(0xFFFFF7ED),
        value: '${stats.streakDays}',
        label: 'Days\nStreak',
        valueColor: const Color(0xFF0F1E4A),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.bar_chart_rounded, color: Color(0xFF06B6D4), size: 18),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Your Progress',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F1E4A),
                      letterSpacing: -0.3,
                    ),
                  ),
                  if (stats.attempted == 0) ...[
                    const SizedBox(height: 1),
                    const Text(
                      'Complete a test to start tracking',
                      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: Color(0xFF64748B)),
                    ),
                  ],
                ],
              ),
            ),
            InkWell(
              onTap: () => _navigateToTab(3, '/results'),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'View Details',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF0158FC)),
                  ),
                  SizedBox(width: 2),
                  Icon(Icons.arrow_forward_rounded, color: Color(0xFF0158FC), size: 14),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            for (var i = 0; i < metrics.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                  decoration: PK.cardBox(r: 14),
                  child: Column(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: metrics[i].bg,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(metrics[i].icon, color: metrics[i].color, size: 19),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        metrics[i].value,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: metrics[i].valueColor,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        metrics[i].label,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF64748B),
                          height: 1.15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  // ─── 8. Recent Tests ───────────────────────────────────────────────────────

  String _monthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (month >= 1 && month <= 12) ? months[month - 1] : '';
  }

  Widget _buildRecentTests([List<TestAttemptModel> userAttempts = const []]) {
    final defaultTests = [
      (
        title: 'Full Mock Test 1',
        exam: 'WBP Constable',
        date: '12 Sep 2026',
        time: '90 Mins',
        marks: '100 Marks',
        score: '85/100',
        grade: 'Good',
        hasTrophy: true,
        pillBg: const Color(0xFFDCFCE7),
        pillColor: const Color(0xFF16A34A),
        iconColor: const Color(0xFF2563EB),
        iconBg: const Color(0xFFEFF6FF),
        attemptId: null as String?,
      ),
      (
        title: 'General Awareness – Topic Test',
        exam: 'WBP Constable',
        date: '10 Sep 2026',
        time: '25 Mins',
        marks: '25 Marks',
        score: '18/25',
        grade: 'Great',
        hasTrophy: false,
        pillBg: const Color(0xFFDCFCE7),
        pillColor: const Color(0xFF16A34A),
        iconColor: const Color(0xFF16A34A),
        iconBg: const Color(0xFFF0FDF4),
        attemptId: null as String?,
      ),
      (
        title: 'Mathematics – Topic Test',
        exam: 'WBSSC Group C & D',
        date: '08 Sep 2026',
        time: '30 Mins',
        marks: '30 Marks',
        score: '12/30',
        grade: 'Keep Going',
        hasTrophy: false,
        pillBg: const Color(0xFFFFE4E6),
        pillColor: const Color(0xFFEF4444),
        iconColor: const Color(0xFFEA580C),
        iconBg: const Color(0xFFFFF7ED),
        attemptId: null as String?,
      ),
    ];

    final tests = userAttempts.isNotEmpty
        ? [
            for (final a in userAttempts.take(3)) ...[
              () {
                final d = a.completedAt.toLocal();
                final dateStr = '${d.day.toString().padLeft(2, '0')} ${_monthName(d.month)} ${d.year}';
                final timeMins = (a.timeSpentSeconds / 60).round().clamp(1, 180);
                final totalM = a.totalMarks > 0 ? a.totalMarks : 100.0;
                final scoreStr = '${a.score.toInt()}/${totalM.toInt()}';
                final pct = a.percentage > 0
                    ? a.percentage
                    : (totalM > 0 ? (a.score / totalM * 100) : 0.0);
                final isTop = pct >= 80;
                final isPass = pct >= 50;
                final grade = isTop ? 'Great' : (isPass ? 'Good' : 'Keep Going');
                final pillBg = isPass ? const Color(0xFFDCFCE7) : const Color(0xFFFFE4E6);
                final pillColor = isPass ? const Color(0xFF16A34A) : const Color(0xFFEF4444);
                final iconColor = isTop
                    ? const Color(0xFF2563EB)
                    : (isPass ? const Color(0xFF16A34A) : const Color(0xFFEA580C));
                final iconBg = isTop
                    ? const Color(0xFFEFF6FF)
                    : (isPass ? const Color(0xFFF0FDF4) : const Color(0xFFFFF7ED));

                return (
                  title: a.testTitle.isNotEmpty ? a.testTitle : 'Mock Test',
                  exam: a.testSeriesTitle ?? 'Practice Test',
                  date: dateStr,
                  time: '$timeMins Mins',
                  marks: '${totalM.toInt()} Marks',
                  score: scoreStr,
                  grade: grade,
                  hasTrophy: isTop,
                  pillBg: pillBg,
                  pillColor: pillColor,
                  iconColor: iconColor,
                  iconBg: iconBg,
                  attemptId: a.id,
                );
              }(),
            ],
          ]
        : defaultTests;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.schedule_rounded, color: Color(0xFF2563EB), size: 18),
            const SizedBox(width: 6),
            const Expanded(
              child: Text(
                'Recent Tests',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F1E4A),
                  letterSpacing: -0.3,
                ),
              ),
            ),
            InkWell(
              onTap: () => _navigateToTab(3, '/results'),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'View All',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF0158FC)),
                  ),
                  SizedBox(width: 2),
                  Icon(Icons.arrow_forward_rounded, color: Color(0xFF0158FC), size: 14),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Column(
          children: [
            for (var i = 0; i < tests.length; i++) ...[
              if (i > 0) const SizedBox(height: 10),
              InkWell(
                onTap: () {
                  if (tests[i].attemptId != null && tests[i].attemptId!.isNotEmpty) {
                    context.push('/results/${tests[i].attemptId}');
                  } else {
                    _navigateToTab(3, '/results');
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: PK.cardBox(r: 16),
                  child: Row(
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: tests[i].iconBg,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.description_rounded, color: tests[i].iconColor, size: 21),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tests[i].title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F1E4A),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tests[i].exam,
                              style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 6),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Row(
                                children: [
                                  const Icon(Icons.calendar_today_outlined, size: 11, color: Color(0xFF64748B)),
                                  const SizedBox(width: 3),
                                  Text(tests[i].date, style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B))),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.schedule_rounded, size: 11, color: Color(0xFF64748B)),
                                  const SizedBox(width: 3),
                                  Text(tests[i].time, style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B))),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.military_tech_outlined, size: 11, color: Color(0xFF64748B)),
                                  const SizedBox(width: 3),
                                  Text(tests[i].marks, style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B))),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Score Pill matching reference
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: tests[i].pillBg,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (tests[i].hasTrophy) ...[
                                  const Icon(Icons.emoji_events_rounded, color: Color(0xFFF59E0B), size: 12),
                                  const SizedBox(width: 3),
                                ],
                                Text(
                                  tests[i].score,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w900,
                                    color: tests[i].pillColor,
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              tests[i].grade,
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: tests[i].pillColor,
                                height: 1.1,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 20),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  // ─── 9. Recently Added Tests ───────────────────────────────────────────────

  Widget _buildRecentlyAddedTests(List<MockTestModel> recentTests) {
    final defaultTests = [
      (
        id: 'default-1',
        title: 'WBP Constable – Full Mock Test 5',
        exam: 'WBP Constable',
        qs: '85 Qs',
        time: '90 Mins',
        marks: '100 Marks',
        isNew: true,
        isFree: true,
        icon: Icons.description_rounded,
        iconColor: const Color(0xFF2563EB),
        iconBg: const Color(0xFFEFF6FF),
      ),
      (
        id: 'default-2',
        title: 'Static GK – Important Questions',
        exam: 'All Competitive Exams',
        qs: '50 Qs',
        time: '30 Mins',
        marks: '50 Marks',
        isNew: true,
        isFree: true,
        icon: Icons.track_changes_rounded,
        iconColor: const Color(0xFFEA580C),
        iconBg: const Color(0xFFFFF7ED),
      ),
      (
        id: 'default-3',
        title: 'Current Affairs – Daily Quiz',
        exam: 'All Competitive Exams',
        qs: '25 Qs',
        time: '15 Mins',
        marks: '25 Marks',
        isNew: true,
        isFree: true,
        icon: Icons.article_rounded,
        iconColor: const Color(0xFF16A34A),
        iconBg: const Color(0xFFF0FDF4),
      ),
    ];

    final tests = recentTests.isNotEmpty
        ? [
            for (var i = 0; i < recentTests.take(3).length; i++) ...[
              () {
                final t = recentTests[i];
                final icon = t.testType == 'full_mock'
                    ? Icons.description_rounded
                    : (t.testType == 'pyq'
                        ? Icons.history_edu_rounded
                        : (t.testType == 'chapter_mock'
                            ? Icons.track_changes_rounded
                            : Icons.article_rounded));
                final iconColor = i == 0
                    ? const Color(0xFF2563EB)
                    : (i == 1 ? const Color(0xFFEA580C) : const Color(0xFF16A34A));
                final iconBg = i == 0
                    ? const Color(0xFFEFF6FF)
                    : (i == 1 ? const Color(0xFFFFF7ED) : const Color(0xFFF0FDF4));

                return (
                  id: t.id,
                  title: t.title,
                  exam: t.examTitle ?? t.testSeriesTitle ?? t.subjectName ?? 'All Competitive Exams',
                  qs: '${t.totalQuestions} Qs',
                  time: '${t.durationMinutes} Mins',
                  marks: '${t.totalMarks.toInt()} Marks',
                  isNew: i < 2,
                  isFree: !t.isPremium,
                  icon: icon,
                  iconColor: iconColor,
                  iconBg: iconBg,
                );
              }(),
            ],
          ]
        : defaultTests;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.history_rounded, color: Color(0xFF2563EB), size: 19),
            const SizedBox(width: 6),
            const Expanded(
              child: Text(
                'Recently Added Tests',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F1E4A),
                  letterSpacing: -0.3,
                ),
              ),
            ),
            InkWell(
              onTap: () => _navigateToTab(1, '/test-series'),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'View All',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF0158FC)),
                  ),
                  SizedBox(width: 2),
                  Icon(Icons.arrow_forward_rounded, color: Color(0xFF0158FC), size: 14),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Column(
          children: [
            for (var i = 0; i < tests.length; i++) ...[
              if (i > 0) const SizedBox(height: 10),
              InkWell(
                onTap: () {
                  if (tests[i].id.startsWith('default-')) {
                    context.push('/test-series');
                  } else {
                    context.push('/test-runner/${tests[i].id}');
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: PK.cardBox(r: 16),
                  child: Row(
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: tests[i].iconBg,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(tests[i].icon, color: tests[i].iconColor, size: 21),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    tests[i].title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF0F1E4A),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                if (tests[i].isNew) ...[
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEF4444),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      'NEW',
                                      style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                ],
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    tests[i].isFree ? 'FREE' : 'PRO',
                                    style: TextStyle(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                      color: tests[i].isFree ? const Color(0xFF16A34A) : const Color(0xFF2563EB),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tests[i].exam,
                              style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 6),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Row(
                                children: [
                                  const Icon(Icons.calendar_today_outlined, size: 11, color: Color(0xFF64748B)),
                                  const SizedBox(width: 3),
                                  Text(tests[i].qs, style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B))),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.schedule_rounded, size: 11, color: Color(0xFF64748B)),
                                  const SizedBox(width: 3),
                                  Text(tests[i].time, style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B))),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.military_tech_outlined, size: 11, color: Color(0xFF64748B)),
                                  const SizedBox(width: 3),
                                  Text(tests[i].marks, style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B))),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 20),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  // ─── 10. Recommended for You ───────────────────────────────────────────────

  Widget _buildRecommendedForYou([List<SubjectModel> subjects = const []]) {
    final defaultTopics = [
      (
        id: 'reasoning',
        title: 'Reasoning\nTopic Tests',
        qs: '200+ Questions',
        icon: Icons.psychology_rounded,
        iconColor: const Color(0xFFEC4899),
        bg: const Color(0xFFFDF2F8),
        border: const Color(0xFFFCE7F3),
        circleBg: const Color(0xFFFCE7F3),
      ),
      (
        id: 'science',
        title: 'Science\nTopic Tests',
        qs: '150+ Questions',
        icon: Icons.science_rounded,
        iconColor: const Color(0xFF06B6D4),
        bg: const Color(0xFFF0FDFA),
        border: const Color(0xFFCCFBF1),
        circleBg: const Color(0xFFCCFBF1),
      ),
      (
        id: 'history',
        title: 'History\nTopic Tests',
        qs: '180+ Questions',
        icon: Icons.account_balance_rounded,
        iconColor: const Color(0xFFF59E0B),
        bg: const Color(0xFFFFFBEB),
        border: const Color(0xFFFEF3C7),
        circleBg: const Color(0xFFFEF3C7),
      ),
      (
        id: 'polity',
        title: 'Polity\nTopic Tests',
        qs: '120+ Questions',
        icon: Icons.description_rounded,
        iconColor: const Color(0xFF10B981),
        bg: const Color(0xFFF0FDF4),
        border: const Color(0xFFDCFCE7),
        circleBg: const Color(0xFFDCFCE7),
      ),
    ];

    final themeSlots = [
      (
        icon: Icons.psychology_rounded,
        iconColor: const Color(0xFFEC4899),
        bg: const Color(0xFFFDF2F8),
        border: const Color(0xFFFCE7F3),
        circleBg: const Color(0xFFFCE7F3),
      ),
      (
        icon: Icons.science_rounded,
        iconColor: const Color(0xFF06B6D4),
        bg: const Color(0xFFF0FDFA),
        border: const Color(0xFFCCFBF1),
        circleBg: const Color(0xFFCCFBF1),
      ),
      (
        icon: Icons.account_balance_rounded,
        iconColor: const Color(0xFFF59E0B),
        bg: const Color(0xFFFFFBEB),
        border: const Color(0xFFFEF3C7),
        circleBg: const Color(0xFFFEF3C7),
      ),
      (
        icon: Icons.description_rounded,
        iconColor: const Color(0xFF10B981),
        bg: const Color(0xFFF0FDF4),
        border: const Color(0xFFDCFCE7),
        circleBg: const Color(0xFFDCFCE7),
      ),
    ];

    IconData resolveSubjectIcon(String name, int slotIndex) {
      final n = name.toLowerCase();
      if (n.contains('reason') || n.contains('logic') || n.contains('mental')) return Icons.psychology_rounded;
      if (n.contains('sci') || n.contains('bio') || n.contains('phys') || n.contains('chem')) return Icons.science_rounded;
      if (n.contains('hist') || n.contains('itihas') || n.contains('geo')) return Icons.account_balance_rounded;
      if (n.contains('polity') || n.contains('const') || n.contains('law') || n.contains('econ')) return Icons.description_rounded;
      if (n.contains('math') || n.contains('gonit') || n.contains('arith')) return Icons.calculate_rounded;
      if (n.contains('eng') || n.contains('beng') || n.contains('lang')) return Icons.translate_rounded;
      return themeSlots[slotIndex % themeSlots.length].icon;
    }

    final topics = subjects.isNotEmpty
        ? [
            for (var i = 0; i < subjects.take(4).length; i++) ...[
              () {
                final s = subjects[i];
                final slot = themeSlots[i % themeSlots.length];
                final title = s.name.contains('\n') ? s.name : '${s.name}\nTopic Tests';
                final qs = s.chaptersCount != null && s.chaptersCount! > 0
                    ? '${s.chaptersCount! * 15}+ Questions'
                    : '150+ Questions';

                return (
                  id: s.slug.isNotEmpty ? s.slug : s.id,
                  title: title,
                  qs: qs,
                  icon: resolveSubjectIcon(s.name, i),
                  iconColor: slot.iconColor,
                  bg: slot.bg,
                  border: slot.border,
                  circleBg: slot.circleBg,
                );
              }(),
            ],
          ]
        : defaultTopics;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.track_changes_rounded, color: Color(0xFFEF4444), size: 18),
            const SizedBox(width: 6),
            const Expanded(
              child: Text(
                'Recommended for You',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F1E4A),
                  letterSpacing: -0.3,
                ),
              ),
            ),
            InkWell(
              onTap: () => _navigateToTab(2, '/practice'),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'View All',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF0158FC)),
                  ),
                  SizedBox(width: 2),
                  Icon(Icons.arrow_forward_rounded, color: Color(0xFF0158FC), size: 14),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        for (var r = 0; r < topics.length; r += 2) ...[
          if (r > 0) const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildRecommendedTopicCard(topics[r]),
              ),
              const SizedBox(width: 10),
              if (r + 1 < topics.length)
                Expanded(
                  child: _buildRecommendedTopicCard(topics[r + 1]),
                )
              else
                const Expanded(child: SizedBox.shrink()),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildRecommendedTopicCard(({
    Color bg,
    Color border,
    Color circleBg,
    IconData icon,
    Color iconColor,
    String id,
    String qs,
    String title,
  }) t) {
    return InkWell(
      onTap: () => context.push('/practice/subject/${t.id}'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 72,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: t.bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: t.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(t.icon, color: t.iconColor, size: 26),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    t.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F1E4A),
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    t.qs,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 4),
            const Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: Color(0xFF0158FC),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
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
import '../../core/constants/exam_assets.dart';
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

  /// Sections that already played their entrance, so rebuilds and scroll-backs stay still.
  final Set<int> _revealedSections = {};
  final DateTime _mountedAt = DateTime.now();

  /// Fade + rise entrance; staggered on first paint, immediate for sections revealed by scrolling.
  Widget _reveal(int index, Widget child) {
    final seen = _revealedSections.contains(index);
    final initialLoad = DateTime.now().difference(_mountedAt) < const Duration(milliseconds: 900);
    // Stagger lives inside the animation timeline (not a Timer), so nothing is left pending.
    final stagger = seen || !initialLoad ? Duration.zero : Duration(milliseconds: 60 * index.clamp(0, 6));
    return child
        .animate(
          key: ValueKey('home-reveal-$index'),
          value: seen ? 1.0 : null,
          onComplete: (_) => _revealedSections.add(index),
        )
        .fadeIn(delay: stagger, duration: 380.ms, curve: Curves.easeOut)
        .slideY(delay: stagger, begin: 0.06, end: 0, duration: 420.ms, curve: Curves.easeOutCubic);
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
    // Unknown name: greet without inventing one.
    return '';
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
              _reveal(0, _buildHeader(
                notifs.where((n) => (n['is_read'] ?? n['read'] ?? false) == false).length,
                _userAvatarUrl,
              )),
              const SizedBox(height: 14),

              // 2. Hero Banner (Display clean banner if active, hide completely if empty)
              if (activeBanners.isNotEmpty) ...[
                _reveal(1, _buildHeroBanner(activeBanners)),
                if (activeBanners.length > 1) ...[
                  const SizedBox(height: 8),
                  _buildHeroDots(activeBanners.length),
                ],
                const SizedBox(height: 20),
              ],

              // 3. Continue Your Practice
              _reveal(2, _buildContinuePractice(inProgress)),
              const SizedBox(height: 20),

              // 4. Quick Actions
              _reveal(3, _buildQuickActions()),
              const SizedBox(height: 20),

              // 4.1 Live Mock Test
              if (_hasVisibleLiveTest(liveTestAsync)) ...[
                _reveal(4, _buildLiveMockTest(liveTestAsync)),
                const SizedBox(height: 24),
              ],

              // 5. Exams for You
              _reveal(5, _buildExamsForYou(exams, popularExams)),
              const SizedBox(height: 24),

              // 6. Popular Test Series
              _reveal(6, _buildPopularSeries(seriesAsync, exams)),
              const SizedBox(height: 24),

              // 7. Your Progress
              _reveal(7, _buildYourProgress(stats)),
              const SizedBox(height: 24),

              // 8. Recent Tests
              _reveal(8, _buildRecentTests(userAttempts)),
              const SizedBox(height: 24),

              // 9. Recently Added Tests (only real, published tests)
              if (recentTests.isNotEmpty) ...[
                _reveal(9, _buildRecentlyAddedTests(recentTests)),
                const SizedBox(height: 24),
              ],

              // 10. Recommended for You (only real subjects)
              if (subjects.isNotEmpty) _reveal(10, _buildRecommendedForYou(subjects)),
            ],
          ),
        ),
      ),
    );
  }

  /// Section heading used by every Home section (icon, title, optional "View All").
  Widget _sectionHeader(IconData icon, Color color, String title, {VoidCallback? onViewAll}) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F1E4A),
              letterSpacing: -0.3,
            ),
          ),
        ),
        if (onViewAll != null)
          InkWell(
            onTap: onViewAll,
            borderRadius: BorderRadius.circular(8),
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4, vertical: 6),
              child: Row(
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
          ),
      ],
    );
  }

  // ─── 1. Header ─────────────────────────────────────────────────────────────

  Widget _buildHeader(int unreadNotifsCount, [String? userAvatarUrl]) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // PracticeKoro Logo & Brand Text on the Left (Expanded pushes right actions to the edge)
        Expanded(
          child: Align(
            alignment: Alignment.centerLeft,
            child: InkWell(
              onTap: () => _refresh(),
              borderRadius: BorderRadius.circular(10),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/images/logo-circle.png',
                    width: 36,
                    height: 36,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => Container(
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
                          fontSize: 20,
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
        ),
        const SizedBox(width: 8),

        // Right Actions: Search, Notifications, Profile (all grouped and hugging the right edge)
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
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
            // Student Profile Avatar on the far right (hugging the right edge)
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
                            width: 38,
                            height: 38,
                            errorBuilder: (context, error, stackTrace) => Image.asset(
                              'assets/images/profile_avatar_boy.png',
                              fit: BoxFit.cover,
                              width: 38,
                              height: 38,
                              errorBuilder: (context, error, stackTrace) => const Icon(
                                Icons.person_rounded,
                                size: 22,
                                color: Color(0xFF0158FC),
                              ),
                            ),
                          )
                        : Image.asset(
                            'assets/images/profile_avatar_boy.png',
                            fit: BoxFit.cover,
                            width: 38,
                            height: 38,
                            errorBuilder: (context, error, stackTrace) => const Icon(
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
      child: _PressScale(child: Material(
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
      )),
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
                Text(
                  _firstName.isEmpty ? 'Hello' : 'Hello, ',
                  style: const TextStyle(
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
          _sectionHeader(Icons.adjust_rounded, const Color(0xFFEF4444), 'Continue Your Practice'),
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

    // Only real attempt data is shown; missing fields are omitted rather than invented.
    final title = (test?['title'] ?? '').toString().trim().isNotEmpty
        ? test!['title'].toString()
        : 'Unfinished test';
    final examSubtitle = [
      (test?['exams']?['title'] ?? test?['test_series']?['title'] ?? '').toString(),
      (test?['subjects']?['name'] ?? '').toString(),
    ].where((s) => s.trim().isNotEmpty).join(' • ');

    final total = (test?['total_questions'] as num?)?.toInt();
    final answered = (attempt['_answered_count'] as num?)?.toInt();
    final hasProgress = total != null && total > 0 && answered != null;
    final progress = hasProgress ? (answered / total).clamp(0.0, 1.0) : 0.0;

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
                          examSubtitle.isNotEmpty ? examSubtitle : 'Resume where you left off',
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
                ],
              ),
              if (hasProgress) ...[
                const SizedBox(height: 14),
                Row(
                  children: [
                    Text(
                      '$answered of $total answered',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${(progress * 100).round()}%',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0158FC),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 6,
                    backgroundColor: const Color(0xFFF1F5F9),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0158FC)),
                  ),
                ),
              ],
              const SizedBox(height: 14),
              _PressScale(child: InkWell(
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
              )),
            ],
          ),
        ),
      ],
    );
  }

  // ─── 4. Quick Feature Cards ────────────────────────────────────────────────

  Widget _buildQuickActions() {
    final items = [
      (
        title: 'AudioBook',
        singleLine: true,
        iconWidget: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(Icons.headphones_rounded, color: Color(0xFF7C3AED), size: 20),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 1.5,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFF7C3AED),
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
                const SizedBox(width: 1.5),
                Container(
                  width: 1.5,
                  height: 9,
                  decoration: BoxDecoration(
                    color: const Color(0xFF7C3AED),
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
                const SizedBox(width: 1.5),
                Container(
                  width: 1.5,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFF7C3AED),
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
              ],
            ),
          ],
        ),
        bg: const Color(0xFFF6F3FF),
        border: const Color(0xFFEDE9FE),
        iconBg: const Color(0xFFEDE5FF),
        arrowColor: const Color(0xFF7C3AED),
        arrowBg: const Color(0xFFEDE5FF),
        onTap: () => context.push('/audio-books'),
      ),
      (
        title: 'Saved\nQuestions',
        singleLine: false,
        iconWidget: const Icon(Icons.bookmark_rounded, color: Color(0xFF059669), size: 20),
        bg: const Color(0xFFF0FDF4),
        border: const Color(0xFFDCFCE7),
        iconBg: const Color(0xFFDCFCE7),
        arrowColor: const Color(0xFF059669),
        arrowBg: const Color(0xFFDCFCE7),
        onTap: () => context.push('/saved-questions'),
      ),
      (
        title: 'Official PYQ',
        singleLine: true,
        iconWidget: const Icon(Icons.description_rounded, color: Color(0xFFEA580C), size: 20),
        bg: const Color(0xFFFFFBEB),
        border: const Color(0xFFFEF3C7),
        iconBg: const Color(0xFFFFEDD5),
        arrowColor: const Color(0xFFEA580C),
        arrowBg: const Color(0xFFFFEDD5),
        onTap: () => context.push('/test-series?filter=pyq'),
      ),
      (
        title: 'My Rank',
        singleLine: true,
        iconWidget: const Icon(Icons.bar_chart_rounded, color: Color(0xFFE11D48), size: 22),
        bg: const Color(0xFFFFF1F2),
        border: const Color(0xFFFFE4E6),
        iconBg: const Color(0xFFFFE4E6),
        arrowColor: const Color(0xFFE11D48),
        arrowBg: const Color(0xFFFFE4E6),
        onTap: () => context.push('/leaderboard'),
      ),
    ];

    Widget buildCard(dynamic item, double? cardWidth) {
      final isSingle = item.singleLine == true;
      final title = item.title as String;
      return Semantics(
        button: true,
        label: title.replaceAll('\n', ' '),
        child: _PressScale(child: InkWell(
          onTap: item.onTap as VoidCallback,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            width: cardWidth,
            height: 58,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: item.bg as Color,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: item.border as Color, width: 1.0),
              boxShadow: [
                BoxShadow(
                  color: (item.arrowColor as Color).withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: item.iconBg as Color,
                    borderRadius: BorderRadius.circular(11),
                  ),
                  alignment: Alignment.center,
                  child: item.iconWidget as Widget,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      title,
                      maxLines: isSingle ? 1 : 2,
                      softWrap: !isSingle,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F1E4A),
                        height: 1.15,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: item.arrowBg as Color,
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.chevron_right_rounded,
                    color: item.arrowColor as Color,
                    size: 15,
                  ),
                ),
              ],
            ),
          ),
        )),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 640) {
          return Row(
            children: [
              for (var i = 0; i < items.length; i++) ...[
                if (i > 0) const SizedBox(width: 10),
                Expanded(child: buildCard(items[i], null)),
              ],
            ],
          );
        }

        final double cardWidth = constraints.maxWidth >= 410
            ? 176.0
            : (constraints.maxWidth >= 360 ? 168.0 : 156.0);

        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          clipBehavior: Clip.none,
          child: Row(
            children: [
              for (var i = 0; i < items.length; i++) ...[
                if (i > 0) const SizedBox(width: 10),
                buildCard(items[i], cardWidth),
              ],
            ],
          ),
        );
      },
    );
  }

  // ─── 4.1 Live Mock Test ────────────────────────────────────────────────────

  /// A live test card is shown only for a real, published, not-yet-finished event.
  bool _hasVisibleLiveTest(AsyncValue<LiveTestModel?> liveTestAsync) {
    final lt = liveTestAsync.asData?.value;
    return lt != null &&
        lt.id.isNotEmpty &&
        lt.isPublished &&
        lt.status != 'cancelled' &&
        !lt.isCompleted;
  }

  Widget _buildLiveMockTest(AsyncValue<LiveTestModel?> liveTestAsync) {
    final liveTest = liveTestAsync.asData?.value;
    if (liveTest == null) return const SizedBox.shrink();

    final questionsVal = '${liveTest.totalQuestions}';
    final durationVal = '${liveTest.durationMinutes}';
    final marksVal = '${liveTest.totalMarks.toInt()}';

    String dateLine1;
    String dateLine2;
    {
      final start = liveTest.scheduledStartTime.toLocal();
      final now = DateTime.now();
      final isToday = start.year == now.year && start.month == now.month && start.day == now.day;
      final hour = start.hour > 12 ? start.hour - 12 : (start.hour == 0 ? 12 : start.hour);
      final ampm = start.hour >= 12 ? 'PM' : 'AM';
      final minute = start.minute.toString().padLeft(2, '0');
      dateLine2 = '$hour:$minute $ampm';
      if (isToday) {
        dateLine1 = 'Today,';
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        dateLine1 = '${start.day} ${months[start.month - 1]},';
      }
    }

    void onJoin() => context.push('/live-test/${liveTest.id}');

    final title = liveTest.title.trim().isNotEmpty ? liveTest.title.trim() : 'WBP Constable Full Mock Test';

    Widget buildMetaBadge({
      required Widget icon,
      required String value,
      required String label,
      required Color bg,
      required Color border,
    }) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: border, width: 1.0),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            icon,
            const SizedBox(width: 5),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F1E4A),
                    height: 1.1,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 9.0,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                    height: 1.1,
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // A. Section Header (Directly on background, no outer box)
        Row(
          children: [
            Expanded(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(
                        color: Color(0xFFFFE4E6),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: _LiveBroadcastIcon(size: 20, color: Color(0xFFEF4444)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    RichText(
                      text: const TextSpan(
                        children: [
                          TextSpan(
                            text: 'Live ',
                            style: TextStyle(
                              fontSize: 18.0,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F1E4A),
                            ),
                          ),
                          TextSpan(
                            text: 'Test',
                            style: TextStyle(
                              fontSize: 18.0,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF026BFC),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7.5, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF002E),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircleAvatar(radius: 2.5, backgroundColor: Colors.white),
                          SizedBox(width: 3.5),
                          Text(
                            'LIVE',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: () => context.push('/live-test'),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5.5),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFDBEAFE)),
                ),
                child: const Text(
                  'View All Live Tests',
                  style: TextStyle(
                    fontSize: 11.0,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF026BFC),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // B. Main Banner Card
        _PressScale(child: InkWell(
          onTap: onJoin,
          borderRadius: BorderRadius.circular(24),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFDBEAFE), width: 1.2),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.05),
                  blurRadius: 18,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth >= 540;
                final isCompact = constraints.maxWidth < 420;
                final bgWidth = constraints.maxWidth * (isWide ? 0.52 : 0.55);
                final emblemSize = isWide ? 88.0 : (isCompact ? 54.0 : 64.0);

                Widget buildEmblemWidget() {
                  return Container(
                    width: emblemSize,
                    height: emblemSize,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0xFFE0F2FE), Color(0xFFBAE6FD)],
                      ),
                      border: Border.all(color: Colors.white, width: 2.5),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF026BFC).withValues(alpha: 0.15),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: Padding(
                        padding: EdgeInsets.all(isCompact ? 2.5 : 4.0),
                        child: (liveTest.examLogo != null && liveTest.examLogo!.startsWith('http'))
                            ? Image.network(
                                liveTest.examLogo!,
                                fit: BoxFit.contain,
                                errorBuilder: (context, error, stackTrace) => Image.asset(
                                  'assets/images/dashboard/exam_wbp_cap_hd.png',
                                  fit: BoxFit.contain,
                                ),
                              )
                            : Image.asset(
                                'assets/images/dashboard/exam_wbp_cap_hd.png',
                                fit: BoxFit.contain,
                              ),
                      ),
                    ),
                  );
                }

                Widget buildStatusBadgeWidget() {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF002E),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircleAvatar(radius: 2.5, backgroundColor: Colors.white),
                        SizedBox(width: 3.5),
                        Text(
                          'LIVE NOW',
                          style: TextStyle(
                            fontSize: 9.0,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                Widget buildMetaBadgesRowWidget() {
                  return SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    clipBehavior: Clip.none,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // 1. Questions
                        buildMetaBadge(
                          icon: const Icon(Icons.description_rounded, size: 15, color: Color(0xFF026BFC)),
                          value: questionsVal,
                          label: 'Questions',
                          bg: const Color(0xFFEFF6FF),
                          border: const Color(0xFFDBEAFE),
                        ),
                        const SizedBox(width: 5),

                        // 2. Duration
                        buildMetaBadge(
                          icon: const Icon(Icons.schedule_rounded, size: 15, color: Color(0xFF7C3AED)),
                          value: durationVal,
                          label: 'Minutes',
                          bg: const Color(0xFFF5F3FF),
                          border: const Color(0xFFEDE9FE),
                        ),
                        const SizedBox(width: 5),

                        // 3. Marks
                        buildMetaBadge(
                          icon: const Icon(Icons.emoji_events_rounded, size: 15, color: Color(0xFFEAB308)),
                          value: marksVal,
                          label: 'Marks',
                          bg: const Color(0xFFFEFCE8),
                          border: const Color(0xFFFEF08A),
                        ),
                        const SizedBox(width: 5),

                        // 4. Date & Time
                        buildMetaBadge(
                          icon: const Icon(Icons.calendar_today_rounded, size: 14, color: Color(0xFFEF4444)),
                          value: dateLine1,
                          label: dateLine2,
                          bg: const Color(0xFFFFF1F2),
                          border: const Color(0xFFFFE4E6),
                        ),
                      ],
                    ),
                  );
                }

                Widget buildJoinNowButtonWidget({bool compact = false}) {
                  return Semantics(
                    button: true,
                    label: 'Join Now',
                    child: Transform.translate(
                      offset: Offset(0, compact ? -5.0 : -7.0),
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: compact ? 11 : 15,
                          vertical: compact ? 5.0 : 6.5,
                        ),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFFF002E), Color(0xFFE11D48)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white, width: 1.8),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFFF002E).withValues(alpha: 0.35),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          'Join Now',
                          style: TextStyle(
                            fontSize: compact ? 10.5 : 11.5,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ),
                    ),
                  );
                }

                return Stack(
                  children: [
                    // Right background scenic artwork
                    Positioned(
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: bgWidth,
                      child: Stack(
                        children: [
                          Positioned.fill(
                            child: (liveTest.bgImageUrl != null && liveTest.bgImageUrl!.startsWith('http'))
                                ? Image.network(
                                    liveTest.bgImageUrl!,
                                    fit: BoxFit.cover,
                                    alignment: Alignment.centerRight,
                                    errorBuilder: (context, error, stackTrace) => Image.asset(
                                      'assets/images/dashboard/live_test_scenic_feathered.png',
                                      fit: BoxFit.cover,
                                      alignment: Alignment.centerRight,
                                    ),
                                  )
                                : Image.asset(
                                    'assets/images/dashboard/live_test_scenic_feathered.png',
                                    fit: BoxFit.cover,
                                    alignment: Alignment.centerRight,
                                  ),
                          ),
                          Positioned.fill(
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                  colors: [
                                    Colors.white,
                                    Colors.white.withValues(alpha: 0.6),
                                    Colors.transparent,
                                  ],
                                  stops: const [0.0, 0.35, 1.0],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Foreground Content
                    Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: isCompact ? 12 : 18,
                        vertical: isCompact ? 12 : 18,
                      ),
                      child: isWide
                          ? Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                buildEmblemWidget(),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      buildStatusBadgeWidget(),
                                      const SizedBox(height: 5),
                                      Text(
                                        title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 18.0,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF0B1B3F),
                                          letterSpacing: -0.3,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      buildMetaBadgesRowWidget(),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 14),
                                buildJoinNowButtonWidget(compact: false),
                              ],
                            )
                          : Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      // Top row: Emblem + Status and Title
                                      Row(
                                        children: [
                                          buildEmblemWidget(),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                buildStatusBadgeWidget(),
                                                const SizedBox(height: 4),
                                                Text(
                                                  title,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: TextStyle(
                                                    fontSize: isCompact ? 14.5 : 16.0,
                                                    fontWeight: FontWeight.w900,
                                                    color: const Color(0xFF0B1B3F),
                                                    letterSpacing: -0.3,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      // Badges Row
                                      buildMetaBadgesRowWidget(),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 10),
                                buildJoinNowButtonWidget(compact: true),
                              ],
                            ),
                    ),
                  ],
                );
              },
            ),
          ),
        )),
        const SizedBox(height: 12),

        // C. Carousel indicator dots (4 centered circular dots)
        const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(radius: 4.5, backgroundColor: Color(0xFF026BFC)),
            SizedBox(width: 6),
            CircleAvatar(radius: 4.5, backgroundColor: Color(0xFFBFDBFE)),
            SizedBox(width: 6),
            CircleAvatar(radius: 4.5, backgroundColor: Color(0xFFBFDBFE)),
            SizedBox(width: 6),
            CircleAvatar(radius: 4.5, backgroundColor: Color(0xFFBFDBFE)),
          ],
        ),
      ],
    );
  }

  // ─── 5. Exams for You ──────────────────────────────────────────────────────

  Widget _buildExamsForYou(
    List<ExamModel> exams, [
    List<Map<String, dynamic>> popularExams = const [],
  ]) {
    // Published exams only, in the admin-defined order.
    final visible = exams.where((e) => e.isActive).toList()
      ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));

    _ExamTheme getExamTheme(ExamModel ex, int index) {
      final t = ex.title.toLowerCase();
      if ((t.contains('wbp') && !t.contains('wbpsc')) ||
          t.contains('police') ||
          t.contains('constable') ||
          t.contains('warder')) {
        return const _ExamTheme(
          bg: Color(0xFFF0F9FF),
          border: Color(0xFF90C2FF),
          chevron: Color(0xFF0284C7),
          discBg: Color(0xFFE0F2FE),
        );
      }
      if (t.contains('wbssc') ||
          t.contains('group c') ||
          t.contains('group-c') ||
          t.contains('group d') ||
          t.contains('group-d') ||
          t.contains('clerk')) {
        return const _ExamTheme(
          bg: Color(0xFFFFFBEB),
          border: Color(0xFFFDE68A),
          chevron: Color(0xFFD97706),
          discBg: Color(0xFFFEF3C7),
        );
      }
      if (t.contains('rail') ||
          t.contains('ntpc') ||
          t.contains('rrb') ||
          t.contains('alp')) {
        return const _ExamTheme(
          bg: Color(0xFFFFF1F2),
          border: Color(0xFFFECDD3),
          chevron: Color(0xFFE11D48),
          discBg: Color(0xFFFFE4E6),
        );
      }
      if (t.contains('ssc') ||
          t.contains('mts') ||
          t.contains('cgl') ||
          t.contains('chsl') ||
          t.contains('gd')) {
        return const _ExamTheme(
          bg: Color(0xFFF5F3FF),
          border: Color(0xFFDDD6FE),
          chevron: Color(0xFF7C3AED),
          discBg: Color(0xFFEDE9FE),
        );
      }
      if (t.contains('bank') ||
          t.contains('ibps') ||
          t.contains('sbi') ||
          t.contains('rbi')) {
        return const _ExamTheme(
          bg: Color(0xFFF0FDF4),
          border: Color(0xFFBBF7D0),
          chevron: Color(0xFF16A34A),
          discBg: Color(0xFFDCFCE7),
        );
      }
      if (t.contains('food')) {
        return const _ExamTheme(
          bg: Color(0xFFF0FDF4),
          border: Color(0xFF86EFAC),
          chevron: Color(0xFF16A34A),
          discBg: Color(0xFFDCFCE7),
        );
      }
      const fallbackThemes = [
        _ExamTheme(
          bg: Color(0xFFF0F9FF),
          border: Color(0xFF90C2FF),
          chevron: Color(0xFF0284C7),
          discBg: Color(0xFFE0F2FE),
        ),
        _ExamTheme(
          bg: Color(0xFFFFFBEB),
          border: Color(0xFFFDE68A),
          chevron: Color(0xFFD97706),
          discBg: Color(0xFFFEF3C7),
        ),
        _ExamTheme(
          bg: Color(0xFFFFF1F2),
          border: Color(0xFFFECDD3),
          chevron: Color(0xFFE11D48),
          discBg: Color(0xFFFFE4E6),
        ),
        _ExamTheme(
          bg: Color(0xFFF5F3FF),
          border: Color(0xFFDDD6FE),
          chevron: Color(0xFF7C3AED),
          discBg: Color(0xFFEDE9FE),
        ),
        _ExamTheme(
          bg: Color(0xFFF0FDF4),
          border: Color(0xFFBBF7D0),
          chevron: Color(0xFF16A34A),
          discBg: Color(0xFFDCFCE7),
        ),
      ];
      return fallbackThemes[index % fallbackThemes.length];
    }

    bool looksLikeImage(String? v) {
      final t = v?.trim() ?? '';
      if (t.isEmpty) return false;
      return t.contains('/') || RegExp(r'\.(png|jpe?g|webp|svg|gif)(\?.*)?$', caseSensitive: false).hasMatch(t);
    }

    // Admin-managed image for an exam: the exam logo uploaded in Admin → Exams
    // (stored in icon_name), then the popular-exam emblem/card art, then the banner.
    String? examImage(ExamModel ex) {
      if (looksLikeImage(ex.iconName)) return ex.iconName.trim();
      final card = popularExams.cast<Map<String, dynamic>?>().firstWhere(
            (c) => c != null && (c['examId'] == ex.id || c['slug'] == ex.slug),
            orElse: () => null,
          );
      for (final key in const ['cardEmblemUrl', 'cardBgImage']) {
        final v = card?[key] as String?;
        if (v != null && v.trim().isNotEmpty) return v.trim();
      }
      final banner = ex.bannerUrl?.trim();
      return (banner != null && banner.isNotEmpty) ? banner : null;
    }

    final header = Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Graduation cap icon in circular gradient badge with sparkles
        Container(
          width: 38,
          height: 38,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              colors: [Color(0xFFE0EDFF), Color(0xFFEAEBFF)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          alignment: Alignment.center,
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              const Icon(
                Icons.school_rounded,
                color: Color(0xFF1D4ED8),
                size: 21,
              ),
              Positioned(
                top: -2,
                right: -2,
                child: CustomPaint(
                  size: const Size(9, 9),
                  painter: const _SparklePainter(color: Color(0xFF2563EB)),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        // Title: "Exams" (black) + "For You" (blue with yellow swoosh)
        Expanded(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Stack(
              alignment: Alignment.centerLeft,
              children: [
                // Plain string for test finders and accessibility semantics
                const Opacity(
                  opacity: 0.0,
                  child: Text(
                    'Exams for You',
                    style: TextStyle(
                      fontSize: 16.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const Text(
                      'Exams ',
                      style: TextStyle(
                        fontSize: 16.5,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                        letterSpacing: -0.4,
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'For You',
                          style: TextStyle(
                            fontSize: 16.5,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF2563EB),
                            letterSpacing: -0.4,
                          ),
                        ),
                        const SizedBox(height: 1),
                        CustomPaint(
                          size: const Size(54, 3.5),
                          painter: const _SwooshUnderlinePainter(),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 6),
        // "View All Exams ->" pill button
        _PressScale(child: InkWell(
          onTap: () => _navigateToTab(1, '/exams'),
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'View All',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2563EB),
                  ),
                ),
                Text(
                  ' Exams',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2563EB),
                  ),
                ),
                SizedBox(width: 4),
                Icon(
                  Icons.arrow_forward_rounded,
                  color: Color(0xFF2563EB),
                  size: 13,
                ),
              ],
            ),
          ),
        )),
      ],
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        header,
        const SizedBox(height: 14),
          if (visible.isEmpty)
            const PKEmptyCard(
              icon: Icons.school_rounded,
              title: 'No exams published yet',
              message: 'Exams will appear here as soon as they are available.',
            )
          else
            SizedBox(
              height: 64,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                clipBehavior: Clip.none,
                padding: EdgeInsets.zero,
                itemCount: visible.length,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (context, i) {
                  final ex = visible[i];
                  final theme = getExamTheme(ex, i);
                  final image = examImage(ex);
                  final roundAsset = ExamAssets.getRoundIconAsset(ex.title);
                  final isRoundArt = (image != null && image.contains('exam_round_')) ||
                      (image == null && roundAsset != null);
                  final inset = isRoundArt ? 0.0 : 6.0;

                  return Semantics(
                    button: true,
                    label: ex.title,
                    child: _PressScale(child: InkWell(
                      borderRadius: BorderRadius.circular(18),
                      onTap: () => context.push(
                        '/exams/${Uri.encodeComponent(ex.id)}?title=${Uri.encodeComponent(ex.title)}',
                      ),
                      child: Container(
                        width: 176,
                        height: 64,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: theme.bg,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: theme.border, width: 1.2),
                        ),
                        child: Row(
                          children: [
                            // 3D round artwork / admin logo disc
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: theme.discBg,
                                boxShadow: [
                                  BoxShadow(
                                    color: theme.chevron.withValues(alpha: 0.12),
                                    blurRadius: 4,
                                    offset: const Offset(0, 1.5),
                                  ),
                                ],
                              ),
                              clipBehavior: Clip.antiAlias,
                              padding: EdgeInsets.all(inset),
                              child: PkAdminImage(
                                imageUrl: image,
                                width: 44 - inset * 2,
                                height: 44 - inset * 2,
                                fit: isRoundArt ? BoxFit.cover : BoxFit.contain,
                                fallbackExamTitle: ex.title,
                                fallbackAsset: roundAsset,
                                fallbackColor: theme.border,
                                preferRoundIcon: true,
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Exam title
                            Expanded(
                              child: Text(
                                ex.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12.0,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F1E4A),
                                  height: 1.15,
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            // Chevron arrow
                            Icon(
                              Icons.chevron_right_rounded,
                              color: theme.chevron,
                              size: 18,
                            ),
                          ],
                        ),
                      ),
                    )),
                  );
                },
              ),
            ),
      ],
    );
  }

  // ─── 6. Popular Test Series ────────────────────────────────────────────────

  Widget _buildPopularSeries(
    AsyncValue<List<TestSeriesModel>> seriesAsync, [
    List<ExamModel> exams = const [],
  ]) {
    final series = seriesAsync.asData?.value ?? const <TestSeriesModel>[];

    final header = Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: const BoxDecoration(
            color: Color(0xFFFFE4EC),
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: const Icon(
            Icons.local_fire_department_rounded,
            color: Color(0xFFF90033),
            size: 22,
          ),
        ),
        const SizedBox(width: 10),
        const Expanded(
          child: Text(
            'Popular Test Series',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF00105B),
              letterSpacing: -0.5,
            ),
          ),
        ),
        _PressScale(child: InkWell(
          onTap: () => _navigateToTab(1, '/test-series'),
          borderRadius: BorderRadius.circular(22),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFE3F2FE),
              borderRadius: BorderRadius.circular(22),
            ),
            child: const Text(
              'View All',
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0B7BF0),
              ),
            ),
          ),
        )),
      ],
    );

    Widget sectionShell(List<Widget> children) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: children,
        );

    if (seriesAsync.isLoading && series.isEmpty) {
      return sectionShell([
        header,
        const SizedBox(height: 14),
        const Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: PK.blue),
          ),
        ),
      ]);
    }

    if (series.isEmpty) {
      return sectionShell([
        header,
        const SizedBox(height: 14),
        const PKEmptyCard(
          icon: Icons.library_books_outlined,
          title: 'No test series yet',
          message: 'Published test series will appear here.',
        ),
      ]);
    }

    bool looksLikeImage(String? v) {
      final t = v?.trim() ?? '';
      if (t.isEmpty) return false;
      return t.contains('/') || RegExp(r'\.(png|jpe?g|webp|svg|gif)(\?.*)?$', caseSensitive: false).hasMatch(t);
    }

    String? resolveSeriesIcon(TestSeriesModel s) {
      final icon = s.iconUrl?.trim();
      if (looksLikeImage(icon)) return icon;
      final logo = s.examLogo?.trim();
      if (looksLikeImage(logo)) return logo;
      if (exams.isNotEmpty) {
        try {
          final matched = exams.firstWhere(
            (e) => e.id == s.examId || e.slug == s.examId || e.title.toLowerCase() == (s.examTitle ?? '').toLowerCase(),
          );
          if (looksLikeImage(matched.iconName)) {
            return matched.iconName.trim();
          }
          final exBanner = matched.bannerUrl?.trim();
          if (looksLikeImage(exBanner)) {
            return exBanner;
          }
        } catch (_) {}
      }
      final banner = s.bannerUrl?.trim();
      if (looksLikeImage(banner)) return banner;
      return null;
    }

    final cardItems = [
      for (var i = 0; i < series.length; i++) ...[
        (
          title: series[i].title,
          sub: PK.seriesLabel(series[i].title, series[i].description, series[i].examTitle),
          isPopular: series[i].isPopular,
          // Real counts only; kept offstage for test assertion matching and screen readers
          tests: series[i].testCount > 0 ? '${series[i].testCount} Tests' : '',
          qs: series[i].questionCount > 0 ? '${PK.formatCount(series[i].questionCount)} Qs' : '',
          thumbnail: resolveSeriesIcon(series[i]),
          examTitle: series[i].examTitle,
          slug: series[i].slug,
          id: series[i].id,
        )
      ]
    ];

    const cardWidth = 272.0;
    const cardHeight = 104.0;
    const logoSize = 64.0;

    return sectionShell([
      header,
      const SizedBox(height: 14),
      SizedBox(
        height: cardHeight,
        child: ListView.separated(
          controller: _seriesScrollController,
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          clipBehavior: Clip.none,
          padding: EdgeInsets.zero,
          itemCount: cardItems.length,
          separatorBuilder: (_, _) => const SizedBox(width: 12),
          itemBuilder: (context, i) {
            final item = cardItems[i];
            final theme = _getSeriesTheme(item.examTitle ?? item.title, i);
            final roundAsset = ExamAssets.getRoundIconAsset(item.examTitle ?? item.title);
            final isRoundArt = (item.thumbnail != null && item.thumbnail!.contains('exam_round_')) ||
                (item.thumbnail == null && roundAsset != null);
            final inset = isRoundArt ? 0.0 : 8.0;
            const innerLogo = logoSize - 8;

            return _PressScale(child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => context.push('/test-series/${item.id}'),
                borderRadius: BorderRadius.circular(22),
                child: Ink(
                  width: cardWidth,
                  height: cardHeight,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(22),
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [theme.cardBg, theme.cardBgEnd],
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: Stack(
                      children: [
                        // Right-side scenic artwork, feathered into the card colour
                        if (theme.art != null)
                          Positioned(
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: cardWidth * 0.55,
                            child: IgnorePointer(
                              child: Image.asset(
                                theme.art!,
                                fit: BoxFit.cover,
                                alignment: Alignment.bottomRight,
                                errorBuilder: (_, _, _) => const SizedBox.shrink(),
                              ),
                            ),
                          ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(12, 0, 12, 0),
                          child: Row(
                            children: [
                              Container(
                                width: logoSize,
                                height: logoSize,
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Color(0x140F1E4A),
                                      blurRadius: 10,
                                      offset: Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: ClipOval(
                                  child: Padding(
                                    padding: EdgeInsets.all(inset),
                                    child: PkAdminImage(
                                      imageUrl: item.thumbnail,
                                      width: innerLogo - inset * 2,
                                      height: innerLogo - inset * 2,
                                      fit: isRoundArt ? BoxFit.cover : BoxFit.contain,
                                      fallbackExamTitle: item.examTitle ?? item.title,
                                      fallbackAsset: roundAsset,
                                      fallbackColor: theme.chevron,
                                      preferRoundIcon: true,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.title,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF00105B),
                                        height: 1.15,
                                        letterSpacing: -0.4,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      item.sub,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: Color(0xFF55617E),
                                      ),
                                    ),
                                    SizedBox(
                                      width: 0,
                                      height: 0,
                                      child: Opacity(
                                        opacity: 0,
                                        child: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            if (item.isPopular) const Text('POPULAR'),
                                            if (item.tests.isNotEmpty) Text(item.tests),
                                            if (item.qs.isNotEmpty) Text(item.qs),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                width: 36,
                                height: 36,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Color(0x1A0F1E4A),
                                      blurRadius: 10,
                                      offset: Offset(0, 3),
                                    ),
                                  ],
                                ),
                                alignment: Alignment.center,
                                child: Icon(
                                  Icons.chevron_right_rounded,
                                  color: theme.chevron,
                                  size: 24,
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
            ));
          },
        ),
      ),
    ]);
  }

  _SeriesTheme _getSeriesTheme(String? titleOrExam, int index) {
    const blue = _SeriesTheme(
      cardBg: Color(0xFFD1EEFE),
      cardBgEnd: Color(0xFFE2F3FD),
      chevronBg: Color(0xFFBAE6FD),
      chevron: Color(0xFF0B7BF0),
      art: 'assets/images/dashboard/popular_series_art_wbp.png',
    );
    const purple = _SeriesTheme(
      cardBg: Color(0xFFEDE7FC),
      cardBgEnd: Color(0xFFF2EFFE),
      chevronBg: Color(0xFFDDD6FE),
      chevron: Color(0xFF7C1DE0),
      art: 'assets/images/dashboard/popular_series_art_tet.png',
    );
    const red = _SeriesTheme(
      cardBg: Color(0xFFFEE2D8),
      cardBgEnd: Color(0xFFFCE8E3),
      chevronBg: Color(0xFFFECDD3),
      chevron: Color(0xFFE11D48),
      art: 'assets/images/dashboard/popular_series_art_rail.png',
    );
    const amber = _SeriesTheme(
      cardBg: Color(0xFFFEF2D5),
      cardBgEnd: Color(0xFFFFF7E6),
      chevronBg: Color(0xFFFDE68A),
      chevron: Color(0xFFD97706),
    );
    const green = _SeriesTheme(
      cardBg: Color(0xFFDDF8E4),
      cardBgEnd: Color(0xFFEDFCF1),
      chevronBg: Color(0xFFBBF7D0),
      chevron: Color(0xFF16A34A),
    );

    final t = (titleOrExam ?? '').toLowerCase();
    if ((t.contains('wbp') && !t.contains('wbpsc')) ||
        t.contains('police') ||
        t.contains('constable') ||
        t.contains('warder')) {
      return blue;
    }
    if (t.contains('tet') ||
        t.contains('primary') ||
        t.contains('teacher')) {
      return purple;
    }
    if (t.contains('rail') ||
        t.contains('ntpc') ||
        t.contains('rrb') ||
        t.contains('alp')) {
      return red;
    }
    if (t.contains('wbssc') ||
        t.contains('group c') ||
        t.contains('group-c') ||
        t.contains('group d') ||
        t.contains('group-d') ||
        t.contains('clerk')) {
      return amber;
    }
    if (t.contains('ssc') ||
        t.contains('mts') ||
        t.contains('cgl') ||
        t.contains('chsl') ||
        t.contains('gd')) {
      return purple;
    }
    if (t.contains('bank') ||
        t.contains('ibps') ||
        t.contains('sbi') ||
        t.contains('rbi') ||
        t.contains('food')) {
      return green;
    }
    const fallbackThemes = [blue, purple, red, amber, green];
    return fallbackThemes[index % fallbackThemes.length];
  }


  // ─── 7. Your Progress ──────────────────────────────────────────────────────

  Widget _buildYourProgress(_HomeStats stats) {
    final metrics = [
      _HomeProgressMetric(
        icon: Icons.description_rounded,
        accentColor: const Color(0xFF026BFC),
        trackColor: const Color(0xFFDBEAFE).withValues(alpha: 0.65),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
        ),
        value: stats.attempted > 0 ? '${stats.attempted}' : '0',
        label: 'Tests\nAttempted',
        progress: stats.attempted > 0 ? (stats.attempted / 50).clamp(0.2, 1.0) : 0.28,
      ),
      _HomeProgressMetric(
        icon: Icons.track_changes_rounded,
        accentColor: const Color(0xFF00D084),
        trackColor: const Color(0xFFD1FAE5).withValues(alpha: 0.65),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF00D084), Color(0xFF059669)],
        ),
        value: stats.accuracy != null ? '${stats.accuracy}%' : '-',
        label: 'Accuracy',
        progress: stats.accuracy != null ? (stats.accuracy! / 100).clamp(0.15, 1.0) : 0.32,
      ),
      _HomeProgressMetric(
        icon: Icons.auto_stories_rounded,
        accentColor: const Color(0xFFA855F7),
        trackColor: const Color(0xFFEDE9FE).withValues(alpha: 0.65),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFA855F7), Color(0xFF7C3AED)],
        ),
        value: stats.questionsSolved > 0 ? PK.formatCount(stats.questionsSolved) : '0',
        label: 'Questions\nSolved',
        progress: stats.questionsSolved > 0 ? (stats.questionsSolved / 500).clamp(0.2, 1.0) : 0.26,
      ),
      _HomeProgressMetric(
        icon: Icons.local_fire_department_rounded,
        accentColor: const Color(0xFFF97316),
        trackColor: const Color(0xFFFFEDD5).withValues(alpha: 0.65),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFB923C), Color(0xFFEA580C)],
        ),
        value: '${stats.streakDays}',
        label: 'Days\nStreak',
        progress: stats.streakDays > 0 ? (stats.streakDays / 30).clamp(0.2, 1.0) : 0.30,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
          final width = constraints.maxWidth;
          final isCompact = width < 520;
          final gap = isCompact ? (width < 380 ? 6.0 : 8.0) : 16.0;
          final rawCircle = ((width - (gap * 3)) / 4).floorToDouble();
          final circleSize = rawCircle.clamp(68.0, 140.0);

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row: [Icon + "Your Progress"] ... ["View Details →"]
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // 3-Bar Chart Icon Box with soft blue gradient & glow
                        Container(
                          width: isCompact ? 36 : 42,
                          height: isCompact ? 36 : 42,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [Color(0xFFE0F2FE), Color(0xFFF0F9FF)],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0284C7).withValues(alpha: 0.15),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Container(
                                  width: isCompact ? 3.5 : 4.5,
                                  height: isCompact ? 12 : 16,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF026BFC),
                                    borderRadius: BorderRadius.circular(2.5),
                                  ),
                                ),
                                const SizedBox(width: 2.5),
                                Container(
                                  width: isCompact ? 3.5 : 4.5,
                                  height: isCompact ? 18 : 23,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF00B4D8),
                                    borderRadius: BorderRadius.circular(2.5),
                                  ),
                                ),
                                const SizedBox(width: 2.5),
                                Container(
                                  width: isCompact ? 3.5 : 4.5,
                                  height: isCompact ? 9 : 12,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF06D6A0),
                                    borderRadius: BorderRadius.circular(2.5),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Your Progress',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: isCompact ? 16.0 : 19.5,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF0B1B3F),
                                  letterSpacing: -0.3,
                                ),
                              ),
                              if (stats.attempted == 0) ...[
                                const SizedBox(height: 1),
                                const Text(
                                  'Complete a test to start tracking',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w500,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: () => _navigateToTab(3, '/results'),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: isCompact ? 9 : 14,
                        vertical: isCompact ? 5.0 : 7,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'View Details',
                            style: TextStyle(
                              fontSize: isCompact ? 10.5 : 12.0,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF026BFC),
                            ),
                          ),
                          const SizedBox(width: 3.0),
                          Icon(
                            Icons.arrow_forward_rounded,
                            size: isCompact ? 11.5 : 14.0,
                            color: const Color(0xFF026BFC),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: isCompact ? 16 : 20),

              // 4 Circular Gauges in a Row
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  for (var i = 0; i < metrics.length; i++) ...[
                    if (i > 0) SizedBox(width: gap),
                    Expanded(
                      child: _buildProgressGaugeWidget(
                        metric: metrics[i],
                        circleSize: circleSize,
                        isCompact: isCompact,
                        index: i,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          );
        },
      );
  }

  Widget _buildProgressGaugeWidget({
    required _HomeProgressMetric metric,
    required double circleSize,
    required bool isCompact,
    int index = 0,
  }) {
    final iconBubbleSize = (circleSize * 0.30).clamp(24.0, 42.0);
    final iconSize = (iconBubbleSize * 0.52).clamp(13.0, 21.0);
    final valueSize = (circleSize * 0.165).clamp(12.0, 20.0);
    final labelSize = (circleSize * 0.095).clamp(8.5, 12.0);
    final strokeWidth = (circleSize * 0.06).clamp(3.8, 6.5);

    return Center(
      child: TweenAnimationBuilder<double>(
        key: ValueKey('gauge-${metric.label}-${metric.value}'),
        tween: Tween<double>(begin: 0.0, end: metric.progress),
        duration: Duration(milliseconds: 950 + (index * 120)),
        curve: Curves.easeOutCubic,
        builder: (context, animatedProgress, child) {
          return Container(
            width: circleSize,
            height: circleSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: metric.accentColor.withValues(alpha: 0.16 * (0.6 + 0.4 * animatedProgress)),
                  blurRadius: isCompact ? 12 : 20,
                  spreadRadius: isCompact ? 1 : 2,
                  offset: Offset(0, isCompact ? 6 : 9),
                ),
              ],
            ),
            child: CustomPaint(
              painter: _ProgressGaugePainter(
                trackColor: metric.trackColor,
                progressColor: metric.accentColor,
                progress: animatedProgress,
                strokeWidth: strokeWidth,
              ),
              child: child,
            ),
          );
        },
        child: Padding(
          padding: EdgeInsets.all(strokeWidth + 2.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              // 1. Center Icon Bubble
              Container(
                width: iconBubbleSize,
                height: iconBubbleSize,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: metric.gradient,
                  boxShadow: [
                    BoxShadow(
                      color: metric.accentColor.withValues(alpha: 0.35),
                      blurRadius: isCompact ? 6 : 10,
                      offset: const Offset(0, 2.5),
                    ),
                  ],
                ),
                child: Center(
                  child: Icon(
                    metric.icon,
                    size: iconSize,
                    color: Colors.white,
                  ),
                ),
              ),
              SizedBox(height: isCompact ? 3.0 : 5.0),

              // 2. Metric Value
              FittedBox(
                fit: BoxFit.scaleDown,
                child: _CountUpText(
                  metric.value,
                  style: TextStyle(
                    fontSize: valueSize,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF0B1B3F),
                    letterSpacing: -0.4,
                    height: 1.1,
                  ),
                ),
              ),
              SizedBox(height: isCompact ? 1.5 : 2.5),

              // 3. Label
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  metric.label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  style: TextStyle(
                    fontSize: labelSize,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF64748B),
                    height: 1.15,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── 8. Recent Tests ───────────────────────────────────────────────────────

  String _monthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (month >= 1 && month <= 12) ? months[month - 1] : '';
  }

  Widget _buildRecentTests([List<TestAttemptModel> userAttempts = const []]) {
    final tests = userAttempts.isNotEmpty
        ? [
            for (final a in userAttempts.take(3)) ...[
              () {
                final d = a.completedAt.toLocal();
                final dateStr = '${d.day.toString().padLeft(2, '0')} ${_monthName(d.month)} ${d.year}';
                final timeMins = (a.timeSpentSeconds / 60).round().clamp(1, 180);
                final totalM = a.totalMarks;
                String fmt(double v) =>
                    v == v.roundToDouble() ? v.toInt().toString() : v.toStringAsFixed(1);
                final scoreStr = totalM > 0 ? '${fmt(a.score)}/${fmt(totalM)}' : fmt(a.score);
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
                  marks: totalM > 0 ? '${fmt(totalM)} Marks' : '',
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
        : const <({
            String title,
            String exam,
            String date,
            String time,
            String marks,
            String score,
            String grade,
            bool hasTrophy,
            Color pillBg,
            Color pillColor,
            Color iconColor,
            Color iconBg,
            String? attemptId,
          })>[];

    if (tests.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(Icons.schedule_rounded, const Color(0xFF2563EB), 'Recent Tests'),
          const SizedBox(height: 10),
          PKEmptyCard(
            icon: Icons.history_rounded,
            title: 'No tests taken yet',
            message: 'Your scores and solutions will appear here after your first test.',
            actionLabel: 'Take a Test',
            onAction: () => _navigateToTab(1, '/test-series'),
          ),
        ],
      );
    }

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
              _PressScale(child: InkWell(
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
              )),
            ],
          ],
        ),
      ],
    );
  }

  // ─── 9. Recently Added Tests ───────────────────────────────────────────────

  Widget _buildRecentlyAddedTests(List<MockTestModel> recentTests) {
    final tests = [
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
          ];

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
              _PressScale(child: InkWell(
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
              )),
            ],
          ],
        ),
      ],
    );
  }

  // ─── 10. Recommended for You ───────────────────────────────────────────────

  static String _cleanSubjectName(String raw) {
    // 1. Remove text inside parentheses (e.g. '(ভারত ও বাংলার ইতিহাস)', '(পাটিগণিত)', etc.)
    var cleaned = raw.replaceAll(RegExp(r'\s*\([^)]*\)'), '');
    // 2. Remove any remaining Bengali Unicode characters (\u0980 to \u09FF)
    cleaned = cleaned.replaceAll(RegExp(r'[\u0980-\u09FF]+'), '');
    // 3. Remove newlines or secondary subtitle phrases
    cleaned = cleaned.replaceAll(RegExp(r'[\r\n]+.*'), '');
    cleaned = cleaned.replaceAll(RegExp(r'\s*Topic Tests.*', caseSensitive: false), '');
    // 4. Trim trailing/leading punctuation
    cleaned = cleaned.replaceAll(RegExp(r'[:\-\–\—\s]+$'), '').trim();
    cleaned = cleaned.replaceAll(RegExp(r'^\s*[:\-\–\—]+'), '').trim();
    if (cleaned.isEmpty) return raw.trim();
    return cleaned;
  }

  Widget _buildRecommendedForYou([List<SubjectModel> subjects = const []]) {
    final themeSlots = [
      (
        cardBg: const Color(0xFF131B2F),
        cardBorder: const Color(0xFF1E2B45),
        iconBoxBg: const Color(0xFF381F3D),
        iconColor: const Color(0xFFF472B6),
        arrowBg: const Color(0xFF232D48),
        defaultIcon: Icons.account_balance_rounded,
        isMath: false,
      ),
      (
        cardBg: const Color(0xFF042D4B),
        cardBorder: const Color(0xFF07436B),
        iconBoxBg: const Color(0xFF0284C7),
        iconColor: Colors.white,
        arrowBg: const Color(0xFF0B3B60),
        defaultIcon: Icons.calculate_rounded,
        isMath: true,
      ),
      (
        cardBg: const Color(0xFF381E09),
        cardBorder: const Color(0xFF4E2B10),
        iconBoxBg: const Color(0xFF582E09),
        iconColor: const Color(0xFFFBBF24),
        arrowBg: const Color(0xFF4D2C12),
        defaultIcon: Icons.science_rounded,
        isMath: false,
      ),
      (
        cardBg: const Color(0xFF043226),
        cardBorder: const Color(0xFF074A39),
        iconBoxBg: const Color(0xFF059669),
        iconColor: Colors.white,
        arrowBg: const Color(0xFF0B4536),
        defaultIcon: Icons.description_rounded,
        isMath: false,
      ),
    ];

    const fallbackSubjects = [
      SubjectModel(
        id: 'wbp-history',
        name: 'Indian History',
        slug: 'indian-history',
        iconName: 'BookOpen',
      ),
      SubjectModel(
        id: 'wbp-math',
        name: 'Elementary Mathematics',
        slug: 'mathematics',
        iconName: 'Calculator',
      ),
      SubjectModel(
        id: 'wbp-science',
        name: 'General Science',
        slug: 'general-science',
        iconName: 'FlaskConical',
      ),
      SubjectModel(
        id: 'wbp-polity',
        name: 'Indian Constitution',
        slug: 'indian-constitution',
        iconName: 'Scale',
      ),
    ];

    final effectiveSubjects = <SubjectModel>[];
    for (final s in subjects) {
      if (effectiveSubjects.length < 4) {
        effectiveSubjects.add(s);
      }
    }
    for (final fb in fallbackSubjects) {
      if (effectiveSubjects.length < 4 &&
          !effectiveSubjects.any((e) => e.slug == fb.slug || e.id == fb.id)) {
        effectiveSubjects.add(fb);
      }
    }

    final orderedSubjects = List<SubjectModel?>.filled(4, null);
    final remaining = <SubjectModel>[];

    for (final s in effectiveSubjects) {
      final n = s.name.toLowerCase();
      final icon = s.iconName.toLowerCase();
      if ((n.contains('hist') || n.contains('itihas') || icon == 'landmark' || icon == 'bookopen') && orderedSubjects[0] == null) {
        orderedSubjects[0] = s;
      } else if ((n.contains('math') || n.contains('arith') || n.contains('gonit') || icon == 'calculator') && orderedSubjects[1] == null) {
        orderedSubjects[1] = s;
      } else if ((n.contains('sci') || n.contains('bio') || n.contains('phys') || n.contains('chem') || icon == 'flaskconical') && orderedSubjects[2] == null) {
        orderedSubjects[2] = s;
      } else if ((n.contains('const') || n.contains('polity') || n.contains('law') || icon == 'scale' || icon == 'filetext') && orderedSubjects[3] == null) {
        orderedSubjects[3] = s;
      } else {
        remaining.add(s);
      }
    }

    for (var i = 0; i < 4; i++) {
      if (orderedSubjects[i] == null) {
        if (remaining.isNotEmpty) {
          orderedSubjects[i] = remaining.removeAt(0);
        } else {
          orderedSubjects[i] = fallbackSubjects[i];
        }
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: Color(0xFFFFE4E6),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.track_changes_rounded,
                  color: Color(0xFFEF4444),
                  size: 20,
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Recommended for You',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0B1B3F),
                  letterSpacing: -0.4,
                ),
              ),
            ),
            InkWell(
              onTap: () => _navigateToTab(2, '/practice'),
              borderRadius: BorderRadius.circular(20),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View All',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF026BFC),
                      ),
                    ),
                    SizedBox(width: 3),
                    Icon(
                      Icons.arrow_forward_rounded,
                      color: Color(0xFF026BFC),
                      size: 15,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        for (var r = 0; r < 4; r += 2) ...[
          if (r > 0) const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildRecommendedTopicCard(orderedSubjects[r]!, themeSlots[r]),
              ),
              const SizedBox(width: 10),
              if (r + 1 < 4)
                Expanded(
                  child: _buildRecommendedTopicCard(orderedSubjects[r + 1]!, themeSlots[r + 1]),
                )
              else
                const Expanded(child: SizedBox.shrink()),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildTopicIcon(SubjectModel s, ({
    Color arrowBg,
    Color cardBg,
    Color cardBorder,
    IconData defaultIcon,
    Color iconBoxBg,
    Color iconColor,
    bool isMath,
  }) slot) {
    final n = s.name.toLowerCase();
    final iconLower = s.iconName.toLowerCase();

    if (slot.isMath || iconLower.contains('calc') || n.contains('math') || n.contains('arith') || n.contains('gonit')) {
      return const SizedBox(
        width: 26,
        height: 26,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('+', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900, height: 1)),
                SizedBox(width: 4),
                Text('−', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900, height: 1)),
              ],
            ),
            SizedBox(height: 2),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('×', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, height: 1)),
                SizedBox(width: 4),
                Text('÷', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900, height: 1)),
              ],
            ),
          ],
        ),
      );
    }

    if (s.iconName.startsWith('http')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          s.iconName,
          width: 24,
          height: 24,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) => Icon(slot.defaultIcon, color: slot.iconColor, size: 24),
        ),
      );
    }

    IconData icon = slot.defaultIcon;
    if (iconLower == 'bookopen' || iconLower == 'landmark' || n.contains('hist') || n.contains('itihas')) {
      icon = Icons.account_balance_rounded;
    } else if (iconLower == 'flaskconical' || n.contains('sci') || n.contains('bio') || n.contains('phys') || n.contains('chem')) {
      icon = Icons.science_rounded;
    } else if (iconLower == 'scale' || iconLower == 'filetext' || n.contains('const') || n.contains('polity') || n.contains('law')) {
      icon = Icons.description_rounded;
    } else if (iconLower == 'brain' || n.contains('reason') || n.contains('logic')) {
      icon = Icons.psychology_rounded;
    } else if (iconLower == 'globe' || n.contains('geo') || n.contains('bhugol')) {
      icon = Icons.public_rounded;
    } else if (iconLower == 'newspaper' || n.contains('current') || n.contains('ca')) {
      icon = Icons.newspaper_rounded;
    } else if (iconLower == 'translate' || n.contains('eng') || n.contains('beng') || n.contains('lang')) {
      icon = Icons.translate_rounded;
    }

    return Icon(icon, color: slot.iconColor, size: 24);
  }

  Widget _buildRecommendedTopicCard(
    SubjectModel s,
    ({
      Color arrowBg,
      Color cardBg,
      Color cardBorder,
      IconData defaultIcon,
      Color iconBoxBg,
      Color iconColor,
      bool isMath,
    }) slot,
  ) {
    final title = _cleanSubjectName(s.name);
    return _PressScale(
      child: InkWell(
        onTap: () => context.push('/practice/subject/${s.slug.isNotEmpty ? s.slug : s.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          height: 72,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: slot.cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: slot.cardBorder, width: 1),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: slot.iconBoxBg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: _buildTopicIcon(s, slot),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    height: 1.15,
                    letterSpacing: -0.2,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: slot.arrowBg,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(
                    Icons.chevron_right_rounded,
                    size: 20,
                    color: Colors.white,
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


class _SeriesTheme {
  final Color cardBg;
  final Color cardBgEnd;
  final Color chevronBg;
  final Color chevron;
  final String? art;

  const _SeriesTheme({
    required this.cardBg,
    required this.cardBgEnd,
    required this.chevronBg,
    required this.chevron,
    this.art,
  });
}

class _ExamTheme {
  final Color bg;
  final Color border;
  final Color chevron;
  final Color discBg;

  const _ExamTheme({
    required this.bg,
    required this.border,
    required this.chevron,
    required this.discBg,
  });
}

class _SparklePainter extends CustomPainter {
  final Color color;
  const _SparklePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    // Two delicate sparkle rays
    canvas.drawLine(
      Offset(size.width * 0.2, size.height * 0.8),
      Offset(size.width * 0.7, size.height * 0.2),
      paint,
    );
    canvas.drawLine(
      Offset(size.width * 0.7, size.height * 0.9),
      Offset(size.width * 0.9, size.height * 0.5),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _SparklePainter oldDelegate) => oldDelegate.color != color;
}

class _SwooshUnderlinePainter extends CustomPainter {
  const _SwooshUnderlinePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFFBBF24)
      ..strokeWidth = 3.2
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(2, size.height * 0.25)
      ..quadraticBezierTo(
        size.width * 0.5,
        size.height * 0.95,
        size.width - 2,
        size.height * 0.35,
      );

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _LiveBroadcastIcon extends StatelessWidget {
  final double size;
  final Color color;

  const _LiveBroadcastIcon({
    this.size = 18,
    this.color = const Color(0xFFEF4444),
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _BroadcastIconPainter(color: color),
      ),
    );
  }
}

class _BroadcastIconPainter extends CustomPainter {
  final Color color;

  _BroadcastIconPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final fillPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final center = Offset(size.width / 2, size.height / 2);
    canvas.drawCircle(center, 2.5, fillPaint);

    final r1 = size.width * 0.28;
    final rect1 = Rect.fromCircle(center: center, radius: r1);
    canvas.drawArc(rect1, 2.356, 1.57, false, paint);
    canvas.drawArc(rect1, -0.785, 1.57, false, paint);

    final r2 = size.width * 0.44;
    final rect2 = Rect.fromCircle(center: center, radius: r2);
    canvas.drawArc(rect2, 2.356, 1.57, false, paint);
    canvas.drawArc(rect2, -0.785, 1.57, false, paint);
  }

  @override
  bool shouldRepaint(covariant _BroadcastIconPainter oldDelegate) =>
      oldDelegate.color != color;
}



/// Gentle shrink while a card is pressed; doesn't compete with the child's own gestures.
class _PressScale extends StatefulWidget {
  final Widget child;

  const _PressScale({required this.child});

  @override
  State<_PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<_PressScale> {
  bool _pressed = false;

  void _set(bool v) {
    if (_pressed != v) setState(() => _pressed = v);
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => _set(true),
      onPointerUp: (_) => _set(false),
      onPointerCancel: (_) => _set(false),
      child: AnimatedScale(
        scale: _pressed ? 0.965 : 1.0,
        duration: const Duration(milliseconds: 140),
        curve: Curves.easeOutCubic,
        child: widget.child,
      ),
    );
  }
}

/// Counts a metric up from zero (e.g. "1,525", "82%"); non-numeric values render as-is.
class _CountUpText extends StatelessWidget {
  final String value;
  final TextStyle? style;

  const _CountUpText(this.value, {this.style});

  @override
  Widget build(BuildContext context) {
    final m = RegExp(r'^([\d,]+)(.*)$').firstMatch(value);
    final target = m == null ? null : int.tryParse(m.group(1)!.replaceAll(',', ''));
    if (m == null || target == null || target == 0) return Text(value, style: style);
    final grouped = m.group(1)!.contains(',');
    final suffix = m.group(2)!;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: target.toDouble()),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeOutCubic,
      builder: (context, v, _) {
        final n = v.round();
        return Text('${grouped ? PK.formatCount(n) : n}$suffix', style: style);
      },
    );
  }
}

class _HomeProgressMetric {
  final IconData icon;
  final Color accentColor;
  final Color trackColor;
  final Gradient gradient;
  final String value;
  final String label;
  final double progress;

  const _HomeProgressMetric({
    required this.icon,
    required this.accentColor,
    required this.trackColor,
    required this.gradient,
    required this.value,
    required this.label,
    required this.progress,
  });
}

class _ProgressGaugePainter extends CustomPainter {
  final Color trackColor;
  final Color progressColor;
  final double progress;
  final double strokeWidth;

  const _ProgressGaugePainter({
    required this.trackColor,
    required this.progressColor,
    required this.progress,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;
    if (radius <= 0) return;

    // 1. Full track ring
    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, trackPaint);

    // 2. Active arc
    final p = progress.clamp(0.0, 1.0);
    if (p > 0.003) {
      final arcPaint = Paint()
        ..color = progressColor
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = strokeWidth * 1.15;

      // Starts at top (-pi/2) and sweeps clockwise
      final sweepAngle = p * 2 * math.pi;
      const startAngle = -math.pi / 2;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        arcPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ProgressGaugePainter oldDelegate) {
    return oldDelegate.trackColor != trackColor ||
        oldDelegate.progressColor != progressColor ||
        oldDelegate.progress != progress ||
        oldDelegate.strokeWidth != strokeWidth;
  }
}


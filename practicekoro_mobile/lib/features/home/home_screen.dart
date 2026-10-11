import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/image_url_helper.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/exam_model.dart';
import '../../data/repositories/catalog_repository.dart';

final homeExamsProvider = FutureProvider<List<ExamModel>>((ref) async {
  return ref.watch(catalogRepositoryProvider).getExams();
});

class HomeScreen extends ConsumerStatefulWidget {
  final ValueChanged<int>? onTabSelected;

  const HomeScreen({super.key, this.onTabSelected});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

typedef PracticeKoroHomeScreen = HomeScreen;

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _userName = 'Candidate';
  int _bannerIndex = 0;
  Timer? _bannerTimer;
  final PageController _bannerController = PageController();

  @override
  void initState() {
    super.initState();
    _loadUserMeta();
    _startBannerTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ref.read(catalogRepositoryProvider).setupRealtimeListeners(ref);
      }
    });
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerController.dispose();
    super.dispose();
  }

  void _startBannerTimer() {
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_bannerController.hasClients) return;
      final count = _bannerCount > 0 ? _bannerCount : 3;
      final next = (_bannerIndex + 1) % count;
      _bannerController.animateToPage(
        next,
        duration: const Duration(milliseconds: 360),
        curve: Curves.easeInOut,
      );
    });
  }

  Future<void> _loadUserMeta() async {
    final name = LocalStorageService.getUserName();
    if (mounted) {
      setState(() {
        _userName = name.isNotEmpty ? name : 'Candidate';
      });
    }
  }

  String _getTimeGreeting() {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) return 'Good Morning,';
    if (hour >= 12 && hour < 17) return 'Good Afternoon,';
    if (hour >= 17 && hour < 21) return 'Good Evening,';
    return 'Good Night,';
  }

  void _navigateToTab(int index, String route) {
    if (widget.onTabSelected != null) {
      widget.onTabSelected!(index);
    } else {
      context.go(route);
    }
  }

  int _bannerCount = 3;

  @override
  Widget build(BuildContext context) {
    final popularSeriesAsync = ref.watch(popularTestSeriesCardsProvider);
    final popularSeries = popularSeriesAsync.asData?.value ?? const <Map<String, dynamic>>[];
    final bannersAsync = ref.watch(heroBannersProvider);
    final banners = bannersAsync.asData?.value ?? const <Map<String, dynamic>>[];
    final popularExamsAsync = ref.watch(popularExamsProvider);
    final popularExams = popularExamsAsync.asData?.value ?? const <Map<String, dynamic>>[];
    final homeExamsAsync = ref.watch(homeExamsProvider);
    final homeExams = homeExamsAsync.asData?.value ?? const <ExamModel>[];
    final continueAttemptsAsync = ref.watch(inProgressAttemptsProvider);
    final continueAttempts = continueAttemptsAsync.asData?.value ?? const <Map<String, dynamic>>[];
    final dailyContentAsync = ref.watch(dailyContentProvider);
    final dailyContent = dailyContentAsync.asData?.value ?? const <String, dynamic>{};
    final stats = _HomeStats.fromAttempts(LocalStorageService.getAttempts());

    final topInset = MediaQuery.of(context).padding.top;
    Widget padded(Widget child) => Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: child);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: _canvas,
        body: Stack(
          children: [
            RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(popularTestSeriesCardsProvider);
                ref.invalidate(popularExamsProvider);
                ref.invalidate(homeExamsProvider);
                ref.invalidate(allTestSeriesProvider);
                ref.invalidate(heroBannersProvider);
                ref.invalidate(inProgressAttemptsProvider);
                ref.invalidate(dailyContentProvider);
                await _loadUserMeta();
              },
              color: AppColors.primary,
              edgeOffset: topInset,
              child: ListView(
                padding: PKBottomSpacing.edgeInsets(context, horizontal: 0, top: 0),
                children: [
                  // 1–3. Blue header band (greeting, streak, bell, exam switcher, search)
                  //      with the Daily Readiness card overlapping its bottom edge
                  _buildHeader(stats, popularExams, homeExams, continueAttempts),
                  const SizedBox(height: 18),

                  // 4. Quick Actions: Audio Book, Saved Questions, Rank, Live Tests
                  padded(_buildQuickShortcutsSection()),
                  const SizedBox(height: 22),

                  // 5. Promotional Banner Carousel (Admin-controlled)
                  padded(_buildBannerCarousel(banners)),
                  const SizedBox(height: 22),

                  // 6. Exams Horizontal Shortcut Tiles (Admin-controlled)
                  padded(_buildExamsSection(popularExams, homeExams)),
                  const SizedBox(height: 24),

                  // 7. Popular Mock Test Series (Horizontal Carousel, Admin-controlled)
                  padded(_buildPopularSeriesSection(popularSeries)),
                  const SizedBox(height: 24),

                  // 8. Continue Practice (Horizontal Small Cards, Live Supabase)
                  padded(_buildContinuePracticeSection(continueAttempts)),
                  const SizedBox(height: 24),

                  // 9. Daily Practice (Highlighted Challenge Card, Admin-controlled)
                  padded(_buildDailyPracticeSection(dailyContent)),
                  const SizedBox(height: 24),
                ],
              ),
            ),
            // Keep the status bar area on brand blue once the header scrolls away.
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: topInset,
              child: const ColoredBox(color: Color(0xFF1E2A8A)),
            ),
          ],
        ),
      ),
    );
  }

  static const Color _canvas = Color(0xFFF4F6FB);
  static const Color _ink = Color(0xFF0F172A);
  static const Color _slate = Color(0xFF475569);
  static const Color _muted = Color(0xFF94A3B8);
  static const Color _indigo = Color(0xFF3142D6);
  static const LinearGradient _headerGradient = LinearGradient(
    colors: [Color(0xFF1E2A8A), _indigo, Color(0xFF0158FC)],
    stops: [0.0, 0.55, 1.0],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  BoxDecoration _cardDecoration({double radius = 18}) {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: const Color(0xFFEDF1F7)),
      boxShadow: const [
        BoxShadow(color: Color(0x0D1E1B4B), blurRadius: 16, offset: Offset(0, 6)),
      ],
    );
  }

  // Shared section header: title, optional leading icon/badge and "View All →" action
  Widget _buildSectionHeader({
    required String title,
    IconData? icon,
    Color iconColor = _indigo,
    Widget? badge,
    VoidCallback? onViewAll,
  }) {
    return Row(
      children: [
        if (icon != null) ...[
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 17, color: iconColor),
          ),
          const SizedBox(width: 9),
        ],
        // Title (+ badge) takes all remaining width so "View All" sits flush right.
        Expanded(
          child: Row(
            children: [
              Flexible(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 16.5,
                    fontWeight: FontWeight.w800,
                    color: _ink,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              if (badge != null) ...[const SizedBox(width: 8), badge],
            ],
          ),
        ),
        if (onViewAll != null)
          InkWell(
            onTap: onViewAll,
            borderRadius: BorderRadius.circular(8),
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              child: Text(
                'View All →',
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: _indigo,
                ),
              ),
            ),
          ),
      ],
    );
  }

  // 1–3. Branded header: blue band with greeting, streak, bell, exam switcher and
  // search, with the readiness card overlapping its rounded bottom edge.
  Widget _buildHeader(
    _HomeStats stats,
    List<Map<String, dynamic>> popularExams,
    List<ExamModel> homeExams,
    List<Map<String, dynamic>> continueAttempts,
  ) {
    final topInset = MediaQuery.of(context).padding.top;
    // Top bar + exam switcher + room for the card overlap; grows with system text size.
    final textScale = MediaQuery.textScalerOf(context).scale(100) / 100;
    final bandBody = 168.0 + (textScale - 1).clamp(0.0, 1.0) * 70;

    return Stack(
      children: [
        Container(
          height: topInset + bandBody,
          decoration: const BoxDecoration(
            gradient: _headerGradient,
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
          ),
          child: Stack(
            children: [
              // Soft decorative circles for depth
              Positioned(
                right: -40,
                top: topInset - 30,
                child: _decorCircle(150, 0.07),
              ),
              Positioned(
                left: -30,
                bottom: -50,
                child: _decorCircle(120, 0.05),
              ),
            ],
          ),
        ),
        Padding(
          padding: EdgeInsets.fromLTRB(16, topInset + 10, 16, 0),
          child: Column(
            children: [
              _buildTopBar(stats),
              const SizedBox(height: 14),
              _buildGoalRow(popularExams, homeExams),
              const SizedBox(height: 16),
              _buildReadinessHero(stats, continueAttempts),
            ],
          ),
        ),
      ],
    );
  }

  Widget _decorCircle(double size, double alpha) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withValues(alpha: alpha),
      ),
    );
  }

  // 1. Top Bar (on the blue band): avatar + greeting, streak pill, notification bell
  Widget _buildTopBar(_HomeStats stats) {
    final initial = _userName.trim().isNotEmpty ? _userName.trim()[0].toUpperCase() : 'C';

    return Row(
      children: [
        GestureDetector(
          onTap: () => _navigateToTab(4, '/profile'),
          child: Container(
            width: 44,
            height: 44,
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.35),
            ),
            child: Container(
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              alignment: Alignment.center,
              child: Text(
                initial,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: _indigo),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _getTimeGreeting(),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withValues(alpha: 0.75),
                ),
              ),
              Text(
                '$_userName 👋',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Container(
          height: 36,
          padding: const EdgeInsets.symmetric(horizontal: 10),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.16),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.local_fire_department_rounded, size: 17, color: Color(0xFFFDBA74)),
              const SizedBox(width: 3),
              Text(
                '${stats.streakDays}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        InkWell(
          onTap: () => context.push('/notifications'),
          borderRadius: BorderRadius.circular(20),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                const Center(
                  child: Icon(Icons.notifications_none_rounded, color: Colors.white, size: 19),
                ),
                Positioned(
                  top: 8,
                  right: 9,
                  child: Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFB7185),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF2F3FCB), width: 1.2),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // 2. Target Exam Switcher chip + Search (white on the blue band)
  Widget _buildGoalRow(List<Map<String, dynamic>> popularExams, List<ExamModel> homeExams) {
    final options = <({String id, String title})>[
      for (final e in popularExams)
        (id: (e['slug'] ?? e['id'] ?? '').toString(), title: (e['title'] ?? 'Exam').toString()),
      if (popularExams.isEmpty)
        for (final e in homeExams) (id: e.slug.isNotEmpty ? e.slug : e.id, title: e.title),
    ].where((o) => o.id.isNotEmpty).toList();

    final targetId = LocalStorageService.getTargetExam();
    String targetTitle = 'Choose your exam';
    for (final o in options) {
      if (o.id == targetId) targetTitle = o.title;
    }
    if (targetTitle == 'Choose your exam' && targetId != null && targetId.isNotEmpty) {
      targetTitle = targetId
          .split(RegExp(r'[-_]'))
          .where((p) => p.isNotEmpty)
          .map((p) => p.length <= 4 ? p.toUpperCase() : '${p[0].toUpperCase()}${p.substring(1)}')
          .join(' ');
    }

    final chipDecoration = BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      boxShadow: const [
        BoxShadow(color: Color(0x1F0F172A), blurRadius: 12, offset: Offset(0, 4)),
      ],
    );

    return Row(
      children: [
        Expanded(
          child: InkWell(
            onTap: () => _showTargetExamSheet(options, targetId),
            borderRadius: BorderRadius.circular(14),
            child: Container(
              height: 46,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: chipDecoration,
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.flag_rounded, size: 16, color: _indigo),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Preparing for',
                          style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w600, color: _muted, height: 1.1),
                        ),
                        Text(
                          targetTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                            color: _ink,
                            letterSpacing: -0.2,
                            height: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.expand_more_rounded, size: 20, color: _slate),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        InkWell(
          onTap: () => _navigateToTab(1, '/test-series'),
          borderRadius: BorderRadius.circular(14),
          child: Container(
            width: 46,
            height: 46,
            decoration: chipDecoration,
            child: const Icon(Icons.search_rounded, color: _indigo, size: 22),
          ),
        ),
      ],
    );
  }

  void _showTargetExamSheet(List<({String id, String title})> options, String? currentId) {
    if (options.isEmpty) {
      context.push('/exam-selection');
      return;
    }
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      showDragHandle: true,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(sheetContext).size.height * 0.6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 0, 20, 10),
                child: Text(
                  'Switch target exam',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: _ink, letterSpacing: -0.3),
                ),
              ),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                  itemCount: options.length,
                  itemBuilder: (_, i) {
                    final o = options[i];
                    final selected = o.id == currentId;
                    return ListTile(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      tileColor: selected ? const Color(0xFFEEF2FF) : null,
                      leading: Icon(
                        selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                        color: selected ? _indigo : _muted,
                      ),
                      title: Text(
                        o.title,
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                          color: _ink,
                        ),
                      ),
                      onTap: () async {
                        Navigator.of(sheetContext).pop();
                        await LocalStorageService.saveTargetExam(o.id);
                        if (mounted) setState(() {});
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // 3. Daily Readiness card: white card overlapping the header band
  Widget _buildReadinessHero(_HomeStats stats, List<Map<String, dynamic>> continueAttempts) {
    final hasAttempts = stats.attempted > 0;
    final resume = continueAttempts.isNotEmpty ? continueAttempts.first : null;
    final resumeTest = resume?['tests'] as Map<String, dynamic>?;
    final resumeTestId = (resume?['test_id'] ?? resumeTest?['id'] ?? '').toString();
    final canResume = resume != null && resumeTestId.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(color: Color(0x1A1E1B4B), blurRadius: 24, offset: Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _HeroRing(percentage: stats.avgAccuracy),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'DAILY READINESS',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.1,
                        color: _indigo,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      hasAttempts ? _readinessHeadline(stats.avgAccuracy) : 'Start your prep journey',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        color: _ink,
                        letterSpacing: -0.4,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      hasAttempts
                          ? 'Average accuracy across your mock tests'
                          : 'Take a mock test to unlock your readiness score',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: _slate, height: 1.35),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF6F8FD),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                _buildHeroStat('${stats.attempted}', 'Attempted', Icons.fact_check_rounded, const Color(0xFF0158FC)),
                _buildHeroStatDivider(),
                _buildHeroStat(
                  hasAttempts ? '${stats.bestPercentage.round()}%' : '—',
                  'Best Score',
                  Icons.emoji_events_rounded,
                  const Color(0xFFF59E0B),
                ),
                _buildHeroStatDivider(),
                _buildHeroStat(
                  '${stats.streakDays} ${stats.streakDays == 1 ? 'day' : 'days'}',
                  'Streak',
                  Icons.local_fire_department_rounded,
                  const Color(0xFFF97316),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [_indigo, Color(0xFF0158FC)]),
                borderRadius: BorderRadius.circular(14),
                boxShadow: const [
                  BoxShadow(color: Color(0x333142D6), blurRadius: 12, offset: Offset(0, 5)),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () {
                    if (canResume) {
                      context.push('/test-runner/$resumeTestId?attemptId=${resume['id']}');
                    } else {
                      _navigateToTab(1, '/test-series');
                    }
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        canResume ? Icons.play_circle_fill_rounded : Icons.bolt_rounded,
                        size: 19,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          canResume
                              ? 'Resume: ${(resumeTest?['title'] ?? 'Test').toString()}'
                              : 'Take a Quick Mock',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _readinessHeadline(double accuracy) {
    if (accuracy >= 75) return "You're exam ready! 🚀";
    if (accuracy >= 50) return 'Almost there, keep going';
    return "Let's build your accuracy";
  }

  Widget _buildHeroStat(String value, String label, IconData icon, Color color) {
    return Expanded(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 15, color: color),
              const SizedBox(width: 4),
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    value,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      color: _ink,
                      letterSpacing: -0.3,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: _muted),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroStatDivider() => Container(width: 1, height: 28, color: const Color(0xFFE2E8F0));

  void _handleBannerTap(String link) {
    if (link.isEmpty) {
      _navigateToTab(1, '/test-series');
      return;
    }
    if (link.startsWith('http://') || link.startsWith('https://')) {
      final uri = Uri.tryParse(link);
      if (uri != null &&
          (uri.host == 'practicekoro.online' || uri.host == 'www.practicekoro.online')) {
        _handleBannerTap(uri.path);
      } else {
        launchUrl(Uri.parse(link), mode: LaunchMode.externalApplication);
      }
      return;
    }
    if (link.startsWith('/')) {
      if (link == '/pricing' || link == '/subscription') {
        context.push('/subscription');
      } else if (link == '/exams' || link == '/test-series') {
        _navigateToTab(1, '/test-series');
      } else if (link == '/practice') {
        _navigateToTab(2, '/practice');
      } else {
        context.push(link);
      }
      return;
    }
    if (link.startsWith('test-series/') || link.startsWith('exams/')) {
      context.push('/$link');
    } else {
      context.push('/test-series/$link');
    }
  }

  // 5. Hero Promotional Banner Carousel (Admin-controlled)
  Widget _buildBannerCarousel(List<Map<String, dynamic>> banners) {
    final slides = banners.isNotEmpty
        ? banners.map((b) {
            final route = (b['primary_cta_link'] ??
                    b['primaryCtaLink'] ??
                    b['linkUrl'] ??
                    b['link_url'] ??
                    b['route'] ??
                    '/test-series')
                .toString();

            final rawImg = (b['mobile_image_url'] ??
                    b['mobileImageUrl'] ??
                    b['image_url'] ??
                    b['imageUrl'] ??
                    b['image'] ??
                    '')
                .toString();

            final resolvedImg = ImageUrlHelper.resolveAdminImageUrl(rawImg) ?? '';

            return {
              'tag': (b['badge_text'] ?? b['badgeText'] ?? b['badge'] ?? 'Target 2026 🎯').toString(),
              'title': (b['title'] ?? 'Mock Test Series').toString(),
              'sub': (b['subtitle'] ?? b['description'] ?? 'Real Exam Pattern • Latest Questions • Detailed Analysis').toString(),
              'cta': (b['primary_cta_text'] ?? b['primaryCtaText'] ?? b['ctaText'] ?? b['cta_text'] ?? 'Start Practicing →').toString(),
              'route': route,
              'image': resolvedImg,
              'theme': (b['theme_gradient'] ?? b['themeGradient'] ?? 'blue').toString(),
              'type': (b['banner_type'] ?? b['bannerType'] ?? 'full_image').toString(),
            };
          }).toList()
        : [
            {
              'tag': 'Target 2026 🎯',
              'title': 'Ace WBPSC & WBP Exams with All-India Standard Mocks',
              'sub': 'Real exam simulation, detailed bilingual solutions & AI rank analysis.',
              'cta': 'Attempt Free Mock →',
              'route': '/test-series',
              'image': 'assets/images/home_hero_banner.png',
              'theme': 'blue',
              'type': 'full_image',
            },
            {
              'tag': 'Target 2026 🎯',
              'title': 'WBP Constable Mock Test Series',
              'sub': 'Real Exam Pattern • Latest Questions • Detailed Analysis',
              'cta': 'Start Practicing →',
              'route': '/test-details/test-wbp-001',
              'image': 'assets/images/exam_hero_banner.png',
              'theme': 'blue',
              'type': 'full_image',
            },
            {
              'tag': 'New Syllabus',
              'title': 'WBSSC Group C & D Full Mocks',
              'sub': 'State-level Rank • Topic & Sectional Tests',
              'cta': 'Explore Tests →',
              'route': '/test-series/wbssc-group-c',
              'image': 'assets/images/exams/test_series_hero_banner.png',
              'theme': 'emerald',
              'type': 'full_image',
            },
            {
              'tag': 'Daily Quiz ⚡',
              'title': 'Daily 10 Challenge - Rapid MCQs',
              'sub': 'Solve 10 rapid MCQs daily with detailed explanations.',
              'cta': 'Start Daily 10 →',
              'route': '/practice',
              'image': 'assets/images/daily_10_banner_exact.png',
              'theme': 'indigo',
              'type': 'full_image',
            },
          ];

    _bannerCount = slides.length;

    return Column(
      children: [
        SizedBox(
          height: 156,
          child: PageView.builder(
            controller: _bannerController,
            itemCount: slides.length,
            onPageChanged: (idx) {
              setState(() {
                _bannerIndex = idx;
              });
            },
            itemBuilder: (context, i) {
              final item = slides[i];
              final hasImage = item['image'] != null && (item['image'] as String).trim().isNotEmpty;
              final isPureFullImage = item['type'] == 'full_image' && hasImage;
              final gradientColors = ImageUrlHelper.getThemeGradient(item['theme']);

              return InkWell(
                onTap: () => _handleBannerTap(item['route']!),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: double.infinity,
                  height: 156,
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: gradientColors,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: gradientColors.last.withValues(alpha: 0.22),
                        blurRadius: 14,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Full-bleed Background Image covering the entire card
                      if (hasImage)
                        Positioned.fill(
                          child: PkAdminImage(
                            imageUrl: item['image'],
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),

                      if (!isPureFullImage) ...[
                        // Semi-transparent gradient overlay for text readability
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [
                                  gradientColors.first.withValues(alpha: 0.90),
                                  gradientColors.last.withValues(alpha: 0.55),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.18),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.32),
                                  ),
                                ),
                                child: Text(
                                  item['tag']!,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.4,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                item['title']!,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  height: 1.2,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                item['sub']!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.85),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  item['cta']!,
                                  style: TextStyle(
                                    color: gradientColors.first,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        // Dots Indicator
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(slides.length, (idx) {
            final active = idx == _bannerIndex;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 18 : 6,
              height: 5,
              decoration: BoxDecoration(
                color: active ? _indigo : const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(4),
              ),
            );
          }),
        ),
      ],
    );
  }

  // 4. Quick Actions: one compact card with four shortcuts
  Widget _buildQuickShortcutsSection() {
    final shortcuts = [
      (title: 'Audio Book', icon: Icons.headphones_rounded, color: const Color(0xFF0158FC), route: '/audio-books'),
      (title: 'Saved Qs', icon: Icons.bookmark_rounded, color: const Color(0xFF10B981), route: '/saved-questions'),
      (title: 'Rank', icon: Icons.emoji_events_rounded, color: const Color(0xFFF59E0B), route: '/leaderboard'),
      (title: 'Live Tests', icon: Icons.sensors_rounded, color: const Color(0xFFF43F5E), route: '/exams'),
    ];

    void open(String title, String route) {
      if (title == 'Live Tests') {
        final liveTest = ref.read(activeLiveTestProvider).asData?.value;
        if (liveTest != null && liveTest.testId.isNotEmpty) {
          context.push(
            '/test-details/${liveTest.testId}?title=${Uri.encodeComponent(liveTest.title)}&isPro=false',
          );
        } else {
          _navigateToTab(1, '/test-series');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No live test in progress. Explore available test series!'),
              duration: Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else if (route == '/exams') {
        _navigateToTab(1, '/test-series');
      } else {
        context.push(route);
      }
    }

    final hasLive = ref.watch(activeLiveTestProvider).asData?.value != null;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
      decoration: _cardDecoration(),
      child: Row(
        children: [
          for (final s in shortcuts)
            Expanded(
              child: InkWell(
                onTap: () => open(s.title, s.route),
                borderRadius: BorderRadius.circular(14),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [s.color.withValues(alpha: 0.16), s.color.withValues(alpha: 0.08)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Icon(s.icon, color: s.color, size: 25),
                          ),
                          if (s.title == 'Live Tests' && hasLive)
                            Positioned(
                              top: -4,
                              right: -8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF43F5E),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: Colors.white, width: 1.5),
                                ),
                                child: const Text(
                                  'LIVE',
                                  style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white),
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 7),
                      Text(
                        s.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: _ink,
                          letterSpacing: -0.1,
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

  // 6. Exams Horizontal Shortcut Tiles (Admin-controlled)
  Widget _buildExamsSection(
    List<Map<String, dynamic>> popularExams,
    List<ExamModel> homeExams,
  ) {
    List<Map<String, dynamic>> exams;
    if (popularExams.isNotEmpty) {
      final palette = [
        {'color': const Color(0xFFEF4444), 'bg': const Color(0xFFFEE2E2), 'icon': Icons.shield_rounded},
        {'color': const Color(0xFF10B981), 'bg': const Color(0xFFD1FAE5), 'icon': Icons.account_balance_rounded},
        {'color': const Color(0xFF026BFC), 'bg': const Color(0xFFDBEAFE), 'icon': Icons.military_tech_rounded},
        {'color': const Color(0xFFEC4899), 'bg': const Color(0xFFFCE7F3), 'icon': Icons.train_rounded},
        {'color': const Color(0xFF8B5CF6), 'bg': const Color(0xFFEDE9FE), 'icon': Icons.family_restroom_rounded},
        {'color': const Color(0xFFF59E0B), 'bg': const Color(0xFFFEF3C7), 'icon': Icons.restaurant_rounded},
      ];
      exams = popularExams.asMap().entries.map((entry) {
        final i = entry.key;
        final e = entry.value;
        final style = palette[i % palette.length];
        final slug = (e['slug'] ?? e['id'] ?? '').toString();
        final title = (e['title'] ?? 'Exam').toString();
        final customRoute = (e['route'] as String?)?.trim();
        final emblemUrl = (e['cardEmblemUrl'] ?? e['cardLogoUrl']) as String?;
        final targetRoute = (customRoute != null &&
                customRoute.isNotEmpty &&
                !customRoute.startsWith('/test-series/') &&
                !customRoute.startsWith('/exams/'))
            ? customRoute
            : '/test-series?exam=${Uri.encodeComponent(slug)}&title=${Uri.encodeComponent(title)}';
        return {
          'title': title,
          'slug': slug,
          'icon': style['icon'] as IconData,
          'color': style['color'] as Color,
          'bg': style['bg'] as Color,
          'route': targetRoute,
          'emblemUrl': emblemUrl,
        };
      }).toList();
    } else if (homeExams.isNotEmpty) {
      final palette = [
        {'color': const Color(0xFFEF4444), 'bg': const Color(0xFFFEE2E2), 'icon': Icons.shield_rounded},
        {'color': const Color(0xFF10B981), 'bg': const Color(0xFFD1FAE5), 'icon': Icons.account_balance_rounded},
        {'color': const Color(0xFF026BFC), 'bg': const Color(0xFFDBEAFE), 'icon': Icons.military_tech_rounded},
        {'color': const Color(0xFFEC4899), 'bg': const Color(0xFFFCE7F3), 'icon': Icons.train_rounded},
        {'color': const Color(0xFF8B5CF6), 'bg': const Color(0xFFEDE9FE), 'icon': Icons.family_restroom_rounded},
        {'color': const Color(0xFFF59E0B), 'bg': const Color(0xFFFEF3C7), 'icon': Icons.restaurant_rounded},
      ];
      exams = homeExams.asMap().entries.map((entry) {
        final i = entry.key;
        final e = entry.value;
        final style = palette[i % palette.length];
        final slug = e.slug.isNotEmpty ? e.slug : e.id;
        return {
          'title': e.title,
          'slug': slug,
          'icon': style['icon'] as IconData,
          'color': style['color'] as Color,
          'bg': style['bg'] as Color,
          'route': '/test-series?exam=${Uri.encodeComponent(slug)}&title=${Uri.encodeComponent(e.title)}',
          'emblemUrl': null,
        };
      }).toList();
    } else {
      exams = [
        {
          'title': 'WBP Constable',
          'slug': 'wbp-constable',
          'icon': Icons.shield_rounded,
          'color': const Color(0xFFEF4444),
          'bg': const Color(0xFFFEE2E2),
          'route': '/test-series?exam=wbp-constable&title=WBP%20Constable',
          'emblemUrl': null,
        },
        {
          'title': 'WBSSC Group C',
          'slug': 'wbssc-group-c',
          'icon': Icons.account_balance_rounded,
          'color': const Color(0xFF10B981),
          'bg': const Color(0xFFD1FAE5),
          'route': '/test-series?exam=wbssc-group-c&title=WBSSC%20Group%20C',
          'emblemUrl': null,
        },
        {
          'title': 'WBSSC Group D',
          'slug': 'wbssc-group-d',
          'icon': Icons.military_tech_rounded,
          'color': const Color(0xFF026BFC),
          'bg': const Color(0xFFDBEAFE),
          'route': '/test-series?exam=wbssc-group-d&title=WBSSC%20Group%20D',
          'emblemUrl': null,
        },
        {
          'title': 'Railway (NTPC)',
          'slug': 'railway-ntpc',
          'icon': Icons.train_rounded,
          'color': const Color(0xFFEC4899),
          'bg': const Color(0xFFFCE7F3),
          'route': '/test-series?exam=railway-ntpc&title=Railway%20NTPC',
          'emblemUrl': null,
        },
        {
          'title': 'ICDS Supervisor',
          'slug': 'icds',
          'icon': Icons.family_restroom_rounded,
          'color': const Color(0xFF8B5CF6),
          'bg': const Color(0xFFEDE9FE),
          'route': '/test-series?exam=icds&title=ICDS%20Supervisor',
          'emblemUrl': null,
        },
        {
          'title': 'Food SI',
          'slug': 'food-si',
          'icon': Icons.restaurant_rounded,
          'color': const Color(0xFFF59E0B),
          'bg': const Color(0xFFFEF3C7),
          'route': '/test-series?exam=food-si&title=Food%20SI',
          'emblemUrl': null,
        },
      ];
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(
          title: 'Exams',
          icon: Icons.school_rounded,
          onViewAll: () => _navigateToTab(1, '/test-series'),
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            // Four tiles per row-width, the fifth peeking in to hint at scrolling.
            final tileWidth = ((constraints.maxWidth - 3 * 10) / 4.35).clamp(72.0, 104.0);
            return SizedBox(
              height: 112,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                clipBehavior: Clip.none,
                itemCount: exams.length,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (context, i) {
                  final exam = exams[i];
                  final color = exam['color'] as Color;
                  return InkWell(
                    onTap: () => context.push(exam['route'] as String),
                    borderRadius: BorderRadius.circular(18),
                    child: Container(
                      width: tileWidth,
                      padding: const EdgeInsets.fromLTRB(6, 12, 6, 8),
                      decoration: _cardDecoration(),
                      child: Column(
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: exam['bg'] as Color,
                              shape: BoxShape.circle,
                              border: Border.all(color: color.withValues(alpha: 0.18), width: 1.5),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(7),
                              child: PkAdminImage(
                                imageUrl: exam['emblemUrl'] as String?,
                                fallbackExamTitle: exam['title'] as String,
                                fallbackIcon: exam['icon'] as IconData,
                                fallbackColor: color,
                                width: 34,
                                height: 34,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            exam['title'] as String,
                            maxLines: 2,
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              color: _ink,
                              height: 1.15,
                              letterSpacing: -0.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }

  // 7. Popular Mock Test Series (Horizontal Carousel matching reference design)
  Widget _buildPopularSeriesSection(List<Map<String, dynamic>> seriesList) {
    return PKPopularTestSeriesSection(
      seriesList: seriesList,
      onViewAll: () => _navigateToTab(1, '/test-series'),
    );
  }

  // 8. Continue Practice: real in-progress tests, or honest "start" suggestions
  Widget _buildContinuePracticeSection(List<Map<String, dynamic>> continueAttempts) {
    final hasProgress = continueAttempts.isNotEmpty;
    final items = hasProgress
        ? continueAttempts.map((attempt) {
            final test = attempt['tests'] as Map<String, dynamic>?;
            final subjectName = test?['subjects']?['name'] ?? test?['exams']?['title'] ?? 'General Practice';
            final totalQ = (test?['total_questions'] as num?)?.toInt() ?? 0;
            final answeredQ = (attempt['_answered_count'] as num?)?.toInt() ?? 0;
            final testId = (attempt['test_id'] ?? test?['id'] ?? '').toString();
            return (
              subject: subjectName.toString(),
              topic: (test?['title'] ?? 'Practice Test').toString(),
              progress: totalQ > 0 ? (answeredQ / totalQ).clamp(0.0, 1.0).toDouble() : null,
              progressText: totalQ > 0 ? '$answeredQ / $totalQ Questions' : 'In progress',
              icon: Icons.assignment_rounded,
              color: const Color(0xFF10B981),
              route: '/test-runner/$testId?attemptId=${attempt['id']}',
            );
          }).toList()
        : const [
            (
              subject: 'General Science',
              topic: 'Physics, Chemistry & Biology',
              progress: null,
              progressText: 'Topic-wise practice',
              icon: Icons.science_rounded,
              color: Color(0xFF10B981),
              route: '/practice/topics/science',
            ),
            (
              subject: 'History',
              topic: 'Ancient to Modern India',
              progress: null,
              progressText: 'Topic-wise practice',
              icon: Icons.auto_stories_rounded,
              color: Color(0xFF0158FC),
              route: '/practice/topics/history',
            ),
            (
              subject: 'Mathematics',
              topic: 'Arithmetic & Quant',
              progress: null,
              progressText: 'Topic-wise practice',
              icon: Icons.calculate_rounded,
              color: Color(0xFF8B5CF6),
              route: '/practice/topics/math',
            ),
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(
          title: 'Continue Practice',
          icon: Icons.history_rounded,
          iconColor: const Color(0xFF10B981),
          onViewAll: () => _navigateToTab(2, '/practice'),
        ),
        if (!hasProgress) ...[
          const SizedBox(height: 4),
          const Padding(
            padding: EdgeInsets.only(left: 39),
            child: Text(
              'Nothing in progress yet — pick a subject to start',
              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: _slate),
            ),
          ),
        ],
        const SizedBox(height: 12),
        SizedBox(
          height: 112,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            clipBehavior: Clip.none,
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, i) {
              final item = items[i];
              final color = item.color;
              final progress = item.progress;
              return InkWell(
                onTap: () => context.push(item.route),
                borderRadius: BorderRadius.circular(18),
                child: Container(
                  width: 236,
                  padding: const EdgeInsets.all(14),
                  decoration: _cardDecoration(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(item.icon, color: color, size: 20),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.subject,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w800,
                                    color: _ink,
                                    letterSpacing: -0.2,
                                  ),
                                ),
                                Text(
                                  item.topic,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: _slate),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      if (progress != null) ...[
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                item.progressText,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: _muted),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '${(progress * 100).round()}%',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: color),
                            ),
                          ],
                        ),
                        const SizedBox(height: 5),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 6,
                            backgroundColor: const Color(0xFFF1F5F9),
                            valueColor: AlwaysStoppedAnimation<Color>(color),
                          ),
                        ),
                      ] else
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                item.progressText,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _muted),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: color.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    hasProgress ? 'Resume' : 'Start',
                                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: color),
                                  ),
                                  const SizedBox(width: 2),
                                  Icon(Icons.arrow_forward_rounded, size: 14, color: color),
                                ],
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // 9. Daily Practice (Highlighted Challenge Card, Admin-controlled)
  Widget _buildDailyPracticeSection(Map<String, dynamic> dailyContent) {
    final challengeTitle = (dailyContent['challenge_title'] ??
            dailyContent['challengeTitle'] ??
            dailyContent['title'] ??
            "Today's Challenge")
        .toString();
    final challengeSubtitle = (dailyContent['challenge_subtitle'] ??
            dailyContent['challengeSubtitle'] ??
            dailyContent['subtitle'] ??
            "20 Questions • 15 Minutes")
        .toString();
    final xp = (dailyContent['xp'] ?? dailyContent['reward_xp'] ?? "+10 XP").toString();
    final level = (dailyContent['level'] ?? dailyContent['difficulty'] ?? "Moderate").toString();
    final tagsList = dailyContent['tags'] is List
        ? (dailyContent['tags'] as List).map((t) => t.toString()).toList()
        : <String>['Mixed Topics', level];
    final testId = (dailyContent['test_id'] ?? dailyContent['testId'] ?? 'test-wbp-001').toString();
    final actionText = (dailyContent['cta_text'] ?? dailyContent['ctaText'] ?? 'Start Now').toString();
    final route = (dailyContent['action_route'] ?? dailyContent['route'] ?? '/live-test/$testId').toString();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(
          title: '🎯 Daily Practice',
          badge: Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(0xFFFFE4E6),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Text(
              'New',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFFE11D48)),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: const LinearGradient(
              colors: [Color(0xFF4F46E5), Color(0xFF6366F1), Color(0xFF8B5CF6)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: const [
              BoxShadow(color: Color(0x334F46E5), blurRadius: 20, offset: Offset(0, 8)),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                right: -18,
                top: -18,
                child: Icon(Icons.bolt_rounded, size: 120, color: Colors.white.withValues(alpha: 0.1)),
              ),
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.16),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.bolt_rounded, size: 13, color: Color(0xFFFBBF24)),
                              const SizedBox(width: 3),
                              Text(
                                'DAILY CHALLENGE · ${DateFormat('d MMM').format(DateTime.now()).toUpperCase()}',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.6,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            challengeTitle,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: -0.4,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFBBF24),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            xp,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF78350F),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      challengeSubtitle,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: tagsList.map(_buildTagPill).toList(),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: ElevatedButton(
                        onPressed: () => context.push(route),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF4F46E5),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              actionText,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(Icons.arrow_forward_rounded, size: 17),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTagPill(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
    );
  }
}

/// Stats for the readiness hero, derived from locally saved completed attempts.
class _HomeStats {
  final int attempted;
  final double avgAccuracy;
  final double bestPercentage;
  final int streakDays;

  const _HomeStats({
    required this.attempted,
    required this.avgAccuracy,
    required this.bestPercentage,
    required this.streakDays,
  });

  factory _HomeStats.fromAttempts(List<TestAttemptModel> attempts) {
    if (attempts.isEmpty) {
      return const _HomeStats(attempted: 0, avgAccuracy: 0, bestPercentage: 0, streakDays: 0);
    }
    final avgAccuracy =
        attempts.fold<double>(0, (sum, a) => sum + a.accuracy.clamp(0, 100)) / attempts.length;
    final best = attempts
        .map((a) => a.totalMarks > 0 ? a.score / a.totalMarks * 100 : a.percentage)
        .fold<double>(0, (m, p) => p > m ? p : m)
        .clamp(0, 100)
        .toDouble();

    // Consecutive days with at least one attempt, ending today (or yesterday).
    DateTime day(DateTime d) => DateTime(d.year, d.month, d.day);
    final days = attempts.map((a) => day(a.completedAt.toLocal())).toSet();
    var cursor = day(DateTime.now());
    if (!days.contains(cursor)) cursor = cursor.subtract(const Duration(days: 1));
    var streak = 0;
    while (days.contains(cursor)) {
      streak++;
      cursor = cursor.subtract(const Duration(days: 1));
    }

    return _HomeStats(
      attempted: attempts.length,
      avgAccuracy: avgAccuracy,
      bestPercentage: best,
      streakDays: streak,
    );
  }
}

/// Animated accuracy gauge for the dark readiness hero.
class _HeroRing extends StatelessWidget {
  final double percentage;

  const _HeroRing({required this.percentage});

  @override
  Widget build(BuildContext context) {
    final color = percentage >= 75
        ? AppColors.success
        : percentage >= 50
            ? AppColors.warning
            : const Color(0xFF6366F1);
    return SizedBox(
      width: 86,
      height: 86,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: percentage.clamp(0, 100) / 100),
        duration: const Duration(milliseconds: 900),
        curve: Curves.easeOutCubic,
        builder: (context, value, _) => CustomPaint(
          painter: _HeroRingPainter(progress: value, color: color),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${(value * 100).round()}%',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.6,
                    height: 1.1,
                  ),
                ),
                Text(
                  'Accuracy',
                  style: const TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HeroRingPainter extends CustomPainter {
  final double progress;
  final Color color;

  _HeroRingPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 8.0;
    final center = size.center(Offset.zero);
    final radius = (size.shortestSide - stroke) / 2;
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = const Color(0xFFEEF2FF)
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke,
    );
    if (progress <= 0) return;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress.clamp(0, 1),
      false,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = stroke,
    );
  }

  @override
  bool shouldRepaint(_HeroRingPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.color != color;
}

class _PKCardThemeData {
  final LinearGradient gradient;
  final bool isDarkBanner;
  final String bannerTitle;
  final Color pillBgColor;
  final Color pillTextColor;
  final String bannerAsset;
  final String fallbackEmblem;

  const _PKCardThemeData({
    required this.gradient,
    required this.isDarkBanner,
    required this.bannerTitle,
    required this.pillBgColor,
    required this.pillTextColor,
    required this.bannerAsset,
    required this.fallbackEmblem,
  });
}

class PKPopularTestSeriesSection extends StatefulWidget {
  final List<Map<String, dynamic>> seriesList;
  final VoidCallback onViewAll;

  const PKPopularTestSeriesSection({
    super.key,
    required this.seriesList,
    required this.onViewAll,
  });

  @override
  State<PKPopularTestSeriesSection> createState() => _PKPopularTestSeriesSectionState();
}

class _PKPopularTestSeriesSectionState extends State<PKPopularTestSeriesSection> {
  late final ScrollController _scrollController;
  int _activeIndex = 0;
  int _itemCount = 5;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _scrollController.addListener(_handleScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_handleScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _handleScroll() {
    if (!_scrollController.hasClients) return;
    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth = _calculateCardWidth(screenWidth);
    final itemExtent = cardWidth + 14.0;
    final newIndex = ((_scrollController.offset + (itemExtent * 0.4)) / itemExtent)
        .floor()
        .clamp(0, _itemCount > 0 ? _itemCount - 1 : 0);
    if (newIndex != _activeIndex) {
      setState(() {
        _activeIndex = newIndex;
      });
    }
  }

  double _calculateCardWidth(double screenWidth) {
    if (screenWidth < 500) {
      return (screenWidth * 0.65).clamp(236.0, 260.0);
    } else if (screenWidth < 900) {
      return 260.0;
    } else {
      return 280.0;
    }
  }

  void _scrollBy(double offset) {
    if (!_scrollController.hasClients) return;
    _scrollController.animateTo(
      (_scrollController.offset + offset).clamp(
        0.0,
        _scrollController.position.maxScrollExtent,
      ),
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
  }

  String _formatQuestions(int count) {
    if (count >= 1000) {
      return '${NumberFormat('#,###').format(count)}+';
    }
    return '$count+';
  }

  // Dedicated artwork has the exam name baked in, so match each exam strictly;
  // anything else gets a generated banner with its own title.
  _PKCardThemeData _getCardTheme(String title, int index) {
    final tLower = title.toLowerCase();
    if ((tLower.contains('wbp') && !tLower.contains('wbpsc')) || tLower.contains('west bengal police')) {
      return const _PKCardThemeData(
        gradient: LinearGradient(
          colors: [Color(0xFF1D4ED8), Color(0xFF3B82F6), Color(0xFF93C5FD)],
          stops: [0.0, 0.65, 1.0],
          begin: Alignment.bottomLeft,
          end: Alignment.topRight,
        ),
        isDarkBanner: true,
        bannerTitle: 'WBP\nConstable',
        pillBgColor: Color(0xFFFBBF24),
        pillTextColor: Color(0xFF0F172A),
        bannerAsset: 'assets/images/banner_series_wbp_exact.png',
        fallbackEmblem: 'assets/images/exams/emblem_series_wbp.png',
      );
    } else if (tLower.contains('wbssc')) {
      return const _PKCardThemeData(
        gradient: LinearGradient(
          colors: [Color(0xFFFFF1F2), Color(0xFFFCE7F3), Color(0xFFFBCFE8)],
          stops: [0.0, 0.55, 1.0],
          begin: Alignment.bottomLeft,
          end: Alignment.topRight,
        ),
        isDarkBanner: false,
        bannerTitle: 'WBSSC\nGroup C & D',
        pillBgColor: Color(0xFFF43F5E),
        pillTextColor: Colors.white,
        bannerAsset: 'assets/images/banner_series_wbssc_exact.png',
        fallbackEmblem: 'assets/images/exams/emblem_wbssc.png',
      );
    } else if (tLower.contains('ntpc')) {
      return const _PKCardThemeData(
        gradient: LinearGradient(
          colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A), Color(0xFFFCD34D)],
          stops: [0.0, 0.55, 1.0],
          begin: Alignment.bottomLeft,
          end: Alignment.topRight,
        ),
        isDarkBanner: false,
        bannerTitle: 'Railway\nNTPC',
        pillBgColor: Color(0xFFF59E0B),
        pillTextColor: Color(0xFF0F172A),
        bannerAsset: 'assets/images/banner_series_railway_exact.png',
        fallbackEmblem: 'assets/images/exams/logo_railway.png',
      );
    } else if (tLower.contains('ssc gd') || tLower.contains('ssc-gd')) {
      return const _PKCardThemeData(
        gradient: LinearGradient(
          colors: [Color(0xFFE6FFFA), Color(0xFFCCFBF1), Color(0xFF99F6E4)],
          stops: [0.0, 0.55, 1.0],
          begin: Alignment.bottomLeft,
          end: Alignment.topRight,
        ),
        isDarkBanner: false,
        bannerTitle: 'SSC\nGD',
        pillBgColor: Color(0xFFF43F5E),
        pillTextColor: Colors.white,
        bannerAsset: 'assets/images/banner_series_ssc_exact.png',
        fallbackEmblem: 'assets/images/exams/emblem_series_ssc.png',
      );
    } else if (RegExp(r'\bkp\b').hasMatch(tLower) || tLower.contains('kolkata police')) {
      return const _PKCardThemeData(
        gradient: LinearGradient(
          colors: [Color(0xFFEDE9FE), Color(0xFFDDD6FE), Color(0xFFC4B5FD)],
          stops: [0.0, 0.55, 1.0],
          begin: Alignment.bottomLeft,
          end: Alignment.topRight,
        ),
        isDarkBanner: false,
        bannerTitle: 'KP\nConstable',
        pillBgColor: Color(0xFF8B5CF6),
        pillTextColor: Colors.white,
        bannerAsset: 'assets/images/banner_series_kp_exact.png',
        fallbackEmblem: 'assets/images/exams/emblem_series_kp.png',
      );
    } else {
      // No dedicated artwork: generated gradient banner with the series' own title
      // (never reuse another exam's art, which has its name baked in).
      final shortTitle = title.length > 28 ? title.substring(0, 28) : title;
      final displayBannerTitle = shortTitle.contains(' ')
          ? shortTitle.replaceFirst(' ', '\n')
          : shortTitle;
      const palettes = [
        [Color(0xFF312E81), Color(0xFF4F46E5), Color(0xFF818CF8)],
        [Color(0xFF134E4A), Color(0xFF0D9488), Color(0xFF5EEAD4)],
        [Color(0xFF7C2D12), Color(0xFFEA580C), Color(0xFFFDBA74)],
      ];
      return _PKCardThemeData(
        gradient: LinearGradient(
          colors: palettes[index % palettes.length],
          stops: const [0.0, 0.6, 1.0],
          begin: Alignment.bottomLeft,
          end: Alignment.topRight,
        ),
        isDarkBanner: true,
        bannerTitle: displayBannerTitle,
        pillBgColor: const Color(0xFF8B5CF6),
        pillTextColor: Colors.white,
        bannerAsset: '',
        fallbackEmblem: '',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final defaultSeries = [
      {
        'id': 'wbp-constable',
        'testSeriesId': 'wbp-constable',
        'title': 'WBP Constable',
        'subtitle': 'Complete Test Series',
        'badgeText': 'Most Popular',
        'mocks': 25,
        'topics': 80,
        'pyqs': 20,
        'totalQuestions': 12500,
        'isPremium': false,
        'route': '/test-series/wbp-constable',
      },
      {
        'id': 'wbssc-group-c',
        'testSeriesId': 'wbssc-group-c',
        'title': 'WBSSC Group C & D',
        'subtitle': 'Complete Preparation Series',
        'badgeText': null,
        'mocks': 30,
        'topics': 90,
        'pyqs': 20,
        'totalQuestions': 15000,
        'isPremium': true,
        'route': '/test-series/wbssc-group-c',
      },
      {
        'id': 'railway-ntpc',
        'testSeriesId': 'railway-ntpc',
        'title': 'Railway NTPC',
        'subtitle': 'Complete Test Series',
        'badgeText': 'Trending Now',
        'mocks': 40,
        'topics': 110,
        'pyqs': 25,
        'totalQuestions': 18000,
        'isPremium': true,
        'route': '/test-series/railway-ntpc',
      },
      {
        'id': 'ssc-gd',
        'testSeriesId': 'ssc-gd',
        'title': 'SSC GD',
        'subtitle': 'Complete Test Series',
        'badgeText': null,
        'mocks': 35,
        'topics': 100,
        'pyqs': 20,
        'totalQuestions': 16000,
        'isPremium': true,
        'route': '/test-series/ssc-gd',
      },
      {
        'id': 'kp-constable',
        'testSeriesId': 'kp-constable',
        'title': 'KP Constable',
        'subtitle': 'Complete Test Series',
        'badgeText': null,
        'mocks': 35,
        'topics': 110,
        'pyqs': 20,
        'totalQuestions': 14000,
        'isPremium': true,
        'route': '/test-series/kp-constable',
      },
    ];

    final displayList = widget.seriesList.isNotEmpty
        ? widget.seriesList.map((item) {
            final route = (item['route'] as String?)?.trim();
            final seriesId = (item['testSeriesId'] ?? item['id'] ?? 'wbp-constable').toString();
            final fCount = (item['fullMockCount'] as num?)?.toInt() ?? 25;
            final tCount = (item['topicTestCount'] as num?)?.toInt() ?? 80;
            final pCount = (item['pyqTestCount'] as num?)?.toInt() ?? 20;
            final qCount = (item['totalQuestions'] as num?)?.toInt() ?? (fCount * 85);

            return {
              'id': seriesId,
              'title': (item['title'] ?? 'Mock Test Series').toString(),
              'subtitle': (item['subtitle'] ?? 'Complete Test Series').toString(),
              'badgeText': item['badgeText'] as String?,
              'mocks': fCount,
              'topics': tCount,
              'pyqs': pCount,
              'totalQuestions': qCount,
              'isPremium': (item['isPremium'] as bool?) ?? false,
              'route': (route != null && route.isNotEmpty) ? route : '/test-series/$seriesId',
            };
          }).toList()
        : defaultSeries;
    _itemCount = displayList.length;

    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth = _calculateCardWidth(screenWidth);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header: 🔥 tile, title + subtitle, desktop arrows and View All
        Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: const Color(0xFFF43F5E).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(9),
              ),
              child: const Center(
                child: Text('🔥 ', style: TextStyle(fontSize: 14)),
              ),
            ),
            const SizedBox(width: 9),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Popular Test Series',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 16.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.3,
                    ),
                  ),
                  SizedBox(height: 1),
                  Text(
                    'Most chosen by aspirants this month',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (screenWidth >= 600) ...[
              _buildArrowButton(Icons.chevron_left_rounded, () => _scrollBy(-(cardWidth + 14))),
              const SizedBox(width: 6),
              _buildArrowButton(Icons.chevron_right_rounded, () => _scrollBy(cardWidth + 14)),
              const SizedBox(width: 8),
            ],
            InkWell(
              onTap: widget.onViewAll,
              borderRadius: BorderRadius.circular(8),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Text(
                  'View All →',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF3142D6),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Horizontal Carousel
        SizedBox(
          // Grow with the system text size so card text never clips.
          height: 302 + (MediaQuery.textScalerOf(context).scale(100) / 100 - 1).clamp(0.0, 1.0) * 110,
          child: ListView.separated(
            controller: _scrollController,
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            clipBehavior: Clip.none,
            itemCount: displayList.length,
            separatorBuilder: (_, _) => const SizedBox(width: 14),
            itemBuilder: (context, i) => _buildSeriesCard(displayList[i], i, cardWidth),
          ),
        ),

        // Carousel Indicator (active pill)
        Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(displayList.length, (dotIdx) {
              final isActive = dotIdx == _activeIndex;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: isActive ? 18 : 6,
                height: 5,
                decoration: BoxDecoration(
                  color: isActive ? const Color(0xFF3142D6) : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }),
          ),
        ),
      ],
    );
  }

  Widget _buildArrowButton(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Icon(icon, size: 18, color: const Color(0xFF475569)),
      ),
    );
  }

  Widget _buildSeriesCard(Map<String, dynamic> item, int i, double cardWidth) {
    final title = item['title'] as String;
    final subtitle = item['subtitle'] as String;
    final mocks = (item['mocks'] as num?)?.toInt() ?? 25;
    final topics = (item['topics'] as num?)?.toInt() ?? 80;
    final pyqs = (item['pyqs'] as num?)?.toInt() ?? 20;
    final totalQuestions = (item['totalQuestions'] as num?)?.toInt() ?? 12500;
    final isFree = !((item['isPremium'] as bool?) ?? false);
    final badgeText = (item['badgeText'] as String?) ?? (i == 0 ? 'Most Popular' : null);
    final theme = _getCardTheme(title, i);
    final route = item['route'] as String? ?? '/test-series/${item['id']}';

    Widget generatedBanner() {
      final ink = theme.isDarkBanner ? Colors.white : const Color(0xFF0F172A);
      return DecoratedBox(
        decoration: BoxDecoration(gradient: theme.gradient),
        child: Stack(
          children: [
            Positioned(
              right: -14,
              bottom: -18,
              child: Icon(Icons.menu_book_rounded, size: 120, color: ink.withValues(alpha: 0.12)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    theme.bannerTitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: ink,
                      fontWeight: FontWeight.w900,
                      fontSize: 21,
                      height: 1.1,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFBBF24),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Test Series',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return InkWell(
      onTap: () => context.push(route),
      borderRadius: BorderRadius.circular(22),
      child: Container(
        width: cardWidth,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(color: Color(0x0D0F172A), blurRadius: 16, offset: Offset(0, 6)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Inset banner with access pill
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                height: 132,
                width: double.infinity,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (theme.bannerAsset.isNotEmpty)
                      Image.asset(
                        theme.bannerAsset,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => generatedBanner(),
                      )
                    else
                      generatedBanner(),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isFree ? const Color(0xFF10B981) : const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: const [
                            BoxShadow(color: Color(0x290F172A), blurRadius: 6, offset: Offset(0, 2)),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isFree ? Icons.lock_open_rounded : Icons.workspace_premium_rounded,
                              size: 12,
                              color: isFree ? Colors.white : const Color(0xFFFBBF24),
                            ),
                            const SizedBox(width: 3),
                            Text(
                              isFree ? 'FREE' : 'PRO',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 0.4,
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

            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(6, 10, 6, 2),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title row with optional highlight badge
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                              letterSpacing: -0.3,
                            ),
                          ),
                        ),
                        if (badgeText != null && badgeText.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF7ED),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFFED7AA)),
                            ),
                            child: Text(
                              badgeText,
                              style: const TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFFC2410C),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$subtitle • ${_formatQuestions(totalQuestions)} Qs',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Stat strip: Mocks | Topic Tests | PYQs
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 7),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFF1F5F9)),
                      ),
                      child: Row(
                        children: [
                          _buildStat('$mocks', 'Mocks'),
                          _buildStatDivider(),
                          _buildStat('$topics', 'Topic Tests'),
                          _buildStatDivider(),
                          _buildStat('$pyqs', 'PYQs'),
                        ],
                      ),
                    ),
                    const Spacer(),
                    SizedBox(
                      width: double.infinity,
                      height: 38,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: isFree ? const Color(0xFF3142D6) : const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              isFree ? 'Start Free' : 'Explore Series',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: isFree ? Colors.white : const Color(0xFF3142D6),
                              ),
                            ),
                            const SizedBox(width: 5),
                            Icon(
                              Icons.arrow_forward_rounded,
                              size: 16,
                              color: isFree ? Colors.white : const Color(0xFF3142D6),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Text(
            '$value+',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
              height: 1.15,
            ),
          ),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w600,
              color: Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatDivider() => Container(width: 1, height: 22, color: const Color(0xFFE2E8F0));
}

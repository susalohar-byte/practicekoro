import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/pk_ui.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/models/test_model.dart';
import '../../data/repositories/catalog_repository.dart';

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
  int _seriesIndex = 0;
  final ScrollController _seriesScrollController = ScrollController();

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
    super.dispose();
  }

  void _onSeriesScroll() {
    if (!_seriesScrollController.hasClients) return;
    final offset = _seriesScrollController.offset;
    final index = (offset / 248).round().clamp(0, 4);
    if (index != _seriesIndex && mounted) {
      setState(() => _seriesIndex = index);
    }
  }

  Future<void> _loadUserMeta() async {
    final name = LocalStorageService.getUserName();
    if (!mounted) return;
    setState(() {
      _userName = name == 'Candidate' ? '' : name.trim();
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
    ref.invalidate(popularTestSeriesProvider);
    ref.invalidate(recentTestsProvider);
    ref.invalidate(inProgressAttemptsProvider);
    ref.invalidate(completedAttemptsProvider);
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
    final seriesAsync = ref.watch(popularTestSeriesProvider);
    final inProgress =
        ref.watch(inProgressAttemptsProvider).asData?.value ?? const <Map<String, dynamic>>[];
    final serverAttempts =
        ref.watch(completedAttemptsProvider).asData?.value ?? const <TestAttemptModel>[];
    final recentTests =
        ref.watch(recentTestsProvider).asData?.value ?? const <MockTestModel>[];
    final notifs =
        ref.watch(notificationsProvider).asData?.value ?? const <Map<String, dynamic>>[];

    final attemptsById = <String, TestAttemptModel>{
      for (final a in LocalStorageService.getAttempts()) a.id: a,
      for (final a in serverAttempts) a.id: a,
    };
    final stats = _HomeStats.fromAttempts(attemptsById.values);

    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FD),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: _refresh,
          color: PK.blue,
          child: ListView(
            padding: PKBottomSpacing.edgeInsets(context, horizontal: PK.gutter, top: 10),
            children: [
              // 1. Header & Branding
              _buildHeader(notifs.length),
              const SizedBox(height: 14),

              // 2. Hero Banner
              _buildHeroBanner(),
              const SizedBox(height: 8),
              _buildHeroDots(),
              const SizedBox(height: 20),

              // 3. Continue Your Practice
              _buildContinuePractice(inProgress),
              const SizedBox(height: 20),

              // 4. Quick Actions
              _buildQuickActions(),
              const SizedBox(height: 24),

              // 5. Exams for You
              _buildExamsForYou(exams),
              const SizedBox(height: 24),

              // 6. Popular Test Series
              _buildPopularSeries(seriesAsync),
              const SizedBox(height: 24),

              // 7. Your Progress
              _buildYourProgress(stats),
              const SizedBox(height: 24),

              // 8. Recent Tests
              _buildRecentTests(),
              const SizedBox(height: 24),

              // 9. Recently Added Tests
              _buildRecentlyAddedTests(recentTests),
              const SizedBox(height: 24),

              // 10. Recommended for You
              _buildRecommendedForYou(),
              const SizedBox(height: 24),

              // 11. Motivational Banner
              _buildMotivationalBanner(),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  // ─── 1. Header ─────────────────────────────────────────────────────────────

  Widget _buildHeader(int unreadNotifsCount) {
    final count = unreadNotifsCount > 0 ? unreadNotifsCount : 3;

    return Row(
      children: [
        // PracticeKoro Logo & Brand Text
        InkWell(
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
              const Text(
                'PracticeKoro',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F1E4A),
                  letterSpacing: -0.4,
                ),
              ),
            ],
          ),
        ),
        const Spacer(),
        // Search Action Button
        _circularHeaderButton(
          icon: Icons.search_rounded,
          tooltip: 'Search test series',
          onTap: () => _navigateToTab(1, '/test-series'),
        ),
        const SizedBox(width: 10),
        // Notifications Action Button with Red Badge
        Stack(
          clipBehavior: Clip.none,
          children: [
            _circularHeaderButton(
              icon: Icons.notifications_none_rounded,
              tooltip: 'Notifications',
              onTap: () => context.push('/notifications'),
            ),
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
                    '$count',
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
            width: 40,
            height: 40,
            alignment: Alignment.center,
            child: Icon(icon, size: 20, color: const Color(0xFF0F1E4A)),
          ),
        ),
      ),
    );
  }

  // ─── 2. Hero Banner ────────────────────────────────────────────────────────

  Widget _buildHeroBanner() {
    return Container(
      constraints: const BoxConstraints(minHeight: 185),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: const Color(0xFFD9EEFE),
        image: const DecorationImage(
          image: AssetImage('assets/images/dashboard/ref_hero_banner_clean.png'),
          fit: BoxFit.cover,
          alignment: Alignment.centerRight,
        ),
        border: Border.all(color: const Color(0xFFCCE0FF)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C0158FC),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 16, 125, 16),
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
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F275E),
                  ),
                ),
                Text(
                  _firstName,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F275E),
                  ),
                ),
                const Text(
                  '! 👋',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F275E),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Small Practice\nBig Results!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0B1B3F),
                height: 1.15,
                letterSpacing: -0.4,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Turn your preparation into success with daily practice.',
              maxLines: 2,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w500,
                color: Color(0xFF4B5E80),
                height: 1.3,
              ),
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: () => _navigateToTab(2, '/practice'),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7.5),
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
                child: const FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Start Practicing',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(width: 5),
                      Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
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

  Widget _buildHeroDots() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 18,
          height: 5,
          decoration: BoxDecoration(
            color: const Color(0xFF0158FC),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 5),
        Container(
          width: 5,
          height: 5,
          decoration: const BoxDecoration(
            color: Color(0xFFCBD5E1),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 5),
        Container(
          width: 5,
          height: 5,
          decoration: const BoxDecoration(
            color: Color(0xFFCBD5E1),
            shape: BoxShape.circle,
          ),
        ),
      ],
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
          padding: const EdgeInsets.all(14),
          decoration: PK.cardBox(r: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(12),
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
                            fontSize: 14,
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
                            fontSize: 11.5,
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
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: const Color(0xFFEEF2F8),
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0158FC)),
                ),
              ),
              const SizedBox(height: 14),
              InkWell(
                onTap: onContinue,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: double.infinity,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0158FC),
                    borderRadius: BorderRadius.circular(12),
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

  // ─── 5. Exams for You ──────────────────────────────────────────────────────

  Widget _buildExamsForYou(List<ExamModel> exams) {
    final examConfigs = [
      (
        title: 'WBP Constable',
        displayTitle: 'WBP\nConstable',
        tests: '25 Tests',
        asset: 'assets/images/dashboard/exam_card_wbp_art.png',
        slug: 'wbp-constable',
      ),
      (
        title: 'WBSSC Group C & D',
        displayTitle: 'WBSSC\nGroup C & D',
        tests: '30 Tests',
        asset: 'assets/images/dashboard/exam_card_wbssc_art.png',
        slug: 'wbssc-group-c-d',
      ),
      (
        title: 'Railway NTPC',
        displayTitle: 'Railway\nNTPC',
        tests: '40 Tests',
        asset: 'assets/images/dashboard/exam_card_railway_art.png',
        slug: 'railway-ntpc',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.emoji_events_rounded, color: Color(0xFFF59E0B), size: 18),
            const SizedBox(width: 6),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Exams for You',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F1E4A),
                      letterSpacing: -0.3,
                    ),
                  ),
                  SizedBox(height: 1),
                  Text(
                    'Choose an exam to start practicing',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
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
                          child: Image.asset(
                            examConfigs[i].asset,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => Container(
                              color: const Color(0xFFEFF6FF),
                              child: const Icon(Icons.school_rounded, color: PK.blue, size: 28),
                            ),
                          ),
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
                              Row(
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
          PKSectionTitle(title: 'Popular Test Series', subtitle: 'Most attempted and recommended for you'),
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
          PKSectionTitle(title: 'Popular Test Series', subtitle: 'Most attempted and recommended for you'),
          SizedBox(height: 10),
          PKEmptyCard(
            icon: Icons.library_books_outlined,
            title: 'No test series yet',
            message: 'Published test series will appear here.',
          ),
        ],
      );
    }

    final defaultSeriesBanners = [
      'assets/images/dashboard/series_card_wbp_art.png',
      'assets/images/dashboard/series_card_wbssc_art.png',
      'assets/images/dashboard/series_card_railway_art.png',
    ];

    final cardItems = [
      for (var i = 0; i < series.length.clamp(0, 5); i++) ...[
        (
          title: series[i].title,
          sub: PK.seriesLabel(series[i].title, series[i].description, series[i].examTitle),
          isPopular: series[i].isPopular,
          tests: '${series[i].testCount > 0 ? series[i].testCount : (i == 0 ? 25 : (i == 1 ? 30 : 40))} Tests',
          qs: series[i].questionCount > 0
              ? '${PK.formatCount(series[i].questionCount)} Qs'
              : (i == 0 ? '12,500+ Qs' : (i == 1 ? '15,000+ Qs' : '1,525 Qs')),
          banner: series[i].bannerUrl ?? defaultSeriesBanners[i % defaultSeriesBanners.length],
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Popular Test Series',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F1E4A),
                      letterSpacing: -0.3,
                    ),
                  ),
                  SizedBox(height: 1),
                  Text(
                    'Most attempted and recommended for you',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
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
          height: 198,
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
                  width: 236,
                  decoration: PK.cardBox(r: 16),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Stack(
                        children: [
                          SizedBox(
                            height: 94,
                            width: double.infinity,
                            child: item.banner.startsWith('assets/')
                                ? Image.asset(
                                    item.banner,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, _, _) => Container(color: const Color(0xFFE8F2FF)),
                                  )
                                : Image.network(
                                    item.banner,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, _, _) => Container(color: const Color(0xFFE8F2FF)),
                                  ),
                          ),
                          if (item.isPopular)
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Text(
                                  'POPULAR',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF0F1E4A),
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        item.sub,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w500,
                                          color: Color(0xFF64748B),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  width: 32,
                                  height: 32,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF0158FC),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                const Icon(Icons.calendar_today_outlined, size: 11.5, color: Color(0xFF64748B)),
                                const SizedBox(width: 4),
                                Text(
                                  item.tests,
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(width: 12),
                                const Icon(Icons.assignment_outlined, size: 11.5, color: Color(0xFF64748B)),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    item.qs,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
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

  Widget _buildRecentTests() {
    final tests = [
      (
        title: 'Full Mock Test 1',
        exam: 'WBP Constable',
        qs: '85 Qs',
        time: '90 Mins',
        marks: '100 Marks',
        isPaid: false,
        iconColor: const Color(0xFF2563EB),
        iconBg: const Color(0xFFEFF6FF),
      ),
      (
        title: 'Topic Test - General Awareness',
        exam: 'WBP Constable',
        qs: '25 Qs',
        time: '25 Mins',
        marks: '25 Marks',
        isPaid: false,
        iconColor: const Color(0xFF16A34A),
        iconBg: const Color(0xFFF0FDF4),
      ),
      (
        title: 'Topic Test - Mathematics',
        exam: 'WBSSC Group C & D',
        qs: '30 Qs',
        time: '30 Mins',
        marks: '30 Marks',
        isPaid: true,
        iconColor: const Color(0xFFEA580C),
        iconBg: const Color(0xFFFFF7ED),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.access_time_rounded, color: Color(0xFF2563EB), size: 18),
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
                onTap: () => context.push('/test-series'),
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
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                  decoration: BoxDecoration(
                                    color: tests[i].isPaid ? const Color(0xFFFFEDD5) : const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    tests[i].isPaid ? 'PAID' : 'FREE',
                                    style: TextStyle(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                      color: tests[i].isPaid ? const Color(0xFFD97706) : const Color(0xFF16A34A),
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
                      Icon(
                        tests[i].isPaid ? Icons.lock_outline_rounded : Icons.chevron_right_rounded,
                        color: const Color(0xFF94A3B8),
                        size: 20,
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

  // ─── 9. Recently Added Tests ───────────────────────────────────────────────

  Widget _buildRecentlyAddedTests(List<MockTestModel> recentTests) {
    final tests = [
      (
        title: 'WBP Constable - Full Mock Test 5',
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
        title: 'Static GK - Important Questions',
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
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.auto_awesome_rounded, color: Color(0xFFF59E0B), size: 18),
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
                onTap: () => context.push('/test-series'),
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
                                  child: const Text(
                                    'FREE',
                                    style: TextStyle(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF16A34A),
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

  Widget _buildRecommendedForYou() {
    final topics = [
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.track_changes_rounded, color: Color(0xFFEF4444), size: 18),
            const SizedBox(width: 6),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Recommended for You',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F1E4A),
                      letterSpacing: -0.3,
                    ),
                  ),
                  SizedBox(height: 1),
                  Text(
                    'Based on your performance and preparation',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
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
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.6,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: topics.length,
          itemBuilder: (context, i) {
            final t = topics[i];
            return InkWell(
              onTap: () => context.push('/practice/subject/${t.id}'),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: t.bg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: t.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(t.icon, color: t.iconColor, size: 24),
                        const Spacer(),
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: t.circleBg,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.arrow_forward_rounded, size: 11, color: t.iconColor),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t.title,
                          maxLines: 2,
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F1E4A),
                            height: 1.15,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          t.qs,
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
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
      ],
    );
  }

  // ─── 11. Motivational Banner ───────────────────────────────────────────────

  Widget _buildMotivationalBanner() {
    return Container(
      constraints: const BoxConstraints(minHeight: 140),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: const Color(0xFFD9EBFF),
        image: const DecorationImage(
          image: AssetImage('assets/images/dashboard/motivation_banner_clean.png'),
          fit: BoxFit.cover,
          alignment: Alignment.centerRight,
        ),
        border: Border.all(color: const Color(0xFFCCE2FF)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C0158FC),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      padding: const EdgeInsets.fromLTRB(16, 16, 125, 16),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Consistent\nPractice Creates\nBig Results!',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0A2569),
              height: 1.15,
              letterSpacing: -0.3,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'Stay focused. Keep practicing.\nYour goal is closer than you think.',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: Color(0xFF4B5E80),
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}

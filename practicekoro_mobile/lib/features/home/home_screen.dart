import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/utils/image_url_helper.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/test_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/repositories/practice_repository.dart';

final homeExamsProvider = FutureProvider<List<ExamModel>>((ref) async {
  return ref.watch(catalogRepositoryProvider).getExams();
});

/// Completed attempts from the server for the signed-in student (empty when offline
/// or signed out); merged with locally saved attempts for the progress card.
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

/// Progress figures for the "Your Progress" card, derived from completed attempts.
class _HomeStats {
  final int attempted;
  final int? accuracy; // null until at least one question has been answered
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

    return _HomeStats(
      attempted: list.length,
      accuracy: answered > 0 ? (correct / answered * 100).round() : null,
      questionsSolved: answered,
      streakDays: streak,
    );
  }
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  static const Color _canvas = Color(0xFFF2F7FF);
  static const Color _ink = Color(0xFF0B1B3F);
  static const Color _slate = Color(0xFF64748B);
  static const Color _muted = Color(0xFF94A3B8);
  static const Color _blue = Color(0xFF1A6DFF);
  static const Color _border = Color(0xFFE3ECFA);

  String _userName = '';
  List<String> _selectedExamTitles = const [];

  @override
  void initState() {
    super.initState();
    _loadUserMeta();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ref.read(catalogRepositoryProvider).setupRealtimeListeners(ref);
      }
    });
  }

  Future<void> _loadUserMeta() async {
    final name = LocalStorageService.getUserName();
    if (!mounted) return;
    setState(() {
      _userName = name == 'Candidate' ? '' : name.trim();
      _selectedExamTitles = LocalStorageService.getTargetExamsList();
    });
  }

  void _navigateToTab(int index, String route) {
    if (widget.onTabSelected != null) {
      widget.onTabSelected!(index);
    } else {
      context.go(route);
    }
  }

  Future<void> _openExamPreferences() async {
    await context.push('/edit-profile');
    if (mounted) _loadUserMeta();
  }

  Future<void> _refresh() async {
    ref.invalidate(homeExamsProvider);
    ref.invalidate(popularTestSeriesProvider);
    ref.invalidate(recentTestsProvider);
    ref.invalidate(inProgressAttemptsProvider);
    ref.invalidate(completedAttemptsProvider);
    ref.invalidate(notificationsProvider);
    await _loadUserMeta();
  }

  @override
  Widget build(BuildContext context) {
    final exams = ref.watch(homeExamsProvider).asData?.value ?? const <ExamModel>[];
    final seriesAsync = ref.watch(popularTestSeriesProvider);
    final recentAsync = ref.watch(recentTestsProvider);
    final continueAttempts =
        ref.watch(inProgressAttemptsProvider).asData?.value ?? const <Map<String, dynamic>>[];
    final serverAttempts =
        ref.watch(completedAttemptsProvider).asData?.value ?? const <TestAttemptModel>[];
    final hasNotifications =
        (ref.watch(notificationsProvider).asData?.value ?? const []).isNotEmpty;

    final attemptsById = <String, TestAttemptModel>{
      for (final a in LocalStorageService.getAttempts()) a.id: a,
      for (final a in serverAttempts) a.id: a,
    };
    final stats = _HomeStats.fromAttempts(attemptsById.values);

    return Scaffold(
      backgroundColor: _canvas,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: _refresh,
          color: _blue,
          child: ListView(
            padding: PKBottomSpacing.edgeInsets(context, horizontal: 16, top: 8),
            children: [
              _buildHeader(hasNotifications),
              const SizedBox(height: 14),
              _buildHeroBanner(),
              const SizedBox(height: 14),
              _buildSearchBar(),
              const SizedBox(height: 22),
              _buildQuickActions(),
              const SizedBox(height: 22),
              _buildContinuePractice(continueAttempts),
              const SizedBox(height: 22),
              _buildYourExams(exams),
              const SizedBox(height: 22),
              _buildPopularSeries(seriesAsync),
              const SizedBox(height: 22),
              _buildProgress(stats),
              const SizedBox(height: 22),
              _buildKeepGoingBanner(),
              const SizedBox(height: 22),
              _buildFeatured(),
              const SizedBox(height: 22),
              _buildRecentTests(recentAsync),
              const SizedBox(height: 22),
              _buildRecommended(),
              const SizedBox(height: 22),
              _buildKeepShowingUp(),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Shared chrome ─────────────────────────────────────────────────────────

  BoxDecoration _card({double radius = 18, Color color = Colors.white}) {
    return BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: _border),
      boxShadow: const [
        BoxShadow(color: Color(0x0A1E3A8A), blurRadius: 14, offset: Offset(0, 4)),
      ],
    );
  }

  Widget _sectionHeader({
    required String title,
    String? subtitle,
    Widget? leading,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        if (leading != null) ...[leading, const SizedBox(width: 8)],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: _ink,
                  letterSpacing: -0.4,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: _slate),
                ),
            ],
          ),
        ),
        if (actionLabel != null)
          InkWell(
            onTap: onAction,
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    actionLabel,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: _blue),
                  ),
                  const SizedBox(width: 2),
                  const Icon(Icons.arrow_forward_rounded, size: 15, color: _blue),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _iconTile(IconData icon, Color color, {double size = 40, double radius = 12}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(radius),
      ),
      child: Icon(icon, color: color, size: size * 0.52),
    );
  }

  Widget _arrowCircle({Color color = _blue, double size = 26}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      child: Icon(Icons.arrow_forward_rounded, size: size * 0.55, color: Colors.white),
    );
  }

  Widget _emptyNote(String text, {IconData icon = Icons.info_outline_rounded}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: _card(radius: 16),
      child: Row(
        children: [
          Icon(icon, size: 20, color: _muted),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: _slate, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }

  // ─── 1. Header ─────────────────────────────────────────────────────────────

  Widget _buildHeader(bool hasNotifications) {
    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(11),
          child: Image.asset(
            'assets/images/logo-circle.png',
            width: 38,
            height: 38,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(color: _blue, borderRadius: BorderRadius.circular(11)),
              child: const Icon(Icons.school_rounded, color: Colors.white, size: 20),
            ),
          ),
        ),
        const SizedBox(width: 9),
        const Expanded(
          child: Text.rich(
            TextSpan(
              children: [
                TextSpan(text: 'Practice'),
                TextSpan(text: 'Koro', style: TextStyle(color: _blue)),
              ],
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: _ink,
              letterSpacing: -0.7,
            ),
          ),
        ),
        _headerIcon(
          icon: Icons.search_rounded,
          label: 'Search',
          onTap: () => _navigateToTab(1, '/test-series'),
        ),
        const SizedBox(width: 6),
        _headerIcon(
          icon: Icons.notifications_none_rounded,
          label: 'Notifications',
          showDot: hasNotifications,
          onTap: () => context.push('/notifications'),
        ),
      ],
    );
  }

  Widget _headerIcon({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool showDot = false,
  }) {
    return IconButton(
      onPressed: onTap,
      tooltip: label,
      padding: EdgeInsets.zero,
      constraints: const BoxConstraints.tightFor(width: 40, height: 40),
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(icon, size: 26, color: _ink),
          if (showDot)
            Positioned(
              top: 1,
              right: 1,
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444),
                  shape: BoxShape.circle,
                  border: Border.all(color: _canvas, width: 1.5),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ─── 2. Hero banner ────────────────────────────────────────────────────────

  Widget _buildHeroBanner() {
    final greeting = _userName.isNotEmpty ? 'Hi, $_userName 👋' : 'Hi there 👋';
    return Container(
      constraints: const BoxConstraints(minHeight: 168),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(
          colors: [Color(0xFFEAF3FF), Color(0xFFDCEBFF), Color(0xFFCFE3FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: const Color(0xFFCBDFFF)),
        boxShadow: const [
          BoxShadow(color: Color(0x1A1A6DFF), blurRadius: 18, offset: Offset(0, 6)),
        ],
      ),
      child: Stack(
        children: [
          // Soft decorative shapes
          Positioned(right: 118, top: 14, child: _sparkle(14, const Color(0xFFFFC53D))),
          Positioned(right: 24, top: 10, child: _sparkle(9, const Color(0xFF1A6DFF))),
          Positioned(right: 128, bottom: 18, child: _sparkle(8, const Color(0xFF1A6DFF))),
          Positioned(
            right: 4,
            top: 10,
            bottom: 0,
            child: Image.asset(
              'assets/images/home_hero_nimo.png',
              fit: BoxFit.fitHeight,
              alignment: Alignment.bottomRight,
              filterQuality: FilterQuality.medium,
              errorBuilder: (_, _, _) => const SizedBox.shrink(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 150, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    greeting,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: _blue),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Consistent Practice,\nBig Results!',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: _ink,
                    height: 1.15,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 5),
                const Text(
                  'Small steps today, big success tomorrow.',
                  maxLines: 2,
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: Color(0xFF334155), height: 1.3),
                ),
                const SizedBox(height: 14),
                _heroButton('Start Practicing', () => _navigateToTab(2, '/practice')),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Blue pill CTA used on the hero and motivation banners; scales down on narrow columns.
  Widget _heroButton(String label, VoidCallback onTap) {
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: SizedBox(
        height: 36,
        child: ElevatedButton(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(
            backgroundColor: _blue,
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
              const SizedBox(width: 6),
              const Icon(Icons.arrow_forward_rounded, size: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sparkle(double size, Color color) {
    return Icon(Icons.auto_awesome_rounded, size: size, color: color.withValues(alpha: 0.85));
  }

  // ─── 3. Search bar ─────────────────────────────────────────────────────────

  Widget _buildSearchBar() {
    return Container(
      height: 48,
      decoration: _card(radius: 24),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              readOnly: true,
              onTap: () => _navigateToTab(1, '/test-series'),
              decoration: const InputDecoration(
                isDense: true,
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(vertical: 14),
                prefixIcon: Icon(Icons.search_rounded, color: _slate, size: 22),
                hintText: 'Search for tests, topics, exams...',
                hintStyle: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: _muted),
              ),
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _ink),
            ),
          ),
          IconButton(
            tooltip: 'Filter',
            onPressed: () => _navigateToTab(1, '/test-series'),
            icon: const Icon(Icons.tune_rounded, color: _ink, size: 22),
          ),
        ],
      ),
    );
  }

  // ─── 4. Quick actions ──────────────────────────────────────────────────────

  Widget _buildQuickActions() {
    final actions = [
      (title: 'Audio Book', sub: 'Learn Anywhere', icon: Icons.volume_up_rounded, color: const Color(0xFF8B5CF6), onTap: () => context.push('/audio-books')),
      (title: 'Topic Test', sub: 'Chapter-wise', icon: Icons.track_changes_rounded, color: const Color(0xFF10B981), onTap: () => _navigateToTab(2, '/practice')),
      (title: 'Rank', sub: 'See Your Rank', icon: Icons.emoji_events_rounded, color: const Color(0xFFF59E0B), onTap: () => context.push('/leaderboard')),
      (title: 'Saved Questions', sub: 'Your Favorites', icon: Icons.bookmark_rounded, color: const Color(0xFFF43F5E), onTap: () => context.push('/saved-questions')),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(
          title: 'Quick Actions',
          actionLabel: 'See All',
          onAction: () => _navigateToTab(2, '/practice'),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            for (var i = 0; i < actions.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Expanded(
                child: InkWell(
                  onTap: actions[i].onTap,
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    height: 118,
                    padding: const EdgeInsets.fromLTRB(6, 12, 6, 10),
                    decoration: _card(radius: 16),
                    child: Column(
                      children: [
                        _iconTile(actions[i].icon, actions[i].color, size: 44, radius: 14),
                        const Spacer(),
                        SizedBox(
                          height: 28,
                          child: Center(
                            child: Text(
                              actions[i].title,
                              maxLines: 2,
                              textAlign: TextAlign.center,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: _ink, height: 1.15),
                            ),
                          ),
                        ),
                        const SizedBox(height: 2),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            actions[i].sub,
                            style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w500, color: _slate),
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

  // ─── 5. Continue your practice ─────────────────────────────────────────────

  Widget _buildContinuePractice(List<Map<String, dynamic>> attempts) {
    final attempt = attempts.isNotEmpty ? attempts.first : null;
    final test = attempt?['tests'] as Map<String, dynamic>?;
    final testId = (attempt?['test_id'] ?? test?['id'] ?? '').toString();
    final total = (test?['total_questions'] as num?)?.toInt() ?? 0;
    final answered = (attempt?['_answered_count'] as num?)?.toInt() ?? 0;
    final progress = total > 0 ? (answered / total).clamp(0.0, 1.0) : 0.0;
    final examName = (test?['exams']?['title'] ?? test?['test_series']?['title'] ?? '').toString();
    final subjectName = (test?['subjects']?['name'] ?? '').toString();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(
          title: 'Continue Your Practice',
          actionLabel: attempt != null ? 'Resume' : null,
          onAction: attempt != null && testId.isNotEmpty
              ? () => context.push('/test-runner/$testId?attemptId=${attempt['id']}')
              : null,
        ),
        const SizedBox(height: 12),
        if (attempt == null || testId.isEmpty)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: _card(),
            child: Row(
              children: [
                _iconTile(Icons.play_circle_fill_rounded, _blue, size: 44, radius: 14),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'No practice in progress yet',
                        style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: _ink),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Start a test and pick it up right here.',
                        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: _slate),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                TextButton(
                  onPressed: () => _navigateToTab(2, '/practice'),
                  style: TextButton.styleFrom(
                    backgroundColor: const Color(0xFFEAF2FF),
                    foregroundColor: _blue,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Start', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          )
        else
          InkWell(
            onTap: () => context.push('/test-runner/$testId?attemptId=${attempt['id']}'),
            borderRadius: BorderRadius.circular(18),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: _card(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _iconTile(Icons.assignment_rounded, const Color(0xFF10B981), size: 44, radius: 14),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              (test?['title'] ?? 'Test in progress').toString(),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: _ink),
                            ),
                            if (examName.isNotEmpty || subjectName.isNotEmpty)
                              Text(
                                [subjectName, examName].where((s) => s.isNotEmpty).join(' • '),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: _slate),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      _arrowCircle(size: 30),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 6,
                      backgroundColor: const Color(0xFFE8EFFB),
                      valueColor: const AlwaysStoppedAnimation<Color>(_blue),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        total > 0 ? '$answered / $total questions attempted' : '$answered questions attempted',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _slate),
                      ),
                      const Spacer(),
                      if (total > 0)
                        Text(
                          '${(progress * 100).round()}%',
                          style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: _blue),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  // ─── 6. Your exams ─────────────────────────────────────────────────────────

  Widget _buildYourExams(List<ExamModel> exams) {
    final selected = _selectedExamTitles.map((t) => t.toLowerCase().trim()).toSet();
    bool isSelected(ExamModel e) => selected.contains(e.title.toLowerCase().trim());

    // Selected exams first, then the rest of the published catalogue.
    final ordered = [...exams.where(isSelected), ...exams.where((e) => !isSelected(e))];
    // Saved exams that are not in the catalogue response (offline) still show as cards.
    final catalogTitles = exams.map((e) => e.title.toLowerCase().trim()).toSet();
    final savedOnly = _selectedExamTitles.where((t) => !catalogTitles.contains(t.toLowerCase().trim()));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(
          title: 'Your Exams',
          subtitle: 'Choose an exam to start practicing',
          leading: _iconTile(Icons.workspace_premium_rounded, const Color(0xFFF59E0B), size: 34, radius: 10),
          actionLabel: 'Edit',
          onAction: _openExamPreferences,
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 158,
          child: ListView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            clipBehavior: Clip.none,
            children: [
              for (final title in savedOnly) ...[
                _examCard(title: title, selected: true, slug: null, bannerUrl: null, totalTests: null),
                const SizedBox(width: 10),
              ],
              for (final e in ordered) ...[
                _examCard(
                  title: e.title,
                  selected: isSelected(e),
                  slug: e.slug.isNotEmpty ? e.slug : e.id,
                  bannerUrl: e.bannerUrl,
                  totalTests: e.totalTests,
                ),
                const SizedBox(width: 10),
              ],
              _addExamCard(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _examCard({
    required String title,
    required bool selected,
    required String? slug,
    required String? bannerUrl,
    required int? totalTests,
  }) {
    final route = slug != null
        ? '/test-series?exam=${Uri.encodeComponent(slug)}&title=${Uri.encodeComponent(title)}'
        : '/test-series';
    return InkWell(
      onTap: () => context.push(route),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 118,
        padding: const EdgeInsets.all(6),
        decoration: _card(radius: 16).copyWith(
          border: Border.all(color: selected ? _blue.withValues(alpha: 0.5) : _border, width: selected ? 1.5 : 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Container(
                  height: 76,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF2FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: PkAdminImage(
                    imageUrl: bannerUrl,
                    fallbackExamTitle: title,
                    fallbackIcon: Icons.school_rounded,
                    fallbackColor: _blue,
                    width: double.infinity,
                    height: 76,
                    fit: BoxFit.cover,
                  ),
                ),
                if (selected)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: _blue,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: const Icon(Icons.check_rounded, size: 13, color: Colors.white),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: _ink, height: 1.15),
              ),
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.only(left: 3, bottom: 2),
              child: Row(
                children: [
                  const Icon(Icons.description_outlined, size: 13, color: _blue),
                  const SizedBox(width: 3),
                  Expanded(
                    child: Text(
                      totalTests != null && totalTests > 0 ? '$totalTests Tests' : 'View tests',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: _blue),
                    ),
                  ),
                  _arrowCircle(size: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _addExamCard() {
    return InkWell(
      onTap: _openExamPreferences,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 118,
        decoration: BoxDecoration(
          color: const Color(0xFFEAF2FF),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _blue.withValues(alpha: 0.35)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: const Icon(Icons.add_rounded, color: _blue, size: 24),
            ),
            const SizedBox(height: 8),
            const Text('Add Exam', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: _blue)),
          ],
        ),
      ),
    );
  }

  // ─── 7. Popular test series ────────────────────────────────────────────────

  Widget _buildPopularSeries(AsyncValue<List<TestSeriesModel>> seriesAsync) {
    final series = seriesAsync.asData?.value ?? const <TestSeriesModel>[];
    final shown = series.take(4).toList();
    // Only badge "Popular" when the admin flag distinguishes it from the rest.
    final badgeMeaningful = series.any((s) => !s.isPopular);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(
          title: 'Popular Test Series',
          subtitle: 'Most attempted and recommended',
          leading: _iconTile(Icons.local_fire_department_rounded, const Color(0xFFF97316), size: 34, radius: 10),
          actionLabel: 'View All',
          onAction: () => _navigateToTab(1, '/test-series'),
        ),
        const SizedBox(height: 12),
        if (seriesAsync.isLoading && shown.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 18),
            child: Center(child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: _blue))),
          )
        else if (shown.isEmpty)
          _emptyNote('Test series will appear here once they are published.', icon: Icons.library_books_outlined)
        else
          for (var i = 0; i < shown.length; i++) ...[
            if (i > 0) const SizedBox(height: 10),
            _seriesCard(shown[i], showBadge: badgeMeaningful && shown[i].isPopular),
          ],
      ],
    );
  }

  Widget _seriesCard(TestSeriesModel s, {required bool showBadge}) {
    final subtitle = (s.description?.trim().isNotEmpty ?? false) ? s.description!.trim() : (s.examTitle ?? 'Complete Test Series');
    return InkWell(
      onTap: () => context.push('/test-series/${s.id}'),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: _card(),
        child: Row(
          children: [
            Stack(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF2FF),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: PkAdminImage(
                    imageUrl: s.iconUrl,
                    fallbackExamTitle: s.examTitle ?? s.title,
                    fallbackIcon: Icons.library_books_rounded,
                    fallbackColor: _blue,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                  ),
                ),
                if (showBadge)
                  Positioned(
                    top: 6,
                    left: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF16A34A),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Popular',
                        style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    s.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: _ink, letterSpacing: -0.2),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: _slate),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.description_outlined, size: 14, color: _slate),
                      const SizedBox(width: 4),
                      Text(
                        '${s.testCount} Tests',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF334155)),
                      ),
                      const SizedBox(width: 10),
                      if (s.isPremium) ...[
                        const Icon(Icons.lock_rounded, size: 13, color: Color(0xFFD97706)),
                        const SizedBox(width: 3),
                        const Text('Paid', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFD97706))),
                      ] else ...[
                        const Icon(Icons.verified_rounded, size: 13, color: Color(0xFF16A34A)),
                        const SizedBox(width: 3),
                        const Text('Free', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF16A34A))),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: _ink, size: 24),
          ],
        ),
      ),
    );
  }

  // ─── 8. Your progress ──────────────────────────────────────────────────────

  Widget _buildProgress(_HomeStats stats) {
    final items = [
      (icon: Icons.description_rounded, color: _blue, value: '${stats.attempted}', label: 'Tests\nAttempted', valueColor: _ink),
      (icon: Icons.track_changes_rounded, color: const Color(0xFF10B981), value: stats.accuracy == null ? '–' : '${stats.accuracy}%', label: 'Accuracy', valueColor: const Color(0xFF10B981)),
      (icon: Icons.menu_book_rounded, color: const Color(0xFF8B5CF6), value: '${stats.questionsSolved}', label: 'Questions\nSolved', valueColor: _ink),
      (icon: Icons.local_fire_department_rounded, color: const Color(0xFFF97316), value: '${stats.streakDays}', label: 'Days\nStreak', valueColor: const Color(0xFFF97316)),
    ];

    return Container(
      decoration: _card(),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 10, 10),
            child: _sectionHeader(
              title: 'Your Progress',
              leading: _iconTile(Icons.bar_chart_rounded, const Color(0xFF10B981), size: 32, radius: 10),
              actionLabel: 'View Details',
              onAction: () => _navigateToTab(3, '/results'),
            ),
          ),
          const Divider(height: 1, color: _border),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 14),
            child: Row(
              children: [
                for (var i = 0; i < items.length; i++) ...[
                  if (i > 0) Container(width: 1, height: 44, color: _border),
                  Expanded(
                    child: Column(
                      children: [
                        _iconTile(items[i].icon, items[i].color, size: 34, radius: 10),
                        const SizedBox(height: 6),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            items[i].value,
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: items[i].valueColor),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          items[i].label,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: _slate, height: 1.15),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (stats.attempted == 0)
            const Padding(
              padding: EdgeInsets.fromLTRB(14, 0, 14, 12),
              child: Text(
                'Complete your first test to start tracking progress.',
                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: _slate),
              ),
            ),
        ],
      ),
    );
  }

  // ─── 9. Keep going banner ──────────────────────────────────────────────────

  Widget _buildKeepGoingBanner() {
    return Container(
      constraints: const BoxConstraints(minHeight: 150),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(
          colors: [Color(0xFFE6F8EF), Color(0xFFDDEDFF), Color(0xFFD9E7FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: const Color(0xFFCFE3FF)),
      ),
      child: Stack(
        children: [
          Positioned(right: 110, top: 12, child: _sparkle(12, const Color(0xFFFFC53D))),
          Positioned(right: 16, top: 12, child: _sparkle(9, const Color(0xFF1A6DFF))),
          Positioned(
            right: 10,
            bottom: 0,
            child: Image.asset(
              'assets/images/nimo_ready.png',
              height: 128,
              fit: BoxFit.contain,
              filterQuality: FilterQuality.medium,
              errorBuilder: (_, _, _) => const SizedBox.shrink(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 150, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Keep Going!',
                  style: TextStyle(fontSize: 19, fontWeight: FontWeight.w900, color: _ink, letterSpacing: -0.5),
                ),
                const SizedBox(height: 3),
                const Text(
                  'Consistent Practice Creates Big Results!',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF334155), height: 1.3),
                ),
                const SizedBox(height: 16),
                _heroButton('Practice Now', () => _navigateToTab(2, '/practice')),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── 10. Featured for you ──────────────────────────────────────────────────

  Widget _buildFeatured() {
    Widget tile({
      required String title,
      required String sub,
      required IconData icon,
      required Color bg,
      required Color accent,
      required VoidCallback onTap,
    }) {
      return Expanded(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            height: 128,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: accent.withValues(alpha: 0.18)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(11)),
                      child: Icon(icon, color: accent, size: 20),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: _ink),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  sub,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF475569), height: 1.3),
                ),
                const Spacer(),
                Align(alignment: Alignment.bottomRight, child: _arrowCircle(color: accent, size: 26)),
              ],
            ),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(
          title: 'Featured for You',
          leading: _iconTile(Icons.star_rounded, const Color(0xFFF59E0B), size: 34, radius: 10),
          actionLabel: 'View All',
          onAction: () => _navigateToTab(2, '/practice'),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            tile(
              title: 'Audio Book',
              sub: 'Listen & learn anywhere, anytime',
              icon: Icons.headphones_rounded,
              bg: const Color(0xFFFFF4D6),
              accent: const Color(0xFFF59E0B),
              onTap: () => context.push('/audio-books'),
            ),
            const SizedBox(width: 10),
            tile(
              title: 'Topic Tests',
              sub: 'Important topics for all exams',
              icon: Icons.psychology_rounded,
              bg: const Color(0xFFEEE9FF),
              accent: const Color(0xFF8B5CF6),
              onTap: () => _navigateToTab(2, '/practice'),
            ),
          ],
        ),
      ],
    );
  }

  // ─── 11. Recently added tests ──────────────────────────────────────────────

  Widget _buildRecentTests(AsyncValue<List<MockTestModel>> recentAsync) {
    final tests = recentAsync.asData?.value ?? const <MockTestModel>[];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(
          title: 'Recently Added Tests',
          leading: _iconTile(Icons.schedule_rounded, _blue, size: 34, radius: 10),
          actionLabel: 'View All',
          onAction: () => _navigateToTab(1, '/test-series'),
        ),
        const SizedBox(height: 12),
        if (recentAsync.isLoading && tests.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 18),
            child: Center(child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: _blue))),
          )
        else if (tests.isEmpty)
          _emptyNote('New tests will appear here as soon as they are published.', icon: Icons.new_releases_outlined)
        else
          Container(
            decoration: _card(),
            child: Column(
              children: [
                for (var i = 0; i < tests.length; i++) ...[
                  if (i > 0) const Divider(height: 1, indent: 66, endIndent: 14, color: _border),
                  _testRow(tests[i]),
                ],
              ],
            ),
          ),
      ],
    );
  }

  Widget _testRow(MockTestModel t) {
    final isFullMock = t.testType == 'full_mock' || t.testType == 'pyq';
    final color = isFullMock ? _blue : const Color(0xFF10B981);
    final source = [t.examTitle, t.subjectName, t.testSeriesTitle]
        .whereType<String>()
        .where((s) => s.trim().isNotEmpty)
        .toList();
    final marks = t.totalMarks == t.totalMarks.roundToDouble()
        ? '${t.totalMarks.toInt()}'
        : t.totalMarks.toStringAsFixed(1);
    final meta = [
      '${t.totalQuestions} Qs',
      '${t.durationMinutes} Mins',
      if (t.totalMarks > 0) '$marks Marks',
    ];
    return InkWell(
      onTap: () => context.push('/test-details/${t.id}?title=${Uri.encodeComponent(t.title)}&isPro=${t.isPremium}'),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            _iconTile(isFullMock ? Icons.description_rounded : Icons.list_alt_rounded, color, size: 42, radius: 13),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: _ink),
                  ),
                  if (source.isNotEmpty)
                    Text(
                      source.first,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: _slate),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    meta.join('  •  '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: _muted),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: t.isPremium ? const Color(0xFFFFF4D6) : const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    t.isPremium ? 'PAID' : 'FREE',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: t.isPremium ? const Color(0xFFD97706) : const Color(0xFF16A34A),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Icon(
                  t.isPremium ? Icons.lock_rounded : Icons.chevron_right_rounded,
                  size: 20,
                  color: t.isPremium ? const Color(0xFFD97706) : _ink,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─── 12. Recommended for you ───────────────────────────────────────────────

  Widget _buildRecommended() {
    // Reuse the Practice tab's subject catalogue so links land on real topic lists.
    const preferred = ['reasoning', 'science', 'history', 'geography'];
    final all = PracticeRepository.defaultSubjects;
    final picked = <PracticeSubject>[
      for (final id in preferred)
        for (final s in all)
          if (s.id == id) s,
    ];
    for (final s in all) {
      if (picked.length >= 4) break;
      if (!picked.contains(s)) picked.add(s);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(
          title: 'Recommended for You',
          leading: _iconTile(Icons.bolt_rounded, _blue, size: 34, radius: 10),
          actionLabel: 'View All',
          onAction: () => _navigateToTab(2, '/practice'),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 128,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            clipBehavior: Clip.none,
            itemCount: picked.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final s = picked[i];
              return InkWell(
                onTap: () => context.push('/practice/topics/${s.id}'),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: 112,
                  padding: const EdgeInsets.fromLTRB(10, 12, 10, 10),
                  decoration: BoxDecoration(
                    color: s.bg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: s.color.withValues(alpha: 0.18)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                        child: Icon(s.icon, color: s.color, size: 22),
                      ),
                      const Spacer(),
                      Text(
                        s.nameEnglish,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: _ink, height: 1.15),
                      ),
                      const Text(
                        'Topic Tests',
                        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: _slate),
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

  // ─── 13. Keep showing up ───────────────────────────────────────────────────

  Widget _buildKeepShowingUp() {
    return InkWell(
      onTap: () => context.push('/leaderboard'),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFEAF2FF),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFCFE3FF)),
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
              child: const Icon(Icons.event_available_rounded, color: _blue, size: 26),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Keep Showing Up!',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: _ink, letterSpacing: -0.3),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Every practice session counts. Consistent effort leads to real results.',
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: Color(0xFF475569), height: 1.3),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _arrowCircle(size: 32),
          ],
        ),
      ),
    );
  }
}

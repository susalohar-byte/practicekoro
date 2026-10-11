import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/pk_ui.dart';
import '../../core/utils/image_url_helper.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/repositories/practice_repository.dart';

/// Completed attempts from the server for the signed-in student (empty when offline
/// or signed out); merged with locally saved attempts for the progress summary.
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

/// Progress summary derived from completed attempts.
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
  String _userName = '';
  List<String> _selectedExamTitles = const [];

  @override
  void initState() {
    super.initState();
    _loadUserMeta();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) ref.read(catalogRepositoryProvider).setupRealtimeListeners(ref);
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

  Future<void> _manageExams() async {
    await context.push('/edit-profile');
    if (mounted) _loadUserMeta();
  }

  Future<void> _refresh() async {
    ref.invalidate(examsProvider);
    ref.invalidate(popularTestSeriesProvider);
    ref.invalidate(inProgressAttemptsProvider);
    ref.invalidate(completedAttemptsProvider);
    await _loadUserMeta();
  }

  String get _timeGreeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final exams = ref.watch(examsProvider).asData?.value ?? const <ExamModel>[];
    final seriesAsync = ref.watch(popularTestSeriesProvider);
    final inProgress =
        ref.watch(inProgressAttemptsProvider).asData?.value ?? const <Map<String, dynamic>>[];
    final serverAttempts =
        ref.watch(completedAttemptsProvider).asData?.value ?? const <TestAttemptModel>[];

    final attemptsById = <String, TestAttemptModel>{
      for (final a in LocalStorageService.getAttempts()) a.id: a,
      for (final a in serverAttempts) a.id: a,
    };
    final stats = _HomeStats.fromAttempts(attemptsById.values);

    return Scaffold(
      backgroundColor: PK.canvas,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: _refresh,
          color: PK.blue,
          child: ListView(
            padding: PKBottomSpacing.edgeInsets(context, horizontal: PK.gutter, top: 8),
            children: [
              _buildHeader(),
              const SizedBox(height: 16),
              _buildWelcome(),
              const SizedBox(height: 20),
              _buildQuickActions(),
              const SizedBox(height: 24),
              _buildContinue(inProgress),
              const SizedBox(height: 24),
              _buildYourExams(exams),
              const SizedBox(height: 24),
              _buildPopularSeries(seriesAsync),
              const SizedBox(height: 24),
              _buildTopics(),
              const SizedBox(height: 24),
              _buildProgress(stats),
            ],
          ),
        ),
      ),
    );
  }

  // ─── A. Header ─────────────────────────────────────────────────────────────

  Widget _buildHeader() {
    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.asset(
            'assets/images/logo-circle.png',
            width: 40,
            height: 40,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => Container(
              width: 40,
              height: 40,
              color: PK.blue,
              child: const Icon(Icons.school_rounded, color: Colors.white, size: 20),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _timeGreeting,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: PK.textMuted),
              ),
              Text(
                _userName.isNotEmpty ? _userName : 'Welcome to PracticeKoro',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: PK.text, letterSpacing: -0.3),
              ),
            ],
          ),
        ),
        _headerButton(Icons.search_rounded, 'Search test series', () => _navigateToTab(1, '/test-series')),
        const SizedBox(width: 8),
        _headerButton(Icons.notifications_none_rounded, 'Notifications', () => context.push('/notifications')),
      ],
    );
  }

  Widget _headerButton(IconData icon, String tooltip, VoidCallback onTap) {
    return Material(
      color: PK.card,
      shape: const CircleBorder(side: BorderSide(color: PK.border)),
      child: IconButton(
        tooltip: tooltip,
        onPressed: onTap,
        constraints: const BoxConstraints.tightFor(width: 42, height: 42),
        icon: Icon(icon, size: 21, color: PK.text),
      ),
    );
  }

  // ─── B. Welcome banner ─────────────────────────────────────────────────────

  Widget _buildWelcome() {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFFEDF3FF), Color(0xFFDCE8FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: const Color(0xFFD5E3FF)),
      ),
      child: Stack(
        children: [
          Positioned(
            right: 0,
            bottom: 0,
            top: 18,
            child: Image.asset(
              'assets/images/home_hero_nimo.png',
              fit: BoxFit.fitHeight,
              alignment: Alignment.bottomRight,
              filterQuality: FilterQuality.medium,
              errorBuilder: (_, _, _) => const SizedBox.shrink(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 120, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ready for today’s practice?',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: PK.blue),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Practice Today.\nImprove Every Day.',
                  style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: PK.navy, height: 1.2, letterSpacing: -0.4),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Build confidence with consistent practice.',
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500, color: Color(0xFF475569), height: 1.35),
                ),
                const SizedBox(height: 14),
                FilledButton(
                  onPressed: () => _navigateToTab(2, '/practice'),
                  style: FilledButton.styleFrom(
                    backgroundColor: PK.blue,
                    minimumSize: const Size(0, 42),
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text('Start Practicing', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── C. Quick actions ──────────────────────────────────────────────────────

  Widget _buildQuickActions() {
    final actions = [
      (label: 'Topic Test', icon: Icons.track_changes_rounded, onTap: () => _navigateToTab(2, '/practice')),
      (label: 'Test Series', icon: Icons.library_books_rounded, onTap: () => _navigateToTab(1, '/test-series')),
      (label: 'Rank', icon: Icons.emoji_events_rounded, onTap: () => context.push('/leaderboard')),
      (label: 'Saved Questions', icon: Icons.bookmark_rounded, onTap: () => context.push('/saved-questions')),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
      decoration: PK.cardBox(),
      child: Row(
        children: [
          for (final a in actions)
            Expanded(
              child: InkWell(
                onTap: a.onTap,
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
                  child: Column(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(color: PK.blueSoft, borderRadius: BorderRadius.circular(14)),
                        child: Icon(a.icon, color: PK.blue, size: 22),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: MediaQuery.textScalerOf(context).scale(30),
                        child: Text(
                          a.label,
                          maxLines: 2,
                          textAlign: TextAlign.center,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: PK.text, height: 1.2),
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

  // ─── D. Continue your practice ─────────────────────────────────────────────

  Widget _buildContinue(List<Map<String, dynamic>> attempts) {
    final attempt = attempts.isNotEmpty ? attempts.first : null;
    final test = attempt?['tests'] as Map<String, dynamic>?;
    final testId = (attempt?['test_id'] ?? test?['id'] ?? '').toString();

    if (attempt == null || testId.isEmpty) {
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

    final total = (test?['total_questions'] as num?)?.toInt() ?? 0;
    final answered = (attempt['_answered_count'] as num?)?.toInt() ?? 0;
    final progress = total > 0 ? (answered / total).clamp(0.0, 1.0) : 0.0;
    final subtitle = [
      (test?['subjects']?['name'] ?? '').toString(),
      (test?['exams']?['title'] ?? test?['test_series']?['title'] ?? '').toString(),
    ].where((s) => s.isNotEmpty).join(' • ');
    void resume() => context.push('/test-runner/$testId?attemptId=${attempt['id']}');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const PKSectionTitle(title: 'Continue Your Practice'),
        const SizedBox(height: 10),
        InkWell(
          onTap: resume,
          borderRadius: BorderRadius.circular(PK.radius),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: PK.cardBox(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(color: PK.blueSoft, borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.assignment_rounded, color: PK.blue, size: 21),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            (test?['title'] ?? 'Test in progress').toString(),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: PK.text),
                          ),
                          if (subtitle.isNotEmpty)
                            Text(
                              subtitle,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, color: PK.textMuted),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: resume,
                      style: FilledButton.styleFrom(
                        backgroundColor: PK.blue,
                        minimumSize: const Size(0, 36),
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Continue', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
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
                    valueColor: const AlwaysStoppedAnimation<Color>(PK.blue),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  total > 0 ? '$answered of $total questions attempted' : '$answered questions attempted',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: PK.textMuted),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ─── E. Your exams ─────────────────────────────────────────────────────────

  Widget _buildYourExams(List<ExamModel> exams) {
    final byTitle = {for (final e in exams) e.title.toLowerCase().trim(): e};
    final selected = [
      for (final title in _selectedExamTitles) (title: title, exam: byTitle[title.toLowerCase().trim()]),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PKSectionTitle(
          title: 'Your Exams',
          subtitle: selected.isEmpty ? 'Choose the exams you are preparing for' : null,
          actionLabel: 'Manage',
          onAction: _manageExams,
        ),
        const SizedBox(height: 10),
        SizedBox(
          // Grows with the system text size so two-line exam names never clip.
          height: 112 + (MediaQuery.textScalerOf(context).scale(100) / 100 - 1).clamp(0.0, 1.0) * 36,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            clipBehavior: Clip.none,
            itemCount: selected.length + 1,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              if (i == selected.length) return _addExamCard();
              return _examCard(selected[i].title, selected[i].exam);
            },
          ),
        ),
      ],
    );
  }

  Widget _examCard(String title, ExamModel? exam) {
    final slug = exam == null ? null : (exam.slug.isNotEmpty ? exam.slug : exam.id);
    return InkWell(
      onTap: () => context.push(
        slug != null
            ? '/test-series?exam=${Uri.encodeComponent(slug)}&title=${Uri.encodeComponent(title)}'
            : '/test-series',
      ),
      borderRadius: BorderRadius.circular(PK.radius),
      child: Container(
        width: 112,
        padding: const EdgeInsets.all(12),
        decoration: PK.cardBox(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: PK.canvas, borderRadius: BorderRadius.circular(12)),
                  child: PkAdminImage(
                    imageUrl: exam?.bannerUrl,
                    fallbackExamTitle: title,
                    fallbackIcon: Icons.school_rounded,
                    fallbackColor: PK.blue,
                    width: 32,
                    height: 32,
                    fit: BoxFit.contain,
                  ),
                ),
                const Spacer(),
                const Icon(Icons.check_circle_rounded, size: 18, color: PK.blue),
              ],
            ),
            const Spacer(),
            Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: PK.text, height: 1.2),
            ),
          ],
        ),
      ),
    );
  }

  Widget _addExamCard() {
    return InkWell(
      onTap: _manageExams,
      borderRadius: BorderRadius.circular(PK.radius),
      child: Container(
        width: 112,
        decoration: BoxDecoration(
          color: PK.card,
          borderRadius: BorderRadius.circular(PK.radius),
          border: Border.all(color: PK.blue.withValues(alpha: 0.35)),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_circle_outline_rounded, color: PK.blue, size: 26),
            SizedBox(height: 6),
            Text('Add Exam', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: PK.blue)),
          ],
        ),
      ),
    );
  }

  // ─── F. Popular test series ────────────────────────────────────────────────

  Widget _buildPopularSeries(AsyncValue<List<TestSeriesModel>> seriesAsync) {
    final series = seriesAsync.asData?.value ?? const <TestSeriesModel>[];
    // "Popular" is only a meaningful label when the admin flag distinguishes series.
    final badgeMeaningful = series.any((s) => s.isPopular) && series.any((s) => !s.isPopular);
    final cardWidth = ((MediaQuery.sizeOf(context).width - PK.gutter * 2) * 0.86).clamp(250.0, 340.0);
    final textScale = MediaQuery.textScalerOf(context).scale(100) / 100;
    final carouselHeight = 120 + (textScale - 1).clamp(0.0, 1.0) * 40;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PKSectionTitle(
          title: 'Popular Test Series',
          subtitle: 'Exam-pattern mocks, topic tests and PYQs',
          actionLabel: 'View All',
          onAction: () => _navigateToTab(1, '/test-series'),
        ),
        const SizedBox(height: 10),
        if (seriesAsync.isLoading && series.isEmpty)
          SizedBox(
            height: carouselHeight,
            child: const Center(
              child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: PK.blue)),
            ),
          )
        else if (series.isEmpty)
          const PKEmptyCard(
            icon: Icons.library_books_outlined,
            title: 'No test series yet',
            message: 'Published test series will appear here.',
          )
        else
          SizedBox(
            height: carouselHeight,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              clipBehavior: Clip.none,
              itemCount: series.length.clamp(0, 8),
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, i) => _seriesCard(
                series[i],
                width: cardWidth,
                showBadge: badgeMeaningful && series[i].isPopular,
              ),
            ),
          ),
      ],
    );
  }

  Widget _seriesCard(TestSeriesModel s, {required double width, required bool showBadge}) {
    final label = PK.seriesLabel(s.title, s.description, s.examTitle);
    return InkWell(
      onTap: () => context.push('/test-series/${s.id}'),
      borderRadius: BorderRadius.circular(PK.radius),
      child: Container(
        width: width,
        padding: const EdgeInsets.all(10),
        decoration: PK.cardBox(),
        child: Row(
          children: [
            PKSeriesArt(
              title: s.title,
              examTitle: s.examTitle,
              slug: s.slug,
              imageUrl: s.bannerUrl ?? s.iconUrl,
              width: 96,
              height: 96,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (showBadge) ...[
                    const PKBadge('POPULAR', tone: PKBadgeTone.popular),
                    const SizedBox(height: 4),
                  ],
                  Text(
                    s.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: PK.text, letterSpacing: -0.2),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, color: PK.textMuted),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Flexible(
                        child: PKMeta(Icons.description_outlined, '${s.testCount} ${s.testCount == 1 ? 'Test' : 'Tests'}'),
                      ),
                      if (s.questionCount > 0) ...[
                        const SizedBox(width: 10),
                        Flexible(child: PKMeta(Icons.help_outline_rounded, '${PK.formatCount(s.questionCount)} Qs')),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: PK.textFaint, size: 22),
          ],
        ),
      ),
    );
  }

  // ─── G. Practice by topic ──────────────────────────────────────────────────

  Widget _buildTopics() {
    // Same subject catalogue as the Practice tab, so every link opens a real topic list.
    const preferred = ['reasoning', 'math', 'science', 'history'];
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
        PKSectionTitle(
          title: 'Practice by Topic',
          subtitle: 'Chapter-wise tests for daily practice',
          actionLabel: 'View All',
          onAction: () => _navigateToTab(2, '/practice'),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: PK.cardBox(),
          child: Column(
            children: [
              for (var i = 0; i < picked.length; i++) ...[
                if (i > 0) const Divider(height: 1, indent: 62, color: PK.border),
                InkWell(
                  onTap: () => context.push('/practice/subject/${picked[i].id}'),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(color: PK.blueSoft, borderRadius: BorderRadius.circular(10)),
                          child: Icon(picked[i].icon, color: PK.blue, size: 19),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            picked[i].nameEnglish,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: PK.text),
                          ),
                        ),
                        const Text(
                          'Topic tests',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: PK.textMuted),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.chevron_right_rounded, color: PK.textFaint, size: 20),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  // ─── H. Progress summary ───────────────────────────────────────────────────

  Widget _buildProgress(_HomeStats stats) {
    final metrics = [
      ('${stats.attempted}', 'Tests\nAttempted'),
      (stats.accuracy == null ? '–' : '${stats.accuracy}%', 'Accuracy'),
      (PK.formatCount(stats.questionsSolved), 'Questions\nSolved'),
      ('${stats.streakDays}', 'Days\nStreak'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PKSectionTitle(
          title: 'Your Progress',
          subtitle: stats.attempted == 0 ? 'Complete a test to start tracking' : null,
          actionLabel: 'View Results',
          onAction: () => _navigateToTab(3, '/results'),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
          decoration: PK.cardBox(),
          child: Row(
            children: [
              for (var i = 0; i < metrics.length; i++) ...[
                if (i > 0) Container(width: 1, height: 36, color: PK.border),
                Expanded(
                  child: Column(
                    children: [
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          metrics[i].$1,
                          style: TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: i == 1 && stats.accuracy != null ? PK.blue : PK.text,
                          ),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        metrics[i].$2,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: PK.textMuted, height: 1.2),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

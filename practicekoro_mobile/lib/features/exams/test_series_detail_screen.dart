import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/utils/image_url_helper.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/test_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/repositories/catalog_repository.dart';

/// Test Series Details (Screen 2) and the series' Test List (Screen 3).
///
/// Screen 2: hero artwork with Back & Favorite, title + "Complete Test Series",
/// statistics card (real counts), feature highlights, "Start Test Series" button and
/// Overview | Tests (n) | Syllabus | FAQ tabs.
/// Screen 3: filter chips (All Tests, Full Mock, Topic Test, PYQ) and test cards with
/// a dedicated action area, so "Start Test" never overlaps the card content.
/// Access rules reuse the existing Free/Paid + PRO subscription logic.
class TestSeriesDetailScreen extends ConsumerStatefulWidget {
  final String seriesId;

  const TestSeriesDetailScreen({super.key, required this.seriesId});

  @override
  ConsumerState<TestSeriesDetailScreen> createState() => _TestSeriesDetailScreenState();
}

class _TestSeriesDetailScreenState extends ConsumerState<TestSeriesDetailScreen> {
  static const Color _ink = Color(0xFF0F172A);
  static const Color _slate = Color(0xFF64748B);
  static const Color _blue = Color(0xFF026BFC);
  static const Color _border = Color(0xFFE2E8F0);

  TestSeriesModel? _series;
  List<MockTestModel> _tests = [];
  bool _isLoading = true;
  String? _loadError;
  bool _isFavorite = false;
  int _selectedTabIndex = 0; // 0: Overview, 1: Tests (Screen 3), 2: Syllabus, 3: FAQ
  int _selectedTestFilterIndex = 0; // 0: All Tests, 1: Full Mock, 2: Topic Test, 3: PYQ

  static const List<String> _testFilters = ['All Tests', 'Full Mock', 'Topic Test', 'PYQ'];

  @override
  void initState() {
    super.initState();
    _loadSeriesData();
  }

  Future<void> _loadSeriesData() async {
    setState(() {
      _isLoading = true;
      _loadError = null;
    });
    final repository = ref.read(catalogRepositoryProvider);
    try {
      final series = await repository.getTestSeriesById(widget.seriesId);
      final tests = series == null ? <MockTestModel>[] : await repository.getTestsForSeries(widget.seriesId);
      if (!mounted) return;
      setState(() {
        _series = series;
        _tests = tests;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadError = 'This test series could not be loaded. Check your connection and try again.';
        _isLoading = false;
      });
    }
  }

  // ─── Derived data ──────────────────────────────────────────────────────────

  String get _title => _series?.title ?? 'Test Series';

  int get _testTotal => _tests.isNotEmpty ? _tests.length : (_series?.testCount ?? 0);

  int get _questionTotal => _tests.isNotEmpty
      ? _tests.fold<int>(0, (sum, t) => sum + t.totalQuestions)
      : (_series?.questionCount ?? 0);

  int get _fullMockCount =>
      _tests.isNotEmpty ? _tests.where((t) => _categoryOf(t) == 'Full Mock').length : (_series?.fullMockCount ?? 0);
  int get _topicTestCount =>
      _tests.isNotEmpty ? _tests.where((t) => _categoryOf(t) == 'Topic Test').length : (_series?.topicTestCount ?? 0);
  int get _pyqCount =>
      _tests.isNotEmpty ? _tests.where((t) => _categoryOf(t) == 'PYQ').length : (_series?.pyqTestCount ?? 0);

  bool get _isPro => LocalStorageService.isProUser();

  static String _categoryOf(MockTestModel t) => switch (t.testType) {
        'full_mock' => 'Full Mock',
        'pyq' => 'PYQ',
        _ => 'Topic Test',
      };

  static String _formatCount(int n) =>
      n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]},');

  /// Bundled exam artwork for the hero, matched strictly per exam (each image has
  /// that exam's name baked in), plus the colour that continues it behind the status bar.
  ({String asset, Color strip}) _bannerFor(TestSeriesModel s) {
    final t = '${s.title} ${s.examTitle ?? ''} ${s.slug}'.toLowerCase();
    if (t.contains('wbssc')) {
      return (asset: 'assets/images/banner_series_wbssc_exact.png', strip: const Color(0xFFFCDDF0));
    }
    if ((t.contains('wbp') && !t.contains('wbpsc')) || t.contains('west bengal police')) {
      return (asset: 'assets/images/banner_series_wbp_exact.png', strip: const Color(0xFFA9D5FD));
    }
    if (RegExp(r'\bkp\b').hasMatch(t) || t.contains('kolkata police')) {
      return (asset: 'assets/images/banner_series_kp_exact.png', strip: const Color(0xFFECE8FD));
    }
    if (t.contains('ntpc') || t.contains('railway') || t.contains('rrb')) {
      return (asset: 'assets/images/banner_series_railway_exact.png', strip: const Color(0xFFFDE4A5));
    }
    if (t.contains('ssc gd') || t.contains('ssc-gd')) {
      return (asset: 'assets/images/banner_series_ssc_exact.png', strip: const Color(0xFFCBFAF0));
    }
    return (asset: 'assets/images/exams/test_series_hero_banner.png', strip: const Color(0xFFFCF4E2));
  }

  void _toggleFavorite() {
    setState(() => _isFavorite = !_isFavorite);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: const Duration(milliseconds: 1400),
        content: Text(_isFavorite ? '$_title added to favorites!' : '$_title removed from favorites'),
      ),
    );
  }

  void _goBack() {
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    } else {
      context.go('/test-series');
    }
  }

  void _openTestList() {
    setState(() {
      _selectedTabIndex = 1;
      _selectedTestFilterIndex = 0;
    });
  }

  void _startTest(MockTestModel t) {
    context.push('/test-details/${t.id}?title=${Uri.encodeComponent(t.title)}&isPro=${t.isPremium}');
  }

  void _handleLockedTestTap(String testTitle) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: _border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  width: 56,
                  height: 56,
                  decoration: const BoxDecoration(color: Color(0xFFFEF3C7), shape: BoxShape.circle),
                  child: const Icon(Icons.workspace_premium_rounded, size: 30, color: Color(0xFFD97706)),
                ),
                const SizedBox(height: 14),
                const Text(
                  'PracticeKoro PRO Required',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: _ink, letterSpacing: -0.3),
                ),
                const SizedBox(height: 8),
                Text(
                  '"$testTitle" is a premium test. Upgrade to PracticeKoro PRO to unlock all full mocks, topic tests, and official PYQs across all exams!',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13, color: _slate, height: 1.4),
                ),
                const SizedBox(height: 22),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      context.push('/subscription');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _blue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(23)),
                    ),
                    child: const Text('Upgrade to PRO', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                  ),
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text(
                    'Maybe Later',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _slate),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ─── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF8FAFC),
        body: Center(child: CircularProgressIndicator(color: _blue)),
      );
    }

    final series = _series;
    if (series == null) {
      return _buildUnavailable();
    }

    return PopScope(
      canPop: _selectedTabIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _selectedTabIndex != 0) {
          setState(() => _selectedTabIndex = 0);
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: _selectedTabIndex == 1 ? _buildTestsAppBar() : null,
        body: _selectedTabIndex == 1 ? _buildTestsBody() : _buildOverviewBody(series),
      ),
    );
  }

  Widget _buildUnavailable() {
    final isError = _loadError != null;
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: _ink),
          onPressed: _goBack,
        ),
        title: const Text('Test Series', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: _ink)),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isError ? Icons.cloud_off_rounded : Icons.search_off_rounded,
                size: 44,
                color: const Color(0xFF94A3B8),
              ),
              const SizedBox(height: 12),
              Text(
                isError ? 'Could not load this test series' : 'Test series not found',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: _ink),
              ),
              const SizedBox(height: 6),
              Text(
                _loadError ?? 'This series may have been unpublished or the link is out of date.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: _slate, height: 1.4),
              ),
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: isError ? _loadSeriesData : _goBack,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _blue,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(isError ? 'Retry' : 'Back to Test Series'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Screen 2: Overview ────────────────────────────────────────────────────

  Widget _buildOverviewBody(TestSeriesModel series) {
    final tabs = ['Overview', 'Tests ($_testTotal)', 'Syllabus', 'FAQ'];
    return ListView(
      padding: EdgeInsets.only(bottom: PKBottomSpacing.safeAreaOf(context)),
      children: [
        _buildHero(series),
        // White sheet overlapping the artwork's bottom edge
        Transform.translate(
          offset: const Offset(0, -20),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: const EdgeInsets.fromLTRB(16, 22, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  series.title,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: _ink, letterSpacing: -0.4),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Complete Test Series',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: _slate),
                ),
                const SizedBox(height: 16),
                _buildStatsCard(),
                const SizedBox(height: 14),
                _buildFeaturesCard(),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _openTestList,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _blue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Start Test Series', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward_rounded, size: 18),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                _buildSegmentedTabs(tabs),
                const SizedBox(height: 18),
                if (_selectedTabIndex == 2)
                  _buildSyllabusTab()
                else if (_selectedTabIndex == 3)
                  _buildFaqTab()
                else
                  _buildOverviewTab(series),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHero(TestSeriesModel series) {
    final banner = _bannerFor(series);
    final adminBanner = series.bannerUrl?.trim();
    final hasAdminBanner = adminBanner != null && adminBanner.isNotEmpty;

    Widget roundButton(IconData icon, VoidCallback onTap, {Color color = _ink}) {
      return Material(
        color: Colors.white,
        shape: const CircleBorder(),
        elevation: 2,
        shadowColor: Colors.black26,
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Icon(icon, color: color, size: 20),
          ),
        ),
      );
    }

    return Container(
      // The artwork's own top colour continues behind the status bar and buttons, so the
      // image is shown whole (no crop, no stretch) and the buttons never cover it.
      color: banner.strip,
      child: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  roundButton(Icons.arrow_back_rounded, _goBack),
                  roundButton(
                    _isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                    _toggleFavorite,
                    color: _isFavorite ? const Color(0xFFF43F5E) : _ink,
                  ),
                ],
              ),
            ),
          ),
          AspectRatio(
            aspectRatio: 303 / 185,
            child: hasAdminBanner
                ? SizedBox.expand(
                    child: PkAdminImage(
                      imageUrl: adminBanner,
                      fit: BoxFit.cover,
                      fallbackExamTitle: series.examTitle ?? series.title,
                    ),
                  )
                : Image.asset(
                    banner.asset,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        series.title,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                    ),
                  ),
          ),
          // Keeps the sheet's overlap from exposing the canvas colour.
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildStatsCard() {
    final (int thirdValue, String thirdLabel) = _topicTestCount > 0
        ? (_topicTestCount, 'Topic Tests')
        : _pyqCount > 0
            ? (_pyqCount, 'PYQs')
            : (_fullMockCount, 'Full Mocks');
    final stats = [
      (icon: Icons.article_outlined, value: '$_testTotal', label: 'Tests'),
      (icon: Icons.track_changes_rounded, value: _questionTotal > 0 ? _formatCount(_questionTotal) : '–', label: 'Questions'),
      (icon: Icons.assignment_outlined, value: '$thirdValue', label: thirdLabel),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _border),
      ),
      child: Row(
        children: [
          for (var i = 0; i < stats.length; i++) ...[
            if (i > 0) Container(width: 1, height: 40, color: _border),
            Expanded(
              child: Column(
                children: [
                  Icon(stats[i].icon, size: 20, color: _blue),
                  const SizedBox(height: 5),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      stats[i].value,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: _ink),
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    stats[i].label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _slate),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  /// Highlights limited to what this series actually contains.
  List<String> _featureLines() {
    return [
      'Based on the latest exam pattern',
      if (_fullMockCount > 0 && _topicTestCount > 0)
        'Chapter-wise & full-length tests'
      else if (_fullMockCount > 0)
        'Full-length mock tests'
      else if (_topicTestCount > 0)
        'Chapter-wise topic tests',
      if (_pyqCount > 0) 'Previous year question papers',
      'Detailed solutions & performance analysis',
    ];
  }

  Widget _buildFeaturesCard() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFD1FAE5)),
      ),
      child: Column(
        children: [
          for (final (i, line) in _featureLines().indexed) ...[
            if (i > 0) const SizedBox(height: 7),
            Row(
              children: [
                Container(
                  width: 16,
                  height: 16,
                  decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                  child: const Icon(Icons.check_rounded, size: 11, color: Colors.white),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    line,
                    style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSegmentedTabs(List<String> tabs) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: List.generate(tabs.length, (i) {
          final active = i == _selectedTabIndex;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () => i == 1 ? _openTestList() : setState(() => _selectedTabIndex = i),
              borderRadius: BorderRadius.circular(20),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: active ? _blue : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: active ? _blue : _border),
                ),
                child: Text(
                  tabs[i],
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                    color: active ? Colors.white : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildOverviewTab(TestSeriesModel series) {
    final description = (series.description?.trim().isNotEmpty ?? false)
        ? series.description!.trim()
        : 'A complete test series to help you prepare for ${series.examTitle ?? series.title} with exam-level questions, detailed solutions and performance analysis.';
    final included = [
      if (_fullMockCount > 0) 'Full-length mock tests',
      if (_topicTestCount > 0) 'Topic-wise tests',
      if (_pyqCount > 0) 'Previous year questions',
      'Detailed explanation for every question',
      'Real exam pattern & difficulty level',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('About This Series', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: _ink)),
        const SizedBox(height: 8),
        Text(
          description,
          style: const TextStyle(fontSize: 13, height: 1.5, color: Color(0xFF475569), fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 18),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFEFCE8),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFFEF08A)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("What's Included?", style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF854D0E))),
              const SizedBox(height: 12),
              for (final (i, line) in included.indexed) ...[
                if (i > 0) const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      width: 16,
                      height: 16,
                      decoration: const BoxDecoration(color: Color(0xFFEAB308), shape: BoxShape.circle),
                      child: const Icon(Icons.check_rounded, size: 11, color: Colors.white),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        line,
                        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: Color(0xFF713F12)),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSyllabusTab() {
    // Derived from the series' own topic tests; nothing is invented per exam.
    final groups = <String, int>{};
    for (final t in _tests) {
      if (_categoryOf(t) != 'Topic Test') continue;
      final name = (t.subjectName ?? t.chapterName ?? '').trim();
      if (name.isEmpty) continue;
      groups[name] = (groups[name] ?? 0) + 1;
    }

    if (groups.isEmpty) {
      return _noteCard(
        Icons.menu_book_outlined,
        _tests.isEmpty
            ? 'Syllabus details will appear once tests are published for this series.'
            : 'This series currently has no topic-wise tests. Full-length tests cover the complete exam syllabus.',
      );
    }

    final entries = groups.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Topics Covered', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: _ink)),
          const SizedBox(height: 4),
          const Text(
            'Based on the topic tests in this series',
            style: TextStyle(fontSize: 11.5, color: _slate, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 12),
          for (final e in entries)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFF10B981)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(e.key, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: _ink)),
                  ),
                  Text(
                    '${e.value} ${e.value == 1 ? 'test' : 'tests'}',
                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: _slate),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFaqTab() {
    final penalties = _tests.map((t) => t.negativeMarking).where((n) => n > 0).toSet().toList()..sort();
    final String negativeAnswer;
    if (_tests.isEmpty) {
      negativeAnswer = 'Negative marking, if any, is shown on each test\'s details page before you start.';
    } else if (penalties.isEmpty) {
      negativeAnswer = 'No. There is no negative marking in the tests of this series.';
    } else if (penalties.length == 1) {
      negativeAnswer = 'Yes. ${_trimNum(penalties.first)} mark is deducted for every wrong answer, matching the official pattern.';
    } else {
      negativeAnswer = 'Yes. Between ${_trimNum(penalties.first)} and ${_trimNum(penalties.last)} marks are deducted per wrong answer; each test shows its own rule before you start.';
    }

    final faqs = [
      ('Is negative marking applied?', negativeAnswer),
      ('Can I re-attempt a test after completion?', 'Yes. You can re-attempt any test to improve your speed and accuracy.'),
      ('When do I get solutions and my rank?', 'Right after you submit a test: detailed solutions, your score analysis and your rank are generated immediately.'),
      ('What does PAID mean?', 'PAID tests are part of PracticeKoro PRO. One PRO pass unlocks every paid test across all series.'),
    ];

    return Column(
      children: [
        for (final (q, a) in faqs)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: _border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(q, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: _ink)),
                  const SizedBox(height: 5),
                  Text(a, style: const TextStyle(fontSize: 12, color: _slate, height: 1.4)),
                ],
              ),
            ),
          ),
      ],
    );
  }

  static String _trimNum(double v) => v == v.roundToDouble() ? v.toInt().toString() : v.toString();

  Widget _noteCard(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 22, color: const Color(0xFF94A3B8)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500, color: _slate, height: 1.4)),
          ),
        ],
      ),
    );
  }

  // ─── Screen 3: Test list ───────────────────────────────────────────────────

  PreferredSizeWidget _buildTestsAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleSpacing: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded, color: _ink),
        onPressed: () => setState(() => _selectedTabIndex = 0),
      ),
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: _ink),
          ),
          Text(
            'Complete Test Series ($_testTotal ${_testTotal == 1 ? 'Test' : 'Tests'})',
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _slate),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: Icon(
            _isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            color: _isFavorite ? const Color(0xFFF43F5E) : _ink,
            size: 22,
          ),
          onPressed: _toggleFavorite,
        ),
        const SizedBox(width: 4),
      ],
    );
  }

  Widget _buildTestsBody() {
    final activeFilter = _testFilters[_selectedTestFilterIndex];
    final filtered = _tests.where((t) => activeFilter == 'All Tests' || _categoryOf(t) == activeFilter).toList();

    return ListView(
      padding: EdgeInsets.fromLTRB(16, 12, 16, PKBottomSpacing.safeAreaOf(context)),
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: [
              for (final (idx, name) in _testFilters.indexed) ...[
                if (idx > 0) const SizedBox(width: 8),
                _filterChip(
                  label: name == 'All Tests'
                      ? name
                      : '$name (${_tests.where((t) => _categoryOf(t) == name).length})',
                  selected: idx == _selectedTestFilterIndex,
                  onTap: () => setState(() => _selectedTestFilterIndex = idx),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 14),
        if (_tests.isEmpty)
          _noteCard(Icons.library_books_outlined, 'Tests for this series will appear here as soon as they are published.')
        else if (filtered.isEmpty)
          _noteCard(Icons.filter_alt_off_outlined, 'No ${activeFilter.toLowerCase()} tests in this series yet.')
        else
          for (final (i, t) in filtered.indexed) ...[
            if (i > 0) const SizedBox(height: 10),
            _buildTestCard(i + 1, t),
          ],
      ],
    );
  }

  Widget _filterChip({required String label, required bool selected, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 32,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? _blue : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: selected ? _blue : _border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
            color: selected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  Widget _buildTestCard(int index, MockTestModel t) {
    final isFree = !t.isPremium;
    final accessible = isFree || _isPro;
    final marks = _trimNum(t.totalMarks);

    Widget meta(IconData icon, String text) => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: _slate),
            const SizedBox(width: 3),
            Flexible(
              child: Text(
                text,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11, color: _slate, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        );

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
        boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 6, offset: Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: number, wrapping title, Free/Paid badge
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFDBEAFE)),
                ),
                alignment: Alignment.center,
                child: Text(
                  '$index',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: _blue),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 5),
                  child: Text(
                    t.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: _ink, height: 1.2),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                decoration: BoxDecoration(
                  color: isFree ? const Color(0xFFDCFCE7) : const Color(0xFFFFF4D6),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isFree ? Icons.verified_rounded : Icons.workspace_premium_rounded,
                      size: 12,
                      color: isFree ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                    ),
                    const SizedBox(width: 3),
                    Text(
                      isFree ? 'FREE' : 'PAID',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: isFree ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Row 2: metadata (wraps on narrow screens) + dedicated action area
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(width: 42),
              Expanded(
                child: Wrap(
                  spacing: 10,
                  runSpacing: 4,
                  children: [
                    meta(Icons.article_outlined, '${t.totalQuestions} Qs'),
                    meta(Icons.timer_outlined, '${t.durationMinutes} Mins'),
                    if (t.totalMarks > 0) meta(Icons.emoji_events_outlined, '$marks Marks'),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              if (accessible)
                SizedBox(
                  height: 34,
                  child: ElevatedButton(
                    onPressed: () => _startTest(t),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _blue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(17)),
                    ),
                    child: const FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('Start Test', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_forward_rounded, size: 14),
                        ],
                      ),
                    ),
                  ),
                )
              else
                InkWell(
                  onTap: () => _handleLockedTestTap(t.title),
                  borderRadius: BorderRadius.circular(17),
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                      border: Border.all(color: _border),
                    ),
                    child: const Icon(Icons.lock_outline_rounded, size: 16, color: Color(0xFF94A3B8)),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/test_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/repositories/catalog_repository.dart';

/// Test Series Details Screen
/// Exact 1:1 implementation based on the approved design reference.
/// Covers:
/// 1. Hero illustration banner with Back & Favorite toggle.
/// 2. Overlapping Card with Title, Subtitle, 4-Box Key Metrics, Green checkmark features.
/// 3. Segmented Navigation Tabs: Overview | Tests (X) | Syllabus | FAQ.
/// 4. Overview tab: "About This Series" & "What's Included?" (warm yellow card).
/// 5. Tests tab: Sub-filters (All Tests, Full Mock, Topic Test, PYQ) and test cards with
///    circular numbers, metrics, Free/Paid badges, Start Test buttons, and locked states.
/// 6. NO exam-specific subscription purchase flow, pricing, or subscription CTA.
class TestSeriesDetailScreen extends ConsumerStatefulWidget {
  final String seriesId;

  const TestSeriesDetailScreen({super.key, required this.seriesId});

  @override
  ConsumerState<TestSeriesDetailScreen> createState() =>
      _TestSeriesDetailScreenState();
}

class _TestSeriesDetailScreenState extends ConsumerState<TestSeriesDetailScreen> {
  TestSeriesModel? _series;
  List<MockTestModel> _tests = [];
  bool _isLoading = true;
  bool _isFavorite = false;
  int _selectedTabIndex = 0; // 0: Overview, 1: Tests, 2: Syllabus, 3: FAQ
  int _selectedTestFilterIndex = 0; // 0: All Tests, 1: Full Mock, 2: Topic Test, 3: PYQ

  @override
  void initState() {
    super.initState();
    _loadSeriesData();
  }

  Future<void> _loadSeriesData() async {
    setState(() => _isLoading = true);
    final repository = ref.read(catalogRepositoryProvider);
    try {
      final series = await repository.getTestSeriesById(widget.seriesId);
      final tests = await repository.getTestsForSeries(widget.seriesId);
      if (mounted) {
        setState(() {
          _series = series;
          _tests = tests;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _getSeriesTitle() {
    if (_series != null && _series!.title.isNotEmpty) return _series!.title;
    final id = widget.seriesId.toLowerCase();
    if (id.contains('wbp')) return 'WBP Constable';
    if (id.contains('group-c') || id.contains('group c')) return 'WBSSC Group C & D';
    if (id.contains('railway') || id.contains('ntpc')) return 'Railway NTPC';
    if (id.contains('ssc') || id.contains('cgl')) return 'SSC CGL';
    if (id.contains('food')) return 'Food SI';
    if (id.contains('kp')) return 'KP Constable';
    return 'WBP Constable';
  }

  String _getBannerAsset(String title) {
    final tLower = '$title ${widget.seriesId}'.toLowerCase();
    if (tLower.contains('wbp') || tLower.contains('police')) {
      return 'assets/images/banner_series_wbp_exact.png';
    } else if (tLower.contains('wbssc') || tLower.contains('group-c') || tLower.contains('group c')) {
      return 'assets/images/banner_series_wbssc_exact.png';
    } else if (tLower.contains('railway') || tLower.contains('ntpc')) {
      return 'assets/images/banner_series_railway_exact.png';
    } else if (tLower.contains('ssc')) {
      return 'assets/images/banner_series_ssc_exact.png';
    } else if (tLower.contains('kp')) {
      return 'assets/images/banner_series_kp_exact.png';
    }
    return 'assets/images/exams/test_series_hero_banner.png';
  }

  List<Map<String, dynamic>> _getCanonicalTestsList() {
    if (_tests.isNotEmpty) {
      return _tests.map((t) {
        final category = switch (t.testType) {
          'full_mock' => 'Full Mock',
          'pyq' => 'PYQ',
          _ => 'Topic Test',
        };
        return {
          'id': t.id,
          'title': t.title,
          'sub': '${t.totalQuestions} Qs   ${t.durationMinutes} Mins   ${t.totalMarks.toInt()} Marks',
          'category': category,
          'isFree': !t.isPremium,
          'totalQuestions': t.totalQuestions,
          'durationMinutes': t.durationMinutes,
          'totalMarks': t.totalMarks.toInt(),
        };
      }).toList();
    }

    return [
      {
        'id': '${widget.seriesId}-fmt-1',
        'title': 'Full Mock Test 1',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'Full Mock',
        'isFree': true,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-fmt-2',
        'title': 'Full Mock Test 2',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'Full Mock',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-fmt-3',
        'title': 'Full Mock Test 3',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'Full Mock',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-topic-1',
        'title': 'Topic Test – General Awareness',
        'sub': '25 Qs   25 Mins   25 Marks',
        'category': 'Topic Test',
        'isFree': true,
        'totalQuestions': 25,
        'durationMinutes': 25,
        'totalMarks': 25,
      },
      {
        'id': '${widget.seriesId}-topic-2',
        'title': 'Topic Test – Mathematics',
        'sub': '30 Qs   30 Mins   30 Marks',
        'category': 'Topic Test',
        'isFree': false,
        'totalQuestions': 30,
        'durationMinutes': 30,
        'totalMarks': 30,
      },
      {
        'id': '${widget.seriesId}-topic-3',
        'title': 'Topic Test – Reasoning',
        'sub': '30 Qs   30 Mins   30 Marks',
        'category': 'Topic Test',
        'isFree': false,
        'totalQuestions': 30,
        'durationMinutes': 30,
        'totalMarks': 30,
      },
      {
        'id': '${widget.seriesId}-pyq-1',
        'title': 'PYQ 2024 (Set 1)',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'PYQ',
        'isFree': true,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-fmt-4',
        'title': 'Full Mock Test 4',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'Full Mock',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-fmt-5',
        'title': 'Full Mock Test 5',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'Full Mock',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-fmt-6',
        'title': 'Full Mock Test 6',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'Full Mock',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-fmt-7',
        'title': 'Full Mock Test 7',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'Full Mock',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-fmt-8',
        'title': 'Full Mock Test 8',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'Full Mock',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-fmt-9',
        'title': 'Full Mock Test 9',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'Full Mock',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-fmt-10',
        'title': 'Full Mock Test 10',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'Full Mock',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-topic-4',
        'title': 'Topic Test – Bengali Language',
        'sub': '25 Qs   25 Mins   25 Marks',
        'category': 'Topic Test',
        'isFree': false,
        'totalQuestions': 25,
        'durationMinutes': 25,
        'totalMarks': 25,
      },
      {
        'id': '${widget.seriesId}-topic-5',
        'title': 'Topic Test – English Language',
        'sub': '25 Qs   25 Mins   25 Marks',
        'category': 'Topic Test',
        'isFree': false,
        'totalQuestions': 25,
        'durationMinutes': 25,
        'totalMarks': 25,
      },
      {
        'id': '${widget.seriesId}-topic-6',
        'title': 'Topic Test – Indian History',
        'sub': '25 Qs   25 Mins   25 Marks',
        'category': 'Topic Test',
        'isFree': false,
        'totalQuestions': 25,
        'durationMinutes': 25,
        'totalMarks': 25,
      },
      {
        'id': '${widget.seriesId}-topic-7',
        'title': 'Topic Test – Geography & Environment',
        'sub': '25 Qs   25 Mins   25 Marks',
        'category': 'Topic Test',
        'isFree': false,
        'totalQuestions': 25,
        'durationMinutes': 25,
        'totalMarks': 25,
      },
      {
        'id': '${widget.seriesId}-topic-8',
        'title': 'Topic Test – General Science',
        'sub': '25 Qs   25 Mins   25 Marks',
        'category': 'Topic Test',
        'isFree': false,
        'totalQuestions': 25,
        'durationMinutes': 25,
        'totalMarks': 25,
      },
      {
        'id': '${widget.seriesId}-topic-9',
        'title': 'Topic Test – Current Affairs & GK',
        'sub': '25 Qs   25 Mins   25 Marks',
        'category': 'Topic Test',
        'isFree': false,
        'totalQuestions': 25,
        'durationMinutes': 25,
        'totalMarks': 25,
      },
      {
        'id': '${widget.seriesId}-topic-10',
        'title': 'Topic Test – Indian Constitution',
        'sub': '25 Qs   25 Mins   25 Marks',
        'category': 'Topic Test',
        'isFree': false,
        'totalQuestions': 25,
        'durationMinutes': 25,
        'totalMarks': 25,
      },
      {
        'id': '${widget.seriesId}-pyq-2',
        'title': 'PYQ 2023 (Set 1)',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'PYQ',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-pyq-3',
        'title': 'PYQ 2022 (Set 1)',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'PYQ',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-pyq-4',
        'title': 'PYQ 2021 (Set 1)',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'PYQ',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
      {
        'id': '${widget.seriesId}-pyq-5',
        'title': 'PYQ 2020 (Set 1)',
        'sub': '85 Qs   90 Mins   100 Marks',
        'category': 'PYQ',
        'isFree': false,
        'totalQuestions': 85,
        'durationMinutes': 90,
        'totalMarks': 100,
      },
    ];
  }

  void _handleLockedTestTap(String testTitle) {
    final isPro = LocalStorageService.isProUser();
    if (isPro) {
      // User is already pro, proceed
      return;
    }

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
                // Drag handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Crown Badge Icon
                Container(
                  width: 56,
                  height: 56,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFEF3C7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.workspace_premium_rounded,
                    size: 30,
                    color: Color(0xFFD97706),
                  ),
                ),
                const SizedBox(height: 14),

                const Text(
                  'PracticeKoro PRO Required',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 8),

                Text(
                  '"$testTitle" is a premium test. Upgrade to PracticeKoro PRO to unlock all full mocks, topic tests, and official PYQs across all exams!',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF64748B),
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 22),

                // General Subscription Upgrade CTA
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      context.push('/subscription');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF026BFC),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(23),
                      ),
                    ),
                    child: const Text(
                      'Upgrade to PRO',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text(
                    'Maybe Later',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = _getSeriesTitle();
    final bannerAsset = _getBannerAsset(title);
    final allTestsList = _getCanonicalTestsList();
    final totalTestsCount = _series?.testCount != null && _series!.testCount > 0
        ? _series!.testCount
        : allTestsList.length;

    final tabs = [
      'Overview',
      'Tests ($totalTestsCount)',
      'Syllabus',
      'FAQ',
    ];

    return PopScope(
      canPop: _selectedTabIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _selectedTabIndex != 0) {
          setState(() => _selectedTabIndex = 0);
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: _selectedTabIndex == 1
            ? AppBar(
                backgroundColor: Colors.white,
                elevation: 0,
                scrolledUnderElevation: 0,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
                  onPressed: () => setState(() => _selectedTabIndex = 0),
                ),
                title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      'Complete Test Series ($totalTestsCount Tests)',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                actions: [
                  IconButton(
                    icon: Icon(
                      _isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                      color: _isFavorite ? const Color(0xFFF43F5E) : const Color(0xFF0F172A),
                      size: 22,
                    ),
                    onPressed: () {
                      setState(() {
                        _isFavorite = !_isFavorite;
                      });
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          duration: const Duration(milliseconds: 1400),
                          content: Text(
                            _isFavorite
                                ? '$title added to favorites!'
                                : '$title removed from favorites',
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: 8),
                ],
              )
            : null,
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF026BFC)))
            : _selectedTabIndex == 1
                ? _buildTestsScreen3Body(allTestsList)
                : _buildOverviewScreen2Body(
                    title,
                    bannerAsset,
                    totalTestsCount,
                    tabs,
                  ),
      ),
    );
  }

  // Dedicated Screen 3 Tests List Body
  Widget _buildTestsScreen3Body(List<Map<String, dynamic>> allTestsList) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        _buildTestsTabContent(allTestsList),
      ],
    );
  }

  // Dedicated Screen 2 Overview Body with Hero Banner and Overlapping Sheet
  Widget _buildOverviewScreen2Body(
    String title,
    String bannerAsset,
    int totalTestsCount,
    List<String> tabs,
  ) {
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        // 1. Top Hero Illustration Banner with floating round Back & Favorite buttons (matching Screen 2)
        SizedBox(
          height: 220,
          width: double.infinity,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(
                bannerAsset,
                fit: BoxFit.cover,
                width: double.infinity,
                height: 220,
                errorBuilder: (context, error, stackTrace) => Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Floating circular back button
                      Material(
                        color: Colors.white,
                        shape: const CircleBorder(),
                        elevation: 2,
                        shadowColor: Colors.black26,
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () => Navigator.of(context).canPop()
                              ? Navigator.of(context).pop()
                              : context.go('/test-series'),
                          child: const Padding(
                            padding: EdgeInsets.all(8),
                            child: Icon(
                              Icons.arrow_back_rounded,
                              color: Color(0xFF0F172A),
                              size: 20,
                            ),
                          ),
                        ),
                      ),
                      // Floating circular favorite button
                      Material(
                        color: Colors.white,
                        shape: const CircleBorder(),
                        elevation: 2,
                        shadowColor: Colors.black26,
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () {
                            setState(() {
                              _isFavorite = !_isFavorite;
                            });
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                duration: const Duration(milliseconds: 1400),
                                content: Text(
                                  _isFavorite
                                      ? '$title added to favorites!'
                                      : '$title removed from favorites',
                                ),
                              ),
                            );
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(8),
                            child: Icon(
                              _isFavorite
                                  ? Icons.favorite_rounded
                                  : Icons.favorite_border_rounded,
                              color: _isFavorite
                                  ? const Color(0xFFF43F5E)
                                  : const Color(0xFF0F172A),
                              size: 20,
                            ),
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

        // 2. White Curved Sheet Container (overlapping banner)
        Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          transform: Matrix4.translationValues(0, -20, 0),
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title & Subtitle
              Text(
                title,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Complete Test Series',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 16),

              // 4-Box Key Metrics Row
              _buildKeyMetricsRow(totalTestsCount),
              const SizedBox(height: 16),

              // Green Checkmarks Highlights
              _buildCheckmarksFeatures(),
              const SizedBox(height: 18),

              // Segmented Horizontal Navigation Tabs
              _buildSegmentedTabs(tabs),
              const SizedBox(height: 18),

              // Tab Content (No exam-specific subscription bar/CTA anywhere!)
              if (_selectedTabIndex == 0) ...[
                _buildOverviewTabContent(title),
              ] else if (_selectedTabIndex == 2) ...[
                _buildSyllabusTabContent(title),
              ] else ...[
                _buildFaqTabContent(title),
              ],
            ],
          ),
        ),
      ],
    );
  }

  // 4-Box Key Metrics Row matching Screen 2
  Widget _buildKeyMetricsRow(int totalTestsCount) {
    return Row(
      children: [
        Expanded(
          child: _buildMetricBox(
            icon: Icons.article_outlined,
            title: '$totalTestsCount',
            subtitle: 'Tests',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildMetricBox(
            icon: Icons.track_changes_rounded,
            title: '12,500+',
            subtitle: 'Questions',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildMetricBox(
            icon: Icons.assignment_outlined,
            title: 'Full',
            subtitle: 'Syllabus',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildMetricBox(
            icon: Icons.language_rounded,
            title: 'Bilingual',
            subtitle: '(বাংলা + Eng)',
          ),
        ),
      ],
    );
  }

  Widget _buildMetricBox({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: const Color(0xFF026BFC)),
          const SizedBox(height: 4),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 1),
          Text(
            subtitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w500,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  // Green Checkmarks Highlights
  Widget _buildCheckmarksFeatures() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          _buildCheckRow('Based on latest exam pattern'),
          const SizedBox(height: 6),
          _buildCheckRow('Chapter-wise & full-length tests'),
          const SizedBox(height: 6),
          _buildCheckRow('Updated with latest questions'),
          const SizedBox(height: 6),
          _buildCheckRow('Detailed solutions & performance analysis'),
        ],
      ),
    );
  }

  Widget _buildCheckRow(String text) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: const BoxDecoration(
            color: Color(0xFF10B981),
            shape: BoxShape.circle,
          ),
          child: const Center(
            child: Icon(Icons.check_rounded, size: 11, color: Colors.white),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF334155),
            ),
          ),
        ),
      ],
    );
  }

  // Segmented Navigation Tabs
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
              onTap: () => setState(() => _selectedTabIndex = i),
              borderRadius: BorderRadius.circular(20),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: active ? const Color(0xFF026BFC) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: active ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
                  ),
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

  // Tab 1: Overview Tab Content
  Widget _buildOverviewTabContent(String title) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section: About This Series
        const Text(
          'About This Series',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'A complete test series to help you prepare for $title exam with exam-level questions, detailed solutions and full syllabus coverage.',
          style: const TextStyle(
            fontSize: 13,
            height: 1.5,
            color: Color(0xFF475569),
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 18),

        // Box: What's Included? (warm yellow card)
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
              const Text(
                "What's Included?",
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF854D0E),
                ),
              ),
              const SizedBox(height: 12),
              _buildIncludedItem('Full-length mock tests'),
              const SizedBox(height: 8),
              _buildIncludedItem('Topic-wise tests'),
              const SizedBox(height: 8),
              _buildIncludedItem('Previous year questions'),
              const SizedBox(height: 8),
              _buildIncludedItem('Detailed explanation for every question'),
              const SizedBox(height: 8),
              _buildIncludedItem('Real exam pattern & difficulty level'),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Quick shortcut to jump directly to Tests tab
        InkWell(
          onTap: () => setState(() => _selectedTabIndex = 1),
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFDBEAFE)),
            ),
            child: const Row(
              children: [
                Icon(Icons.format_list_bulleted_rounded, color: Color(0xFF026BFC), size: 20),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Browse all tests in this series',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF026BFC),
                    ),
                  ),
                ),
                Icon(Icons.arrow_forward_rounded, color: Color(0xFF026BFC), size: 18),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildIncludedItem(String text) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: const BoxDecoration(
            color: Color(0xFFEAB308),
            shape: BoxShape.circle,
          ),
          child: const Center(
            child: Icon(Icons.check_rounded, size: 11, color: Colors.white),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: Color(0xFF713F12),
            ),
          ),
        ),
      ],
    );
  }

  // Tab 2: Tests Tab Content (Screen 3)
  Widget _buildTestsTabContent(List<Map<String, dynamic>> allTests) {
    final subFilters = ['All Tests', 'Full Mock', 'Topic Test', 'PYQ'];
    final activeFilter = subFilters[_selectedTestFilterIndex];

    final filtered = allTests.where((t) {
      if (activeFilter == 'All Tests') return true;
      return t['category'] == activeFilter;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Sub-filter pills (All Tests, Full Mock, Topic Test, PYQ)
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: List.generate(subFilters.length, (idx) {
              final isSel = idx == _selectedTestFilterIndex;
              final name = subFilters[idx];
              final count = name == 'All Tests'
                  ? allTests.length
                  : allTests.where((t) => t['category'] == name).length;

              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: InkWell(
                  onTap: () => setState(() => _selectedTestFilterIndex = idx),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isSel ? const Color(0xFF026BFC) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSel ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Text(
                      name == 'All Tests' ? name : '$name ($count)',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                        color: isSel ? Colors.white : const Color(0xFF475569),
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
        const SizedBox(height: 14),

        // Tests List
        ...filtered.asMap().entries.map((entry) {
          final index = entry.key + 1;
          final test = entry.value;
          final isFree = test['isFree'] as bool;
          final testTitle = test['title'] as String;

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x04000000),
                    blurRadius: 6,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Circular index number badge
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFDBEAFE)),
                    ),
                    child: Center(
                      child: Text(
                        '$index',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF026BFC),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Title & Metrics column
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          testTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            const Icon(Icons.article_outlined, size: 12, color: Color(0xFF64748B)),
                            const SizedBox(width: 3),
                            Text(
                              '${test['totalQuestions']} Qs',
                              style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.timer_outlined, size: 12, color: Color(0xFF64748B)),
                            const SizedBox(width: 3),
                            Text(
                              '${test['durationMinutes']} Mins',
                              style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.emoji_events_outlined, size: 12, color: Color(0xFF64748B)),
                            const SizedBox(width: 3),
                            Text(
                              '${test['totalMarks']} Marks',
                              style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Right side: Badge (FREE / PAID) + Action Button / Lock Icon
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                        decoration: BoxDecoration(
                          color: isFree ? const Color(0xFFECFDF5) : const Color(0xFFFFFBEB),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: isFree ? const Color(0xFFA7F3D0) : const Color(0xFFFDE68A),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.workspace_premium_rounded,
                              size: 10,
                              color: isFree ? const Color(0xFF059669) : const Color(0xFFD97706),
                            ),
                            const SizedBox(width: 3),
                            Text(
                              isFree ? 'FREE' : 'PAID',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w900,
                                color: isFree ? const Color(0xFF059669) : const Color(0xFFD97706),
                                letterSpacing: 0.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),

                      // Action button: "Start Test →" for Free tests, Lock icon for Paid tests
                      if (isFree)
                        ElevatedButton(
                          onPressed: () {
                            context.push(
                              '/test-details/${test['id']}?title=${Uri.encodeComponent(testTitle)}&isPro=false',
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF026BFC),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                            ),
                            minimumSize: const Size(0, 30),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Start Test',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                              ),
                              SizedBox(width: 3),
                              Icon(Icons.arrow_forward_rounded, size: 13),
                            ],
                          ),
                        )
                      else
                        InkWell(
                          onTap: () => _handleLockedTestTap(testTitle),
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: const Icon(
                              Icons.lock_outline_rounded,
                              size: 16,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  // Tab 3: Syllabus Tab Content
  Widget _buildSyllabusTabContent(String title) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Official Syllabus Overview',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 12),
          _buildSyllabusItem('General Awareness & GK', '25 Marks • Current Affairs, Indian History, Geography, Polity'),
          _buildSyllabusItem('Elementary Mathematics', '25 Marks • Arithmetic, Number System, Mensuration (10th Std)'),
          _buildSyllabusItem('Reasoning & Logical Analysis', '25 Marks • Coding-Decoding, Series, Syllogism, Blood Relations'),
          _buildSyllabusItem('English Language', '10 Marks • Vocabulary, Grammar, Idioms, Fill in the blanks'),
        ],
      ),
    );
  }

  Widget _buildSyllabusItem(String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            desc,
            style: const TextStyle(
              fontSize: 11.5,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  // Tab 4: FAQ Tab Content
  Widget _buildFaqTabContent(String title) {
    final faqs = [
      {
        'q': 'Are all tests available in Bengali?',
        'a': 'Yes, all mock tests and previous year questions are bilingual in Bengali and English.',
      },
      {
        'q': 'Is negative marking calculated?',
        'a': 'Yes, exactly matching the official pattern, 0.25 marks are deducted for every wrong answer.',
      },
      {
        'q': 'Can I re-attempt a test after completion?',
        'a': 'Yes, you can re-attempt any test multiple times to improve your speed and accuracy.',
      },
      {
        'q': 'When do I get solutions and rank?',
        'a': 'Immediately after submitting a test, complete bilingual solutions, statewide rank, and district-wise percentiles are generated.',
      },
    ];

    return Column(
      children: faqs.map((faq) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  faq['q']!,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  faq['a']!,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

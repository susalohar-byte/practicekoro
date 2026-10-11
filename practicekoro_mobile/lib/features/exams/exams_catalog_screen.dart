import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/exam_assets.dart';
import '../../core/utils/image_url_helper.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/repositories/catalog_repository.dart';

class ExamsCatalogScreen extends ConsumerStatefulWidget {
  final ValueChanged<int>? onTabSelected;
  final String? initialExam;
  final String? initialExamTitle;
  final bool isStandAlone;

  const ExamsCatalogScreen({
    super.key,
    this.onTabSelected,
    this.initialExam,
    this.initialExamTitle,
    this.isStandAlone = false,
  });

  @override
  ConsumerState<ExamsCatalogScreen> createState() => _ExamsCatalogScreenState();
}

class _ExamsCatalogScreenState extends ConsumerState<ExamsCatalogScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  String? _selectedExamSlug;
  String? _selectedExamTitle;
  String _selectedSort = 'Most Popular';
  int _selectedCategoryTab = 0; // 0: All, 1: Full Mock, 2: Topic Test, 3: Official PYQ

  static const List<String> _categoryTabs = [
    'All',
    'Full Mock',
    'Topic Test',
    'Official PYQ',
  ];

  // Canonical fallback test series data matching Screen 1 reference design exactly
  static const List<Map<String, dynamic>> _fallbackSeries = [
    {
      'id': 'wbp-constable',
      'slug': 'wbp-constable',
      'examId': 'wbp-constable',
      'title': 'WBP Constable',
      'subtitle': 'Complete Test Series',
      'examTitle': 'WBP Constable',
      'isPaid': false,
      'testCount': 25,
      'questionCount': '12,500+ Qs',
      'mocks': 10,
      'topics': 10,
      'pyqs': 5,
      'isPopular': true,
      'badgeText': 'Popular',
      'badgeType': 'popular',
    },
    {
      'id': 'wbssc-group-c',
      'slug': 'wbssc-group-c',
      'examId': 'wbssc-group-c',
      'title': 'WBSSC Group C & D',
      'subtitle': 'Complete Test Series',
      'examTitle': 'WBSSC Group C & D',
      'isPaid': true,
      'testCount': 30,
      'questionCount': '15,000+ Qs',
      'mocks': 12,
      'topics': 12,
      'pyqs': 6,
      'isPopular': true,
      'badgeText': 'Most Popular',
      'badgeType': 'most_popular',
    },
    {
      'id': 'railway-ntpc',
      'slug': 'railway-ntpc',
      'examId': 'railway-ntpc',
      'title': 'Railway NTPC',
      'subtitle': 'Complete Test Series',
      'examTitle': 'Railway NTPC',
      'isPaid': true,
      'testCount': 40,
      'questionCount': '18,000+ Qs',
      'mocks': 15,
      'topics': 15,
      'pyqs': 10,
      'isPopular': true,
      'badgeText': 'Trending',
      'badgeType': 'trending',
    },
    {
      'id': 'ssc-cgl',
      'slug': 'ssc-cgl',
      'examId': 'ssc-cgl',
      'title': 'SSC CGL',
      'subtitle': 'Complete Test Series',
      'examTitle': 'SSC CGL',
      'isPaid': true,
      'testCount': 20,
      'questionCount': '10,000+ Qs',
      'mocks': 10,
      'topics': 6,
      'pyqs': 4,
      'isPopular': false,
      'badgeText': null,
      'badgeType': null,
    },
    {
      'id': 'food-si',
      'slug': 'food-si',
      'examId': 'food-si',
      'title': 'Food SI',
      'subtitle': 'Complete Test Series',
      'examTitle': 'Food SI',
      'isPaid': true,
      'testCount': 25,
      'questionCount': '11,000+ Qs',
      'mocks': 10,
      'topics': 10,
      'pyqs': 5,
      'isPopular': false,
      'badgeText': null,
      'badgeType': null,
    },
    {
      'id': 'icds',
      'slug': 'icds',
      'examId': 'icds',
      'title': 'ICDS Supervisor',
      'subtitle': 'Complete Test Series',
      'examTitle': 'ICDS Supervisor',
      'isPaid': false,
      'testCount': 20,
      'questionCount': '8,500+ Qs',
      'mocks': 8,
      'topics': 8,
      'pyqs': 4,
      'isPopular': false,
      'badgeText': null,
      'badgeType': null,
    },
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialExam != null && widget.initialExam!.isNotEmpty) {
      _selectedExamSlug = widget.initialExam;
      _selectedExamTitle = widget.initialExamTitle ?? _formatTitle(widget.initialExam!);
    }
  }

  @override
  void didUpdateWidget(covariant ExamsCatalogScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialExam != oldWidget.initialExam && widget.initialExam != null) {
      setState(() {
        _selectedExamSlug = widget.initialExam;
        _selectedExamTitle = widget.initialExamTitle ?? _formatTitle(widget.initialExam!);
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  String _formatTitle(String slug) {
    return slug
        .replaceAll('-', ' ')
        .replaceAll('_', ' ')
        .split(' ')
        .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '')
        .join(' ');
  }

  bool _matchesExam(Map<String, dynamic> item, String examSlug) {
    final slug = examSlug.toLowerCase().replaceAll('_', '-').trim();
    final id = (item['id'] as String? ?? '').toLowerCase();
    final sSlug = (item['slug'] as String? ?? '').toLowerCase();
    final sExamId = (item['examId'] as String? ?? '').toLowerCase();
    final title = (item['title'] as String? ?? '').toLowerCase();
    final examTitle = (item['examTitle'] as String? ?? '').toLowerCase();

    if (id == slug || sSlug == slug || sExamId == slug) return true;
    if (slug.contains('wbp') &&
        (id.contains('wbp') ||
            title.contains('wbp') ||
            examTitle.contains('wbp') ||
            title.contains('police'))) {
      return true;
    }
    if (slug.contains('ssc') &&
        (id.contains('ssc') ||
            title.contains('ssc') ||
            examTitle.contains('ssc'))) {
      return true;
    }
    if ((slug.contains('railway') ||
            slug.contains('ntpc') ||
            slug.contains('rrb')) &&
        (id.contains('railway') ||
            id.contains('ntpc') ||
            title.contains('railway') ||
            title.contains('ntpc'))) {
      return true;
    }
    if (slug.contains('icds') &&
        (id.contains('icds') ||
            title.contains('icds') ||
            examTitle.contains('icds'))) {
      return true;
    }
    if (slug.contains('food') &&
        (id.contains('food') ||
            title.contains('food') ||
            examTitle.contains('food'))) {
      return true;
    }

    final slugWords = slug.split(RegExp(r'[-_\s]+')).where((w) => w.length > 2);
    for (final w in slugWords) {
      if (title.contains(w) || examTitle.contains(w) || id.contains(w)) return true;
    }
    return false;
  }

  void _onCardTap(Map<String, dynamic> item) {
    // Direct access to test series details
    context.push('/test-series/${item['id']}');
  }

  void _openExamFilterSheet(BuildContext context, List<Map<String, dynamic>> examsList) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Drag handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Filter by Exam',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (_selectedExamSlug != null)
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _selectedExamSlug = null;
                            _selectedExamTitle = null;
                          });
                          Navigator.pop(ctx);
                        },
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Show All',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF026BFC),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(context).size.height * 0.55,
                  ),
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        // All Exams Option
                        _buildExamFilterRow(
                          title: 'All Exams',
                          isSelected: _selectedExamSlug == null,
                          onTap: () {
                            setState(() {
                              _selectedExamSlug = null;
                              _selectedExamTitle = null;
                            });
                            Navigator.pop(ctx);
                          },
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        ...examsList.map((exam) {
                          final slug = (exam['slug'] ?? exam['id'] ?? '').toString();
                          final title = (exam['title'] ?? '').toString();
                          final isSelected = _selectedExamSlug == slug;

                          return Column(
                            children: [
                              _buildExamFilterRow(
                                title: title,
                                isSelected: isSelected,
                                emblemUrl: (exam['cardEmblemUrl'] ?? exam['cardLogoUrl']) as String?,
                                onTap: () {
                                  setState(() {
                                    _selectedExamSlug = slug;
                                    _selectedExamTitle = title;
                                  });
                                  Navigator.pop(ctx);
                                },
                              ),
                              const Divider(height: 1, color: Color(0xFFF1F5F9)),
                            ],
                          );
                        }),
                      ],
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

  Widget _buildExamFilterRow({
    required String title,
    required bool isSelected,
    String? emblemUrl,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFEFF6FF) : const Color(0xFFF8FAFC),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
                ),
              ),
              child: emblemUrl != null && emblemUrl.isNotEmpty
                  ? ClipOval(
                      child: PkAdminImage(
                        imageUrl: emblemUrl,
                        fallbackExamTitle: title,
                        width: 32,
                        height: 32,
                        fit: BoxFit.contain,
                      ),
                    )
                  : Icon(
                      isSelected ? Icons.check_circle_rounded : Icons.school_rounded,
                      size: 16,
                      color: isSelected ? const Color(0xFF026BFC) : const Color(0xFF64748B),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? const Color(0xFF026BFC) : const Color(0xFF1E293B),
                ),
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check_rounded,
                color: Color(0xFF026BFC),
                size: 20,
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final allSeriesAsync = ref.watch(allTestSeriesProvider);
    final popularExamsAsync = ref.watch(popularExamsProvider);

    // Build the consolidated series list
    final List<Map<String, dynamic>> sourceList;
    if (allSeriesAsync.value != null && allSeriesAsync.value!.isNotEmpty) {
      sourceList = allSeriesAsync.value!.map((s) {
        return {
          'id': s.id,
          'slug': s.slug.isNotEmpty ? s.slug : s.id,
          'examId': s.examId,
          'title': s.title,
          'subtitle': (s.description != null && s.description!.isNotEmpty)
              ? s.description!
              : 'Complete Test Series',
          'examTitle': s.examTitle ?? s.title,
          'isPaid': s.isPremium,
          'mocks': s.fullMockCount,
          'topics': s.topicTestCount,
          'pyqs': s.pyqTestCount,
          'testCount': s.testCount,
          // Real total from the series' published tests; null hides the stat.
          'questionCount': s.questionCount > 0
              ? '${s.questionCount.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]},')} Qs'
              : null,
          'isPopular': s.isPopular,
          'badgeText': s.isPopular ? 'Most Popular' : null,
          'badgeType': s.isPopular ? 'popular' : null,
          'orderIndex': s.orderIndex,
        };
      }).toList();
    } else {
      sourceList = _fallbackSeries;
    }

    // Consolidated exams list for filter sheet
    final List<Map<String, dynamic>> examsList;
    if (popularExamsAsync.value != null && popularExamsAsync.value!.isNotEmpty) {
      examsList = popularExamsAsync.value!;
    } else {
      examsList = const [
        {'id': 'wbp-constable', 'slug': 'wbp-constable', 'title': 'WBP Constable'},
        {'id': 'railway-ntpc', 'slug': 'railway-ntpc', 'title': 'Railway (NTPC)'},
        {'id': 'ssc-mts', 'slug': 'ssc-mts', 'title': 'SSC MTS'},
        {'id': 'wbssc-group-c', 'slug': 'wbssc-group-c', 'title': 'WBSSC Group C'},
        {'id': 'wbssc-group-d', 'slug': 'wbssc-group-d', 'title': 'WBSSC Group D'},
        {'id': 'icds', 'slug': 'icds', 'title': 'ICDS'},
        {'id': 'food-si', 'slug': 'food-si', 'title': 'Food SI'},
      ];
    }

    // Filter by Category Pill + Exam + Search query
    final filtered = sourceList.where((s) {
      if (_selectedCategoryTab == 1) {
        if ((s['mocks'] as int? ?? 0) <= 0) return false;
      } else if (_selectedCategoryTab == 2) {
        if ((s['topics'] as int? ?? 0) <= 0) return false;
      } else if (_selectedCategoryTab == 3) {
        if ((s['pyqs'] as int? ?? 0) <= 0) return false;
      }

      if (_selectedExamSlug != null && _selectedExamSlug!.isNotEmpty) {
        if (!_matchesExam(s, _selectedExamSlug!)) return false;
      }
      if (query.isNotEmpty) {
        final title = (s['title'] as String? ?? '').toLowerCase();
        final sub = (s['subtitle'] as String? ?? '').toLowerCase();
        final examTitle = (s['examTitle'] as String? ?? '').toLowerCase();
        if (!title.contains(query) && !sub.contains(query) && !examTitle.contains(query)) {
          return false;
        }
      }
      return true;
    }).toList();

    // Sort logic
    if (_selectedSort == 'Most Popular') {
      filtered.sort((a, b) {
        final aPop = (a['isPopular'] as bool? ?? false) ? 1 : 0;
        final bPop = (b['isPopular'] as bool? ?? false) ? 1 : 0;
        if (aPop != bPop) return bPop.compareTo(aPop);
        final aTests = (a['mocks'] as int) + (a['topics'] as int) + (a['pyqs'] as int);
        final bTests = (b['mocks'] as int) + (b['topics'] as int) + (b['pyqs'] as int);
        return bTests.compareTo(aTests);
      });
    } else if (_selectedSort == 'Newest') {
      filtered.sort((a, b) => ((b['orderIndex'] as int? ?? 0)).compareTo(a['orderIndex'] as int? ?? 0));
    } else if (_selectedSort == 'Most Tests') {
      filtered.sort((a, b) {
        final aTests = (a['mocks'] as int) + (a['topics'] as int) + (a['pyqs'] as int);
        final bTests = (b['mocks'] as int) + (b['topics'] as int) + (b['pyqs'] as int);
        return bTests.compareTo(aTests);
      });
    } else if (_selectedSort == 'A–Z') {
      filtered.sort((a, b) => (a['title'] as String).compareTo(b['title'] as String));
    }

    return Scaffold(
      backgroundColor: const Color(0xFFFAFCFF),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: const Color(0xFF026BFC),
          onRefresh: () async {
            ref.invalidate(allTestSeriesProvider);
            ref.invalidate(popularExamsProvider);
            await ref.read(allTestSeriesProvider.future);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              SliverPadding(
                padding: PKBottomSpacing.edgeInsets(
                  context,
                  horizontal: 16,
                  top: 8,
                  additionalGap: 6,
                ),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // 1. Top Navigation: Back arrow + Test Series title + Search icon
                    _buildTopBar(context),
                    const SizedBox(height: 12),

                    // 2. Category Pills: All | Full Mock | Topic Test | Official PYQ
                    _buildCategoryPills(),
                    const SizedBox(height: 12),

                    // 3. Search + All Exams Filter Control
                    _buildSearchAndFilterBar(context, examsList),
                    const SizedBox(height: 14),

                    // 4. Motivational Structured Test Series Hero Banner
                    _buildHeroBanner(),
                    const SizedBox(height: 18),

                    // 5. Section Header: Count + Sort Dropdown
                    _buildSectionHeader(filtered.length),
                    const SizedBox(height: 12),
                  ]),
                ),
              ),

              // 6. Test Series Vertical List (Horizontal Cards) matching Screen 1
              if (allSeriesAsync.isLoading && sourceList.isEmpty)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: _buildSkeletonList(),
                )
              else if (filtered.isEmpty)
                SliverToBoxAdapter(
                  child: _buildEmptyState(),
                )
              else
                SliverPadding(
                  padding: PKBottomSpacing.edgeInsets(
                    context,
                    horizontal: 16,
                  ),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return _buildTestSeriesCard(filtered[index]);
                      },
                      childCount: filtered.length,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // 1. Top Navigation Bar matching Screen 1 reference design
  Widget _buildTopBar(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Back Button
        InkWell(
          onTap: () {
            if (widget.isStandAlone || Navigator.of(context).canPop()) {
              Navigator.of(context).maybePop();
            } else if (widget.onTabSelected != null) {
              widget.onTabSelected!(0);
            } else {
              context.go('/home');
            }
          },
          borderRadius: BorderRadius.circular(20),
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(
              Icons.arrow_back_rounded,
              color: Color(0xFF1E293B),
              size: 20,
            ),
          ),
        ),

        const SizedBox(width: 12),

        // Bold Title: Test Series
        const Expanded(
          child: Text(
            'Test Series',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
              letterSpacing: -0.5,
            ),
          ),
        ),

        // Search Action Icon
        InkWell(
          onTap: () {
            _searchFocusNode.requestFocus();
          },
          borderRadius: BorderRadius.circular(20),
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(
              Icons.search_rounded,
              color: Color(0xFF1E293B),
              size: 20,
            ),
          ),
        ),
      ],
    );
  }

  // 2. Category Pills matching Screen 1 (All | Full Mock | Topic Test | Official PYQ)
  Widget _buildCategoryPills() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: List.generate(_categoryTabs.length, (idx) {
          final isSel = idx == _selectedCategoryTab;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () => setState(() => _selectedCategoryTab = idx),
              borderRadius: BorderRadius.circular(20),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSel ? const Color(0xFF026BFC) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSel ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Text(
                  _categoryTabs[idx],
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                    color: isSel ? Colors.white : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  // 3. Large Rounded Search Field + "All Exams ⌄" Dropdown Control
  Widget _buildSearchAndFilterBar(BuildContext context, List<Map<String, dynamic>> examsList) {
    return Row(
      children: [
        // Rounded Search Bar
        Expanded(
          child: Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x05000000),
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.search_rounded,
                  size: 20,
                  color: Color(0xFF94A3B8),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    focusNode: _searchFocusNode,
                    onChanged: (_) => setState(() {}),
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search test series...',
                      hintStyle: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF94A3B8),
                      ),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF94A3B8)),
                              padding: EdgeInsets.zero,
                              onPressed: () => setState(() => _searchController.clear()),
                            )
                          : null,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 10),

        // "All Exams ⌄" Filter Control
        InkWell(
          onTap: () => _openExamFilterSheet(context, examsList),
          borderRadius: BorderRadius.circular(22),
          child: Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: _selectedExamSlug != null ? const Color(0xFFEFF6FF) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: _selectedExamSlug != null ? const Color(0xFF026BFC) : const Color(0xFFE2E8F0),
                width: _selectedExamSlug != null ? 1.5 : 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.filter_list_rounded,
                  size: 16,
                  color: _selectedExamSlug != null ? const Color(0xFF026BFC) : const Color(0xFF334155),
                ),
                const SizedBox(width: 6),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 82),
                  child: Text(
                    _selectedExamTitle ?? 'All Exams',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: _selectedExamSlug != null ? const Color(0xFF026BFC) : const Color(0xFF334155),
                    ),
                  ),
                ),
                const SizedBox(width: 2),
                Icon(
                  Icons.keyboard_arrow_down_rounded,
                  size: 18,
                  color: _selectedExamSlug != null ? const Color(0xFF026BFC) : const Color(0xFF64748B),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // 4. Structured Test Series for Your Success! Hero Banner matching Screen 1
  Widget _buildHeroBanner() {
    // The banner artwork already contains the headline, mascot and decorations, so it is
    // shown whole at its own aspect ratio (285x115) rather than cropped or recomposed.
    return Container(
      width: double.infinity,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: const Color(0xFFE0F2FE),
        border: Border.all(color: const Color(0xFFBAE6FD), width: 1),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06026BFC),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: AspectRatio(
        aspectRatio: 285 / 115,
        child: Image.asset(
          'assets/images/test_series_success_banner_exact.png',
          fit: BoxFit.cover,
          filterQuality: FilterQuality.medium,
          errorBuilder: (context, error, stackTrace) => const Padding(
            padding: EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Structured Test Series for Your Success!',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                    height: 1.15,
                    letterSpacing: -0.4,
                  ),
                ),
                SizedBox(height: 7),
                Text(
                  'Exam-focused tests, real exam pattern, better results.',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF475569),
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // 5. Section Header: Dynamic Count + Sort Dropdown
  Widget _buildSectionHeader(int count) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: '$count ',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF026BFC),
                  letterSpacing: -0.4,
                ),
              ),
              const TextSpan(
                text: 'Test Series',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.3,
                ),
              ),
            ],
          ),
        ),

        // Sort Dropdown
        PopupMenuButton<String>(
          onSelected: (val) => setState(() => _selectedSort = val),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 4,
          itemBuilder: (context) => [
            _buildSortMenuItem('Most Popular'),
            _buildSortMenuItem('Newest'),
            _buildSortMenuItem('Most Tests'),
            _buildSortMenuItem('A–Z'),
          ],
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x04000000),
                  blurRadius: 4,
                  offset: Offset(0, 1),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.swap_vert_rounded, size: 16, color: Color(0xFF475569)),
                const SizedBox(width: 4),
                Text(
                  _selectedSort,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF334155),
                  ),
                ),
                const SizedBox(width: 2),
                const Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Color(0xFF64748B)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  PopupMenuItem<String> _buildSortMenuItem(String text) {
    final isSelected = _selectedSort == text;
    return PopupMenuItem<String>(
      value: text,
      child: Row(
        children: [
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? const Color(0xFF026BFC) : const Color(0xFF0F172A),
              ),
            ),
          ),
          if (isSelected)
            const Icon(Icons.check_rounded, color: Color(0xFF026BFC), size: 18),
        ],
      ),
    );
  }

  // 6. Test Series Horizontal Card matching Screen 1 1:1
  Widget _buildTestSeriesCard(Map<String, dynamic> item) {
    final id = item['id'] as String;
    final title = item['title'] as String;
    final subtitle = item['subtitle'] as String? ?? 'Complete Test Series';
    final badgeText = item['badgeText'] as String?;
    final testCount = item['testCount'] as int? ??
        ((item['mocks'] as int? ?? 10) +
            (item['topics'] as int? ?? 10) +
            (item['pyqs'] as int? ?? 5));
    final questionCount = item['questionCount'] as String?;

    final emblemAsset = ExamAssets.getEmblemAsset(id) ??
        ExamAssets.getEmblemAsset(title) ??
        'assets/images/exams/emblem_series_wbp.png';

    // Badge styling matching Screen 1 reference
    Color badgeBg = const Color(0xFFDCFCE7);
    Color badgeTextColor = const Color(0xFF16A34A);
    if (badgeText != null) {
      final bLower = badgeText.toLowerCase();
      if (bLower.contains('most popular')) {
        badgeBg = const Color(0xFFFFEDD5);
        badgeTextColor = const Color(0xFFEA580C);
      } else if (bLower.contains('trending')) {
        badgeBg = const Color(0xFFFFE4E6);
        badgeTextColor = const Color(0xFFE11D48);
      } else {
        badgeBg = const Color(0xFFDCFCE7);
        badgeTextColor = const Color(0xFF16A34A);
      }
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _onCardTap(item),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x05000000),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                // Exam Emblem Container
                Container(
                  width: 58,
                  height: 58,
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
                  ),
                  child: Image.asset(
                    emblemAsset,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.school_rounded,
                      color: Color(0xFF026BFC),
                      size: 28,
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // Center Information
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Title + Badge Row
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 15.5,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                                letterSpacing: -0.3,
                              ),
                            ),
                          ),
                          if (badgeText != null) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2.5,
                              ),
                              decoration: BoxDecoration(
                                color: badgeBg,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                badgeText,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: badgeTextColor,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 3),

                      // Subtitle
                      Text(
                        subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 6),

                      // Stats Row: [doc] 25 Tests    [target] 12,500+ Qs
                      Row(
                        children: [
                          const Icon(
                            Icons.article_outlined,
                            size: 13,
                            color: Color(0xFF94A3B8),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '$testCount Tests',
                            style: const TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          if (questionCount != null) ...[
                            const SizedBox(width: 14),
                            const Icon(
                              Icons.track_changes_rounded,
                              size: 13,
                              color: Color(0xFF94A3B8),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              questionCount.contains('Qs') ? questionCount : '$questionCount Qs',
                              style: const TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),
                // Chevron right
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFF94A3B8),
                  size: 24,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // 7. Skeleton Loading List
  Widget _buildSkeletonList() {
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 120,
                          height: 14,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          width: 90,
                          height: 11,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: 150,
                          height: 11,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
        childCount: 5,
      ),
    );
  }

  // 7. Empty State
  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: const BoxDecoration(
                color: Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.search_off_rounded,
                size: 32,
                color: Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'No test series found',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Try another exam or search term.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _searchController.clear();
                  _selectedExamSlug = null;
                  _selectedExamTitle = null;
                });
              },
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('Clear Filters'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF026BFC),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/pk_ui.dart';
import '../../core/widgets/pk_bottom_spacing.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/test_series_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../core/utils/image_url_helper.dart';

/// Test Series listing: search, test-type and exam filters, one featured series and
/// the list of published series. Everything shown comes from `test_series` rows.
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

enum _Sort { popular, mostTests, az }

class _ExamsCatalogScreenState extends ConsumerState<ExamsCatalogScreen> {
  final TextEditingController _searchController = TextEditingController();

  String? _selectedExamSlug;
  String? _selectedExamTitle;
  _Sort _sort = _Sort.popular;
  int _typeIndex = 0; // 0: All, 1: Full Mock, 2: Topic Test, 3: Official PYQ

  static const List<String> _types = ['All', 'Full Mock', 'Topic Test', 'Official PYQ'];

  @override
  void initState() {
    super.initState();
    _applyInitialExam();
  }

  @override
  void didUpdateWidget(covariant ExamsCatalogScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialExam != oldWidget.initialExam) setState(_applyInitialExam);
  }

  void _applyInitialExam() {
    final slug = widget.initialExam?.trim();
    _selectedExamSlug = (slug == null || slug.isEmpty) ? null : slug;
    _selectedExamTitle = _selectedExamSlug == null ? null : widget.initialExamTitle;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  bool get _hasActiveFilters =>
      _typeIndex != 0 || _selectedExamSlug != null || _searchController.text.trim().isNotEmpty;

  void _clearFilters() {
    setState(() {
      _typeIndex = 0;
      _selectedExamSlug = null;
      _selectedExamTitle = null;
      _searchController.clear();
    });
  }

  /// Exam filter: resolve the selected slug/id to a catalogue exam and match the
  /// series by its exam relation (falling back to the exam title).
  bool _matchesExam(TestSeriesModel s, List<ExamModel> exams) {
    final key = _selectedExamSlug!.toLowerCase();
    ExamModel? exam;
    for (final e in exams) {
      if (e.id.toLowerCase() == key || e.slug.toLowerCase() == key) exam = e;
    }
    if (exam != null) {
      if (s.examId == exam.id) return true;
      return (s.examTitle ?? '').toLowerCase().trim() == exam.title.toLowerCase().trim();
    }
    return s.examId.toLowerCase() == key;
  }

  bool _matchesType(TestSeriesModel s) => switch (_typeIndex) {
        1 => s.fullMockCount > 0,
        2 => s.topicTestCount > 0,
        3 => s.pyqTestCount > 0,
        _ => true,
      };

  bool _matchesQuery(TestSeriesModel s, String q) {
    if (q.isEmpty) return true;
    return '${s.title} ${s.description ?? ''} ${s.examTitle ?? ''}'.toLowerCase().contains(q);
  }

  @override
  Widget build(BuildContext context) {
    final seriesAsync = ref.watch(allTestSeriesProvider);
    final exams = ref.watch(examsProvider).asData?.value ?? const <ExamModel>[];
    final all = seriesAsync.asData?.value ?? const <TestSeriesModel>[];
    final query = _searchController.text.trim().toLowerCase();

    final filtered = all
        .where((s) =>
            _matchesType(s) &&
            (_selectedExamSlug == null || _matchesExam(s, exams)) &&
            _matchesQuery(s, query))
        .toList();
    switch (_sort) {
      case _Sort.popular:
        filtered.sort((a, b) {
          if (a.isPopular != b.isPopular) return a.isPopular ? -1 : 1;
          return a.orderIndex.compareTo(b.orderIndex);
        });
      case _Sort.mostTests:
        filtered.sort((a, b) => b.testCount.compareTo(a.testCount));
      case _Sort.az:
        filtered.sort((a, b) => a.title.toLowerCase().compareTo(b.title.toLowerCase()));
    }

    // One featured series: only when the admin has flagged some (not all) as popular,
    // and only on the unfiltered view so it never hides a search result.
    final popular = all.where((s) => s.isPopular).toList()..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    final badgeMeaningful = popular.isNotEmpty && popular.length < all.length;
    final featured = !_hasActiveFilters && badgeMeaningful ? popular.first : null;
    final list = featured == null ? filtered : filtered.where((s) => s.id != featured.id).toList();

    return Scaffold(
      backgroundColor: PK.canvas,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: PK.blue,
          onRefresh: () async {
            ref.invalidate(allTestSeriesProvider);
            ref.invalidate(examsProvider);
            await ref.read(allTestSeriesProvider.future);
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: PKBottomSpacing.edgeInsets(context, horizontal: PK.gutter, top: 8),
            children: [
              _buildHeader(),
              const SizedBox(height: 14),
              _buildSearchRow(exams),
              const SizedBox(height: 12),
              _buildTypeFilters(),
              const SizedBox(height: 14),
              if (!_hasActiveFilters) ...[
                _buildHeroBanner(),
                const SizedBox(height: 16),
              ],
              if (seriesAsync.isLoading && all.isEmpty)
                ..._buildSkeleton()
              else if (seriesAsync.hasError && all.isEmpty)
                PKEmptyCard(
                  icon: Icons.cloud_off_rounded,
                  title: 'Could not load test series',
                  message: 'Check your connection and try again.',
                  actionLabel: 'Retry',
                  onAction: () => ref.invalidate(allTestSeriesProvider),
                )
              else if (all.isEmpty)
                const PKEmptyCard(
                  icon: Icons.library_books_outlined,
                  title: 'No test series yet',
                  message: 'Published test series will appear here.',
                )
              else ...[
                if (featured != null) ...[
                  const PKSectionTitle(title: 'Featured'),
                  const SizedBox(height: 10),
                  _buildFeatured(featured),
                  const SizedBox(height: 20),
                ],
                _buildResultsHeader(list.length, isRemainder: featured != null),
                const SizedBox(height: 10),
                if (filtered.isEmpty)
                  PKEmptyCard(
                    icon: Icons.search_off_rounded,
                    title: 'No test series found',
                    message: 'Try another exam, test type or search term.',
                    actionLabel: 'Clear filters',
                    onAction: _clearFilters,
                  )
                else
                  for (final (i, s) in list.indexed) ...[
                    if (i > 0) const SizedBox(height: 10),
                    _buildSeriesCard(s, showBadge: badgeMeaningful && s.isPopular),
                  ],
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ─── Header ────────────────────────────────────────────────────────────────

  Widget _buildHeader() {
    final canGoBack = widget.isStandAlone || Navigator.of(context).canPop();
    return Row(
      children: [
        if (canGoBack) ...[
          Material(
            color: PK.card,
            shape: const CircleBorder(side: BorderSide(color: PK.border)),
            child: IconButton(
              tooltip: 'Back',
              constraints: const BoxConstraints.tightFor(width: 42, height: 42),
              icon: const Icon(Icons.arrow_back_rounded, size: 21, color: PK.text),
              onPressed: () {
                if (Navigator.of(context).canPop()) {
                  Navigator.of(context).pop();
                } else if (widget.onTabSelected != null) {
                  widget.onTabSelected!(0);
                } else {
                  context.go('/home');
                }
              },
            ),
          ),
          const SizedBox(width: 12),
        ],
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Test Series',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: PK.text, letterSpacing: -0.5),
              ),
              SizedBox(height: 2),
              Text(
                'Find the right tests for your preparation.',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: PK.textMuted),
              ),
            ],
          ),
        ),
        Material(
          color: PK.card,
          shape: const CircleBorder(side: BorderSide(color: PK.border)),
          child: IconButton(
            tooltip: 'Search',
            constraints: const BoxConstraints.tightFor(width: 40, height: 40),
            icon: const Icon(Icons.search_rounded, size: 20, color: PK.text),
            onPressed: () {},
          ),
        ),
      ],
    );
  }

  // ─── Hero Banner ───────────────────────────────────────────────────────────

  Widget _buildHeroBanner() {
    final heroBanners = ref.watch(heroBannersProvider).asData?.value;
    String? adminImageUrl;
    if (heroBanners != null && heroBanners.isNotEmpty) {
      for (final b in heroBanners) {
        final placement = (b['placement'] ?? '').toString();
        final isActive = b['is_active'] ?? b['isActive'] ?? true;
        final url = (b['image_url'] ?? b['imageUrl'] ?? b['banner_url']) as String?;
        if ((placement == 'test_series' || placement == 'catalog') && isActive == true && url != null && url.trim().isNotEmpty) {
          adminImageUrl = url.trim();
          break;
        }
      }
    }

    if (adminImageUrl != null) {
      return Container(
        height: 120,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0C000000),
              blurRadius: 10,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: PkAdminImage(
            imageUrl: adminImageUrl,
            fit: BoxFit.cover,
            fallbackExamTitle: 'Test Series',
          ),
        ),
      );
    }

    // Default sample illustration with soft shadow (Admin uploadable banner fallback)
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFD9EEFE),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBAE6FD)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A026BFC),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 14, 110, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Structured\nTest Series for\nYour Success!',
                    style: TextStyle(
                      fontSize: 16.5,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                      height: 1.2,
                      letterSpacing: -0.4,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Exam-focused tests,\nreal exam pattern, better results.',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF334155),
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              right: 8,
              bottom: 4,
              child: Image.asset(
                'assets/images/nimo_ready.png',
                height: 86,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchRow(List<ExamModel> exams) {
    final examLabel = _selectedExamSlug == null
        ? 'All exams'
        : (_selectedExamTitle ??
            exams
                .where((e) => e.slug == _selectedExamSlug || e.id == _selectedExamSlug)
                .map((e) => e.title)
                .firstOrNull ??
            'Exam');

    return Row(
      children: [
        Expanded(
          child: Container(
            height: 46,
            decoration: PK.cardBox(r: 14),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => setState(() {}),
              textInputAction: TextInputAction.search,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: PK.text),
              decoration: InputDecoration(
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 13),
                prefixIcon: const Icon(Icons.search_rounded, color: PK.textMuted, size: 21),
                hintText: 'Search test series',
                hintStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: PK.textFaint),
                suffixIcon: _searchController.text.isEmpty
                    ? null
                    : IconButton(
                        tooltip: 'Clear search',
                        icon: const Icon(Icons.close_rounded, size: 18, color: PK.textMuted),
                        onPressed: () => setState(_searchController.clear),
                      ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 150),
          child: Material(
            color: _selectedExamSlug == null ? PK.card : PK.blueSoft,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: BorderSide(color: _selectedExamSlug == null ? PK.border : PK.blue.withValues(alpha: 0.4)),
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () => _openExamSheet(exams),
              child: Container(
                height: 46,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.tune_rounded, size: 18, color: _selectedExamSlug == null ? PK.text : PK.blue),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        examLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: _selectedExamSlug == null ? PK.text : PK.blue,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTypeFilters() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      clipBehavior: Clip.none,
      child: Row(
        children: [
          for (final (i, label) in _types.indexed) ...[
            if (i > 0) const SizedBox(width: 8),
            PKChip(label: label, selected: i == _typeIndex, onTap: () => setState(() => _typeIndex = i)),
          ],
        ],
      ),
    );
  }

  void _openExamSheet(List<ExamModel> exams) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      showDragHandle: true,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        Widget row(String label, String? slug) {
          final selected = slug == _selectedExamSlug;
          return ListTile(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            tileColor: selected ? PK.blueSoft : null,
            title: Text(
              label,
              style: TextStyle(fontSize: 14.5, fontWeight: selected ? FontWeight.w800 : FontWeight.w600, color: PK.text),
            ),
            trailing: selected ? const Icon(Icons.check_rounded, color: PK.blue) : null,
            onTap: () {
              Navigator.pop(ctx);
              setState(() {
                _selectedExamSlug = slug;
                _selectedExamTitle = slug == null ? null : label;
              });
            },
          );
        }

        return SafeArea(
          top: false,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.6),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
                  child: Text(
                    'Filter by exam',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: PK.text),
                  ),
                ),
                Flexible(
                  child: ListView(
                    shrinkWrap: true,
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
                    children: [
                      row('All exams', null),
                      for (final e in exams) row(e.title, e.slug.isNotEmpty ? e.slug : e.id),
                      if (exams.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Text('Exams could not be loaded right now.', style: TextStyle(color: PK.textMuted)),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ─── Featured ──────────────────────────────────────────────────────────────

  Widget _buildFeatured(TestSeriesModel s) {
    return InkWell(
      onTap: () => _open(s),
      borderRadius: BorderRadius.circular(PK.radius),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: PK.cardBox(),
        child: Row(
          children: [
            PKSeriesArt(
              title: s.title,
              examTitle: s.examTitle,
              slug: s.slug,
              imageUrl: s.bannerUrl ?? s.iconUrl,
              width: 118,
              height: 104,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const PKBadge('POPULAR', tone: PKBadgeTone.popular),
                  const SizedBox(height: 5),
                  Text(
                    s.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800, color: PK.text, letterSpacing: -0.2),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _label(s),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, color: PK.textMuted),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(child: _meta(s)),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: () => _open(s),
                        style: FilledButton.styleFrom(
                          backgroundColor: PK.blue,
                          minimumSize: const Size(0, 34),
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text('View Series', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
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

  // ─── List ──────────────────────────────────────────────────────────────────

  Widget _buildResultsHeader(int count, {bool isRemainder = false}) {
    final sortLabel = switch (_sort) {
      _Sort.popular => 'Popular',
      _Sort.mostTests => 'Most tests',
      _Sort.az => 'A–Z',
    };
    return Row(
      children: [
        Expanded(
          child: Text(
            isRemainder
                ? 'More test series ($count)'
                : '$count series${_selectedExamSlug != null && _selectedExamTitle != null ? ' · $_selectedExamTitle' : ''}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: PK.text),
          ),
        ),
        if (_hasActiveFilters)
          TextButton(
            onPressed: _clearFilters,
            style: TextButton.styleFrom(foregroundColor: PK.blue, minimumSize: const Size(44, 36)),
            child: const Text('Clear', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          ),
        PopupMenuButton<_Sort>(
          tooltip: 'Sort',
          initialValue: _sort,
          onSelected: (v) => setState(() => _sort = v),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          itemBuilder: (_) => const [
            PopupMenuItem(value: _Sort.popular, child: Text('Popular')),
            PopupMenuItem(value: _Sort.mostTests, child: Text('Most tests')),
            PopupMenuItem(value: _Sort.az, child: Text('A–Z')),
          ],
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.swap_vert_rounded, size: 18, color: PK.textMuted),
                const SizedBox(width: 2),
                Text(sortLabel, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: PK.text)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSeriesCard(TestSeriesModel s, {required bool showBadge}) {
    return InkWell(
      onTap: () => _open(s),
      borderRadius: BorderRadius.circular(PK.radius),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: PK.cardBox(),
        child: Row(
          children: [
            PKSeriesArt(
              title: s.title,
              examTitle: s.examTitle,
              slug: s.slug,
              imageUrl: s.bannerUrl ?? s.iconUrl,
              width: 76,
              height: 72,
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
                          s.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: PK.text, letterSpacing: -0.2),
                        ),
                      ),
                      const SizedBox(width: 6),
                      s.isPremium
                          ? const PKBadge('PAID', tone: PKBadgeTone.paid)
                          : const PKBadge('FREE', tone: PKBadgeTone.free),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Complete Test Series',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: PK.textMuted),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(child: _meta(s)),
                      if (showBadge) const PKBadge('POPULAR', tone: PKBadgeTone.popular),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right_rounded, color: PK.textFaint, size: 22),
          ],
        ),
      ),
    );
  }

  Widget _meta(TestSeriesModel s) {
    return Wrap(
      spacing: 10,
      runSpacing: 2,
      children: [
        PKMeta(Icons.description_outlined, '${s.testCount} ${s.testCount == 1 ? 'Test' : 'Tests'}'),
        if (s.questionCount > 0) PKMeta(Icons.help_outline_rounded, '${PK.formatCount(s.questionCount)} Qs'),
      ],
    );
  }

  String _label(TestSeriesModel s) => PK.seriesLabel(s.title, s.description, s.examTitle);

  void _open(TestSeriesModel s) => context.push('/test-series/${s.id}');

  List<Widget> _buildSkeleton() {
    Widget bar(double w, double h) => Container(
          width: w,
          height: h,
          decoration: BoxDecoration(color: const Color(0xFFEEF2F7), borderRadius: BorderRadius.circular(6)),
        );
    return [
      for (var i = 0; i < 4; i++) ...[
        if (i > 0) const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: PK.cardBox(),
          child: Row(
            children: [
              Container(
                width: 84,
                height: 76,
                decoration: BoxDecoration(color: const Color(0xFFEEF2F7), borderRadius: BorderRadius.circular(12)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [bar(150, 14), const SizedBox(height: 8), bar(110, 11), const SizedBox(height: 12), bar(90, 11)],
                ),
              ),
            ],
          ),
        ),
      ],
    ];
  }
}


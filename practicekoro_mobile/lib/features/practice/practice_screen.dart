import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';
import '../../data/models/subject_model.dart';
import '../../data/models/topic_model.dart';
import '../../data/repositories/catalog_repository.dart';
import 'practice_common.dart';

/// Screen 1: Practice — All Subjects & Chapters Search
/// Pure, focused subject and topic selection screen matching the reference UI,
/// with animated search bar (pulsing icon + rotating animated placeholder hints)
/// and dual search across Subjects and Chapters/Topics.
class PracticeScreen extends ConsumerStatefulWidget {
  const PracticeScreen({super.key});

  @override
  ConsumerState<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends ConsumerState<PracticeScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  String _searchQuery = '';
  String? _selectedCategory;

  late final AnimationController _iconAnimController;
  late final Animation<double> _iconScale;
  late final Animation<Color?> _iconColor;

  // Typewriter animation state
  Timer? _typingTimer;
  int _phraseIndex = 0;
  int _charIndex = 0;
  bool _isDeleting = false;
  String _displayedHint = '';

  static const List<String> _animatedHints = [
    'Search subjects & chapters...',
    'Search "History" or "ইতিহাস"...',
    'Search "Indus Valley Civilization"...',
    'Search "Indian Polity" or "সংবিধান"...',
    'Search "Physical Geography"...',
    'Search "General Science" or "বিজ্ঞান"...',
    'Search "Vedic Age" (বৈদিক যুগ)...',
    'Search "Percentage & Profit Loss"...',
    'Search "Ecology & Biodiversity"...',
    'Search "Mauryan Empire"...',
  ];

  @override
  void initState() {
    super.initState();
    _startTypewriter();

    _iconAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);

    _iconScale = Tween<double>(begin: 0.92, end: 1.08).animate(
      CurvedAnimation(parent: _iconAnimController, curve: Curves.easeInOut),
    );

    _iconColor = ColorTween(
      begin: const Color(0xFF64748B),
      end: UI.primary,
    ).animate(
      CurvedAnimation(parent: _iconAnimController, curve: Curves.easeInOut),
    );

    _focusNode.addListener(() {
      if (mounted) setState(() {});
    });
  }

  void _startTypewriter() {
    _typingTimer?.cancel();
    final interval = _isDeleting
        ? const Duration(milliseconds: 45)
        : const Duration(milliseconds: 95);

    _typingTimer = Timer.periodic(interval, (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_searchQuery.isNotEmpty) return;

      final currentPhrase = _animatedHints[_phraseIndex];

      if (!_isDeleting) {
        if (_charIndex < currentPhrase.length) {
          _charIndex++;
          setState(() {
            _displayedHint = currentPhrase.substring(0, _charIndex);
          });
        } else {
          // Finished typing phrase: pause so user can read it
          _typingTimer?.cancel();
          Future.delayed(const Duration(milliseconds: 1700), () {
            if (mounted && _searchQuery.isEmpty) {
              _isDeleting = true;
              _startTypewriter();
            }
          });
        }
      } else {
        if (_charIndex > 0) {
          _charIndex--;
          setState(() {
            _displayedHint = currentPhrase.substring(0, _charIndex);
          });
        } else {
          // Finished deleting: move to next phrase
          _isDeleting = false;
          _phraseIndex = (_phraseIndex + 1) % _animatedHints.length;
          _typingTimer?.cancel();
          Future.delayed(const Duration(milliseconds: 350), () {
            if (mounted && _searchQuery.isEmpty) {
              _startTypewriter();
            }
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _iconAnimController.dispose();
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final subjectsAsync = ref.watch(subjectsProvider);
    final topicsAsync = ref.watch(topicsProvider(null));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: RefreshIndicator(
        color: UI.primary,
        onRefresh: () async {
          ref.invalidate(subjectsProvider);
          ref.invalidate(topicsProvider(null));
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Non-sticky top header: Title + Search & Filter row
            SliverToBoxAdapter(
              child: Container(
                color: Colors.white,
                child: SafeArea(
                  bottom: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.fromLTRB(UI.gutter, 16, UI.gutter, 8),
                          child: Text(
                            'Practice',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                              letterSpacing: -0.3,
                            ),
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.fromLTRB(UI.gutter, 2, UI.gutter, 14),
                        child: Row(
                          children: [
                            Expanded(
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                height: 48,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: _focusNode.hasFocus
                                        ? UI.primary
                                        : const Color(0xFFE2E8F0),
                                    width: _focusNode.hasFocus ? 1.5 : 1.0,
                                  ),
                                  boxShadow: _focusNode.hasFocus
                                      ? [
                                          BoxShadow(
                                            color: UI.primary.withValues(alpha: 0.12),
                                            blurRadius: 8,
                                            offset: const Offset(0, 2),
                                          ),
                                        ]
                                      : null,
                                ),
                                child: Stack(
                                  alignment: Alignment.centerLeft,
                                  children: [
                                    // Typewriter typing animation hint placeholder (when empty)
                                    if (_searchQuery.isEmpty)
                                      Positioned(
                                        left: 44,
                                        right: 40,
                                        child: IgnorePointer(
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Flexible(
                                                child: Text(
                                                  _displayedHint,
                                                  style: const TextStyle(
                                                    fontSize: 14.5,
                                                    color: Color(0xFF94A3B8),
                                                    fontWeight: FontWeight.w400,
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              const _BlinkingCursor(),
                                            ],
                                          ),
                                        ),
                                      ),

                                    // Actual TextField
                                    TextField(
                                      controller: _searchController,
                                      focusNode: _focusNode,
                                      onChanged: (v) {
                                        final trimmed = v.trim().toLowerCase();
                                        setState(() => _searchQuery = trimmed);
                                        if (v.isEmpty && (_typingTimer == null || !_typingTimer!.isActive)) {
                                          _startTypewriter();
                                        }
                                      },
                                      style: const TextStyle(
                                        fontSize: 14.5,
                                        color: Color(0xFF0F172A),
                                        fontWeight: FontWeight.w500,
                                      ),
                                      decoration: InputDecoration(
                                        prefixIcon: ScaleTransition(
                                          scale: _iconScale,
                                          child: AnimatedBuilder(
                                            animation: _iconColor,
                                            builder: (context, child) => Icon(
                                              Icons.search_rounded,
                                              color: _focusNode.hasFocus
                                                  ? UI.primary
                                                  : _iconColor.value,
                                              size: 22,
                                            ),
                                          ),
                                        ),
                                        suffixIcon: _searchQuery.isNotEmpty
                                            ? IconButton(
                                                tooltip: 'Clear search',
                                                icon: const Icon(
                                                  Icons.clear_rounded,
                                                  size: 18,
                                                  color: Color(0xFF64748B),
                                                ),
                                                onPressed: () {
                                                  _searchController.clear();
                                                  setState(() => _searchQuery = '');
                                                  _startTypewriter();
                                                },
                                              )
                                            : null,
                                        border: InputBorder.none,
                                        contentPadding: const EdgeInsets.symmetric(
                                          horizontal: 14,
                                          vertical: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Semantics(
                              button: true,
                              label: 'Filter subjects',
                              child: InkWell(
                              onTap: () => _showFilterSheet(context),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: _selectedCategory != null
                                      ? UI.primary.withValues(alpha: 0.12)
                                      : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: _selectedCategory != null
                                        ? UI.primary
                                        : const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: Icon(
                                  Icons.tune_rounded,
                                  color: _selectedCategory != null
                                      ? UI.primary
                                      : const Color(0xFF475569),
                                  size: 22,
                                ),
                              ),
                            ),
                            ),
                          ],
                        ),
                      ),
                      const Divider(height: 1, thickness: 1, color: Color(0xFFE2E8F0)),
                    ],
                  ),
                ),
              ),
            ),

            // Subjects and Topics Slivers
            ...subjectsAsync.when(
              loading: () => [
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: UILoading()),
                ),
              ],
              error: (_, _) => [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: UIMessage.error(
                      message: 'Could not load subjects.',
                      onAction: () {
                        ref.invalidate(subjectsProvider);
                        ref.invalidate(topicsProvider(null));
                      },
                    ),
                  ),
                ),
              ],
              data: (subjects) {
                final allTopics = topicsAsync.value ?? const <TopicModel>[];
                final subjectMap = {for (final s in subjects) s.id: s};

                SubjectModel? findParentSubject(TopicModel topic) {
                  if (topic.subjectId.isNotEmpty &&
                      subjectMap.containsKey(topic.subjectId)) {
                    return subjectMap[topic.subjectId];
                  }
                  for (final s in subjects) {
                    final sSlug = s.slug.toLowerCase();
                    final tSub = topic.subjectId.toLowerCase();
                    if (tSub.contains(sSlug) || sSlug.contains(tSub)) return s;
                    if (tSub.contains('hist') && sSlug.contains('hist')) return s;
                    if (tSub.contains('geo') && sSlug.contains('geo')) return s;
                    if (tSub.contains('polity') && sSlug.contains('polity')) {
                      return s;
                    }
                    if (tSub.contains('sci') && sSlug.contains('sci')) return s;
                    if (tSub.contains('math') && sSlug.contains('math')) return s;
                    if (tSub.contains('econ') && sSlug.contains('econ')) return s;
                    if (tSub.contains('env') && sSlug.contains('env')) return s;
                    if (tSub.contains('gk') && sSlug.contains('gk')) return s;
                    if (tSub.contains('ca') && sSlug.contains('ca')) return s;
                  }
                  return null;
                }

                // If not searching, show regular subject list with category filter
                if (_searchQuery.isEmpty) {
                  final filtered = subjects.where((s) {
                    if (_selectedCategory == null) return true;
                    final slug = s.slug.toLowerCase();
                    if (_selectedCategory == 'gs') {
                      return slug.contains('history') ||
                          slug.contains('geo') ||
                          slug.contains('polity') ||
                          slug.contains('econ') ||
                          slug.contains('gk') ||
                          slug.contains('ca');
                    }
                    if (_selectedCategory == 'sci') {
                      return slug.contains('sci') || slug.contains('env');
                    }
                    if (_selectedCategory == 'quant') {
                      return slug.contains('math');
                    }
                    return true;
                  }).toList();

                  if (filtered.isEmpty) {
                    return [
                      const SliverFillRemaining(
                        hasScrollBody: false,
                        child: Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: UIMessage(
                              icon: Icons.filter_alt_off_rounded,
                              title: 'No subjects in this category',
                              message:
                                  'Try resetting the filter to see all subjects.',
                            ),
                          ),
                        ),
                      ),
                    ];
                  }

                  return [
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(
                        UI.gutter,
                        16,
                        UI.gutter,
                        100,
                      ),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final subject = filtered[index];
                            final color = _getSubjectColor(index, subject.nameEnglish);
                            final subjectChapters = topicsForSubject(allTopics, subject);

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _SubjectListCard(
                                subject: subject,
                                color: color,
                                chapters: subjectChapters,
                                onOpenFull: () {
                                  context.push(
                                    '/topic-tests?subjectId=${subject.id}&subject=${Uri.encodeQueryComponent(subject.nameEnglish)}',
                                  );
                                },
                              ),
                            );
                          },
                          childCount: filtered.length,
                        ),
                      ),
                    ),
                  ];
                }

                // Searching: Search both Subjects and Topics
                final matchingSubjects = subjects.where((s) {
                  final q = _searchQuery;
                  return s.nameEnglish.toLowerCase().contains(q) ||
                      s.nameBengali.toLowerCase().contains(q) ||
                      s.slug.toLowerCase().contains(q);
                }).toList();

                final matchingTopics = allTopics.where((t) {
                  final q = _searchQuery;
                  return t.title.toLowerCase().contains(q) ||
                      (t.titleBengali != null &&
                          t.titleBengali!.toLowerCase().contains(q)) ||
                      t.slug.toLowerCase().contains(q);
                }).toList();

                if (matchingSubjects.isEmpty && matchingTopics.isEmpty) {
                  return [
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: UIMessage(
                            icon: Icons.search_off_rounded,
                            title: 'No results found',
                            message:
                                'No subjects or chapters match "$_searchQuery".',
                          ),
                        ),
                      ),
                    ),
                  ];
                }

                return [
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(
                      UI.gutter,
                      16,
                      UI.gutter,
                      100,
                    ),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        // Matching Subjects section
                        if (matchingSubjects.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.only(bottom: 10, top: 4),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.school_outlined,
                                  size: 16,
                                  color: Color(0xFF64748B),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'SUBJECTS (${matchingSubjects.length})',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          for (int i = 0; i < matchingSubjects.length; i++)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _SubjectListCard(
                                subject: matchingSubjects[i],
                                color: _getSubjectColor(
                                  i,
                                  matchingSubjects[i].nameEnglish,
                                ),
                                chapters: topicsForSubject(allTopics, matchingSubjects[i]),
                                onOpenFull: () {
                                  context.push(
                                    '/topic-tests?subjectId=${matchingSubjects[i].id}&subject=${Uri.encodeQueryComponent(matchingSubjects[i].nameEnglish)}',
                                  );
                                },
                              ),
                            ),
                        ],

                        // Matching Topics / Chapters section
                        if (matchingTopics.isNotEmpty) ...[
                          Padding(
                            padding: EdgeInsets.only(
                              bottom: 10,
                              top: matchingSubjects.isNotEmpty ? 16 : 4,
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.menu_book_rounded,
                                  size: 16,
                                  color: Color(0xFF64748B),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'CHAPTERS & TOPICS (${matchingTopics.length})',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          for (final topic in matchingTopics)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _TopicSearchResultCard(
                                topic: topic,
                                parentSubject: findParentSubject(topic),
                                onTap: () {
                                  context.push(
                                    '/topic/${topic.id}/tests?title=${Uri.encodeQueryComponent(topic.title)}',
                                  );
                                },
                              ),
                            ),
                        ],
                      ]),
                    ),
                  ),
                ];
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Filter Subjects',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    if (_selectedCategory != null)
                      TextButton(
                        onPressed: () {
                          setState(() => _selectedCategory = null);
                          Navigator.pop(context);
                        },
                        child: const Text('Reset'),
                      ),
                  ],
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _filterChip('All Subjects', null),
                    _filterChip('General Studies', 'gs'),
                    _filterChip('Science & Tech', 'sci'),
                    _filterChip('Quantitative', 'quant'),
                  ],
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _filterChip(String label, String? category) {
    final isSelected = _selectedCategory == category;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) {
        setState(() => _selectedCategory = category);
        Navigator.pop(context);
      },
      selectedColor: UI.primary.withValues(alpha: 0.15),
      labelStyle: TextStyle(
        color: isSelected ? UI.primary : const Color(0xFF475569),
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
      ),
      backgroundColor: const Color(0xFFF1F5F9),
      side: BorderSide(
        color: isSelected ? UI.primary : const Color(0xFFE2E8F0),
      ),
    );
  }
}

Color _getSubjectColor(int index, String name) {
  final lower = name.toLowerCase();
  if (lower.contains('history')) return const Color(0xFFD97706); // Amber
  if (lower.contains('geo')) return const Color(0xFF0D9488); // Teal
  if (lower.contains('polity')) return const Color(0xFF7C3AED); // Purple
  if (lower.contains('econ')) return const Color(0xFF2563EB); // Blue
  if (lower.contains('sci')) return const Color(0xFF059669); // Emerald
  if (lower.contains('current')) return const Color(0xFFEA580C); // Orange
  if (lower.contains('env')) return const Color(0xFF16A34A); // Green
  if (lower.contains('math')) return const Color(0xFF4F46E5); // Indigo
  return UI.paletteAt(index);
}

/// Subject Card matching Screen 1 in reference image:
/// - Rounded squircle icon with soft pastel tint
/// - Subject English & Bengali names
/// - Chapters & Tests count in subtitle
/// - Expandable inline accordion to preview syllabus chapters directly
/// - Direct tap-to-practice test runner on individual chapters
/// - Dedicated button to open full Subject Chapter screen
class _SubjectListCard extends StatelessWidget {
  final SubjectModel subject;
  final Color color;
  final List<TopicModel> chapters;
  final VoidCallback? onOpenFull;

  const _SubjectListCard({
    required this.subject,
    required this.color,
    this.chapters = const [],
    this.onOpenFull,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveChapterCount = subject.chapterCount > 0
        ? subject.chapterCount
        : chapters.length;
    final chapterText = '$effectiveChapterCount Chapters';
    final testText = subject.totalTests > 0
        ? '${subject.totalTests} Tests'
        : 'Mock Tests';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1.1,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            if (onOpenFull != null) {
              onOpenFull!();
            } else {
              context.push(
                '/topic-tests?subjectId=${subject.id}&subject=${Uri.encodeQueryComponent(subject.nameEnglish)}',
              );
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                // Pastel squircle icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    subjectIcon(subject.nameEnglish),
                    color: color,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),

                // Subject Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              subject.nameEnglish,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (subject.nameBengali.isNotEmpty &&
                              subject.nameBengali != subject.nameEnglish) ...[
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                '(${subject.nameBengali})',
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF64748B),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '$chapterText • $testText',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),

                // Forward chevron indicating direct navigation to chapters page
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.arrow_forward_ios_rounded,
                    color: Color(0xFF64748B),
                    size: 13,
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

/// Chapter / Topic Search Result Card
/// Displays topic title, Bengali name, parent subject tag pill, test count, and progress
class _TopicSearchResultCard extends StatelessWidget {
  final TopicModel topic;
  final SubjectModel? parentSubject;
  final VoidCallback onTap;

  const _TopicSearchResultCard({
    required this.topic,
    this.parentSubject,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final subjectName = parentSubject?.nameEnglish ?? 'Chapter';
    final subjectColor = parentSubject != null
        ? _getSubjectColor(0, subjectName)
        : const Color(0xFF016BFC);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.1),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Chapter squircle icon
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: subjectColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                Icons.menu_book_rounded,
                color: subjectColor,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),

            // Topic Information
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          topic.title,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F172A),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (topic.isWeak) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'Weak',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFFEF4444),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (topic.titleBengali != null &&
                      topic.titleBengali!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      topic.titleBengali!,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      // Parent subject pill badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: subjectColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          subjectName,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: subjectColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        topic.totalTests > 0
                            ? '${topic.totalTests} Tests'
                            : 'Mock Tests',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (topic.progress > 0) ...[
                        const SizedBox(width: 6),
                        const Text(
                          '•',
                          style: TextStyle(color: Color(0xFF94A3B8)),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${(topic.progress * 100).round()}% done',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF16A34A),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(width: 8),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF94A3B8),
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}

class _BlinkingCursor extends StatefulWidget {
  const _BlinkingCursor();

  @override
  State<_BlinkingCursor> createState() => _BlinkingCursorState();
}

class _BlinkingCursorState extends State<_BlinkingCursor>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _controller,
      child: const Text(
        '|',
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: Color(0xFF0158FC),
          height: 1.0,
        ),
      ),
    );
  }
}

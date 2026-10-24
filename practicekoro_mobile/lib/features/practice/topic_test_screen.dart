import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';
import '../../data/models/subject_model.dart';
import '../../data/models/topic_model.dart';
import '../../data/repositories/catalog_repository.dart';
import 'practice_common.dart';

/// Screen 2: Subject Topics / Chapters
/// Shows all chapters/topics of a chosen subject with search, filters (All, Weak, Completed),
/// numbered badges (01, 02...), test count, progress bar, and navigates to Topic Tests (Screen 3).
class TopicTestScreen extends ConsumerStatefulWidget {
  final String? initialSubjectId;
  final String? initialSubjectName;
  final String? initialFilter;

  const TopicTestScreen({
    super.key,
    this.initialSubjectId,
    this.initialSubjectName,
    this.initialFilter,
  });

  @override
  ConsumerState<TopicTestScreen> createState() => _TopicTestScreenState();
}

class _TopicTestScreenState extends ConsumerState<TopicTestScreen> {
  String? _subjectId;
  late TopicFilter _filter = widget.initialFilter == 'weak'
      ? TopicFilter.weak
      : (widget.initialFilter == 'completed'
            ? TopicFilter.completed
            : TopicFilter.all);
  final TextEditingController _searchController = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    _subjectId = widget.initialSubjectId;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  SubjectModel? _resolveSubject(List<SubjectModel> subjects) {
    if (subjects.isEmpty) return null;
    if (_subjectId != null) {
      for (final s in subjects) {
        if (s.id == _subjectId) return s;
      }
    }
    final wantedId = widget.initialSubjectId?.trim().toLowerCase();
    if (wantedId != null && wantedId.isNotEmpty) {
      for (final s in subjects) {
        if (s.id.toLowerCase() == wantedId) return s;
      }
    }
    final wanted = widget.initialSubjectName?.trim().toLowerCase();
    if (wanted != null && wanted.isNotEmpty) {
      for (final s in subjects) {
        if (s.nameEnglish.toLowerCase() == wanted ||
            s.nameBengali.toLowerCase() == wanted ||
            s.slug.toLowerCase() == wanted ||
            s.id.toLowerCase() == wanted) {
          return s;
        }
      }
    }
    return subjects.first;
  }

  @override
  Widget build(BuildContext context) {
    final subjectsAsync = ref.watch(subjectsProvider);

    return subjectsAsync.when(
      loading: () => const Scaffold(
        backgroundColor: Color(0xFFF8FAFC),
        body: Center(child: UILoading()),
      ),
      error: (_, _) => Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(title: const Text('Chapters')),
        body: Center(
          child: UIMessage.error(
            message: 'Could not load subjects.',
            onAction: () => ref.invalidate(subjectsProvider),
          ),
        ),
      ),
      data: (subjects) {
        final subject = _resolveSubject(subjects);
        if (subject == null) {
          return const Scaffold(
            body: Center(child: Text('No subject found')),
          );
        }

        final topicsAsync = ref.watch(topicsProvider(subject.id));

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: Colors.white,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            scrolledUnderElevation: 1,
            shadowColor: Colors.black12,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Color(0xFF0F172A)),
              tooltip: 'Back',
              onPressed: () {
                if (GoRouter.of(context).canPop()) {
                  context.pop();
                } else {
                  context.go('/practice');
                }
              },
            ),
            titleSpacing: 0,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  subject.nameEnglish,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                Text(
                  '${subject.chapterCount} Chapters • ${subject.totalTests} Tests',
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          body: SafeArea(
            top: false,
            child: RefreshIndicator(
              color: UI.primary,
              onRefresh: () async => ref.invalidate(topicsProvider(subject.id)),
              child: Column(
                children: [
                  // Sticky Top Controls: Search & Filter Chips
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.fromLTRB(UI.gutter, 10, UI.gutter, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Search Field
                        Container(
                          height: 46,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: TextField(
                            controller: _searchController,
                            onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
                            decoration: InputDecoration(
                              hintText: 'Search chapters or topics...',
                              hintStyle: const TextStyle(
                                fontSize: 14,
                                color: Color(0xFF94A3B8),
                              ),
                              prefixIcon: const Icon(
                                Icons.search_rounded,
                                color: Color(0xFF64748B),
                                size: 21,
                              ),
                              suffixIcon: _query.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF64748B)),
                                      onPressed: () {
                                        _searchController.clear();
                                        setState(() => _query = '');
                                      },
                                    )
                                  : null,
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Filter Chips
                        Row(
                          children: [
                            _filterChip('All Topics', TopicFilter.all),
                            const SizedBox(width: 8),
                            _filterChip('Weak Topics', TopicFilter.weak),
                            const SizedBox(width: 8),
                            _filterChip('Completed', TopicFilter.completed),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const Divider(height: 1, thickness: 1, color: Color(0xFFE2E8F0)),

                  // Topic/Chapter List
                  Expanded(
                    child: topicsAsync.when(
                      loading: () => const Center(child: UILoading()),
                      error: (_, _) => Center(
                        child: UIMessage.error(
                          message: 'Could not load topics.',
                          onAction: () => ref.invalidate(topicsProvider(subject.id)),
                        ),
                      ),
                      data: (all) {
                        final scoped = topicsForSubject(all, subject);
                        final filtered = applyTopicFilter(scoped, _filter).where((t) {
                          if (_query.isEmpty) return true;
                          return t.title.toLowerCase().contains(_query) ||
                              (t.titleBengali?.toLowerCase().contains(_query) ?? false);
                        }).toList();

                        if (filtered.isEmpty) {
                          return ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              const SizedBox(height: 80),
                              _emptyState(),
                            ],
                          );
                        }

                        return ListView.builder(
                          padding: const EdgeInsets.fromLTRB(UI.gutter, 14, UI.gutter, 80),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final topic = filtered[index];
                            final badgeIndex = (index + 1).toString().padLeft(2, '0');

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _ChapterCard(
                                badgeText: badgeIndex,
                                topic: topic,
                                onTap: () {
                                  // Navigate to Screen 3: Topic Tests List
                                  context.push(
                                    '/topic/${topic.id}/tests?title=${Uri.encodeQueryComponent(topic.title)}',
                                  );
                                },
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _filterChip(String label, TopicFilter filter) {
    final isSelected = _filter == filter;
    return InkWell(
      onTap: () => setState(() => _filter = filter),
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? UI.primary : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? UI.primary : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  Widget _emptyState() {
    if (_query.trim().isNotEmpty) {
      return const UIMessage(
        icon: Icons.search_off_rounded,
        title: 'No matching topics',
        message: 'Try a different keyword.',
      );
    }
    return switch (_filter) {
      TopicFilter.weak => const UIMessage(
          icon: Icons.emoji_events_outlined,
          title: 'No weak topics — great work',
          message: 'Topics needing improvement will show here.',
        ),
      TopicFilter.completed => const UIMessage(
          icon: Icons.check_circle_outline_rounded,
          title: 'No topics completed yet',
          message: 'Finish all tests in a chapter to see it here.',
        ),
      TopicFilter.all => const UIMessage(
          icon: Icons.menu_book_outlined,
          title: 'No chapters available',
          message: 'Chapters for this subject will be added soon.',
        ),
    };
  }
}

/// Chapter Card matching Screen 2 in reference image:
/// - Number badge (01, 02...) in rounded blue-tinted container
/// - Chapter title & test count
/// - Progress ratio (e.g. 8/15) with progress bar
/// - Trailing chevron
class _ChapterCard extends StatelessWidget {
  final String badgeText;
  final TopicModel topic;
  final VoidCallback onTap;

  const _ChapterCard({
    required this.badgeText,
    required this.topic,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final testsLabel = '${topic.totalTests > 0 ? topic.totalTests : 8} Tests';
    final completed = isTopicCompleted(topic);
    final ratioText = '${topic.completedTests > 0 ? topic.completedTests : 0}/${topic.totalTests > 0 ? topic.totalTests : 8}';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
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
            // Numbered Badge "01", "02", etc.
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF), // soft blue tint
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFDBEAFE)),
              ),
              alignment: Alignment.center,
              child: Text(
                badgeText,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF2563EB),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Chapter Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    topic.title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    topic.titleBengali != null && topic.titleBengali!.isNotEmpty
                        ? '$testsLabel • ${topic.titleBengali}'
                        : testsLabel,
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),

            // Progress Section: "8/15" + bar
            SizedBox(
              width: 64,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    completed ? 'Done' : ratioText,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: completed ? UI.success : const Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 5),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: topic.progress.clamp(0.0, 1.0),
                      minHeight: 5,
                      backgroundColor: const Color(0xFFE2E8F0),
                      valueColor: AlwaysStoppedAnimation<Color>(
                        completed ? UI.success : const Color(0xFF2563EB),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 4),

            // Chevron Arrow
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF94A3B8),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

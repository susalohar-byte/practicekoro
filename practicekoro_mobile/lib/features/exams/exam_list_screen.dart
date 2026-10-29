import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';
import '../../data/models/exam_model.dart';
import '../../data/repositories/catalog_repository.dart';

const _allExams = '__all__';
const _otherExams = '__other__';

/// Exams tab: search, category filters, one card per exam.
class ExamListScreen extends ConsumerStatefulWidget {
  const ExamListScreen({super.key});

  @override
  ConsumerState<ExamListScreen> createState() => _ExamListScreenState();
}

class _ExamListScreenState extends ConsumerState<ExamListScreen> {
  final _search = TextEditingController();
  final _focusNode = FocusNode();
  String _query = '';
  String _category = _allExams;

  // Typewriter animation state
  Timer? _typingTimer;
  int _phraseIndex = 0;
  int _charIndex = 0;
  bool _isDeleting = false;
  String _displayedHint = '';

  static const List<String> _typingPhrases = [
    'Search exams...',
    'Search "WBP Constable"...',
    'Search "WBPSC"...',
    'Search "Railway"...',
    'Search "Food SI"...',
    'Search "Primary TET"...',
    'Search "KP Police SI"...',
  ];

  @override
  void initState() {
    super.initState();
    _startTypewriter();
    _focusNode.addListener(() {
      if (mounted) setState(() {});
    });
  }

  void _startTypewriter() {
    _displayedHint = '';
    _charIndex = 0;
    _isDeleting = false;

    _typingTimer = Timer.periodic(const Duration(milliseconds: 110), (timer) {
      if (!mounted) return;
      if (_query.isNotEmpty) return; // Paused while user types

      final currentPhrase = _typingPhrases[_phraseIndex];

      setState(() {
        if (!_isDeleting) {
          if (_charIndex < currentPhrase.length) {
            _charIndex++;
            _displayedHint = currentPhrase.substring(0, _charIndex);
          } else {
            // Finished typing phrase: pause before deleting
            _typingTimer?.cancel();
            Future.delayed(const Duration(milliseconds: 1600), () {
              if (mounted) {
                _isDeleting = true;
                _startTypewriter();
              }
            });
          }
        } else {
          if (_charIndex > 0) {
            _charIndex--;
            _displayedHint = currentPhrase.substring(0, _charIndex);
          } else {
            // Finished deleting: move to next phrase
            _isDeleting = false;
            _phraseIndex = (_phraseIndex + 1) % _typingPhrases.length;
            _typingTimer?.cancel();
            Future.delayed(const Duration(milliseconds: 350), () {
              if (mounted) {
                _startTypewriter();
              }
            });
          }
        }
      });
    });
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _search.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final examsAsync = ref.watch(examsProvider);

    return Scaffold(
      backgroundColor: UI.page,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: UI.primary,
          onRefresh: () async {
            ref.read(catalogRepositoryProvider).clearExamsCache();
            ref.invalidate(examsProvider);
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(UI.gutter, 10, UI.gutter, 96),
            children: [
              // Top Non-sticky Title (Middle alignment)
              const Center(
                child: Padding(
                  padding: EdgeInsets.only(top: 4, bottom: 16),
                  child: Text(
                    'Exams',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.3,
                    ),
                  ),
                ),
              ),
              // Custom Rounded Search Bar with Typewriter Animation
        Container(
          height: 50,
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: _focusNode.hasFocus
                  ? const Color(0xFF0158FC)
                  : const Color(0xFFCBD5E1),
              width: _focusNode.hasFocus ? 1.6 : 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: _focusNode.hasFocus
                    ? const Color(0xFF0158FC).withValues(alpha: 0.10)
                    : const Color(0xFF1E293B).withValues(alpha: 0.04),
                blurRadius: _focusNode.hasFocus ? 10 : 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              const SizedBox(width: 14),
              Icon(
                Icons.search_rounded,
                size: 22,
                color: _focusNode.hasFocus
                    ? const Color(0xFF0158FC)
                    : const Color(0xFF64748B),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Stack(
                  alignment: Alignment.centerLeft,
                  children: [
                    // Typewriter Hint Animation
                    if (_query.isEmpty)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              _displayedHint,
                              style: const TextStyle(
                                fontSize: 15,
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
                    TextField(
                      controller: _search,
                      focusNode: _focusNode,
                      style: const TextStyle(
                        fontSize: 15,
                        color: Color(0xFF0B1F44),
                        fontWeight: FontWeight.w500,
                      ),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                      onChanged: (v) => setState(() => _query = v.trim()),
                    ),
                  ],
                ),
              ),
              if (_query.isNotEmpty)
                IconButton(
                  icon: const Icon(
                    Icons.close_rounded,
                    size: 20,
                    color: Color(0xFF64748B),
                  ),
                  onPressed: () {
                    _search.clear();
                    setState(() => _query = '');
                  },
                )
              else
                const SizedBox(width: 14),
            ],
          ),
        ),
        const SizedBox(height: 12),
        examsAsync.when(
          loading: () => const UILoading(),
          error: (_, _) => UIMessage.error(
            message: 'Could not load exams.',
            onAction: () => ref.invalidate(examsProvider),
          ),
          data: _buildExams,
        ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExams(List<ExamModel> exams) {
    if (exams.isEmpty) {
      return const UIMessage(
        icon: Icons.menu_book_outlined,
        title: 'No exams yet',
        message: 'Exams will appear here once they are added.',
      );
    }

    // Filters come from the categories the exams actually have.
    final keys = <String>[];
    for (final exam in exams) {
      final key = _categoryKey(exam.category);
      if (!keys.contains(key)) keys.add(key);
    }
    keys.sort((a, b) => a == _otherExams ? 1 : (b == _otherExams ? -1 : 0));
    final category = keys.contains(_category) ? _category : _allExams;

    final query = _query.toLowerCase();
    final shown = exams.where((exam) {
      if (category != _allExams && _categoryKey(exam.category) != category) {
        return false;
      }
      if (query.isEmpty) return true;
      return exam.title.toLowerCase().contains(query) ||
          (exam.description ?? '').toLowerCase().contains(query);
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (keys.length > 1) ...[
          UIChips<String>(
            options: [
              (_allExams, 'All Exams'),
              for (final key in keys) (key, _categoryLabel(key)),
            ],
            value: category,
            onChanged: (v) => setState(() => _category = v),
          ),
          const SizedBox(height: 14),
        ],
        if (shown.isEmpty)
          const UIMessage(
            icon: Icons.search_off_rounded,
            title: 'No exams match',
            message: 'Try a different name or filter.',
          )
        else
          for (final exam in shown)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _ExamCard(exam: exam),
            ),
      ],
    );
  }

  static String _categoryKey(String? raw) {
    final value = raw?.trim().toLowerCase() ?? '';
    return value.isEmpty ? _otherExams : value;
  }

  static String _categoryLabel(String key) {
    if (key == _otherExams) return 'Other';
    if (key.contains('state')) return 'State Govt';
    if (key.contains('central')) return 'Central Govt';
    if (key.contains('rail')) return 'Railway';
    if (key.contains('bank')) return 'Banking';
    if (key.contains('teach') || key.contains('tet')) return 'Teaching';
    return key
        .split(RegExp(r'[\s_-]+'))
        .where((w) => w.isNotEmpty)
        .map((w) => w[0].toUpperCase() + w.substring(1))
        .join(' ');
  }
}

class _ExamCard extends StatelessWidget {
  final ExamModel exam;

  const _ExamCard({required this.exam});

  @override
  Widget build(BuildContext context) {
    final subtitle = exam.effectiveDescription;
    final testsCount = exam.effectiveTotalTests;
    final customIcon = exam.iconName?.trim();
    final hasCustomIcon = customIcon != null &&
        customIcon.isNotEmpty &&
        (customIcon.startsWith('http://') || customIcon.startsWith('https://'));

    return UICard(
      onTap: () => context.push('/exams/${exam.id}'),
      padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
      child: Row(
        children: [
          if (hasCustomIcon) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                customIcon,
                width: 44,
                height: 44,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => const SizedBox.shrink(),
              ),
            ),
            const SizedBox(width: 14),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Line 1: Exam Title (e.g. WBP Constable, WBPSC)
                Text(
                  exam.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                // Line 2: Subtitle / Authority Name (e.g. West Bengal Police)
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    color: Color(0xFF64748B),
                    height: 1.25,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                // Line 3: Test Count (e.g. 120 Tests)
                Text(
                  '$testsCount Tests',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.1,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 22),
        ],
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

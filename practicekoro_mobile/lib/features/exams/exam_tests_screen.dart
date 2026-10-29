import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/test_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/repositories/profile_repository.dart';

/// Available test filter tabs
const _filterTabs = ['All Tests', 'Full Test', 'Topic Test', 'PYQ'];

/// One exam's tests screen: header, 4 tabs (All Tests, Full Test, Topic Test, PYQ), test cards.
class ExamTestsScreen extends ConsumerStatefulWidget {
  final String examId;

  const ExamTestsScreen({super.key, required this.examId});

  @override
  ConsumerState<ExamTestsScreen> createState() => _ExamTestsScreenState();
}

class _ExamTestsScreenState extends ConsumerState<ExamTestsScreen> {
  String _selectedTab = 'All Tests';

  @override
  Widget build(BuildContext context) {
    final exams = ref.watch(examsProvider).asData?.value ?? const <ExamModel>[];
    final matches = exams.where((e) => e.id == widget.examId);
    final exam = matches.isEmpty ? null : matches.first;
    final testsAsync = ref.watch(mockTestsProvider(widget.examId));
    final firstTest = testsAsync.asData?.value.firstOrNull;
    final examTitle = exam?.title ?? firstTest?.examTitle ?? 'Exam Tests';

    return Scaffold(
      backgroundColor: UI.page,
      body: SafeArea(
        child: RefreshIndicator(
          color: UI.primary,
          onRefresh: () async => ref.invalidate(mockTestsProvider(widget.examId)),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(UI.gutter, 10, UI.gutter, 100),
            children: [
              // Top Non-sticky Navigation Row: Back Button + Exam Title (Middle alignment)
              Padding(
                padding: const EdgeInsets.only(top: 4, bottom: 12),
                child: SizedBox(
                  height: 44,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Center(
                        child: Text(
                          examTitle,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                            letterSpacing: -0.3,
                          ),
                        ),
                      ),
                      Positioned(
                        left: 0,
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Color(0xFF0F172A)),
                          tooltip: 'Back',
                          onPressed: () {
                            if (GoRouter.of(context).canPop()) {
                              context.pop();
                            } else {
                              context.go('/exams');
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              _ExamHeader(
                exam: exam,
                title: examTitle,
                logo: firstTest?.examLogo,
                totalTestsCount: testsAsync.asData?.value.length ?? 0,
              ),
              const SizedBox(height: 16),
              testsAsync.when(
                loading: () => const UILoading(),
                error: (_, _) => UIMessage.error(
                  message: 'Could not load tests.',
                  onAction: () => ref.invalidate(mockTestsProvider(widget.examId)),
                ),
                data: _buildTests,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTests(List<MockTestModel> tests) {
    if (tests.isEmpty) {
      return const UIMessage(
        icon: Icons.assignment_outlined,
        title: 'No tests yet',
        message: 'Tests for this exam will appear here soon.',
      );
    }

    // Counts for each tab
    final totalCount = tests.length;
    final fullTestCount = tests
        .where((t) => t.normalizedCategory == 'Full Test')
        .length;
    final topicTestCount = tests
        .where((t) => t.normalizedCategory == 'Topic Test')
        .length;
    final pyqCount = tests.where((t) => t.normalizedCategory == 'PYQ').length;

    // Filter tests by selected tab
    final shown = tests.where((t) {
      if (_selectedTab == 'All Tests') return true;
      return t.normalizedCategory == _selectedTab;
    }).toList();

    final isPro = ref.watch(studentProfileProvider).isPro;

    // Lock state: if user is Pro, unlock all! Otherwise, first free test is open and pro tests are locked
    final firstOpen = shown.where((e) => !e.isPro).firstOrNull;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 4 Filter Tabs: All Tests, Full Test, Topic Test, PYQ
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: [
              for (final tab in _filterTabs) ...[
                _FilterTabPill(
                  title: tab,
                  count: tab == 'All Tests'
                      ? totalCount
                      : tab == 'Full Test'
                      ? fullTestCount
                      : tab == 'Topic Test'
                      ? topicTestCount
                      : pyqCount,
                  isSelected: _selectedTab == tab,
                  icon: tab == 'All Tests'
                      ? Icons.grid_view_rounded
                      : tab == 'Full Test'
                      ? Icons.assignment_rounded
                      : tab == 'Topic Test'
                      ? Icons.category_rounded
                      : Icons.history_edu_rounded,
                  onTap: () => setState(() => _selectedTab = tab),
                ),
                const SizedBox(width: 8),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Tests List or Empty State
        if (shown.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.assignment_late_outlined,
                    color: Color(0xFF2563EB),
                    size: 28,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'No $_selectedTab available yet',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Tests for this category will be uploaded soon.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                UIButton(
                  'View All Tests',
                  expand: false,
                  height: 38,
                  onPressed: () => setState(() => _selectedTab = 'All Tests'),
                ),
              ],
            ),
          )
        else
          for (var n = 0; n < shown.length; n++)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _TestCard(
                number: n + 1,
                test: shown[n],
                locked: !isPro && shown[n].isPro && shown[n].id != firstOpen?.id,
              ),
            ),
      ],
    );
  }
}

class _FilterTabPill extends StatelessWidget {
  final String title;
  final int count;
  final bool isSelected;
  final IconData icon;
  final VoidCallback onTap;

  const _FilterTabPill({
    required this.title,
    required this.count,
    required this.isSelected,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF2563EB) : Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF2563EB)
                  : const Color(0xFFE2E8F0),
              width: 1.2,
            ),
            boxShadow: isSelected
                ? const [
                    BoxShadow(
                      color: Color(0x332563EB),
                      blurRadius: 8,
                      offset: Offset(0, 3),
                    ),
                  ]
                : const [
                    BoxShadow(
                      color: Color(0x06000000),
                      blurRadius: 4,
                      offset: Offset(0, 1),
                    ),
                  ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 15,
                color: isSelected ? Colors.white : const Color(0xFF64748B),
              ),
              const SizedBox(width: 6),
              Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? Colors.white : const Color(0xFF334155),
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white.withValues(alpha: 0.22)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: isSelected ? Colors.white : const Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ExamHeader extends StatelessWidget {
  final ExamModel? exam;
  final String? title;
  final String? logo;
  final int totalTestsCount;

  const _ExamHeader({
    required this.exam,
    required this.title,
    required this.logo,
    required this.totalTestsCount,
  });

  @override
  Widget build(BuildContext context) {
    final exam = this.exam;
    final description = exam?.description?.trim() ?? 'State Competitive Exam';
    final count = totalTestsCount > 0
        ? totalTestsCount
        : (exam?.totalTests ?? 0);
    final questions = exam != null && exam.totalQuestions > 0
        ? '${exam.totalQuestions} Questions'
        : null;

    final String? examLogo = logo;
    final hasLogo = examLogo != null &&
        (examLogo.startsWith('http://') || examLogo.startsWith('https://'));
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          if (hasLogo) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                examLogo,
                width: 56,
                height: 56,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => const SizedBox.shrink(),
              ),
            ),
            const SizedBox(width: 14),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title ?? 'Mock Tests',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    _MiniBadge(
                      label: '$count Tests',
                      color: const Color(0xFF2563EB),
                      backgroundColor: const Color(0xFFEFF6FF),
                    ),
                    if (questions != null)
                      _MiniBadge(
                        label: questions,
                        color: const Color(0xFF475569),
                        backgroundColor: const Color(0xFFF1F5F9),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color backgroundColor;

  const _MiniBadge({
    required this.label,
    required this.color,
    required this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

class _TestCard extends StatelessWidget {
  final int number;
  final MockTestModel test;
  final bool locked;

  const _TestCard({
    required this.number,
    required this.test,
    required this.locked,
  });

  Color _categoryColor() {
    switch (test.normalizedCategory) {
      case 'PYQ':
        return const Color(0xFFD97706);
      case 'Topic Test':
        return const Color(0xFF7C3AED);
      case 'Full Test':
      default:
        return const Color(0xFF2563EB);
    }
  }

  Color _categoryBgColor() {
    switch (test.normalizedCategory) {
      case 'PYQ':
        return const Color(0xFFFEF3C7);
      case 'Topic Test':
        return const Color(0xFFF3E8FF);
      case 'Full Test':
      default:
        return const Color(0xFFEFF6FF);
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeColor = _categoryColor();
    final themeBg = _categoryBgColor();

    void open() => locked
        ? showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: const Row(
                children: [
                  Icon(
                    Icons.workspace_premium_rounded,
                    color: UI.gold,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'PracticeKoro PRO',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ],
              ),
              content: const Text(
                'This mock test requires a PRO membership. Unlock full tests, detailed solutions, and performance rankings with PRO.',
                style: TextStyle(
                  fontSize: 14,
                  height: 1.4,
                  color: UI.textSoft,
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Maybe Later'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    context.push('/plans');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: UI.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text('View Plans'),
                ),
              ],
            ),
          )
        : context.push('/test/${test.id}/details');

    return UICard(
      onTap: open,
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left Number Box
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: themeBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              number.toString().padLeft(2, '0'),
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w900,
                color: themeColor,
              ),
            ),
          ),
          const SizedBox(width: 14),

          // Center Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category Tag
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 7,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: themeBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    test.normalizedCategory,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      color: themeColor,
                      letterSpacing: 0.1,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  test.title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.2,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 5),
                // Questions • Time • Marks
                Row(
                  children: [
                    _MetaItem(
                      icon: Icons.quiz_outlined,
                      label: '${test.totalQuestions} Qs',
                    ),
                    const SizedBox(width: 10),
                    _MetaItem(
                      icon: Icons.timer_outlined,
                      label: '${test.durationMinutes}m',
                    ),
                    const SizedBox(width: 10),
                    _MetaItem(
                      icon: Icons.military_tech_outlined,
                      label: '${test.totalMarks.toInt()} Marks',
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(width: 10),

          // Right Action
          if (locked)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.lock_rounded, color: Color(0xFFD97706), size: 13),
                  SizedBox(width: 4),
                  Text(
                    'PRO',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF92400E),
                    ),
                  ),
                ],
              ),
            )
          else
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: open,
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x332563EB),
                        blurRadius: 6,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Start',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(width: 3),
                      Icon(
                        Icons.arrow_forward_rounded,
                        size: 13,
                        color: Colors.white,
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
}

class _MetaItem extends StatelessWidget {
  final IconData icon;
  final String label;

  const _MetaItem({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 3),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';
import '../../data/models/exam_model.dart';
import '../../data/models/test_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/repositories/profile_repository.dart';
import '../exams/exam_logo.dart';

/// Official Previous Year Question papers, by exam and year. Papers are the
/// exam's tests whose type is PYQ; they open in the normal test flow.
class PyqScreen extends ConsumerStatefulWidget {
  final String? initialExamId;

  const PyqScreen({super.key, this.initialExamId});

  @override
  ConsumerState<PyqScreen> createState() => _PyqScreenState();
}

class _PyqScreenState extends ConsumerState<PyqScreen> {
  String? _examId;
  int? _year;

  @override
  void initState() {
    super.initState();
    _examId = widget.initialExamId;
  }

  @override
  Widget build(BuildContext context) {
    final examsAsync = ref.watch(examsProvider);
    return UIPage(
      appBar: const UITitleBar(
        'Previous Year Questions',
        fallbackRoute: '/practice',
      ),
      children: [
        examsAsync.when(
          loading: () => const UILoading(),
          error: (_, _) => UIMessage.error(
            message: 'Exams could not be loaded.',
            onAction: () => ref.invalidate(examsProvider),
          ),
          data: (exams) {
            if (exams.isEmpty) {
              return const UIMessage(
                icon: Icons.history_edu_outlined,
                title: 'No exams available yet',
              );
            }
            final exam = exams.firstWhere(
              (e) => e.id == _examId,
              orElse: () => exams.first,
            );
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Exam', style: UI.label),
                const SizedBox(height: 8),
                UIChips<String>(
                  options: [for (final e in exams) (e.id, e.title)],
                  value: exam.id,
                  onChanged: (id) => setState(() {
                    _examId = id;
                    _year = null;
                  }),
                ),
                const SizedBox(height: 16),
                _PaperList(
                  exam: exam,
                  year: _year,
                  onYear: (y) => setState(() => _year = y),
                ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _PaperList extends ConsumerWidget {
  final ExamModel exam;
  final int? year;
  final ValueChanged<int?> onYear;

  const _PaperList({
    required this.exam,
    required this.year,
    required this.onYear,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final testsAsync = ref.watch(mockTestsProvider(exam.id));
    return testsAsync.when(
      loading: () => const UILoading(),
      error: (_, _) => UIMessage.error(
        message: 'Papers for ${exam.title} could not be loaded.',
        onAction: () => ref.invalidate(mockTestsProvider(exam.id)),
      ),
      data: (tests) {
        final papers = tests
            .where((t) => t.normalizedCategory == 'PYQ')
            .toList();
        if (papers.isEmpty) {
          return UIMessage(
            icon: Icons.history_edu_outlined,
            title: 'No PYQ papers for ${exam.title} yet',
            message: 'Official papers appear here once they are published.',
          );
        }
        final years =
            papers.map((p) => p.paperYear).whereType<int>().toSet().toList()
              ..sort((a, b) => b.compareTo(a));
        final shown = year == null
            ? papers
            : papers.where((p) => p.paperYear == year).toList();
        shown.sort((a, b) => (b.paperYear ?? 0).compareTo(a.paperYear ?? 0));
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (years.isNotEmpty) ...[
              const Text('Year', style: UI.label),
              const SizedBox(height: 8),
              UIChips<int?>(
                options: [
                  (null, 'All years'),
                  for (final y in years) (y, '$y'),
                ],
                value: year,
                onChanged: onYear,
              ),
              const SizedBox(height: 16),
            ],
            Text(
              '${shown.length} ${shown.length == 1 ? 'paper' : 'papers'}',
              style: UI.caption,
            ),
            const SizedBox(height: 8),
            for (final p in shown) ...[
              _PaperCard(paper: p, examTitle: exam.title),
              const SizedBox(height: 10),
            ],
          ],
        );
      },
    );
  }
}

class _PaperCard extends ConsumerWidget {
  final MockTestModel paper;
  final String examTitle;

  const _PaperCard({required this.paper, required this.examTitle});

  static String _num(double v) =>
      v == v.roundToDouble() ? v.toInt().toString() : v.toStringAsFixed(2);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPro = ref.watch(studentProfileProvider).isPro;
    final isLocked = paper.isPro && !isPro;

    void open() => isLocked
        ? showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: const Row(
                children: [
                  Icon(Icons.workspace_premium_rounded, color: UI.gold),
                  SizedBox(width: 8),
                  Text(
                    'PracticeKoro PRO',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ],
              ),
              content: const Text(
                'This previous year paper requires a PRO membership. Unlock full PYQs, detailed solutions, and performance rankings with PRO.',
                style: TextStyle(fontSize: 14, height: 1.4, color: UI.textSoft),
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
        : context.push('/test/${paper.id}/details');
    return UICard(
      onTap: open,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          ExamLogo(examTitle, assetOverride: paper.examLogo, size: 44),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (paper.paperYear != null) ...[
                      UITag('${paper.paperYear}', color: UI.gold),
                      const SizedBox(width: 6),
                    ],
                    UITag(
                      paper.isPro ? 'Pro' : 'Free',
                      color: paper.isPro ? UI.purple : UI.success,
                      icon: paper.isPro ? Icons.lock_rounded : null,
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  paper.title,
                  style: UI.bodyStrong,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  [
                    if (paper.totalQuestions > 0) '${paper.totalQuestions} Qs',
                    if (paper.durationMinutes > 0)
                      '${paper.durationMinutes} min',
                    if (paper.totalMarks > 0) '${_num(paper.totalMarks)} marks',
                  ].join(' · '),
                  style: UI.caption,
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: UI.faint),
        ],
      ),
    );
  }
}

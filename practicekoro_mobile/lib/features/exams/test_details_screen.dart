import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';
import '../../data/repositories/catalog_repository.dart';

/// Screen 4: Test Instructions
/// Displays test summary, 4 key metrics (Questions, Minutes, Total Marks, Negative Marking),
/// checklist of important instructions with circular checks, and "Start Test" CTA.
class TestDetailsScreen extends ConsumerWidget {
  final String testId;

  const TestDetailsScreen({super.key, required this.testId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final testAsync = ref.watch(testByIdProvider(testId));

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
        title: const Text(
          'Test Instructions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: SafeArea(
        top: false,
        child: testAsync.when(
          loading: () => const Center(child: UILoading()),
          error: (_, _) => Center(
            child: UIMessage.error(
              message: 'Could not load test details.',
              onAction: () => ref.invalidate(testByIdProvider(testId)),
            ),
          ),
          data: (test) {
            if (test == null) {
              return const Center(
                child: UIMessage(
                  icon: Icons.search_off_rounded,
                  title: 'Test not found',
                  message: 'It may have been removed. Go back and select another test.',
                ),
              );
            }

            // Only state rules backed by this test's real numbers; unknown
            // values (0 / null) are left out rather than guessed.
            final perQuestion = test.totalQuestions > 0 && test.totalMarks > 0
                ? (test.totalMarks / test.totalQuestions)
                : null;
            final negative = test.negativeMarking;

            final rules = [
              if (test.totalQuestions > 0)
                'The test contains ${test.totalQuestions} multiple choice questions.',
              if (test.durationMinutes > 0)
                'Total duration of this test is ${test.durationMinutes} minutes.',
              if (perQuestion != null)
                'Each correct answer carries ${_num(perQuestion)} ${_num(perQuestion) == "1" ? "mark" : "marks"}.',
              if (negative != null)
                negative > 0
                    ? 'Negative marking of ${_num(negative)} marks will be deducted for each wrong answer.'
                    : 'There is no negative marking for wrong answers.',
              'You can review and change your answers before final submission.',
              if (test.durationMinutes > 0)
                'The test will be automatically submitted when the timer reaches 00:00.',
            ];

            return Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(UI.gutter, 16, UI.gutter, 24),
                    children: [
                      // Test Header Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
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
                            Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: const Icon(
                                Icons.auto_stories_rounded,
                                color: Color(0xFF2563EB),
                                size: 26,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (test.examTitle != null && test.examTitle!.isNotEmpty)
                                    Text(
                                      test.examTitle!,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: Color(0xFF64748B),
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  const SizedBox(height: 2),
                                  Text(
                                    test.title,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 4 Key Metric Tiles (2x2 Grid)
                      Row(
                        children: [
                          Expanded(
                            child: _MetricTile(
                              icon: Icons.help_outline_rounded,
                              label: 'Questions',
                              value: test.totalQuestions > 0 ? '${test.totalQuestions}' : '—',
                              color: const Color(0xFF2563EB),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _MetricTile(
                              icon: Icons.timer_outlined,
                              label: 'Minutes',
                              value: test.durationMinutes > 0 ? '${test.durationMinutes}' : '—',
                              color: const Color(0xFF0D9488),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _MetricTile(
                              icon: Icons.workspace_premium_outlined,
                              label: 'Total Marks',
                              value: test.totalMarks > 0 ? _num(test.totalMarks) : '—',
                              color: const Color(0xFFD97706),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _MetricTile(
                              icon: Icons.remove_circle_outline_rounded,
                              label: 'Negative Marking',
                              value: negative == null
                                  ? '—'
                                  : negative > 0
                                      ? '-${_num(negative)}'
                                      : 'None',
                              color: const Color(0xFFDC2626),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Important Instructions Card
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.info_outline_rounded, color: Color(0xFF2563EB), size: 22),
                                SizedBox(width: 8),
                                Text(
                                  'Important Instructions',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            for (final rule in rules)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Padding(
                                      padding: EdgeInsets.only(top: 2),
                                      child: Icon(
                                        Icons.check_circle_rounded,
                                        size: 18,
                                        color: Color(0xFF2563EB),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        rule,
                                        style: const TextStyle(
                                          fontSize: 13.5,
                                          height: 1.4,
                                          color: Color(0xFF334155),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Bottom CTA Button: "Start Test →"
                Container(
                  padding: const EdgeInsets.fromLTRB(UI.gutter, 12, UI.gutter, 16),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () {
                        final testTitle = test.examTitle != null
                            ? '${test.examTitle} - ${test.title}'
                            : test.title;
                        context.push(
                          '/test/$testId/active?title=${Uri.encodeQueryComponent(testTitle)}',
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: UI.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Start Test',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.2,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(Icons.arrow_forward_rounded, size: 20),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  static String _num(double value) => value == value.roundToDouble()
      ? value.toInt().toString()
      : value.toString();
}

class _MetricTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _MetricTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

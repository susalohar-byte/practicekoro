import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/test_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/repositories/profile_repository.dart';

/// Screen 3: Topic Test List
/// Displays all available tests for a selected topic (e.g., Indus Valley Civilization -> Test 01 .. Test 08).
/// Displays completed scores, Start pill buttons, and Pro lock states.
class TopicTestsListScreen extends ConsumerWidget {
  final String topicId;
  final String? topicTitle;

  const TopicTestsListScreen({
    super.key,
    required this.topicId,
    this.topicTitle,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final testsAsync = ref.watch(topicTestsProvider(topicId));
    final attemptsAsync = ref.watch(attemptHistoryProvider);
    final attempts = attemptsAsync.value ?? const <TestAttemptModel>[];
    final title = topicTitle ?? 'Topic Tests';
    final isProUser = ref.watch(studentProfileProvider).isPro;

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
              context.go('/topic-tests');
            }
          },
        ),
        titleSpacing: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            testsAsync.maybeWhen(
              data: (tests) => Text(
                '${tests.length} Tests Available',
                style: const TextStyle(
                  fontSize: 12.5,
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                ),
              ),
              orElse: () => const Text(
                'Available Tests',
                style: TextStyle(
                  fontSize: 12.5,
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          color: UI.primary,
          onRefresh: () async {
            ref.invalidate(topicTestsProvider(topicId));
            ref.invalidate(attemptHistoryProvider);
          },
          child: testsAsync.when(
            loading: () => const Center(child: UILoading()),
            error: (_, _) => Center(
              child: UIMessage.error(
                message: 'Could not load tests for this topic.',
                onAction: () => ref.invalidate(topicTestsProvider(topicId)),
              ),
            ),
            data: (tests) {
              if (tests.isEmpty) {
                return ListView(
                  children: const [
                    SizedBox(height: 100),
                    UIMessage(
                      icon: Icons.inbox_outlined,
                      title: 'No tests available',
                      message: 'Tests for this chapter will appear here soon.',
                    ),
                  ],
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.fromLTRB(UI.gutter, 16, UI.gutter, 80),
                itemCount: tests.length,
                itemBuilder: (context, index) {
                  final test = tests[index];
                  // Look up previous attempt if any
                  final prevAttempt = attempts.where((a) => a.testId == test.id).firstOrNull;
                  final isLocked = test.isPro && !isProUser;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _TopicTestItemCard(
                      test: test,
                      attempt: prevAttempt,
                      isLocked: isLocked,
                      onTap: () {
                        if (isLocked) {
                          _showProDialog(context);
                          return;
                        }
                        // Open Screen 4: Test Instructions
                        context.push('/test/${test.id}/details');
                      },
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }

  void _showProDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.workspace_premium_rounded, color: Color(0xFFEAB308)),
            SizedBox(width: 8),
            Text('PracticeKoro PRO', style: TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
        content: const Text(
          'This topic test requires a PRO membership. Unlock full tests, detailed solutions, and performance rankings with PRO.',
          style: TextStyle(fontSize: 14, height: 1.4, color: Color(0xFF475569)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Maybe Later'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.push('/plans');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: UI.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('View Plans'),
          ),
        ],
      ),
    );
  }
}

/// Test Card matching Screen 3 in reference image:
/// - Leading document icon in circle
/// - Test Title (Test 01, Test 02...)
/// - Subtitle with Question count • Minutes • Marks
/// - Right status:
///   - If completed: green badge "42/50" and "84%"
///   - If available: blue "Start" pill button
///   - If locked: lock icon with "PRO"
class _TopicTestItemCard extends StatelessWidget {
  final MockTestModel test;
  final TestAttemptModel? attempt;
  final bool isLocked;
  final VoidCallback onTap;

  const _TopicTestItemCard({
    required this.test,
    this.attempt,
    required this.isLocked,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final metaText = '${test.totalQuestions} Questions • ${test.durationMinutes} Mins • ${_formatMarks(test.totalMarks)} Marks';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isLocked ? const Color(0xFFF1F5F9) : const Color(0xFFE2E8F0),
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
        child: Row(
          children: [
            // Leading test icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isLocked
                    ? const Color(0xFFF1F5F9)
                    : const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isLocked ? Icons.lock_outline_rounded : Icons.description_outlined,
                color: isLocked ? const Color(0xFF94A3B8) : const Color(0xFF2563EB),
                size: 22,
              ),
            ),
            const SizedBox(width: 14),

            // Test info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    test.title,
                    style: TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                      color: isLocked ? const Color(0xFF64748B) : const Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    metaText,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),

            // Right Action / Status Badge
            if (isLocked)
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
                    Icon(Icons.lock_rounded, size: 13, color: Color(0xFFB45309)),
                    SizedBox(width: 4),
                    Text(
                      'PRO',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFB45309),
                      ),
                    ),
                  ],
                ),
              )
            else if (attempt != null)
              // Completed: green score pill badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${attempt!.correctCount}/${test.totalQuestions}',
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF059669),
                      ),
                    ),
                    Text(
                      '${attempt!.percentage.round()}%',
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF059669),
                      ),
                    ),
                  ],
                ),
              )
            else
              // Not Attempted: "Start" pill button matching reference
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                decoration: BoxDecoration(
                  color: UI.primary,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: UI.primary.withValues(alpha: 0.25),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Text(
                  'Start',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatMarks(double marks) {
    return marks % 1 == 0 ? marks.toInt().toString() : marks.toStringAsFixed(1);
  }
}

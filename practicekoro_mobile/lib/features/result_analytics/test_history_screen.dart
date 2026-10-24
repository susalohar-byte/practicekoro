import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/components/ui.dart';
import '../../data/models/attempt_model.dart';
import '../../data/repositories/catalog_repository.dart';

enum _Kind { all, mock, topic }

/// Every finished attempt on this device, with direct Result and Solutions
/// actions. "My Results" (the Result tab) stays the score-first summary.
class TestHistoryScreen extends ConsumerStatefulWidget {
  const TestHistoryScreen({super.key});

  @override
  ConsumerState<TestHistoryScreen> createState() => _TestHistoryScreenState();
}

class _TestHistoryScreenState extends ConsumerState<TestHistoryScreen> {
  _Kind _kind = _Kind.all;

  static bool _isTopic(TestAttemptModel a) => a.testId.startsWith('topic_');

  @override
  Widget build(BuildContext context) {
    final history = ref.watch(attemptHistoryProvider);
    return UIPage(
      appBar: const UITitleBar('My Tests', fallbackRoute: '/profile'),
      onRefresh: () async => ref.invalidate(attemptHistoryProvider),
      children: [
        history.when(
          loading: () => const UILoading(),
          error: (_, _) => UIMessage.error(
            message: 'Your test history could not be loaded.',
            onAction: () => ref.invalidate(attemptHistoryProvider),
          ),
          data: (attempts) {
            if (attempts.isEmpty) {
              return UIMessage(
                icon: Icons.assignment_outlined,
                title: 'No tests taken yet',
                message: 'Finished tests and practice sessions appear here.',
                actionLabel: 'Browse tests',
                onAction: () => context.go('/exams'),
              );
            }
            final shown = switch (_kind) {
              _Kind.all => attempts,
              _Kind.mock => attempts.where((a) => !_isTopic(a)).toList(),
              _Kind.topic => attempts.where(_isTopic).toList(),
            };
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                UIChips<_Kind>(
                  options: const [
                    (_Kind.all, 'All'),
                    (_Kind.mock, 'Mock & PYQ'),
                    (_Kind.topic, 'Topic Practice'),
                  ],
                  value: _kind,
                  counts: {
                    _Kind.all: attempts.length,
                    _Kind.mock: attempts.where((a) => !_isTopic(a)).length,
                    _Kind.topic: attempts.where(_isTopic).length,
                  },
                  onChanged: (k) => setState(() => _kind = k),
                ),
                const SizedBox(height: 14),
                if (shown.isEmpty)
                  const UIMessage(
                    icon: Icons.filter_alt_off_outlined,
                    title: 'Nothing in this filter',
                  ),
                for (final a in shown) ...[
                  _AttemptCard(attempt: a, isTopic: _isTopic(a)),
                  const SizedBox(height: 10),
                ],
              ],
            );
          },
        ),
      ],
    );
  }
}

class _AttemptCard extends StatelessWidget {
  final TestAttemptModel attempt;
  final bool isTopic;

  const _AttemptCard({required this.attempt, required this.isTopic});

  static String _num(double v) =>
      v == v.roundToDouble() ? v.toInt().toString() : v.toStringAsFixed(1);

  static String _duration(int seconds) {
    if (seconds <= 0) return '–';
    final m = seconds ~/ 60, s = seconds % 60;
    return m > 0 ? '${m}m ${s}s' : '${s}s';
  }

  @override
  Widget build(BuildContext context) {
    final a = attempt;
    final pct = a.percentage.clamp(0, 100) / 100;
    final color = UIProgress.colorFor(pct.toDouble());
    return UICard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              UIIconBadge(
                isTopic ? Icons.topic_outlined : Icons.description_outlined,
                color: isTopic ? UI.purple : UI.primary,
                size: 42,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      a.testTitle,
                      style: UI.bodyStrong,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${a.completedAtOrNull != null ? DateFormat('d MMM yyyy, h:mm a').format(a.completedAtOrNull!) : '—'} · '
                      '${_duration(a.timeSpentSeconds)}',
                      style: UI.caption,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const UITag(
                'Completed',
                color: UI.success,
                icon: Icons.check_rounded,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                '${_num(a.score)} / ${_num(a.totalMarks)}',
                style: UI.heading.copyWith(color: color),
              ),
              const SizedBox(width: 8),
              Text('${a.percentage.round()}%', style: UI.caption),
              const Spacer(),
              Text(
                '${a.correctCount} correct · ${a.wrongCount} wrong · '
                '${a.skippedCount} skipped',
                style: UI.caption,
              ),
            ],
          ),
          const SizedBox(height: 8),
          UIProgress(pct.toDouble(), color: color),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: UIButton.secondary(
                  'Solutions',
                  icon: Icons.menu_book_outlined,
                  height: 42,
                  onPressed: () => context.push('/solutions/${a.id}'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: UIButton(
                  'View Result',
                  height: 42,
                  onPressed: () => context.push('/result/${a.id}'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/components/ui.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/topic_model.dart';
import '../../data/repositories/catalog_repository.dart';

/// Student progress computed only from this student's finished attempts.
class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(attemptHistoryProvider);
    final topics =
        ref.watch(topicsProvider(null)).value ?? const <TopicModel>[];
    return UIPage(
      appBar: const UITitleBar('My Progress', fallbackRoute: '/profile'),
      onRefresh: () async => ref.invalidate(attemptHistoryProvider),
      children: [
        history.when(
          loading: () => const UILoading(),
          error: (_, _) => UIMessage.error(
            message: 'Your progress could not be loaded.',
            onAction: () => ref.invalidate(attemptHistoryProvider),
          ),
          data: (attempts) => attempts.isEmpty
              ? UIMessage(
                  icon: Icons.insights_outlined,
                  title: 'No progress yet',
                  message:
                      'Finish a test or a topic practice to see your accuracy and trends.',
                  actionLabel: 'Start practising',
                  onAction: () => context.go('/practice'),
                )
              : _ProgressBody(attempts: attempts, topics: topics),
        ),
      ],
    );
  }
}

class _ProgressBody extends StatelessWidget {
  final List<TestAttemptModel> attempts;
  final List<TopicModel> topics;

  const _ProgressBody({required this.attempts, required this.topics});

  @override
  Widget build(BuildContext context) {
    final correct = attempts.fold<int>(0, (s, a) => s + a.correctCount);
    final wrong = attempts.fold<int>(0, (s, a) => s + a.wrongCount);
    final solved = correct + wrong;
    final accuracy = solved > 0 ? correct / solved : 0.0;
    final avgScore =
        attempts.fold<double>(0, (s, a) => s + a.percentage) / attempts.length;
    final seconds = attempts.fold<int>(0, (s, a) => s + a.timeSpentSeconds);
    final recent = attempts.take(10).toList().reversed.toList();

    // Topic performance from topic-practice attempts ("topic_<topicId>").
    final topicNames = {for (final t in topics) t.id: t.title};
    final byTopic = <String, _Agg>{};
    final byTest = <String, _Agg>{};
    for (final a in attempts) {
      final isTopic = a.testId.startsWith('topic_');
      final key = isTopic
          ? (topicNames[a.testId.substring('topic_'.length)] ?? a.testTitle)
          : a.testTitle;
      (isTopic ? byTopic : byTest).putIfAbsent(key, _Agg.new).add(a);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        UICard(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Row(
            children: [
              Expanded(
                child: UIInfoTile(
                  icon: Icons.assignment_turned_in_rounded,
                  value: '${attempts.length}',
                  label: 'Tests Attempted',
                ),
              ),
              Expanded(
                child: UIInfoTile(
                  icon: Icons.task_alt_rounded,
                  value: '$solved',
                  label: 'Questions Solved',
                  color: UI.purple,
                ),
              ),
              Expanded(
                child: UIInfoTile(
                  icon: Icons.track_changes_rounded,
                  value: '${(accuracy * 100).round()}%',
                  label: 'Accuracy',
                  color: UI.success,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        UIStats([
          UIStat(
            '${avgScore.round()}%',
            'Avg. Score',
            color: UIProgress.colorFor(avgScore / 100),
          ),
          UIStat('$correct', 'Correct', color: UI.success),
          UIStat('$wrong', 'Wrong', color: UI.danger),
          UIStat(_hours(seconds), 'Time Spent'),
        ]),
        const UISection('Score Trend'),
        UICard(child: _TrendChart(attempts: recent)),
        if (byTopic.isNotEmpty) ...[
          const UISection('Topic Performance'),
          UIGroup(
            children: [
              for (final e in _sorted(byTopic)) _PerfRow(e.key, e.value),
            ],
          ),
        ],
        if (byTest.isNotEmpty) ...[
          const UISection('Mock Test Performance'),
          UIGroup(
            children: [
              for (final e in _sorted(byTest)) _PerfRow(e.key, e.value),
            ],
          ),
        ],
        const SizedBox(height: 10),
        const Text(
          'Based on tests finished on this device.',
          style: UI.caption,
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  /// Weakest first, so the rows read as "what to work on".
  static List<MapEntry<String, _Agg>> _sorted(Map<String, _Agg> m) =>
      m.entries.toList()
        ..sort((a, b) => a.value.accuracy.compareTo(b.value.accuracy));

  static String _hours(int seconds) {
    final h = seconds ~/ 3600, m = (seconds % 3600) ~/ 60;
    return h > 0 ? '${h}h ${m}m' : '${m}m';
  }
}

class _Agg {
  int attempts = 0, correct = 0, wrong = 0;
  double bestPct = 0;

  void add(TestAttemptModel a) {
    attempts++;
    correct += a.correctCount;
    wrong += a.wrongCount;
    if (a.percentage > bestPct) bestPct = a.percentage;
  }

  double get accuracy => correct + wrong > 0 ? correct / (correct + wrong) : 0;
}

class _PerfRow extends StatelessWidget {
  final String title;
  final _Agg agg;

  const _PerfRow(this.title, this.agg);

  @override
  Widget build(BuildContext context) {
    final color = UIProgress.colorFor(agg.accuracy);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: UI.bodyStrong,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                '${(agg.accuracy * 100).round()}%',
                style: UI.bodyStrong.copyWith(color: color),
              ),
            ],
          ),
          const SizedBox(height: 6),
          UIProgress(agg.accuracy, color: color),
          const SizedBox(height: 4),
          Text(
            '${agg.attempts} ${agg.attempts == 1 ? 'attempt' : 'attempts'} · '
            'best ${agg.bestPct.round()}%',
            style: UI.caption,
          ),
        ],
      ),
    );
  }
}

/// Score % of the latest attempts, oldest on the left.
class _TrendChart extends StatelessWidget {
  final List<TestAttemptModel> attempts;

  const _TrendChart({required this.attempts});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 140,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              for (final a in attempts)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Semantics(
                      label: '${a.testTitle}: ${a.percentage.round()} percent',
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text(
                            '${a.percentage.round()}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: UI.muted,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            height:
                                (a.percentage.clamp(0, 100) / 100 * 110) + 4,
                            decoration: BoxDecoration(
                              color: UIProgress.colorFor(a.percentage / 100),
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(6),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const Divider(),
        const SizedBox(height: 6),
        Row(
          children: [
            Text(
              DateFormat('d MMM').format(attempts.first.completedAt),
              style: UI.caption,
            ),
            const Spacer(),
            Text(
              'Last ${attempts.length} ${attempts.length == 1 ? 'test' : 'tests'} (score %)',
              style: UI.caption,
            ),
            const Spacer(),
            Text(
              DateFormat('d MMM').format(attempts.last.completedAt),
              style: UI.caption,
            ),
          ],
        ),
      ],
    );
  }
}

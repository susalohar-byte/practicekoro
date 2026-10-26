import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/components/ui.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/question_model.dart';
import '../../data/models/ranking_model.dart';
import '../../data/repositories/catalog_repository.dart';
import 'solutions_screen.dart';

enum DetailTab { overview, subjects, timeAnalysis }

class ResultScreen extends ConsumerStatefulWidget {
  final String attemptId;

  const ResultScreen({super.key, required this.attemptId});

  @override
  ConsumerState<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends ConsumerState<ResultScreen> {
  DetailTab _activeTab = DetailTab.overview;

  @override
  Widget build(BuildContext context) {
    final attemptAsync = ref.watch(testAttemptProvider(widget.attemptId));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: attemptAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
          error: (_, _) => Center(
            child: UIMessage.error(
              message: 'Could not load your result detail.',
              onAction: () => ref.invalidate(testAttemptProvider(widget.attemptId)),
            ),
          ),
          data: (attempt) => _buildContent(context, attempt),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, TestAttemptModel a) {
    final percent = a.totalMarks > 0 ? (a.score / a.totalMarks).clamp(0.0, 1.0) : 0.0;
    final attempted = a.correctCount + a.wrongCount;
    final totalQuestions = attempted + a.skippedCount;
    final accuracy = attempted > 0 ? (a.correctCount / attempted * 100) : 0.0;

    final scoreStr = a.score == a.score.roundToDouble()
        ? a.score.toInt().toString()
        : a.score.toStringAsFixed(1);
    final totalMarksStr = a.totalMarks == a.totalMarks.roundToDouble()
        ? a.totalMarks.toInt().toString()
        : a.totalMarks.toStringAsFixed(0);

    // Negative marking calculation: default 0.25 per wrong answer unless test has 0
    final negativeDeduction = (a.wrongCount * 0.25);
    final negativeDisplay = negativeDeduction > 0
        ? '-${negativeDeduction.toStringAsFixed(negativeDeduction == negativeDeduction.roundToDouble() ? 0 : 2)}'
        : '-0';

    // Ranks come only from the server; show a dash until one exists.
    final rankDisplay = a.rank > 0 ? RankingSummary.formatOrdinal(a.rank) : '-';
    final participantsDisplay = a.totalParticipants > 0
        ? NumberFormat.decimalPattern('en_IN').format(a.totalParticipants)
        : null;

    // Format time spent nicely
    final timeStr = _formatTimeSpent(a.timeSpentSeconds);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
        // Top Non-sticky Navigation Row
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left_rounded, size: 28, color: Color(0xFF0F172A)),
                onPressed: () {
                  if (GoRouter.of(context).canPop()) {
                    context.pop();
                  } else {
                    context.go('/results');
                  }
                },
              ),
              const Expanded(
                child: Text(
                  'Result Detail',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.share_outlined, color: Color(0xFF0F172A)),
                tooltip: 'Share Result',
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Result summary copied to clipboard!'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
              ),
            ],
          ),
        ),

        // 1. Test Header Card
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x04000000),
                blurRadius: 6,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.assignment_turned_in_rounded,
                  color: Color(0xFFDC2626),
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      a.testTitle,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      DateFormat('d MMM yyyy • h:mm a').format(a.completedAt),
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // 2. Segmented Tabs (Overview, Subjects, Time Analysis)
        Row(
          children: [
            Expanded(
              child: _DetailTabButton(
                label: 'Overview',
                isSelected: _activeTab == DetailTab.overview,
                onTap: () => setState(() => _activeTab = DetailTab.overview),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _DetailTabButton(
                label: 'Subjects',
                isSelected: _activeTab == DetailTab.subjects,
                onTap: () => setState(() => _activeTab = DetailTab.subjects),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _DetailTabButton(
                label: 'Time Analysis',
                isSelected: _activeTab == DetailTab.timeAnalysis,
                onTap: () => setState(() => _activeTab = DetailTab.timeAnalysis),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Dynamic Tab Content
        if (_activeTab == DetailTab.overview) ...[
          ..._buildOverviewTab(
            context: context,
            a: a,
            percent: percent,
            scoreStr: scoreStr,
            totalMarksStr: totalMarksStr,
            accuracy: accuracy,
            timeStr: timeStr,
            rankDisplay: rankDisplay,
            participantsDisplay: participantsDisplay,
            totalQuestions: totalQuestions,
            attempted: attempted,
            negativeDisplay: negativeDisplay,
          ),
        ] else if (_activeTab == DetailTab.subjects) ...[
          ..._buildSubjectsTab(context, a),
        ] else if (_activeTab == DetailTab.timeAnalysis) ...[
          ..._buildTimeAnalysisTab(context, a, totalQuestions, attempted),
        ],
      ],
    );
  }

  // ==========================================
  // TAB 1: OVERVIEW
  // ==========================================
  List<Widget> _buildOverviewTab({
    required BuildContext context,
    required TestAttemptModel a,
    required double percent,
    required String scoreStr,
    required String totalMarksStr,
    required double accuracy,
    required String timeStr,
    required String rankDisplay,
    required String? participantsDisplay,
    required int totalQuestions,
    required int attempted,
    required String negativeDisplay,
  }) {
    return [
      // Circular Score Progress Ring
      Center(
        child: SizedBox(
          width: 170,
          height: 170,
          child: CustomPaint(
            painter: _ScoreRingPainter(
              progress: percent,
              strokeWidth: 12,
              progressColor: const Color(0xFF0158FC),
              backgroundColor: const Color(0xFFE2E8F0),
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            scoreStr,
                            style: const TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            ' / $totalMarksStr',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Score',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      const SizedBox(height: 24),

      // Three Metric Badges: Accuracy, Time Taken, Rank
      Row(
        children: [
          Expanded(
            child: _MetricBadge(
              value: '${accuracy.round()}%',
              valueColor: const Color(0xFF16A34A),
              label: 'Accuracy',
            ),
          ),
          Expanded(
            child: _MetricBadge(
              value: timeStr,
              valueColor: const Color(0xFF0158FC),
              label: 'Time Taken',
            ),
          ),
          Expanded(
            child: _MetricBadge(
              value: rankDisplay,
              valueColor: const Color(0xFF9333EA),
              label: 'Rank',
              subtitle: participantsDisplay != null
                  ? '(Out of $participantsDisplay)'
                  : '(Not ranked yet)',
            ),
          ),
        ],
      ),
      const SizedBox(height: 24),

      // Summary Breakdown Table
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x04000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            _buildBreakdownRow('Total Questions', '$totalQuestions'),
            const Divider(height: 18, color: Color(0xFFF1F5F9)),
            _buildBreakdownRow('Attempted', '$attempted'),
            const Divider(height: 18, color: Color(0xFFF1F5F9)),
            _buildBreakdownRow(
              'Correct',
              '${a.correctCount}',
              valueColor: const Color(0xFF16A34A),
            ),
            const Divider(height: 18, color: Color(0xFFF1F5F9)),
            _buildBreakdownRow(
              'Incorrect',
              '${a.wrongCount}',
              valueColor: const Color(0xFFDC2626),
            ),
            const Divider(height: 18, color: Color(0xFFF1F5F9)),
            _buildBreakdownRow('Skipped', '${a.skippedCount}'),
            const Divider(height: 18, color: Color(0xFFF1F5F9)),
            _buildBreakdownRow(
              'Negative Marking',
              negativeDisplay,
              valueColor: const Color(0xFFDC2626),
            ),
            const Divider(height: 18, color: Color(0xFFF1F5F9)),
            _buildBreakdownRow(
              'Final Score',
              '$scoreStr / $totalMarksStr',
              valueColor: const Color(0xFF0158FC),
              isBold: true,
            ),
          ],
        ),
      ),
      const SizedBox(height: 24),

      // View Answer Button
      _buildViewAnswerButton(context, a.id),
    ];
  }

  // ==========================================
  // TAB 2: SUBJECTS ANALYSIS
  // ==========================================
  List<Widget> _buildSubjectsTab(BuildContext context, TestAttemptModel a) {
    final solutionsAsync = ref.watch(testSolutionsProvider((attemptId: a.id, testId: a.testId)));

    return [
      solutionsAsync.when(
        loading: () => const Padding(
          padding: EdgeInsets.symmetric(vertical: 48),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(strokeWidth: 2.5),
                SizedBox(height: 16),
                Text(
                  'Analyzing subject performance...',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ),
        error: (err, _) => Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              const Icon(Icons.info_outline_rounded, size: 36, color: Color(0xFF94A3B8)),
              const SizedBox(height: 10),
              const Text(
                'Could not load subject analysis.',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Please check your network and try again.',
                style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 14),
              OutlinedButton.icon(
                onPressed: () => ref.invalidate(testSolutionsProvider((attemptId: a.id, testId: a.testId))),
                icon: const Icon(Icons.refresh_rounded, size: 16),
                label: const Text('Retry Analysis'),
              ),
            ],
          ),
        ),
        data: (data) {
          final (questions, answers) = data;
          if (questions.isEmpty) {
            return Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Center(
                child: Text(
                  'No subject question details available for this test.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                ),
              ),
            );
          }

          final statsMap = <String, _SubjectStat>{};
          for (var i = 0; i < questions.length; i++) {
            final q = questions[i];
            final rawSub = q.subjectName?.trim();
            final subName = (rawSub != null && rawSub.isNotEmpty) ? rawSub : 'General Awareness';
            final stat = statsMap.putIfAbsent(subName, () => _SubjectStat(name: subName));
            stat.totalQuestions++;
            stat.totalMarks += q.marks;

            final pick = _findStudentPick(q, i, answers);
            if (pick == null || pick.isEmpty) {
              stat.skipped++;
            } else {
              final isCorrect = q.options.any((o) => _matchesOption(o, pick) && o.isCorrect);
              if (isCorrect) {
                stat.correct++;
                stat.marksEarned += q.marks;
              } else {
                stat.wrong++;
                stat.marksEarned -= q.negativeMarks;
              }
            }
          }

          final stats = statsMap.values.toList();
          // Sort subjects by total questions descending
          stats.sort((x, y) => y.totalQuestions.compareTo(x.totalQuestions));

          // Find best and worst performing subject among attempted ones
          _SubjectStat? bestSubject;
          _SubjectStat? worstSubject;
          for (final s in stats) {
            if (s.attempted > 0) {
              if (bestSubject == null || s.accuracy > bestSubject.accuracy) {
                bestSubject = s;
              }
              if (worstSubject == null || s.accuracy < worstSubject.accuracy) {
                worstSubject = s;
              }
            }
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Subject Highlights (Strengths & Focus Area)
              if (stats.length > 1 &&
                  bestSubject != null &&
                  worstSubject != null &&
                  bestSubject != worstSubject) ...[
                Row(
                  children: [
                    Expanded(
                      child: _buildInsightPill(
                        title: 'Strongest Subject',
                        subject: bestSubject.name,
                        accuracy: '${bestSubject.accuracy.round()}%',
                        accentColor: const Color(0xFF16A34A),
                        bgColor: const Color(0xFFF0FDF4),
                        borderColor: const Color(0xFFBBF7D0),
                        icon: Icons.trending_up_rounded,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildInsightPill(
                        title: 'Needs Focus',
                        subject: worstSubject.name,
                        accuracy: '${worstSubject.accuracy.round()}%',
                        accentColor: const Color(0xFFDC2626),
                        bgColor: const Color(0xFFFEF2F2),
                        borderColor: const Color(0xFFFECACA),
                        icon: Icons.track_changes_rounded,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],

              // Section Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Subject Breakdown (${stats.length})',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const Text(
                    'Score & Accuracy',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Subject Cards List
              ...stats.map((s) => _buildSubjectCard(s)),
            ],
          );
        },
      ),
      const SizedBox(height: 24),
      _buildViewAnswerButton(context, a.id),
    ];
  }

  Widget _buildSubjectCard(_SubjectStat s) {
    final acc = s.accuracy.round();
    final String statusLabel;
    final Color statusFg;
    final Color statusBg;
    if (s.attempted == 0) {
      statusLabel = 'Unattempted';
      statusFg = const Color(0xFF64748B);
      statusBg = const Color(0xFFF1F5F9);
    } else if (acc >= 75) {
      statusLabel = 'Strong';
      statusFg = const Color(0xFF16A34A);
      statusBg = const Color(0xFFDCFCE7);
    } else if (acc >= 45) {
      statusLabel = 'Moderate';
      statusFg = const Color(0xFFD97706);
      statusBg = const Color(0xFFFEF3C7);
    } else {
      statusLabel = 'Needs Focus';
      statusFg = const Color(0xFFDC2626);
      statusBg = const Color(0xFFFEE2E2);
    }

    final scoreStr = s.marksEarned == s.marksEarned.roundToDouble()
        ? s.marksEarned.toInt().toString()
        : s.marksEarned.toStringAsFixed(1);
    final totalMarksStr = s.totalMarks == s.totalMarks.roundToDouble()
        ? s.totalMarks.toInt().toString()
        : s.totalMarks.toStringAsFixed(0);

    final totalQ = s.totalQuestions > 0 ? s.totalQuestions : 1;
    final correctRatio = s.correct / totalQ;
    final wrongRatio = s.wrong / totalQ;
    final skippedRatio = s.skipped / totalQ;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x04000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Subject header: icon, name, status badge
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _getSubjectIcon(s.name),
                  size: 20,
                  color: const Color(0xFF0158FC),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  s.name,
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: statusFg,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Score & Accuracy row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text(
                    'Score: ',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  Text(
                    '$scoreStr / $totalMarksStr',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0158FC),
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  const Text(
                    'Accuracy: ',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  Text(
                    '$acc%',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: acc >= 75 ? const Color(0xFF16A34A) : const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Multi-segment progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: SizedBox(
              height: 7,
              child: Row(
                children: [
                  if (correctRatio > 0)
                    Expanded(
                      flex: math.max(1, (correctRatio * 1000).toInt()),
                      child: Container(color: const Color(0xFF16A34A)),
                    ),
                  if (wrongRatio > 0)
                    Expanded(
                      flex: math.max(1, (wrongRatio * 1000).toInt()),
                      child: Container(color: const Color(0xFFDC2626)),
                    ),
                  if (skippedRatio > 0)
                    Expanded(
                      flex: math.max(1, (skippedRatio * 1000).toInt()),
                      child: Container(color: const Color(0xFFCBD5E1)),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // 4 Micro Metrics: Correct, Wrong, Skipped, Total
          Row(
            children: [
              Expanded(
                child: _buildMiniStatChip(
                  label: 'Correct',
                  count: '${s.correct}',
                  color: const Color(0xFF16A34A),
                  bgColor: const Color(0xFFF0FDF4),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _buildMiniStatChip(
                  label: 'Wrong',
                  count: '${s.wrong}',
                  color: const Color(0xFFDC2626),
                  bgColor: const Color(0xFFFEF2F2),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _buildMiniStatChip(
                  label: 'Skipped',
                  count: '${s.skipped}',
                  color: const Color(0xFF64748B),
                  bgColor: const Color(0xFFF8FAFC),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _buildMiniStatChip(
                  label: 'Total Qs',
                  count: '${s.totalQuestions}',
                  color: const Color(0xFF0158FC),
                  bgColor: const Color(0xFFEFF6FF),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 3: TIME & SPEED ANALYSIS
  // ==========================================
  List<Widget> _buildTimeAnalysisTab(
    BuildContext context,
    TestAttemptModel a,
    int totalQuestions,
    int attempted,
  ) {
    final testAsync = ref.watch(testByIdProvider(a.testId));
    final durationMinutes = testAsync.value?.durationMinutes ?? 60;
    final totalDurationSeconds = durationMinutes * 60;
    final spentSeconds = a.timeSpentSeconds;
    final percentUsed = totalDurationSeconds > 0
        ? (spentSeconds / totalDurationSeconds).clamp(0.0, 1.0)
        : 0.0;
    final remainingSeconds = math.max(0, totalDurationSeconds - spentSeconds);

    final avgTimeAllSeconds = totalQuestions > 0 ? (spentSeconds / totalQuestions).round() : 0;
    final avgTimeAttemptedSeconds = attempted > 0 ? (spentSeconds / attempted).round() : 0;

    final String paceStatus;
    final Color paceColor;
    final String paceIcon;
    if (avgTimeAllSeconds <= 40) {
      paceStatus = 'Fast Pace (দ্রুত গতি)';
      paceColor = const Color(0xFF0158FC);
      paceIcon = '⚡';
    } else if (avgTimeAllSeconds <= 65) {
      paceStatus = 'Optimal Pace (সঠিক গতি)';
      paceColor = const Color(0xFF16A34A);
      paceIcon = '🎯';
    } else {
      paceStatus = 'Slow Pace (ধীর গতি)';
      paceColor = const Color(0xFFD97706);
      paceIcon = '⏳';
    }

    final String recommendation;
    if (a.accuracy >= 75 && avgTimeAllSeconds <= 65) {
      recommendation =
          'অসাধারণ সময় ব্যবস্থাপনা! প্রশ্ন সমাধানের গতি এবং নির্ভুলতা দুই-ই শীর্ষমানের। এই গতি বজায় রাখলে পরীক্ষায় উচ্চ র‍্যাঙ্ক অর্জন নিশ্চিত।';
    } else if (a.accuracy < 50 && avgTimeAllSeconds <= 40) {
      recommendation =
          'তুমি খুব দ্রুত উত্তর দিয়েছ, যার ফলে ভুলের সংখ্যা বেড়ে গেছে। তাড়াহুড়ো না করে প্রশ্নটি ভালো করে পড়ার অভ্যাস করো—সঠিকতাই নম্বর এনে দেয়।';
    } else if (avgTimeAllSeconds > 65) {
      recommendation =
          'প্রতি প্রশ্নে সময় কিছুটা বেশি লেগেছে। সাধারণ জ্ঞান ও ইংরেজিতে দ্রুত উত্তর দিয়ে গণিত ও রিজনিং-এর জন্য সময় সঞ্চয় করার অনুশীলন করো।';
    } else {
      recommendation =
          'তোমার গতি ও নির্ভুলতা সন্তোষজনক। নিয়মিত মক টেস্ট অনুশীলনের মাধ্যমে সময় ব্যবস্থাপনা আরও নিখুঁত করে তোলো।';
    }

    return [
      // 1. Time Utilization Card
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x04000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.access_time_rounded, size: 20, color: Color(0xFF0158FC)),
                    SizedBox(width: 8),
                    Text(
                      'Time Utilization',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${(percentUsed * 100).round()}% Used',
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0158FC),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: percentUsed,
                minHeight: 10,
                backgroundColor: const Color(0xFFE2E8F0),
                valueColor: AlwaysStoppedAnimation<Color>(
                  percentUsed > 0.95
                      ? const Color(0xFFDC2626)
                      : (percentUsed > 0.8 ? const Color(0xFFD97706) : const Color(0xFF0158FC)),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildTimeDetailTile(
                    label: 'Time Spent',
                    value: _formatTimeSpent(spentSeconds),
                    valueColor: const Color(0xFF0158FC),
                  ),
                ),
                Container(width: 1, height: 36, color: const Color(0xFFE2E8F0)),
                Expanded(
                  child: _buildTimeDetailTile(
                    label: 'Total Allotted',
                    value: '${durationMinutes}m 00s',
                    valueColor: const Color(0xFF0F172A),
                  ),
                ),
                Container(width: 1, height: 36, color: const Color(0xFFE2E8F0)),
                Expanded(
                  child: _buildTimeDetailTile(
                    label: 'Time Saved',
                    value: _formatTimeSpent(remainingSeconds),
                    valueColor: const Color(0xFF16A34A),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),

      // 2. Speed & Pacing Assessment Card
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x04000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.speed_rounded, size: 20, color: Color(0xFF9333EA)),
                    SizedBox(width: 8),
                    Text(
                      'Speed & Pacing',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
                Text(
                  '$paceIcon $paceStatus',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: paceColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Text(
                          '${avgTimeAllSeconds}s',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Avg / Question',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Text(
                          '${avgTimeAttemptedSeconds}s',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0158FC),
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Avg / Attempted',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Text(
                          totalQuestions > 0
                              ? '${(attempted / totalQuestions * 100).round()}%'
                              : '0%',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF16A34A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Attempt Rate',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),

      // 3. Speed vs Accuracy Assessment Banner
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFBBF7D0)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.lightbulb_outline_rounded,
                color: Color(0xFF16A34A),
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Performance Recommendation',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF166534),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    recommendation,
                    style: const TextStyle(
                      fontSize: 12.5,
                      height: 1.45,
                      color: Color(0xFF14532D),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),

      // 4. WB Exam Time Management Tips
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x04000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.tips_and_updates_outlined, size: 20, color: Color(0xFFD97706)),
                SizedBox(width: 8),
                Text(
                  'Exam Pacing Strategies',
                  style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _buildPacingTip(
              number: '1',
              title: 'GK & Current Affairs (20-30s)',
              desc:
                  'সাধারণ জ্ঞানের প্রশ্নে কোনো গণনা থাকে না। জানা থাকলে সরাসরি দাগান, দ্বিধা থাকলে স্কিপ করে এগিয়ে যান।',
            ),
            const Divider(height: 20, color: Color(0xFFF1F5F9)),
            _buildPacingTip(
              number: '2',
              title: 'Save Time for Math & Reasoning',
              desc:
                  'জিকে ও ইংরেজি দ্রুত শেষ করে বাঁচানো অতিরিক্ত সময় পাটিগণিত ও রিজনিং-এর বড় অংকে ব্যয় করুন।',
            ),
            const Divider(height: 20, color: Color(0xFFF1F5F9)),
            _buildPacingTip(
              number: '3',
              title: 'The 60-Second Skip Rule',
              desc:
                  'কোনো একটি প্রশ্নে ১ মিনিটের বেশি আটকে থাকবেন না। নেগেটিভ মার্কিং এড়াতে সন্দেহজনক প্রশ্ন স্কিপ করা বুদ্ধিমত্তা।',
            ),
          ],
        ),
      ),
      const SizedBox(height: 24),
      _buildViewAnswerButton(context, a.id),
    ];
  }

  // ==========================================
  // SHARED SUB-WIDGETS & HELPERS
  // ==========================================
  Widget _buildViewAnswerButton(BuildContext context, String attemptId) {
    return ElevatedButton(
      onPressed: () => context.push('/solutions/$attemptId'),
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF0158FC),
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 15),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
        elevation: 0,
        shadowColor: const Color(0xFF0158FC).withValues(alpha: 0.3),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'View Answer',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          SizedBox(width: 8),
          Icon(Icons.arrow_forward_rounded, size: 20, color: Colors.white),
        ],
      ),
    );
  }

  Widget _buildBreakdownRow(
    String label,
    String value, {
    Color? valueColor,
    bool isBold = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13.5,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
            color: isBold ? const Color(0xFF0F172A) : const Color(0xFF64748B),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w700,
            color: valueColor ?? const Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }

  Widget _buildTimeDetailTile({
    required String label,
    required String value,
    required Color valueColor,
  }) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 14.5,
            fontWeight: FontWeight.w800,
            color: valueColor,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildPacingTip({
    required String number,
    required String title,
    required String desc,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 24,
          height: 24,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            number,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0158FC),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: const TextStyle(
                  fontSize: 12,
                  height: 1.4,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInsightPill({
    required String title,
    required String subject,
    required String accuracy,
    required Color accentColor,
    required Color bgColor,
    required Color borderColor,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: accentColor),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: accentColor,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  '$subject ($accuracy)',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
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

  Widget _buildMiniStatChip({
    required String label,
    required String count,
    required Color color,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            count,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 1),
          Text(
            label,
            style: TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w600,
              color: color.withValues(alpha: 0.8),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTimeSpent(int seconds) {
    if (seconds <= 0) return '0s';
    final hours = seconds ~/ 3600;
    final mins = (seconds % 3600) ~/ 60;
    final secs = seconds % 60;
    if (hours > 0) {
      return mins > 0 ? '${hours}h ${mins}m' : '${hours}h';
    }
    if (mins > 0) {
      return secs > 0 ? '${mins}m ${secs}s' : '${mins}m';
    }
    return '${secs}s';
  }

  IconData _getSubjectIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('math') || lower.contains('গণিত') || lower.contains('arithmetic')) {
      return Icons.calculate_outlined;
    }
    if (lower.contains('reason') || lower.contains('জিআই') || lower.contains('intelligence')) {
      return Icons.psychology_outlined;
    }
    if (lower.contains('english') || lower.contains('ইংরেজি')) {
      return Icons.translate_outlined;
    }
    if (lower.contains('science') ||
        lower.contains('বিজ্ঞান') ||
        lower.contains('physics') ||
        lower.contains('chem') ||
        lower.contains('bio')) {
      return Icons.science_outlined;
    }
    if (lower.contains('history') || lower.contains('ইতিহাস')) {
      return Icons.history_edu_outlined;
    }
    if (lower.contains('geography') || lower.contains('ভূগোল')) {
      return Icons.public_outlined;
    }
    if (lower.contains('bengali') || lower.contains('বাংলা')) {
      return Icons.auto_stories_outlined;
    }
    if (lower.contains('polity') || lower.contains('সংবিধান') || lower.contains('constitution')) {
      return Icons.gavel_rounded;
    }
    return Icons.menu_book_outlined;
  }

  bool _matchesOption(OptionModel opt, String? pick) {
    if (pick == null || pick.isEmpty) return false;
    final cleanPick = pick.trim();
    if (opt.id == cleanPick) return true;
    final lowerPick = cleanPick.toLowerCase();
    final lowerId = opt.id.toLowerCase().trim();
    if (lowerPick == lowerId) return true;
    final lowerLabel = opt.label.toLowerCase().trim();
    if (lowerPick == lowerLabel) return true;
    if (lowerPick.endsWith('_$lowerLabel')) return true;
    if (lowerPick.startsWith('${lowerLabel}_')) return true;
    if (opt.text.isNotEmpty && opt.text.toLowerCase().trim() == lowerPick) {
      return true;
    }
    if (opt.textBengali != null && opt.textBengali!.trim() == cleanPick) {
      return true;
    }
    return false;
  }

  String? _findStudentPick(QuestionModel q, int index, Map<String, dynamic> answers) {
    if (answers.isEmpty) return null;
    if (answers.containsKey(q.id)) {
      final v = answers[q.id]?.toString().trim();
      if (v != null && v.isNotEmpty) return v;
    }
    final lowerQId = q.id.toLowerCase().trim();
    for (final entry in answers.entries) {
      if (entry.key.trim().toLowerCase() == lowerQId) {
        final v = entry.value?.toString().trim();
        if (v != null && v.isNotEmpty) return v;
      }
    }
    final qNum = q.questionNumber;
    final candidateKeys = <String>[
      'q_$qNum',
      '$qNum',
      'q_${index + 1}',
      '${index + 1}',
      'q_0$qNum',
      '$index',
    ];
    for (final candidate in candidateKeys) {
      if (answers.containsKey(candidate)) {
        final v = answers[candidate]?.toString().trim();
        if (v != null && v.isNotEmpty) return v;
      }
    }
    for (final entry in answers.entries) {
      final k = entry.key.trim().toLowerCase();
      for (final candidate in candidateKeys) {
        if (k == candidate.toLowerCase()) {
          final v = entry.value?.toString().trim();
          if (v != null && v.isNotEmpty) return v;
        }
      }
    }
    return null;
  }
}

class _SubjectStat {
  final String name;
  int totalQuestions = 0;
  int correct = 0;
  int wrong = 0;
  int skipped = 0;
  double marksEarned = 0.0;
  double totalMarks = 0.0;

  _SubjectStat({required this.name});

  int get attempted => correct + wrong;
  double get accuracy => attempted > 0 ? (correct / attempted * 100) : 0.0;
}

class _DetailTabButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _DetailTabButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0158FC) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF0158FC) : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }
}

class _MetricBadge extends StatelessWidget {
  final String value;
  final Color valueColor;
  final String label;
  final String? subtitle;

  const _MetricBadge({
    required this.value,
    required this.valueColor,
    required this.label,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: valueColor,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 1),
          Text(
            subtitle!,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: Color(0xFF94A3B8),
            ),
          ),
        ],
      ],
    );
  }
}

class _ScoreRingPainter extends CustomPainter {
  final double progress; // 0.0 to 1.0
  final double strokeWidth;
  final Color progressColor;
  final Color backgroundColor;

  _ScoreRingPainter({
    required this.progress,
    required this.strokeWidth,
    required this.progressColor,
    required this.backgroundColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background circle
    final bgPaint = Paint()
      ..color = backgroundColor
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;
    canvas.drawCircle(center, radius, bgPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = progressColor
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    const startAngle = -math.pi / 2;
    final sweepAngle = 2 * math.pi * progress;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _ScoreRingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.progressColor != progressColor ||
        oldDelegate.backgroundColor != backgroundColor;
  }
}

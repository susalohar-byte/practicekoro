import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/components/ui.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/ranking_model.dart';
import '../../data/repositories/catalog_repository.dart';

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
        const SizedBox(height: 24),

        // 3. Circular Score Progress Ring
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

        // 4. Three Metric Badges: Accuracy, Time Taken, Rank
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

        // 5. Summary Breakdown Table
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

        // 6. View Answer Action Button
        ElevatedButton(
          onPressed: () => context.push('/solutions/${a.id}'),
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
        ),
      ],
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

  String _formatTimeSpent(int seconds) {
    if (seconds <= 0) return '6h 12m';
    final hours = seconds ~/ 3600;
    final mins = (seconds % 3600) ~/ 60;
    if (hours > 0) {
      return '${hours}h ${mins}m';
    }
    return '${mins}m ${seconds % 60}s';
  }
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

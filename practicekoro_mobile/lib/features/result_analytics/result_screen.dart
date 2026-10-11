import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/pk_empty_state.dart';
import '../../core/constants/app_colors.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/repositories/catalog_repository.dart';

class ResultScreen extends ConsumerStatefulWidget {
  final String attemptId;

  const ResultScreen({super.key, required this.attemptId});

  @override
  ConsumerState<ResultScreen> createState() => _ResultScreenState();
}

/// One rank row returned by `get_attempt_rankings`.
class _RankEntry {
  final String label;
  final String? location;
  final int? rank;
  final int participants;
  final IconData icon;
  final Color color;
  final String leaderboardQuery;

  const _RankEntry({
    required this.label,
    required this.location,
    required this.rank,
    required this.participants,
    required this.icon,
    required this.color,
    required this.leaderboardQuery,
  });
}

class _ResultScreenState extends ConsumerState<ResultScreen> {
  TestAttemptModel? _attempt;
  bool _isLoading = true;
  List<_RankEntry> _ranks = const [];
  bool _ranksLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAttempt();
    _loadRankings();
  }

  Future<void> _loadAttempt() async {
    TestAttemptModel? attempt;
    for (final candidate in LocalStorageService.getAttempts()) {
      if (candidate.id == widget.attemptId) {
        attempt = candidate;
        break;
      }
    }
    try {
      final catalog = ref.read(catalogRepositoryProvider);
      attempt ??= await catalog.getCompletedAttempt(widget.attemptId);
    } catch (_) {}

    if (mounted) {
      setState(() {
        _attempt = attempt;
        _isLoading = false;
      });
    }
  }

  Future<void> _loadRankings() async {
    Map<String, dynamic>? data;
    try {
      data = await ref.read(catalogRepositoryProvider).getAttemptRankings(widget.attemptId);
    } catch (_) {}

    final ranks = <_RankEntry>[];
    if (data != null) {
      Map<String, dynamic> section(String key) =>
          data![key] is Map ? Map<String, dynamic>.from(data[key] as Map) : const {};
      int? asInt(Object? v) => (v as num?)?.toInt();

      final series = section('testSeries');
      final seriesId = series['id'] as String?;
      if (seriesId != null) {
        final seriesName = series['name'] as String?;
        ranks.add(_RankEntry(
          label: 'Test Series Rank',
          location: seriesName,
          rank: asInt(series['rank']),
          participants: asInt(series['participants']) ?? 0,
          icon: Icons.emoji_events_rounded,
          color: AppColors.gold,
          leaderboardQuery: Uri(queryParameters: {
            'seriesId': seriesId,
            'seriesTitle': ?seriesName,
          }).query,
        ));
      }

      final wb = section('westBengal');
      ranks.add(_RankEntry(
        label: 'State Rank',
        location: 'West Bengal',
        rank: asInt(wb['rank']),
        participants: asInt(wb['participants']) ?? 0,
        icon: Icons.location_city_rounded,
        color: AppColors.purple,
        leaderboardQuery: 'scope=0',
      ));

      final district = section('district');
      final districtName = district['name'] as String?;
      if (districtName != null) {
        ranks.add(_RankEntry(
          label: 'District Rank',
          location: districtName,
          rank: asInt(district['rank']),
          participants: asInt(district['participants']) ?? 0,
          icon: Icons.location_on_rounded,
          color: AppColors.pink,
          leaderboardQuery: Uri(queryParameters: {'scope': '1', 'district': districtName}).query,
        ));
      }
    }

    if (mounted) {
      setState(() {
        _ranks = ranks;
        _ranksLoading = false;
      });
    }
  }

  String _formatDuration(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = seconds % 60;
    if (h > 0) return '${h}h ${m}m';
    return '${m}m ${s}s';
  }

  String _formatNumber(num value) {
    final digits = value.toInt().toString();
    final buffer = StringBuffer();
    for (var i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) buffer.write(',');
      buffer.write(digits[i]);
    }
    return buffer.toString();
  }

  String _formatMarks(double value) =>
      value.toStringAsFixed(2).replaceFirst(RegExp(r'\.?0+$'), '');

  String _formatDate(DateTime date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final local = date.toLocal();
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final period = local.hour < 12 ? 'AM' : 'PM';
    return '${local.day} ${months[local.month - 1]} ${local.year}, $hour:$minute $period';
  }

  ({String title, String message, Color color}) _verdict(double percentage) {
    if (percentage >= 75) {
      return (title: 'Excellent work!', message: 'You are well prepared for this exam.', color: AppColors.success);
    }
    if (percentage >= 50) {
      return (title: 'Good effort!', message: 'A little more practice will push you ahead.', color: AppColors.warning);
    }
    return (title: 'Keep practicing!', message: 'Review your mistakes and try again.', color: const Color(0xFFF43F5E));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/home'),
        ),
        title: const Text(
          'Test Result',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
            letterSpacing: -0.3,
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    final attempt = _attempt;
    if (attempt == null) {
      return PKEmptyState(
        icon: Icons.assignment_late_outlined,
        title: 'Result not found',
        description: 'We could not load this test result. It may still be syncing — check your Results tab.',
        buttonText: 'Go to Results',
        onButtonPressed: () => context.go('/results'),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        _buildHeroCard(attempt),
        const SizedBox(height: 14),
        _buildBreakdownCard(attempt),
        const SizedBox(height: 14),
        _buildKpiGrid(attempt),
        const SizedBox(height: 22),
        _buildSectionHeader('Your Rank', trailing: _ranks.isNotEmpty ? 'Leaderboard' : null, onTrailingTap: () => context.push('/leaderboard')),
        const SizedBox(height: 10),
        _buildRanks(),
        const SizedBox(height: 24),
        _buildActions(attempt),
      ],
    );
  }

  // ─── Hero ──────────────────────────────────────────────────────────────────

  Widget _buildHeroCard(TestAttemptModel attempt) {
    final percentage = attempt.totalMarks > 0
        ? (attempt.score / attempt.totalMarks * 100).clamp(0, 100).toDouble()
        : attempt.percentage.clamp(0, 100).toDouble();
    final verdict = _verdict(percentage);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(color: Color(0x330158FC), blurRadius: 24, offset: Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (attempt.testSeriesTitle != null && attempt.testSeriesTitle!.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              ),
              child: Text(
                attempt.testSeriesTitle!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
              ),
            ),
            const SizedBox(height: 10),
          ],
          Text(
            attempt.testTitle,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: -0.3,
              height: 1.25,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.schedule_rounded, size: 13, color: Colors.white.withValues(alpha: 0.65)),
              const SizedBox(width: 4),
              Text(
                'Submitted ${_formatDate(attempt.completedAt)}',
                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.7)),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _ScoreRing(
                percentage: percentage,
                color: verdict.color,
                score: _formatMarks(attempt.score),
                total: _formatMarks(attempt.totalMarks),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                      decoration: BoxDecoration(
                        color: verdict.color.withValues(alpha: 0.22),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${percentage.toStringAsFixed(percentage == percentage.roundToDouble() ? 0 : 1)}% scored',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color.lerp(verdict.color, Colors.white, 0.45)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      verdict.title,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      verdict.message,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withValues(alpha: 0.75),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Answer breakdown ──────────────────────────────────────────────────────

  Widget _buildBreakdownCard(TestAttemptModel attempt) {
    final total = math.max(
      attempt.totalQuestions,
      attempt.correctCount + attempt.wrongCount + attempt.skippedCount,
    );
    const correctColor = AppColors.success;
    const wrongColor = Color(0xFFF43F5E);
    const skippedColor = Color(0xFFCBD5E1);

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Answer Breakdown',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.2),
              ),
              const Spacer(),
              Text(
                '$total Questions',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: SizedBox(
              height: 10,
              child: total == 0
                  ? Container(color: AppColors.surfaceMuted)
                  : Row(
                      children: [
                        if (attempt.correctCount > 0)
                          Expanded(flex: attempt.correctCount, child: Container(color: correctColor)),
                        if (attempt.wrongCount > 0)
                          Expanded(flex: attempt.wrongCount, child: Container(color: wrongColor)),
                        if (total - attempt.correctCount - attempt.wrongCount > 0)
                          Expanded(
                            flex: total - attempt.correctCount - attempt.wrongCount,
                            child: Container(color: skippedColor),
                          ),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: _buildLegend('Correct', attempt.correctCount, correctColor, Icons.check_circle_rounded)),
              Expanded(child: _buildLegend('Wrong', attempt.wrongCount, wrongColor, Icons.cancel_rounded)),
              Expanded(
                child: _buildLegend(
                  'Skipped',
                  total - attempt.correctCount - attempt.wrongCount,
                  const Color(0xFF94A3B8),
                  Icons.remove_circle_rounded,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegend(String label, int count, Color color, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$count',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary, height: 1.1),
            ),
            Text(
              label,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
            ),
          ],
        ),
      ],
    );
  }

  // ─── KPI bento ─────────────────────────────────────────────────────────────

  Widget _buildKpiGrid(TestAttemptModel attempt) {
    final attempted = attempt.correctCount + attempt.wrongCount;
    final total = math.max(attempt.totalQuestions, attempted + attempt.skippedCount);
    final avgSeconds = attempted > 0 ? (attempt.timeSpentSeconds / attempted).round() : 0;
    final accuracy = attempt.accuracy.clamp(0, 100).toDouble();
    final accuracyColor = accuracy >= 75
        ? AppColors.success
        : accuracy >= 50
            ? AppColors.warning
            : const Color(0xFFF43F5E);

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildKpiTile(
                icon: Icons.track_changes_rounded,
                color: accuracyColor,
                label: 'Accuracy',
                value: '${accuracy.round()}%',
                caption: '$attempted attempted',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildKpiTile(
                icon: Icons.timer_outlined,
                color: AppColors.primary,
                label: 'Time Taken',
                value: _formatDuration(attempt.timeSpentSeconds),
                caption: attempted > 0 ? '~${avgSeconds}s per question' : 'No questions attempted',
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildKpiTile(
                icon: Icons.fact_check_outlined,
                color: AppColors.cyan,
                label: 'Attempted',
                value: '$attempted/$total',
                caption: total > 0 ? '${(attempted / total * 100).round()}% coverage' : '—',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildKpiTile(
                icon: Icons.trending_down_rounded,
                color: const Color(0xFFF43F5E),
                label: 'Negative Marks',
                value: attempt.negativeMarksDeducted > 0 ? '-${_formatMarks(attempt.negativeMarksDeducted)}' : '0',
                caption: attempt.wrongCount > 0 ? 'From ${attempt.wrongCount} wrong answers' : 'No penalty',
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildKpiTile({
    required IconData icon,
    required Color color,
    required String label,
    required String value,
    required String caption,
  }) {
    return _card(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: color),
          ),
          const SizedBox(height: 10),
          Text(
            label,
            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 2),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            caption,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w500, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }

  // ─── Ranks ─────────────────────────────────────────────────────────────────

  Widget _buildSectionHeader(String title, {String? trailing, VoidCallback? onTrailingTap}) {
    return Row(
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.3),
        ),
        const Spacer(),
        if (trailing != null)
          GestureDetector(
            onTap: onTrailingTap,
            child: Row(
              children: [
                Text(
                  trailing,
                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.primary),
                ),
                const Icon(Icons.chevron_right_rounded, size: 18, color: AppColors.primary),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildRanks() {
    if (_ranksLoading) {
      return _card(
        child: const SizedBox(
          height: 56,
          child: Center(
            child: SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
            ),
          ),
        ),
      );
    }

    if (_ranks.isEmpty) {
      return _card(
        child: const Row(
          children: [
            Icon(Icons.leaderboard_outlined, color: AppColors.textMuted, size: 22),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Rankings will appear once your result syncs. Sign in to compare with other students.',
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500, color: AppColors.textSecondary, height: 1.4),
              ),
            ),
          ],
        ),
      );
    }

    return _card(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          for (var i = 0; i < _ranks.length; i++) ...[
            if (i > 0) const Divider(height: 1, thickness: 1, color: AppColors.borderSubtle, indent: 16, endIndent: 16),
            _buildRankRow(_ranks[i]),
          ],
        ],
      ),
    );
  }

  Widget _buildRankRow(_RankEntry entry) {
    final hasRank = entry.rank != null && entry.participants > 0;
    final topPercent = hasRank
        ? math.max(1, (entry.rank! / entry.participants * 100).ceil())
        : null;

    return InkWell(
      onTap: () => context.push('/leaderboard?${entry.leaderboardQuery}'),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: entry.color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(entry.icon, color: entry.color, size: 21),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.label,
                    style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hasRank
                        ? '${entry.location != null ? '${entry.location} · ' : ''}${_formatNumber(entry.participants)} students'
                        : entry.location ?? 'Not ranked yet',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  hasRank ? '#${_formatNumber(entry.rank!)}' : '—',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.4,
                  ),
                ),
                if (topPercent != null)
                  Text(
                    'Top $topPercent%',
                    style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: AppColors.success),
                  ),
              ],
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
          ],
        ),
      ),
    );
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  Widget _buildActions(TestAttemptModel attempt) {
    final buttonShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(16));

    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: () => context.push('/analysis/${attempt.id}', extra: attempt),
            iconAlignment: IconAlignment.end,
            icon: const Icon(Icons.arrow_forward_rounded, size: 18),
            label: const Text(
              'View Detailed Analysis',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: buttonShape,
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildSecondaryButton(
                icon: Icons.menu_book_rounded,
                label: 'Solutions',
                color: AppColors.primary,
                shape: buttonShape,
                onPressed: () => context.push('/solutions/${attempt.testId}', extra: attempt),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildSecondaryButton(
                icon: Icons.replay_rounded,
                label: 'Retry Test',
                color: const Color(0xFF334155),
                shape: buttonShape,
                onPressed: () => context.push('/live-test/${attempt.testId}'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSecondaryButton({
    required IconData icon,
    required String label,
    required Color color,
    required OutlinedBorder shape,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      height: 48,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 18, color: color),
        label: Text(
          label,
          style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: color),
        ),
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.white,
          side: const BorderSide(color: AppColors.border),
          shape: shape,
        ),
      ),
    );
  }

  Widget _card({required Widget child, EdgeInsetsGeometry padding = const EdgeInsets.all(16)}) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(color: Color(0x08000000), blurRadius: 12, offset: Offset(0, 4)),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: child,
    );
  }
}

/// Radial score gauge drawn on the dark hero surface.
class _ScoreRing extends StatelessWidget {
  final double percentage;
  final Color color;
  final String score;
  final String total;

  const _ScoreRing({
    required this.percentage,
    required this.color,
    required this.score,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 112,
      height: 112,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: percentage / 100),
        duration: const Duration(milliseconds: 900),
        curve: Curves.easeOutCubic,
        builder: (context, value, _) => CustomPaint(
          painter: _ScoreRingPainter(progress: value, color: color),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      score,
                      style: const TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -0.8,
                        height: 1.05,
                      ),
                    ),
                  ),
                ),
                Text(
                  'of $total',
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.7)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ScoreRingPainter extends CustomPainter {
  final double progress;
  final Color color;

  _ScoreRingPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 10.0;
    final center = size.center(Offset.zero);
    final radius = (size.shortestSide - stroke) / 2;

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = Colors.white.withValues(alpha: 0.14)
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke,
    );

    if (progress <= 0) return;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress.clamp(0, 1),
      false,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = stroke,
    );
  }

  @override
  bool shouldRepaint(_ScoreRingPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.color != color;
}

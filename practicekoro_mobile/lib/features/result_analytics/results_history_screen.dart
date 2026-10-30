import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/components/ui.dart';
import '../../core/components/user_avatar.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/ranking_model.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/repositories/ranking_repository.dart';

enum ResultFilter { all, fullMock, topicTests, pyq, liveTests }

class ResultsHistoryScreen extends ConsumerStatefulWidget {
  const ResultsHistoryScreen({super.key});

  @override
  ConsumerState<ResultsHistoryScreen> createState() =>
      _ResultsHistoryScreenState();
}

class _ResultsHistoryScreenState extends ConsumerState<ResultsHistoryScreen> {
  ResultFilter _selectedFilter = ResultFilter.all;

  bool _matchesFilter(TestAttemptModel attempt, ResultFilter filter) {
    final lowerTitle = attempt.testTitle.toLowerCase();
    final isLive =
        attempt.testId.startsWith('live') || lowerTitle.contains('live');
    final isTopic =
        attempt.testId.startsWith('topic_') || lowerTitle.contains('topic');
    final isPyq =
        attempt.testId.contains('pyq') ||
        lowerTitle.contains('pyq') ||
        lowerTitle.contains('official pyq');
    final isMock = !isTopic && !isPyq && !isLive;

    switch (filter) {
      case ResultFilter.all:
        return true;
      case ResultFilter.fullMock:
        return isMock;
      case ResultFilter.topicTests:
        return isTopic;
      case ResultFilter.pyq:
        return isPyq;
      case ResultFilter.liveTests:
        return isLive;
    }
  }

  @override
  Widget build(BuildContext context) {
    final summaryAsync = ref.watch(rankingSummaryProvider);
    final historyAsync = ref.watch(attemptHistoryProvider);
    final previewAsync = ref.watch(rankPreviewProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: const Color(0xFF0158FC),
          onRefresh: () async {
            ref.invalidate(attemptHistoryProvider);
            ref.invalidate(rankingSummaryProvider);
            ref.invalidate(rankPreviewProvider);
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
            children: [
              // Top Title (non-sticky, middle-aligned)
              const Center(
                child: Padding(
                  padding: EdgeInsets.only(top: 4, bottom: 16),
                  child: Text(
                    'My Results',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0B1F44),
                      letterSpacing: -0.3,
                    ),
                  ),
                ),
              ),

              // 1. Summary Cards (Tests Taken, Avg. Score, Best Rank)
              summaryAsync.when(
                loading: () => const _SummaryCardsShimmer(),
                error: (_, _) => const _SummaryCardsShimmer(),
                data: (summary) => _SummaryCardsRow(summary: summary),
              ),
              const SizedBox(height: 18),

              // 3. Filter Tabs (All, Full Mock, Topic Tests, PYQ, Live Tests)
              _FilterPillsRow(
                selectedFilter: _selectedFilter,
                onSelect: (filter) => setState(() => _selectedFilter = filter),
              ),
              const SizedBox(height: 22),

              // 4. Student Rank List Preview Section
              _SectionHeader(
                title: 'Student Rank List',
                onViewAll: () => context.push('/results/rankings'),
              ),
              const SizedBox(height: 12),
              previewAsync.when(
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
                error: (_, _) => UIMessage.error(
                  message: 'Could not load the rank list.',
                  onAction: () => ref.invalidate(rankPreviewProvider),
                ),
                data: (rankItems) => rankItems.isEmpty
                    ? const _EmptyCard(
                        title: 'No rankings yet',
                        message:
                            'Finish a test to see where you stand among other students.',
                      )
                    : _RankPreviewCard(
                        items: rankItems,
                        onTap: () => context.push('/results/rankings'),
                      ),
              ),
              const SizedBox(height: 24),

              // 5. Recent Results Section
              _SectionHeader(
                title: 'Recent Results',
                onViewAll: () => context.push('/results/rankings'),
              ),
              const SizedBox(height: 12),
              historyAsync.when(
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
                error: (_, _) => UIMessage.error(
                  message: 'Could not load your recent results.',
                  onAction: () => ref.invalidate(attemptHistoryProvider),
                ),
                data: (attempts) {
                  final filtered = attempts
                      .where((a) => _matchesFilter(a, _selectedFilter))
                      .toList();

                  if (filtered.isEmpty) {
                    return const _EmptyCard(
                      title: 'No results for this category',
                      message:
                          'Complete a test in this section to view your detailed result.',
                    );
                  }

                  return Column(
                    children: [
                      for (var i = 0; i < filtered.length; i++) ...[
                        _RecentResultCard(
                          attempt: filtered[i],
                          onTap: () =>
                              context.push('/results/detail/${filtered[i].id}'),
                        ),
                        if (i < filtered.length - 1) const SizedBox(height: 10),
                      ],
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  final String title;
  final String message;

  const _EmptyCard({required this.title, required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.assignment_outlined,
            size: 40,
            color: Colors.blueGrey[300],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Color(0xFF334155),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback onViewAll;

  const _SectionHeader({required this.title, required this.onViewAll});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        InkWell(
          onTap: onViewAll,
          borderRadius: BorderRadius.circular(8),
          child: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'View All',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0158FC),
                  ),
                ),
                SizedBox(width: 4),
                Icon(
                  Icons.arrow_forward_rounded,
                  size: 15,
                  color: Color(0xFF0158FC),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SummaryCardsRow extends StatelessWidget {
  /// Null while loading or unavailable: every card shows a dash.
  final RankingSummary? summary;

  const _SummaryCardsRow({required this.summary});

  @override
  Widget build(BuildContext context) {
    final summary = this.summary;
    final hasTests = summary != null && summary.testsTaken > 0;
    final avg = summary?.averageScore ?? 0;
    return Row(
      children: [
        Expanded(
          child: _SummaryCard(
            icon: Icons.description_outlined,
            iconColor: const Color(0xFF0158FC),
            iconBg: const Color(0xFFEFF6FF),
            value: summary?.testsTaken.toString() ?? '-',
            label: 'Tests Taken',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _SummaryCard(
            icon: Icons.bar_chart_rounded,
            iconColor: const Color(0xFF16A34A),
            iconBg: const Color(0xFFF0FDF4),
            value: !hasTests
                ? '-'
                : (avg == avg.roundToDouble()
                      ? avg.toInt().toString()
                      : avg.toStringAsFixed(1)),
            label: 'Avg. Score',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _SummaryCard(
            icon: Icons.emoji_events_rounded,
            iconColor: const Color(0xFF9333EA),
            iconBg: const Color(0xFFFAF5FF),
            value: summary?.formattedBestRank ?? '-',
            label: 'Best Rank',
          ),
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String value;
  final String label;

  const _SummaryCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
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
      child: Column(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
              height: 1.25,
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
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _SummaryCardsShimmer extends StatelessWidget {
  const _SummaryCardsShimmer();

  @override
  Widget build(BuildContext context) {
    return const _SummaryCardsRow(summary: null);
  }
}

class _FilterPillsRow extends StatelessWidget {
  final ResultFilter selectedFilter;
  final ValueChanged<ResultFilter> onSelect;

  const _FilterPillsRow({required this.selectedFilter, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final filters = [
      (ResultFilter.all, 'All'),
      (ResultFilter.fullMock, 'Full Mock'),
      (ResultFilter.topicTests, 'Topic Tests'),
      (ResultFilter.pyq, 'PYQ'),
      (ResultFilter.liveTests, 'Live Tests'),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final (f, label) in filters) ...[
            _PillButton(
              label: label,
              isSelected: selectedFilter == f,
              onTap: () => onSelect(f),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _PillButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _PillButton({
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0158FC) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF0158FC)
                : const Color(0xFFE2E8F0),
            width: 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF0158FC).withValues(alpha: 0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }
}

class _RankPreviewCard extends StatelessWidget {
  final List<StudentRankItem> items;
  final VoidCallback onTap;

  const _RankPreviewCard({required this.items, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
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
        child: Column(
          children: [
            for (var i = 0; i < items.length; i++) ...[
              _RankPreviewRow(item: items[i]),
              if (i < items.length - 1)
                const Divider(
                  height: 1,
                  thickness: 0.8,
                  color: Color(0xFFF1F5F9),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RankPreviewRow extends StatelessWidget {
  final StudentRankItem item;

  const _RankPreviewRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final isMe = item.isCurrentUser;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFFEFF6FF) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          // Rank Badge
          _buildRankBadge(item.rank, isMe),
          const SizedBox(width: 10),

          // Avatar
          _buildAvatar(item),
          const SizedBox(width: 10),

          // Name and Test Subtitle
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.displayName,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: isMe ? FontWeight.w800 : FontWeight.w700,
                    color: isMe
                        ? const Color(0xFF0158FC)
                        : const Color(0xFF0F172A),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),
                Text(
                  item.testTitle,
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
          const SizedBox(width: 8),

          // Score and Rank
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                item.scoreDisplay,
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 1),
              Text(
                'Rank #${item.rank}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isMe
                      ? const Color(0xFF0158FC)
                      : const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRankBadge(int rank, bool isMe) {
    if (rank == 1) {
      return Container(
        width: 26,
        height: 26,
        decoration: const BoxDecoration(
          color: Color(0xFFFEF3C7),
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: const Text('🥇', style: TextStyle(fontSize: 13)),
      );
    }
    if (rank == 2) {
      return Container(
        width: 26,
        height: 26,
        decoration: const BoxDecoration(
          color: Color(0xFFF1F5F9),
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: const Text('🥈', style: TextStyle(fontSize: 13)),
      );
    }
    if (rank == 3) {
      return Container(
        width: 26,
        height: 26,
        decoration: const BoxDecoration(
          color: Color(0xFFFFEDD5),
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: const Text('🥉', style: TextStyle(fontSize: 13)),
      );
    }
    return Container(
      width: 28,
      height: 24,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFFDBEAFE) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(6),
      ),
      alignment: Alignment.center,
      child: Text(
        '#$rank',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w800,
          color: isMe ? const Color(0xFF0158FC) : const Color(0xFF475569),
        ),
      ),
    );
  }

  Widget _buildAvatar(StudentRankItem item) {
    if (item.isCurrentUser) {
      return const UserAvatar(size: 32);
    }
    return CircleAvatar(
      radius: 16,
      backgroundColor: const Color(0xFFE2E8F0),
      child: Text(
        item.name.isNotEmpty ? item.name[0].toUpperCase() : 'S',
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: Color(0xFF334155),
        ),
      ),
    );
  }
}

class _RecentResultCard extends StatelessWidget {
  final TestAttemptModel attempt;
  final VoidCallback onTap;

  const _RecentResultCard({required this.attempt, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final lowerTitle = attempt.testTitle.toLowerCase();
    final isLive =
        attempt.testId.startsWith('live') || lowerTitle.contains('live');
    final isTopic =
        attempt.testId.startsWith('topic_') || lowerTitle.contains('topic');
    final isPyq =
        attempt.testId.contains('pyq') ||
        lowerTitle.contains('pyq') ||
        lowerTitle.contains('official pyq');

    final (icon, iconColor, iconBg) = isLive
        ? (
            Icons.sensors_rounded,
            const Color(0xFF0158FC),
            const Color(0xFFEFF6FF),
          )
        : (isTopic
              ? (
                  Icons.menu_book_rounded,
                  const Color(0xFFEA580C),
                  const Color(0xFFFFF7ED),
                )
              : (isPyq
                    ? (
                        Icons.history_edu_rounded,
                        const Color(0xFF9333EA),
                        const Color(0xFFFAF5FF),
                      )
                    : (
                        Icons.assignment_turned_in_rounded,
                        const Color(0xFFDC2626),
                        const Color(0xFFFEF2F2),
                      )));

    final scoreStr = attempt.score == attempt.score.roundToDouble()
        ? attempt.score.toInt().toString()
        : attempt.score.toStringAsFixed(1);
    final totalMarksStr =
        attempt.totalMarks == attempt.totalMarks.roundToDouble()
        ? attempt.totalMarks.toInt().toString()
        : attempt.totalMarks.toStringAsFixed(0);

    final attemptedCount = attempt.correctCount + attempt.wrongCount;
    final totalQuestions = attemptedCount + attempt.skippedCount;
    final qCountDisplay = totalQuestions > 0
        ? '$attemptedCount / $totalQuestions Questions'
        : '5 / 5 Questions';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
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
            // Left Icon Badge
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: iconColor, size: 22),
                ),
                if (isLive)
                  Positioned(
                    bottom: -5,
                    left: 2,
                    right: 2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 3,
                        vertical: 1,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0158FC),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      alignment: Alignment.center,
                      child: const Text(
                        'LIVE',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),

            // Test Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    attempt.testTitle,
                    style: const TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${DateFormat('d MMM yyyy').format(attempt.completedAt)} • $qCountDisplay',
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
            const SizedBox(width: 8),

            // Score Pill (Green/Red)
            _buildScoreBadge(attempt, scoreStr, totalMarksStr),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreBadge(
    TestAttemptModel attempt,
    String scoreStr,
    String totalMarksStr,
  ) {
    final pct = attempt.totalMarks > 0
        ? (attempt.score / attempt.totalMarks * 100)
        : 0.0;
    final isLow = pct < 35.0;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isLow ? const Color(0xFFFEF2F2) : const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isLow ? const Color(0xFFFCA5A5) : const Color(0xFFA7F3D0),
          width: 0.8,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            scoreStr,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: isLow ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
            ),
          ),
          const SizedBox(width: 3),
          Text(
            totalMarksStr,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: isLow
                  ? const Color(0xFFB91C1C).withValues(alpha: 0.7)
                  : const Color(0xFF15803D).withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}

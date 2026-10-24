import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';
import '../../data/models/live_test_model.dart';
import '../../data/repositories/catalog_repository.dart';

class LiveTestsScreen extends ConsumerStatefulWidget {
  const LiveTestsScreen({super.key});

  @override
  ConsumerState<LiveTestsScreen> createState() => _LiveTestsScreenState();
}

class _LiveTestsScreenState extends ConsumerState<LiveTestsScreen> {
  String _selectedFilter = 'All'; // 'All', 'Live Now', 'Upcoming'

  @override
  Widget build(BuildContext context) {
    final liveTestsAsync = ref.watch(liveTestsProvider(null));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 1,
        shadowColor: Colors.black12,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: Color(0xFF0F172A),
          ),
          tooltip: 'Back',
          onPressed: () {
            if (GoRouter.of(context).canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
        title: const Text(
          'Live Tests',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            // Filter chips
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                children: [
                  for (final filter in ['All', 'Live Now', 'Upcoming']) ...[
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(
                          filter,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: _selectedFilter == filter
                                ? Colors.white
                                : const Color(0xFF475569),
                          ),
                        ),
                        selected: _selectedFilter == filter,
                        selectedColor: const Color(0xFF2563EB),
                        backgroundColor: const Color(0xFFF1F5F9),
                        side: BorderSide(
                          color: _selectedFilter == filter
                              ? const Color(0xFF2563EB)
                              : const Color(0xFFE2E8F0),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        showCheckmark: false,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() => _selectedFilter = filter);
                          }
                        },
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Divider(height: 1, thickness: 1, color: Color(0xFFE2E8F0)),

            // Content List
            Expanded(
              child: liveTestsAsync.when(
                loading: () => const Center(child: UILoading()),
                error: (_, _) => Center(
                  child: UIMessage.error(
                    message: 'Could not load live tests.',
                    onAction: () => ref.invalidate(liveTestsProvider(null)),
                  ),
                ),
                data: (tests) {
                  final filtered = tests.where((t) {
                    if (_selectedFilter == 'Live Now') return t.isLive;
                    if (_selectedFilter == 'Upcoming') return t.isUpcoming;
                    return true;
                  }).toList();

                  if (filtered.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.sensors_off_rounded,
                            size: 48,
                            color: Colors.grey.shade400,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _selectedFilter == 'Live Now'
                                ? 'No live tests active right now'
                                : 'No tests found in this category',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return RefreshIndicator(
                    color: const Color(0xFF2563EB),
                    onRefresh: () async {
                      ref.invalidate(liveTestsProvider(null));
                    },
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: filtered.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 14),
                      itemBuilder: (context, index) {
                        final test = filtered[index];
                        return _LiveTestCard(
                          test: test,
                          index: index,
                          onTap: () {
                            context.push('/test/${test.testId}/details');
                          },
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LiveTestPalette {
  final Color borderColor;
  final Color accentColor;
  final Color thumbBg;
  final Color timeColor;
  final String iconAsset;

  const _LiveTestPalette({
    required this.borderColor,
    required this.accentColor,
    required this.thumbBg,
    required this.timeColor,
    required this.iconAsset,
  });

  static _LiveTestPalette forTest(LiveTestModel test, int index) {
    final title = '${test.title} ${test.examTitle ?? ''}'.toLowerCase();
    if (title.contains('wbp') || title.contains('police') || title.contains('kp')) {
      return const _LiveTestPalette(
        borderColor: Color(0xFF93C5FD),
        accentColor: Color(0xFF2563EB),
        thumbBg: Color(0xFFEFF6FF),
        timeColor: Color(0xFF2563EB),
        iconAsset: 'assets/images/exams/live_icon_wbp.png',
      );
    }
    if (title.contains('tet') || title.contains('wbssc') || title.contains('teach')) {
      return const _LiveTestPalette(
        borderColor: Color(0xFFFCA5A5),
        accentColor: Color(0xFFF43F5E),
        thumbBg: Color(0xFFFFF1F2),
        timeColor: Color(0xFFE11D48),
        iconAsset: 'assets/images/exams/live_icon_wbssc.png',
      );
    }
    if (title.contains('railway') || title.contains('ntpc') || title.contains('rrb') || title.contains('ssc')) {
      return const _LiveTestPalette(
        borderColor: Color(0xFF6EE7B7),
        accentColor: Color(0xFF0D9488),
        thumbBg: Color(0xFFECFDF5),
        timeColor: Color(0xFF0D9488),
        iconAsset: 'assets/images/exams/live_icon_railway.png',
      );
    }

    // Index-based rotation fallback
    final mod = index % 3;
    if (mod == 0) {
      return const _LiveTestPalette(
        borderColor: Color(0xFF93C5FD),
        accentColor: Color(0xFF2563EB),
        thumbBg: Color(0xFFEFF6FF),
        timeColor: Color(0xFF2563EB),
        iconAsset: 'assets/images/exams/live_icon_wbp.png',
      );
    } else if (mod == 1) {
      return const _LiveTestPalette(
        borderColor: Color(0xFFFCA5A5),
        accentColor: Color(0xFFF43F5E),
        thumbBg: Color(0xFFFFF1F2),
        timeColor: Color(0xFFE11D48),
        iconAsset: 'assets/images/exams/live_icon_wbssc.png',
      );
    } else {
      return const _LiveTestPalette(
        borderColor: Color(0xFF6EE7B7),
        accentColor: Color(0xFF0D9488),
        thumbBg: Color(0xFFECFDF5),
        timeColor: Color(0xFF0D9488),
        iconAsset: 'assets/images/exams/live_icon_railway.png',
      );
    }
  }
}

class _LiveTestCard extends StatelessWidget {
  final LiveTestModel test;
  final int index;
  final VoidCallback onTap;

  const _LiveTestCard({
    required this.test,
    required this.index,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final palette = _LiveTestPalette.forTest(test, index);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: palette.borderColor, width: 1.2),
            boxShadow: [
              BoxShadow(
                color: palette.accentColor.withValues(alpha: 0.06),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // 3D Icon on pastel background
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: palette.thumbBg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Image.asset(
                    palette.iconAsset,
                    width: 44,
                    height: 44,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => Icon(
                      Icons.quiz_outlined,
                      size: 28,
                      color: palette.accentColor,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Content details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Status Badge
                    if (test.isLive)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.sensors_rounded, size: 11, color: Colors.white),
                            SizedBox(width: 3),
                            Text(
                              'LIVE',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.schedule_rounded, size: 11, color: Color(0xFFD97706)),
                            SizedBox(width: 3),
                            Text(
                              'UPCOMING',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFFD97706),
                                letterSpacing: 0.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 3),

                    // Test Title
                    Text(
                      test.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 2),

                    // Scheduled Time
                    Text(
                      test.formattedTime,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: palette.timeColor,
                      ),
                    ),
                    const SizedBox(height: 5),

                    // Bottom info: duration, participants, arrow CTA
                    Row(
                      children: [
                        const Icon(
                          Icons.access_time_rounded,
                          size: 12,
                          color: Color(0xFF64748B),
                        ),
                        const SizedBox(width: 3),
                        Text(
                          '${test.durationMinutes} Mins',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                        ),
                        if (test.formattedParticipants != null) ...[
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 4),
                            child: Text(
                              '•',
                              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
                            ),
                          ),
                          const Icon(
                            Icons.group_outlined,
                            size: 13,
                            color: Color(0xFF64748B),
                          ),
                          const SizedBox(width: 3),
                          Text(
                            test.formattedParticipants!,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                        const Spacer(),
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: palette.accentColor,
                          ),
                          child: const Icon(
                            Icons.arrow_forward_rounded,
                            size: 13,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../exams/exam_logo.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/attempt_model.dart';
import '../../data/models/hero_banner_model.dart';
import '../../data/models/live_test_model.dart';
import '../../data/models/ranking_model.dart';
import '../../data/models/subject_model.dart';
import '../../data/models/topic_model.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/banner_repository.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/repositories/profile_repository.dart';
import '../../data/repositories/subscription_repository.dart';
import '../../data/repositories/ranking_repository.dart';
import '../../core/components/user_avatar.dart';

/// In-progress topics provider for student continuation
final _inProgressTopicsProvider =
    FutureProvider<List<(SubjectModel, TopicModel)>>((ref) async {
      final subjects = await ref.watch(subjectsProvider.future);
      final result = <(SubjectModel, TopicModel)>[];
      for (final subject in subjects) {
        final topics = await ref.watch(topicsProvider(subject.id).future);
        for (final topic in topics) {
          if (topic.progress > 0 && topic.progress < 1) {
            result.add((subject, topic));
          }
        }
      }
      return result;
    });

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attempts =
        ref.watch(attemptHistoryProvider).value ?? const <TestAttemptModel>[];
    final inProgress = ref.watch(_inProgressTopicsProvider).value ?? const [];
    final exams = ref.watch(examsProvider).value ?? const [];
    final subjects = ref.watch(subjectsProvider).value ?? const [];
    final liveTests =
        ref.watch(liveTestsProvider(null)).value ?? const <LiveTestModel>[];
    final banners =
        ref.watch(homeBannersProvider).value ?? const [HeroBannerModel.defaultBanner];
    final profile = ref.watch(studentProfileProvider);
    // Loads the Pro Pass status, which also re-locks premium tests once it expires.
    ref.watch(studentSubscriptionProvider);
    final profileName = profile.fullName.trim();
    final localName = LocalStorageService.getUserName().trim();
    final authUser = supabaseClient?.auth.currentUser;
    final authName = authUser?.userMetadata?['full_name']?.toString().trim() ??
        authUser?.userMetadata?['name']?.toString().trim() ??
        authUser?.email?.split('@').first.trim() ??
        '';
    final studentName = profileName.isNotEmpty
        ? profileName
        : (localName.isNotEmpty
            ? localName
            : (authName.isNotEmpty ? authName : 'Student'));

    final rankingSummary = ref.watch(rankingSummaryProvider).value;
    final storedRank = LocalStorageService.getUserRank();
    final effectiveRank = (rankingSummary != null && rankingSummary.bestRank > 0)
        ? rankingSummary.bestRank
        : (storedRank > 0
            ? storedRank
            : (attempts.isNotEmpty && attempts.first.rank > 0
                ? attempts.first.rank
                : 0));
    final rankText = effectiveRank > 0
        ? RankingSummary.formatOrdinal(effectiveRank)
        : '-';
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good morning,'
        : (hour < 17 ? 'Good afternoon,' : 'Good evening,');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.read(studentProfileProvider.notifier).reload();
            ref.invalidate(rankingSummaryProvider);
            ref.invalidate(subjectsProvider);
            ref.invalidate(examsProvider);
            ref.read(bannerRepositoryProvider).refreshIfStale();
            ref.invalidate(homeBannersProvider);
            ref.invalidate(attemptHistoryProvider);
            ref.invalidate(_inProgressTopicsProvider);
          },
          child: ListView(
            padding: const EdgeInsets.only(bottom: 96),
            children: [
              // 1. Top App Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 12, 18, 8),
                child: Row(
                  children: [
                    // Official PracticeKoro Brand Logo (Circular App Icon + Practice (Black) Koro (Logo Blue))
                    Flexible(
                      child: InkWell(
                        onTap: () {
                          ref.invalidate(subjectsProvider);
                          ref.invalidate(examsProvider);
                          ref.invalidate(homeBannersProvider);
                          ref.invalidate(attemptHistoryProvider);
                          ref.invalidate(_inProgressTopicsProvider);
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF005CFD).withValues(alpha: 0.18),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: Image.asset(
                                  'assets/images/logo-circle.webp',
                                  width: 38,
                                  height: 38,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => Container(
                                    color: const Color(0xFF005CFD),
                                    child: const Icon(
                                      Icons.assignment_turned_in_rounded,
                                      color: Colors.white,
                                      size: 22,
                                    ),
                                  ),
                                  semanticLabel: 'PracticeKoro',
                                ),
                              ),
                            ),
                            const SizedBox(width: 9),
                            Flexible(
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                alignment: Alignment.centerLeft,
                                child: RichText(
                                  text: const TextSpan(
                                    children: [
                                      TextSpan(
                                        text: 'Practice',
                                        style: TextStyle(
                                          fontSize: 21,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF0F172A),
                                          letterSpacing: -0.4,
                                        ),
                                      ),
                                      TextSpan(
                                        text: 'Koro',
                                        style: TextStyle(
                                          fontSize: 21,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF005CFD),
                                          letterSpacing: -0.4,
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
                    ),
                    const SizedBox(width: 8),
                    // Search Action
                    IconButton(
                      icon: const Icon(Icons.search_rounded),
                      color: const Color(0xFF0F172A),
                      iconSize: 24,
                      padding: const EdgeInsets.all(8),
                      constraints: const BoxConstraints(
                        minWidth: 38,
                        minHeight: 38,
                      ),
                      tooltip: 'Search',
                      onPressed: () => context.push('/search'),
                    ),
                    // Notification Bell (no unread badge: there is no unread data)
                    IconButton(
                      icon: const Icon(
                        Icons.notifications_none_rounded,
                        color: Color(0xFF0F172A),
                        size: 24,
                      ),
                      padding: const EdgeInsets.all(8),
                      constraints: const BoxConstraints(
                        minWidth: 38,
                        minHeight: 38,
                      ),
                      tooltip: 'Notifications',
                      onPressed: () => context.push('/notifications'),
                    ),
                    const SizedBox(width: 4),
                    // Student Avatar (User Profile Picture)
                    UserAvatar(
                      size: 36,
                      borderWidth: 1.5,
                      borderColor: const Color(0xFF2563EB).withValues(alpha: 0.3),
                      onTap: () => context.go('/profile'),
                    ),
                  ],
                ),
              ),

              // 2. Greeting & Global Rank Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 4, 18, 10),
                child: Row(
                  children: [
                    const _WavingHand(),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            greeting,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          Text(
                            studentName,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                              letterSpacing: -0.3,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Rank Card
                    InkWell(
                      onTap: () => context.go('/results'),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 11,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: const Color(0xFFFDE68A),
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFD97706).withValues(alpha: 0.08),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: Color(0xFFF59E0B),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.emoji_events_rounded,
                                color: Colors.white,
                                size: 14,
                              ),
                            ),
                            const SizedBox(width: 7),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text(
                                  'Rank',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFFB45309),
                                    letterSpacing: 0.3,
                                  ),
                                ),
                                Text(
                                  rankText,
                                  style: const TextStyle(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF78350F),
                                    letterSpacing: -0.2,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // 3. Hero Banner Card / Carousel (Dynamic from Admin Panel with offline fallback)
              _HeroBannerSection(banners: banners),

              // 4. Exams for You Section
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 22, 18, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            const Text(
                              'Exams ',
                              style: TextStyle(
                                fontSize: 16.5,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF01114E),
                                letterSpacing: -0.3,
                              ),
                            ),
                            IntrinsicWidth(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text(
                                    'for You',
                                    style: TextStyle(
                                      fontSize: 16.5,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF016BFC),
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                  const SizedBox(height: 1.5),
                                  SizedBox(
                                    height: 4.5,
                                    child: Image.asset(
                                      'assets/images/exams_for_you_underline.webp',
                                      fit: BoxFit.fill,
                                      errorBuilder: (context, error, stackTrace) =>
                                          const CustomPaint(
                                        painter: _ExamsForYouSwooshPainter(),
                                      ),
                                      excludeFromSemantics: true,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: () => context.go('/exams'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 13,
                          vertical: 5.5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: const Color(0xFFDBEAFE),
                            width: 1.2,
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'See All',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF2563EB),
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(
                              Icons.arrow_forward_rounded,
                              size: 13,
                              color: Color(0xFF2563EB),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: Column(
                  children: [
                    // Exams list exactly matching screenshot format: Title, Category tag, Count Tests Available
                    for (final (i, e) in exams.take(3).indexed) ...[
                      if (i > 0) const SizedBox(height: 12),
                      _ExamRecommendCard(
                        title: e.title,
                        subtitle:
                            '${e.totalTests} Tests Available',
                        iconUrl: e.iconName,
                        onTap: () => context.push(
                          '/exams/${Uri.encodeComponent(e.id)}?title=${Uri.encodeComponent(e.title)}',
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // 4.5. Live Test Section (Placed immediately above Continue Practice)
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 22, 18, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Live Test',
                      style: TextStyle(
                        fontSize: 16.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.push('/live-tests'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: const Color(0xFFBFDBFE),
                            width: 1,
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'See All',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF2563EB),
                              ),
                            ),
                            SizedBox(width: 3),
                            Icon(
                              Icons.arrow_forward_rounded,
                              size: 13,
                              color: Color(0xFF2563EB),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (liveTests.isNotEmpty)
                SizedBox(
                  height: 122,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    itemCount: liveTests.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 12),
                    itemBuilder: (context, index) {
                      final test = liveTests[index];
                      return _HomeLiveTestCard(
                        test: test,
                        index: index,
                        onTap: () =>
                            context.push('/test/${test.testId}/details'),
                      );
                    },
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.sensors_rounded,
                            color: Color(0xFF2563EB),
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'New Live Tests Coming Soon',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Stay tuned for upcoming statewide mock tests',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // 5. Continue Practicing Section (only with real progress)
              if (inProgress.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 20, 18, 10),
                  child: const Text(
                    'Continue Practicing',
                    style: TextStyle(
                      fontSize: 16.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: _ContinuePracticingCard(
                    inProgress: inProgress,
                    onTap: () => context.go('/practice'),
                  ),
                ),
              ],

              // 6. Explore Subjects Section
              _ExploreSubjectsSection(subjects: subjects),

              // 7. Recent Result Section
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 22, 18, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Recent Result',
                      style: TextStyle(
                        fontSize: 16.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.go('/results'),
                      child: const Row(
                        children: [
                          Text(
                            'See All',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF2563EB),
                            ),
                          ),
                          SizedBox(width: 2),
                          Icon(
                            Icons.arrow_forward_rounded,
                            size: 13,
                            color: Color(0xFF2563EB),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: _RecentResultsList(
                  attempts: attempts,
                  onViewAll: () => context.go('/results'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeLiveTestPalette {
  final Color borderColor;
  final Color accentColor;
  final Color thumbBg;
  final Color timeColor;
  final String iconAsset;

  const _HomeLiveTestPalette({
    required this.borderColor,
    required this.accentColor,
    required this.thumbBg,
    required this.timeColor,
    required this.iconAsset,
  });

  static _HomeLiveTestPalette forTest(LiveTestModel test, int index) {
    final title = '${test.title} ${test.examTitle ?? ''}'.toLowerCase();
    if (title.contains('wbp') || title.contains('police') || title.contains('kp')) {
      return const _HomeLiveTestPalette(
        borderColor: Color(0xFF93C5FD),
        accentColor: Color(0xFF2563EB),
        thumbBg: Color(0xFFEFF6FF),
        timeColor: Color(0xFF2563EB),
        iconAsset: 'assets/images/exams/live_icon_wbp.webp',
      );
    }
    if (title.contains('tet') || title.contains('wbssc') || title.contains('teach')) {
      return const _HomeLiveTestPalette(
        borderColor: Color(0xFFFCA5A5),
        accentColor: Color(0xFFF43F5E),
        thumbBg: Color(0xFFFFF1F2),
        timeColor: Color(0xFFE11D48),
        iconAsset: 'assets/images/exams/live_icon_wbssc.webp',
      );
    }
    if (title.contains('railway') || title.contains('ntpc') || title.contains('rrb') || title.contains('ssc')) {
      return const _HomeLiveTestPalette(
        borderColor: Color(0xFF6EE7B7),
        accentColor: Color(0xFF0D9488),
        thumbBg: Color(0xFFECFDF5),
        timeColor: Color(0xFF0D9488),
        iconAsset: 'assets/images/exams/live_icon_railway.webp',
      );
    }

    final mod = index % 3;
    if (mod == 0) {
      return const _HomeLiveTestPalette(
        borderColor: Color(0xFF93C5FD),
        accentColor: Color(0xFF2563EB),
        thumbBg: Color(0xFFEFF6FF),
        timeColor: Color(0xFF2563EB),
        iconAsset: 'assets/images/exams/live_icon_wbp.webp',
      );
    } else if (mod == 1) {
      return const _HomeLiveTestPalette(
        borderColor: Color(0xFFFCA5A5),
        accentColor: Color(0xFFF43F5E),
        thumbBg: Color(0xFFFFF1F2),
        timeColor: Color(0xFFE11D48),
        iconAsset: 'assets/images/exams/live_icon_wbssc.webp',
      );
    } else {
      return const _HomeLiveTestPalette(
        borderColor: Color(0xFF6EE7B7),
        accentColor: Color(0xFF0D9488),
        thumbBg: Color(0xFFECFDF5),
        timeColor: Color(0xFF0D9488),
        iconAsset: 'assets/images/exams/live_icon_railway.webp',
      );
    }
  }
}

class _HomeLiveTestCard extends StatelessWidget {
  final LiveTestModel test;
  final int index;
  final VoidCallback onTap;

  const _HomeLiveTestCard({
    required this.test,
    required this.index,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final palette = _HomeLiveTestPalette.forTest(test, index);
    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth =
        (screenWidth > 600 ? 285.0 : (screenWidth - 36) * 0.78).clamp(270.0, 300.0);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: cardWidth,
          height: 122,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: palette.borderColor, width: 1.2),
            boxShadow: [
              BoxShadow(
                color: palette.accentColor.withValues(alpha: 0.07),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // 3D Thumbnail on pastel background
              Container(
                width: 58,
                height: 58,
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
                      size: 26,
                      color: palette.accentColor,
                    ),
                    excludeFromSemantics: true,
                  ),
                ),
              ),
              const SizedBox(width: 11),

              // Content Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Status Badge
                    if (test.isLive)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.sensors_rounded,
                              size: 11,
                              color: Colors.white,
                            ),
                            SizedBox(width: 3),
                            Text(
                              'LIVE',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.schedule_rounded,
                              size: 11,
                              color: Color(0xFFD97706),
                            ),
                            SizedBox(width: 3),
                            Text(
                              'UPCOMING',
                              style: TextStyle(
                                fontSize: 11,
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
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: palette.timeColor,
                      ),
                    ),
                    const SizedBox(height: 4),

                    // Metadata Row + Circular Action Button
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
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                        ),
                        if (test.formattedParticipants != null) ...[
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 4),
                            child: Text(
                              '•',
                              style: TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 11,
                              ),
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
                              fontSize: 12,
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

/// 4. Exams for You Card (Matches Screenshot Reference)
class _ExamRecommendCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String? iconUrl;
  final VoidCallback onTap;

  const _ExamRecommendCard({
    required this.title,
    required this.subtitle,
    this.iconUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: const Color(0xFFE2E8F0),
              width: 1.1,
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x06000000),
                blurRadius: 6,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              // 1. Exam Emblem inside soft rounded square container
              Container(
                width: 50,
                height: 50,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: const Color(0xFFF1F5F9),
                    width: 1.0,
                  ),
                ),
                child: ExamLogo(
                  title,
                  iconUrl: iconUrl,
                  size: 42,
                ),
              ),
              const SizedBox(width: 12),
              // 2. Exam Name and Available Tests (Category Tag removed so full exam name fits)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15.5,
                        color: Color(0xFF0F172A),
                        letterSpacing: -0.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // 3. Compact Circular Chevron Action Button (so exam names have plenty of room to fit)
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  border: Border.all(
                    color: const Color(0xFFE2E8F0),
                    width: 1.0,
                  ),
                ),
                child: const Icon(
                  Icons.chevron_right_rounded,
                  size: 18,
                  color: Color(0xFF475569),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// 5. Continue Practicing Card
class _ContinuePracticingCard extends StatelessWidget {
  final List<(SubjectModel, TopicModel)> inProgress;
  final VoidCallback onTap;

  const _ContinuePracticingCard({
    required this.inProgress,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    String title = 'General Knowledge';
    String questions = '25 Questions';
    double progress = 0.60;
    int percent = 60;

    if (inProgress.isNotEmpty) {
      final (subject, topic) = inProgress.first;
      title = topic.title;
      questions = '${topic.totalQuestions} Questions';
      progress = topic.progress;
      percent = (topic.progress * 100).round();
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Purple Book Container
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFF3E8FF),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.menu_book_rounded,
              color: Color(0xFF9333EA),
              size: 26,
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
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),
                Text(
                  questions,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 7,
                          backgroundColor: const Color(0xFFF1F5F9),
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            Color(0xFF10B981),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '$percent%',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Continue Blue Pill Button
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Continue',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 12.5,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// 6. Explore Subjects Section
/// Matches the reference design with circular gradient icons, bold navy titles,
/// compact question counts (e.g. 2.4K Qs), "See All ->" pill button, and smooth
/// horizontal touch scrolling.
class _ExploreSubjectsSection extends StatelessWidget {
  final List<SubjectModel> subjects;

  const _ExploreSubjectsSection({required this.subjects});

  @override
  Widget build(BuildContext context) {
    if (subjects.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header Row: "Explore Subjects" + Right Action ("See All ->")
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 22, 18, 14),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Text(
                'Explore Subjects',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0B1F44),
                  letterSpacing: -0.3,
                ),
              ),
              // "See All ->" capsule pill button matching reference image
              GestureDetector(
                onTap: () => context.go('/practice'),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEBF3FF),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'See All',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF016BFC),
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(
                        Icons.arrow_forward_rounded,
                        size: 13,
                        color: Color(0xFF016BFC),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // Subjects Horizontal Single Row
        SizedBox(
          height: 140,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 18),
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: subjects.length,
            separatorBuilder: (_, _) => const SizedBox(width: 18),
            itemBuilder: (context, i) {
              final sub = subjects[i];
              return _SubjectAvatarCard(
                subject: sub,
                onTap: () => context.push(
                  '/topic-tests?subjectId=${sub.id}&subject=${Uri.encodeQueryComponent(sub.nameEnglish)}',
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _SubjectAvatarCard extends StatelessWidget {
  final SubjectModel subject;
  final VoidCallback onTap;

  const _SubjectAvatarCard({
    required this.subject,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final gradient = _getSubjectGradient(subject.nameEnglish);
    final iconWidget = _buildSubjectIcon(subject.nameEnglish);
    final qCount = _formatQuestionCount(subject.totalQuestions);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: SizedBox(
          width: 88,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Vibrant Circular Avatar matching reference image
              Container(
                width: 62,
                height: 62,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: gradient,
                  boxShadow: [
                    BoxShadow(
                      color: gradient.colors.last.withValues(alpha: 0.25),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: iconWidget,
              ),
              const SizedBox(height: 10),

              // Subject Name (Bold Navy)
              Text(
                subject.nameEnglish,
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0B1F44),
                  letterSpacing: -0.2,
                  height: 1.25,
                ),
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),

              // Question Count (e.g. 2.4K Qs)
              Text(
                qCount,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF64748B),
                  letterSpacing: -0.1,
                ),
                maxLines: 1,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

LinearGradient _getSubjectGradient(String name) {
  final lower = name.toLowerCase();
  if (lower.contains('gk') || lower.contains('general knowledge')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFFF8533), Color(0xFFFF5E1A)],
    );
  }
  if (lower.contains('math') || lower.contains('arith')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF1EA0FF), Color(0xFF0070F3)],
    );
  }
  if (lower.contains('reason')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF1BD894), Color(0xFF00C27A)],
    );
  }
  if (lower.contains('english')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFFF5D8D), Color(0xFFF62B64)],
    );
  }
  if (lower.contains('sci')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF9061F9), Color(0xFF6C2BD9)],
    );
  }
  if (lower.contains('comp')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF38BDF8), Color(0xFF0284C7)],
    );
  }
  if (lower.contains('current')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFFB7185), Color(0xFFE11D48)],
    );
  }
  if (lower.contains('static')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFFBBF24), Color(0xFFD97706)],
    );
  }
  if (lower.contains('history')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFF59E0B), Color(0xFFB45309)],
    );
  }
  if (lower.contains('geo')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF2DD4BF), Color(0xFF0D9488)],
    );
  }
  if (lower.contains('polity')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF818CF8), Color(0xFF4F46E5)],
    );
  }
  if (lower.contains('econ')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF34D399), Color(0xFF059669)],
    );
  }
  if (lower.contains('env')) {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF4ADE80), Color(0xFF16A34A)],
    );
  }
  return const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
  );
}

Widget _buildSubjectIcon(String name) {
  final lower = name.toLowerCase();
  if (lower.contains('english')) {
    return const Text(
      'A',
      style: TextStyle(
        color: Colors.white,
        fontSize: 28,
        fontWeight: FontWeight.w900,
        height: 1.0,
      ),
    );
  }
  if (lower.contains('math') || lower.contains('arith')) {
    return const Icon(Icons.calculate_rounded, color: Colors.white, size: 28);
  }
  if (lower.contains('reason')) {
    return const Icon(Icons.psychology_rounded, color: Colors.white, size: 28);
  }
  if (lower.contains('gk') || lower.contains('general knowledge') || lower.contains('book')) {
    return const Icon(Icons.menu_book_rounded, color: Colors.white, size: 28);
  }
  if (lower.contains('sci')) {
    return const Icon(Icons.science_rounded, color: Colors.white, size: 28);
  }
  if (lower.contains('comp')) {
    return const Icon(Icons.computer_rounded, color: Colors.white, size: 28);
  }
  if (lower.contains('current')) {
    return const Icon(Icons.newspaper_rounded, color: Colors.white, size: 28);
  }
  if (lower.contains('static')) {
    return const Icon(Icons.emoji_events_rounded, color: Colors.white, size: 28);
  }
  if (lower.contains('history')) {
    return const Icon(Icons.account_balance_rounded, color: Colors.white, size: 28);
  }
  if (lower.contains('geo')) {
    return const Icon(Icons.public_rounded, color: Colors.white, size: 28);
  }
  if (lower.contains('polity')) {
    return const Icon(Icons.gavel_rounded, color: Colors.white, size: 28);
  }
  if (lower.contains('env')) {
    return const Icon(Icons.forest_rounded, color: Colors.white, size: 28);
  }
  if (lower.contains('econ')) {
    return const Icon(Icons.trending_up_rounded, color: Colors.white, size: 28);
  }
  return const Icon(Icons.auto_stories_rounded, color: Colors.white, size: 28);
}

String _formatQuestionCount(int count) {
  if (count <= 0) return '0 Qs';
  if (count >= 1000) {
    final k = count / 1000.0;
    final formatted = k.toStringAsFixed(1);
    final clean = formatted.endsWith('.0')
        ? formatted.substring(0, formatted.length - 2)
        : formatted;
    return '${clean}K Qs';
  }
  return '$count Qs';
}

/// 7. Recent Results List
class _RecentResultsList extends StatelessWidget {
  final List<TestAttemptModel> attempts;
  final VoidCallback onViewAll;

  const _RecentResultsList({required this.attempts, required this.onViewAll});

  @override
  Widget build(BuildContext context) {
    if (attempts.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.insert_chart_outlined_rounded,
              color: Color(0xFF94A3B8),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'No results yet. Your scores appear here after your first test.',
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
            ),
            TextButton(
              onPressed: () => GoRouter.of(context).go('/exams'),
              child: const Text('Take a test'),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        for (final (i, a) in attempts.take(3).indexed)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _ResultItemCard(
              title: a.testTitle,
              subtitle: '${a.score.round()} / ${a.totalMarks.round()}',
              scoreText: '${a.percentage.round()}%',
              bgColor: i % 3 == 0
                  ? const Color(0xFFDCFCE7)
                  : i % 3 == 1
                  ? const Color(0xFFEDE9FE)
                  : const Color(0xFFFEE2E2),
              iconColor: i % 3 == 0
                  ? const Color(0xFF10B981)
                  : i % 3 == 1
                  ? const Color(0xFF8B5CF6)
                  : const Color(0xFFEF4444),
              onTap: () => context.push('/result/${a.id}'),
            ),
          ),
      ],
    );
  }
}

class _ResultItemCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String scoreText;
  final Color bgColor;
  final Color iconColor;
  final VoidCallback onTap;

  const _ResultItemCard({
    required this.title,
    required this.subtitle,
    required this.scoreText,
    required this.bgColor,
    required this.iconColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x08000000),
                blurRadius: 6,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.assignment_turned_in_rounded,
                  color: iconColor,
                  size: 20,
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
                        fontWeight: FontWeight.w700,
                        fontSize: 13.5,
                        color: Color(0xFF0F172A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF94A3B8),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  scoreText,
                  style: const TextStyle(
                    color: Color(0xFF059669),
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              const Icon(
                Icons.chevron_right_rounded,
                size: 18,
                color: Color(0xFF94A3B8),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Smoothly animated waving hand emoji for the home greeting
class _WavingHand extends StatefulWidget {
  const _WavingHand();

  @override
  State<_WavingHand> createState() => _WavingHandState();
}

class _WavingHandState extends State<_WavingHand>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;
  int _cycles = 0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    _animation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: -0.25)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 15,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: -0.25, end: 0.20)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 20,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.20, end: -0.20)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 20,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: -0.20, end: 0.15)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 15,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.15, end: 0.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 10,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(0.0),
        weight: 20,
      ),
    ]).animate(_controller);

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _cycles++;
        if (_cycles < 3) {
          _controller.forward(from: 0.0);
        }
      }
    });

    _controller.forward();
  }

  void _triggerWave() {
    _cycles = 0;
    _controller.forward(from: 0.0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _triggerWave,
      child: AnimatedBuilder(
        animation: _animation,
        builder: (context, child) {
          return Transform.rotate(
            angle: _animation.value,
            alignment: Alignment.bottomRight,
            child: child,
          );
        },
        child: const Text(
          '👋',
          style: TextStyle(fontSize: 22),
        ),
      ),
    );
  }
}

class _ExamsForYouSwooshPainter extends CustomPainter {
  const _ExamsForYouSwooshPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF016BFC)
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    final path = Path();
    path.moveTo(0, size.height * 0.95);
    path.cubicTo(
      size.width * 0.25, size.height * 0.30,
      size.width * 0.60, 0.0,
      size.width, size.height * 0.45,
    );
    path.lineTo(size.width, size.height * 0.55);
    path.cubicTo(
      size.width * 0.60, size.height * 0.32,
      size.width * 0.25, size.height * 0.55,
      0, size.height * 0.95,
    );
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _ExamsForYouSwooshPainter oldDelegate) => false;
}

/// Dynamic Hero Banner Card / Carousel Section
/// Fetches promotional banners from Admin Panel (Supabase `hero_banners`).
/// Displays high-fidelity images with auto-sliding carousel if multiple banners exist,
/// interactive dot indicators, text overlays, and fallback to default HD hero banner.
class _HeroBannerSection extends ConsumerStatefulWidget {
  final List<HeroBannerModel> banners;

  const _HeroBannerSection({required this.banners});

  @override
  ConsumerState<_HeroBannerSection> createState() => _HeroBannerSectionState();
}

class _HeroBannerSectionState extends ConsumerState<_HeroBannerSection> {
  late PageController _pageController;
  int _currentPage = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startTimerIfNeeded();

    // Listen to real-time sync broadcast messages from Admin Panel
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ref.read(bannerRepositoryProvider).setupRealtimeSync(() {
          if (mounted) {
            ref.invalidate(homeBannersProvider);
          }
        });
      }
    });
  }

  @override
  void didUpdateWidget(covariant _HeroBannerSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.banners.length != widget.banners.length) {
      _startTimerIfNeeded();
    }
  }

  void _startTimerIfNeeded() {
    _timer?.cancel();
    _timer = null;
    if (widget.banners.length > 1) {
      _timer = Timer.periodic(const Duration(seconds: 5), (timer) {
        if (!mounted || !_pageController.hasClients) return;
        final next = (_currentPage + 1) % widget.banners.length;
        _pageController.animateToPage(
          next,
          duration: const Duration(milliseconds: 550),
          curve: Curves.easeInOutCubic,
        );
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() => _currentPage = index);
  }

  void _handleBannerTap(BuildContext context, HeroBannerModel banner) {
    ref.read(bannerRepositoryProvider).recordBannerClick(banner.id);
    final link = banner.primaryCtaLink.trim();
    if (link.isEmpty) {
      context.go('/exams');
      return;
    }
    if (link.startsWith('http://') || link.startsWith('https://')) {
      final uri = Uri.tryParse(link);
      if (uri != null) {
        launchUrl(uri, mode: LaunchMode.externalApplication);
      }
      return;
    }
    if (link == '/test-series' || link == '/exams' || link.startsWith('/exams/')) {
      context.go('/exams');
    } else if (link == '/practice' || link == '/daily-10' || link.startsWith('/topic-tests')) {
      context.go('/practice');
    } else if (link == '/results' || link.startsWith('/results/')) {
      context.go('/results');
    } else if (link == '/profile') {
      context.go('/profile');
    } else if (link == '/live-tests') {
      context.push('/live-tests');
    } else {
      try {
        context.push(link);
      } catch (_) {
        context.go('/exams');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final banners = widget.banners.isEmpty
        ? const [HeroBannerModel.defaultBanner]
        : widget.banners;

    if (banners.length == 1) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        child: _buildBannerCard(context, banners.first),
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
          child: AspectRatio(
            aspectRatio: 896 / 466,
            child: PageView.builder(
              controller: _pageController,
              itemCount: banners.length,
              onPageChanged: _onPageChanged,
              itemBuilder: (context, index) {
                return _buildBannerCard(context, banners[index], wrapAspectRatio: false);
              },
            ),
          ),
        ),
        // Dots indicator
        const SizedBox(height: 2),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(banners.length, (index) {
            final isActive = index == _currentPage;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: isActive ? 16 : 6,
              height: 6,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(3),
                color: isActive
                    ? const Color(0xFF005CFD)
                    : const Color(0xFFCBD5E1),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildBannerCard(BuildContext context, HeroBannerModel banner, {bool wrapAspectRatio = true}) {
    final cardContent = Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _handleBannerTap(context, banner),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Banner Image (Network URL, Base64 memory image, or Asset fallback)
                Semantics(
                  image: true,
                  label: banner.bannerType == 'full_image' ? banner.title : null,
                  excludeSemantics: true,
                  child: _buildBannerImage(banner),
                ),

                // Text Overlay (if enabled by admin)
                if (banner.showTextOverlay)
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                          colors: [
                            Colors.black.withValues(alpha: 0.65),
                            Colors.black.withValues(alpha: 0.25),
                            Colors.transparent,
                          ],
                        ),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (banner.badgeText != null && banner.badgeText!.trim().isNotEmpty) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3.5),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFB800),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                banner.badgeText!.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF1E293B),
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                          ],
                          Text(
                            banner.title,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: -0.2,
                              height: 1.2,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (banner.subtitle.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              banner.subtitle,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white.withValues(alpha: 0.85),
                                height: 1.25,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  banner.primaryCtaText.isNotEmpty ? banner.primaryCtaText : 'Start Now',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF005CFD),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.arrow_forward_rounded,
                                  size: 13,
                                  color: Color(0xFF005CFD),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );

    if (wrapAspectRatio) {
      return AspectRatio(
        aspectRatio: 896 / 466,
        child: cardContent,
      );
    }
    return cardContent;
  }

  Widget _buildBannerImage(HeroBannerModel banner) {
    Widget fallback() {
      return Image.asset(
        'assets/images/hero_banner_hd.webp',
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Image.asset(
          'assets/images/hero_banner_full.webp',
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
        ),
      );
    }

    if (banner.isBase64Image) {
      final bytes = banner.base64Bytes;
      if (bytes != null && bytes.isNotEmpty) {
        return Image.memory(
          bytes,
          fit: BoxFit.cover,
          gaplessPlayback: true,
          errorBuilder: (context, error, stackTrace) => fallback(),
        );
      }
    }

    if (banner.isNetworkImage) {
      // Saved on the phone's disk, so the banner is not downloaded on every open.
      return CachedNetworkImage(
        imageUrl: banner.effectiveImageUrl,
        fit: BoxFit.cover,
        useOldImageOnUrlChange: true,
        placeholder: (context, url) {
          return Container(
            color: const Color(0xFFF1F5F9),
            alignment: Alignment.center,
            child: const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2.2,
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF005CFD)),
              ),
            ),
          );
        },
        errorWidget: (context, url, error) => fallback(),
      );
    }

    return Image.asset(
      banner.effectiveImageUrl,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => fallback(),
    );
  }
}



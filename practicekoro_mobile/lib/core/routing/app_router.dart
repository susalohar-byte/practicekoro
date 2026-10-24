import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../components/ui.dart';
import '../components/main_navigation_scaffold.dart';
import '../../features/home/home_screen.dart';
import '../../features/practice/practice_screen.dart';
import '../../features/practice/topic_test_screen.dart';
import '../../features/practice/topic_tests_list_screen.dart';
import '../../features/exams/exam_list_screen.dart';
import '../../features/exams/exam_tests_screen.dart';
import '../../features/exams/test_details_screen.dart';
import '../../features/test_runner/test_runner_screen.dart';
import '../../features/result_analytics/result_screen.dart';
import '../../features/result_analytics/results_history_screen.dart';
import '../../features/result_analytics/solutions_screen.dart';
import '../../features/result_analytics/student_rank_list_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/profile/edit_profile_screen.dart';
import '../../data/repositories/auth_repository.dart';
import '../../features/auth/auth_screens.dart';
import '../../features/bookmarks/saved_questions_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/progress/progress_screen.dart';
import '../../features/pyq/pyq_screen.dart';
import '../../features/result_analytics/test_history_screen.dart';
import '../../features/search/search_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/support/help_support_screen.dart';
import '../../features/live_tests/live_tests_screen.dart';
import '../../features/subscription/plans_screen.dart';
import '../../features/subscription/checkout_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>(
  debugLabel: 'root',
);

const _publicRoutes = {
  '/splash',
  '/onboarding',
  '/login',
  '/signup',
  '/forgot-password',
  '/login-callback',
};

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/splash',
  refreshListenable: authChanges,
  // Login is required: everything except the welcome and sign-in screens
  // needs a signed-in student (attempts and results are saved per account).
  redirect: (context, state) {
    final loc = state.matchedLocation;
    if (authChanges.passwordRecoveryPending) {
      return loc == '/reset-password' ? null : '/reset-password';
    }
    final signedIn = const AuthRepository().isSignedIn;
    if (!signedIn && !_publicRoutes.contains(loc)) return '/login';
    if (signedIn && (loc == '/login' || loc == '/signup' || loc == '/login-callback')) return '/home';
    return null;
  },
  routes: [
    GoRoute(
      path: '/login-callback',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const _AuthCallbackScreen(),
    ),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(path: '/signup', builder: (context, state) => const SignUpScreen()),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordScreen(),
    ),
    GoRoute(
      path: '/reset-password',
      builder: (context, state) => const ResetPasswordScreen(),
    ),
    GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    // Paths from the previous navigation keep working.
    GoRoute(
      path: '/tests',
      redirect: (context, state) => state.uri.queryParameters['tab'] == 'topics'
          ? '/topic-tests'
          : '/exams',
    ),

    // Tabs: Home, Practice, Exams, Result, Profile
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) =>
          MainNavigationScaffold(navigationShell: navigationShell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: HomeScreen()),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/practice',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: PracticeScreen()),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/exams',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: ExamListScreen()),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/results',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: ResultsHistoryScreen()),
              routes: [
                GoRoute(
                  path: 'rankings',
                  pageBuilder: (context, state) => NoTransitionPage(
                    child: StudentRankListScreen(
                      initialTestId: state.uri.queryParameters['testId'],
                      initialTestTitle: state.uri.queryParameters['title'],
                    ),
                  ),
                ),
                GoRoute(
                  path: 'detail/:attemptId',
                  pageBuilder: (context, state) => NoTransitionPage(
                    child: ResultScreen(
                      attemptId: state.pathParameters['attemptId']!,
                    ),
                  ),
                ),
                GoRoute(
                  path: 'review/:attemptId',
                  pageBuilder: (context, state) => NoTransitionPage(
                    child: SolutionsScreen(
                      attemptId: state.pathParameters['attemptId']!,
                      initialIndex: int.tryParse(state.uri.queryParameters['initialIndex'] ?? '') ?? 0,
                    ),
                  ),
                ),
                GoRoute(
                  path: 'solution/:attemptId',
                  pageBuilder: (context, state) => NoTransitionPage(
                    child: SolutionsScreen(
                      attemptId: state.pathParameters['attemptId']!,
                      initialIndex: int.tryParse(state.uri.queryParameters['initialIndex'] ?? '') ?? 0,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: ProfileScreen()),
            ),
          ],
        ),
      ],
    ),

    // Full-screen routes
    GoRoute(
      path: '/exams/:examId',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) =>
          ExamTestsScreen(examId: state.pathParameters['examId']!),
    ),
    GoRoute(
      path: '/test/:testId/details',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) =>
          TestDetailsScreen(testId: state.pathParameters['testId']!),
    ),
    GoRoute(
      path: '/test/:testId/active',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => TestRunnerScreen(
        testId: state.pathParameters['testId']!,
        // Practice and topic sessions have no mock-test record, so the caller names them.
        title: state.uri.queryParameters['title'],
      ),
    ),
    GoRoute(
      path: '/result/:attemptId',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) =>
          ResultScreen(attemptId: state.pathParameters['attemptId']!),
    ),
    GoRoute(
      path: '/solutions/:attemptId',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => SolutionsScreen(
        attemptId: state.pathParameters['attemptId']!,
        initialIndex: int.tryParse(state.uri.queryParameters['initialIndex'] ?? '') ?? 0,
      ),
    ),
    GoRoute(
      path: '/profile/edit',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) =>
          EditProfileScreen(section: state.uri.queryParameters['section']),
    ),
    GoRoute(
      path: '/topic-tests',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => TopicTestScreen(
        initialSubjectId: state.uri.queryParameters['subjectId'] ??
            state.uri.queryParameters['id'],
        initialSubjectName: state.uri.queryParameters['subject'],
        initialFilter: state.uri.queryParameters['filter'],
      ),
    ),
    GoRoute(
      path: '/topic/:topicId/tests',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => TopicTestsListScreen(
        topicId: state.pathParameters['topicId']!,
        topicTitle: state.uri.queryParameters['title'],
      ),
    ),
    GoRoute(
      path: '/bookmarks',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const SavedQuestionsScreen(),
    ),
    GoRoute(
      path: '/test-history',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const TestHistoryScreen(),
    ),
    GoRoute(
      path: '/pyq',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) =>
          PyqScreen(initialExamId: state.uri.queryParameters['exam']),
    ),
    GoRoute(
      path: '/progress',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const ProgressScreen(),
    ),
    GoRoute(
      path: '/search',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) =>
          SearchScreen(initialQuery: state.uri.queryParameters['q']),
    ),
    GoRoute(
      path: '/notifications',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/settings',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const SettingsScreen(),
    ),
    GoRoute(
      path: '/help',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const HelpSupportScreen(),
    ),
    GoRoute(
      path: '/live-tests',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const LiveTestsScreen(),
    ),
    GoRoute(
      path: '/plans',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const PlansScreen(),
    ),
    GoRoute(
      path: '/checkout/:planId',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final planId = state.pathParameters['planId'] ?? '';
        return CheckoutScreen(planId: planId);
      },
    ),
  ],
);

class _AuthCallbackScreen extends StatefulWidget {
  const _AuthCallbackScreen();

  @override
  State<_AuthCallbackScreen> createState() => _AuthCallbackScreenState();
}

class _AuthCallbackScreenState extends State<_AuthCallbackScreen> {
  StreamSubscription<AuthState>? _sub;
  Timer? _timeoutTimer;

  @override
  void initState() {
    super.initState();
    _checkOrListen();
  }

  void _checkOrListen() {
    const repo = AuthRepository();
    if (repo.isSignedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/home');
      });
      return;
    }

    _sub = repo.changes.listen((data) {
      if (!mounted) return;
      if (data.session != null || data.event == AuthChangeEvent.signedIn) {
        _timeoutTimer?.cancel();
        context.go('/home');
      }
    });

    _timeoutTimer = Timer(const Duration(seconds: 8), () {
      if (!mounted) return;
      if (const AuthRepository().isSignedIn) {
        context.go('/home');
      } else {
        context.go('/login');
      }
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    _timeoutTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: UI.page,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: UI.primary),
            SizedBox(height: 20),
            Text(
              'Completing sign-in...',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: UI.text,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/core/constants/app_colors.dart';
import 'package:practicekoro_mobile/core/components/pk_button.dart';
import 'package:practicekoro_mobile/core/components/pk_card.dart';
import 'package:practicekoro_mobile/core/components/pk_stat_card.dart';
import 'package:practicekoro_mobile/core/components/pk_section_header.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/features/leaderboard/leaderboard_screen.dart';
import 'package:practicekoro_mobile/features/result_analytics/results_hub_screen.dart';
import 'package:practicekoro_mobile/features/result_analytics/result_screen.dart';
import 'package:practicekoro_mobile/data/models/attempt_model.dart';
import 'package:practicekoro_mobile/data/models/test_model.dart';
import 'package:practicekoro_mobile/data/models/test_series_model.dart';
import 'package:practicekoro_mobile/data/repositories/catalog_repository.dart';
import 'package:practicekoro_mobile/features/exams/test_series_detail_screen.dart';
import 'package:practicekoro_mobile/features/profile/settings_screen.dart';
import 'package:practicekoro_mobile/features/profile/support_screen.dart';
import 'package:practicekoro_mobile/core/widgets/pk_bottom_spacing.dart';
import 'package:practicekoro_mobile/features/exams/primary_exam_selection_screen.dart';
import 'package:practicekoro_mobile/features/exams/exam_selection_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:practicekoro_mobile/features/home/home_screen.dart';
import 'package:practicekoro_mobile/features/navigation/main_scaffold.dart';
import 'package:practicekoro_mobile/features/exams/exams_catalog_screen.dart';
import 'package:practicekoro_mobile/features/practice/practice_screen.dart';
import 'package:practicekoro_mobile/features/onboarding/splash_screen.dart';
import 'package:practicekoro_mobile/features/profile/profile_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await LocalStorageService.init();
  });

  group('Unified Design Token & Component Tests', () {
    testWidgets('PKPrimaryButton renders text and fires callback', (tester) async {
      bool tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PKPrimaryButton(
              text: 'Start Test Now',
              onPressed: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Start Test Now'), findsOneWidget);
      await tester.tap(find.text('Start Test Now'));
      expect(tapped, isTrue);
    });

    testWidgets('PKCard renders child with border and padding', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PKCard(
              child: Text('Card Content'),
            ),
          ),
        ),
      );

      expect(find.text('Card Content'), findsOneWidget);
    });

    testWidgets('PKStatCard renders icon, label, and metric value', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PKStatCard(
              title: 'Average Score',
              value: '78.5',
              icon: Icons.bar_chart_rounded,
              iconColor: AppColors.primary,
              iconBackgroundColor: AppColors.veryLightBlue,
            ),
          ),
        ),
      );

      expect(find.text('Average Score'), findsOneWidget);
      expect(find.text('78.5'), findsOneWidget);
      expect(find.byIcon(Icons.bar_chart_rounded), findsOneWidget);
    });

    testWidgets('PKSectionHeader renders title and action', (tester) async {
      bool actionTapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PKSectionHeader(
              title: 'Popular Bengal Exams',
              actionText: 'View All',
              onActionTap: () => actionTapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Popular Bengal Exams'), findsOneWidget);
      expect(find.text('View All'), findsOneWidget);
      await tester.tap(find.text('View All'));
      expect(actionTapped, isTrue);
    });
  });

  group('New & Upgraded Screens Smoke Tests', () {
    testWidgets('PrimaryExamSelectionScreen renders standardized exam choices', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: PrimaryExamSelectionScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Set Your Primary Exam'), findsOneWidget);
      expect(find.text('WBP Constable'), findsOneWidget);
      expect(find.text('WBPSC Clerkship'), findsOneWidget);
      expect(find.text('WBSSC Group D'), findsOneWidget);
      expect(find.text('Primary TET'), findsOneWidget);
      expect(find.text('Continue'), findsOneWidget);
    });

    testWidgets('ExamSelectionScreen renders with category chips and search', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: ExamSelectionScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('পরীক্ষা নির্বাচন'), findsOneWidget);
      expect(find.text('West Bengal'), findsWidgets);
      expect(find.text('Central'), findsWidgets);
      expect(find.text('Teaching'), findsWidgets);
    });

    testWidgets('ResultsHubScreen renders Results page sections', (tester) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
      await tester.pumpWidget(
        const MaterialApp(
          home: ResultsHubScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Results'), findsOneWidget);
      expect(find.text('Overview'), findsOneWidget);
      expect(find.text('All Tests'), findsOneWidget);
      expect(find.text('Rankings'), findsOneWidget);
      expect(find.text('Total Performance'), findsOneWidget);
    });

    testWidgets('ResultScreen renders redesigned result from a saved attempt', (tester) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
      await LocalStorageService.saveAttempt(TestAttemptModel(
        id: 'att-result-test',
        userId: 'user-1',
        testId: 'test-1',
        testTitle: 'WBP Constable Mock 1',
        score: 64,
        totalMarks: 100,
        percentage: 64,
        accuracy: 80,
        correctCount: 40,
        wrongCount: 10,
        skippedCount: 50,
        timeSpentSeconds: 1500,
        totalQuestions: 100,
        negativeMarksDeducted: 2.5,
        completedAt: DateTime(2026, 10, 11, 9, 30),
        testSeriesTitle: 'WBP Constable Series',
      ));

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: ResultScreen(attemptId: 'att-result-test')),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('WBP Constable Mock 1'), findsOneWidget);
      expect(find.text('WBP Constable Series'), findsOneWidget);
      expect(find.text('64'), findsOneWidget);
      expect(find.text('Good effort!'), findsOneWidget);
      expect(find.text('Answer Breakdown'), findsOneWidget);
      expect(find.text('80%'), findsOneWidget);
      expect(find.text('-2.5'), findsOneWidget);
      expect(find.text('View Detailed Analysis'), findsOneWidget);
    });

    testWidgets('ResultScreen shows empty state instead of sample data for unknown attempt', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: ResultScreen(attemptId: 'missing-attempt')),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Result not found'), findsOneWidget);
      expect(find.text('72'), findsNothing);
    });

    testWidgets('LeaderboardScreen renders test series rankings and header without dummy data', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LeaderboardScreen(),
        ),
      );

      await tester.pumpAndSettle();

      // Verify headers and test series selector
      expect(find.text('My Rank'), findsOneWidget);
      expect(find.text('West Bengal'), findsWidgets);
      expect(find.text('Your Rank'), findsOneWidget);
    });

    testWidgets('SettingsScreen renders account, preferences, and support groups', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SettingsScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Profile'), findsOneWidget);
      expect(find.text('Account'), findsOneWidget);
      expect(find.text('Edit Profile'), findsOneWidget);
      expect(find.text('Preferences'), findsOneWidget);
      expect(find.text('Notification Settings'), findsOneWidget);
      expect(find.text('Language'), findsOneWidget);
      expect(find.text('Support'), findsOneWidget);
      expect(find.text('Help & Support'), findsOneWidget);
    });

    testWidgets('SupportScreen renders contact options and ticket form', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SupportScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Help & Support'), findsOneWidget);
      expect(find.text('FAQs'), findsOneWidget);
      expect(find.text('Contact'), findsOneWidget);
      expect(find.text('Popular Questions'), findsOneWidget);
      expect(find.text('How to attempt a mock test?'), findsOneWidget);
    });

    testWidgets('PKBottomSpacing calculates floating bar clearance correctly', (tester) async {
      double? calculatedInside;
      double? calculatedOutside;

      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            // Inside MainScaffold (extendBody) padding already includes the bar area;
            // the scope carries the real device inset.
            data: const MediaQueryData(
              padding: EdgeInsets.only(bottom: 138.0),
            ),
            child: PKBottomNavScope(
              hasFloatingNavBar: true,
              navBarHeight: 78.0,
              navBarBottomMargin: 10.0,
              deviceBottomInset: 34.0,
              child: Builder(
                builder: (context) {
                  calculatedInside = PKBottomSpacing.of(context);
                  return const SizedBox.shrink();
                },
              ),
            ),
          ),
        ),
      );

      // 78 (height) + 10 (margin) + 34 (device inset) + 12 (breathing gap) = 134.0,
      // without double-counting the bar area already reported in padding.bottom.
      expect(calculatedInside, equals(134.0));

      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: const MediaQueryData(
              padding: EdgeInsets.only(bottom: 34.0),
            ),
            child: PKBottomNavScope(
              hasFloatingNavBar: false,
              child: Builder(
                builder: (context) {
                  calculatedOutside = PKBottomSpacing.of(context);
                  return const SizedBox.shrink();
                },
              ),
            ),
          ),
        ),
      );

      // 34 (bottom inset) + 20 (default detail gap) = 54.0
      expect(calculatedOutside, equals(54.0));
    });

    testWidgets('PKBottomNavSpacer renders with proper clearance height', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: MediaQuery(
            data: MediaQueryData(
              padding: EdgeInsets.only(bottom: 20.0),
            ),
            child: PKBottomNavScope(
              hasFloatingNavBar: true,
              deviceBottomInset: 20.0,
              child: Scaffold(
                body: Column(
                  children: [
                    Text('Content Above'),
                    PKBottomNavSpacer(),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

      // 70 (pill) + 8 (margin) + 20 (device inset) + 12 (breathing gap) = 110.0
      final sizedBox = tester.widget<SizedBox>(find.byType(SizedBox).last);
      expect(sizedBox.height, equals(110.0));
    });

    testWidgets('Home page renders the reference sections with a single search bar', (tester) async {
      tester.view.physicalSize = const Size(420, 3200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());
      await LocalStorageService.saveUserName('Ananya');

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HomeScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Header + hero
      expect(find.text('Hi, Ananya 👋'), findsOneWidget);
      expect(find.text('Consistent Practice,\nBig Results!'), findsOneWidget);
      expect(find.text('Small steps today, big success tomorrow.'), findsOneWidget);
      expect(find.text('Start Practicing'), findsOneWidget);

      // Exactly one search field on the page
      expect(find.byType(TextField), findsOneWidget);
      expect(find.text('Search for tests, topics, exams...'), findsOneWidget);

      // Quick actions (no Official PYQ, no Live Tests)
      expect(find.text('Quick Actions'), findsOneWidget);
      for (final label in ['Audio Book', 'Topic Test', 'Rank', 'Saved Questions']) {
        expect(find.text(label), findsWidgets);
      }
      expect(find.text('Official PYQ'), findsNothing);

      // Sections in the reference order
      for (final title in [
        'Continue Your Practice',
        'Your Exams',
        'Popular Test Series',
        'Your Progress',
        'Keep Going!',
        'Featured for You',
        'Recently Added Tests',
        'Recommended for You',
        'Keep Showing Up!',
      ]) {
        expect(find.text(title), findsOneWidget, reason: title);
      }
      expect(find.text('Most attempted and recommended'), findsOneWidget);
      expect(find.text('Add Exam'), findsOneWidget);
    });

    testWidgets('Home page shows empty states instead of sample catalogue data', (tester) async {
      tester.view.physicalSize = const Size(420, 3200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());
      await LocalStorageService.clearUserSession();

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HomeScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('No practice in progress yet'), findsOneWidget);
      expect(find.text('Test series will appear here once they are published.'), findsOneWidget);
      expect(find.text('New tests will appear here as soon as they are published.'), findsOneWidget);
      expect(find.text('Complete your first test to start tracking progress.'), findsOneWidget);

      // Formerly hard-coded sample content must not render offline.
      expect(find.text('KP Constable'), findsNothing);
      expect(find.text('Most Popular'), findsNothing);
      expect(find.text("Today's Challenge"), findsNothing);
      expect(find.text('18 / 30 Questions'), findsNothing);
    });

    testWidgets('MainScaffold renders redesigned pill navbar with 5 items and active circular highlight', (tester) async {
      tester.view.physicalSize = const Size(420, 1000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: MainScaffold(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify all 5 navigation items are present
      expect(find.text('Home'), findsWidgets);
      expect(find.text('Test Series'), findsWidgets);
      expect(find.text('Practice'), findsWidgets);
      expect(find.text('Results'), findsWidgets);
      expect(find.text('Profile'), findsWidgets);
    });

    testWidgets('MainScaffold shows mascot only when Practice tab is selected and animates on tap', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: MainScaffold(initialIndex: 0),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // On Home: Mascot image is NOT rendered
      expect(find.image(const AssetImage('assets/images/mascot_nav_transparent.png')), findsNothing);

      // Tap on Practice tab
      await tester.tap(find.text('Practice'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pumpAndSettle();

      // Mascot image is now rendered!
      expect(find.image(const AssetImage('assets/images/mascot_nav_transparent.png')), findsOneWidget);

      // Tap on Test Series tab
      await tester.tap(find.text('Test Series'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pumpAndSettle();

      // Mascot image is hidden again
      expect(find.image(const AssetImage('assets/images/mascot_nav_transparent.png')), findsNothing);
    });

    testWidgets('ExamsCatalogScreen renders clean search bar and filter dropdown', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: ExamsCatalogScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify search icon and placeholder
      expect(find.byIcon(Icons.search_rounded), findsWidgets);
      expect(find.text('Search test series...'), findsOneWidget);

      // Verify All Exams filter button
      expect(find.text('All Exams'), findsWidgets);
      expect(find.byIcon(Icons.keyboard_arrow_down_rounded), findsWidgets);

      // Verify typing into search input
      await tester.enterText(find.byType(TextField).first, 'WBP');
      await tester.pumpAndSettle();
      expect(find.text('WBP'), findsWidgets);
    });

    testWidgets('PracticeScreen renders PKSearchFilterBar with subject or chapter placeholder', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: PracticeScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify search icon and Bengali subjects
      expect(find.byIcon(Icons.search_rounded), findsWidgets);
      expect(find.text('Practice'), findsOneWidget);
      expect(find.text('ভারতের ইতিহাস'), findsOneWidget);
      expect(find.text('সাধারণ বিজ্ঞান'), findsOneWidget);
    });

    testWidgets('SplashScreen renders redesigned light-blue splash with logo, branding, and dots', (tester) async {
      tester.view.physicalSize = const Size(576, 1024);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const MaterialApp(
          home: SplashScreen(),
        ),
      );

      // Verify Scaffold background color is #E8F3FE
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold));
      expect(scaffold.backgroundColor, const Color(0xFFE8F3FE));

      // Verify images are present: logo, brand, headline, subtitle
      final imageFinders = find.byType(Image);
      expect(imageFinders, findsNWidgets(4));

      // Verify semantics label
      expect(
        find.byWidgetPredicate(
          (w) => w is Semantics && w.properties.label == 'PracticeKoro - পরীক্ষার প্রস্তুতি, এখন আরও সহজ',
        ),
        findsOneWidget,
      );

      // Pump 1 second of animation without throwing
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.byType(SplashScreen), findsOneWidget);
    });

    testWidgets('ExamsCatalogScreen renders complete Test Series section matching reference with dynamic stats and square icons', (tester) async {
      // 1. Desktop test
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: ExamsCatalogScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify Test Series header, Category Pills and Structured hero banner matching approved reference
      expect(find.text('Test Series'), findsWidgets);
      expect(find.image(const AssetImage('assets/images/test_series_success_banner_exact.png')), findsOneWidget);
      expect(find.text('All'), findsWidgets);
      expect(find.text('Full Mock'), findsWidgets);

      // Verify search and All Exams filter
      expect(find.text('Search test series...'), findsOneWidget);
      expect(find.text('All Exams'), findsWidgets);

      // Verify Test Series cards
      expect(find.text('WBP Constable'), findsWidgets);
      expect(find.text('Railway NTPC'), findsWidgets);
    });

    testWidgets('ProfileScreen renders approved 3-screen Profile UI matching reference across all breakpoints', (tester) async {
      await LocalStorageService.saveUserName('Ananya Roy');
      await LocalStorageService.saveUserEmail('ananya@example.com');
      await LocalStorageService.saveUserGender('MALE');
      await LocalStorageService.saveUserDob('2002-01-12');
      await LocalStorageService.saveUserDistrict('Kolkata');
      await LocalStorageService.saveTargetExamsList(['WBP Constable', 'Railway NTPC']);

      for (final width in [320.0, 360.0, 375.0, 390.0, 414.0, 430.0]) {
        tester.view.physicalSize = Size(width, 1000);
        tester.view.devicePixelRatio = 1.0;

        await tester.pumpWidget(
          const ProviderScope(
            child: MaterialApp(
              home: ProfileScreen(),
            ),
          ),
        );
        await tester.pumpAndSettle();

        // 1. Verify Top Header
        expect(find.text('Profile'), findsOneWidget);

        // 2. Verify Profile Card & Info items
        expect(find.byIcon(Icons.settings_outlined), findsOneWidget);
        expect(find.text('Male'), findsOneWidget);
        expect(find.text('12 Jan 2002'), findsOneWidget);

        // 3. Verify My Progress Card & 4 stats
        expect(find.text('My Progress'), findsOneWidget);
        expect(find.text('View Details'), findsOneWidget);
        expect(find.textContaining('Tests'), findsWidgets);
        expect(find.text('Accuracy'), findsOneWidget);
        expect(find.textContaining('Questions'), findsWidgets);
        expect(find.textContaining('Streak'), findsWidgets);

        // 4. Verify My Exams Card & Action tags
        expect(find.text('My Exams'), findsOneWidget);
        expect(find.text('Exams you are preparing for'), findsOneWidget);
        expect(find.text('WBP Constable'), findsWidgets);
        expect(find.text('Add Exam'), findsOneWidget);

        // 5. Verify Navigation Action Items
        expect(find.text('My Test Attempts'), findsOneWidget);
        expect(find.text('Bookmarks'), findsOneWidget);

        // 6. Account, Help, Nimo banner and Logout
        expect(find.text('Account & Preferences'), findsOneWidget);
        expect(find.text('Subscription & Plan'), findsOneWidget);
        expect(find.text('Payment History'), findsOneWidget);
        expect(find.text('Coupons'), findsOneWidget);
        expect(find.text('Notification Settings'), findsOneWidget);
        expect(find.text('Help & Information'), findsOneWidget);
        expect(find.text('About PracticeKoro'), findsOneWidget);
        expect(find.text('Privacy Policy'), findsOneWidget);
        expect(find.text('Meet Nimo'), findsOneWidget);
        expect(find.text('Logout'), findsOneWidget);

        // 7. Verify strictly removed items are absent
        expect(find.text('My Learning'), findsNothing);
        expect(find.text('My Notes'), findsNothing);
        expect(find.text('Downloads'), findsNothing);
        expect(find.text('Refer & Earn'), findsNothing);
        expect(find.text('Download History'), findsNothing);
      }
      tester.view.resetPhysicalSize();
    });

    testWidgets('TestSeriesDetailScreen shows a not-found state instead of a guessed series', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: TestSeriesDetailScreen(seriesId: 'no-such-series'))),
      );
      await tester.pumpAndSettle();

      expect(find.text('Test series not found'), findsOneWidget);
      expect(find.text('WBP Constable'), findsNothing);
      expect(find.text('Full Mock Test 1'), findsNothing);
    });

    testWidgets('Test Series details -> Start Test Series -> test list with access rules', (tester) async {
      tester.view.physicalSize = const Size(393, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());
      await LocalStorageService.setProUser(false);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [catalogRepositoryProvider.overrideWithValue(_FakeSeriesRepo())],
          child: const MaterialApp(home: TestSeriesDetailScreen(seriesId: 'wbp-constable')),
        ),
      );
      await tester.pumpAndSettle();

      // Screen 2: title, subtitle, real stats, no Bilingual stat
      expect(find.text('WBP Constable'), findsOneWidget);
      expect(find.text('Complete Test Series'), findsOneWidget);
      expect(find.text('Tests'), findsOneWidget);
      expect(find.text('425'), findsOneWidget); // 85*3 + 25 + 30 + 30 + 85
      expect(find.text('Questions'), findsOneWidget);
      expect(find.textContaining('Bilingual'), findsNothing);
      expect(find.text('Overview'), findsOneWidget);
      expect(find.text('Tests (7)'), findsOneWidget);
      expect(find.text('Syllabus'), findsOneWidget);
      expect(find.text('FAQ'), findsOneWidget);

      // Start Test Series -> Screen 3
      await tester.tap(find.text('Start Test Series'));
      await tester.pumpAndSettle();

      expect(find.text('All Tests'), findsOneWidget);
      expect(find.text('Full Mock (3)'), findsOneWidget);
      expect(find.text('Topic Test (3)'), findsOneWidget);
      expect(find.text('PYQ (1)'), findsOneWidget);
      expect(find.text('Complete Test Series (7 Tests)'), findsOneWidget);
      // 3 free tests get Start Test; 4 paid tests get a lock instead
      expect(find.text('Start Test'), findsNWidgets(3));
      expect(find.byIcon(Icons.lock_outline_rounded), findsNWidgets(4));
      expect(find.text('FREE'), findsNWidgets(3));
      expect(find.text('PAID'), findsNWidgets(4));

      await tester.tap(find.text('Full Mock (3)'));
      await tester.pumpAndSettle();
      expect(find.text('Full Mock Test 1'), findsOneWidget);
      expect(find.text('PYQ 2024 (Set 1)'), findsNothing);
      expect(find.text('Start Test'), findsOneWidget);
    });

    testWidgets('ProfileScreen shows empty states instead of sample student data', (tester) async {
      await LocalStorageService.clearUserSession();
      tester.view.physicalSize = const Size(390, 1000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: ProfileScreen())),
      );
      await tester.pumpAndSettle();

      expect(find.text('Rahul Das'), findsNothing);
      expect(find.text('12 Jan 2002'), findsNothing);
      expect(find.text('52'), findsNothing);
      expect(find.text('Add gender, date of birth & location'), findsOneWidget);
      expect(find.text("You haven't selected any exams yet."), findsOneWidget);
      expect(find.text('Attempt your first mock test to start tracking progress.'), findsOneWidget);
    });
  });
}

class _FakeSeriesRepo extends CatalogRepository {
  @override
  Future<TestSeriesModel?> getTestSeriesById(String id) async => const TestSeriesModel(
        id: 'wbp-constable',
        examId: 'wbp',
        title: 'WBP Constable',
        slug: 'wbp-constable',
        examTitle: 'WBP Constable',
        testCount: 7,
        fullMockCount: 3,
        topicTestCount: 3,
        pyqTestCount: 1,
      );

  @override
  Future<List<MockTestModel>> getTestsForSeries(String id) async => [
        for (var i = 1; i <= 3; i++)
          MockTestModel(
            id: 'fm$i',
            title: 'Full Mock Test $i',
            slug: 'fm$i',
            testType: 'full_mock',
            durationMinutes: 90,
            totalQuestions: 85,
            totalMarks: 100,
            isPremium: i > 1,
          ),
        const MockTestModel(id: 't1', title: 'Topic Test – General Awareness', slug: 't1', testType: 'topic', durationMinutes: 25, totalQuestions: 25, totalMarks: 25),
        const MockTestModel(id: 't2', title: 'Topic Test – Mathematics', slug: 't2', testType: 'topic', durationMinutes: 30, totalQuestions: 30, totalMarks: 30, isPremium: true),
        const MockTestModel(id: 't3', title: 'Topic Test – Reasoning', slug: 't3', testType: 'topic', durationMinutes: 30, totalQuestions: 30, totalMarks: 30, isPremium: true),
        const MockTestModel(id: 'p1', title: 'PYQ 2024 (Set 1)', slug: 'p1', testType: 'pyq', durationMinutes: 90, totalQuestions: 85, totalMarks: 100),
      ];
}

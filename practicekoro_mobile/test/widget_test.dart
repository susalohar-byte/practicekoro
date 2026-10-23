import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/core/components/ui.dart';
import 'package:practicekoro_mobile/core/components/main_navigation_scaffold.dart';
import 'package:practicekoro_mobile/features/profile/profile_screen.dart';
import 'package:practicekoro_mobile/features/exams/exam_list_screen.dart';
import 'package:practicekoro_mobile/features/onboarding/onboarding_screen.dart';
import 'package:practicekoro_mobile/main.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/core/routing/app_router.dart';
import 'package:practicekoro_mobile/data/repositories/auth_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    AuthRepository.signedInOverride = true;
    SharedPreferences.setMockInitialValues({
      'user_name': 'Rohit Das',
      'user_email': 'rohitdas@gmail.com',
      'user_rank': 1245,
      'bookmarks': ['q_1', 'q_2'],
    });
    await LocalStorageService.init();
  });

  testWidgets('PracticeKoroApp renders bottom navigation and home screen', (WidgetTester tester) async {
    appRouter.go('/home');
    await tester.pumpWidget(
      const ProviderScope(
        child: PracticeKoroApp(),
      ),
    );

    await tester.pumpAndSettle();

    // Verify MainNavigationScaffold exists and has transparent surrounding with extendBody: true
    final navScaffoldFinder = find.byType(MainNavigationScaffold);
    expect(navScaffoldFinder, findsOneWidget);
    final scaffold = tester.firstWidget<Scaffold>(find.descendant(of: navScaffoldFinder, matching: find.byType(Scaffold)));
    expect(scaffold.extendBody, isTrue);
    expect(scaffold.backgroundColor, Colors.transparent);

    // Verify navigation tabs and UI presence
    expect(find.text('Home'), findsWidgets);
    expect(find.text('Practice'), findsAtLeastNWidgets(1));
    expect(find.text('Exams'), findsAtLeastNWidgets(1));
    expect(find.text('Results'), findsWidgets);
    expect(find.text('Profile'), findsWidgets);

    // Verify Home Screen Header Logo (Practice + Koro) and Rank Card
    expect(find.text('Rank'), findsOneWidget);
    expect(find.text('3rd'), findsWidgets);
    expect(find.text('👋'), findsOneWidget);
  });

  testWidgets('ProfileScreen renders non-sticky header without pinned AppBar', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: ProfileScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verify no pinned AppBar is used
    expect(find.byType(AppBar), findsNothing);

    // Verify 'My Profile' and settings button are present in scrollable content
    expect(find.text('My Profile'), findsOneWidget);
    final titleCenter = tester.getCenter(find.text('My Profile'));
    final screenWidth = tester.view.physicalSize.width / tester.view.devicePixelRatio;
    expect(titleCenter.dx, closeTo(screenWidth / 2, 2.0));

    expect(find.byIcon(Icons.settings_outlined), findsOneWidget);
    expect(find.byType(ProfileHeader), findsOneWidget);
  });

  testWidgets('ExamListScreen renders non-sticky header without pinned AppBar', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: ExamListScreen(),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    // Verify no pinned AppBar is used
    expect(find.byType(AppBar), findsNothing);

    // Verify 'Exams' title is middle-aligned in scrollable content
    expect(find.text('Exams'), findsOneWidget);
    final titleCenter = tester.getCenter(find.text('Exams'));
    final screenWidth = tester.view.physicalSize.width / tester.view.devicePixelRatio;
    expect(titleCenter.dx, closeTo(screenWidth / 2, 2.0));

    // Verify search bar exists in scrollable content
    expect(find.byType(TextField), findsOneWidget);
  });

  testWidgets('showUICustomDialog and showUIErrorDialog render customized dialog box with icons and buttons', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Builder(
            builder: (context) => Center(
              child: ElevatedButton(
                onPressed: () {
                  showUIErrorDialog(
                    context,
                    title: 'Submission Failed',
                    message: 'Could not connect to the grading server. Please retry.',
                    retryLabel: 'Retry Submission',
                  );
                },
                child: const Text('Open Dialog'),
              ),
            ),
          ),
        ),
      ),
    );

    // Open error dialog
    await tester.tap(find.text('Open Dialog'));
    await tester.pumpAndSettle();

    // Verify custom dialog contents
    expect(find.text('Submission Failed'), findsOneWidget);
    expect(find.text('Could not connect to the grading server. Please retry.'), findsOneWidget);
    expect(find.text('Retry Submission'), findsOneWidget);
    expect(find.text('Dismiss'), findsOneWidget);
    expect(find.byIcon(Icons.error_outline_rounded), findsOneWidget);

    // Tap dismiss to close
    await tester.tap(find.text('Dismiss'));
    await tester.pumpAndSettle();

    expect(find.text('Submission Failed'), findsNothing);
  });

  testWidgets('SplashScreen renders PracticeKoro logo and brand elements', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: SplashScreen(),
      ),
    );

    // Initial frame
    await tester.pump();

    // Verify brand logo image is present
    expect(find.byType(Image), findsAtLeastNWidgets(1));
    expect(find.text('পশ্চিমবঙ্গের বিশ্বস্ত পরীক্ষার প্রস্তুতি'), findsOneWidget);
    expect(find.text('Practice Today, Progress Tomorrow'), findsOneWidget);
    expect(find.text('Version 2.0.0'), findsOneWidget);
  });
}

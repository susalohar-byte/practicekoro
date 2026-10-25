import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/features/onboarding/onboarding_screen.dart';
import 'package:practicekoro_mobile/features/onboarding/widgets/onboarding_illustrations.dart';
import 'package:practicekoro_mobile/features/onboarding/widgets/practicekoro_wordmark.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Widget buildTestableOnboarding() {
    final router = GoRouter(
      initialLocation: '/onboarding',
      routes: [
        GoRoute(
          path: '/onboarding',
          builder: (context, state) => const OnboardingScreen(),
        ),
        GoRoute(
          path: '/home',
          builder: (context, state) => const Scaffold(
            body: Center(child: Text('Home Screen Destination')),
          ),
        ),
      ],
    );

    return MaterialApp.router(
      routerConfig: router,
    );
  }

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('PracticeKoro 3-Screen Onboarding Flow', () {
    testWidgets('Screen 1 renders correctly with wordmark, headline, and illustration', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestableOnboarding());
      await tester.pumpAndSettle();

      // PracticeKoro wordmark is present
      expect(find.byType(PracticeKoroWordmark), findsOneWidget);
      expect(find.textContaining('Practice'), findsWidgets);
      expect(find.textContaining('Koro'), findsWidgets);

      // Skip button is present
      expect(find.text('Skip'), findsOneWidget);

      // Screen 1 Headline: "Prepare Better"
      expect(find.text('Prepare'), findsOneWidget);
      expect(find.text('Better'), findsOneWidget);

      // Screen 1 Illustration
      expect(find.byType(PrepareBetterIllustration), findsOneWidget);

      // Arrow button is present
      expect(find.byIcon(Icons.arrow_forward_rounded), findsOneWidget);

      // First dot is active (width 24), other two are inactive (width 8)
      final dots = tester.widgetList<AnimatedContainer>(find.byType(AnimatedContainer)).take(3).toList();
      expect(dots.length, 3);
      expect(dots[0].constraints?.minWidth, 24);
      expect(dots[1].constraints?.minWidth, 8);
      expect(dots[2].constraints?.minWidth, 8);
    });

    testWidgets('Arrow button steps through Screen 1 -> Screen 2 -> Screen 3 -> Home', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestableOnboarding());
      await tester.pumpAndSettle();

      final arrowFinder = find.byIcon(Icons.arrow_forward_rounded);

      // Step 1: Advance from Screen 1 to Screen 2
      await tester.tap(arrowFinder);
      await tester.pumpAndSettle();

      // Screen 2 Headline: "Practice Smarter"
      expect(find.text('Practice'), findsWidgets);
      expect(find.text('Smarter'), findsOneWidget);
      expect(find.byType(PracticeSmarterIllustration), findsOneWidget);

      // Verify second dot is active
      final dotsAfterStep1 = tester.widgetList<AnimatedContainer>(find.byType(AnimatedContainer)).take(3).toList();
      expect(dotsAfterStep1[0].constraints?.minWidth, 8);
      expect(dotsAfterStep1[1].constraints?.minWidth, 24);
      expect(dotsAfterStep1[2].constraints?.minWidth, 8);

      // Step 2: Advance from Screen 2 to Screen 3
      await tester.tap(arrowFinder);
      await tester.pumpAndSettle();

      // Screen 3 Headline: "Track" & "Your Progress"
      expect(find.text('Track'), findsOneWidget);
      expect(find.text('Your Progress'), findsOneWidget);
      expect(find.byType(TrackProgressIllustration), findsOneWidget);

      // Verify third dot is active
      final dotsAfterStep2 = tester.widgetList<AnimatedContainer>(find.byType(AnimatedContainer)).take(3).toList();
      expect(dotsAfterStep2[0].constraints?.minWidth, 8);
      expect(dotsAfterStep2[1].constraints?.minWidth, 8);
      expect(dotsAfterStep2[2].constraints?.minWidth, 24);

      // Step 3: Advance from Screen 3 completes onboarding and navigates to /home
      await tester.tap(arrowFinder);
      await tester.pumpAndSettle();

      expect(find.text('Home Screen Destination'), findsOneWidget);

      // Verify SharedPreferences flag persisted
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool(onboardingDoneKey), isTrue);
    });

    testWidgets('Skip button navigates directly to Home and sets onboarding_done flag', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestableOnboarding());
      await tester.pumpAndSettle();

      final skipFinder = find.text('Skip');
      expect(skipFinder, findsOneWidget);

      await tester.tap(skipFinder);
      await tester.pumpAndSettle();

      expect(find.text('Home Screen Destination'), findsOneWidget);

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool(onboardingDoneKey), isTrue);
    });

    testWidgets('Onboarding screens adapt without layout overflow on various mobile screen sizes', (WidgetTester tester) async {
      final screenSizes = [
        const Size(320, 568), // Compact (iPhone SE 1st gen)
        const Size(360, 640), // Standard Android compact
        const Size(390, 844), // iPhone 12 / 13 / 14
        const Size(430, 932), // iPhone 14 / 15 Pro Max
        const Size(768, 1024), // Tablet
      ];

      for (final size in screenSizes) {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1.0;

        await tester.pumpWidget(buildTestableOnboarding());
        await tester.pumpAndSettle();

        // Screen 1: no overflow
        expect(tester.takeException(), isNull);

        // Screen 2: no overflow
        await tester.tap(find.byIcon(Icons.arrow_forward_rounded));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);

        // Screen 3: no overflow
        await tester.tap(find.byIcon(Icons.arrow_forward_rounded));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      }

      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  });
}

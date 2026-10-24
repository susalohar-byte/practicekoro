import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/core/components/google_sign_in_button.dart';
import 'package:practicekoro_mobile/core/routing/app_router.dart';

void main() {
  group('GoogleSignInButton & AuthOrDivider', () {
    testWidgets('renders default GoogleSignInButton and responds to taps', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GoogleSignInButton(
              onPressed: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Continue with Google'), findsOneWidget);
      expect(find.byType(CustomPaint), findsWidgets);

      await tester.tap(find.text('Continue with Google'));
      await tester.pump();

      expect(tapped, isTrue);
    });

    testWidgets('renders custom label and shows loading indicator when loading', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GoogleSignInButton(
              label: 'Sign up with Google',
              loading: true,
              onPressed: () {},
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Sign up with Google'), findsNothing);
    });

    testWidgets('renders AuthOrDivider with default and custom text', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                AuthOrDivider(),
                AuthOrDivider(text: 'OR'),
              ],
            ),
          ),
        ),
      );

      expect(find.text('OR CONTINUE WITH EMAIL'), findsOneWidget);
      expect(find.text('OR'), findsOneWidget);
    });

    testWidgets('appRouter routes to /login-callback and renders Completing sign-in', (tester) async {
      final router = appRouter;
      router.go('/login-callback');

      await tester.pumpWidget(
        MaterialApp.router(
          routerConfig: router,
        ),
      );
      await tester.pump();

      expect(find.text('Completing sign-in...'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });
}


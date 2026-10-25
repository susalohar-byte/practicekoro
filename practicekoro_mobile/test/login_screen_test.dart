import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/core/components/google_sign_in_button.dart';
import 'package:practicekoro_mobile/features/auth/auth_screens.dart';

void main() {
  group('LoginScreen Minimalist Redesign Tests', () {
    testWidgets('renders minimalist brand header, title, and subtitle', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: LoginScreen(),
          ),
        ),
      );

      // Verify header elements
      expect(find.text('Welcome back'), findsOneWidget);
      expect(
        find.text('Sign in to practise mock tests & track your progress.'),
        findsOneWidget,
      );
      expect(find.byType(Image), findsWidgets);
    });

    testWidgets('renders Google sign in button and divider', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: LoginScreen(),
          ),
        ),
      );

      expect(find.byType(GoogleSignInButton), findsOneWidget);
      expect(find.text('Continue with Google'), findsOneWidget);
      expect(find.byType(AuthOrDivider), findsOneWidget);
      expect(find.text('OR CONTINUE WITH EMAIL'), findsOneWidget);
    });

    testWidgets('renders input fields, forgot password, and CTA button', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: LoginScreen(),
          ),
        ),
      );

      expect(find.widgetWithText(TextFormField, 'Email address'), findsOneWidget);
      expect(find.widgetWithText(TextFormField, 'Password'), findsOneWidget);
      expect(find.text('Forgot password?'), findsOneWidget);
      expect(find.text('Log In'), findsOneWidget);
      expect(find.text('New to PracticeKoro?'), findsOneWidget);
      expect(find.text('Create account'), findsOneWidget);
    });

    testWidgets('validates required email and password on submitting empty form', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: LoginScreen(),
          ),
        ),
      );

      // Tap Log In button with empty fields
      await tester.tap(find.text('Log In'));
      await tester.pumpAndSettle();

      expect(find.text('Enter your email'), findsOneWidget);
      expect(find.text('Enter your password'), findsOneWidget);
    });

    testWidgets('toggles password visibility icon', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: LoginScreen(),
          ),
        ),
      );

      final visibilityFinder = find.byTooltip('Show password');
      expect(visibilityFinder, findsOneWidget);

      await tester.tap(visibilityFinder);
      await tester.pump();

      expect(find.byTooltip('Hide password'), findsOneWidget);
    });
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/features/settings/settings_screen.dart';

void main() {
  group('SettingsScreen Account Deletion Compliance Tests', () {
    testWidgets('renders Delete Account and Account Deletion Policy options', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify Delete Account row exists
      expect(find.text('Delete Account'), findsOneWidget);
      expect(find.text('Permanently remove your account and all personal data'), findsOneWidget);

      // Verify Account Deletion Policy row exists
      expect(find.text('Account Deletion Policy'), findsOneWidget);
    });

    testWidgets('tapping Delete Account shows confirmation sheet with Google Play compliant warning', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Delete Account'));
      await tester.pumpAndSettle();

      // Verify confirmation sheet elements
      expect(find.text('Delete Account & All Data?'), findsOneWidget);
      expect(find.text('Permanently Delete'), findsOneWidget);
      expect(find.text('Keep My Account'), findsOneWidget);

      // Cancel keeps the user on settings
      await tester.tap(find.text('Keep My Account'));
      await tester.pumpAndSettle();

      expect(find.text('Delete Account & All Data?'), findsNothing);
      expect(find.text('Delete Account'), findsOneWidget);
    });
  });
}

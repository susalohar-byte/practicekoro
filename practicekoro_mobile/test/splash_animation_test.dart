import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/features/onboarding/onboarding_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

double _opacity(WidgetTester tester, int index) => tester
    .widgetList<FadeTransition>(find.descendant(
        of: find.byType(SplashScreen), matching: find.byType(FadeTransition)))
    .elementAt(index)
    .opacity
    .value;

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('icon appears first, wordmark follows, shine runs and ends',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SplashScreen()));

    expect(_opacity(tester, 0), 0.0);
    expect(_opacity(tester, 1), 0.0);

    await tester.pump(const Duration(milliseconds: 300));
    expect(_opacity(tester, 0), greaterThan(0.5));
    expect(_opacity(tester, 1), 0.0, reason: 'wordmark waits for the icon');

    await tester.pump(const Duration(milliseconds: 800));
    expect(_opacity(tester, 1), greaterThan(0.9));
    expect(find.byType(ShaderMask), findsOneWidget, reason: 'shine mid-sweep');

    await tester.pumpAndSettle();
    expect(_opacity(tester, 0), 1.0);
    expect(_opacity(tester, 1), 1.0);
    expect(find.byType(ShaderMask), findsNothing, reason: 'shine gone at rest');
    expect(find.bySemanticsLabel('PracticeKoro'), findsOneWidget);
  });

  testWidgets('remove-animations setting shows the final frame at once',
      (tester) async {
    await tester.pumpWidget(const MediaQuery(
      data: MediaQueryData(disableAnimations: true),
      child: MaterialApp(home: SplashScreen()),
    ));
    await tester.pump();
    expect(_opacity(tester, 0), 1.0);
    expect(_opacity(tester, 1), 1.0);
    expect(find.byType(ShaderMask), findsNothing);
  });
}

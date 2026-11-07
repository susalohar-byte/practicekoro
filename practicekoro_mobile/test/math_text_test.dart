import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/core/components/math_text.dart';

void main() {
  group('splitMath', () {
    test('finds LaTeX and plain fractions', () {
      expect(splitMath(r'উত্তর $6\frac{1}{3}$ দিন'), [
        const MathSegment.text('উত্তর '),
        const MathSegment.math(r'6\frac{1}{3}', r'$6\frac{1}{3}$'),
        const MathSegment.text(' দিন'),
      ]);
      expect(splitMath('6 1/3 দিন'), [
        const MathSegment.fraction('6', '1', '3', '6 1/3'),
        const MathSegment.text(' দিন'),
      ]);
      expect(splitMath('৬ ১/৩'), [
        const MathSegment.fraction('৬', '১', '৩', '৬ ১/৩'),
      ]);
    });

    test('leaves prices, dates and decimals alone', () {
      for (final s in [
        'costs \$5 and \$10',
        'তারিখ 15/08/2024',
        '1.5/2',
        '10 জন পুরুষ 15 দিনে',
      ]) {
        expect(splitMath(s), [MathSegment.text(s)]);
      }
    });
  });

  testWidgets('typesets a mixed fraction, keeps plain text as Text', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Column(children: [MathText('6 1/3 দিন'), MathText('6 দিন')]),
        ),
      ),
    );
    expect(find.text('1'), findsOneWidget);
    expect(find.text('3'), findsOneWidget);
    expect(find.text('6 দিন'), findsOneWidget);
  });

  testWidgets('typesets LaTeX with flutter_math', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: MathText(r'$x^2$ মান'))),
    );
    expect(find.byType(Math), findsOneWidget);
  });
}

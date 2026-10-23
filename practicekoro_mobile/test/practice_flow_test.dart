import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/repositories/catalog_repository.dart';
import 'package:practicekoro_mobile/features/practice/practice_screen.dart';

void main() {
  group('Practice-to-Test Flow Tests', () {
    final catalog = CatalogRepository();

    test('getSubjects returns canonical subjects with valid topic and test counts', () async {
      final subjects = await catalog.getSubjects();
      expect(subjects, isNotEmpty);
      expect(subjects.length, greaterThanOrEqualTo(9));

      final history = subjects.firstWhere((s) => s.id == 'sub_history');
      expect(history.nameEnglish, 'History');
      expect(history.chapterCount, greaterThan(0));
      expect(history.totalTests, greaterThan(0));
    });

    test('getTopics for History returns Indus Valley Civilization chapter', () async {
      final topics = await catalog.getTopics('sub_history');
      expect(topics, isNotEmpty);

      final indus = topics.firstWhere((t) => t.id == 'top_hist_2');
      expect(indus.title, contains('Indus Valley Civilization'));
      expect(indus.totalTests, greaterThanOrEqualTo(8));
    });

    test('getTopicTests for Indus Valley returns 8 tests with 50 Qs and 45 mins', () async {
      final tests = await catalog.getTopicTests('top_hist_2');
      expect(tests.length, 8);

      final test01 = tests.first;
      expect(test01.id, 'test_top_hist_2_1');
      expect(test01.title, 'Test 01');
      expect(test01.totalQuestions, 50);
      expect(test01.durationMinutes, 45);
      expect(test01.totalMarks, 200);
      expect(test01.negativeMarking, 0.25);
      expect(test01.isPro, isFalse);

      final test04 = tests[3];
      expect(test04.title, 'Test 04');
      expect(test04.isPro, isTrue);
    });

    test('getTestById finds topic test correctly', () async {
      final test = await catalog.getTestById('test_top_hist_2_1');
      expect(test, isNotNull);
      expect(test!.title, 'Test 01');
      expect(test.totalQuestions, 50);
    });

    test('getQuestions for topic test returns authentic Bengali questions and options', () async {
      final questions = await catalog.getQuestions('test_top_hist_2_1');
      expect(questions, isNotEmpty);
      expect(questions.length, 50);

      final q3 = questions[2]; // Question 3
      expect(q3.textBengali, contains('সিন্ধু সভ্যতার'));
      expect(q3.options.length, 4);
      expect(q3.options.any((o) => o.isCorrect), isTrue);
      expect(q3.explanationBengali, isNotNull);
    });
  });

  group('PracticeScreen Non-Sticky Header Widget Tests', () {
    testWidgets('renders non-sticky header in CustomScrollView without AppBar', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: PracticeScreen(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Verified: No pinned AppBar
      expect(find.byType(AppBar), findsNothing);

      // Verified: Uses CustomScrollView with non-sticky top header
      expect(find.byType(CustomScrollView), findsOneWidget);
      expect(find.text('Practice'), findsOneWidget);
      final practiceText = tester.widget<Text>(find.text('Practice'));
      expect(practiceText.textAlign, TextAlign.center);
      expect(find.byType(TextField), findsOneWidget);
      expect(find.byIcon(Icons.tune_rounded), findsOneWidget);
    });
  });
}

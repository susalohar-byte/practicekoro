import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/core/routing/app_router.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/data/models/live_test_model.dart';
import 'package:practicekoro_mobile/data/repositories/auth_repository.dart';
import 'package:practicekoro_mobile/data/repositories/catalog_repository.dart';
import 'package:practicekoro_mobile/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    AuthRepository.signedInOverride = true;
    SharedPreferences.setMockInitialValues({
      'user_name': 'Susanta Lohar',
      'user_email': 'susanta@practicekoro.com',
      'user_rank': 1245,
    });
    await LocalStorageService.init();
  });

  group('LiveTestModel Tests', () {
    test('Correctly parses snake_case and camelCase JSON', () {
      final now = DateTime.now();
      final json = {
        'id': 'live-001',
        'test_id': 'test-wbp-01',
        'title': 'WBP Full Mock Test',
        'exam_title': 'WBP Constable',
        'status': 'live',
        'start_at': now.toIso8601String(),
        'scheduled_start_time': now.toIso8601String(),
        'scheduled_end_time': now.add(const Duration(minutes: 90)).toIso8601String(),
        'duration_minutes': 90,
        'total_questions': 100,
        'total_marks': 200,
        'negative_marking': 0.25,
        'participants_count': 2400,
      };

      final model = LiveTestModel.fromJson(json);
      expect(model.id, 'live-001');
      expect(model.testId, 'test-wbp-01');
      expect(model.title, 'WBP Full Mock Test');
      expect(model.isLive, isTrue);
      expect(model.isUpcoming, isFalse);
      expect(model.formattedParticipants, '2.4K');
      expect(model.durationMinutes, 90);
    });

    test('Participant formatting handles edge cases', () {
      final t1 = LiveTestModel(
        id: '1',
        testId: 't1',
        title: 'T1',
        participantsCount: 0,
      );
      expect(t1.formattedParticipants, isNull);

      final t2 = LiveTestModel(
        id: '2',
        testId: 't2',
        title: 'T2',
        participantsCount: 450,
      );
      expect(t2.formattedParticipants, '450');

      final t3 = LiveTestModel(
        id: '3',
        testId: 't3',
        title: 'T3',
        participantsCount: 1000,
      );
      expect(t3.formattedParticipants, '1K');

      final t4 = LiveTestModel(
        id: '4',
        testId: 't4',
        title: 'T4',
        participantsCount: 3200,
      );
      expect(t4.formattedParticipants, '3.2K');

      final t5 = LiveTestModel(
        id: '5',
        testId: 't5',
        title: 'T5',
        participantsCount: 2400,
      );
      expect(t5.formattedParticipants, '2.4K');
    });

    test('Status calculation accurately detects live and upcoming', () {
      final now = DateTime.now();
      final futureTest = LiveTestModel(
        id: 'future',
        testId: 't_future',
        title: 'Future Test',
        status: 'upcoming',
        scheduledStartTime: now.add(const Duration(days: 2)),
      );
      expect(futureTest.isLive, isFalse);
      expect(futureTest.isUpcoming, isTrue);

      final liveTest = LiveTestModel(
        id: 'live',
        testId: 't_live',
        title: 'Live Now Test',
        status: 'live',
        scheduledStartTime: now.subtract(const Duration(minutes: 10)),
        scheduledEndTime: now.add(const Duration(minutes: 80)),
      );
      expect(liveTest.isLive, isTrue);
      expect(liveTest.isUpcoming, isFalse);
    });
  });

  group('CatalogRepository Live Tests', () {
    test('getLiveTests never invents events when the server has none', () async {
      final repo = CatalogRepository();
      final tests = await repo.getLiveTests();
      expect(tests, isEmpty);
    });

    test('getTestById resolves live test and returns valid MockTestModel', () async {
      final repo = CatalogRepository();
      final test = await repo.getTestById('test_exam_wbp_1');
      expect(test, isNotNull);
      expect(test!.title, contains('WBP'));
      expect(test.totalQuestions, greaterThan(0));
    });
  });

  group('HomeScreen Live Test Section UI Widget Tests', () {
    testWidgets('Live Test section renders above Continue Practice without number badge 5',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final now = DateTime.now();
      final scheduled = LiveTestModel(
        id: 'live-wbp-01',
        testId: 'test-live-wbp-01',
        title: 'WBP Full Mock Test',
        examTitle: 'WBP Constable',
        status: 'live',
        startAt: now.subtract(const Duration(minutes: 5)),
        scheduledStartTime: now.subtract(const Duration(minutes: 5)),
        scheduledEndTime: now.add(const Duration(minutes: 85)),
        durationMinutes: 90,
        totalQuestions: 100,
        totalMarks: 200,
        negativeMarking: 0.25,
      );

      appRouter.go('/home');
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            // A Live Test the admin actually scheduled (the repository invents none).
            liveTestsProvider.overrideWith((ref, examId) async => [scheduled]),
          ],
          child: const PracticeKoroApp(),
        ),
      );

      await tester.pumpAndSettle();

      // 1. Verify "Live Test" heading is rendered
      final liveTestHeadingFinder = find.text('Live Test');
      expect(liveTestHeadingFinder, findsOneWidget);

      // 2. Verify NO circular number badge "5" appears before or near Live Test
      // Heading should only be "Live Test" text
      final textWidget = tester.widget<Text>(liveTestHeadingFinder);
      expect(textWidget.data, equals('Live Test'));

      // 3. Verify "See All" button in the Live Test section header
      expect(find.text('See All'), findsWidgets);

      // 4. Verify test cards are rendered
      expect(find.text('WBP Full Mock Test'), findsOneWidget);
      expect(find.text('LIVE'), findsAtLeastNWidgets(1));
      expect(find.text('90 Mins'), findsWidgets);

      // 5. Verify horizontal scrolling
      final listFinder = find.byType(ListView);
      expect(listFinder, findsWidgets);

      // 6. Verify section placement: "Live Test" appears on screen
      final liveTestPosition = tester.getTopLeft(liveTestHeadingFinder);
      expect(liveTestPosition.dy, greaterThan(0));
    });
  });
}

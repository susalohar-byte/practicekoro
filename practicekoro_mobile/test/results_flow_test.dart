import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/data/models/ranking_model.dart';
import 'package:practicekoro_mobile/data/repositories/attempt_repository.dart';
import 'package:practicekoro_mobile/data/repositories/auth_repository.dart';
import 'package:practicekoro_mobile/data/repositories/catalog_repository.dart';
import 'package:practicekoro_mobile/data/repositories/ranking_repository.dart';
import 'package:practicekoro_mobile/features/result_analytics/results_history_screen.dart';
import 'package:practicekoro_mobile/features/result_analytics/student_rank_list_screen.dart';
import 'package:practicekoro_mobile/features/result_analytics/result_screen.dart';
import 'package:practicekoro_mobile/features/result_analytics/solutions_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    AuthRepository.signedInOverride = true;
    SharedPreferences.setMockInitialValues({
      'user_name': 'Susanta Lohar',
      'user_email': 'susanta@practicekoro.com',
      'user_rank': 24,
      'user_district': 'Bankura',
    });
    await LocalStorageService.init();
  });

  group('Ranking Models Tests', () {
    test('StudentRankItem displayName returns full student name and (You) for current user', () {
      const student1 = StudentRankItem(
        rank: 1,
        studentId: 'stud_01',
        name: 'Ritwik Das',
        score: 192,
        totalMarks: 200,
        percentage: 96,
        isCurrentUser: false,
      );
      expect(student1.displayName, 'Ritwik Das');

      const currentUser = StudentRankItem(
        rank: 24,
        studentId: 'current_user',
        name: 'Susanta Lohar',
        score: 144,
        totalMarks: 200,
        percentage: 72,
        isCurrentUser: true,
      );
      expect(currentUser.displayName, 'Susanta Lohar (You)');

      const emptyNameUser = StudentRankItem(
        rank: 24,
        studentId: 'current_user',
        name: 'You',
        score: 144,
        totalMarks: 200,
        percentage: 72,
        isCurrentUser: true,
      );
      // Resolves to saved user name in LocalStorageService ('Susanta Lohar')
      expect(emptyNameUser.displayName, 'Susanta Lohar (You)');

      // Dummy 'Student' name replaces with authentic full name (First + Last Name)
      const dummyStudentRank2 = StudentRankItem(
        rank: 2,
        studentId: 'stud_02',
        name: 'Student',
        score: 186,
        totalMarks: 200,
        percentage: 93,
        isCurrentUser: false,
      );
      expect(dummyStudentRank2.displayName, 'Sneha Roy');

      // Dummy 'Aspirant' name replaces with authentic full name
      const dummyStudentRank3 = StudentRankItem(
        rank: 3,
        studentId: 'stud_03',
        name: 'Aspirant',
        score: 180,
        totalMarks: 200,
        percentage: 90,
        isCurrentUser: false,
      );
      expect(dummyStudentRank3.displayName, 'Arijit Sen');

      // Empty name replaces with authentic full name
      const emptyNameStudentRank4 = StudentRankItem(
        rank: 4,
        studentId: 'stud_04',
        name: '',
        score: 176,
        totalMarks: 200,
        percentage: 88,
        isCurrentUser: false,
      );
      expect(emptyNameStudentRank4.displayName, 'Priyanka Paul');

      // Single word name gains authentic surname
      const singleWordStudent = StudentRankItem(
        rank: 5,
        studentId: 'stud_05',
        name: 'Suman',
        score: 172,
        totalMarks: 200,
        percentage: 86,
        isCurrentUser: false,
      );
      expect(singleWordStudent.displayName.contains(' '), isTrue);
      expect(singleWordStudent.displayName.startsWith('Suman '), isTrue);

      // JSON parsing with dummy 'Student' name resolves to authentic full name
      final jsonStudent = StudentRankItem.fromJson({
        'rank': 1,
        'student_name': 'Student',
        'score': 192,
        'total_marks': 200,
      });
      expect(jsonStudent.displayName, 'Ritwik Das');
    });

    test('StudentRankItem displays score as raw marks formatted correctly', () {
      const item = StudentRankItem(
        rank: 1,
        studentId: 'stud_01',
        name: 'Ritwik Das',
        score: 192,
        totalMarks: 200,
        percentage: 96,
      );
      expect(item.scoreDisplay, '192 / 200');

      const decimalItem = StudentRankItem(
        rank: 2,
        studentId: 'stud_02',
        name: 'Sneha Roy',
        score: 184.5,
        totalMarks: 200,
        percentage: 92.25,
      );
      expect(decimalItem.scoreDisplay, '184.5 / 200');
    });

    test('StudentRankItem JSON serialization roundtrip works', () {
      final json = {
        'rank': 1,
        'student_id': 'stud_001',
        'student_name': 'Ritwik Das',
        'avatar_url': 'https://example.com/avatar1.jpg',
        'score': 192.0,
        'total_marks': 200.0,
        'accuracy': 96.0,
        'time_taken_seconds': 4200,
        'district': 'North 24 Parganas',
        'is_current_user': false,
      };

      final item = StudentRankItem.fromJson(json);
      expect(item.rank, 1);
      expect(item.name, 'Ritwik Das');
      expect(item.score, 192.0);
      expect(item.totalMarks, 200.0);
      expect(item.district, 'North 24 Parganas');
      expect(item.isCurrentUser, isFalse);

      final outJson = item.toJson();
      expect(outJson['student_name'], 'Ritwik Das');
      expect(outJson['score'], 192.0);
      expect(outJson['total_marks'], 200.0);
    });

    test('RankingSummary defaults and properties work correctly', () {
      const summary = RankingSummary(
        testsTaken: 12,
        averageScore: 68.5,
        bestRank: 24,
        bestRankScope: '(In WB)',
      );
      expect(summary.testsTaken, 12);
      expect(summary.averageScore, 68.5);
      expect(summary.bestRank, 24);
      expect(summary.bestRankScope, '(In WB)');
      expect(summary.formattedBestRank, '24th');
    });

    test('RankingSummary formatOrdinal formats ranks accurately (1st, 2nd, 3rd, 4th, 69th)', () {
      expect(RankingSummary.formatOrdinal(1), '1st');
      expect(RankingSummary.formatOrdinal(2), '2nd');
      expect(RankingSummary.formatOrdinal(3), '3rd');
      expect(RankingSummary.formatOrdinal(4), '4th');
      expect(RankingSummary.formatOrdinal(11), '11th');
      expect(RankingSummary.formatOrdinal(12), '12th');
      expect(RankingSummary.formatOrdinal(13), '13th');
      expect(RankingSummary.formatOrdinal(21), '21st');
      expect(RankingSummary.formatOrdinal(22), '22nd');
      expect(RankingSummary.formatOrdinal(23), '23rd');
      expect(RankingSummary.formatOrdinal(24), '24th');
      expect(RankingSummary.formatOrdinal(69), '69th');
      expect(RankingSummary.formatOrdinal(101), '101st');
      expect(RankingSummary.formatOrdinal(111), '111th');
      expect(RankingSummary.formatOrdinal(0), '-');

      const summary1 = RankingSummary(testsTaken: 1, averageScore: 32.5, bestRank: 1);
      expect(summary1.formattedBestRank, '1st');

      const summary69 = RankingSummary(testsTaken: 5, averageScore: 50.0, bestRank: 69);
      expect(summary69.formattedBestRank, '69th');
    });
  });

  group('Ranking Repository Tests', () {
    test('getRankingSummary returns valid metrics from attempt history', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final repo = container.read(rankingRepositoryProvider);
      final summary = await repo.getRankingSummary();

      expect(summary.testsTaken, greaterThanOrEqualTo(4));
      expect(summary.averageScore, greaterThan(0));
      expect(summary.bestRank, greaterThan(0));
      expect(summary.bestRankScope, contains('(In WB)'));
    });

    test('getRankings returns top students and current user for West Bengal scope', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final repo = container.read(rankingRepositoryProvider);
      final rankings = await repo.getRankings(
        testId: 'test_exam_wbp_1',
        scope: 'west_bengal',
      );

      expect(rankings, isNotEmpty);
      expect(rankings.any((r) => r.rank == 1 && r.name == 'Ritwik Das'), isTrue);
      expect(rankings.any((r) => r.isCurrentUser && r.rank == 24), isTrue);
    });

    test('getRankings for district scope filters correctly', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final repo = container.read(rankingRepositoryProvider);
      final bankuraRanks = await repo.getRankings(
        testId: 'test_exam_wbp_1',
        scope: 'district',
        district: 'Bankura',
      );

      expect(bankuraRanks, isNotEmpty);
      expect(bankuraRanks.every((r) => r.district == 'Bankura'), isTrue);
      final userRow = bankuraRanks.firstWhere((r) => r.isCurrentUser);
      expect(userRow.rank, 4);
    });

    test('getTopRankPreview returns top 3 plus current user row', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final repo = container.read(rankingRepositoryProvider);
      final preview = await repo.getTopRankPreview(testId: 'test_exam_wbp_1');

      expect(preview.length, 4);
      expect(preview[0].rank, 1);
      expect(preview[1].rank, 2);
      expect(preview[2].rank, 3);
      expect(preview[3].isCurrentUser, isTrue);
    });
  });

  group('Catalog Attempt History & Benchmark Tests', () {
    test('getAttemptHistory returns authentic benchmark attempts', () async {
      final catalog = CatalogRepository();
      final history = await catalog.getAttemptHistory();

      expect(history, isNotEmpty);
      expect(history.any((a) => a.id == 'attempt_wbp_full_mock_01'), isTrue);
      expect(history.any((a) => a.id == 'attempt_gk_topic_test'), isTrue);
      expect(history.any((a) => a.id == 'attempt_pyq_2024'), isTrue);
      expect(history.any((a) => a.id == 'attempt_weekly_live'), isTrue);
    });

    test('getAttempt attempt_wbp_full_mock_01 matches UI reference values', () async {
      final catalog = CatalogRepository();
      final attempt = await catalog.getAttempt('attempt_wbp_full_mock_01');

      expect(attempt, isNotNull);
      expect(attempt.testTitle, contains('Full Mock 01'));
      expect(attempt.score, 144.0);
      expect(attempt.totalMarks, 200.0);
      expect(attempt.accuracy, 72.0);
      expect(attempt.rank, 24);
      expect(attempt.correctCount, 144);
      expect(attempt.wrongCount, 56);
      expect(attempt.skippedCount, 0);
    });

    test('Question 1 matches authentic reference "Sorrow of Bengal" GK question', () async {
      final catalog = CatalogRepository();
      final questions = await catalog.getQuestions('test_exam_wbp_1');

      expect(questions, isNotEmpty);
      final q1 = questions.first;
      expect(q1.textBengali, contains('বাংলার দুঃখ'));
      expect(q1.subjectName, 'General Knowledge');
      expect(q1.options.first.isCorrect, isTrue);
      expect(q1.options.first.textBengali, 'দামোদর');
      expect(q1.options.first.text, 'Damodar');
      expect(q1.explanationBengali, contains('দামোদর নদী'));
    });
  });

  group('Results UI Screen Widget Tests', () {
    testWidgets('ResultsHistoryScreen renders summary cards, filter tabs, and lists',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(body: ResultsHistoryScreen()),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Header title (non-sticky middle alignment)
      expect(find.text('My Results'), findsOneWidget);
      final titleCenter = tester.getCenter(find.text('My Results'));
      final screenWidth = tester.view.physicalSize.width / tester.view.devicePixelRatio;
      expect(titleCenter.dx, closeTo(screenWidth / 2, 2.0));

      // Summary cards
      expect(find.text('Tests Taken'), findsOneWidget);
      expect(find.text('Avg. Score'), findsOneWidget);
      expect(find.text('Best Rank'), findsOneWidget);
      expect(find.text('3rd'), findsWidgets);
      expect(find.text('(In WB)'), findsNothing);

      // Filter tabs
      expect(find.text('All'), findsOneWidget);
      expect(find.text('Full Mock'), findsOneWidget);
      expect(find.text('Topic Tests'), findsOneWidget);
      expect(find.text('PYQ'), findsOneWidget);
      expect(find.text('Live Tests'), findsOneWidget);

      // Student Rank List card
      expect(find.text('Student Rank List'), findsOneWidget);
      expect(find.text('Ritwik Das'), findsOneWidget);
      expect(find.textContaining('Susanta Lohar'), findsWidgets);
      expect(find.textContaining('(You)'), findsWidgets);

      // Recent Results section
      expect(find.text('Recent Results'), findsOneWidget);
      expect(find.textContaining('Full Mock 01'), findsWidgets);

      // Tap filter tab 'Topic Tests'
      await tester.tap(find.text('Topic Tests'));
      await tester.pumpAndSettle();
      expect(find.textContaining('General Knowledge - Topic Test'), findsWidgets);
    });

    testWidgets('StudentRankListScreen renders tabs, search bar, and mark scores',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(body: StudentRankListScreen()),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Title & Selector
      expect(find.text('Student Rank List'), findsOneWidget);
      expect(find.text('WBP Constable Full Mock 01'), findsWidgets);

      // Student full names
      expect(find.text('Ritwik Das'), findsWidgets);
      expect(find.textContaining('Susanta Lohar'), findsWidgets);

      // 3 Scope Tabs
      expect(find.text('Global Rank'), findsOneWidget);
      expect(find.text('West Bengal'), findsOneWidget);
      expect(find.text('District Rank'), findsOneWidget);

      // Scores displayed as marks
      expect(find.text('192 / 200'), findsOneWidget);

      // Switch to District Rank tab
      await tester.tap(find.text('District Rank'));
      await tester.pumpAndSettle();

      // District selector is visible
      expect(find.text('Select District'), findsOneWidget);
    });

    testWidgets('ResultScreen renders score ring, accuracy, breakdown, and View Answer button',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(body: ResultScreen(attemptId: 'att_bench_01')),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Score ring text
      expect(find.text('144 / 200'), findsOneWidget);
      expect(find.text('Score'), findsOneWidget);

      // Metrics
      expect(find.text('72%'), findsOneWidget);
      expect(find.text('Accuracy'), findsOneWidget);
      expect(find.text('Time Taken'), findsOneWidget);
      expect(find.text('Rank'), findsOneWidget);

      // Breakdown card
      expect(find.text('Total Questions'), findsOneWidget);
      expect(find.text('Attempted'), findsOneWidget);
      expect(find.text('Correct'), findsOneWidget);
      expect(find.text('Incorrect'), findsOneWidget);
      expect(find.text('Skipped'), findsOneWidget);
      expect(find.text('Negative Marking'), findsOneWidget);
      expect(find.text('Final Score'), findsOneWidget);

      // Prominent View Answer button
      expect(find.text('View Answer'), findsOneWidget);
    });

    testWidgets('SolutionsScreen renders top Question Number Navigator, Red/Green options, and Explanation',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: SolutionsScreen(attemptId: 'att_bench_01'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Top Question Numbers Navigator
      expect(find.text('Select Question'), findsOneWidget);
      expect(find.textContaining('Correct'), findsWidgets);
      expect(find.textContaining('Wrong'), findsWidgets);

      // Question 1 numbers in horizontal scroller
      expect(find.text('1'), findsWidgets);
      expect(find.text('2'), findsWidgets);
      expect(find.text('3'), findsWidgets);

      // Option display for Question 1 (Correct Answer)
      expect(find.text('Correct Answer'), findsOneWidget);

      // Explanation is present directly below options
      expect(find.text('Explanation'), findsOneWidget);

      // Bottom Navigation buttons
      expect(find.text('Previous'), findsOneWidget);
      expect(find.text('Next'), findsOneWidget);

      // Tap 'Next' to move to Question 2
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      // In Question 2 (Benchmark incorrect question), 'Your Answer' (Red badge) and 'Correct Answer' (Green badge) are both present
      expect(find.text('Your Answer'), findsOneWidget);
      expect(find.text('Correct Answer'), findsOneWidget);
    });

    test('AttemptRepository.formatAnswersPayload converts answers Map into canonical JSON array', () {
      final input = {
        'q-101': 'A',
        'q-102': 'C',
        'q-103': 'D',
      };
      final payload = AttemptRepository.formatAnswersPayload(input);
      expect(payload, isA<List<Map<String, String>>>());
      expect(payload.length, 3);
      expect(payload[0], {'questionId': 'q-101', 'selectedOption': 'A'});
      expect(payload[1], {'questionId': 'q-102', 'selectedOption': 'C'});
      expect(payload[2], {'questionId': 'q-103', 'selectedOption': 'D'});
    });
  });
}


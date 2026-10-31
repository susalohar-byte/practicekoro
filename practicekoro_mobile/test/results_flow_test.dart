import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/data/models/attempt_model.dart';
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

      // Names come from the server as-is; nothing is invented.
      const aspirant = StudentRankItem(
        rank: 2,
        studentId: 'stud_02',
        name: 'Aspirant Student',
        score: 186,
        totalMarks: 200,
        percentage: 93,
      );
      expect(aspirant.displayName, 'Aspirant Student');

      const singleWord = StudentRankItem(
        rank: 5,
        studentId: 'stud_05',
        name: 'Suman',
        score: 172,
        totalMarks: 200,
        percentage: 86,
      );
      expect(singleWord.displayName, 'Suman');

      const noName = StudentRankItem(
        rank: 4,
        studentId: 'stud_04',
        name: '',
        score: 176,
        totalMarks: 200,
        percentage: 88,
      );
      expect(noName.displayName, 'Student');

      final jsonStudent = StudentRankItem.fromJson({
        'rank': 1,
        'student_name': '',
        'score': 192,
        'total_marks': 200,
      });
      expect(jsonStudent.displayName, 'Student');
      expect(StudentRankItem.fromJson(const {}).rank, 0);
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
    test('getRankingSummary uses only real attempts and server ranks', () async {
      final container = ProviderContainer(
        overrides: [
          catalogRepositoryProvider.overrideWithValue(
            _FakeCatalog([
              _attempt('a1', 'test-1', score: 150, rank: 30),
              _attempt('a2', 'test-2', score: 100),
            ]),
          ),
        ],
      );
      addTearDown(container.dispose);

      final summary =
          await container.read(rankingRepositoryProvider).getRankingSummary();
      expect(summary.testsTaken, 2);
      expect(summary.averageScore, 62.5);
      expect(summary.bestRank, 30);
    });

    test('getRankingSummary is empty before the first test', () async {
      final container = ProviderContainer(
        overrides: [
          catalogRepositoryProvider.overrideWithValue(_FakeCatalog(const [])),
        ],
      );
      addTearDown(container.dispose);

      final summary =
          await container.read(rankingRepositoryProvider).getRankingSummary();
      expect(summary.testsTaken, 0);
      expect(summary.bestRank, 0);
      expect(summary.formattedBestRank, '-');
    });

    test('getRankings throws instead of inventing a leaderboard', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(
        container
            .read(rankingRepositoryProvider)
            .getRankings(testId: 'test-1', scope: 'west_bengal'),
        throwsA(isA<RankingUnavailable>()),
      );
    });

    test('getTopRankPreview is empty when the student has no attempts', () async {
      final container = ProviderContainer(
        overrides: [
          catalogRepositoryProvider.overrideWithValue(_FakeCatalog(const [])),
        ],
      );
      addTearDown(container.dispose);

      final preview =
          await container.read(rankingRepositoryProvider).getTopRankPreview();
      expect(preview, isEmpty);
    });

    test('getTopRankPreview returns top 3 plus the real current-user row', () async {
      final container = ProviderContainer(
        overrides: [
          catalogRepositoryProvider.overrideWithValue(
            _FakeCatalog([_attempt('a1', 'test-1', score: 150, rank: 7)]),
          ),
          rankingRepositoryProvider.overrideWith(
            (ref) => _FakeRanking(ref, _leaderboard),
          ),
        ],
      );
      addTearDown(container.dispose);

      final preview =
          await container.read(rankingRepositoryProvider).getTopRankPreview();
      expect(preview.map((r) => r.rank), [1, 2, 3, 7]);
      expect(preview.last.isCurrentUser, isTrue);
    });
  });

  group('Catalog Attempt History Tests', () {
    test('getAttemptHistory is empty for a student with no attempts', () async {
      final history = await CatalogRepository().getAttemptHistory();
      expect(history, isEmpty);
    });

    test('getAttempt fails for an unknown attempt instead of a sample one', () {
      expect(
        CatalogRepository().getAttempt('attempt_wbp_full_mock_01'),
        throwsA(isA<AttemptFailure>()),
      );
    });

    test('getQuestions never returns built-in sample questions', () {
      expect(
        CatalogRepository().getQuestions('test_exam_wbp_1'),
        throwsA(isA<AttemptFailure>()),
      );
    });
  });

  group('Results UI Screen Widget Tests', () {
    void bigScreen(WidgetTester tester) {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
    }

    final attempts = [
      _attempt('a1', 'test-1', title: 'WBP Mock 01', score: 144, rank: 7),
      _attempt('a2', 'test-2', title: 'GK Topic Test', score: 100),
    ];

    testWidgets('ResultsHistoryScreen renders summary cards, filter tabs, and lists',
        (tester) async {
      bigScreen(tester);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            catalogRepositoryProvider.overrideWithValue(_FakeCatalog(attempts)),
            rankingRepositoryProvider.overrideWith(
              (ref) => _FakeRanking(ref, _leaderboard),
            ),
          ],
          child: const MaterialApp(
            home: Scaffold(body: ResultsHistoryScreen()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('My Results'), findsOneWidget);
      final titleCenter = tester.getCenter(find.text('My Results'));
      final screenWidth = tester.view.physicalSize.width / tester.view.devicePixelRatio;
      expect(titleCenter.dx, closeTo(screenWidth / 2, 2.0));

      // Summary cards from the student's real attempts.
      expect(find.text('Tests Taken'), findsOneWidget);
      expect(find.text('2'), findsWidgets);
      expect(find.text('Best Rank'), findsOneWidget);
      expect(find.text('7th'), findsWidgets);

      for (final tab in ['All', 'Full Mock', 'Topic Tests', 'PYQ', 'Live Tests']) {
        expect(find.text(tab), findsOneWidget);
      }

      // Rank preview straight from the leaderboard.
      expect(find.text('Student Rank List'), findsOneWidget);
      expect(find.text('Ritwik Das'), findsOneWidget);
      expect(find.textContaining('(You)'), findsWidgets);

      expect(find.text('Recent Results'), findsOneWidget);
      expect(find.textContaining('WBP Mock 01'), findsWidgets);

      await tester.tap(find.text('Topic Tests'));
      await tester.pumpAndSettle();
      expect(find.textContaining('GK Topic Test'), findsWidgets);
    });

    testWidgets('ResultsHistoryScreen fits a small phone at double font size',
        (tester) async {
      tester.view.physicalSize = const Size(750, 1624); // 375 x 812
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            catalogRepositoryProvider.overrideWithValue(_FakeCatalog(attempts)),
            rankingRepositoryProvider.overrideWith(
              (ref) => _FakeRanking(ref, _leaderboard),
            ),
          ],
          child: MaterialApp(
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(context)
                  .copyWith(textScaler: const TextScaler.linear(2.0)),
              child: child!,
            ),
            home: const Scaffold(body: ResultsHistoryScreen()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // A RenderFlex overflow is reported as an exception in tests.
      expect(tester.takeException(), isNull);
      expect(find.text('My Results'), findsOneWidget);
    });

    testWidgets('ResultsHistoryScreen shows empty states, not invented numbers',
        (tester) async {
      bigScreen(tester);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            catalogRepositoryProvider.overrideWithValue(_FakeCatalog(const [])),
          ],
          child: const MaterialApp(
            home: Scaffold(body: ResultsHistoryScreen()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('0'), findsOneWidget); // tests taken
      expect(find.text('-'), findsNWidgets(2)); // average and best rank
      expect(find.text('No rankings yet'), findsOneWidget);
      expect(find.text('24th'), findsNothing);
      expect(find.text('Ritwik Das'), findsNothing);
    });

    testWidgets('StudentRankListScreen lists the student\'s own tests and real ranks',
        (tester) async {
      bigScreen(tester);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            catalogRepositoryProvider.overrideWithValue(_FakeCatalog(attempts)),
            rankingRepositoryProvider.overrideWith(
              (ref) => _FakeRanking(ref, _leaderboard),
            ),
          ],
          child: const MaterialApp(
            home: Scaffold(body: StudentRankListScreen()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Student Rank List'), findsOneWidget);
      expect(find.text('WBP Mock 01'), findsWidgets);
      expect(find.text('Ritwik Das'), findsWidgets);
      expect(find.text('192 / 200'), findsOneWidget);
      expect(find.text('Global Rank'), findsOneWidget);
      expect(find.text('West Bengal'), findsOneWidget);
      expect(find.text('District Rank'), findsOneWidget);

      // The picker offers exactly the tests this student attempted.
      await tester.tap(find.byTooltip('Filter'));
      await tester.pumpAndSettle();
      expect(find.text('Select Test'), findsOneWidget);
      expect(find.text('GK Topic Test'), findsOneWidget);
      expect(find.textContaining('Full Mock 01'), findsNothing);
      await tester.tap(find.text('GK Topic Test'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('District Rank'));
      await tester.pumpAndSettle();
      expect(find.text('Select District'), findsOneWidget);
    });

    testWidgets('StudentRankListScreen asks for a first test when there are none',
        (tester) async {
      bigScreen(tester);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            catalogRepositoryProvider.overrideWithValue(_FakeCatalog(const [])),
          ],
          child: const MaterialApp(
            home: Scaffold(body: StudentRankListScreen()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Finish a test to see the student rank list.'), findsOneWidget);
      expect(find.textContaining('(You)'), findsNothing);
    });

    testWidgets('ResultScreen renders score ring, accuracy, breakdown, and View Answer button',
        (tester) async {
      bigScreen(tester);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            catalogRepositoryProvider.overrideWithValue(_FakeCatalog(attempts)),
          ],
          child: const MaterialApp(
            home: Scaffold(body: ResultScreen(attemptId: 'a1')),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('144 / 200'), findsOneWidget);
      expect(find.text('Score'), findsOneWidget);
      expect(find.text('72%'), findsOneWidget);
      expect(find.text('Accuracy'), findsOneWidget);
      expect(find.text('Time Taken'), findsOneWidget);
      expect(find.text('Rank'), findsOneWidget);
      expect(find.text('7th'), findsOneWidget);
      expect(find.text('(Out of 5,243)'), findsOneWidget);

      for (final row in [
        'Total Questions', 'Attempted', 'Correct', 'Incorrect', 'Skipped',
        'Negative Marking', 'Final Score',
      ]) {
        expect(find.text(row), findsOneWidget);
      }
      expect(find.text('View Answer'), findsOneWidget);
    });

    testWidgets('ResultScreen shows no rank until the server ranks the attempt',
        (tester) async {
      bigScreen(tester);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            catalogRepositoryProvider.overrideWithValue(_FakeCatalog(attempts)),
          ],
          child: const MaterialApp(
            home: Scaffold(body: ResultScreen(attemptId: 'a2')),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('(Not ranked yet)'), findsOneWidget);
      expect(find.text('24th'), findsNothing);
      expect(find.textContaining('5,243'), findsNothing);
    });

    testWidgets('SolutionsScreen shows an error, never sample questions, when offline',
        (tester) async {
      bigScreen(tester);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            catalogRepositoryProvider.overrideWithValue(_FakeCatalog(attempts)),
          ],
          child: const MaterialApp(home: SolutionsScreen(attemptId: 'a1')),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Something went wrong'), findsOneWidget);
      expect(find.text('Try again'), findsOneWidget);
      expect(find.textContaining('বাংলার দুঃখ'), findsNothing);
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

TestAttemptModel _attempt(
  String id,
  String testId, {
  String title = 'Test',
  double score = 0,
  int rank = 0,
}) => TestAttemptModel(
  id: id,
  testId: testId,
  testTitle: title,
  score: score,
  totalMarks: 200,
  rank: rank,
  totalParticipants: rank > 0 ? 5243 : 0,
  correctCount: (score / 2).round(),
  wrongCount: 100 - (score / 2).round(),
  timeSpentSeconds: 3600,
  completedAt: DateTime(2026, 10, id == 'a1' ? 20 : 18),
);

const _leaderboard = [
  StudentRankItem(rank: 1, studentId: 's1', name: 'Ritwik Das', score: 192, totalMarks: 200, percentage: 96),
  StudentRankItem(rank: 2, studentId: 's2', name: 'Sneha Roy', score: 186, totalMarks: 200, percentage: 93),
  StudentRankItem(rank: 3, studentId: 's3', name: 'Arijit Sen', score: 180, totalMarks: 200, percentage: 90),
  StudentRankItem(rank: 7, studentId: 'me', name: 'Test Student', score: 144, totalMarks: 200, percentage: 72, isCurrentUser: true),
];

/// Serves fixed attempts in place of the device/server history.
class _FakeCatalog extends CatalogRepository {
  final List<TestAttemptModel> attempts;
  _FakeCatalog(this.attempts);

  @override
  Future<List<TestAttemptModel>> getAttemptHistory() async => attempts;

  @override
  Future<TestAttemptModel> getAttempt(String attemptId) async =>
      attempts.firstWhere((a) => a.id == attemptId);
}

/// Serves a fixed leaderboard in place of the server RPC.
class _FakeRanking extends RankingRepository {
  final List<StudentRankItem> rows;
  _FakeRanking(super.ref, this.rows);

  @override
  Future<List<StudentRankItem>> getRankings({
    required String testId,
    required String scope,
    String? district,
    String? block,
  }) async => rows;
}

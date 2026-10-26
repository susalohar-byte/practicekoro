import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/data/models/question_model.dart';
import 'package:practicekoro_mobile/data/models/attempt_model.dart';
import 'package:practicekoro_mobile/data/models/topic_model.dart';
import 'package:practicekoro_mobile/data/models/test_model.dart';
import 'package:practicekoro_mobile/data/models/student_profile_model.dart';
import 'package:practicekoro_mobile/data/repositories/catalog_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('LocalStorageService Tests', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({
        'user_name': 'Rohit Das',
        'user_email': 'rohitdas@gmail.com',
        'user_rank': 1245,
        'bookmarks': ['q_1'],
      });
      await LocalStorageService.init();
    });

    test('Loads default user data correctly', () {
      expect(LocalStorageService.getUserName(), equals('Rohit Das'));
      expect(LocalStorageService.getUserEmail(), equals('rohitdas@gmail.com'));
      expect(LocalStorageService.getUserRank(), equals(1245));
    });

    test('Reads and saves district, caste, and dob correctly', () async {
      await LocalStorageService.setUserDistrict('North 24 Parganas');
      await LocalStorageService.setUserCaste('OBC-A');
      await LocalStorageService.setUserDob('2000-05-20');

      expect(LocalStorageService.getUserDistrict(), equals('North 24 Parganas'));
      expect(LocalStorageService.getUserCaste(), equals('OBC-A'));
      expect(LocalStorageService.getUserDob(), equals('2000-05-20'));
    });

    test('Bookmark toggle works correctly', () async {
      expect(LocalStorageService.isBookmarked('q_1'), isTrue);
      expect(LocalStorageService.isBookmarked('q_2'), isFalse);

      await LocalStorageService.toggleBookmark('q_2');
      expect(LocalStorageService.isBookmarked('q_2'), isTrue);

      await LocalStorageService.toggleBookmark('q_1');
      expect(LocalStorageService.isBookmarked('q_1'), isFalse);
    });
  });

  group('Model Serialization & Bengali Unicode Tests', () {
    test('StudentProfileModel serialization with district, caste, and birth date', () {
      final profile = StudentProfileModel(
        fullName: 'Subhash Mukherjee',
        email: 'subhash@example.com',
        district: 'Bankura',
        category: 'OBC_B',
        dob: DateTime(1999, 12, 10),
      );

      final json = profile.toJson();
      expect(json['district'], equals('Bankura'));
      expect(json['category'], equals('OBC_B'));
      expect(json['caste'], equals('OBC_B'));
      expect(json['dob'], equals('1999-12-10'));
      expect(json['birth_date'], equals('1999-12-10'));

      final parsed = StudentProfileModel.fromJson(json);
      expect(parsed.district, equals('Bankura'));
      expect(parsed.category, equals('OBC_B'));
      expect(parsed.categoryLabel, equals('OBC-B'));
      expect(parsed.dob, equals(DateTime(1999, 12, 10)));
    });

    test('StudentProfileModel category normalization works for various inputs', () {
      expect(StudentProfileModel.normalizeCategoryCode('General (UR)'), equals('GEN'));
      expect(StudentProfileModel.normalizeCategoryCode('UR'), equals('GEN'));
      expect(StudentProfileModel.normalizeCategoryCode('OBC-A'), equals('OBC_A'));
      expect(StudentProfileModel.normalizeCategoryCode('OBC_B'), equals('OBC_B'));
      expect(StudentProfileModel.normalizeCategoryCode('SC'), equals('SC'));
      expect(StudentProfileModel.normalizeCategoryCode('ST'), equals('ST'));
      expect(StudentProfileModel.normalizeCategoryCode('EWS'), equals('EWS'));
      expect(StudentProfileModel.normalizeCategoryCode(''), equals('NOT_SPECIFIED'));
    });

    test('QuestionModel preserves Bengali Unicode text', () {
      const q = QuestionModel(
        id: 'q_test_1',
        testId: 'test_wbp_1',
        questionNumber: 1,
        textBengali: 'ভারতের সংবিধানের জনক কাকে বলা হয়?',
        textEnglish: 'Who is known as the father of Indian Constitution?',
        explanationBengali: 'ডঃ বি. আর. আম্বেদকর ছিলেন খসড়া কমিটির চেয়ারম্যান।',
        marks: 2.0,
        options: [
          OptionModel(
            id: 'opt_1',
            label: 'A',
            text: 'Dr. B. R. Ambedkar',
            textBengali: 'ডঃ বি. আর. আম্বেদকর',
            isCorrect: true,
          ),
          OptionModel(
            id: 'opt_2',
            label: 'B',
            text: 'Jawaharlal Nehru',
            textBengali: 'জওহরলাল নেহরু',
            isCorrect: false,
          ),
        ],
      );

      final json = q.toJson();
      expect(json['text_bengali'], contains('ভারতের সংবিধানের'));
      expect(json['explanation_bengali'], contains('আম্বেদকর'));

      final parsed = QuestionModel.fromJson(json);
      expect(parsed.textBengali, equals(q.textBengali));
      expect(parsed.options.first.textBengali, equals('ডঃ বি. আর. আম্বেদকর'));
      expect(parsed.options.first.isCorrect, isTrue);
    });

    test('TestAttemptModel calculates stats and ranks accurately', () {
      final attempt = TestAttemptModel(
        id: 'attempt_test_wbp_1',
        testId: 'test_wbp_1',
        testTitle: 'WBP Constable - Full Mock Test 01',
        score: 72.0,
        totalMarks: 100.0,
        accuracy: 84.7,
        percentile: 96.1,
        rank: 245,
        totalParticipants: 12680,
        correctCount: 72,
        wrongCount: 13,
        skippedCount: 15,
        timeSpentSeconds: 31 * 60 + 40,
        completedAt: DateTime.now(),
        expectedCutoffs: const {
          'General (UR)': '65 - 68',
          'OBC-A / OBC-B': '58 - 62',
          'SC': '52 - 56',
          'ST': '45 - 48',
        },
      );

      expect(attempt.score, equals(72.0));
      expect(attempt.accuracy, equals(84.7));
      expect(attempt.rank, equals(245));
      expect(attempt.expectedCutoffs.length, equals(4));
    });

    test('TopicModel progress calculation works as expected', () {
      const topic = TopicModel(
        id: 'top_hist',
        subjectId: 'sub_hist',
        title: 'Indian History',
        titleBengali: 'ভারতের ইতিহাস',
        slug: 'indian-history',
        completedTests: 12,
        totalTests: 20,
        progress: 0.80,
      );

      expect(topic.completedTests, equals(12));
      expect(topic.totalTests, equals(20));
      expect(topic.progress, equals(0.80));
    });
  });

  group('CatalogRepository Tests', () {
    test('exams and subjects are never invented when offline', () {
      final repo = CatalogRepository();
      expect(repo.getExams(), throwsA(isA<CatalogUnavailable>()));
      expect(repo.getSubjects(), throwsA(isA<CatalogUnavailable>()));
    });

    test('getMockTests never generates tests when offline', () {
      final repo = CatalogRepository();
      expect(repo.getMockTests('exam_wbp'), throwsA(isA<CatalogUnavailable>()));
    });

    test('MockTestModel normalizes categories', () {
      expect(MockTestModel.normalizeCategory('Mock Test'), equals('Full Test'));
      expect(MockTestModel.normalizeCategory('full_mock'), equals('Full Test'));
      expect(MockTestModel.normalizeCategory('topic'), equals('Topic Test'));
      expect(MockTestModel.normalizeCategory('chapter_mock'), equals('Topic Test'));
      expect(MockTestModel.normalizeCategory('Previous Year'), equals('PYQ'));
      expect(MockTestModel.normalizeCategory('pyq'), equals('PYQ'));
    });
  });
}

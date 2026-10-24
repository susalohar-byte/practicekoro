import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/models/subject_model.dart';
import 'package:practicekoro_mobile/data/models/topic_model.dart';
import 'package:practicekoro_mobile/data/repositories/attempt_repository.dart';
import 'package:practicekoro_mobile/data/repositories/catalog_repository.dart';
import 'package:practicekoro_mobile/features/practice/practice_common.dart';
import 'package:practicekoro_mobile/features/practice/practice_screen.dart';

void main() {
  group('Practice-to-Test Flow Tests', () {
    final catalog = CatalogRepository();

    // Without a backend the catalog reports an error (screens show retry);
    // it never invents subjects, chapters, tests or questions.
    test('getSubjects reports unavailable instead of inventing subjects', () {
      expect(catalog.getSubjects(), throwsA(isA<CatalogUnavailable>()));
    });

    test('getTopics reports unavailable instead of inventing chapters', () {
      expect(
        catalog.getTopics('sub_history'),
        throwsA(isA<CatalogUnavailable>()),
      );
    });

    test('getTopicTests reports unavailable instead of generating tests', () {
      expect(
        catalog.getTopicTests('top_hist_2'),
        throwsA(isA<CatalogUnavailable>()),
      );
    });

    test('getTestById does not make up a test for an unknown id', () {
      expect(
        catalog.getTestById('test_top_hist_2_1'),
        throwsA(isA<CatalogUnavailable>()),
      );
    });

    test('getQuestions never serves a built-in question set', () {
      expect(
        catalog.getQuestions('test_top_hist_2_1'),
        throwsA(isA<AttemptFailure>()),
      );
    });
  });

  group('Database Schema and Subject-Topic Mapping Tests', () {
    test('SubjectModel correctly parses Supabase relational chapters and tests counts', () {
      final json = {
        'id': 'wbp-history',
        'name': 'Indian History',
        'slug': 'indian-history',
        'order_index': 1,
        'chapters': [
          {'count': 23}
        ],
        'tests': [
          {'count': 3}
        ],
      };

      final subject = SubjectModel.fromJson(json);
      expect(subject.id, 'wbp-history');
      expect(subject.nameEnglish, 'Indian History');
      expect(subject.nameBengali, 'ইতিহাস');
      expect(subject.chapterCount, 23);
      expect(subject.totalTests, 3);
    });

    test('TopicModel parses Supabase chapters row with parentheses for Bengali title', () {
      final json = {
        'id': 'wbp-hist-indus',
        'subject_id': 'wbp-history',
        'name': 'Indus Valley Civilization (সিন্ধু সভ্যতা)',
        'slug': 'indus-valley-civilization',
        'order_index': 1,
        'tests': [
          {'count': 3}
        ],
      };

      final topic = TopicModel.fromJson(json);
      expect(topic.id, 'wbp-hist-indus');
      expect(topic.subjectId, 'wbp-history');
      expect(topic.title, 'Indus Valley Civilization');
      expect(topic.titleBengali, 'সিন্ধু সভ্যতা');
      expect(topic.totalTests, 3);
    });

    test('topicsForSubject matches database subjectId and canonical subjectId', () {
      const subject = SubjectModel(
        id: 'wbp-history',
        nameEnglish: 'Indian History',
        nameBengali: 'ইতিহাস',
        slug: 'indian-history',
      );

      final topics = [
        const TopicModel(
          id: 't1',
          subjectId: 'wbp-history',
          title: 'Indus Valley',
        ),
        const TopicModel(
          id: 't2',
          subjectId: 'wbp-science',
          title: 'Everyday Chemistry',
        ),
        const TopicModel(
          id: 't3',
          subjectId: 'sub_history',
          title: 'Ancient India',
        ),
      ];

      final filtered = topicsForSubject(topics, subject);
      expect(filtered.length, 2);
      expect(filtered.map((t) => t.id), containsAll(['t1', 't3']));
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

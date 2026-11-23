import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/models/test_model.dart';
import 'package:practicekoro_mobile/data/models/topic_model.dart';
import 'package:practicekoro_mobile/features/exams/exam_test_filters.dart';

MockTestModel _test(
  String id, {
  String title = 'Test',
  String category = 'Topic Test',
  String? subjectId,
  String? topicId,
  String? paperName,
}) => MockTestModel(
  id: id,
  title: title,
  category: category,
  subjectId: subjectId,
  topicId: topicId,
  paperName: paperName,
);

void main() {
  group('MockTestModel.stage', () {
    test('reads Prelims / Mains from the title', () {
      expect(
        _test('a', title: 'WBP Constable 2024 Prelims Official Paper').stage,
        'Prelims',
      );
      expect(_test('b', title: 'WBCS Preliminary Mock 1').stage, 'Prelims');
      expect(_test('c', title: 'WBCS Mains Full Mock 2').stage, 'Mains');
      expect(_test('d', title: 'WBP মেইন পরীক্ষা ২০২৩').stage, 'Mains');
      expect(_test('e', title: 'প্রিলি মক টেস্ট').stage, 'Prelims');
      expect(
        _test(
          'f',
          title: 'WBP Constable Final Written 2019 Question Paper',
        ).stage,
        'Mains',
      );
      expect(_test('g', title: 'Grand Final Mock Test').stage, isNull);
    });

    test('prefers paper_name and ignores look-alike words', () {
      expect(_test('a', title: 'Mock 1', paperName: 'Mains').stage, 'Mains');
      expect(_test('b', title: 'Domain knowledge test').stage, isNull);
      expect(_test('c', title: 'Remaining syllabus mock').stage, isNull);
      expect(_test('d', title: 'Prelims + Mains combined').stage, isNull);
    });

    test('parses subject, topic and paper from database rows', () {
      final t = MockTestModel.fromJson({
        'id': 't1',
        'title': 'History 1',
        'subject_id': 's1',
        'chapter_id': 'c1',
        'paper_name': ' Prelims ',
      });
      expect([t.subjectId, t.topicId, t.paperName], ['s1', 'c1', 'Prelims']);
      expect(
        MockTestModel.fromJson({'id': 't2', 'subject_id': ''}).subjectId,
        isNull,
      );
    });
  });

  group('topic test filters', () {
    const topics = [
      TopicModel(id: 'mughal', subjectId: 'history', title: 'Mughal Empire'),
      TopicModel(
        id: 'freedom',
        subjectId: 'history',
        title: 'Freedom Struggle',
      ),
      TopicModel(id: 'rivers', subjectId: 'geo', title: 'Rivers'),
    ];
    final topicsById = {for (final t in topics) t.id: t};
    final tests = [
      _test('1', topicId: 'mughal'), // subject comes from the topic
      _test('2', subjectId: 'history', topicId: 'freedom'),
      _test('3', topicId: 'freedom'),
      _test('4', topicId: 'rivers'),
      _test('5'), // no subject or topic
    ];

    test('lists subjects that have tests, in subject order', () {
      final opts = subjectOptions(
        tests,
        topicsById,
        ['geo', 'history', 'polity'],
        {'geo': 'Geography', 'history': 'History', 'polity': 'Polity'},
      );
      expect(
        [for (final o in opts) '${o.label}:${o.count}'],
        ['Geography:1', 'History:3'],
      );
    });

    test('lists the chosen subject\'s topics in topic order', () {
      final opts = topicOptions(tests, 'history', topics, topicsById);
      expect(
        [for (final o in opts) '${o.label}:${o.count}'],
        ['Mughal Empire:1', 'Freedom Struggle:2'],
      );
    });

    test('filters by subject, then by topic', () {
      List<String> ids(List<MockTestModel> l) => [for (final t in l) t.id];
      expect(ids(applyTestFilters(tests, topicsById, subjectId: 'history')), [
        '1',
        '2',
        '3',
      ]);
      expect(
        ids(
          applyTestFilters(
            tests,
            topicsById,
            subjectId: 'history',
            topicId: 'freedom',
          ),
        ),
        ['2', '3'],
      );
      expect(ids(applyTestFilters(tests, topicsById)), [
        '1',
        '2',
        '3',
        '4',
        '5',
      ]);
    });
  });

  group('Prelims / Mains filter', () {
    test('appears only when both stages exist', () {
      final both = [
        _test('1', title: 'Prelims Mock 1'),
        _test('2', title: 'Prelims Mock 2'),
        _test('3', title: 'Mains Mock 1'),
        _test('4', title: 'General Mock'),
      ];
      final opts = stageOptions(both);
      expect(
        [for (final o in opts) '${o.id}:${o.count}'],
        ['Prelims:2', 'Mains:1'],
      );
      expect(applyTestFilters(both, const {}, stage: 'Mains').single.id, '3');

      expect(
        stageOptions([
          _test('1', title: 'Prelims Mock 1'),
          _test('2', title: 'Mock'),
        ]),
        isEmpty,
      );
      expect(stageOptions([_test('1', title: 'Mock 1')]), isEmpty);
    });
  });
}

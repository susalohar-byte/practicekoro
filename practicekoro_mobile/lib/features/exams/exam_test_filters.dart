import '../../data/models/test_model.dart';
import '../../data/models/topic_model.dart';

/// One choice in a filter chip row: an id, its label and how many tests match.
class FilterOption {
  final String id;
  final String label;
  final int count;

  const FilterOption(this.id, this.label, this.count);
}

/// Prelims / Mains, in the order they are shown.
const examStages = ['Prelims', 'Mains'];

/// Subject of [test]: its own `subject_id`, else the subject of its topic.
String? subjectOfTest(MockTestModel test, Map<String, TopicModel> topicsById) {
  if (test.subjectId != null) return test.subjectId;
  final topicSubject = topicsById[test.topicId]?.subjectId;
  return topicSubject == null || topicSubject.isEmpty ? null : topicSubject;
}

/// Subjects that have at least one of [tests], in [subjectOrder] order,
/// labelled with [subjectNames]. Subjects without a known name are skipped.
List<FilterOption> subjectOptions(
  List<MockTestModel> tests,
  Map<String, TopicModel> topicsById,
  List<String> subjectOrder,
  Map<String, String> subjectNames,
) {
  final counts = <String, int>{};
  for (final t in tests) {
    final s = subjectOfTest(t, topicsById);
    if (s != null && subjectNames.containsKey(s)) {
      counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  return [
    for (final id in subjectOrder)
      if (counts.containsKey(id))
        FilterOption(id, subjectNames[id]!, counts[id]!),
  ];
}

/// Topics of [subjectId] that have at least one of [tests], in topic order.
List<FilterOption> topicOptions(
  List<MockTestModel> tests,
  String subjectId,
  List<TopicModel> topics,
  Map<String, TopicModel> topicsById,
) {
  final counts = <String, int>{};
  for (final t in tests) {
    final id = t.topicId;
    if (id != null &&
        topicsById.containsKey(id) &&
        subjectOfTest(t, topicsById) == subjectId) {
      counts[id] = (counts[id] ?? 0) + 1;
    }
  }
  return [
    for (final topic in topics)
      if (counts.containsKey(topic.id))
        FilterOption(topic.id, topic.title, counts[topic.id]!),
  ];
}

/// Prelims / Mains choices, only when [tests] include both stages.
List<FilterOption> stageOptions(List<MockTestModel> tests) {
  final counts = <String, int>{};
  for (final t in tests) {
    final s = t.stage;
    if (s != null) counts[s] = (counts[s] ?? 0) + 1;
  }
  if (!examStages.every(counts.containsKey)) return const [];
  return [for (final s in examStages) FilterOption(s, s, counts[s]!)];
}

/// [tests] narrowed by the chosen subject, topic and stage (null = any).
List<MockTestModel> applyTestFilters(
  List<MockTestModel> tests,
  Map<String, TopicModel> topicsById, {
  String? subjectId,
  String? topicId,
  String? stage,
}) {
  return tests.where((t) {
    if (subjectId != null && subjectOfTest(t, topicsById) != subjectId) {
      return false;
    }
    if (topicId != null && t.topicId != topicId) return false;
    if (stage != null && t.stage != stage) return false;
    return true;
  }).toList();
}

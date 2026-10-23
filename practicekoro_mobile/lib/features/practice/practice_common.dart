import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/subject_model.dart';
import '../../data/models/topic_model.dart';

/// Topic filter shared by the Practice and Topic Test screens.
enum TopicFilter { all, weak, completed }

const topicFilterOptions = [
  (TopicFilter.all, 'All Topics'),
  (TopicFilter.weak, 'Weak Topics'),
  (TopicFilter.completed, 'Completed'),
];

bool isTopicCompleted(TopicModel t) =>
    t.progress >= 1 || (t.totalTests > 0 && t.completedTests >= t.totalTests);

/// A topic is "in progress" when the student has started but not finished it.
bool isTopicInProgress(TopicModel t) =>
    t.progress > 0 && t.progress < 1 && !isTopicCompleted(t);

List<TopicModel> applyTopicFilter(
  List<TopicModel> topics,
  TopicFilter filter,
) => switch (filter) {
  TopicFilter.all => topics,
  TopicFilter.weak => topics.where((t) => t.isWeak).toList(),
  TopicFilter.completed => topics.where(isTopicCompleted).toList(),
};

/// Topics that belong to [subject]. The repository may return every topic,
/// so we filter by subject id here; topics without a subject id are kept.
List<TopicModel> topicsForSubject(
  List<TopicModel> topics,
  SubjectModel? subject,
) {
  if (subject == null) return topics;
  return topics
      .where((t) => t.subjectId.isEmpty || t.subjectId == subject.id)
      .toList();
}

/// Starts a practice session for one topic through the existing test runner.
void startTopicSession(BuildContext context, TopicModel topic) {
  context.push(
    '/test/topic_${topic.id}/active?title=${Uri.encodeQueryComponent(topic.title)}',
  );
}

void startPracticeSession(BuildContext context, String id, String title) {
  context.push('/test/$id/active?title=${Uri.encodeQueryComponent(title)}');
}

const _subjectIcons = <(List<String>, IconData)>[
  (['history'], Icons.account_balance_rounded),
  (['geograph'], Icons.public_rounded),
  (['math', 'arith'], Icons.calculate_rounded),
  (['econom'], Icons.eco_rounded),
  (['polity', 'constitution'], Icons.gavel_rounded),
  (['science', 'tech'], Icons.science_rounded),
  (['current'], Icons.newspaper_rounded),
  (['environment'], Icons.forest_rounded),
  (['sport'], Icons.emoji_events_rounded),
  (['award', 'honour'], Icons.military_tech_rounded),
  (['book', 'author'], Icons.auto_stories_rounded),
  (['english', 'bengali', 'language'], Icons.translate_rounded),
  (['reason'], Icons.psychology_rounded),
  (['static', 'general knowledge', 'gk'], Icons.lightbulb_rounded),
];

IconData subjectIcon(String name) {
  final n = name.toLowerCase();
  for (final (keys, icon) in _subjectIcons) {
    if (keys.any(n.contains)) return icon;
  }
  return Icons.menu_book_rounded;
}

String percentLabel(double progress) =>
    '${(progress.clamp(0, 1) * 100).round()}%';

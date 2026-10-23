class TopicModel {
  final String id;
  final String subjectId;
  final String title;
  final String? titleBengali;
  final String slug;
  final int totalQuestions;
  final int attemptedQuestions;
  final int completedTests;
  final int totalTests;
  final double progress;
  final bool isWeak;

  const TopicModel({
    required this.id,
    this.subjectId = '',
    required this.title,
    this.titleBengali,
    this.slug = '',
    this.totalQuestions = 0,
    this.attemptedQuestions = 0,
    this.completedTests = 0,
    this.totalTests = 0,
    this.progress = 0.0,
    this.isWeak = false,
  });

  factory TopicModel.fromJson(Map<String, dynamic> json) {
    final tQ = (json['total_questions'] as num?)?.toInt() ?? 0;
    final aQ = (json['attempted_questions'] as num?)?.toInt() ?? 0;
    final cT = (json['completed_tests'] as num?)?.toInt() ?? 0;
    final tT = (json['total_tests'] as num?)?.toInt() ?? 0;
    final prog = json['progress'] != null
        ? (json['progress'] as num).toDouble()
        : (tQ > 0 ? (aQ / tQ) : (tT > 0 ? cT / tT : 0.0));

    return TopicModel(
      id: json['id']?.toString() ?? '',
      subjectId: json['subject_id']?.toString() ?? '',
      title: json['title']?.toString() ?? json['name']?.toString() ?? '',
      titleBengali:
          json['title_bengali']?.toString() ?? json['name_bn']?.toString(),
      slug: json['slug']?.toString() ?? '',
      totalQuestions: tQ,
      attemptedQuestions: aQ,
      completedTests: cT,
      totalTests: tT,
      progress: prog.clamp(0.0, 1.0),
      isWeak: json['is_weak'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'subject_id': subjectId,
    'title': title,
    'title_bengali': titleBengali,
    'slug': slug,
    'total_questions': totalQuestions,
    'attempted_questions': attemptedQuestions,
    'completed_tests': completedTests,
    'total_tests': totalTests,
    'progress': progress,
    'is_weak': isWeak,
  };
}

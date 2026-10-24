class PerformerRank {
  final int rank;
  final String name;
  final double score;
  final bool isCurrentUser;

  const PerformerRank({
    required this.rank,
    required this.name,
    required this.score,
    this.isCurrentUser = false,
  });

  factory PerformerRank.fromJson(Map<String, dynamic> json) {
    return PerformerRank(
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      name: json['name']?.toString() ?? '',
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      isCurrentUser: json['is_current_user'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'rank': rank,
    'name': name,
    'score': score,
    'is_current_user': isCurrentUser,
  };
}

class TestAttemptModel {
  final String id;
  final String testId;
  final String testTitle;
  final double score;
  final double totalMarks;
  final double accuracy;
  final double percentage;
  final int rank;
  final int totalParticipants;
  final double percentile;
  final String? district;
  final int districtRank;
  final int districtParticipants;
  final String? userCaste;
  final bool isCategoryQualified;
  final int correctCount;
  final int wrongCount;
  final int skippedCount;
  final int timeSpentSeconds;
  /// When the attempt was completed, or null when the server did not report
  /// it. Display sites should show '—' for null.
  final DateTime? completedAtOrNull;
  final Map<String, dynamic> userAnswers; // questionId -> optionId
  final Map<String, String> expectedCutoffs;
  final List<PerformerRank> topPerformers;

  const TestAttemptModel({
    required this.id,
    required this.testId,
    required this.testTitle,
    this.score = 0,
    this.totalMarks = 0,
    this.accuracy = 0,
    this.percentage = 0,
    this.rank = 0,
    this.totalParticipants = 0,
    this.percentile = 0,
    this.district,
    this.districtRank = 0,
    this.districtParticipants = 0,
    this.userCaste,
    this.isCategoryQualified = false,
    this.correctCount = 0,
    this.wrongCount = 0,
    this.skippedCount = 0,
    this.timeSpentSeconds = 0,
    DateTime? completedAt,
    this.userAnswers = const {},
    this.expectedCutoffs = const {},
    this.topPerformers = const [],
  }) : completedAtOrNull = completedAt;

  /// Legacy non-null accessor kept for older call sites. Prefer
  /// [completedAtOrNull]; this falls back to the current time when the
  /// completion time is unknown.
  DateTime get completedAt => completedAtOrNull ?? DateTime.now();

  factory TestAttemptModel.fromJson(Map<String, dynamic> json) {
    final rawPerformers = json['top_performers'] as List? ?? const [];
    return TestAttemptModel(
      id: json['id']?.toString() ?? '',
      testId: json['test_id']?.toString() ?? '',
      testTitle: json['test_title']?.toString() ?? 'Test',
      score: (json['score'] as num?)?.toDouble() ?? 0,
      totalMarks: (json['total_marks'] as num?)?.toDouble() ?? 0,
      accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0,
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0,
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      totalParticipants: (json['total_participants'] as num?)?.toInt() ?? 0,
      percentile: (json['percentile'] as num?)?.toDouble() ?? 0,
      district: json['district']?.toString(),
      districtRank: (json['district_rank'] as num?)?.toInt() ?? 0,
      districtParticipants:
          (json['district_participants'] as num?)?.toInt() ?? 0,
      userCaste: json['user_caste']?.toString() ?? json['caste']?.toString(),
      isCategoryQualified: json['is_category_qualified'] as bool? ?? false,
      correctCount: (json['correct_count'] as num?)?.toInt() ?? 0,
      wrongCount: (json['wrong_count'] as num?)?.toInt() ?? 0,
      skippedCount: (json['skipped_count'] as num?)?.toInt() ?? 0,
      timeSpentSeconds: (json['time_spent_seconds'] as num?)?.toInt() ?? 0,
      completedAt: json['completed_at'] != null
          ? DateTime.tryParse(json['completed_at'].toString())
          : null,
      userAnswers: () {
        final raw = json['user_answers'];
        if (raw is Map) {
          return raw.map((k, v) => MapEntry(k.toString(), v));
        } else if (raw is List) {
          final map = <String, dynamic>{};
          for (final item in raw) {
            if (item is Map) {
              final qId = item['questionId'] ?? item['question_id'] ?? item['id'];
              final optId = item['selectedOption'] ??
                  item['selected_option'] ??
                  item['optionId'] ??
                  item['option_id'];
              if (qId != null && optId != null) {
                map[qId.toString()] = optId.toString();
              }
            }
          }
          return map;
        }
        return const <String, dynamic>{};
      }(),
      expectedCutoffs:
          (json['expected_cutoffs'] as Map?)?.map(
            (k, v) => MapEntry(k.toString(), v.toString()),
          ) ??
          const {},
      topPerformers: rawPerformers
          .map((p) => PerformerRank.fromJson(p as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'test_id': testId,
    'test_title': testTitle,
    'score': score,
    'total_marks': totalMarks,
    'accuracy': accuracy,
    'percentage': percentage,
    'rank': rank,
    'total_participants': totalParticipants,
    'percentile': percentile,
    'district': district,
    'district_rank': districtRank,
    'district_participants': districtParticipants,
    'user_caste': userCaste,
    'is_category_qualified': isCategoryQualified,
    'correct_count': correctCount,
    'wrong_count': wrongCount,
    'skipped_count': skippedCount,
    'time_spent_seconds': timeSpentSeconds,
    'completed_at': completedAtOrNull?.toIso8601String(),
    'user_answers': userAnswers,
    'expected_cutoffs': expectedCutoffs,
    'top_performers': topPerformers.map((p) => p.toJson()).toList(),
  };
}

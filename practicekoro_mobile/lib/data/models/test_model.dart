class MockTestModel {
  final String id;
  final String? examId;
  final String? examTitle;
  final String? examLogo;
  final String title;
  final String? description;
  final int totalQuestions;
  final int durationMinutes;
  final double totalMarks;
  /// Null when the server did not report the negative-marking rule.
  final double? negativeMarking;
  final bool isPro;
  final String category; // 'Full Test', 'Topic Test', 'PYQ'
  final String? syllabus;
  final String? language;
  final List<String> instructions;

  /// Exam year for Official PYQ papers (`tests.year`), when known.
  final int? year;

  static String normalizeCategory(String? cat) {
    if (cat == null || cat.trim().isEmpty) return 'Full Test';
    final lower = cat.toLowerCase();
    if (lower.contains('pyq') || lower.contains('previous') || lower.contains('year')) {
      return 'PYQ';
    }
    if (lower.contains('topic') || lower.contains('chapter') || lower.contains('subject')) {
      return 'Topic Test';
    }
    if (lower.contains('full') || lower.contains('mock')) {
      return 'Full Test';
    }
    return cat;
  }

  String get normalizedCategory => normalizeCategory(category);

  const MockTestModel({
    required this.id,
    this.examId,
    this.examTitle,
    this.examLogo,
    required this.title,
    this.description,
    this.totalQuestions = 0,
    this.durationMinutes = 0,
    this.totalMarks = 0,
    this.negativeMarking,
    this.isPro = false,
    this.category = 'Full Test',
    this.syllabus,
    this.language,
    // Empty means the details screen builds the rules from this test's real
    // numbers (marks, negative marking, duration) instead of generic text.
    this.instructions = const [],
    this.year,
  });

  factory MockTestModel.fromJson(Map<String, dynamic> json) {
    return MockTestModel(
      id: json['id']?.toString() ?? '',
      examId: json['exam_id']?.toString() ?? json['examId']?.toString(),
      examTitle: json['exam_title']?.toString() ?? json['examName']?.toString(),
      examLogo: json['exam_logo']?.toString(),
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString(),
      totalQuestions: (json['total_questions'] as num?)?.toInt() ?? 0,
      durationMinutes:
          (json['duration_minutes'] as num?)?.toInt() ??
          (json['duration'] as num?)?.toInt() ??
          0,
      totalMarks: (json['total_marks'] as num?)?.toDouble() ?? 0,
      negativeMarking: (json['negative_marking'] as num?)?.toDouble(),
      isPro: json['is_pro'] as bool? ?? json['is_premium'] as bool? ?? false,
      category: normalizeCategory(
        json['category']?.toString() ?? json['test_type']?.toString(),
      ),
      syllabus: json['syllabus']?.toString(),
      language: json['language']?.toString(),
      year: (json['year'] as num?)?.toInt(),
      instructions: json['instructions'] != null
          ? (json['instructions'] as List).map((e) => e.toString()).toList()
          : const [],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'exam_id': examId,
    'exam_title': examTitle,
    'exam_logo': examLogo,
    'title': title,
    'description': description,
    'total_questions': totalQuestions,
    'duration_minutes': durationMinutes,
    'total_marks': totalMarks,
    'negative_marking': negativeMarking,
    'is_pro': isPro,
    'category': category,
    'syllabus': syllabus,
    'language': language,
    'instructions': instructions,
    'year': year,
  };

  /// [year], or a 4-digit year (19xx/20xx) in the title, e.g. "2019 PYQ".
  int? get paperYear {
    if (year != null) return year;
    final m = RegExp(r'\b(19|20)\d{2}\b').firstMatch(title);
    return m == null ? null : int.parse(m.group(0)!);
  }
}

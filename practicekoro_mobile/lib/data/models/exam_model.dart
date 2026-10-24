class ExamModel {
  final String id;
  final String title;
  final String slug;
  final String? category;
  final String? description;
  final String? iconName;
  final String? bannerUrl;
  final int totalTests;
  final int totalQuestions;
  final int orderIndex;
  final bool isActive;

  const ExamModel({
    required this.id,
    required this.title,
    required this.slug,
    this.category,
    this.description,
    this.iconName,
    this.bannerUrl,
    this.totalTests = 0,
    this.totalQuestions = 0,
    this.orderIndex = 0,
    this.isActive = true,
  });

  factory ExamModel.fromJson(Map<String, dynamic> json) {
    int count = 0;
    if (json['tests'] is List && (json['tests'] as List).isNotEmpty) {
      final first = (json['tests'] as List).first;
      if (first is Map && first['count'] != null) {
        count = (first['count'] as num).toInt();
      }
    }
    if (count == 0) {
      count = (json['total_tests'] as num?)?.toInt() ??
          (json['test_count'] as num?)?.toInt() ??
          (json['tests_count'] as num?)?.toInt() ??
          0;
    }

    return ExamModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      category: json['category']?.toString(),
      description: json['description']?.toString(),
      iconName:
          json['icon_name']?.toString() ??
          json['iconUrl']?.toString() ??
          json['logo_url']?.toString(),
      bannerUrl: json['banner_url']?.toString(),
      totalTests: count,
      totalQuestions: (json['total_questions'] as num?)?.toInt() ?? 0,
      orderIndex: (json['order_index'] as num?)?.toInt() ?? 0,
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  /// Subtitle or department name displayed in the middle row of the exam card.
  /// Uses the database/admin description if provided; otherwise falls back to
  /// the official department or authority name based on the exam.
  String get effectiveDescription {
    final desc = description?.trim();
    if (desc != null && desc.isNotEmpty) {
      return desc;
    }
    final s = slug.toLowerCase();
    final i = id.toLowerCase();
    final t = title.toLowerCase();
    if (s.contains('wbp') || i.contains('wbp') || t.contains('wbp') || t.contains('police')) {
      return 'West Bengal Police';
    }
    if (s.contains('wbpsc') || i.contains('wbpsc') || t.contains('wbpsc') || t.contains('psc')) {
      return 'West Bengal Public Service Commission';
    }
    if (s.contains('wbssc') || i.contains('wbssc') || t.contains('group c') || t.contains('group d')) {
      return 'School Service Commission';
    }
    if (s.contains('food') || i.contains('food') || t.contains('food')) {
      return 'Food & Supplies Department';
    }
    if (s.contains('icds') || i.contains('icds') || t.contains('icds')) {
      return 'Women & Child Development';
    }
    if (s.contains('kp') || i.contains('kp') || t.contains('kolkata police')) {
      return 'Kolkata Police';
    }
    if (s.contains('tet') || i.contains('tet') || t.contains('primary')) {
      return 'West Bengal Board of Primary Education';
    }
    if (s.contains('rail') || i.contains('rail') || t.contains('railway')) {
      return 'Indian Railways';
    }
    if (s.contains('ssc') || i.contains('ssc') || t.contains('staff selection')) {
      return 'Staff Selection Commission';
    }
    if (s.contains('bank') || i.contains('bank') || t.contains('banking')) {
      return 'Banking Examination';
    }
    return (category != null && category!.trim().isNotEmpty)
        ? '${category!.trim()} Examination'
        : 'State Govt Examination';
  }

  /// The test count displayed in the bottom row of the exam card (e.g. "120 Tests").
  /// The real number of tests in the database; 0 when none are published yet.
  int get effectiveTotalTests => totalTests;

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'slug': slug,
    'category': category,
    'description': description,
    'icon_name': iconName,
    'banner_url': bannerUrl,
    'total_tests': totalTests,
    'total_questions': totalQuestions,
    'order_index': orderIndex,
    'is_active': isActive,
  };
}

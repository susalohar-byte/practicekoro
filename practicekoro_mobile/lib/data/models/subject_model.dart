class SubjectModel {
  final String id;
  final String nameEnglish;
  final String nameBengali;
  final String slug;
  final String? iconName;
  final int totalQuestions;
  final int chapterCount;
  final int totalTests;
  final int orderIndex;

  const SubjectModel({
    required this.id,
    required this.nameEnglish,
    required this.nameBengali,
    required this.slug,
    this.iconName,
    this.totalQuestions = 0,
    this.chapterCount = 0,
    this.totalTests = 0,
    this.orderIndex = 0,
  });

  factory SubjectModel.fromJson(Map<String, dynamic> json) {
    return SubjectModel(
      id: json['id']?.toString() ?? '',
      nameEnglish:
          json['name_english']?.toString() ?? json['name']?.toString() ?? '',
      nameBengali:
          json['name_bengali']?.toString() ??
          json['name_bn']?.toString() ??
          json['name_english']?.toString() ??
          '',
      slug: json['slug']?.toString() ?? '',
      iconName: json['icon_name']?.toString() ?? json['icon_url']?.toString(),
      totalQuestions: (json['total_questions'] as num?)?.toInt() ?? 0,
      chapterCount: (json['chapter_count'] as num?)?.toInt() ?? 0,
      totalTests: (json['total_tests'] as num?)?.toInt() ?? 0,
      orderIndex: (json['order_index'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name_english': nameEnglish,
    'name_bengali': nameBengali,
    'slug': slug,
    'icon_name': iconName,
    'total_questions': totalQuestions,
    'chapter_count': chapterCount,
    'total_tests': totalTests,
    'order_index': orderIndex,
  };
}

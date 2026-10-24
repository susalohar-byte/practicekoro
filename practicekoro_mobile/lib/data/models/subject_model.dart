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
    final chaptersList = json['chapters'] as List?;
    final countFromChapters = (chaptersList != null &&
            chaptersList.isNotEmpty &&
            chaptersList[0] is Map)
        ? (chaptersList[0]['count'] as num?)?.toInt()
        : null;

    final testsList = json['tests'] as List?;
    final countFromTests = (testsList != null &&
            testsList.isNotEmpty &&
            testsList[0] is Map)
        ? (testsList[0]['count'] as num?)?.toInt()
        : null;

    final chCount = countFromChapters ??
        (json['chapter_count'] as num?)?.toInt() ??
        (json['chapters_count'] as num?)?.toInt() ??
        0;

    final tTests = countFromTests ??
        (json['total_tests'] as num?)?.toInt() ??
        (json['tests_count'] as num?)?.toInt() ??
        0;

    final engName =
        json['name_english']?.toString() ?? json['name']?.toString() ?? '';
    final rawBn =
        json['name_bengali']?.toString() ?? json['name_bn']?.toString();
    final bnName = (rawBn != null && rawBn.trim().isNotEmpty)
        ? rawBn.trim()
        : _inferBengaliName(engName);

    return SubjectModel(
      id: json['id']?.toString() ?? '',
      nameEnglish: engName,
      nameBengali: bnName,
      slug: json['slug']?.toString() ?? '',
      iconName: json['icon_name']?.toString() ?? json['icon_url']?.toString(),
      totalQuestions: (json['total_questions'] as num?)?.toInt() ?? 0,
      chapterCount: chCount,
      totalTests: tTests,
      orderIndex: (json['order_index'] as num?)?.toInt() ?? 0,
    );
  }

  static String _inferBengaliName(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('history')) return 'ইতিহাস';
    if (lower.contains('math') || lower.contains('arith')) return 'গণিত';
    if (lower.contains('science')) return 'সাধারণ বিজ্ঞান';
    if (lower.contains('polity') || lower.contains('constitution')) {
      return 'ভারতের সংবিধান ও রাষ্ট্রব্যবস্থা';
    }
    if (lower.contains('bengali')) return 'বাংলা সাহিত্য';
    if (lower.contains('geography')) return 'ভূগোল';
    if (lower.contains('environment')) return 'পরিবেশ বিদ্যা';
    if (lower.contains('reasoning') || lower.contains('logic')) return 'রিজনিং';
    if (lower.contains('english')) return 'ইংরেজি';
    if (lower.contains('computer')) return 'কম্পিউটার';
    if (lower.contains('static')) return 'স্ট্যাটিক জিকে';
    if (lower.contains('current') || lower.contains('affair')) {
      return 'সাম্প্রতিক ঘটনাপ্রবাহ';
    }
    if (lower.contains('gk') ||
        lower.contains('knowledge') ||
        lower.contains('awareness')) {
      return 'সাধারণ জ্ঞান';
    }
    if (lower.contains('economy') || lower.contains('economic')) return 'অর্থনীতি';
    return name;
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

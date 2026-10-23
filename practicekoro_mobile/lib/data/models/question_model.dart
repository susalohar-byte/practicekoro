class OptionModel {
  final String id;
  final String label; // 'A', 'B', 'C', 'D'
  final String text;
  final String? textBengali;
  final bool isCorrect;

  const OptionModel({
    required this.id,
    required this.label,
    required this.text,
    this.textBengali,
    this.isCorrect = false,
  });

  factory OptionModel.fromJson(Map<String, dynamic> json, int index) {
    const labels = ['A', 'B', 'C', 'D', 'E'];
    final lbl =
        json['label']?.toString() ??
        (index < labels.length ? labels[index] : '$index');
    return OptionModel(
      id: json['id']?.toString() ?? 'opt_$index',
      label: lbl,
      text: json['text']?.toString() ?? '',
      textBengali:
          json['text_bengali']?.toString() ?? json['text_bn']?.toString(),
      isCorrect: json['is_correct'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'label': label,
    'text': text,
    'text_bengali': textBengali,
    'is_correct': isCorrect,
  };
}

class QuestionModel {
  final String id;
  final String? testId;
  final int questionNumber;
  final String textEnglish;
  final String textBengali;
  final List<OptionModel> options;
  final String? explanationBengali;
  final String? explanationEnglish;
  final double marks;
  final double negativeMarks;
  final List<String> relatedNotes;
  final String? subjectName;

  const QuestionModel({
    required this.id,
    this.testId,
    this.questionNumber = 1,
    required this.textEnglish,
    required this.textBengali,
    required this.options,
    this.explanationBengali,
    this.explanationEnglish,
    this.marks = 2.0,
    this.negativeMarks = 0.25,
    this.relatedNotes = const [],
    this.subjectName,
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    final rawOptions = json['options'] as List? ?? [];
    final opts = <OptionModel>[];
    for (var i = 0; i < rawOptions.length; i++) {
      if (rawOptions[i] is Map<String, dynamic>) {
        opts.add(
          OptionModel.fromJson(rawOptions[i] as Map<String, dynamic>, i),
        );
      } else if (rawOptions[i] is String) {
        const labels = ['A', 'B', 'C', 'D', 'E'];
        opts.add(
          OptionModel(
            id: 'opt_$i',
            label: i < labels.length ? labels[i] : '$i',
            text: rawOptions[i].toString(),
            isCorrect: i == 1, // fallback default
          ),
        );
      }
    }

    final notes = json['related_notes'] != null
        ? (json['related_notes'] as List).map((e) => e.toString()).toList()
        : const <String>[];

    return QuestionModel(
      id: json['id']?.toString() ?? '',
      testId: json['test_id']?.toString(),
      questionNumber: (json['question_number'] as num?)?.toInt() ?? 1,
      textEnglish:
          json['text_english']?.toString() ??
          json['question_text']?.toString() ??
          '',
      textBengali:
          json['text_bengali']?.toString() ??
          json['question_text_bn']?.toString() ??
          json['text_english']?.toString() ??
          '',
      options: opts,
      explanationBengali:
          json['explanation_bengali']?.toString() ??
          json['explanation_bn']?.toString(),
      explanationEnglish:
          json['explanation_english']?.toString() ??
          json['explanation']?.toString(),
      marks: (json['marks'] as num?)?.toDouble() ?? 2.0,
      negativeMarks: (json['negative_marks'] as num?)?.toDouble() ?? 0.25,
      relatedNotes: notes,
      subjectName: json['subject_name']?.toString() ?? json['subjectName']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'test_id': testId,
    'question_number': questionNumber,
    'text_english': textEnglish,
    'text_bengali': textBengali,
    'options': options.map((o) => o.toJson()).toList(),
    'explanation_bengali': explanationBengali,
    'explanation_english': explanationEnglish,
    'marks': marks,
    'negative_marks': negativeMarks,
    'related_notes': relatedNotes,
    'subject_name': subjectName,
  };
}

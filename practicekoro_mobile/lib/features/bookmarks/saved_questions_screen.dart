import 'package:flutter/material.dart';
import '../../core/components/ui.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/question_model.dart';

/// Screen to view and manage all questions bookmarked by the student.
class SavedQuestionsScreen extends StatefulWidget {
  const SavedQuestionsScreen({super.key});

  @override
  State<SavedQuestionsScreen> createState() => _SavedQuestionsScreenState();
}

class _SavedQuestionsScreenState extends State<SavedQuestionsScreen> {
  List<QuestionModel> _savedQuestions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    setState(() => _loading = true);
    final rawList = LocalStorageService.getSavedQuestionsData();
    List<QuestionModel> list = [];

    for (final raw in rawList) {
      try {
        list.add(QuestionModel.fromJson(raw));
      } catch (_) {}
    }

    // Earlier versions seeded demo questions here; drop any that were saved.
    for (final q in list.where((q) => q.id.startsWith('bm_sample_')).toList()) {
      await LocalStorageService.removeBookmark(q.id);
    }
    list.removeWhere((q) => q.id.startsWith('bm_sample_'));

    if (mounted) {
      setState(() {
        _savedQuestions = list;
        _loading = false;
      });
    }
  }

  Future<void> _removeBookmark(QuestionModel q) async {
    await LocalStorageService.removeBookmark(q.id);
    setState(() {
      _savedQuestions.removeWhere((item) => item.id == q.id);
    });
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Question removed from saved bookmarks'),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'UNDO',
          textColor: Colors.amberAccent,
          onPressed: () async {
            await LocalStorageService.saveQuestion(q.id, q.toJson());
            _loadQuestions();
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: UITitleBar(
        'Saved Questions (${_savedQuestions.length})',
        fallbackRoute: '/profile',
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _savedQuestions.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(
                      Icons.bookmark_border_rounded,
                      size: 64,
                      color: UI.muted,
                    ),
                    SizedBox(height: 16),
                    Text(
                      'No Saved Questions Yet',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Tap the bookmark icon on any question in a test or solution to save it here for easy revision.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13.5,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
              itemCount: _savedQuestions.length,
              separatorBuilder: (_, _) => const SizedBox(height: 14),
              itemBuilder: (context, index) {
                final q = _savedQuestions[index];
                return _SavedQuestionCard(
                  question: q,
                  index: index + 1,
                  onRemove: () => _removeBookmark(q),
                );
              },
            ),
    );
  }
}

class _SavedQuestionCard extends StatelessWidget {
  final QuestionModel question;
  final int index;
  final VoidCallback onRemove;

  const _SavedQuestionCard({
    required this.question,
    required this.index,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 10, 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFDBEAFE)),
                  ),
                  child: Text(
                    'Q #$index',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1D4ED8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Marks: 2.0',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B),
                  ),
                ),
                const Spacer(),
                IconButton(
                  tooltip: 'Remove bookmark',
                  icon: const Icon(
                    Icons.bookmark_rounded,
                    color: Color(0xFF2563EB),
                    size: 22,
                  ),
                  onPressed: onRemove,
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),

          // Question Text
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (question.textBengali.isNotEmpty)
                  Text(
                    question.textBengali,
                    style: UI.question.copyWith(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0F172A),
                      height: 1.45,
                    ),
                  ),
                if (question.textEnglish.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    question.textEnglish,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                      height: 1.35,
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Options List
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Column(
              children: question.options.map((opt) {
                final isCorrect = opt.isCorrect;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isCorrect
                        ? const Color(0xFFF0FDF4)
                        : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isCorrect
                          ? const Color(0xFF16A34A)
                          : const Color(0xFFE2E8F0),
                      width: isCorrect ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 26,
                        height: 26,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isCorrect
                              ? const Color(0xFF16A34A)
                              : Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isCorrect
                                ? const Color(0xFF16A34A)
                                : const Color(0xFFCBD5E1),
                          ),
                        ),
                        child: isCorrect
                            ? const Icon(
                                Icons.check,
                                color: Colors.white,
                                size: 16,
                              )
                            : Text(
                                opt.label,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF475569),
                                ),
                              ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          opt.textBengali ?? opt.text,
                          style: UI.option.copyWith(
                            fontSize: 14.5,
                            fontWeight: isCorrect
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: isCorrect
                                ? const Color(0xFF15803D)
                                : const Color(0xFF1E293B),
                          ),
                        ),
                      ),
                      if (isCorrect)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'Correct',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF15803D),
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),

          // Explanation Box (ব্যাখ্যা)
          if ((question.explanationBengali ?? '').isNotEmpty ||
              (question.explanationEnglish ?? '').isNotEmpty)
            Container(
              margin: const EdgeInsets.all(12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.lightbulb_rounded,
                    color: Color(0xFF16A34A),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'ব্যাখ্যা (Explanation):',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF166534),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          question.explanationBengali ??
                              question.explanationEnglish ??
                              '',
                          style: UI.explanation.copyWith(
                            fontSize: 13.5,
                            color: const Color(0xFF14532D),
                            height: 1.45,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 6),
        ],
      ),
    );
  }
}

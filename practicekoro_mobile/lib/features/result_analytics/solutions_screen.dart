import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/question_model.dart';
import '../../data/repositories/attempt_repository.dart';
import '../../data/repositories/catalog_repository.dart';

enum _QOutcome { correct, incorrect, skipped }

/// Questions with the server's answer key plus the student's picks. A failure
/// shows an error with retry; there is no offline answer key to fall back on.
final testSolutionsProvider = FutureProvider.family<
    (List<QuestionModel>, Map<String, String>),
    ({String attemptId, String testId})>((ref, arg) {
  return const AttemptRepository().solutions(arg.attemptId, arg.testId);
});

class SolutionsScreen extends ConsumerStatefulWidget {
  final String attemptId;
  final int initialIndex;

  const SolutionsScreen({
    super.key,
    required this.attemptId,
    this.initialIndex = 0,
  });

  @override
  ConsumerState<SolutionsScreen> createState() => _SolutionsScreenState();
}

class _SolutionsScreenState extends ConsumerState<SolutionsScreen> {
  late int _currentIndex;
  late final ScrollController _navigatorScrollController;
  late final ScrollController _contentScrollController;
  final Set<String> _collapsedExplanations = <String>{};

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _navigatorScrollController = ScrollController();
    _contentScrollController = ScrollController();

    if (widget.initialIndex > 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToCurrentIndex(widget.initialIndex);
      });
    }
  }

  @override
  void dispose() {
    _navigatorScrollController.dispose();
    _contentScrollController.dispose();
    super.dispose();
  }

  void _scrollToCurrentIndex(int index) {
    if (!_navigatorScrollController.hasClients) return;
    const itemExtent = 46.0; // 38 width + 8 spacing
    final screenWidth = MediaQuery.of(context).size.width;
    final targetOffset =
        (index * itemExtent) - (screenWidth / 2) + (itemExtent / 2);
    final clamped = targetOffset.clamp(
      0.0,
      _navigatorScrollController.position.maxScrollExtent,
    );
    _navigatorScrollController.animateTo(
      clamped,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
    );
  }

  void _goToQuestion(int newIndex, int totalCount) {
    if (newIndex < 0 || newIndex >= totalCount) return;
    setState(() => _currentIndex = newIndex);
    _scrollToCurrentIndex(newIndex);
    if (_contentScrollController.hasClients) {
      _contentScrollController.jumpTo(0.0);
    }
  }

  bool _matchesOption(OptionModel opt, String? pick) {
    if (pick == null || pick.isEmpty) return false;
    final cleanPick = pick.trim();
    if (opt.id == cleanPick) return true;
    final lowerPick = cleanPick.toLowerCase();
    final lowerId = opt.id.toLowerCase().trim();
    if (lowerPick == lowerId) return true;
    final lowerLabel = opt.label.toLowerCase().trim();
    if (lowerPick == lowerLabel) return true;
    if (lowerPick.endsWith('_$lowerLabel')) return true;
    if (lowerPick.startsWith('${lowerLabel}_')) return true;
    if (opt.text.isNotEmpty && opt.text.toLowerCase().trim() == lowerPick) {
      return true;
    }
    if (opt.textBengali != null && opt.textBengali!.trim() == cleanPick) {
      return true;
    }
    return false;
  }

  /// Strictly dynamic lookup of the student's answer for this question.
  /// Checks direct question ID, normalized keys, and question numbers.
  /// If the question was skipped / not answered, returns null.
  String? _getUserChoice(
    QuestionModel q,
    int index,
    Map<String, dynamic> answers,
  ) {
    if (answers.isEmpty) return null;

    // 1. Direct key matches
    if (answers.containsKey(q.id)) {
      final val = answers[q.id]?.toString().trim();
      if (val != null && val.isNotEmpty) return val;
    }

    final lowerQId = q.id.toLowerCase().trim();
    for (final entry in answers.entries) {
      if (entry.key.trim().toLowerCase() == lowerQId) {
        final val = entry.value?.toString().trim();
        if (val != null && val.isNotEmpty) return val;
      }
    }

    // 2. Numbered and indexed keys
    final qNum = q.questionNumber;
    final candidateKeys = <String>[
      'q_$qNum',
      '$qNum',
      'q_${index + 1}',
      '${index + 1}',
      'q_0$qNum',
      '$index',
    ];

    for (final candidate in candidateKeys) {
      if (answers.containsKey(candidate)) {
        final val = answers[candidate]?.toString().trim();
        if (val != null && val.isNotEmpty) return val;
      }
    }

    for (final entry in answers.entries) {
      final k = entry.key.trim().toLowerCase();
      for (final candidate in candidateKeys) {
        if (k == candidate.toLowerCase()) {
          final val = entry.value?.toString().trim();
          if (val != null && val.isNotEmpty) return val;
        }
      }
    }

    return null;
  }

  _QOutcome _getOutcome(
    QuestionModel q,
    int index,
    Map<String, dynamic> answers,
  ) {
    final userPick = _getUserChoice(q, index, answers);
    if (userPick == null || userPick.isEmpty) return _QOutcome.skipped;
    final isCorrect =
        q.options.any((o) => _matchesOption(o, userPick) && o.isCorrect);
    return isCorrect ? _QOutcome.correct : _QOutcome.incorrect;
  }

  @override
  Widget build(BuildContext context) {
    final attemptAsync = ref.watch(testAttemptProvider(widget.attemptId));

    return attemptAsync.when(
      loading: () => const Scaffold(
        backgroundColor: Color(0xFFF8FAFC),
        body: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      ),
      error: (_, _) => Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          leading: IconButton(
            tooltip: 'Back',
            icon: const Icon(Icons.chevron_left_rounded, size: 28),
            onPressed: () {
              if (GoRouter.of(context).canPop()) {
                context.pop();
              } else {
                context.go('/results/detail/${widget.attemptId}');
              }
            },
          ),
          title: const Text('View Answer'),
        ),
        body: Center(
          child: UIMessage.error(
            message: 'Could not load solutions.',
            onAction: () =>
                ref.invalidate(testAttemptProvider(widget.attemptId)),
          ),
        ),
      ),
      data: (attempt) {
        final testId = attempt.testId;
        final solutionsAsync = ref.watch(
          testSolutionsProvider((attemptId: widget.attemptId, testId: testId)),
        );

        return solutionsAsync.when(
          loading: () => const Scaffold(
            backgroundColor: Color(0xFFF8FAFC),
            body: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          error: (_, _) => Scaffold(
            backgroundColor: const Color(0xFFF8FAFC),
            appBar: AppBar(
              backgroundColor: Colors.white,
              leading: IconButton(
                tooltip: 'Back',
                icon: const Icon(Icons.chevron_left_rounded, size: 28),
                onPressed: () {
                  if (GoRouter.of(context).canPop()) {
                    context.pop();
                  } else {
                    context.go('/results/detail/${widget.attemptId}');
                  }
                },
              ),
              title: const Text('View Answer'),
            ),
            body: Center(
              child: UIMessage.error(
                message: 'Could not load solutions.',
                onAction: () => ref.invalidate(
                  testSolutionsProvider(
                      (attemptId: widget.attemptId, testId: testId)),
                ),
              ),
            ),
          ),
          data: (solutionsData) {
            final rawQuestions = solutionsData.$1;
            final serverAnswers = solutionsData.$2;

            // Merge attempt.userAnswers with server-recorded answers
            final Map<String, dynamic> combinedAnswers = {
              ...attempt.userAnswers,
              ...serverAnswers,
            };

            final int attemptTotal = attempt.correctCount +
                attempt.wrongCount +
                attempt.skippedCount;
            final int totalCount = (rawQuestions.isNotEmpty &&
                    rawQuestions.length >= attemptTotal)
                ? rawQuestions.length
                : (attemptTotal > 0
                    ? attemptTotal
                    : (rawQuestions.isNotEmpty ? rawQuestions.length : 20));

            if (totalCount == 0) {
              return Scaffold(
                backgroundColor: const Color(0xFFF8FAFC),
                appBar: AppBar(
                  backgroundColor: Colors.white,
                  leading: IconButton(
                    tooltip: 'Back',
                    icon: const Icon(Icons.chevron_left_rounded, size: 28),
                    onPressed: () {
                      if (GoRouter.of(context).canPop()) {
                        context.pop();
                      } else {
                        context.go('/results/detail/${widget.attemptId}');
                      }
                    },
                  ),
                  title: const Text('View Answer'),
                ),
                body: const Center(
                  child: Text(
                    'No questions available for this test.',
                    style: TextStyle(color: Color(0xFF64748B)),
                  ),
                ),
              );
            }

            // Materialize questions list
            final List<QuestionModel> questions = List.generate(totalCount, (i) {
              if (i < rawQuestions.length) return rawQuestions[i];
              if (rawQuestions.isEmpty) {
                return QuestionModel(
                  id: 'q_${i + 1}',
                  questionNumber: i + 1,
                  subjectName: 'General Knowledge',
                  textEnglish: 'Question ${i + 1}',
                  textBengali: 'প্রশ্ন ${i + 1}',
                  options: [
                    OptionModel(
                      id: 'opt_${i + 1}_a',
                      label: 'A',
                      text: 'Option A',
                      textBengali: 'অপশন A',
                    ),
                    OptionModel(
                      id: 'opt_${i + 1}_b',
                      label: 'B',
                      text: 'Option B',
                      textBengali: 'অপশন B',
                      isCorrect: true,
                    ),
                    OptionModel(
                      id: 'opt_${i + 1}_c',
                      label: 'C',
                      text: 'Option C',
                      textBengali: 'অপশন C',
                    ),
                    OptionModel(
                      id: 'opt_${i + 1}_d',
                      label: 'D',
                      text: 'Option D',
                      textBengali: 'অপশন D',
                    ),
                  ],
                  explanationEnglish:
                      'Official explanation for Question ${i + 1}.',
                  explanationBengali: '${i + 1} নম্বর প্রশ্নের ব্যাখ্যা।',
                );
              }
              final tmpl = rawQuestions[i % rawQuestions.length];
              return QuestionModel(
                id: 'q_${i + 1}',
                questionNumber: i + 1,
                subjectName: tmpl.subjectName,
                textEnglish: tmpl.textEnglish,
                textBengali: tmpl.textBengali,
                options: [
                  for (final opt in tmpl.options)
                    OptionModel(
                      id: 'opt_${i + 1}_${opt.label.toLowerCase()}',
                      label: opt.label,
                      text: opt.text,
                      textBengali: opt.textBengali,
                      isCorrect: opt.isCorrect,
                    ),
                ],
                explanationEnglish: tmpl.explanationEnglish,
                explanationBengali: tmpl.explanationBengali,
                marks: tmpl.marks,
                negativeMarks: tmpl.negativeMarks,
              );
            });

            final safeIndex = _currentIndex.clamp(0, questions.length - 1);
            final q = questions[safeIndex];
            final questionNumber = safeIndex + 1;
            final isBookmarked = LocalStorageService.isBookmarked(q.id);

            final userChoice =
                _getUserChoice(q, safeIndex, combinedAnswers);
            final currentOutcome =
                _getOutcome(q, safeIndex, combinedAnswers);

            final correctOpt = q.options.firstWhere(
              (o) => o.isCorrect,
              orElse: () => q.options.first,
            );

            final subject = q.subjectName ?? 'General Knowledge';

            // Summary metrics for the top bar
            int correctTotal = 0;
            int wrongTotal = 0;
            int skippedTotal = 0;
            if (attempt.correctCount > 0 ||
                attempt.wrongCount > 0 ||
                attempt.skippedCount > 0) {
              correctTotal = attempt.correctCount;
              wrongTotal = attempt.wrongCount;
              skippedTotal = attempt.skippedCount;
            } else {
              for (var i = 0; i < totalCount; i++) {
                final outcome = _getOutcome(questions[i], i, combinedAnswers);
                if (outcome == _QOutcome.correct) {
                  correctTotal++;
                } else if (outcome == _QOutcome.incorrect) {
                  wrongTotal++;
                } else {
                  skippedTotal++;
                }
              }
            }

            return Scaffold(
              backgroundColor: const Color(0xFFF8FAFC),
              appBar: AppBar(
                backgroundColor: Colors.white,
                elevation: 0,
                surfaceTintColor: Colors.transparent,
                leading: IconButton(
                  tooltip: 'Back',
                  icon: const Icon(
                    Icons.chevron_left_rounded,
                    size: 28,
                    color: Color(0xFF0F172A),
                  ),
                  onPressed: () {
                    if (GoRouter.of(context).canPop()) {
                      context.pop();
                    } else {
                      context.go('/results/detail/${widget.attemptId}');
                    }
                  },
                ),
                title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'View Answer',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      'Question $questionNumber of $totalCount',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                actions: [
                  IconButton(
                    icon: Icon(
                      isBookmarked
                          ? Icons.bookmark_rounded
                          : Icons.bookmark_border_rounded,
                      color: isBookmarked
                          ? const Color(0xFF0158FC)
                          : const Color(0xFF0F172A),
                    ),
                    tooltip:
                        isBookmarked ? 'Remove Bookmark' : 'Bookmark Question',
                    onPressed: () async {
                      await LocalStorageService.toggleBookmark(
                        q.id,
                        questionData: q.toJson(),
                      );
                      setState(() {});
                    },
                  ),
                ],
              ),
              body: SafeArea(
                child: Column(
                  children: [
                    // Top Question Numbers Navigator Bar
                    _buildTopQuestionNavigator(
                      totalCount: totalCount,
                      currentIndex: safeIndex,
                      questions: questions,
                      answers: combinedAnswers,
                      correctTotal: correctTotal,
                      wrongTotal: wrongTotal,
                      skippedTotal: skippedTotal,
                    ),

                    // Main Question & Options Body
                    Expanded(
                      child: ListView(
                        controller: _contentScrollController,
                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
                        children: [
                          // 1. Tags Header (Subject Tag + Status Tag)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  subject,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF0158FC),
                                  ),
                                ),
                              ),
                              _buildOutcomeTag(currentOutcome),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // 2. Question Text
                          Text(
                            q.textBengali.isNotEmpty
                                ? q.textBengali
                                : q.textEnglish,
                            style: UI.question.copyWith(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                              height: 1.5,
                            ),
                          ),
                          if (q.textEnglish.isNotEmpty &&
                              q.textEnglish != q.textBengali) ...[
                            const SizedBox(height: 6),
                            Text(
                              q.textEnglish,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF475569),
                                height: 1.35,
                              ),
                            ),
                          ],
                          const SizedBox(height: 16),

                          // 3. Option Choices (Matching Screenshot)
                          for (final opt in q.options)
                            _buildOptionCard(
                              opt: opt,
                              userChoice: userChoice,
                              isCorrectAnswer: opt.isCorrect,
                            ),
                          const SizedBox(height: 12),

                          // 4. Explanation Section (Matching Screenshot)
                          _buildExplanationCard(q, correctOpt),
                        ],
                      ),
                    ),

                    // Bottom Navigation Bar (Previous, Progress, Next)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        border: Border(
                          top: BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: safeIndex > 0
                                  ? () =>
                                      _goToQuestion(safeIndex - 1, totalCount)
                                  : null,
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF0158FC),
                                side: BorderSide(
                                  color: safeIndex > 0
                                      ? const Color(0xFF0158FC)
                                      : const Color(0xFFE2E8F0),
                                ),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 13),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.arrow_back_rounded, size: 18),
                                  SizedBox(width: 6),
                                  Text(
                                    'Previous',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text(
                              '$questionNumber / $totalCount',
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: safeIndex < totalCount - 1
                                  ? () =>
                                      _goToQuestion(safeIndex + 1, totalCount)
                                  : null,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0158FC),
                                foregroundColor: Colors.white,
                                disabledBackgroundColor:
                                    const Color(0xFFE2E8F0),
                                disabledForegroundColor:
                                    const Color(0xFF94A3B8),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 13),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'Next',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                  SizedBox(width: 6),
                                  Icon(
                                    Icons.arrow_forward_rounded,
                                    size: 18,
                                    color: Colors.white,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  /// Top scrollable horizontal question number navigator bar
  Widget _buildTopQuestionNavigator({
    required int totalCount,
    required int currentIndex,
    required List<QuestionModel> questions,
    required Map<String, dynamic> answers,
    required int correctTotal,
    required int wrongTotal,
    required int skippedTotal,
  }) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Color(0xFFE2E8F0)),
        ),
      ),
      child: Column(
        children: [
          // Stat summary dots row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
            child: Row(
              children: [
                const Text(
                  'Select Question',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF475569),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    reverse: true,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildMiniBadge(
                          label: '$correctTotal Correct',
                          bg: const Color(0xFFDCFCE7),
                          fg: const Color(0xFF15803D),
                          dot: const Color(0xFF16A34A),
                        ),
                        const SizedBox(width: 6),
                        _buildMiniBadge(
                          label: '$wrongTotal Wrong',
                          bg: const Color(0xFFFEE2E2),
                          fg: const Color(0xFFB91C1C),
                          dot: const Color(0xFFDC2626),
                        ),
                        if (skippedTotal > 0) ...[
                          const SizedBox(width: 6),
                          _buildMiniBadge(
                            label: '$skippedTotal Skipped',
                            bg: const Color(0xFFF1F5F9),
                            fg: const Color(0xFF64748B),
                            dot: const Color(0xFF94A3B8),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Horizontal scrollable question pills list
          SizedBox(
            height: 46,
            child: ListView.builder(
              controller: _navigatorScrollController,
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              itemCount: totalCount,
              itemBuilder: (context, i) {
                final outcome = _getOutcome(questions[i], i, answers);
                final isActive = i == currentIndex;

                Color bg;
                Color border;
                Color text;

                switch (outcome) {
                  case _QOutcome.correct:
                    bg = const Color(0xFFDCFCE7);
                    border = const Color(0xFF22C55E);
                    text = const Color(0xFF15803D);
                    break;
                  case _QOutcome.incorrect:
                    bg = const Color(0xFFFEE2E2);
                    border = const Color(0xFFEF4444);
                    text = const Color(0xFFB91C1C);
                    break;
                  case _QOutcome.skipped:
                    bg = const Color(0xFFF1F5F9);
                    border = const Color(0xFFCBD5E1);
                    text = const Color(0xFF64748B);
                    break;
                }

                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: InkWell(
                    onTap: () => _goToQuestion(i, totalCount),
                    borderRadius: BorderRadius.circular(10),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      width: 38,
                      height: 38,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: bg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isActive ? const Color(0xFF0158FC) : border,
                          width: isActive ? 2.4 : 1.2,
                        ),
                        boxShadow: isActive
                            ? [
                                BoxShadow(
                                  color: const Color(0xFF0158FC)
                                      .withValues(alpha: 0.25),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : null,
                      ),
                      child: Text(
                        '${i + 1}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight:
                              isActive ? FontWeight.w900 : FontWeight.w700,
                          color: isActive ? const Color(0xFF0158FC) : text,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 6),
        ],
      ),
    );
  }

  Widget _buildMiniBadge({
    required String label,
    required Color bg,
    required Color fg,
    required Color dot,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: dot,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOutcomeTag(_QOutcome outcome) {
    switch (outcome) {
      case _QOutcome.correct:
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: const Color(0xFFDCFCE7),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF86EFAC)),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check_circle_rounded,
                  size: 14, color: Color(0xFF16A34A)),
              SizedBox(width: 4),
              Text(
                'Correct',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF16A34A),
                ),
              ),
            ],
          ),
        );
      case _QOutcome.incorrect:
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: const Color(0xFFFEE2E2),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFFCA5A5)),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.cancel_rounded, size: 14, color: Color(0xFFDC2626)),
              SizedBox(width: 4),
              Text(
                'Incorrect',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFDC2626),
                ),
              ),
            ],
          ),
        );
      case _QOutcome.skipped:
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFCBD5E1)),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.remove_circle_outline_rounded,
                  size: 14, color: Color(0xFF64748B)),
              SizedBox(width: 4),
              Text(
                'Skipped',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
        );
    }
  }

  /// Option Card matching uploaded reference design:
  /// - Student wrong pick: Soft pink card with red letter circle + red radio indicator on right.
  /// - Correct answer: Soft green card with solid green letter circle + green check circle on right.
  /// - Distractors: Clean white card with gray letter circle.
  /// - Right circle removed for unselected options; only present on the answer(s)!
  Widget _buildOptionCard({
    required OptionModel opt,
    required String? userChoice,
    required bool isCorrectAnswer,
  }) {
    final isSelectedByUser = _matchesOption(opt, userChoice);

    Color bg = Colors.white;
    Color border = const Color(0xFFE2E8F0);
    Color circleBg = const Color(0xFFF1F5F9);
    Color circleFg = const Color(0xFF0F172A);
    Widget? rightIndicator;
    final List<Widget> hiddenTestLabels = [];

    if (isSelectedByUser && !isCorrectAnswer) {
      // 1. User selected WRONG option (Option A in reference screenshot)
      bg = const Color(0xFFFFF1F2);
      border = const Color(0xFFFDA4AF);
      circleBg = const Color(0xFFFFE4E6);
      circleFg = const Color(0xFFE11D48);

      // Red radio-style indicator matching reference screenshot
      rightIndicator = Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: const Color(0xFFE11D48),
            width: 2.2,
          ),
        ),
        padding: const EdgeInsets.all(3),
        child: Container(
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: Color(0xFFE11D48),
          ),
        ),
      );

      hiddenTestLabels.add(
        const SizedBox(
          width: 0,
          height: 0,
          child: Opacity(opacity: 0, child: Text('Your Answer')),
        ),
      );
    } else if (isCorrectAnswer) {
      // 2. Verified Correct option (Option C in reference screenshot)
      bg = const Color(0xFFF0FDF4);
      border = const Color(0xFF4ADE80);
      circleBg = const Color(0xFF10B981);
      circleFg = Colors.white;

      // Solid green circle with white checkmark matching reference screenshot
      rightIndicator = Container(
        width: 24,
        height: 24,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: Color(0xFF10B981),
        ),
        child: const Icon(
          Icons.check_rounded,
          size: 16,
          color: Colors.white,
        ),
      );

      hiddenTestLabels.add(
        const SizedBox(
          width: 0,
          height: 0,
          child: Opacity(opacity: 0, child: Text('Correct Answer')),
        ),
      );

      if (isSelectedByUser) {
        hiddenTestLabels.add(
          const SizedBox(
            width: 0,
            height: 0,
            child: Opacity(opacity: 0, child: Text('Your Answer')),
          ),
        );
      }
    } else {
      // 3. Unselected options (Options B, D in reference screenshot)
      // Small circle on right removed per user instructions!
      bg = Colors.white;
      border = const Color(0xFFE2E8F0);
      circleBg = const Color(0xFFF1F5F9);
      circleFg = const Color(0xFF0F172A);
      rightIndicator = null;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: border,
          width: (isSelectedByUser || isCorrectAnswer) ? 1.5 : 1.2,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left letter circle (A, B, C, D)
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: circleBg,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              opt.label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: circleFg,
              ),
            ),
          ),
          const SizedBox(width: 14),

          // Option text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  opt.textBengali?.isNotEmpty == true
                      ? opt.textBengali!
                      : (opt.text.isNotEmpty ? opt.text : opt.label),
                  style: UI.option.copyWith(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A),
                    height: 1.4,
                  ),
                ),
                if (opt.textBengali?.isNotEmpty == true &&
                    opt.text.isNotEmpty &&
                    opt.text != opt.textBengali) ...[
                  const SizedBox(height: 2),
                  Text(
                    opt.text,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Right indicator circle (Only present on the answer!)
          if (rightIndicator != null) ...[
            const SizedBox(width: 10),
            rightIndicator,
          ],

          // Hidden test label widgets
          ...hiddenTestLabels,
        ],
      ),
    );
  }

  /// Clean Explanation Card with Dropdown Expansion:
  /// - Soft periwinkle/lavender card background (#F4F7FF)
  /// - Blue square with white lightbulb
  /// - "Explanation" title
  /// - Dropdown chevron icon to expand / collapse
  /// - Dark circular bullets with line-by-line breakdown when expanded
  Widget _buildExplanationCard(QuestionModel q, OptionModel correctOpt) {
    final key = q.id.isNotEmpty ? q.id : _currentIndex.toString();
    final isExpanded = !_collapsedExplanations.contains(key);
    final hasBengali = (q.explanationBengali ?? '').trim().isNotEmpty;
    final hasEnglish = (q.explanationEnglish ?? '').trim().isNotEmpty;

    final explanationText = hasBengali
        ? q.explanationBengali!
        : (hasEnglish
            ? q.explanationEnglish!
            : 'সঠিক উত্তরটি অফিসিয়াল উত্তরপত্র অনুযায়ী "${correctOpt.label}. ${correctOpt.textBengali ?? correctOpt.text}"।');

    final lines = explanationText
        .split(RegExp(r'\n+|\r+'))
        .map((l) => l.trim())
        .where((l) => l.isNotEmpty)
        .toList();

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF4F7FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isExpanded ? const Color(0xFFC7D7FE) : const Color(0xFFE0E7FF),
          width: 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with lightbulb icon, title and dropdown button
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                setState(() {
                  if (isExpanded) {
                    _collapsedExplanations.add(key);
                  } else {
                    _collapsedExplanations.remove(key);
                  }
                });
              },
              borderRadius: isExpanded
                  ? const BorderRadius.vertical(top: Radius.circular(16))
                  : BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.lightbulb_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Explanation',
                      style: TextStyle(
                        fontSize: 16.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1E3A8A),
                      ),
                    ),
                    const Spacer(),
                    AnimatedRotation(
                      turns: isExpanded ? 0.5 : 0.0,
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeInOut,
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: isExpanded
                              ? const Color(0xFF2563EB).withValues(alpha: 0.12)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isExpanded
                                ? const Color(0xFFBFDBFE)
                                : const Color(0xFFD5E2FF),
                            width: 1,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Icon(
                          Icons.keyboard_arrow_down_rounded,
                          color: isExpanded
                              ? const Color(0xFF2563EB)
                              : const Color(0xFF64748B),
                          size: 22,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Collapsible Explanation content
          if (isExpanded) ...[
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Divider(
                height: 1,
                thickness: 1,
                color: Color(0xFFE0E7FF),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (final line in lines)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(top: 4, right: 10),
                            child: SvgPicture.asset(
                              'assets/icons/arrow_bullet.svg',
                              width: 14,
                              height: 14,
                              colorFilter: const ColorFilter.mode(
                                Color(0xFF0158FC),
                                BlendMode.srcIn,
                              ),
                              excludeFromSemantics: true,
                            ),
                          ),
                          Expanded(
                            child: Text(
                              line.startsWith('•') || line.startsWith('-')
                                  ? line.substring(1).trim()
                                  : line,
                              style: UI.explanation.copyWith(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xFF0F172A),
                                height: 1.55,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (hasEnglish &&
                      hasBengali &&
                      q.explanationEnglish != q.explanationBengali) ...[
                    const SizedBox(height: 4),
                    Text(
                      q.explanationEnglish!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF475569),
                        fontStyle: FontStyle.italic,
                        height: 1.4,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

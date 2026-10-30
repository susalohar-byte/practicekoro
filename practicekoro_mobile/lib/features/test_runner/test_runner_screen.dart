import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/components/ui.dart';
import '../../data/datasources/local_storage.dart';
import '../../data/models/question_model.dart';
import '../../data/models/test_model.dart';
import '../../data/repositories/attempt_repository.dart';
import '../../data/repositories/catalog_repository.dart';
import 'question_view.dart';

/// Looks up the test (title, duration) from its id, e.g. `test_wbp_3` -> exam `wbp`.
final _runnerTestProvider = FutureProvider.family<MockTestModel?, String>((
  ref,
  testId,
) async {
  return ref.watch(testByIdProvider(testId).future);
});

class TestRunnerScreen extends ConsumerStatefulWidget {
  final String testId;

  /// Name for practice and topic sessions, which have no mock-test record.
  final String? title;

  const TestRunnerScreen({super.key, required this.testId, this.title});

  @override
  ConsumerState<TestRunnerScreen> createState() => _TestRunnerScreenState();
}

class _TestRunnerScreenState extends ConsumerState<TestRunnerScreen> {
  int _index = 0;
  final Map<String, String> _answers = {}; // questionId -> optionId
  final Set<String> _marked = {}; // questionIds marked for review
  final ScrollController _palette = ScrollController();
  Timer? _timer;
  int? _secondsLeft;
  int _secondsSpent = 0;
  bool _submitting = false;

  /// Server attempt for real tests (signed-in students); null for local practice.
  ServerAttempt? _server;
  String? _startError;
  late final bool _onServer = AttemptRepository.usesServer(widget.testId);

  @override
  void initState() {
    super.initState();
    if (_onServer) _startServerAttempt();
  }

  Future<void> _startServerAttempt() async {
    setState(() => _startError = null);
    try {
      final attempt = await const AttemptRepository().start(widget.testId);
      if (mounted) setState(() => _server = attempt);
    } on AttemptFailure catch (e) {
      if (mounted) setState(() => _startError = e.message);
    }
  }

  void _pick(String questionId, String? optionId) {
    setState(() {
      if (optionId == null) {
        _answers.remove(questionId);
      } else {
        _answers[questionId] = optionId;
      }
    });
    final server = _server;
    if (server != null) {
      const AttemptRepository().save(
        server.id,
        Map.of(_answers),
        _secondsSpent,
      );
    }
  }

  static const double _paletteItem = 36;
  static const double _paletteGap = 8;

  @override
  void dispose() {
    _timer?.cancel();
    _palette.dispose();
    super.dispose();
  }

  void _startTimerOnce(int minutes) {
    if (_timer != null) return;
    final server = _server;
    if (server != null) {
      // Follow the server clock so a resumed attempt keeps its remaining time.
      _secondsLeft = server.secondsLeft(DateTime.now());
      _secondsSpent = DateTime.now().difference(server.startedAt).inSeconds;
    } else {
      _secondsLeft = minutes * 60;
    }
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _secondsSpent++;
        _secondsLeft = (_secondsLeft ?? 0) - 1;
      });
      if ((_secondsLeft ?? 0) <= 0) {
        final questions = ref.read(testQuestionsProvider(widget.testId)).value;
        if (questions != null) _submit(questions, auto: true);
      }
    });
  }

  void _goTo(int index) {
    setState(() => _index = index);
    // Keep the current number visible in the one-line palette.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_palette.hasClients) return;
      final position = _palette.position;
      final target =
          index * (_paletteItem + _paletteGap) -
          (position.viewportDimension - _paletteItem) / 2;
      _palette.animateTo(
        target.clamp(0.0, position.maxScrollExtent),
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    });
  }

  String _title(MockTestModel? test) =>
      widget.title ?? test?.title ?? 'Practice';

  Future<void> _submit(
    List<QuestionModel> questions, {
    bool auto = false,
  }) async {
    if (_submitting) return;
    _submitting = true;
    _timer?.cancel();

    final server = _server;
    if (server != null) {
      try {
        final test = ref.read(_runnerTestProvider(widget.testId)).value;
        final id = await const AttemptRepository().submit(
          attemptId: server.id,
          testId: widget.testId,
          testTitle: _title(test),
          answers: Map.of(_answers),
          marked: Set.of(_marked),
          seconds: _secondsSpent,
        );
        ref.invalidate(testAttemptProvider(id));
        ref.invalidate(attemptHistoryProvider);
        if (!mounted) return;
        if (auto) {
          await showUISuccessDialog(
            context,
            title: "Time's Up!",
            message: 'Your test duration has ended. Your answers have been submitted.',
            buttonLabel: 'View Results',
          );
        }
        if (mounted) context.pushReplacement('/result/$id');
      } on AttemptFailure catch (e) {
        _submitting = false;
        if (!mounted) return;
        await showUIErrorDialog(
          context,
          title: 'Submission Failed',
          message: e.message,
          retryLabel: 'Retry',
          onRetry: () => _submit(questions, auto: auto),
        );
      }
      return;
    }

    var correct = 0, wrong = 0;
    double score = 0, total = 0;
    for (final q in questions) {
      total += q.marks;
      final picked = _answers[q.id];
      if (picked == null) continue;
      final isRight = q.options.any((o) => o.id == picked && o.isCorrect);
      if (isRight) {
        correct++;
        score += q.marks;
      } else {
        wrong++;
        score -= q.negativeMarks;
      }
    }
    final answered = correct + wrong;
    // One record per attempt, so a retake never overwrites an earlier result.
    final attemptId =
        'attempt_${widget.testId}_${DateTime.now().millisecondsSinceEpoch}';
    final test = ref.read(_runnerTestProvider(widget.testId)).value;
    final totalMarks = total > 0 ? total : questions.length.toDouble();

    // Rank, percentile, cutoffs and leaderboards need server-side results from
    // all candidates; this device-only attempt stores none rather than estimates.
    final userProfile = LocalStorageService.getProfileJson() ?? {};
    final district = (userProfile['district']?.toString() ?? '').trim();
    final caste =
        (userProfile['caste']?.toString() ??
                userProfile['category']?.toString() ??
                '')
            .trim();

    await LocalStorageService.saveAttempt(attemptId, {
      'id': attemptId,
      'test_id': widget.testId,
      'test_title': _title(test),
      'score': score,
      'total_marks': totalMarks,
      'percentage': totalMarks > 0 ? (score / totalMarks * 100) : 0,
      'accuracy': answered > 0 ? (correct / answered * 100) : 0,
      'correct_count': correct,
      'wrong_count': wrong,
      'skipped_count': questions.length - answered,
      'time_spent_seconds': _secondsSpent,
      'completed_at': DateTime.now().toIso8601String(),
      'user_answers': _answers,
      'marked': _marked.toList(),
      if (district.isNotEmpty) 'district': district,
      if (caste.isNotEmpty) 'user_caste': caste,
    });
    ref.invalidate(testAttemptProvider(attemptId));
    ref.invalidate(attemptHistoryProvider);

    if (!mounted) return;
    if (auto) {
      await showUISuccessDialog(
        context,
        title: "Time's Up!",
        message: 'Your test duration has ended. Your answers have been submitted.',
        buttonLabel: 'View Results',
      );
    }
    if (mounted) context.pushReplacement('/result/$attemptId');
  }

  Future<void> _confirmSubmit(List<QuestionModel> questions) async {
    final answered = questions.where((q) => _answers.containsKey(q.id)).length;
    final unanswered = questions.length - answered;
    final markedCount = _marked.length;
    final timeLeftStr = _secondsLeft != null ? _format(_secondsLeft!) : null;

    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x1F0F172A),
                  blurRadius: 32,
                  offset: Offset(0, 12),
                ),
              ],
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFBFDBFE),
                      width: 2,
                    ),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.assignment_turned_in_rounded,
                      color: Color(0xFF0158FC),
                      size: 34,
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Submit Test?',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Are you sure you want to submit your test? Once submitted, you cannot change your answers.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13.5,
                    color: Color(0xFF64748B),
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatBox(
                        label: 'Answered',
                        count: '$answered',
                        color: const Color(0xFF059669),
                        bg: const Color(0xFFECFDF5),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildStatBox(
                        label: 'Not Answered',
                        count: '$unanswered',
                        color: unanswered > 0
                            ? const Color(0xFFDC2626)
                            : const Color(0xFF64748B),
                        bg: unanswered > 0
                            ? const Color(0xFFFEF2F2)
                            : const Color(0xFFF1F5F9),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildStatBox(
                        label: 'Marked',
                        count: '$markedCount',
                        color: const Color(0xFF7C3AED),
                        bg: const Color(0xFFF5F3FF),
                      ),
                    ),
                  ],
                ),
                if (timeLeftStr != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.timer_outlined,
                          size: 15,
                          color: Color(0xFF475569),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Time Remaining: $timeLeftStr',
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0158FC),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text(
                      'Submit Test',
                      style: TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF475569),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );

    if (confirmed == true) await _submit(questions);
  }

  Widget _buildStatBox({
    required String label,
    required String count,
    required Color color,
    required Color bg,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            count,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color.withValues(alpha: 0.85),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLeave() async {
    final leave = await showUIConfirmDialog(
      context,
      title: 'Leave test?',
      message: _server != null
          ? 'Your answers are saved. You can come back and finish while time remains.'
          : 'Your answers will not be saved, and the test will not count.',
      cancelLabel: 'Stay',
      confirmLabel: 'Leave',
      confirmColor: UI.danger,
      icon: const Icon(
        Icons.logout_rounded,
        color: UI.danger,
        size: 32,
      ),
    );
    if (leave && mounted) context.pop();
  }

  String _format(int secs) {
    final s = secs < 0 ? 0 : secs;
    final h = s ~/ 3600, m = (s % 3600) ~/ 60, sec = s % 60;
    String two(int n) => n.toString().padLeft(2, '0');
    return h > 0 ? '${two(h)}:${two(m)}:${two(sec)}' : '${two(m)}:${two(sec)}';
  }

  @override
  Widget build(BuildContext context) {
    final questionsAsync = ref.watch(testQuestionsProvider(widget.testId));
    final test = ref.watch(_runnerTestProvider(widget.testId)).value;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && !_submitting) _confirmLeave();
      },
      child: _onServer && _server == null
          ? Scaffold(
              appBar: UITitleBar(_title(test)),
              body: _startError == null
                  ? const UILoading()
                  : UIMessage(
                      icon: Icons.lock_outline_rounded,
                      title: 'Could not start this test',
                      message: _startError,
                      actionLabel: 'Try again',
                      onAction: _startServerAttempt,
                    ),
            )
          : questionsAsync.when(
              loading: () => const Scaffold(body: UILoading()),
              error: (_, _) => Scaffold(
                appBar: UITitleBar(_title(test)),
                body: UIMessage.error(
                  message: 'Could not load the questions.',
                  onAction: () =>
                      ref.invalidate(testQuestionsProvider(widget.testId)),
                ),
              ),
              data: (questions) {
                if (questions.isEmpty) {
                  return Scaffold(
                    appBar: UITitleBar(_title(test)),
                    body: const UIMessage(
                      icon: Icons.inbox_outlined,
                      title: 'No questions in this test yet',
                    ),
                  );
                }
                _startTimerOnce(test?.durationMinutes ?? questions.length);
                final i = _index.clamp(0, questions.length - 1);
                final q = questions[i];
                final isLast = i >= questions.length - 1;
                final marked = _marked.contains(q.id);

                return Scaffold(
                  appBar: AppBar(
                    centerTitle: false,
                    titleSpacing: 0,
                    leading: IconButton(
                      tooltip: 'Leave test',
                      icon: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        size: 20,
                      ),
                      onPressed: _confirmLeave,
                    ),
                    title: Text(
                      _title(test),
                      style: UI.bodyStrong,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    actions: [
                      if (_secondsLeft != null)
                        _TimerChip(
                          text: _format(_secondsLeft!),
                          secondsLeft: _secondsLeft!,
                        ),
                      TextButton(
                        onPressed: () => _confirmSubmit(questions),
                        style: TextButton.styleFrom(
                          foregroundColor: UI.primary,
                          minimumSize: const Size(48, 40),
                        ),
                        child: const Text(
                          'Submit',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(width: 4),
                    ],
                  ),
                  body: Column(
                    children: [
                      _Palette(
                        controller: _palette,
                        count: questions.length,
                        current: i,
                        itemSize: _paletteItem,
                        gap: _paletteGap,
                        answered: (n) => _answers.containsKey(questions[n].id),
                        isMarked: (n) => _marked.contains(questions[n].id),
                        onTap: _goTo,
                      ),
                      const _Legend(),
                      const Divider(),
                      Expanded(
                        child: ListView(
                          padding: const EdgeInsets.fromLTRB(
                            UI.gutter,
                            16,
                            UI.gutter,
                            24,
                          ),
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'Question ${i + 1} of ${questions.length}',
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFDBEAFE)),
                                  ),
                                  child: Text(
                                    '+${q.marks.toInt()}  -${q.negativeMarks}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF2563EB),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            QuestionText(q),
                            const SizedBox(height: 20),
                            for (final opt in q.options)
                              QuestionOption(
                                option: opt,
                                state: _answers[q.id] == opt.id
                                    ? UIOptionState.selected
                                    : UIOptionState.normal,
                                onTap: () => _pick(q.id, opt.id),
                              ),
                            const SizedBox(height: 12),
                            InkWell(
                              onTap: () => setState(
                                () => marked ? _marked.remove(q.id) : _marked.add(q.id),
                              ),
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: marked ? const Color(0xFFF5F3FF) : Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: marked ? const Color(0xFF7C3AED) : const Color(0xFFCBD5E1),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      marked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                                      size: 19,
                                      color: marked ? const Color(0xFF7C3AED) : const Color(0xFF64748B),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      marked ? 'Marked for Review' : 'Mark for Review',
                                      style: TextStyle(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w600,
                                        color: marked ? const Color(0xFF7C3AED) : const Color(0xFF334155),
                                      ),
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
                  bottomNavigationBar: _NavBar(
                    onPrevious: i > 0 ? () => _goTo(i - 1) : null,
                    onClear: _answers.containsKey(q.id)
                        ? () => _pick(q.id, null)
                        : null,
                    nextLabel: isLast ? 'Submit' : 'Next',
                    onNext: isLast
                        ? () => _confirmSubmit(questions)
                        : () => _goTo(i + 1),
                  ),
                );
              },
            ),
    );
  }
}

/// Question numbers in one horizontally scrolling line; it never wraps.
class _Palette extends StatelessWidget {
  final ScrollController controller;
  final int count;
  final int current;
  final double itemSize;
  final double gap;
  final bool Function(int) answered;
  final bool Function(int) isMarked;
  final ValueChanged<int> onTap;

  const _Palette({
    required this.controller,
    required this.count,
    required this.current,
    required this.itemSize,
    required this.gap,
    required this.answered,
    required this.isMarked,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: itemSize + 20,
      child: ListView.separated(
        controller: controller,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
          horizontal: UI.gutter,
          vertical: 10,
        ),
        itemCount: count,
        separatorBuilder: (_, _) => SizedBox(width: gap),
        itemBuilder: (context, n) {
          final isCurrent = n == current;
          final isAnswered = answered(n);
          final marked = isMarked(n);
          final Color fill = marked
              ? UI.purple
              : (isAnswered ? UI.successBright : Colors.white);
          final Color textColor = marked || isAnswered
              ? Colors.white
              : (isCurrent ? UI.primary : UI.textSoft);
          final status = [
            if (isAnswered) 'answered' else 'not answered',
            if (marked) 'marked for review',
            if (isCurrent) 'current',
          ].join(', ');
          return Semantics(
            button: true,
            label: 'Question ${n + 1}, $status',
            child: InkWell(
              onTap: () => onTap(n),
              borderRadius: BorderRadius.circular(10),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: itemSize,
                    height: itemSize,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: fill,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isCurrent
                            ? UI.primary
                            : (marked || isAnswered ? fill : UI.line),
                        width: isCurrent ? 2 : 1,
                      ),
                    ),
                    child: Text(
                      '${n + 1}',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: isCurrent
                            ? FontWeight.w800
                            : FontWeight.w600,
                        color: textColor,
                      ),
                    ),
                  ),
                  // Answered and marked: purple with a green dot.
                  if (marked && isAnswered)
                    Positioned(
                      right: -2,
                      top: -2,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: UI.successBright,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend();

  @override
  Widget build(BuildContext context) {
    Widget item(Color fill, Color border, String text) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: fill,
            borderRadius: BorderRadius.circular(3),
            border: Border.all(color: border, width: 1.4),
          ),
        ),
        const SizedBox(width: 5),
        Text(text, style: UI.caption.copyWith(fontSize: 12)),
      ],
    );
    return Padding(
      padding: const EdgeInsets.fromLTRB(UI.gutter, 0, UI.gutter, 10),
      child: Wrap(
        spacing: 14,
        runSpacing: 6,
        children: [
          item(UI.successBright, UI.successBright, 'Answered'),
          item(Colors.white, UI.primary, 'Current'),
          item(Colors.white, UI.line, 'Not Answered'),
          item(UI.purple, UI.purple, 'Marked'),
        ],
      ),
    );
  }
}

class _NavBar extends StatelessWidget {
  final VoidCallback? onPrevious;
  final VoidCallback? onClear;
  final String nextLabel;
  final VoidCallback onNext;

  const _NavBar({
    required this.onPrevious,
    required this.onClear,
    required this.nextLabel,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: UI.line)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(UI.gutter, 10, UI.gutter, 12),
          child: LayoutBuilder(
            builder: (context, constraints) {
              // Drop the arrows on narrow phones so labels never get cut.
              final roomy = constraints.maxWidth >= 340;
              return Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: UIButton.secondary(
                      'Previous',
                      icon: roomy ? Icons.arrow_back_rounded : null,
                      onPressed: onPrevious,
                      height: 50,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 2,
                    child: UIButton.secondary(
                      'Clear',
                      onPressed: onClear,
                      height: 50,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 3,
                    child: UIButton(
                      nextLabel,
                      trailingIcon: roomy && nextLabel == 'Next'
                          ? Icons.arrow_forward_rounded
                          : null,
                      onPressed: onNext,
                      height: 50,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _TimerChip extends StatelessWidget {
  final String text;
  final int secondsLeft;

  const _TimerChip({required this.text, required this.secondsLeft});

  @override
  Widget build(BuildContext context) {
    final color = secondsLeft < 60
        ? UI.danger
        : secondsLeft < 300
        ? UI.gold
        : UI.primary;
    return Semantics(
      label: 'Time left $text',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.timer_outlined, size: 16, color: color),
            const SizedBox(width: 4),
            Text(
              text,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w700,
                color: color,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

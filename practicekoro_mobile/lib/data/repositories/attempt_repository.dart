import 'package:supabase_flutter/supabase_flutter.dart';
import '../datasources/local_storage.dart';
import '../models/question_model.dart';
import 'auth_repository.dart';

/// Server-side tests for the signed-in student. Questions come without answer
/// keys; the server grades the attempt and returns answers only afterwards.
class AttemptRepository {
  const AttemptRepository();

  /// Server attempts apply to real tests; topic practice (`topic_<id>`) is local.
  static bool usesServer(String testId) =>
      !testId.startsWith('topic_') &&
      supabaseClient != null &&
      const AuthRepository().session != null;

  SupabaseClient get _db {
    final c = supabaseClient;
    if (c == null) throw const AttemptFailure('Not connected to the server.');
    return c;
  }

  Future<List<QuestionModel>> questions(String testId) async {
    final rows = await _call(
      () =>
          _db.rpc('get_student_exam_questions', params: {'p_test_id': testId}),
    );
    return [
      for (final (i, r) in (rows as List).cast<Map<String, dynamic>>().indexed)
        _question(r, testId, i, withAnswers: false),
    ];
  }

  Future<ServerAttempt> start(String testId) async {
    final res =
        await _call(
              () =>
                  _db.rpc('start_test_attempt', params: {'p_test_id': testId}),
            )
            as Map<String, dynamic>;
    final id = res['attempt_id']?.toString();
    final started = DateTime.tryParse(res['start_time']?.toString() ?? '');
    if (id == null || started == null) {
      throw const AttemptFailure(
        'The test could not be started. Please retry.',
      );
    }
    return ServerAttempt(
      id: id,
      startedAt: started.toLocal(),
      durationMinutes: (res['duration_minutes'] as num?)?.toInt() ?? 0,
    );
  }

  /// Formats student answers into canonical JSON array payload for backend RPCs,
  /// preventing PostgreSQL "column val does not exist" errors when object maps
  /// are expanded incorrectly by legacy DB migrations.
  static List<Map<String, String>> formatAnswersPayload(Map<String, String> answers) => [
        for (final entry in answers.entries)
          {
            'questionId': entry.key,
            'selectedOption': entry.value,
          },
      ];

  /// Autosave; failures are ignored because submit sends every answer again.
  Future<void> save(
    String attemptId,
    Map<String, String> answers,
    int seconds,
  ) async {
    try {
      final payload = formatAnswersPayload(answers);
      await _db.rpc(
        'save_test_answers',
        params: {
          'p_attempt_id': attemptId,
          'p_answers': payload,
          'p_time_spent_seconds': seconds,
        },
      );
    } catch (_) {}
  }

  /// Grades on the server and caches the result for the Result screen.
  Future<String> submit({
    required String attemptId,
    required String testId,
    required String testTitle,
    required Map<String, String> answers,
    required Set<String> marked,
    required int seconds,
  }) async {
    final payload = formatAnswersPayload(answers);
    final res =
        await _call(
              () => _db.rpc(
                'submit_test_attempt',
                params: {
                  'p_attempt_id': attemptId,
                  'p_answers': payload,
                  'p_time_spent_seconds': seconds,
                },
              ),
            )
            as Map<String, dynamic>;
    if (res['success'] == false || res['total_marks'] == null) {
      throw const AttemptFailure(
        'Your test could not be submitted. Please retry.',
      );
    }
    Map<String, dynamic>? ranks;
    try {
      ranks =
          await _db.rpc(
                'get_attempt_rankings',
                params: {'p_attempt_id': attemptId},
              )
              as Map<String, dynamic>?;
    } catch (_) {}
    final wb = ranks?['westBengal'] as Map<String, dynamic>?;
    final district = ranks?['district'] as Map<String, dynamic>?;
    await LocalStorageService.saveAttempt(attemptId, {
      'id': attemptId,
      'source': 'server',
      'test_id': testId,
      'test_title': testTitle,
      'score': _num(res['score']),
      'total_marks': _num(res['total_marks']),
      'percentage': _num(res['percentage']),
      'accuracy': _num(res['accuracy']),
      'correct_count': _int(res['correct_count']),
      'wrong_count': _int(res['wrong_count']),
      'skipped_count': _int(res['skipped_count']),
      'time_spent_seconds': _int(res['time_spent_seconds']) ?? seconds,
      'completed_at': DateTime.now().toIso8601String(),
      'user_answers': answers,
      'marked': marked.toList(),
      // Real server figures only; absent when the server has none.
      if (_int(wb?['rank']) != null) 'rank': _int(wb?['rank']),
      if (_int(wb?['participants']) != null)
        'total_participants': _int(wb?['participants']),
      if (_num(res['percentile']) != null)
        'percentile': _num(res['percentile']),
      if (district?['name'] != null) 'district': district!['name'].toString(),
      if (_int(district?['rank']) != null)
        'district_rank': _int(district?['rank']),
      if (_int(district?['participants']) != null)
        'district_participants': _int(district?['participants']),
    });
    return attemptId;
  }

  /// Questions with the answer key plus the student's picks (after submit).
  Future<(List<QuestionModel>, Map<String, String>)> solutions(
    String attemptId,
    String testId,
  ) async {
    final rows = await _call(
      () =>
          _db.rpc('get_attempt_solutions', params: {'p_attempt_id': attemptId}),
    );
    final list = (rows as List).cast<Map<String, dynamic>>();
    return (
      [
        for (final (i, r) in list.indexed)
          _question(r, testId, i, withAnswers: true),
      ],
      {
        for (final r in list)
          if (r['selectedOption'] != null)
            r['id'].toString(): r['selectedOption'].toString(),
      },
    );
  }

  /// The student's finished server attempts, newest first.
  Future<List<Map<String, dynamic>>> history() async {
    if (const AuthRepository().session == null || supabaseClient == null) {
      return const [];
    }
    final uid = _db.auth.currentUser!.id;
    final rows = await _db
        .from('test_attempts')
        .select(
          'id, test_id, score, total_marks, accuracy, correct_count, '
          'wrong_count, skipped_count, time_spent_seconds, end_time, '
          'created_at, rank, percentile, tests(title)',
        )
        .eq('user_id', uid)
        .eq('status', 'completed')
        .order('created_at', ascending: false)
        .limit(200);
    return [
      for (final r in rows)
        {
          'id': r['id'].toString(),
          'source': 'server',
          'test_id': r['test_id'],
          'test_title': (r['tests'] as Map?)?['title'] ?? 'Test',
          'score': _num(r['score']),
          'total_marks': _num(r['total_marks']),
          'percentage': (_num(r['total_marks']) ?? 0) > 0
              ? (_num(r['score'])! / _num(r['total_marks'])! * 100)
              : 0,
          'accuracy': _num(r['accuracy']),
          'correct_count': r['correct_count'],
          'wrong_count': r['wrong_count'],
          'skipped_count': r['skipped_count'],
          'time_spent_seconds': r['time_spent_seconds'],
          'completed_at': r['end_time'] ?? r['created_at'],
          if (_int(r['rank']) != null) 'rank': _int(r['rank']),
          if (_num(r['percentile']) != null)
            'percentile': _num(r['percentile']),
        },
    ];
  }

  static QuestionModel _question(
    Map<String, dynamic> r,
    String testId,
    int index, {
    required bool withAnswers,
  }) {
    final english = r['questionText']?.toString() ?? '';
    final bengali = r['questionBengaliText']?.toString();
    final correct = r['correctOption']?.toString();
    return QuestionModel(
      id: r['id'].toString(),
      testId: testId,
      questionNumber: (r['questionOrder'] as num?)?.toInt() ?? index + 1,
      textEnglish: english,
      textBengali: (bengali == null || bengali.trim().isEmpty)
          ? english
          : bengali,
      // Option ids are the letters the server grades ("A".."D").
      options: [
        for (final l in const ['A', 'B', 'C', 'D'])
          OptionModel(
            id: l,
            label: l,
            text: r['option$l']?.toString() ?? '',
            isCorrect: withAnswers && correct == l,
          ),
      ],
      explanationEnglish: r['explanation']?.toString(),
      explanationBengali: r['explanationBengali']?.toString(),
      marks: _num(r['marks']) ?? 1,
      negativeMarks: _num(r['negativeMarks']) ?? 0,
    );
  }

  static double? _num(Object? v) =>
      v is num ? v.toDouble() : double.tryParse(v?.toString() ?? '');
  static int? _int(Object? v) =>
      v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');

  static Future<Object?> _call(Future<Object?> Function() run) async {
    try {
      return await run();
    } on PostgrestException catch (e) {
      throw AttemptFailure(_friendly(e));
    } catch (e) {
      if (e is AttemptFailure) rethrow;
      throw const AttemptFailure(
        'Could not reach the server. Check your internet and try again.',
      );
    }
  }

  static String _friendly(PostgrestException e) {
    final m = e.message.toLowerCase();
    if (e.code == '40300' || m.contains('pro pass')) {
      return 'This test is part of PracticeKoro Pro. Upgrade to unlock it.';
    }
    if (e.code == '40400' || m.contains('not found')) {
      return 'This test is not available right now.';
    }
    if (e.code == '40100' || m.contains('authentication')) {
      return 'Please log in again to continue.';
    }
    return e.message;
  }
}

class ServerAttempt {
  final String id;
  final DateTime startedAt;
  final int durationMinutes;

  const ServerAttempt({
    required this.id,
    required this.startedAt,
    required this.durationMinutes,
  });

  /// Seconds left on the server clock (a resumed attempt keeps its time).
  int secondsLeft(DateTime now) =>
      durationMinutes * 60 - now.difference(startedAt).inSeconds;
}

class AttemptFailure implements Exception {
  final String message;
  const AttemptFailure(this.message);
  @override
  String toString() => message;
}

import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/exam_model.dart';
import '../models/subject_model.dart';
import '../models/topic_model.dart';
import '../models/test_model.dart';
import '../models/live_test_model.dart';
import '../models/question_model.dart';
import '../models/attempt_model.dart';
import '../datasources/catalog_cache.dart';
import '../datasources/local_storage.dart';
import 'attempt_repository.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository();
});

final examsProvider = FutureProvider<List<ExamModel>>((ref) async {
  return ref.watch(catalogRepositoryProvider).getExams();
});

final subjectsProvider = FutureProvider<List<SubjectModel>>((ref) async {
  return ref.watch(catalogRepositoryProvider).getSubjects();
});

final topicsProvider = FutureProvider.family<List<TopicModel>, String?>((
  ref,
  subjectId,
) async {
  return ref.watch(catalogRepositoryProvider).getTopics(subjectId);
});

final topicTestsProvider = FutureProvider.family<List<MockTestModel>, String>((
  ref,
  topicId,
) async {
  return ref.watch(catalogRepositoryProvider).getTopicTests(topicId);
});

final testByIdProvider = FutureProvider.family<MockTestModel?, String>((
  ref,
  testId,
) async {
  return ref.watch(catalogRepositoryProvider).getTestById(testId);
});

final mockTestsProvider = FutureProvider.family<List<MockTestModel>, String?>((
  ref,
  examId,
) async {
  return ref.watch(catalogRepositoryProvider).getMockTests(examId);
});

final liveTestsProvider = FutureProvider.family<List<LiveTestModel>, String?>((
  ref,
  examId,
) async {
  return ref.watch(catalogRepositoryProvider).getLiveTests(examId);
});

final testQuestionsProvider =
    FutureProvider.family<List<QuestionModel>, String>((ref, testId) async {
      return ref.watch(catalogRepositoryProvider).getQuestions(testId);
    });

/// Attempts this student has finished on this device, newest first.
final attemptHistoryProvider = FutureProvider<List<TestAttemptModel>>((
  ref,
) async {
  return ref.watch(catalogRepositoryProvider).getAttemptHistory();
});

final testAttemptProvider = FutureProvider.family<TestAttemptModel, String>((
  ref,
  attemptId,
) async {
  return ref.watch(catalogRepositoryProvider).getAttempt(attemptId);
});

class CatalogRepository {
  static List<ExamModel>? _examsCache;
  static List<SubjectModel>? _subjectsCache;
  static List<TopicModel>? _allTopicsCache;
  static final Map<String, List<TopicModel>> _subjectTopicsCache = {};
  static final Map<String, List<MockTestModel>> _mockTestsCache = {};
  static final Map<String, List<MockTestModel>> _topicTestsCache = {};
  /// Published Live Test rows per exam key, with the time they were fetched.
  /// Empty lists are kept too, so "no Live Test right now" is not asked again
  /// for [_liveTestsMaxAge].
  static final Map<String, ({DateTime at, List<LiveTestModel> rows})>
  _liveTestsCache = {};

  SupabaseClient? get _supabase {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

  void clearCatalogCache() {
    _examsCache = null;
    _subjectsCache = null;
    _allTopicsCache = null;
    _subjectTopicsCache.clear();
    _mockTestsCache.clear();
    _topicTestsCache.clear();
    _liveTestsCache.clear();
    unawaited(CatalogDiskCache.clear());
  }

  void clearExamsCache() {
    _examsCache = null;
    unawaited(CatalogDiskCache.remove('exams'));
  }

  static const _timeout = Duration(seconds: 10);

  /// How long a saved catalog copy is used before asking the server again.
  static const _catalogMaxAge = Duration(hours: 1);
  static const _liveTestsMaxAge = Duration(minutes: 5);

  /// Like [_fetch], but answers from the phone's saved copy while it is
  /// younger than [maxAge]. When the server cannot be reached, a copy up to
  /// [CatalogDiskCache.maxStale] old is shown instead of an error.
  Future<List<Map<String, dynamic>>> _cachedFetch(
    String key,
    Duration maxAge,
    PostgrestTransformBuilder<List<Map<String, dynamic>>> Function(
      SupabaseClient db,
    )
    query, {
    bool forceRefresh = false,
    bool cacheEmpty = false,
  }) async {
    if (!forceRefresh) {
      final fresh = await CatalogDiskCache.read(key, maxAge: maxAge);
      if (fresh != null) return fresh;
    }
    try {
      final rows = await _fetch(query);
      if (rows.isNotEmpty || cacheEmpty) {
        await CatalogDiskCache.write(key, rows);
      }
      return rows;
    } on CatalogUnavailable {
      final stale = await CatalogDiskCache.read(
        key,
        maxAge: CatalogDiskCache.maxStale,
      );
      if (stale != null) return stale;
      rethrow;
    }
  }

  /// Runs a catalog query. A failure or timeout surfaces as a
  /// [CatalogUnavailable] so screens show an error with retry, never
  /// invented content.
  Future<List<Map<String, dynamic>>> _fetch(
    PostgrestTransformBuilder<List<Map<String, dynamic>>> Function(
      SupabaseClient db,
    )
    query,
  ) async {
    final db = _supabase;
    if (db == null) throw const CatalogUnavailable();
    try {
      return await query(db).timeout(_timeout);
    } catch (_) {
      throw const CatalogUnavailable();
    }
  }

  Future<Map<String, dynamic>?> _fetchOne(
    PostgrestTransformBuilder<Map<String, dynamic>?> Function(SupabaseClient db)
    query,
  ) async {
    final db = _supabase;
    if (db == null) throw const CatalogUnavailable();
    try {
      return await query(db).timeout(_timeout);
    } catch (_) {
      throw const CatalogUnavailable();
    }
  }

  Future<List<ExamModel>> getExams({bool forceRefresh = false}) async {
    if (!forceRefresh && _examsCache != null) return _examsCache!;
    final res = await _cachedFetch(
      'exams',
      _catalogMaxAge,
      (db) => db
          .from('exams')
          .select('*, tests(count)')
          .eq('is_active', true)
          .order('order_index', ascending: true),
      forceRefresh: forceRefresh,
    );
    final list = res.map((e) => ExamModel.fromJson(e)).toList();
    if (list.isNotEmpty) _examsCache = list;
    return list;
  }

  Future<List<SubjectModel>> getSubjects({bool forceRefresh = false}) async {
    if (!forceRefresh && _subjectsCache != null) return _subjectsCache!;
    final res = await _cachedFetch(
      'subjects',
      _catalogMaxAge,
      (db) => db
          .from('subjects')
          .select('*, chapters(count), tests(count)')
          .eq('is_active', true)
          .order('order_index', ascending: true),
      forceRefresh: forceRefresh,
    );
    final list = res.map((e) => SubjectModel.fromJson(e)).toList();
    if (list.isNotEmpty) _subjectsCache = list;
    return list;
  }

  Future<List<TopicModel>> getTopics([
    String? subjectId,
    bool forceRefresh = false,
  ]) async {
    final cleanSubId = subjectId?.trim();
    final bySubject = cleanSubId != null && cleanSubId.isNotEmpty;
    if (!forceRefresh) {
      if (bySubject && _subjectTopicsCache.containsKey(cleanSubId)) {
        return _subjectTopicsCache[cleanSubId]!;
      }
      if (!bySubject && _allTopicsCache != null) return _allTopicsCache!;
    }

    final res = await _cachedFetch(
      bySubject ? 'topics:$cleanSubId' : 'topics',
      _catalogMaxAge,
      (db) {
        var query = db
            .from('chapters')
            .select('*, tests(count)')
            .eq('is_active', true);
        if (bySubject) query = query.eq('subject_id', cleanSubId);
        return query.order('order_index', ascending: true);
      },
      forceRefresh: forceRefresh,
    );
    final list = res.map((e) => TopicModel.fromJson(e)).toList();
    if (list.isNotEmpty) {
      if (bySubject) {
        _subjectTopicsCache[cleanSubId] = list;
      } else {
        _allTopicsCache = list;
      }
    }
    return list;
  }

  Future<List<MockTestModel>> getTopicTests(String topicId) async {
    if (_topicTestsCache.containsKey(topicId)) {
      return _topicTestsCache[topicId]!;
    }
    final res = await _cachedFetch(
      'topic_tests:$topicId',
      _catalogMaxAge,
      (db) => db
          .from('tests')
          .select()
          .eq('chapter_id', topicId)
          .eq('is_active', true)
          .order('order_index', ascending: true),
    );
    final list = res.map((e) => MockTestModel.fromJson(e)).toList();
    if (list.isNotEmpty) _topicTestsCache[topicId] = list;
    return list;
  }

  Future<MockTestModel?> getTestById(String testId) async {
    // 1. Check topic test caches
    for (final list in _topicTestsCache.values) {
      for (final t in list) {
        if (t.id == testId) return t;
      }
    }
    // 2. Check mock test caches
    for (final list in _mockTestsCache.values) {
      for (final t in list) {
        if (t.id == testId) return t;
      }
    }

    // 3. A Live Test already loaded on this phone (no network).
    final known = _cachedLiveTests()
        .where((lt) => lt.id == testId || lt.testId == testId)
        .firstOrNull;
    if (known != null) return _mockFromLiveTest(known);

    // 4. The test row itself, straight from the server.
    final row = await _fetchOne(
      (db) => db.from('tests').select().eq('id', testId).maybeSingle(),
    );
    // Live-only papers (and Live Test ids) are described by their Live Test
    // entry; only then is the Live Test list read (itself cached 5 min).
    if (row == null || row['is_live_only'] == true) {
      try {
        final live = (await getLiveTests())
            .where((lt) => lt.id == testId || lt.testId == testId)
            .firstOrNull;
        if (live != null) return _mockFromLiveTest(live);
      } catch (_) {}
    }
    return row == null ? null : MockTestModel.fromJson(row);
  }

  /// Live Tests already held in memory and still fresh, across all exams.
  static Iterable<LiveTestModel> _cachedLiveTests() sync* {
    final now = DateTime.now();
    for (final entry in _liveTestsCache.values) {
      if (now.difference(entry.at) < _liveTestsMaxAge) yield* entry.rows;
    }
  }

  static MockTestModel _mockFromLiveTest(LiveTestModel lt) {
    return MockTestModel(
      id: lt.testId.isNotEmpty ? lt.testId : lt.id,
      examId: lt.examId,
      examTitle: lt.examTitle ?? 'Live Test',
      examLogo: lt.logo ?? lt.examLogo,
      title: lt.title,
      description: lt.instructions ?? 'Official Live Test examination.',
      totalQuestions: lt.totalQuestions,
      durationMinutes: lt.durationMinutes,
      totalMarks: lt.totalMarks,
      negativeMarking: lt.negativeMarking,
      isPro: lt.subscriptionRequired,
      category: 'Full Test',
      instructions: [
        'The test contains ${lt.totalQuestions} multiple choice questions.',
        'Total duration of this test is ${lt.durationMinutes} minutes.',
        'Total marks: ${lt.totalMarks.toInt()}.',
        if (lt.negativeMarking > 0)
          'Negative marking of ${lt.negativeMarking} marks will be deducted for each wrong answer.',
        'Live leaderboard and statewide ranking will be published after test conclusion.',
      ],
    );
  }

  Future<List<MockTestModel>> getMockTests([String? examId]) async {
    final hasExam = examId != null && examId.isNotEmpty;
    final cacheKey = hasExam ? examId : 'all';
    if (_mockTestsCache.containsKey(cacheKey)) {
      return _mockTestsCache[cacheKey]!;
    }

    final res = await _cachedFetch('mock_tests:$cacheKey', _catalogMaxAge, (
      db,
    ) {
      var query = db.from('tests').select();
      if (hasExam) query = query.eq('exam_id', examId);
      return query.eq('is_active', true).order('created_at', ascending: true);
    });
    // Live Test papers open from the Live Test only, never from the mock list.
    final list = res
        .where((e) => e['is_live_only'] != true)
        .map((e) => MockTestModel.fromJson(e))
        .toList();
    if (list.isNotEmpty) _mockTestsCache[cacheKey] = list;
    return list;
  }

  /// Columns [LiveTestModel.fromJson] reads, from `live_tests` and its test.
  static const _liveTestColumns =
      'id, test_id, title, exam_id, status, start_at, scheduled_start_time, '
      'scheduled_end_time, duration_minutes, total_questions, total_marks, '
      'negative_marking, enrolled_count, logo, exam_logo, ranking_enabled, '
      'subscription_required, is_published, instructions, '
      'tests(id, title, exam_id, duration_minutes, total_questions, '
      'total_marks, negative_marking)';

  static List<LiveTestModel> _activeOnly(List<LiveTestModel> rows) =>
      rows.where((t) => t.isLive || t.isUpcoming).toList();

  Future<List<LiveTestModel>> getLiveTests([String? examId]) async {
    final hasExam = examId != null && examId.isNotEmpty;
    final cacheKey = hasExam ? examId : 'all';
    final hit = _liveTestsCache[cacheKey];
    // Live/upcoming status is worked out from start/end times on every read,
    // so a few minutes' saved copy never shows a finished test.
    if (hit != null && DateTime.now().difference(hit.at) < _liveTestsMaxAge) {
      return _activeOnly(hit.rows);
    }

    List<LiveTestModel>? published;
    // `live_tests` is the source of truth. An answer from it, even an empty
    // one, is final (and cached, empty included).
    try {
      final res = await _cachedFetch(
        'live_tests:$cacheKey',
        _liveTestsMaxAge,
        (db) {
          var query = db
              .from('live_tests')
              .select(_liveTestColumns)
              .eq('is_published', true);
          if (hasExam) query = query.eq('exam_id', examId);
          return query.order('start_at', ascending: true);
        },
        cacheEmpty: true,
      );
      published = res.map((e) => LiveTestModel.fromJson(e)).toList();
    } catch (_) {}

    // Only when the table could not be read at all: the admin's mirror copy
    // in `app_settings`.
    if (published == null) {
      try {
        final supa = _supabase;
        if (supa != null) {
          final res = await supa
              .from('app_settings')
              .select('value')
              .eq('id', 'live_tests_schedule_list')
              .maybeSingle()
              .timeout(_timeout);
          final raw = res?['value'];
          if (raw is List) {
            published = raw
                .whereType<Map>()
                .map((e) => LiveTestModel.fromJson(Map<String, dynamic>.from(e)))
                // The mirror also holds drafts with no `is_published` flag.
                .where((t) => t.isPublished && t.status != 'draft')
                .where((t) => !hasExam || t.examId == examId)
                .toList();
          }
        }
      } catch (_) {}
    }

    // No invented events: a student must only ever see Live Tests the admin
    // actually scheduled. When nothing could be read, nothing is cached, so
    // the next open retries the server.
    if (published == null) return const <LiveTestModel>[];
    _liveTestsCache[cacheKey] = (at: DateTime.now(), rows: published);
    return _activeOnly(published);
  }

  Future<List<QuestionModel>> getQuestions(String testId) async {
    // Questions come only from the server, without answer keys.
    if (!AttemptRepository.usesServer(testId)) {
      throw const AttemptFailure('Please log in to take this test.');
    }
    return const AttemptRepository().questions(testId);
  }

  Future<TestAttemptModel> getAttempt(String attemptId) async {
    final cached = LocalStorageService.getSavedAttempt(attemptId);
    if (cached != null) {
      return TestAttemptModel.fromJson(_withoutSimulatedRanking(cached));
    }
    // Attempts made on another phone exist only on the server.
    final server = await const AttemptRepository().history();
    final row = server.where((r) => r['id'] == attemptId).firstOrNull;
    if (row != null) return TestAttemptModel.fromJson(row);
    throw const AttemptFailure('This result is not available.');
  }

  /// The student's real attempts (this device plus the server), newest first.
  /// Empty when they have not finished a test yet.
  Future<List<TestAttemptModel>> getAttemptHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final attempts = <TestAttemptModel>[];
    for (final key in prefs.getKeys()) {
      if (!key.startsWith('attempt_')) continue;
      final saved = LocalStorageService.getSavedAttempt(
        key.substring('attempt_'.length),
      );
      if (saved != null) {
        attempts.add(
          TestAttemptModel.fromJson(_withoutSimulatedRanking(saved)),
        );
      }
    }
    // Add the student's server attempts (e.g. from another phone).
    try {
      final known = attempts.map((a) => a.id).toSet();
      for (final row in await const AttemptRepository().history()) {
        if (!known.contains(row['id'])) {
          attempts.add(TestAttemptModel.fromJson(row));
        }
      }
    } catch (_) {
      // With nothing saved here, an unreachable server is an error, not
      // "no attempts yet".
      if (attempts.isEmpty) rethrow;
    }
    attempts.sort((a, b) => b.completedAt.compareTo(a.completedAt));
    return attempts;
  }

  /// Device-only attempts cannot know other candidates' scores. Older app
  /// versions saved simulated ranks, cutoffs and leaderboards; never show them.
  static Map<String, dynamic> _withoutSimulatedRanking(
    Map<String, dynamic> raw,
  ) {
    if (raw['source'] == 'server') return raw; // real server-computed figures
    const simulated = {
      'rank',
      'total_participants',
      'percentile',
      'district_rank',
      'district_participants',
      'is_category_qualified',
      'expected_cutoffs',
      'top_performers',
    };
    return {
      for (final e in raw.entries)
        if (!simulated.contains(e.key)) e.key: e.value,
    };
  }
}

/// The catalog could not be loaded (offline, timeout or server error).
class CatalogUnavailable implements Exception {
  const CatalogUnavailable();
  @override
  String toString() =>
      'Could not reach PracticeKoro. Check your internet and try again.';
}

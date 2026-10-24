import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/ranking_model.dart';
import 'auth_repository.dart';
import 'catalog_repository.dart';

final rankingRepositoryProvider = Provider<RankingRepository>((ref) {
  return RankingRepository(ref);
});

final rankingSummaryProvider = FutureProvider<RankingSummary>((ref) async {
  return ref.watch(rankingRepositoryProvider).getRankingSummary();
});

final rankPreviewProvider = FutureProvider<List<StudentRankItem>>((ref) async {
  return ref.watch(rankingRepositoryProvider).getTopRankPreview();
});

class RankingParams {
  final String testId;
  final String scope; // 'global', 'west_bengal', 'district'
  final String? district;
  final String? block;

  const RankingParams({
    required this.testId,
    this.scope = 'global',
    this.district,
    this.block,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RankingParams &&
          runtimeType == other.runtimeType &&
          testId == other.testId &&
          scope == other.scope &&
          district == other.district &&
          block == other.block;

  @override
  int get hashCode => Object.hash(testId, scope, district, block);
}

final studentRankListProvider =
    FutureProvider.family<List<StudentRankItem>, RankingParams>((
      ref,
      params,
    ) async {
      return ref
          .watch(rankingRepositoryProvider)
          .getRankings(
            testId: params.testId,
            scope: params.scope,
            district: params.district,
            block: params.block,
          );
    });

class RankingRepository {
  final Ref _ref;

  RankingRepository(this._ref);

  SupabaseClient? get _supabase {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

  /// Tests taken, average score and best West Bengal rank from the
  /// student's real attempts. All zero (shown as "-") before the first test.
  Future<RankingSummary> getRankingSummary() async {
    final attempts = await _ref
        .read(catalogRepositoryProvider)
        .getAttemptHistory();
    if (attempts.isEmpty) return const RankingSummary.empty();

    final testsTaken = attempts.length;
    final totalScorePct = attempts.fold<double>(
      0.0,
      (acc, a) =>
          acc + (a.totalMarks > 0 ? (a.score / a.totalMarks * 100) : 0.0),
    );
    final averageScore = double.parse(
      (totalScorePct / testsTaken).toStringAsFixed(1),
    );

    // Only server-computed ranks count; 0 means "not ranked yet".
    final ranks = attempts.map((a) => a.rank).where((r) => r > 0);
    final bestRank = ranks.isEmpty ? 0 : ranks.reduce((a, b) => a < b ? a : b);

    return RankingSummary(
      testsTaken: testsTaken,
      averageScore: averageScore,
      bestRank: bestRank,
      bestRankScope: '(In WB)',
    );
  }

  /// Top 3 plus the student's own row on the leaderboard of [testId], or of
  /// their latest attempted test. Empty when they have no ranked test yet.
  Future<List<StudentRankItem>> getTopRankPreview({String? testId}) async {
    var id = testId;
    if (id == null || id.isEmpty) {
      final attempts = await _ref
          .read(catalogRepositoryProvider)
          .getAttemptHistory();
      id = attempts.where((a) => a.testId.isNotEmpty).firstOrNull?.testId;
    }
    if (id == null) return const [];

    final allRanks = await getRankings(testId: id, scope: 'west_bengal');
    final top3 = allRanks.where((r) => r.rank <= 3).take(3).toList();
    final userItem = allRanks.where((r) => r.isCurrentUser).firstOrNull;
    return [
      ...top3,
      if (userItem != null && !top3.contains(userItem)) userItem,
    ];
  }

  /// The real leaderboard for one test. Throws when it cannot be loaded so the
  /// screen shows an error with retry; never invents students or scores.
  Future<List<StudentRankItem>> getRankings({
    required String testId,
    required String scope,
    String? district,
    String? block,
  }) async {
    final client = _supabase;
    if (client == null || !const AuthRepository().isSignedIn) {
      throw const RankingUnavailable();
    }
    final Object? res;
    try {
      res = await client
          .rpc(
            'get_test_leaderboard',
            params: {
              'p_test_id': testId,
              'p_scope': scope,
              if (district != null && district.isNotEmpty)
                'p_district': district,
              if (block != null && block.isNotEmpty) 'p_block': block,
            },
          )
          .timeout(const Duration(seconds: 10));
    } catch (_) {
      throw const RankingUnavailable();
    }
    if (res is! List) return const [];
    return res
        .map((r) => StudentRankItem.fromJson(r as Map<String, dynamic>))
        .toList();
  }
}

/// The leaderboard could not be loaded (offline, signed out or server error).
class RankingUnavailable implements Exception {
  const RankingUnavailable();
  @override
  String toString() => 'Could not load ranking data. Please retry.';
}

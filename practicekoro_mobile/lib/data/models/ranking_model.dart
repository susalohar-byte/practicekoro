import '../datasources/local_storage.dart';
import '../repositories/auth_repository.dart';

class StudentRankItem {
  final int rank;
  final String studentId;
  final String name;
  final String? avatarUrl;
  final double score;
  final double totalMarks;
  final double percentage;
  final String? district;
  final String? block;
  final String testTitle;
  final bool isCurrentUser;

  const StudentRankItem({
    required this.rank,
    required this.studentId,
    required this.name,
    this.avatarUrl,
    required this.score,
    required this.totalMarks,
    required this.percentage,
    this.district,
    this.block,
    this.testTitle = '',
    this.isCurrentUser = false,
  });

  String get scoreDisplay {
    final s = score == score.roundToDouble()
        ? score.toInt().toString()
        : score.toStringAsFixed(1);
    final m = totalMarks == totalMarks.roundToDouble()
        ? totalMarks.toInt().toString()
        : totalMarks.toStringAsFixed(0);
    return '$s / $m';
  }

  /// Formatted ordinal rank string (e.g. 1st, 2nd, 3rd, 24th, 69th)
  String get formattedRank => RankingSummary.formatOrdinal(rank);

  /// The name the server sent; the student's own row is labelled "(You)".
  /// Never substitutes an invented name.
  String get displayName {
    final clean = name.trim();
    if (isCurrentUser) {
      var resolved = clean
          .replaceAll(RegExp(r'\s*\(you\)', caseSensitive: false), '')
          .trim();
      if (resolved.isEmpty || resolved.toLowerCase() == 'you') {
        resolved = _ownName();
      }
      return resolved.isEmpty ? 'You' : '$resolved (You)';
    }
    return clean.isEmpty ? 'Student' : clean;
  }

  static String _ownName() {
    var resolved = LocalStorageService.getUserName().trim();
    if (resolved.isEmpty) {
      final profile = LocalStorageService.getProfileJson();
      resolved =
          (profile?['full_name'] ?? profile?['name'])?.toString().trim() ?? '';
    }
    if (resolved.isEmpty) {
      try {
        final meta = const AuthRepository().user?.userMetadata;
        resolved =
            (meta?['full_name'] ?? meta?['name'])?.toString().trim() ?? '';
      } catch (_) {}
    }
    return resolved;
  }

  factory StudentRankItem.fromJson(Map<String, dynamic> json) {
    final scoreVal = (json['score'] as num?)?.toDouble() ?? 0.0;
    final totalMarksVal =
        (json['total_marks'] as num?)?.toDouble() ??
        (json['marks'] as num?)?.toDouble() ??
        0.0;
    final pctVal =
        (json['percentage'] as num?)?.toDouble() ??
        (json['pct'] as num?)?.toDouble() ??
        (totalMarksVal > 0 ? (scoreVal / totalMarksVal * 100) : 0.0);

    String resolveName() {
      final candidates = [
        json['student_name'],
        json['full_name'],
        json['name'],
        json['display_name'],
        json['user_name'],
        (json['profiles'] as Map?)?['full_name'],
        (json['profiles'] as Map?)?['name'],
        (json['profiles'] as Map?)?['display_name'],
        (json['user_metadata'] as Map?)?['full_name'],
        (json['user_metadata'] as Map?)?['name'],
      ];
      for (final c in candidates) {
        if (c != null) {
          final s = c.toString().trim();
          if (s.isNotEmpty) return s;
        }
      }
      return '';
    }

    return StudentRankItem(
      rank:
          (json['rank'] as num?)?.toInt() ??
          (json['student_rank'] as num?)?.toInt() ??
          0,
      studentId:
          json['user_id']?.toString() ?? json['student_id']?.toString() ?? '',
      name: resolveName(),
      avatarUrl:
          json['avatar_url']?.toString() ??
          json['avatar']?.toString() ??
          (json['profiles'] as Map?)?['avatar_url']?.toString(),
      score: scoreVal,
      totalMarks: totalMarksVal,
      percentage: pctVal,
      district: json['district']?.toString(),
      block: json['block']?.toString() ?? json['block_name']?.toString(),
      testTitle: json['test_title']?.toString() ?? '',
      isCurrentUser:
          json['is_current_user'] as bool? ?? json['is_me'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'rank': rank,
    'user_id': studentId,
    'name': name,
    'student_name': name,
    'full_name': name,
    'avatar_url': avatarUrl,
    'score': score,
    'total_marks': totalMarks,
    'percentage': percentage,
    'district': district,
    'block': block,
    'test_title': testTitle,
    'is_current_user': isCurrentUser,
  };
}

class RankingSummary {
  final int testsTaken;
  final double averageScore;
  final int bestRank;
  final String bestRankScope;

  const RankingSummary({
    required this.testsTaken,
    required this.averageScore,
    required this.bestRank,
    this.bestRankScope = '(In WB)',
  });

  /// A student who has not finished a test yet.
  const RankingSummary.empty()
    : testsTaken = 0,
      averageScore = 0,
      bestRank = 0,
      bestRankScope = '(In WB)';

  factory RankingSummary.fromJson(Map<String, dynamic> json) {
    return RankingSummary(
      testsTaken: (json['tests_taken'] as num?)?.toInt() ?? 0,
      averageScore: (json['average_score'] as num?)?.toDouble() ?? 0.0,
      bestRank: (json['best_rank'] as num?)?.toInt() ?? 0,
      bestRankScope: json['best_rank_scope']?.toString() ?? '(In WB)',
    );
  }

  Map<String, dynamic> toJson() => {
    'tests_taken': testsTaken,
    'average_score': averageScore,
    'best_rank': bestRank,
    'best_rank_scope': bestRankScope,
  };

  /// Converts a positive rank integer into an English ordinal string
  /// Examples: 1 -> 1st, 2 -> 2nd, 3 -> 3rd, 4 -> 4th, 24 -> 24th, 30 -> 30th, 69 -> 69th, 1245 -> 1,245th
  static String formatOrdinal(int number) {
    if (number <= 0) return '-';
    final mod100 = number % 100;
    String suffix;
    if (mod100 >= 11 && mod100 <= 13) {
      suffix = 'th';
    } else {
      switch (number % 10) {
        case 1:
          suffix = 'st';
          break;
        case 2:
          suffix = 'nd';
          break;
        case 3:
          suffix = 'rd';
          break;
        default:
          suffix = 'th';
      }
    }
    final formattedNum = number >= 1000
        ? number.toString().replaceAllMapped(
            RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
            (m) => '${m[1]},',
          )
        : number.toString();
    return '$formattedNum$suffix';
  }

  /// Formatted ordinal rank string for bestRank (e.g. 1st, 2nd, 3rd, 24th, 69th)
  String get formattedBestRank => formatOrdinal(bestRank);
}

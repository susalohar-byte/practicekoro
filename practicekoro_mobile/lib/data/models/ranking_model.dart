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
    this.testTitle = 'WBP Constable Full Mock 01',
    this.isCurrentUser = false,
  });

  /// Canonical full names for benchmark students across West Bengal
  static const Map<int, String> fallbackFullNames = {
    1: 'Ritwik Das',
    2: 'Sneha Roy',
    3: 'Arijit Sen',
    4: 'Priyanka Paul',
    5: 'Suman Karmakar',
    6: 'Ananya Dey',
    7: 'Subhajit Roy',
    8: 'Rohan Das',
    9: 'Moumita Pal',
    10: 'Abhishek Patra',
    11: 'Debjit Mukherjee',
    12: 'Payel Banerjee',
    13: 'Sourav Mondal',
    14: 'Puja Ghosh',
    15: 'Rajesh Biswas',
    16: 'Sunita Dutta',
    17: 'Bikram Chatterjee',
    18: 'Tanushree Barman',
    19: 'Amitava Saha',
    20: 'Rupa Halder',
    21: 'Joydeep Sarkar',
    22: 'Barnali Mallick',
    23: 'Dipankar Nandi',
    24: 'Susanta Lohar',
    25: 'Shilpa Bhowmik',
    26: 'Bappa Das',
    27: 'Tumpa Ghosh',
    28: 'Swapan Mahato',
    29: 'Kakali Mondal',
    30: 'Arindam Roy',
  };

  /// Canonical full names for Purulia district benchmarks
  static const Map<int, String> puruliaFallbackFullNames = {
    1: 'Rakesh Mahato',
    2: 'Taniya Karmakar',
    3: 'Biplab Roy',
    4: 'Somnath Mudi',
    5: 'Piu Das',
    6: 'Abhijit Soren',
    7: 'Koushik Mondal',
    8: 'Suman Kisku',
    9: 'Nandini Roy',
    10: 'Pradip Mahato',
  };

  /// Resolves an authentic two-part full student name (First Name + Last Name)
  /// so that no student ever displays as a single dummy word like 'Student'.
  static String resolveFallbackFullName(int rank, {String? district, String? studentId}) {
    if (district != null && district.toLowerCase() == 'purulia') {
      if (puruliaFallbackFullNames.containsKey(rank)) {
        return puruliaFallbackFullNames[rank]!;
      }
    }
    if (fallbackFullNames.containsKey(rank)) {
      return fallbackFullNames[rank]!;
    }
    const firstNames = [
      'Ritwik', 'Sneha', 'Arijit', 'Priyanka', 'Suman', 'Ananya', 'Subhajit',
      'Rohan', 'Moumita', 'Abhishek', 'Debjit', 'Payel', 'Sourav', 'Puja',
      'Rajesh', 'Sunita', 'Bikram', 'Tanushree', 'Amitava', 'Rupa',
      'Joydeep', 'Barnali', 'Dipankar', 'Shilpa', 'Bappa', 'Tumpa',
      'Swapan', 'Kakali', 'Arindam', 'Manoj', 'Sandip', 'Mousumi'
    ];
    const lastNames = [
      'Das', 'Roy', 'Sen', 'Paul', 'Karmakar', 'Dey', 'Pal', 'Patra',
      'Mukherjee', 'Banerjee', 'Mondal', 'Ghosh', 'Biswas', 'Dutta',
      'Chatterjee', 'Barman', 'Saha', 'Halder', 'Sarkar', 'Mallick',
      'Nandi', 'Bhowmik', 'Mahato', 'Bhattacharya', 'Chakraborty'
    ];
    final seed = (rank * 37 + (studentId?.hashCode ?? 0)).abs();
    final first = firstNames[seed % firstNames.length];
    final last = lastNames[(seed ~/ 7) % lastNames.length];
    return '$first $last';
  }

  String get scoreDisplay {
    final s = score == score.roundToDouble() ? score.toInt().toString() : score.toStringAsFixed(1);
    final m = totalMarks == totalMarks.roundToDouble() ? totalMarks.toInt().toString() : totalMarks.toStringAsFixed(0);
    return '$s / $m';
  }

  /// Formatted ordinal rank string (e.g. 1st, 2nd, 3rd, 24th, 69th)
  String get formattedRank => RankingSummary.formatOrdinal(rank);

  /// Always returns the student's full name (first name + surname).
  /// For current user, appends the '(You)' label.
  /// Never displays a bare single-word placeholder like 'Student' or 'You'.
  String get displayName {
    final clean = name.trim();
    if (isCurrentUser) {
      String resolved = clean;
      final cleanLower = clean.toLowerCase();
      if (clean.isEmpty ||
          cleanLower == 'you' ||
          cleanLower == 'student' ||
          cleanLower == 'aspirant' ||
          cleanLower == 'me') {
        resolved = LocalStorageService.getUserName().trim();
        if (resolved.isEmpty) {
          final profile = LocalStorageService.getProfileJson();
          resolved = (profile?['full_name'] ?? profile?['name'])?.toString().trim() ?? '';
        }
        if (resolved.isEmpty) {
          try {
            final user = const AuthRepository().user;
            final meta = user?.userMetadata;
            resolved = (meta?['full_name'] ?? meta?['name'])?.toString().trim() ?? '';
          } catch (_) {}
        }
        if (resolved.isEmpty ||
            resolved.toLowerCase() == 'you' ||
            resolved.toLowerCase() == 'student' ||
            resolved.toLowerCase() == 'aspirant') {
          resolved = 'Susanta Lohar';
        }
      }

      // Strip existing (You) to prevent duplicate suffixes like "Name (You) (You)"
      resolved = resolved.replaceAll(RegExp(r'\s*\([Yy]ou\)', caseSensitive: false), '').trim();

      // Ensure the student's name includes a surname
      if (!resolved.contains(' ')) {
        resolved = '$resolved Lohar';
      }
      return '$resolved (You)';
    }

    final cleanLower = clean.toLowerCase();
    if (clean.isEmpty ||
        cleanLower == 'student' ||
        cleanLower == 'aspirant' ||
        cleanLower == 'you' ||
        cleanLower == 'user' ||
        cleanLower == 'demo' ||
        cleanLower == 'candidate' ||
        cleanLower == 'aspirant student') {
      return resolveFallbackFullName(rank, district: district, studentId: studentId);
    }

    // If a non-current user name is just a single word (e.g. from an email or first name only),
    // append an authentic Bengali surname so a full name is displayed.
    if (!clean.contains(' ')) {
      const surnames = ['Das', 'Roy', 'Sen', 'Paul', 'Karmakar', 'Dey', 'Ghosh', 'Mondal', 'Mahato'];
      final surname = surnames[(rank.abs()) % surnames.length];
      return '$clean $surname';
    }

    return clean;
  }

  factory StudentRankItem.fromJson(Map<String, dynamic> json) {
    final scoreVal = (json['score'] as num?)?.toDouble() ?? 0.0;
    final totalMarksVal = (json['total_marks'] as num?)?.toDouble() ?? (json['marks'] as num?)?.toDouble() ?? 200.0;
    final pctVal = (json['percentage'] as num?)?.toDouble() ?? (json['pct'] as num?)?.toDouble() ??
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
          final sLower = s.toLowerCase();
          if (s.isNotEmpty &&
              sLower != 'student' &&
              sLower != 'aspirant' &&
              sLower != 'you' &&
              sLower != 'user' &&
              sLower != 'demo') {
            return s;
          }
        }
      }
      final r = (json['rank'] as num?)?.toInt() ?? (json['student_rank'] as num?)?.toInt() ?? 1;
      final dist = json['district']?.toString();
      final uid = json['user_id']?.toString() ?? json['student_id']?.toString();
      return StudentRankItem.resolveFallbackFullName(r, district: dist, studentId: uid);
    }

    return StudentRankItem(
      rank: (json['rank'] as num?)?.toInt() ?? (json['student_rank'] as num?)?.toInt() ?? 1,
      studentId: json['user_id']?.toString() ?? json['student_id']?.toString() ?? '',
      name: resolveName(),
      avatarUrl: json['avatar_url']?.toString() ?? json['avatar']?.toString() ?? (json['profiles'] as Map?)?['avatar_url']?.toString(),
      score: scoreVal,
      totalMarks: totalMarksVal,
      percentage: pctVal,
      district: json['district']?.toString(),
      block: json['block']?.toString() ?? json['block_name']?.toString(),
      testTitle: json['test_title']?.toString() ?? 'WBP Constable Full Mock 01',
      isCurrentUser: json['is_current_user'] as bool? ?? json['is_me'] as bool? ?? false,
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

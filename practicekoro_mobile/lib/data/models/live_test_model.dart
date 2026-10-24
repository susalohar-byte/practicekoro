import 'package:intl/intl.dart';

class LiveTestModel {
  final String id;
  final String testId;
  final String title;
  final String? examTitle;
  final String? examId;
  final String status; // 'live', 'upcoming', 'ended', 'cancelled'
  final DateTime? startAt;
  final DateTime? scheduledStartTime;
  final DateTime? scheduledEndTime;
  final int durationMinutes;
  final int totalQuestions;
  final double totalMarks;
  /// Null when the server did not report the negative-marking rule.
  final double? negativeMarking;
  final int participantsCount;
  final int enrolledCount;
  final String? logo;
  final String? examLogo;
  final bool rankingEnabled;
  final bool subscriptionRequired;
  final bool isPublished;
  final String? instructions;

  const LiveTestModel({
    required this.id,
    required this.testId,
    required this.title,
    this.examTitle,
    this.examId,
    this.status = 'upcoming',
    this.startAt,
    this.scheduledStartTime,
    this.scheduledEndTime,
    this.durationMinutes = 0,
    this.totalQuestions = 0,
    this.totalMarks = 0,
    this.negativeMarking,
    this.participantsCount = 0,
    this.enrolledCount = 0,
    this.logo,
    this.examLogo,
    this.rankingEnabled = true,
    this.subscriptionRequired = false,
    this.isPublished = true,
    this.instructions,
  });

  /// True if test is currently in progress
  bool get isLive {
    final s = status.toLowerCase();
    if (s == 'cancelled' || s == 'ended' || s == 'completed') return false;
    if (s == 'live') return true;

    final start = scheduledStartTime ?? startAt;
    if (start == null) return false;

    final now = DateTime.now();
    // Without a known end or duration the live window can't be computed
    // locally; rely on the server status (handled above).
    if (scheduledEndTime == null && durationMinutes <= 0) return false;
    final end = scheduledEndTime ?? start.add(Duration(minutes: durationMinutes));
    return now.isAfter(start) && now.isBefore(end);
  }

  /// True if test is scheduled for future
  bool get isUpcoming {
    if (isLive) return false;
    final s = status.toLowerCase();
    if (s == 'cancelled' || s == 'ended' || s == 'completed') return false;
    if (s == 'upcoming') return true;

    final start = scheduledStartTime ?? startAt;
    if (start == null) return true;
    return DateTime.now().isBefore(start);
  }

  /// Human-readable scheduled time display
  String get formattedTime {
    final start = scheduledStartTime ?? startAt;
    if (start == null) {
      return isLive ? 'Live Now' : 'Schedule Announced Soon';
    }

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final testDate = DateTime(start.year, start.month, start.day);
    final timeStr = DateFormat('h:mm a').format(start);

    if (testDate == today) {
      return 'Today, $timeStr';
    } else if (testDate == today.add(const Duration(days: 1))) {
      return 'Tomorrow, $timeStr';
    } else {
      return '${DateFormat('d MMM').format(start)}, $timeStr';
    }
  }

  /// Nicely formatted participant count (e.g. 2.4K, 1.2K, 850)
  String? get formattedParticipants {
    final count = participantsCount > 0 ? participantsCount : enrolledCount;
    if (count <= 0) return null;
    if (count >= 1000) {
      final k = count / 1000.0;
      final formatted = k.toStringAsFixed(1);
      return formatted.endsWith('.0')
          ? '${k.toInt()}K'
          : '${formatted}K';
    }
    return count.toString();
  }

  factory LiveTestModel.fromJson(Map<String, dynamic> json) {
    // Linked test data if joined from Supabase `tests`
    final joinedTest = json['tests'] is Map<String, dynamic>
        ? json['tests'] as Map<String, dynamic>
        : null;

    final rawTestId = json['test_id']?.toString() ??
        json['testId']?.toString() ??
        joinedTest?['id']?.toString() ??
        json['id']?.toString() ??
        '';

    final rawTitle = json['title']?.toString() ??
        joinedTest?['title']?.toString() ??
        '';

    final examData = joinedTest?['exams'] is Map<String, dynamic>
        ? joinedTest!['exams'] as Map<String, dynamic>
        : null;

    final rawExamTitle = json['exam_title']?.toString() ??
        json['examTitle']?.toString() ??
        examData?['title']?.toString() ??
        joinedTest?['exam_title']?.toString();

    final rawExamId = json['exam_id']?.toString() ??
        json['examId']?.toString() ??
        joinedTest?['exam_id']?.toString();

    DateTime? parseDate(dynamic value) {
      if (value == null) return null;
      if (value is DateTime) return value;
      try {
        return DateTime.parse(value.toString());
      } catch (_) {
        return null;
      }
    }

    final startAt = parseDate(json['start_at'] ?? json['startAt']);
    final schedStart = parseDate(
      json['scheduled_start_time'] ?? json['scheduledStartTime'] ?? json['start_at'],
    );
    final schedEnd = parseDate(
      json['scheduled_end_time'] ?? json['scheduledEndTime'],
    );

    final duration = (json['duration_minutes'] as num?)?.toInt() ??
        (json['durationMinutes'] as num?)?.toInt() ??
        (joinedTest?['duration_minutes'] as num?)?.toInt() ??
        0;

    final questions = (json['total_questions'] as num?)?.toInt() ??
        (json['totalQuestions'] as num?)?.toInt() ??
        (joinedTest?['total_questions'] as num?)?.toInt() ??
        0;

    final marks = (json['total_marks'] as num?)?.toDouble() ??
        (json['totalMarks'] as num?)?.toDouble() ??
        (joinedTest?['total_marks'] as num?)?.toDouble() ??
        0;

    final negMark = (json['negative_marking'] as num?)?.toDouble() ??
        (json['negativeMarking'] as num?)?.toDouble() ??
        (joinedTest?['negative_marking'] as num?)?.toDouble();

    final participants = (json['participants_count'] as num?)?.toInt() ??
        (json['participantsCount'] as num?)?.toInt() ??
        (json['enrolled_count'] as num?)?.toInt() ??
        (json['enrolledCount'] as num?)?.toInt() ??
        0;

    final enrolled = (json['enrolled_count'] as num?)?.toInt() ??
        (json['enrolledCount'] as num?)?.toInt() ??
        participants;

    return LiveTestModel(
      id: json['id']?.toString() ?? rawTestId,
      testId: rawTestId,
      title: rawTitle,
      examTitle: rawExamTitle,
      examId: rawExamId,
      status: json['status']?.toString() ?? 'upcoming',
      startAt: startAt,
      scheduledStartTime: schedStart,
      scheduledEndTime: schedEnd,
      durationMinutes: duration,
      totalQuestions: questions,
      totalMarks: marks,
      negativeMarking: negMark,
      participantsCount: participants,
      enrolledCount: enrolled,
      logo: json['logo']?.toString() ?? json['exam_logo']?.toString(),
      examLogo: json['exam_logo']?.toString() ?? json['logo']?.toString(),
      rankingEnabled: json['ranking_enabled'] as bool? ?? true,
      subscriptionRequired: json['subscription_required'] as bool? ?? false,
      isPublished: json['is_published'] as bool? ?? true,
      instructions: json['instructions']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'test_id': testId,
    'title': title,
    'exam_title': examTitle,
    'exam_id': examId,
    'status': status,
    'start_at': startAt?.toIso8601String(),
    'scheduled_start_time': scheduledStartTime?.toIso8601String(),
    'scheduled_end_time': scheduledEndTime?.toIso8601String(),
    'duration_minutes': durationMinutes,
    'total_questions': totalQuestions,
    'total_marks': totalMarks,
    'negative_marking': negativeMarking,
    'participants_count': participantsCount,
    'enrolled_count': enrolledCount,
    'logo': logo,
    'exam_logo': examLogo,
    'ranking_enabled': rankingEnabled,
    'subscription_required': subscriptionRequired,
    'is_published': isPublished,
    'instructions': instructions,
  };
}

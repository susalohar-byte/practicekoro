class SupportMessageModel {
  final String id;
  final String ticketId;
  final String authorName;
  final String authorKind; // 'student' | 'support' | 'internal_note'
  final String body;
  final DateTime createdAt;

  const SupportMessageModel({
    required this.id,
    required this.ticketId,
    required this.authorName,
    required this.authorKind,
    required this.body,
    required this.createdAt,
  });

  bool get isFromAdmin => authorKind == 'support';
  bool get isFromStudent => authorKind == 'student';

  factory SupportMessageModel.fromJson(Map<String, dynamic> json) {
    return SupportMessageModel(
      id: json['id']?.toString() ?? '',
      ticketId: json['ticket_id']?.toString() ?? '',
      authorName: json['author_name']?.toString() ?? 'Support Staff',
      authorKind: json['author_kind']?.toString() ?? 'support',
      body: json['body']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ticket_id': ticketId,
        'author_name': authorName,
        'author_kind': authorKind,
        'body': body,
        'created_at': createdAt.toIso8601String(),
      };
}

class SupportTicketModel {
  final String id;
  final String? userId;
  final String studentName;
  final String studentEmail;
  final String subject;
  final String issue;
  final String category;
  final String priority;
  final String status;
  final String? resolutionNotes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<SupportMessageModel> messages;

  const SupportTicketModel({
    required this.id,
    this.userId,
    required this.studentName,
    required this.studentEmail,
    required this.subject,
    required this.issue,
    required this.category,
    this.priority = 'medium',
    this.status = 'open',
    this.resolutionNotes,
    required this.createdAt,
    required this.updatedAt,
    this.messages = const [],
  });

  String get ticketNumber {
    final clean = id.replaceAll('-', '');
    final short = clean.length >= 8 ? clean.substring(0, 8).toUpperCase() : clean.toUpperCase();
    return '#PKT-$short';
  }

  bool get isOpen => status == 'open' || status == 'Open';
  bool get isPending => status == 'pending' || status == 'In Progress';
  bool get isResolved => status == 'resolved' || status == 'Resolved';
  bool get isClosed => status == 'closed' || status == 'Closed';

  String get displayStatus {
    if (isResolved) return 'Resolved';
    if (isClosed) return 'Closed';
    if (isPending) return 'In Progress';
    return 'Open';
  }

  factory SupportTicketModel.fromJson(Map<String, dynamic> json) {
    final rawMessages = json['support_ticket_messages'] as List? ??
        json['messages'] as List? ??
        [];
    final msgs = rawMessages
        .whereType<Map>()
        .map((m) => SupportMessageModel.fromJson(Map<String, dynamic>.from(m)))
        .where((m) => m.authorKind != 'internal_note')
        .toList()
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));

    return SupportTicketModel(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString(),
      studentName: json['student_name']?.toString() ?? 'Student',
      studentEmail: json['student_email']?.toString() ?? '',
      subject: json['subject']?.toString() ?? '',
      issue: json['issue']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Other',
      priority: json['priority']?.toString() ?? 'medium',
      status: json['status']?.toString() ?? 'open',
      resolutionNotes: json['resolution_notes']?.toString(),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      updatedAt: DateTime.tryParse(json['updated_at']?.toString() ?? '') ??
          DateTime.now(),
      messages: msgs,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_id': userId,
        'student_name': studentName,
        'student_email': studentEmail,
        'subject': subject,
        'issue': issue,
        'category': category,
        'priority': priority,
        'status': status,
        'resolution_notes': resolutionNotes,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
        'messages': messages.map((m) => m.toJson()).toList(),
      };

  SupportTicketModel copyWith({
    String? status,
    String? resolutionNotes,
    List<SupportMessageModel>? messages,
    DateTime? updatedAt,
  }) {
    return SupportTicketModel(
      id: id,
      userId: userId,
      studentName: studentName,
      studentEmail: studentEmail,
      subject: subject,
      issue: issue,
      category: category,
      priority: priority,
      status: status ?? this.status,
      resolutionNotes: resolutionNotes ?? this.resolutionNotes,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      messages: messages ?? this.messages,
    );
  }
}

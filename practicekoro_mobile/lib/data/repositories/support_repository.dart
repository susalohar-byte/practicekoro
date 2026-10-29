import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../datasources/local_storage.dart';
import '../models/support_ticket_model.dart';
import 'auth_repository.dart';

class SupportContactSettings {
  final String email;
  final String whatsapp;
  final String phone;
  final String hours;

  const SupportContactSettings({
    this.email = 'support@practicekoro.online',
    this.whatsapp = '+91 98765 43210',
    this.phone = '+91 98765 43210',
    this.hours = 'Mon - Sat: 10:00 AM - 7:00 PM (IST)',
  });
}

final supportSettingsProvider =
    FutureProvider<SupportContactSettings>((ref) async {
  return const SupportRepository().fetchContactSettings();
});

final studentTicketsProvider =
    AsyncNotifierProvider<StudentTicketsNotifier, List<SupportTicketModel>>(
  StudentTicketsNotifier.new,
);

class StudentTicketsNotifier
    extends AsyncNotifier<List<SupportTicketModel>> {
  @override
  Future<List<SupportTicketModel>> build() async {
    return const SupportRepository().getStudentTickets();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => const SupportRepository().getStudentTickets(),
    );
  }

  Future<SupportTicketModel> submitTicket({
    required String subject,
    required String issue,
    required String category,
    String priority = 'medium',
    String? studentName,
    String? studentEmail,
  }) async {
    final ticket = await const SupportRepository().createTicket(
      subject: subject,
      issue: issue,
      category: category,
      priority: priority,
      studentName: studentName,
      studentEmail: studentEmail,
    );
    await refresh();
    return ticket;
  }
}

class SupportRepository {
  const SupportRepository();

  /// Columns [SupportTicketModel.fromJson] reads. Messages are not included:
  /// they load per ticket when it is opened ([getTicketMessages]).
  static const _ticketColumns =
      'id, user_id, student_name, student_email, subject, issue, category, '
      'priority, status, resolution_notes, created_at, updated_at';
  static const _messageColumns =
      'id, ticket_id, author_name, author_kind, body, created_at';

  /// The ticket list shows the student's latest tickets only.
  static const ticketListLimit = 50;
  static const messageLimit = 200;

  /// Fetches official support channels from Supabase `public.app_settings`.
  /// Admin updates in Platform Info card automatically propagate here.
  Future<SupportContactSettings> fetchContactSettings() async {
    final client = supabaseClient;
    if (client == null) return const SupportContactSettings();

    try {
      final rows = await client
          .from('app_settings')
          .select('id, value')
          .inFilter('id', [
            'general_support_email',
            'general_support_whatsapp',
            'general_support_phone',
            'general_support_hours',
          ])
          .timeout(const Duration(seconds: 4));

      String? email;
      String? whatsapp;
      String? phone;
      String? hours;

      for (final row in rows) {
        final id = row['id']?.toString();
        final raw = row['value'];
        final val = _unwrap(raw)?.toString().trim();
        if (val == null || val.isEmpty) continue;

        if (id == 'general_support_email') email = val;
        if (id == 'general_support_whatsapp') whatsapp = val;
        if (id == 'general_support_phone') phone = val;
        if (id == 'general_support_hours') hours = val;
      }

      return SupportContactSettings(
        email: email ?? 'support@practicekoro.online',
        whatsapp: whatsapp ?? '+91 98765 43210',
        phone: phone ?? '+91 98765 43210',
        hours: hours ?? 'Mon - Sat: 10:00 AM - 7:00 PM (IST)',
      );
    } catch (e) {
      debugPrint('Support settings fetch warning: $e');
      return const SupportContactSettings();
    }
  }

  /// Fetches support tickets created by the current student.
  Future<List<SupportTicketModel>> getStudentTickets() async {
    final client = supabaseClient;
    final currentUser = client?.auth.currentUser;

    if (client != null && currentUser != null) {
      try {
        final res = await client
            .from('support_tickets')
            .select(_ticketColumns)
            .eq('user_id', currentUser.id)
            .order('created_at', ascending: false)
            .limit(ticketListLimit)
            .timeout(const Duration(seconds: 6));

        final list = (res as List)
            .whereType<Map>()
            .map(
              (m) => SupportTicketModel.fromJson(Map<String, dynamic>.from(m)),
            )
            .toList();
        await LocalStorageService.saveAllTicketsLocally(
          list.map((t) => t.toJson()).toList(),
        );
        return list;
      } catch (err) {
        debugPrint('Error fetching student tickets from Supabase: $err');
      }
    }

    // Older app versions kept unsent tickets ("pkt_" ids) on the phone only;
    // they never reached support, so do not list them as open tickets.
    final cached = LocalStorageService.getSavedTickets()
        .where((e) => !(e['id']?.toString() ?? '').startsWith('pkt_'));
    return cached.map((e) => SupportTicketModel.fromJson(e)).toList();
  }

  /// Creates a support ticket in Supabase `public.support_tickets`, which instantly
  /// appears in the Admin Support Desk (`http://localhost:5173/admin/support`).
  Future<SupportTicketModel> createTicket({
    required String subject,
    required String issue,
    required String category,
    String priority = 'medium',
    String? studentName,
    String? studentEmail,
  }) async {
    final client = supabaseClient;
    final currentUser = client?.auth.currentUser;
    final name = (studentName != null && studentName.isNotEmpty)
        ? studentName
        : (LocalStorageService.getUserName().isNotEmpty
            ? LocalStorageService.getUserName()
            : 'Student');
    final email = (studentEmail != null && studentEmail.isNotEmpty)
        ? studentEmail
        : (LocalStorageService.getUserEmail().isNotEmpty
            ? LocalStorageService.getUserEmail()
            : (currentUser?.email ?? 'student@practicekoro.online'));

    if (client != null) {
      // 1. Try create_support_ticket RPC
      try {
        final rpcRes = await client.rpc('create_support_ticket', params: {
          'p_student_name': name,
          'p_student_email': email,
          'p_subject': subject.trim(),
          'p_issue': issue.trim(),
          'p_category': category,
          'p_priority': priority,
          if (currentUser != null) 'p_user_id': currentUser.id,
        }).timeout(const Duration(seconds: 6));

        if (rpcRes != null && rpcRes is Map && rpcRes['ticket'] != null) {
          final model = SupportTicketModel.fromJson(
            Map<String, dynamic>.from(rpcRes['ticket']),
          );
          await LocalStorageService.saveTicketLocally(model.toJson());
          return model;
        }
      } catch (rpcErr) {
        debugPrint('create_support_ticket RPC failed: $rpcErr');
      }

      // 2. Direct insert into public.support_tickets table
      try {
        final insertPayload = <String, dynamic>{
          if (currentUser != null) 'user_id': currentUser.id,
          'student_name': name,
          'student_email': email,
          'subject': subject.trim(),
          'issue': issue.trim(),
          'category': category,
          'priority': priority,
          'status': 'open',
        };

        final row = await client
            .from('support_tickets')
            .insert(insertPayload)
            .select(_ticketColumns)
            .single()
            .timeout(const Duration(seconds: 6));

        final model = SupportTicketModel.fromJson(Map<String, dynamic>.from(row));
        await LocalStorageService.saveTicketLocally(model.toJson());
        return model;
      } catch (insertErr) {
        debugPrint('Direct support_tickets insert failed: $insertErr');
      }
    }

    // Not saved on the server: say so, so the student can retry. A ticket kept
    // only on this phone would never reach the support team.
    throw const SupportTicketFailure();
  }

  /// The conversation on one ticket, oldest first, without internal notes.
  /// Returns null when it could not be loaded (offline or server error).
  Future<List<SupportMessageModel>?> getTicketMessages(String ticketId) async {
    final client = supabaseClient;
    if (client == null || client.auth.currentUser == null) return null;
    try {
      final rows = await client
          .from('support_ticket_messages')
          .select(_messageColumns)
          .eq('ticket_id', ticketId)
          .neq('author_kind', 'internal_note')
          .order('created_at', ascending: true)
          .limit(messageLimit)
          .timeout(const Duration(seconds: 6));
      return rows
          .map((m) => SupportMessageModel.fromJson(Map<String, dynamic>.from(m)))
          .where((m) => m.authorKind != 'internal_note')
          .toList();
    } catch (e) {
      debugPrint('Error fetching support ticket messages: $e');
      return null;
    }
  }

  /// Sends a reply on an existing ticket from the student.
  Future<SupportMessageModel?> sendTicketMessage({
    required String ticketId,
    required String body,
    String? authorName,
  }) async {
    final client = supabaseClient;
    final currentUser = client?.auth.currentUser;
    final name = (authorName != null && authorName.isNotEmpty)
        ? authorName
        : (LocalStorageService.getUserName().isNotEmpty
            ? LocalStorageService.getUserName()
            : 'Student');

    if (client != null && currentUser != null && body.trim().isNotEmpty) {
      try {
        final row = await client
            .from('support_ticket_messages')
            .insert({
              'ticket_id': ticketId,
              'author_id': currentUser.id,
              'author_name': name,
              'author_kind': 'student',
              'body': body.trim(),
            })
            .select(_messageColumns)
            .single()
            .timeout(const Duration(seconds: 6));

        return SupportMessageModel.fromJson(Map<String, dynamic>.from(row));
      } catch (e) {
        debugPrint('Error inserting support_ticket_message: $e');
      }
    }
    return null;
  }

  static Object? _unwrap(Object? value) {
    if (value is String) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is num || decoded is String) return decoded;
      } catch (_) {}
    }
    return value;
  }
}

/// The ticket could not be saved on the server.
class SupportTicketFailure implements Exception {
  const SupportTicketFailure();
  @override
  String toString() =>
      'Your ticket was not sent. Check your internet and try again.';
}

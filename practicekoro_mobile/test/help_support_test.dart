import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/models/support_ticket_model.dart';
import 'package:practicekoro_mobile/data/repositories/support_repository.dart';
import 'package:practicekoro_mobile/features/support/help_support_screen.dart';

void main() {
  testWidgets('HelpSupportScreen displays Ticket Desk, Email, WhatsApp, Phone and FAQs', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    const customSettings = SupportContactSettings(
      email: 'custom@practicekoro.online',
      whatsapp: '+91 99999 88888',
      phone: '+91 77777 66666',
      hours: 'Mon - Fri: 9:00 AM - 6:00 PM',
    );

    final mockTicket = SupportTicketModel(
      id: '12345678-abcd-ef01-2345-6789abcdef01',
      studentName: 'Susanta Lohar',
      studentEmail: 'susanta@example.com',
      subject: 'Pro pass payment issue',
      issue: 'Payment completed via PhonePe but pro not unlocked',
      category: 'Payment Issue',
      priority: 'high',
      status: 'open',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          supportSettingsProvider.overrideWith(
            (ref) => Future.value(customSettings),
          ),
          studentTicketsProvider.overrideWith(
            () => _FakeStudentTicketsNotifier([mockTicket]),
          ),
        ],
        child: const MaterialApp(
          home: Scaffold(body: HelpSupportScreen()),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verify Title and Header
    expect(find.text('Help & Support'), findsOneWidget);
    expect(find.text('We are here to help'), findsOneWidget);

    // Verify Ticket Support option
    expect(find.text('Raise a Support Ticket'), findsOneWidget);
    expect(find.text('TICKET DESK'), findsOneWidget);

    // Verify Email Support
    expect(find.text('Email support'), findsOneWidget);
    expect(find.text('custom@practicekoro.online'), findsOneWidget);

    // Verify WhatsApp Support
    expect(find.text('WhatsApp support'), findsOneWidget);
    expect(find.text('+91 99999 88888 • Instant Chat'), findsOneWidget);
    expect(find.text('FAST REPLY'), findsOneWidget);

    // Verify Phone Helpline
    expect(find.text('Helpline call'), findsOneWidget);
    expect(find.text('+91 77777 66666'), findsOneWidget);

    // Verify Support Hours
    expect(
      find.text('Support Hours: Mon - Fri: 9:00 AM - 6:00 PM'),
      findsOneWidget,
    );

    // Verify My Support Tickets section
    expect(find.text('My Support Tickets'), findsOneWidget);
    expect(find.text('#PKT-12345678'), findsOneWidget);
    expect(find.text('Pro pass payment issue'), findsOneWidget);
    expect(find.text('OPEN'), findsOneWidget);

    // Verify Common Questions
    expect(find.text('Common questions'), findsOneWidget);
    expect(find.text('Where are my results saved?'), findsOneWidget);

    // Tap on Raise a Support Ticket
    await tester.tap(find.text('Raise a Support Ticket'));
    await tester.pumpAndSettle();

    // Verify Create Ticket bottom sheet opened
    expect(find.text('Category'), findsOneWidget);
    expect(find.text('Subject'), findsOneWidget);
    expect(find.text('Description / Details'), findsOneWidget);
    expect(find.text('Submit Ticket'), findsOneWidget);
  });
}

class _FakeStudentTicketsNotifier extends StudentTicketsNotifier {
  final List<SupportTicketModel> initial;

  _FakeStudentTicketsNotifier(this.initial);

  @override
  Future<List<SupportTicketModel>> build() async {
    return initial;
  }
}

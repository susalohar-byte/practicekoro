import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/data/models/subscription_model.dart';
import 'package:practicekoro_mobile/data/repositories/subscription_repository.dart';
import 'package:practicekoro_mobile/features/subscription/checkout_screen.dart';
import 'package:practicekoro_mobile/features/subscription/plans_screen.dart';

StudentSubscriptionModel _pass({
  required String planId,
  required String title,
  required int durationDays,
  required int daysUsed,
  List<SubscriptionUpgradeOption> upgrades = const [],
}) {
  final starts = DateTime.now().subtract(Duration(days: daysUsed));
  final expires = starts.add(Duration(days: durationDays));
  final active = expires.isAfter(DateTime.now());
  return StudentSubscriptionModel(
    hasSubscription: true,
    isActive: active,
    status: active ? 'active' : 'expired',
    planId: planId,
    planTitle: title,
    durationDays: durationDays,
    purchasedAt: starts,
    startsAt: starts,
    expiresAt: expires,
    upgradeOptions: upgrades,
  );
}

Widget _app(Widget child, StudentSubscriptionModel sub) => ProviderScope(
  overrides: [studentSubscriptionProvider.overrideWith((ref) async => sub)],
  child: MaterialApp(home: child),
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await LocalStorageService.init();
  });

  group('StudentSubscriptionModel validity', () {
    test('parses purchase date and upgrade options from the RPC', () {
      final model = StudentSubscriptionModel.fromJson({
        'has_subscription': true,
        'is_active': true,
        'status': 'active',
        'plan_id': 'plan_6_month',
        'plan_title': '6-Months Pro Pass',
        'duration_days': 180,
        'purchased_at': '2026-10-01T10:00:00Z',
        'starts_at': '2026-10-01T10:00:00Z',
        'expires_at': '2099-03-30T10:00:00Z',
        'upgrade_options': [
          {
            'plan_id': 'pro_1_year',
            'plan_title': '1-Year All-Access Pro Pass',
            'duration_days': 365,
            'amount': 100,
            'currency': 'INR',
            'new_expires_at': '2099-10-01T10:00:00Z',
            'eligible': true,
            'purchase_type': 'upgrade',
          },
        ],
      });

      expect(model.purchaseDate, DateTime.parse('2026-10-01T10:00:00Z'));
      expect(model.canUpgrade, isTrue);
      expect(model.upgradeOptions.single.amount, 100);
      expect(model.upgradeOptions.single.planId, 'pro_1_year');

      // Round-trips through the offline cache.
      final cached = StudentSubscriptionModel.fromJson(model.toJson());
      expect(
        cached.upgradeOptions.single.newExpiresAt,
        model.upgradeOptions.single.newExpiresAt,
      );
    });

    test('remaining validity counts down from the stored expiry', () {
      final sixMonth = _pass(
        planId: 'plan_6_month',
        title: '6-Months Pro Pass',
        durationDays: 180,
        daysUsed: 10,
      );
      expect(sixMonth.isCurrentlyActive, isTrue);
      expect(sixMonth.remainingDays, 170);
      expect(sixMonth.remainingLabel, '5 months 20 days');

      final oneYear = _pass(
        planId: 'pro_1_year',
        title: '1-Year All-Access Pro Pass',
        durationDays: 365,
        daysUsed: 0,
      );
      expect(oneYear.remainingDays, 365);
      expect(oneYear.remainingLabel, '1 year');
    });

    test('a pass past its expiry is expired even if cached as active', () {
      final stale = _pass(
        planId: 'plan_6_month',
        title: '6-Months Pro Pass',
        durationDays: 180,
        daysUsed: 200,
      ).copyWith(isActive: true, status: 'active');

      expect(stale.isCurrentlyActive, isFalse);
      expect(stale.remainingDays, 0);
      expect(stale.remainingLabel, 'Expired');
      expect(stale.canUpgrade, isFalse);
    });
  });

  group('Pro Pass screen', () {
    testWidgets('6-month pass shows validity and only the 1-year upgrade', (
      tester,
    ) async {
      final sub = _pass(
        planId: 'plan_6_month',
        title: '6-Months Pro Pass',
        durationDays: 180,
        daysUsed: 30,
        upgrades: [
          SubscriptionUpgradeOption(
            planId: 'pro_1_year',
            planTitle: '1-Year All-Access Pro Pass',
            durationDays: 365,
            amount: 100,
            newExpiresAt: DateTime.now().add(const Duration(days: 335)),
          ),
        ],
      );
      await tester.pumpWidget(_app(const PlansScreen(), sub));
      await tester.pumpAndSettle();

      expect(find.text('Purchased on'), findsOneWidget);
      expect(find.text('Valid until'), findsOneWidget);
      expect(find.text('150 days'), findsOneWidget);
      expect(
        find.text('Upgrade to 1-Year All-Access Pro Pass'),
        findsOneWidget,
      );
      expect(find.text('Upgrade for ₹100'), findsOneWidget);
      expect(find.text('Available Packages'), findsNothing);
    });

    testWidgets('1-year pass shows no plans and no upgrade', (tester) async {
      final sub = _pass(
        planId: 'pro_1_year',
        title: '1-Year All-Access Pro Pass',
        durationDays: 365,
        daysUsed: 30,
      );
      await tester.pumpWidget(_app(const PlansScreen(), sub));
      await tester.pumpAndSettle();

      expect(find.text('Valid until'), findsOneWidget);
      expect(find.textContaining('Upgrade'), findsNothing);
      expect(find.text('Available Packages'), findsNothing);
      expect(
        find.textContaining('Plans will be available again'),
        findsOneWidget,
      );
    });

    testWidgets('expired pass shows the plans again', (tester) async {
      final sub = _pass(
        planId: 'plan_6_month',
        title: '6-Months Pro Pass',
        durationDays: 180,
        daysUsed: 181,
      );
      await tester.pumpWidget(_app(const PlansScreen(), sub));
      await tester.pumpAndSettle();

      expect(find.textContaining('expired on'), findsOneWidget);
      expect(find.text('Available Packages'), findsOneWidget);
      expect(find.text('Purchased on'), findsNothing);
    });
  });

  group('Checkout', () {
    testWidgets('upgrade checkout charges only the difference', (tester) async {
      final sub = _pass(
        planId: 'plan_6_month',
        title: '6-Months Pro Pass',
        durationDays: 180,
        daysUsed: 30,
        upgrades: [
          SubscriptionUpgradeOption(
            planId: 'pro_1_year',
            planTitle: '1-Year All-Access Pro Pass',
            amount: 100,
            newExpiresAt: DateTime.now().add(const Duration(days: 335)),
          ),
        ],
      );
      await tester.pumpWidget(
        _app(const CheckoutScreen(planId: 'pro_1_year'), sub),
      );
      await tester.pumpAndSettle();

      expect(find.text('Upgrade Breakdown'), findsOneWidget);
      expect(find.text('Upgrade for ₹100'), findsOneWidget);
    });

    testWidgets('active 1-year pass cannot buy another plan', (tester) async {
      final sub = _pass(
        planId: 'pro_1_year',
        title: '1-Year All-Access Pro Pass',
        durationDays: 365,
        daysUsed: 30,
      );
      await tester.pumpWidget(
        _app(const CheckoutScreen(planId: 'plan_6_month'), sub),
      );
      await tester.pumpAndSettle();

      expect(find.text('Pass already active'), findsOneWidget);
    });
  });
}

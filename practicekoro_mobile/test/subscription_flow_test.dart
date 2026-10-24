import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/data/models/subscription_model.dart';
import 'package:practicekoro_mobile/data/repositories/subscription_repository.dart';
import 'package:practicekoro_mobile/features/subscription/plans_screen.dart';
import 'package:practicekoro_mobile/features/subscription/checkout_screen.dart';
import 'package:practicekoro_mobile/features/settings/settings_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await LocalStorageService.init();
  });

  group('Subscription Models & Calculations', () {
    test('SubscriptionPlanModel correctly parses JSON and computes discounts', () {
      final json = {
        'id': 'pro_1_year',
        'name': 'PracticeKoro Pro Pass',
        'title': '1-Year All-Access Pro Pass',
        'description': 'Universal access to all tests',
        'duration_days': 365,
        'price': 299,
        'original_price': 999,
        'currency': 'INR',
        'features': [
          'All Full Mock Tests',
          'Detailed Solutions',
        ],
        'is_active': true,
        'order_index': 3,
        'renewal_window_days': 30,
      };

      final plan = SubscriptionPlanModel.fromJson(json);

      expect(plan.id, 'pro_1_year');
      expect(plan.title, '1-Year All-Access Pro Pass');
      expect(plan.price, 299.0);
      expect(plan.originalPrice, 999.0);
      expect(plan.durationDays, 365);
      expect(plan.formattedDuration, '1 Year');
      expect(plan.discountPercentage, 70);
      expect(plan.savingsAmount, 700);
      expect(plan.isFree, isFalse);
      expect(plan.features.length, 2);
    });

    test('SubscriptionPlanModel free plan detection', () {
      final freePlan = SubscriptionPlanModel.fromJson({
        'id': 'plan_free',
        'title': 'Free Starter',
        'price': 0,
        'duration_days': 365,
      });

      expect(freePlan.isFree, isTrue);
      expect(freePlan.discountPercentage, 0);
    });

    test('StudentSubscriptionModel serialization and status check', () {
      final now = DateTime.now();
      final future = now.add(const Duration(days: 180));

      final sub = StudentSubscriptionModel(
        hasSubscription: true,
        isActive: true,
        status: 'active',
        subscriptionId: 'sub_test_123',
        planId: 'plan_6_month',
        planTitle: '6-Months Pro Pass',
        durationDays: 180,
        startsAt: now,
        expiresAt: future,
        daysRemaining: 180,
      );

      final json = sub.toJson();
      final restored = StudentSubscriptionModel.fromJson(json);

      expect(restored.hasSubscription, isTrue);
      expect(restored.isActive, isTrue);
      expect(restored.isExpired, isFalse);
      expect(restored.planId, 'plan_6_month');
      expect(restored.daysRemaining, 180);
      expect(restored.formattedExpiry, contains(future.year.toString()));
    });
  });

  group('LocalStorage & Subscription Persistence', () {
    test('saveSubscriptionDetails and getSubscriptionDetails work roundtrip', () async {
      expect(LocalStorageService.getSubscriptionDetails(), isNull);

      final details = {
        'has_subscription': true,
        'is_active': true,
        'status': 'active',
        'plan_id': 'pro_1_year',
        'plan_title': '1-Year All-Access Pro Pass',
        'days_remaining': 365,
      };

      await LocalStorageService.saveSubscriptionDetails(details);
      final retrieved = LocalStorageService.getSubscriptionDetails();

      expect(retrieved, isNotNull);
      expect(retrieved!['plan_id'], 'pro_1_year');
      expect(retrieved['is_active'], isTrue);
    });

    test('saveCachedPlans and getCachedPlans work roundtrip', () async {
      final plans = [
        {
          'id': 'plan_6_month',
          'title': '6 Months',
          'price': 199.0,
          'duration_days': 180,
        }
      ];

      await LocalStorageService.saveCachedPlans(plans);
      final cached = LocalStorageService.getCachedPlans();

      expect(cached, isNotNull);
      expect(cached!.length, 1);
      expect(cached.first['id'], 'plan_6_month');
    });

    test('clearAccountData cleans subscription details', () async {
      await LocalStorageService.setIsPro(true);
      await LocalStorageService.saveSubscriptionDetails({'has_subscription': true});
      await LocalStorageService.saveCachedPlans([{'id': 'p1'}]);

      expect(LocalStorageService.getIsPro(), isTrue);
      expect(LocalStorageService.getSubscriptionDetails(), isNotNull);

      await LocalStorageService.clearAccountData();

      expect(LocalStorageService.getIsPro(), isFalse);
      expect(LocalStorageService.getSubscriptionDetails(), isNull);
      expect(LocalStorageService.getCachedPlans(), isNull);
    });
  });

  group('Subscription Repository', () {
    test('getSubscriptionPlans returns plans with fallback when Supabase uninitialized', () async {
      const repo = SubscriptionRepository();
      final plans = await repo.getSubscriptionPlans();

      expect(plans, isNotEmpty);
      expect(plans.any((p) => p.id == 'pro_1_year'), isTrue);
      expect(plans.any((p) => p.id == 'plan_6_month'), isTrue);
    });

    test('getStudentSubscriptionDetails returns inactive state when not signed in', () async {
      const repo = SubscriptionRepository();
      final sub = await repo.getStudentSubscriptionDetails();

      expect(sub.hasSubscription, isFalse);
      expect(sub.isActive, isFalse);
    });

    test('createRazorpayOrder never fabricates an order without the server', () async {
      const repo = SubscriptionRepository();
      // Signed out / offline: no server record could ever activate the payment.
      await expectLater(
        repo.createRazorpayOrder('pro_1_year'),
        throwsA(isA<Exception>()),
      );
    });

    test('SubscriptionOrderModel detects real Razorpay orders from Edge Function', () {
      final liveEdgeJson = {
        'verification_version': 2,
        'order_id': 'order_NqK9abcdef123',
        'payment_id': 'pay_pending_987',
        'plan_id': 'pro_1_year',
        'plan_title': '1-Year All-Access Pro Pass',
        'amount': 299,
        'currency': 'INR',
        'duration_days': 365,
        'key_id': 'rzp_live_998877665544',
      };

      final order = SubscriptionOrderModel.fromJson(liveEdgeJson);

      expect(order.isRealRazorpayOrder, isTrue);
      expect(order.orderId, 'order_NqK9abcdef123');
      expect(order.keyId, 'rzp_live_998877665544');
      expect(order.amount, 299.0);
    });

    test('SubscriptionOrderModel flags dummy offline test orders as not real', () {
      final mockJson = {
        'order_id': 'order_sim_123456',
        'payment_id': 'pay_sim_123456',
        'plan_id': 'pro_1_year',
        'plan_title': '1-Year All-Access Pro Pass',
        'amount': 299,
        'currency': 'INR',
        'duration_days': 365,
        'key_id': 'rzp_test_practicekoro_key',
        'is_real_razorpay_order': false,
      };

      final order = SubscriptionOrderModel.fromJson(mockJson);

      expect(order.isRealRazorpayOrder, isFalse);
    });
  });

  group('Widget & UI Flow Tests', () {
    testWidgets('PlansScreen renders available subscription packages', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: PlansScreen(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Plans & Membership'), findsOneWidget);
      expect(find.text('Available Packages'), findsOneWidget);
      expect(find.textContaining('Free Plan'), findsOneWidget);
      expect(find.textContaining('1-Year All-Access Pro Pass'), findsOneWidget);
      expect(find.textContaining('6-Months Pro Pass'), findsOneWidget);
      expect(find.text('Why Aspirants Choose Pro'), findsOneWidget);
    });

    testWidgets('CheckoutScreen renders plan details, price breakdown, and payment method selector', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CheckoutScreen(planId: 'pro_1_year'),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Order Summary'), findsOneWidget);
      expect(find.text('Price Breakdown'), findsOneWidget);
      expect(find.text('Plan MRP'), findsOneWidget);
      expect(find.text('Special Offer Discount'), findsOneWidget);
      expect(find.text('Total Payable'), findsOneWidget);
      expect(find.text('Select Payment Method'), findsOneWidget);
      expect(find.text('Wallets, UPI & QR Code'), findsOneWidget);
      expect(find.text('PREFERRED'), findsOneWidget);
      expect(find.text('Credit / Debit Card'), findsOneWidget);
      expect(find.text('Net Banking'), findsOneWidget);
      expect(find.textContaining('Pay ₹299 Now'), findsOneWidget);
    });

    testWidgets('SettingsScreen displays Plans option', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );

      await tester.pump();

      expect(find.text('Membership & Subscription'), findsOneWidget);
      expect(find.text('Plans'), findsOneWidget);
      expect(find.text('Get Pro'), findsOneWidget);
    });
  });
}

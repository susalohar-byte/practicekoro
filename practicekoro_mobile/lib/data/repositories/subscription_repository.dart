import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../datasources/local_storage.dart';
import '../models/subscription_model.dart';
import 'auth_repository.dart';
import 'profile_repository.dart';

final subscriptionRepositoryProvider = Provider<SubscriptionRepository>((ref) {
  return const SubscriptionRepository();
});

/// Dynamic subscription plans loaded from Supabase `subscription_plans`.
final subscriptionPlansProvider =
    FutureProvider<List<SubscriptionPlanModel>>((ref) async {
  final repo = ref.watch(subscriptionRepositoryProvider);
  return repo.getSubscriptionPlans();
});

/// Current student's subscription details loaded from Supabase or cached locally.
final studentSubscriptionProvider =
    FutureProvider<StudentSubscriptionModel>((ref) async {
  final repo = ref.watch(subscriptionRepositoryProvider);
  final result = await repo.loadStudentSubscription();

  // The profile's Pro flag gates premium tests app-wide: keep it in step with the
  // pass so an expired pass locks them again (and a new one unlocks them).
  if (result.authoritative) {
    final isActive = result.model.isCurrentlyActive;
    final profile = ref.read(studentProfileProvider);
    if (profile.isPro != isActive) {
      await ref
          .read(studentProfileProvider.notifier)
          .save(profile.copyWith(isPro: isActive));
    }
  }
  return result.model;
});

class SubscriptionRepository {
  const SubscriptionRepository();

  /// A paid plan without a duration from the server can't be described
  /// honestly (validity unknown), so it is not offered.
  static bool _hasKnownDuration(SubscriptionPlanModel p) =>
      p.isFree || p.durationDays > 0;

  /// Fetches active subscription packages from Supabase `subscription_plans` table.
  /// Falls back to the plans cached on the last successful load; with none,
  /// throws [PlansUnavailable].
  Future<List<SubscriptionPlanModel>> getSubscriptionPlans({
    bool forceRefresh = false,
  }) async {
    final client = supabaseClient;
    if (client != null) {
      try {
        final response = await client
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('order_index', ascending: true)
            .timeout(const Duration(seconds: 10));

        final plans = response
            .map((row) => SubscriptionPlanModel.fromJson(row))
            .where(_hasKnownDuration)
            .toList();

        // Cache locally for offline access
        await LocalStorageService.saveCachedPlans(
          plans.map((p) => p.toJson()).toList(),
        );
        return plans;
      } catch (err) {
        debugPrint('Failed to fetch subscription plans from Supabase: $err');
      }
    }

    // Try reading cached plans
    final cached = LocalStorageService.getCachedPlans();
    if (cached != null && cached.isNotEmpty) {
      final plans = cached
          .map((p) => SubscriptionPlanModel.fromJson(p))
          .where(_hasKnownDuration)
          .toList();
      if (plans.isNotEmpty) return plans;
    }

    // Never show made-up plans or prices: the screen offers a retry instead.
    throw const PlansUnavailable();
  }

  /// Gets the current student's subscription details. The server is the source of
  /// truth for purchase/expiry dates and upgrade eligibility; the cached copy is only
  /// used offline and is always judged against its stored expiry.
  Future<StudentSubscriptionModel> getStudentSubscriptionDetails() async {
    return (await loadStudentSubscription()).model;
  }

  /// Like [getStudentSubscriptionDetails], also saying whether the answer came from
  /// the server (or a cached pass) rather than "nothing known while offline".
  Future<({StudentSubscriptionModel model, bool authoritative})>
      loadStudentSubscription() async {
    final client = supabaseClient;
    final currentUser = client?.auth.currentUser;

    if (client != null && currentUser != null) {
      try {
        final rpcData = await client.rpc('get_student_subscription_details');
        if (rpcData != null && rpcData is Map) {
          final model = StudentSubscriptionModel.fromJson(
            Map<String, dynamic>.from(rpcData),
          );
          return (model: await _remember(model), authoritative: true);
        }
      } catch (err) {
        debugPrint('RPC get_student_subscription_details error: $err');
      }

      // Fallback: students may read their own subscription rows directly.
      try {
        final model = await _loadFromSubscriptionsTable(client, currentUser.id);
        return (model: await _remember(model), authoritative: true);
      } catch (err) {
        debugPrint('Direct query subscriptions table error: $err');
      }
    }

    final cached = LocalStorageService.getSubscriptionDetails();
    if (cached != null) {
      final model = StudentSubscriptionModel.fromJson(cached);
      if (model.hasSubscription) {
        // A cached pass whose expiry has passed is expired, even offline.
        await LocalStorageService.setIsPro(model.isCurrentlyActive);
        return (model: model, authoritative: true);
      }
    }

    return (model: const StudentSubscriptionModel(), authoritative: false);
  }

  Future<StudentSubscriptionModel> _remember(StudentSubscriptionModel model) async {
    await LocalStorageService.saveSubscriptionDetails(model.toJson());
    await LocalStorageService.setIsPro(model.isCurrentlyActive);
    return model;
  }

  /// Mirrors `get_student_subscription_details` for backends without that RPC.
  Future<StudentSubscriptionModel> _loadFromSubscriptionsTable(
    SupabaseClient client,
    String userId,
  ) async {
    final now = DateTime.now();
    final rows = await client
        .from('subscriptions')
        .select(
          '*, subscription_plans(title, duration_days, price, renewal_window_days)',
        )
        .eq('user_id', userId)
        .inFilter('status', ['active', 'expired'])
        .lte('starts_at', now.toUtc().toIso8601String())
        .order('expires_at', ascending: false)
        .limit(10);

    Map<String, dynamic>? planOf(Map<String, dynamic> row) =>
        row['subscription_plans'] as Map<String, dynamic>?;
    final paid = rows
        .where((r) => ((planOf(r)?['price'] as num?) ?? 0) > 0)
        .toList();
    if (paid.isEmpty) return const StudentSubscriptionModel();

    // Prefer the pass covering today; otherwise the latest one.
    final row = paid.firstWhere(
      (r) =>
          r['status'] == 'active' &&
          (DateTime.tryParse(r['expires_at']?.toString() ?? '')?.isAfter(now) ??
              false),
      orElse: () => paid.first,
    );
    final plan = planOf(row);
    final startsAt = DateTime.tryParse(row['starts_at']?.toString() ?? '');
    final expiresAt = DateTime.tryParse(row['expires_at']?.toString() ?? '');
    final active = row['status'] == 'active' &&
        expiresAt != null &&
        expiresAt.isAfter(now);
    final durationDays = (plan?['duration_days'] as num?)?.toInt();
    final price = (plan?['price'] as num?)?.toDouble() ?? 0;

    final upgrades = <SubscriptionUpgradeOption>[];
    if (active && startsAt != null && durationDays != null) {
      for (final p in await getSubscriptionPlans()) {
        final newExpiry = startsAt.add(Duration(days: p.durationDays));
        if (p.isFree ||
            !p.isActive ||
            p.durationDays <= durationDays ||
            p.price <= price ||
            !newExpiry.isAfter(expiresAt)) {
          continue;
        }
        upgrades.add(
          SubscriptionUpgradeOption(
            planId: p.id,
            planTitle: p.title,
            durationDays: p.durationDays,
            amount: p.price - price,
            currency: p.currency,
            newExpiresAt: newExpiry,
          ),
        );
      }
    }

    return StudentSubscriptionModel(
      hasSubscription: true,
      isActive: active,
      status: active ? 'active' : 'expired',
      subscriptionId: row['id']?.toString(),
      planId: row['plan_id']?.toString(),
      planTitle: plan?['title']?.toString() ?? 'Pro Pass',
      durationDays: durationDays,
      purchasedAt: DateTime.tryParse(row['created_at']?.toString() ?? ''),
      startsAt: startsAt,
      expiresAt: expiresAt,
      daysRemaining: active
          ? (expiresAt.difference(now).inHours / 24).ceil()
          : 0,
      renewalWindowDays: (plan?['renewal_window_days'] as num?)?.toInt(),
      upgradeOptions: upgrades,
    );
  }

  /// Fetches the active Razorpay Key ID from Supabase `app_settings` or falls back to live key.
  Future<String> getActiveRazorpayKey() async {
    final client = supabaseClient;
    if (client != null) {
      try {
        final res = await client
            .from('app_settings')
            .select('value')
            .eq('id', 'payment_gateway_razorpay_key_id')
            .maybeSingle();
        if (res != null && res['value'] != null) {
          final val = res['value'].toString().replaceAll('"', '').trim();
          if (val.startsWith('rzp_live_') || val.startsWith('rzp_test_')) {
            return val;
          }
        }
      } catch (e) {
        debugPrint('Error fetching razorpay key from app_settings: $e');
      }
    }
    return 'rzp_live_TdoDuJhIn8jWT5';
  }

  /// Creates a server order via the `create-razorpay-order` Edge Function. The server
  /// decides whether this is a new purchase or an upgrade and what it costs, and records
  /// the pending payment; without that record a payment could never be activated, so
  /// there is no client-side fallback.
  Future<SubscriptionOrderModel> createRazorpayOrder(String planId) async {
    final client = supabaseClient;
    final currentUser = client?.auth.currentUser;
    if (client == null || currentUser == null) {
      throw Exception('Please sign in to buy a Pro Pass.');
    }

    const fallbackError =
        'Could not start checkout. No money was deducted. Please try again in a moment.';
    try {
      final res = await client.functions.invoke(
        'create-razorpay-order',
        body: {'planId': planId},
      );
      final data = res.data;
      if (data is Map && data['error'] != null) {
        throw Exception(data['error'].toString());
      }
      if (res.status != 200 || data is! Map) {
        throw Exception(fallbackError);
      }
      final model = SubscriptionOrderModel.fromJson(
        Map<String, dynamic>.from(data),
      );
      if (model.orderId.isEmpty || model.amount <= 0) {
        throw Exception(fallbackError);
      }
      final keyId = (model.keyId != null &&
              model.keyId!.isNotEmpty &&
              !model.keyId!.contains('practicekoro_key'))
          ? model.keyId!
          : await getActiveRazorpayKey();
      return model.copyWith(keyId: keyId, isRealRazorpayOrder: true);
    } on FunctionException catch (fe) {
      debugPrint('create-razorpay-order FunctionException: ${fe.status} ${fe.details}');
      final details = fe.details;
      throw Exception(
        details is Map && details['error'] != null
            ? details['error'].toString()
            : fallbackError,
      );
    }
  }

  /// Verifies the payment with the backend, which activates or upgrades the pass and
  /// stores its purchase and expiry dates. The app only ever shows what the server stored.
  Future<SubscriptionVerificationResult> verifyAndActivatePayment({
    required String orderId,
    required String paymentId,
    required String signature,
    required String planId,
    required SubscriptionPlanModel plan,
    required WidgetRef ref,
  }) async {
    final client = supabaseClient;
    final currentUser = client?.auth.currentUser;
    String? serverError;

    if (client != null && currentUser != null && signature.isNotEmpty) {
      try {
        final res = await client.functions.invoke(
          'verify-payment',
          body: {
            'orderId': orderId,
            'paymentId': paymentId,
            'signature': signature,
            'planId': planId,
          },
        );

        final data = res.data;
        if (res.status == 200 && data is Map && data['success'] == true) {
          await _refreshAfterPayment(ref);
          return SubscriptionVerificationResult(
            success: true,
            subscriptionId: data['subscriptionId']?.toString(),
            status: 'active',
            startsAt: data['startsAt']?.toString(),
            expiresAt: data['expiresAt']?.toString(),
            isRenewal: data['isRenewal'] == true,
            purchaseType: data['purchaseType']?.toString(),
            planTitle: data['planTitle']?.toString() ?? plan.title,
          );
        }
        if (data is Map && data['error'] != null) {
          serverError = data['error'].toString();
        }
        debugPrint('verify-payment backend response: ${res.data}');
      } on FunctionException catch (fe) {
        debugPrint('verify-payment FunctionException: ${fe.status} ${fe.details}');
        final details = fe.details;
        if (details is Map && details['error'] != null) {
          serverError = details['error'].toString();
        }
      } catch (e) {
        debugPrint('verify-payment exception: $e');
      }
    }

    // The Razorpay webhook may already have activated the pass on the server.
    final current = await _refreshAfterPayment(ref);
    if (current.isCurrentlyActive && current.planId == planId) {
      return SubscriptionVerificationResult(
        success: true,
        subscriptionId: current.subscriptionId,
        status: 'active',
        startsAt: current.startsAt?.toIso8601String(),
        expiresAt: current.expiresAt?.toIso8601String(),
        planTitle: current.planTitle ?? plan.title,
      );
    }

    return SubscriptionVerificationResult(
      success: false,
      errorMessage: serverError ??
          'We received your payment but could not confirm it yet. Your Pro Pass will '
              'activate automatically once confirmed. If it does not, contact support '
              'with payment ID $paymentId.',
    );
  }

  Future<StudentSubscriptionModel> _refreshAfterPayment(WidgetRef ref) async {
    ref.invalidate(studentSubscriptionProvider);
    try {
      // Also re-syncs the profile's Pro flag (see studentSubscriptionProvider).
      return await ref.read(studentSubscriptionProvider.future);
    } catch (e) {
      debugPrint('Subscription refresh after payment failed: $e');
      return const StudentSubscriptionModel();
    }
  }
}

/// Plans could not be loaded and none were cached from an earlier visit.
class PlansUnavailable implements Exception {
  const PlansUnavailable();
  @override
  String toString() =>
      'Plans are unavailable right now. Check your internet and try again.';
}

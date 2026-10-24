import 'package:intl/intl.dart';

/// Represents a subscription plan fetched dynamically from the database (`subscription_plans`).
class SubscriptionPlanModel {
  final String id;
  final String name;
  final String title;
  final String description;
  final int durationDays;
  final double price;
  final double? originalPrice;
  final String currency;
  final List<String> features;
  final bool isActive;
  final int orderIndex;
  final int? renewalWindowDays;

  const SubscriptionPlanModel({
    required this.id,
    this.name = '',
    required this.title,
    this.description = '',
    required this.durationDays,
    required this.price,
    this.originalPrice,
    this.currency = 'INR',
    this.features = const [],
    this.isActive = true,
    this.orderIndex = 0,
    this.renewalWindowDays,
  });

  bool get isFree => price <= 0;

  int get discountPercentage {
    if (originalPrice != null && originalPrice! > price && originalPrice! > 0) {
      return (((originalPrice! - price) / originalPrice!) * 100).round();
    }
    return 0;
  }

  int get savingsAmount {
    if (originalPrice != null && originalPrice! > price) {
      return (originalPrice! - price).round();
    }
    return 0;
  }

  String get formattedDuration {
    if (isFree) return 'Lifetime';
    if (durationDays <= 0) return '';
    if (durationDays >= 365) {
      final years = (durationDays / 365).round();
      return years == 1 ? '1 Year' : '$years Years';
    }
    if (durationDays >= 30) {
      final months = (durationDays / 30).round();
      return months == 1 ? '1 Month' : '$months Months';
    }
    return '$durationDays Days';
  }

  factory SubscriptionPlanModel.fromJson(Map<String, dynamic> json) {
    List<String> parsedFeatures = [];
    final rawFeatures = json['features'];
    if (rawFeatures is List) {
      parsedFeatures = rawFeatures.map((f) => f.toString()).toList();
    }

    return SubscriptionPlanModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      title: json['title']?.toString() ?? json['name']?.toString() ?? 'Pro Plan',
      description: json['description']?.toString() ?? '',
      // 0 = not specified; such paid plans are not offered (see repository).
      durationDays: (json['duration_days'] as num?)?.toInt() ?? 0,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      originalPrice: (json['original_price'] as num?)?.toDouble(),
      currency: json['currency']?.toString() ?? 'INR',
      features: parsedFeatures,
      isActive: json['is_active'] as bool? ?? true,
      orderIndex: (json['order_index'] as num?)?.toInt() ?? 0,
      renewalWindowDays: (json['renewal_window_days'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'title': title,
    'description': description,
    'duration_days': durationDays,
    'price': price,
    'original_price': originalPrice,
    'currency': currency,
    'features': features,
    'is_active': isActive,
    'order_index': orderIndex,
    'renewal_window_days': renewalWindowDays,
  };
}

/// An upgrade the server says this student may buy now (`upgrade_options` in
/// `get_student_subscription_details`). The amount is the price difference.
class SubscriptionUpgradeOption {
  final String planId;
  final String planTitle;
  final int? durationDays;
  final double amount;
  final String currency;
  final DateTime? newExpiresAt;

  const SubscriptionUpgradeOption({
    required this.planId,
    required this.planTitle,
    this.durationDays,
    required this.amount,
    this.currency = 'INR',
    this.newExpiresAt,
  });

  factory SubscriptionUpgradeOption.fromJson(Map<String, dynamic> json) {
    return SubscriptionUpgradeOption(
      planId: json['plan_id']?.toString() ?? '',
      planTitle: json['plan_title']?.toString() ?? 'Pro Pass',
      durationDays: (json['duration_days'] as num?)?.toInt(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency']?.toString() ?? 'INR',
      newExpiresAt: DateTime.tryParse(json['new_expires_at']?.toString() ?? ''),
    );
  }

  Map<String, dynamic> toJson() => {
    'plan_id': planId,
    'plan_title': planTitle,
    'duration_days': durationDays,
    'amount': amount,
    'currency': currency,
    'new_expires_at': newExpiresAt?.toIso8601String(),
  };
}

/// Represents the student's active subscription status from `get_student_subscription_details` RPC.
class StudentSubscriptionModel {
  final bool hasSubscription;
  final bool isActive;
  final String status; // active | expired | none
  final String? subscriptionId;
  final String? planId;
  final String? planTitle;
  final int? durationDays;
  final DateTime? purchasedAt;
  final DateTime? startsAt;
  final DateTime? expiresAt;
  final DateTime? upgradedAt;
  final int? daysRemaining;
  final int? renewalWindowDays;
  final bool renewed;
  final DateTime? renewedExpiresAt;
  final List<SubscriptionUpgradeOption> upgradeOptions;

  const StudentSubscriptionModel({
    this.hasSubscription = false,
    this.isActive = false,
    this.status = 'none',
    this.subscriptionId,
    this.planId,
    this.planTitle,
    this.durationDays,
    this.purchasedAt,
    this.startsAt,
    this.expiresAt,
    this.upgradedAt,
    this.daysRemaining,
    this.renewalWindowDays,
    this.renewed = false,
    this.renewedExpiresAt,
    this.upgradeOptions = const [],
  });

  String get formattedExpiry {
    if (expiresAt == null) return 'No active expiry';
    return DateFormat('d MMMM yyyy').format(expiresAt!.toLocal());
  }

  String get formattedStartsAt {
    if (startsAt == null) return '';
    return DateFormat('d MMMM yyyy').format(startsAt!.toLocal());
  }

  /// When the student paid for this pass (falls back to its start).
  DateTime? get purchaseDate => purchasedAt ?? startsAt;

  String get formattedPurchaseDate {
    final date = purchaseDate;
    return date == null ? '' : DateFormat('d MMMM yyyy').format(date.toLocal());
  }

  bool get isExpired {
    if (!isActive) return true;
    if (expiresAt != null && expiresAt!.isBefore(DateTime.now())) return true;
    return false;
  }

  /// Active right now, judged against the stored expiry as well as the server flag.
  bool get isCurrentlyActive => hasSubscription && !isExpired;

  bool get canUpgrade => isCurrentlyActive && upgradeOptions.isNotEmpty;

  /// Whole days left, counting today's partial day; recomputed from [expiresAt] so a
  /// cached value never goes stale.
  int get remainingDays {
    if (!isCurrentlyActive) return 0;
    if (expiresAt == null) return daysRemaining ?? 0;
    final hours = expiresAt!.difference(DateTime.now()).inHours;
    return hours <= 0 ? 0 : (hours / 24).ceil();
  }

  /// e.g. "5 months 12 days", "1 year 3 days", "Expires today".
  String get remainingLabel {
    if (!isCurrentlyActive) return 'Expired';
    final days = remainingDays;
    if (days <= 0) return 'Expires today';
    final years = days ~/ 365;
    final months = (days % 365) ~/ 30;
    final rest = (days % 365) % 30;
    String unit(int n, String word) => '$n $word${n == 1 ? '' : 's'}';
    final parts = [
      if (years > 0) unit(years, 'year'),
      if (months > 0) unit(months, 'month'),
      if (rest > 0 || (years == 0 && months == 0)) unit(rest, 'day'),
    ];
    return parts.join(' ');
  }

  /// Share of the pass already used, 0.0 – 1.0.
  double get usedFraction {
    final start = startsAt;
    final end = expiresAt;
    if (start == null || end == null) return 0;
    final total = end.difference(start).inMinutes;
    if (total <= 0) return 1;
    final used = DateTime.now().difference(start).inMinutes;
    return (used / total).clamp(0.0, 1.0);
  }

  factory StudentSubscriptionModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic val) {
      if (val == null) return null;
      return DateTime.tryParse(val.toString());
    }

    final hasSub = json['has_subscription'] == true || json['hasSubscription'] == true;
    final active = json['is_active'] == true || json['isActive'] == true;
    final rawUpgrades = json['upgrade_options'];

    return StudentSubscriptionModel(
      hasSubscription: hasSub,
      isActive: active,
      status: json['status']?.toString() ?? (active ? 'active' : 'none'),
      subscriptionId: json['subscription_id']?.toString() ?? json['subscriptionId']?.toString(),
      planId: json['plan_id']?.toString() ?? json['planId']?.toString(),
      planTitle: json['plan_title']?.toString() ?? json['planTitle']?.toString(),
      durationDays: (json['duration_days'] as num?)?.toInt() ?? (json['durationDays'] as num?)?.toInt(),
      purchasedAt: parseDate(json['purchased_at']),
      startsAt: parseDate(json['starts_at'] ?? json['startsAt']),
      expiresAt: parseDate(json['expires_at'] ?? json['expiresAt']),
      upgradedAt: parseDate(json['upgraded_at']),
      daysRemaining: (json['days_remaining'] as num?)?.toInt() ?? (json['daysRemaining'] as num?)?.toInt(),
      renewalWindowDays: (json['renewal_window_days'] as num?)?.toInt() ?? (json['renewalWindowDays'] as num?)?.toInt(),
      renewed: json['renewed'] == true,
      renewedExpiresAt: parseDate(json['renewed_expires_at'] ?? json['renewedExpiresAt']),
      upgradeOptions: rawUpgrades is List
          ? rawUpgrades
              .whereType<Map>()
              .map((u) => SubscriptionUpgradeOption.fromJson(Map<String, dynamic>.from(u)))
              .where((u) => u.planId.isNotEmpty && u.amount > 0)
              .toList()
          : const [],
    );
  }

  Map<String, dynamic> toJson() => {
    'has_subscription': hasSubscription,
    'is_active': isActive,
    'status': status,
    'subscription_id': subscriptionId,
    'plan_id': planId,
    'plan_title': planTitle,
    'duration_days': durationDays,
    'purchased_at': purchasedAt?.toIso8601String(),
    'starts_at': startsAt?.toIso8601String(),
    'expires_at': expiresAt?.toIso8601String(),
    'upgraded_at': upgradedAt?.toIso8601String(),
    'days_remaining': daysRemaining,
    'renewal_window_days': renewalWindowDays,
    'renewed': renewed,
    'renewed_expires_at': renewedExpiresAt?.toIso8601String(),
    'upgrade_options': upgradeOptions.map((u) => u.toJson()).toList(),
  };

  StudentSubscriptionModel copyWith({
    bool? hasSubscription,
    bool? isActive,
    String? status,
    String? subscriptionId,
    String? planId,
    String? planTitle,
    int? durationDays,
    DateTime? purchasedAt,
    DateTime? startsAt,
    DateTime? expiresAt,
    DateTime? upgradedAt,
    int? daysRemaining,
    int? renewalWindowDays,
    bool? renewed,
    DateTime? renewedExpiresAt,
    List<SubscriptionUpgradeOption>? upgradeOptions,
  }) {
    return StudentSubscriptionModel(
      hasSubscription: hasSubscription ?? this.hasSubscription,
      isActive: isActive ?? this.isActive,
      status: status ?? this.status,
      subscriptionId: subscriptionId ?? this.subscriptionId,
      planId: planId ?? this.planId,
      planTitle: planTitle ?? this.planTitle,
      durationDays: durationDays ?? this.durationDays,
      purchasedAt: purchasedAt ?? this.purchasedAt,
      startsAt: startsAt ?? this.startsAt,
      expiresAt: expiresAt ?? this.expiresAt,
      upgradedAt: upgradedAt ?? this.upgradedAt,
      daysRemaining: daysRemaining ?? this.daysRemaining,
      renewalWindowDays: renewalWindowDays ?? this.renewalWindowDays,
      renewed: renewed ?? this.renewed,
      renewedExpiresAt: renewedExpiresAt ?? this.renewedExpiresAt,
      upgradeOptions: upgradeOptions ?? this.upgradeOptions,
    );
  }
}

/// Represents an order created via `create-razorpay-order` Edge Function or fallback.
class SubscriptionOrderModel {
  final String orderId;
  final String? paymentId;
  final String planId;
  final String planTitle;
  final double amount;
  final String currency;
  final int durationDays;
  final String? keyId;
  final bool isRealRazorpayOrder;
  final String? purchaseType;
  final String? newExpiresAt;

  const SubscriptionOrderModel({
    required this.orderId,
    this.paymentId,
    required this.planId,
    required this.planTitle,
    required this.amount,
    this.currency = 'INR',
    required this.durationDays,
    this.keyId,
    this.isRealRazorpayOrder = false,
    this.purchaseType,
    this.newExpiresAt,
  });

  factory SubscriptionOrderModel.fromJson(Map<String, dynamic> json) {
    final orderId = json['order_id']?.toString() ?? json['orderId']?.toString() ?? '';
    final keyId = json['key_id']?.toString() ?? json['keyId']?.toString();
    final isExplicitReal = json['is_real_razorpay_order'] == true || json['isRealRazorpayOrder'] == true;
    final isEdgeOrder = (json['verification_version'] == 2 && orderId.isNotEmpty) ||
        (keyId != null && (keyId.startsWith('rzp_live_') || keyId.startsWith('rzp_test_')) && !keyId.contains('practicekoro_key'));

    return SubscriptionOrderModel(
      orderId: orderId,
      paymentId: json['payment_id']?.toString() ?? json['paymentId']?.toString(),
      planId: json['plan_id']?.toString() ?? json['planId']?.toString() ?? '',
      planTitle: json['plan_title']?.toString() ?? json['planTitle']?.toString() ?? 'Pro Plan',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency']?.toString() ?? 'INR',
      durationDays: (json['duration_days'] as num?)?.toInt() ?? (json['durationDays'] as num?)?.toInt() ?? 0,
      keyId: keyId,
      isRealRazorpayOrder: isExplicitReal || isEdgeOrder,
      purchaseType: json['purchase_type']?.toString() ?? json['purchaseType']?.toString(),
      newExpiresAt: json['new_expires_at']?.toString() ?? json['newExpiresAt']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'order_id': orderId,
    'payment_id': paymentId,
    'plan_id': planId,
    'plan_title': planTitle,
    'amount': amount,
    'currency': currency,
    'duration_days': durationDays,
    'key_id': keyId,
    'is_real_razorpay_order': isRealRazorpayOrder,
    'purchase_type': purchaseType,
    'new_expires_at': newExpiresAt,
  };

  SubscriptionOrderModel copyWith({
    String? orderId,
    String? paymentId,
    String? planId,
    String? planTitle,
    double? amount,
    String? currency,
    int? durationDays,
    String? keyId,
    bool? isRealRazorpayOrder,
    String? purchaseType,
    String? newExpiresAt,
  }) {
    return SubscriptionOrderModel(
      orderId: orderId ?? this.orderId,
      paymentId: paymentId ?? this.paymentId,
      planId: planId ?? this.planId,
      planTitle: planTitle ?? this.planTitle,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      durationDays: durationDays ?? this.durationDays,
      keyId: keyId ?? this.keyId,
      isRealRazorpayOrder: isRealRazorpayOrder ?? this.isRealRazorpayOrder,
      purchaseType: purchaseType ?? this.purchaseType,
      newExpiresAt: newExpiresAt ?? this.newExpiresAt,
    );
  }
}

/// Result of payment verification from `verify-payment` Edge Function or fallback.
class SubscriptionVerificationResult {
  final bool success;
  final String? subscriptionId;
  final String? status;
  final String? startsAt;
  final String? expiresAt;
  final bool isRenewal;
  final String? purchaseType;
  final String? planTitle;
  final String? errorMessage;

  const SubscriptionVerificationResult({
    required this.success,
    this.subscriptionId,
    this.status,
    this.startsAt,
    this.expiresAt,
    this.isRenewal = false,
    this.purchaseType,
    this.planTitle,
    this.errorMessage,
  });
}

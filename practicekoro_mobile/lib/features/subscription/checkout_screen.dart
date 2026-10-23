import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../core/components/ui.dart';
import '../../data/models/subscription_model.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/profile_repository.dart';
import '../../data/repositories/subscription_repository.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  final String planId;

  const CheckoutScreen({super.key, required this.planId});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  late Razorpay _razorpay;
  bool _isProcessing = false;
  String _selectedPaymentMethod = 'upi'; // upi | card | netbanking

  SubscriptionPlanModel? _currentPlan;
  SubscriptionOrderModel? _currentOrder;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    debugPrint(
      'Razorpay Payment Success: paymentId=${response.paymentId}, orderId=${response.orderId}',
    );

    final plan = _currentPlan;
    final order = _currentOrder;

    if (plan == null || order == null) {
      if (mounted) setState(() => _isProcessing = false);
      return;
    }

    try {
      final repo = ref.read(subscriptionRepositoryProvider);
      final paymentId = response.paymentId ?? '';
      final signature = response.signature ?? '';
      final orderId = response.orderId ?? order.orderId;

      final verification = await repo.verifyAndActivatePayment(
        orderId: orderId,
        paymentId: paymentId,
        signature: signature,
        planId: plan.id,
        plan: plan,
        ref: ref,
      );

      if (!mounted) return;
      setState(() => _isProcessing = false);

      if (verification.success) {
        _showSuccessDialog(
          plan,
          amountPaid: order.amount,
          expiresAt: DateTime.tryParse(verification.expiresAt ?? ''),
          isUpgrade: verification.purchaseType == 'upgrade' ||
              order.purchaseType == 'upgrade',
        );
      } else {
        _showFailureDialog(
          verification.errorMessage ??
              'Payment verification failed. If money was deducted, it will be credited automatically or contact support.',
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessing = false);
      _showFailureDialog('Payment verification error: $e');
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    debugPrint(
      'Razorpay Payment Error: code=${response.code}, message=${response.message}',
    );
    if (!mounted) return;
    setState(() => _isProcessing = false);

    if (response.code == Razorpay.PAYMENT_CANCELLED) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment was cancelled. No amount was deducted.'),
          backgroundColor: UI.textSoft,
          duration: Duration(seconds: 3),
        ),
      );
    } else {
      final msg = response.message ??
          'Payment could not be completed. Please check your bank or UPI app and try again.';
      _showFailureDialog(msg);
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    debugPrint('Razorpay External Wallet: ${response.walletName}');
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Redirecting to ${response.walletName ?? "external wallet"}...',
        ),
        backgroundColor: UI.primary,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showSignInRequiredDialog() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.all(22),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: UI.primarySoft,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.lock_person_rounded,
                color: UI.primary,
                size: 30,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Sign In Required',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: UI.text,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please sign in to your PracticeKoro account so your Pro subscription can be activated.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: UI.textSoft,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: UI.line),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      context.push('/login');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: UI.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Sign In'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _proceedToPayment(SubscriptionPlanModel plan) async {
    final client = supabaseClient;
    final currentUser = client?.auth.currentUser;

    if (client != null && currentUser == null) {
      _showSignInRequiredDialog();
      return;
    }

    setState(() => _isProcessing = true);

    try {
      final repo = ref.read(subscriptionRepositoryProvider);

      // 1. Create order
      final order = await repo.createRazorpayOrder(plan.id);

      if (!mounted) return;

      _currentPlan = plan;
      _currentOrder = order;

      final key = (order.keyId != null &&
              order.keyId!.isNotEmpty &&
              !order.keyId!.contains('practicekoro_key'))
          ? order.keyId!
          : await repo.getActiveRazorpayKey();

      final profile = ref.read(studentProfileProvider);
      final phone = profile.phone.isNotEmpty
          ? profile.phone
          : (currentUser?.phone ?? '');
      final email = profile.email.isNotEmpty
          ? profile.email
          : (currentUser?.email ?? '');
      final name = profile.fullName.isNotEmpty
          ? profile.fullName
          : 'Student';

      final options = <String, dynamic>{
        'key': key,
        'amount': (order.amount * 100).round(), // in paise
        'currency': order.currency.isNotEmpty ? order.currency : 'INR',
        'name': 'PracticeKoro',
        'description': plan.title,
        'timeout': 300,
        'prefill': {
          if (phone.isNotEmpty) 'contact': phone,
          if (email.isNotEmpty) 'email': email,
          if (name.isNotEmpty) 'name': name,
        },
        'theme': {
          'color': '#008080',
        },
        'retry': {
          'enabled': true,
          'max_count': 2,
        },
        'send_sms_hash': true,
        'external': {
          'wallets': ['paytm']
        },
      };

      // Only pass order_id if it was created via Razorpay Orders API
      if (order.orderId.startsWith('order_') &&
          !order.orderId.startsWith('order_sim_') &&
          !order.orderId.startsWith('pk_')) {
        options['order_id'] = order.orderId;
      }

      debugPrint(
        'Opening Razorpay Checkout: key=$key, amount=${options['amount']}, currency=${options['currency']}, order_id=${options['order_id']}',
      );

      try {
        _razorpay.open(options);
      } catch (sdkError) {
        debugPrint('Error launching Razorpay: $sdkError');
        if (mounted) {
          setState(() => _isProcessing = false);
          _showFailureDialog('Failed to launch Razorpay payment sheet: $sdkError');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        _showFailureDialog(e.toString().replaceAll('Exception: ', ''));
      }
    }
  }

  void _showSuccessDialog(
    SubscriptionPlanModel plan, {
    required double amountPaid,
    required DateTime? expiresAt,
    required bool isUpgrade,
  }) {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        contentPadding: const EdgeInsets.all(24),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: UI.successSoft,
                shape: BoxShape.circle,
                border: Border.all(color: UI.success.withValues(alpha: 0.3), width: 3),
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: UI.success,
                size: 44,
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Payment Successful!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: UI.text,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isUpgrade
                  ? 'Your pass has been upgraded to the ${plan.title}.'
                  : 'Your ${plan.title} has been successfully activated for your account.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: UI.textSoft,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: UI.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: UI.line),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Amount Paid',
                        style: TextStyle(fontSize: 12, color: UI.muted),
                      ),
                      Text(
                        _rupees(amountPaid),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: UI.text,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Valid until',
                        style: TextStyle(fontSize: 12, color: UI.muted),
                      ),
                      Text(
                        expiresAt != null
                            ? DateFormat('d MMM yyyy').format(expiresAt.toLocal())
                            : plan.formattedDuration,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: UI.success,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Status',
                        style: TextStyle(fontSize: 12, color: UI.muted),
                      ),
                      const Text(
                        'Active (All Tests Unlocked)',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: UI.primary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx); // Close dialog
                  context.go('/exams'); // Go to exams to practice
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: UI.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  'Start Practicing Pro Tests',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.go('/home');
              },
              child: const Text(
                'Back to Home',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: UI.muted,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showFailureDialog(String errorMessage) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.all(22),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: const BoxDecoration(
                color: UI.dangerSoft,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline_rounded,
                color: UI.danger,
                size: 36,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Payment Failed',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: UI.text,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage.contains('user cancelled')
                  ? 'Payment was cancelled. No amount was deducted from your account.'
                  : errorMessage,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: UI.textSoft,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: UI.line),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: UI.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Try Again'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final plansAsync = ref.watch(subscriptionPlansProvider);
    final profile = ref.watch(studentProfileProvider);
    final currentSub = ref.watch(studentSubscriptionProvider).value;

    return Scaffold(
      backgroundColor: UI.page,
      appBar: const PreferredSize(
        preferredSize: Size.fromHeight(56),
        child: UITitleBar('Order Summary', fallbackRoute: '/plans'),
      ),
      body: plansAsync.when(
        data: (plans) {
          final matches = plans.where((p) => p.id == widget.planId);
          final plan = matches.isNotEmpty ? matches.first : plans.firstOrNull;

          if (plan == null) {
            return const Center(
              child: Text(
                'Plan not found.',
                style: TextStyle(color: UI.muted),
              ),
            );
          }

          // An active pass may only move to a longer plan, priced by the server as the
          // difference; anything else is not purchasable until the pass expires.
          final upgrade = currentSub?.upgradeOptions
              .where((u) => u.planId == plan.id)
              .firstOrNull;
          final hasActivePass = currentSub?.isCurrentlyActive ?? false;
          final blocked = hasActivePass && upgrade == null;
          final payable = upgrade?.amount ?? plan.price;

          return Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.only(
                  left: 16,
                  right: 16,
                  top: 14,
                  bottom: 110,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 1. Plan Overview Card
                    _PlanOverviewCard(plan: plan),

                    const SizedBox(height: 16),

                    if (blocked) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: UI.goldSoft,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: UI.gold.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          'You already have an active ${currentSub?.planTitle ?? 'Pro Pass'} '
                          'valid until ${currentSub?.formattedExpiry}. This plan can be '
                          'purchased after it expires.',
                          style: const TextStyle(
                            fontSize: 12.5,
                            height: 1.4,
                            color: UI.textSoft,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // 2. Student Account Card
                    _StudentAccountCard(profile: profile),

                    const SizedBox(height: 16),

                    // 3. Billing Breakdown Card
                    _BillingBreakdownCard(plan: plan, upgrade: upgrade),

                    const SizedBox(height: 16),

                    // 4. Payment Method Selection
                    _PaymentMethodSelector(
                      selectedMethod: _selectedPaymentMethod,
                      onChanged: (val) {
                        setState(() => _selectedPaymentMethod = val);
                      },
                    ),

                    const SizedBox(height: 16),

                    // 5. Trust & Security Banner
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: UI.line),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.security_rounded,
                            color: UI.success,
                            size: 20,
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Guaranteed 100% secure payment with instant subscription activation.',
                              style: TextStyle(
                                fontSize: 11.5,
                                color: UI.textSoft,
                                height: 1.3,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Bottom Sticky Action Bar
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 14,
                  ),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(top: BorderSide(color: UI.line)),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x10000000),
                        blurRadius: 10,
                        offset: Offset(0, -3),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    top: false,
                    child: Row(
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'Total to pay',
                              style: TextStyle(
                                fontSize: 11.5,
                                color: UI.muted,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              _rupees(payable),
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                color: UI.text,
                                letterSpacing: -0.5,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 20),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isProcessing || blocked
                                ? null
                                : () => _proceedToPayment(plan),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: UI.primary,
                              foregroundColor: Colors.white,
                              disabledBackgroundColor: UI.primary.withValues(alpha: 0.6),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              elevation: 2,
                            ),
                            child: _isProcessing
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.2,
                                      color: Colors.white,
                                    ),
                                  )
                                : Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(
                                        Icons.lock_rounded,
                                        size: 16,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        blocked
                                            ? 'Pass already active'
                                            : upgrade != null
                                                ? 'Upgrade for ${_rupees(payable)}'
                                                : 'Pay ${_rupees(payable)} Now',
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: UI.primary),
        ),
        error: (err, stack) => Center(
          child: Text('Error: $err'),
        ),
      ),
    );
  }
}

/// Plan overview card in checkout
class _PlanOverviewCard extends StatelessWidget {
  final SubscriptionPlanModel plan;

  const _PlanOverviewCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: UI.line),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: UI.primarySoft,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.workspace_premium_rounded,
                  color: UI.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      plan.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: UI.text,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Validity: ${plan.formattedDuration} (${plan.durationDays} Days)',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: UI.muted,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '₹${plan.price.toInt()}',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: UI.text,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, color: UI.line),
          const SizedBox(height: 12),
          const Text(
            'Included in this pass:',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: UI.textSoft,
            ),
          ),
          const SizedBox(height: 8),
          for (final feature in plan.features.take(3)) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  const Icon(
                    Icons.check_rounded,
                    size: 15,
                    color: UI.success,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      feature,
                      style: const TextStyle(
                        fontSize: 12,
                        color: UI.textSoft,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Student account card verifying who will receive the pass
class _StudentAccountCard extends StatelessWidget {
  final dynamic profile;

  const _StudentAccountCard({required this.profile});

  @override
  Widget build(BuildContext context) {
    final name = (profile.fullName as String).isNotEmpty
        ? profile.fullName as String
        : 'Student';
    final email = (profile.email as String).isNotEmpty
        ? profile.email as String
        : 'Logged in account';
    final exam = (profile.targetExamTitle as String?) ?? 'West Bengal Exams';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: UI.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Activation Details',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: UI.muted,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: UI.primarySoft,
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : 'S',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: UI.primary,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: UI.text,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$email • $exam',
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: UI.muted,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Billing breakdown card
class _BillingBreakdownCard extends StatelessWidget {
  final SubscriptionPlanModel plan;
  final SubscriptionUpgradeOption? upgrade;

  const _BillingBreakdownCard({required this.plan, this.upgrade});

  @override
  Widget build(BuildContext context) {
    final upgrade = this.upgrade;
    if (upgrade != null) return _buildUpgrade(upgrade);
    final original = plan.originalPrice ?? (plan.price * 2);
    final discount = (original - plan.price).toInt();

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: UI.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Price Breakdown',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: UI.text,
            ),
          ),
          const SizedBox(height: 14),
          _PriceRow(
            label: 'Plan MRP',
            value: '₹${original.toInt()}',
          ),
          const SizedBox(height: 8),
          _PriceRow(
            label: 'Special Offer Discount',
            value: '-₹$discount',
            valueColor: UI.success,
          ),
          const SizedBox(height: 8),
          const _PriceRow(
            label: 'Platform & Processing Fee',
            value: 'FREE',
            valueColor: UI.success,
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: UI.line),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Payable',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: UI.text,
                ),
              ),
              Text(
                '₹${plan.price.toInt()}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: UI.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Inclusive of GST and all applicable government taxes',
            style: TextStyle(
              fontSize: 11,
              color: UI.muted,
            ),
          ),
        ],
      ),
    );
  }
}

extension on _BillingBreakdownCard {
  Widget _buildUpgrade(SubscriptionUpgradeOption upgrade) {
    final credit = plan.price - upgrade.amount;
    final validUntil = upgrade.newExpiresAt != null
        ? DateFormat('d MMM yyyy').format(upgrade.newExpiresAt!.toLocal())
        : null;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: UI.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Upgrade Breakdown',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: UI.text,
            ),
          ),
          const SizedBox(height: 14),
          _PriceRow(label: '${plan.title} price', value: _rupees(plan.price)),
          if (credit > 0) ...[
            const SizedBox(height: 8),
            _PriceRow(
              label: 'Already paid for current pass',
              value: '-${_rupees(credit)}',
              valueColor: UI.success,
            ),
          ],
          const SizedBox(height: 12),
          const Divider(height: 1, color: UI.line),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Payable',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: UI.text,
                ),
              ),
              Text(
                _rupees(upgrade.amount),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: UI.primary,
                ),
              ),
            ],
          ),
          if (validUntil != null) ...[
            const SizedBox(height: 6),
            Text(
              'Your pass will be valid until $validUntil (${plan.durationDays} days '
              'from your original purchase).',
              style: const TextStyle(fontSize: 11, height: 1.35, color: UI.muted),
            ),
          ],
        ],
      ),
    );
  }
}

String _rupees(double amount) =>
    '₹${amount.toStringAsFixed(amount % 1 == 0 ? 0 : 2)}';

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _PriceRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: UI.textSoft,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: valueColor ?? UI.text,
          ),
        ),
      ],
    );
  }
}

/// Payment method selector (UPI, Card, NetBanking)
class _PaymentMethodSelector extends StatelessWidget {
  final String selectedMethod;
  final ValueChanged<String> onChanged;

  const _PaymentMethodSelector({
    required this.selectedMethod,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: UI.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select Payment Method',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: UI.text,
            ),
          ),
          const SizedBox(height: 12),
          _MethodTile(
            id: 'upi',
            title: 'UPI (Google Pay, PhonePe, Paytm, BHIM)',
            icon: Icons.account_balance_wallet_outlined,
            selected: selectedMethod == 'upi',
            onTap: () => onChanged('upi'),
          ),
          const SizedBox(height: 8),
          _MethodTile(
            id: 'card',
            title: 'Credit / Debit Card (Visa, RuPay, MasterCard)',
            icon: Icons.credit_card_rounded,
            selected: selectedMethod == 'card',
            onTap: () => onChanged('card'),
          ),
          const SizedBox(height: 8),
          _MethodTile(
            id: 'netbanking',
            title: 'Net Banking (SBI, HDFC, ICICI, Axis & more)',
            icon: Icons.account_balance_rounded,
            selected: selectedMethod == 'netbanking',
            onTap: () => onChanged('netbanking'),
          ),
        ],
      ),
    );
  }
}

class _MethodTile extends StatelessWidget {
  final String id;
  final String title;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _MethodTile({
    required this.id,
    required this.title,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? UI.primarySoft.withValues(alpha: 0.5) : UI.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? UI.primary : UI.line,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: selected ? UI.primary : UI.textSoft,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? UI.primary : UI.text,
                ),
              ),
            ),
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: selected ? UI.primary : const Color(0xFFCBD5E1),
                  width: selected ? 5.5 : 1.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Interactive payment gateway simulation sheet
class _PaymentGatewayModal extends StatefulWidget {
  final SubscriptionPlanModel plan;
  final SubscriptionOrderModel order;
  final String initialMethod;

  const _PaymentGatewayModal({
    required this.plan,
    required this.order,
    required this.initialMethod,
  });

  @override
  State<_PaymentGatewayModal> createState() => _PaymentGatewayModalState();
}

class _PaymentGatewayModalState extends State<_PaymentGatewayModal> {
  bool _isPaying = false;

  void _completePayment(bool success) async {
    setState(() => _isPaying = true);
    await Future.delayed(const Duration(milliseconds: 1200));

    if (!mounted) return;

    if (success) {
      final paymentId = 'pay_${DateTime.now().millisecondsSinceEpoch}';
      final signature = 'sig_${DateTime.now().millisecondsSinceEpoch}';
      Navigator.pop(context, {
        'status': 'success',
        'paymentId': paymentId,
        'orderId': widget.order.orderId,
        'signature': signature,
      });
    } else {
      Navigator.pop(context, {
        'status': 'failed',
        'error': 'Payment declined by bank or user cancelled.',
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: UI.line,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: UI.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.lock_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PracticeKoro Pay',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: UI.text,
                        ),
                      ),
                      Text(
                        'Razorpay Secure Gateway',
                        style: TextStyle(fontSize: 11, color: UI.muted),
                      ),
                    ],
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, color: UI.muted),
                onPressed: () => Navigator.pop(context, {'status': 'cancelled'}),
              ),
            ],
          ),

          const SizedBox(height: 16),
          const Divider(height: 1, color: UI.line),
          const SizedBox(height: 16),

          // Order details
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: UI.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.plan.title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: UI.text,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Order ID: ${widget.order.orderId}',
                      style: const TextStyle(fontSize: 11, color: UI.muted),
                    ),
                  ],
                ),
                Text(
                  '₹${widget.plan.price.toInt()}',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: UI.text,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          if (_isPaying)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Column(
                children: [
                  CircularProgressIndicator(color: UI.primary),
                  SizedBox(height: 14),
                  Text(
                    'Authorizing secure payment with gateway...',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: UI.textSoft,
                    ),
                  ),
                ],
              ),
            )
          else ...[
            ElevatedButton(
              onPressed: () => _completePayment(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: UI.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 1,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.check_circle_outline_rounded, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'Authorize & Pay ₹${widget.plan.price.toInt()}',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () => _completePayment(false),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: UI.dangerSoft),
                foregroundColor: UI.danger,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Cancel or Simulate Failure',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],

          const SizedBox(height: 12),
          const Center(
            child: Text(
              'PracticeKoro Payment Infrastructure • 256-bit Encryption',
              style: TextStyle(fontSize: 10.5, color: UI.muted),
            ),
          ),
        ],
      ),
    );
  }
}

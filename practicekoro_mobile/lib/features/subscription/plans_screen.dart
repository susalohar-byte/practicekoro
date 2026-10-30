import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/components/ui.dart';
import '../../data/models/subscription_model.dart';
import '../../data/repositories/profile_repository.dart';
import '../../data/repositories/subscription_repository.dart';

class PlansScreen extends ConsumerStatefulWidget {
  const PlansScreen({super.key});

  @override
  ConsumerState<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends ConsumerState<PlansScreen> {
  Future<void> _refresh() async {
    ref.invalidate(subscriptionPlansProvider);
    ref.invalidate(studentSubscriptionProvider);
    ref.read(studentProfileProvider.notifier).reload();
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(studentProfileProvider);
    final plansAsync = ref.watch(subscriptionPlansProvider);
    final subAsync = ref.watch(studentSubscriptionProvider);

    final currentSub = subAsync.value;
    // The stored pass decides; the profile flag only covers the first load.
    final isPro = currentSub?.isCurrentlyActive ?? profile.isPro;

    return Scaffold(
      backgroundColor: UI.page,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: UITitleBar(
          'Plans & Membership',
          fallbackRoute: '/settings',
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: UI.textSoft),
              tooltip: 'Refresh Plans',
              onPressed: _refresh,
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: UI.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Pro Pass validity (if subscribed) OR Hero Pitch and plans (if not)
              if (isPro) ...[
                if (currentSub == null)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: CircularProgressIndicator(color: UI.primary),
                    ),
                  )
                else ...[
                  _ProPassValidityCard(subscription: currentSub),
                  const SizedBox(height: 16),
                  // A pass with a longer plan available (e.g. 6 months) may upgrade;
                  // the longest pass (1 year) sees no plans until it expires.
                  if (currentSub.canUpgrade)
                    for (final option in currentSub.upgradeOptions) ...[
                      _UpgradeOfferCard(
                        option: option,
                        onUpgrade: () =>
                            context.push('/checkout/${option.planId}?pay=1'),
                      ),
                      const SizedBox(height: 16),
                    ]
                  else
                    _LongestPlanNote(subscription: currentSub),
                ],
                const SizedBox(height: 24),
              ] else ...[
                if (currentSub != null && currentSub.hasSubscription) ...[
                  _ExpiredPassNotice(subscription: currentSub),
                  const SizedBox(height: 16),
                ],
                const _ProPitchHeroCard(),

                const SizedBox(height: 20),

                // 2. Section Heading
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Available Packages',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: UI.text,
                        letterSpacing: -0.2,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: UI.primarySoft,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.bolt_rounded, size: 14, color: UI.primary),
                          SizedBox(width: 4),
                          Text(
                            'Instant Access',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: UI.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // 3. Dynamic Plans List
                plansAsync.when(
                  data: (plans) {
                    // Filter out inactive plans and sort by orderIndex
                    final activePlans = plans.where((p) => p.isActive).toList()
                      ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));

                    if (activePlans.isEmpty) {
                      return UICard(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            const Icon(
                              Icons.info_outline_rounded,
                              size: 40,
                              color: UI.muted,
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'No active subscription plans available at the moment.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: UI.textSoft,
                              ),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: _refresh,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: UI.primary,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: const Text('Check Again'),
                            ),
                          ],
                        ),
                      );
                    }

                    return Column(
                      children: [
                        for (final plan in activePlans) ...[
                          _PlanCard(
                            plan: plan,
                            isCurrentPlan: plan.isFree
                                ? !isPro
                                : (isPro &&
                                      (currentSub?.planId == plan.id ||
                                          (currentSub?.durationDays ==
                                              plan.durationDays))),
                            onSelect: () {
                              if (!plan.isFree) {
                                context.push('/checkout/${plan.id}?pay=1');
                              }
                            },
                          ),
                          const SizedBox(height: 16),
                        ],
                      ],
                    );
                  },
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: CircularProgressIndicator(color: UI.primary),
                    ),
                  ),
                  error: (err, stack) => UICard(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.error_outline_rounded,
                          size: 36,
                          color: UI.danger,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Plans unavailable',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: UI.text,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          err.toString(),
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 12, color: UI.muted),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: _refresh,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: UI.primary,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // 4. Pro Perks & Features Grid
                const Text(
                  'Why Aspirants Choose Pro',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: UI.text,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 12),
                const _FeaturePerksGrid(),

                const SizedBox(height: 24),
              ],

              // 5. Frequently Asked Questions
              const Text(
                'Frequently Asked Questions',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: UI.text,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 10),
              const _FaqTile(
                question: 'Which exams are covered in the Pro Pass?',
                answer:
                    'All West Bengal state competitive exams including WBP Constable, KP SI, WBCS, Food SI, WBPSC Clerkship, and Miscellaneous Services.',
              ),
              const _FaqTile(
                question: 'Are there unlimited re-attempts for mock tests?',
                answer:
                    'Yes! You can re-attempt tests anytime to practice your weak areas. Full solutions and Bengali explanations remain available 24x7.',
              ),
              const _FaqTile(
                question: 'Is this a recurring subscription?',
                answer:
                    'No, this is a 100% one-time payment. There are no automatic deductions or hidden charges. Your pass simply expires at the end of the duration.',
              ),
              const _FaqTile(
                question: 'How do I get help if my payment gets stuck?',
                answer:
                    'Reach out to our support team instantly via Help & Support or WhatsApp. Your payment status is verified automatically.',
              ),

              const SizedBox(height: 24),

              // 6. Security & Trust Badge
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: UI.line),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.verified_user_rounded,
                      color: UI.success,
                      size: 24,
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '100% Safe & Secure Checkout',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: UI.text,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'UPI • Debit/Credit Cards • Net Banking',
                            style: TextStyle(fontSize: 12, color: UI.muted),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

String _formatDate(DateTime? date) =>
    date == null ? '—' : DateFormat('d MMM yyyy').format(date.toLocal());

/// Current Pro Pass: plan, purchase date, expiry and remaining validity.
class _ProPassValidityCard extends StatelessWidget {
  final StudentSubscriptionModel subscription;

  const _ProPassValidityCard({required this.subscription});

  @override
  Widget build(BuildContext context) {
    final sub = subscription;
    final expiringSoon = sub.remainingDays <= 7;

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF334155)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x250F172A),
            blurRadius: 14,
            offset: Offset(0, 6),
          ),
        ],
        border: Border.all(
          color: const Color(0xFFE2E8F0).withValues(alpha: 0.15),
        ),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.workspace_premium_rounded,
                      size: 14,
                      color: Colors.white,
                    ),
                    SizedBox(width: 4),
                    Text(
                      'PRO MEMBER',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: (expiringSoon ? UI.gold : UI.success).withValues(
                    alpha: 0.2,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: (expiringSoon ? UI.gold : UI.successBright)
                        .withValues(alpha: 0.4),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircleAvatar(
                      radius: 3.5,
                      backgroundColor: expiringSoon
                          ? UI.gold
                          : UI.successBright,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      expiringSoon ? 'Expiring soon' : 'Active',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: expiringSoon
                            ? const Color(0xFFFDE68A)
                            : const Color(0xFF86EFAC),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            sub.planTitle ?? 'Pro Pass',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${sub.remainingLabel} remaining',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: expiringSoon ? UI.goldBright : const Color(0xFFCBD5E1),
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: 1 - sub.usedFraction,
              minHeight: 6,
              backgroundColor: Colors.white.withValues(alpha: 0.12),
              valueColor: AlwaysStoppedAnimation(
                expiringSoon ? UI.gold : UI.successBright,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                _ValidityRow('Current plan', sub.planTitle ?? 'Pro Pass'),
                _ValidityRow('Purchased on', _formatDate(sub.purchaseDate)),
                if (sub.upgradedAt != null)
                  _ValidityRow('Upgraded on', _formatDate(sub.upgradedAt)),
                _ValidityRow('Valid until', _formatDate(sub.expiresAt)),
                _ValidityRow(
                  'Remaining',
                  '${sub.remainingDays} ${sub.remainingDays == 1 ? 'day' : 'days'}',
                ),
                if (sub.renewed && sub.renewedExpiresAt != null)
                  _ValidityRow(
                    'Renewed until',
                    _formatDate(sub.renewedExpiresAt),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ValidityRow extends StatelessWidget {
  final String label;
  final String value;

  const _ValidityRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 12.5, color: Color(0xFF94A3B8)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Color(0xFFF1F5F9),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Upgrade to a longer plan; the server prices it as the difference.
class _UpgradeOfferCard extends StatelessWidget {
  final SubscriptionUpgradeOption option;
  final VoidCallback onUpgrade;

  const _UpgradeOfferCard({required this.option, required this.onUpgrade});

  @override
  Widget build(BuildContext context) {
    final amount =
        '₹${option.amount.toStringAsFixed(option.amount % 1 == 0 ? 0 : 2)}';
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: UI.primary, width: 2),
        boxShadow: [
          BoxShadow(
            color: UI.primary.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
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
                decoration: const BoxDecoration(
                  color: UI.primarySoft,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.upgrade_rounded,
                  color: UI.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Upgrade to ${option.planTitle}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: UI.text,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Pay only the difference of $amount. Your pass will then be valid until '
            '${_formatDate(option.newExpiresAt)}.',
            style: const TextStyle(
              fontSize: 13,
              height: 1.4,
              color: UI.textSoft,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onUpgrade,
              style: ElevatedButton.styleFrom(
                backgroundColor: UI.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                'Upgrade for $amount',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Shown instead of plans when the student already holds the longest plan.
class _LongestPlanNote extends StatelessWidget {
  final StudentSubscriptionModel subscription;

  const _LongestPlanNote({required this.subscription});

  @override
  Widget build(BuildContext context) {
    return UICard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          const Icon(Icons.verified_rounded, color: UI.success, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'You have full Pro access until ${_formatDate(subscription.expiresAt)}. '
              'Plans will be available again when your pass expires.',
              style: const TextStyle(
                fontSize: 12.5,
                height: 1.4,
                color: UI.textSoft,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Shown above the plans when the student's last pass has expired.
class _ExpiredPassNotice extends StatelessWidget {
  final StudentSubscriptionModel subscription;

  const _ExpiredPassNotice({required this.subscription});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: UI.dangerSoft,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: UI.danger.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.event_busy_rounded, color: UI.danger, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Your ${subscription.planTitle ?? 'Pro Pass'} expired on '
              '${_formatDate(subscription.expiresAt)}. Choose a plan below to unlock Pro again.',
              style: const TextStyle(
                fontSize: 12.5,
                height: 1.4,
                color: UI.textSoft,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Hero pitch card displayed when user does not have a Pro pass.
class _ProPitchHeroCard extends StatelessWidget {
  const _ProPitchHeroCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: UI.heroGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x351F48E8),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.workspace_premium_rounded,
                  color: UI.goldBright,
                  size: 22,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Unlock PracticeKoro Pro',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'Targeting WBP, KP SI, WBCS, Food SI & WBPSC exams? Get complete access to real exam-pattern mock tests, detailed Bengali explanations, and state leaderboards.',
            style: TextStyle(
              fontSize: 13,
              height: 1.4,
              color: Color(0xFFE0E7FF),
            ),
          ),
        ],
      ),
    );
  }
}

/// Card representing a single subscription plan.
class _PlanCard extends StatelessWidget {
  final SubscriptionPlanModel plan;
  final bool isCurrentPlan;
  final VoidCallback onSelect;

  const _PlanCard({
    required this.plan,
    required this.isCurrentPlan,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final isBestValue =
        !plan.isFree &&
        (plan.durationDays >= 365 || plan.discountPercentage >= 60);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isBestValue
              ? UI.primary
              : (plan.isFree ? const Color(0xFFE2E8F0) : UI.line),
          width: isBestValue ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isBestValue
                ? UI.primary.withValues(alpha: 0.08)
                : const Color(0x08000000),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top pill badge for Best Value or Recommended or Free Starter
          if (plan.isFree)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 6),
              decoration: const BoxDecoration(
                color: Color(0xFF64748B),
                borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
              ),
              alignment: Alignment.center,
              child: const Text(
                'FREE STARTER · সর্বদা বিনামূল্যে',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: 0.6,
                ),
              ),
            )
          else if (isBestValue)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 6),
              decoration: const BoxDecoration(
                color: UI.primary,
                borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
              ),
              alignment: Alignment.center,
              child: Text(
                '★ BEST VALUE · SAVE ${plan.discountPercentage}%',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: 0.6,
                ),
              ),
            ),

          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title and Duration Tag
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            plan.title,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: UI.text,
                              letterSpacing: -0.3,
                            ),
                          ),
                          if (plan.description.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              plan.description,
                              style: const TextStyle(
                                fontSize: 12,
                                height: 1.35,
                                color: UI.muted,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: UI.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: UI.line),
                      ),
                      child: Text(
                        plan.formattedDuration,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: UI.textSoft,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Pricing Row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      plan.isFree ? 'Free' : '₹${plan.price.toInt()}',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: UI.text,
                        letterSpacing: -1,
                      ),
                    ),
                    if (plan.isFree) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: UI.line),
                        ),
                        child: const Text(
                          'Forever',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: UI.textSoft,
                          ),
                        ),
                      ),
                    ] else if (plan.originalPrice != null &&
                        plan.originalPrice! > plan.price) ...[
                      const SizedBox(width: 8),
                      Text(
                        '₹${plan.originalPrice!.toInt()}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: UI.muted,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: UI.successSoft,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${plan.discountPercentage}% OFF',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: UI.success,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),

                const SizedBox(height: 2),
                Text(
                  plan.isFree
                      ? 'Free access for all students • No payment required'
                      : 'One-time payment • No auto-renewal',
                  style: const TextStyle(fontSize: 12, color: UI.muted),
                ),

                const SizedBox(height: 16),
                const Divider(height: 1, color: UI.line),
                const SizedBox(height: 14),

                // Feature bullet points
                for (final feature in plan.features)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: UI.successSoft,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check_rounded,
                            size: 14,
                            color: UI.success,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            feature,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: UI.textSoft,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 8),

                // CTA Button
                SizedBox(
                  width: double.infinity,
                  child: plan.isFree
                      ? (isCurrentPlan
                            ? OutlinedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'You are currently on the Free Plan. Upgrade to a Pro Pass above for full access to all mock tests.',
                                      ),
                                      backgroundColor: Color(0xFF0F172A),
                                      duration: Duration(seconds: 3),
                                    ),
                                  );
                                },
                                icon: const Icon(
                                  Icons.check_circle_rounded,
                                  color: UI.success,
                                  size: 18,
                                ),
                                label: const Text(
                                  'Current Active Plan',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: UI.success,
                                  ),
                                ),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: UI.success),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                ),
                              )
                            : OutlinedButton(
                                onPressed: null,
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: UI.line),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                ),
                                child: const Text(
                                  'Free Starter (Included)',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: UI.muted,
                                  ),
                                ),
                              ))
                      : (isCurrentPlan
                            ? OutlinedButton.icon(
                                onPressed: null,
                                icon: const Icon(
                                  Icons.check_circle_rounded,
                                  color: UI.success,
                                  size: 18,
                                ),
                                label: const Text(
                                  'Current Active Plan',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: UI.success,
                                  ),
                                ),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: UI.success),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                ),
                              )
                            : ElevatedButton(
                                onPressed: onSelect,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: isBestValue
                                      ? UI.primary
                                      : const Color(0xFF0F172A),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  elevation: isBestValue ? 2 : 0,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'Get ${plan.formattedDuration} Pass',
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Icon(
                                      Icons.arrow_forward_rounded,
                                      size: 16,
                                    ),
                                  ],
                                ),
                              )),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// 4-box grid of Pro benefits
class _FeaturePerksGrid extends StatelessWidget {
  const _FeaturePerksGrid();

  @override
  Widget build(BuildContext context) {
    const perks = [
      (
        Icons.timer_outlined,
        UI.primary,
        'Exact Exam Interface',
        'Official timer, marks & negative marking simulator.',
      ),
      (
        Icons.menu_book_rounded,
        UI.purple,
        'Bengali Explanations',
        'In-depth step-by-step reasoning for every single question.',
      ),
      (
        Icons.leaderboard_rounded,
        UI.gold,
        'District & State Rank',
        'Compete and see where you stand among West Bengal aspirants.',
      ),
      (
        Icons.auto_fix_high_rounded,
        UI.teal,
        'Mistakes Notebook',
        'Auto-collect tricky questions for smart quick revision.',
      ),
    ];

    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.15,
      children: [
        for (final perk in perks)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: UI.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(perk.$1, color: perk.$2, size: 24),
                const SizedBox(height: 8),
                Text(
                  perk.$3,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: UI.text,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  perk.$4,
                  style: const TextStyle(
                    fontSize: 12,
                    color: UI.muted,
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// Expandable FAQ tile
class _FaqTile extends StatelessWidget {
  final String question;
  final String answer;

  const _FaqTile({required this.question, required this.answer});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: UI.line),
      ),
      child: Material(
        color: Colors.transparent,
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
          iconColor: UI.primary,
          collapsedIconColor: UI.muted,
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
          title: Text(
            question,
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w700,
              color: UI.text,
            ),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 14),
              child: Text(
                answer,
                style: const TextStyle(
                  fontSize: 12.5,
                  height: 1.4,
                  color: UI.textSoft,
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
  }
}

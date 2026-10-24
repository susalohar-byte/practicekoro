import 'package:practicekoro_mobile/data/datasources/local_storage.dart';

/// Plans as the server returned them on an earlier visit. Tests seed them into
/// the offline cache because the app no longer has built-in plans or prices.
const fixturePlans = <Map<String, dynamic>>[
  {
    'id': 'plan_free',
    'name': 'Free Starter',
    'title': 'Free Plan',
    'description': 'Basic access to free practice content.',
    'duration_days': 365,
    'price': 0,
    'original_price': 0,
    'currency': 'INR',
    'features': ['Topic-wise Practice Tests (Free)'],
    'is_active': true,
    'order_index': 0,
  },
  {
    'id': 'plan_6_month',
    'name': '6 Months Pass',
    'title': '6-Months Pro Pass',
    'description': 'Exam preparation pass for 180 days.',
    'duration_days': 180,
    'price': 199,
    'original_price': 499,
    'currency': 'INR',
    'features': ['All Full Mock Tests & PYQs'],
    'is_active': true,
    'order_index': 2,
  },
  {
    'id': 'pro_1_year',
    'name': 'PracticeKoro Pro Pass',
    'title': '1-Year All-Access Pro Pass',
    'description': 'Access to all premium tests for 365 days.',
    'duration_days': 365,
    'price': 299,
    'original_price': 999,
    'currency': 'INR',
    'features': ['Universal access to ALL Premium Mock Tests'],
    'is_active': true,
    'order_index': 3,
  },
];

Future<void> seedCachedPlans() =>
    LocalStorageService.saveCachedPlans(fixturePlans);

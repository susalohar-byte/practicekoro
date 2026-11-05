import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/result_analytics/solutions_screen.dart';
import 'catalog_repository.dart';
import 'profile_repository.dart';
import 'ranking_repository.dart';
import 'subscription_repository.dart';
import 'support_repository.dart';

/// Drops every provider that holds the signed-in student's data. The app keeps
/// these alive for the whole session, so without this the next student on the
/// same phone sees the previous student's results, rank, pass and tickets.
void resetAccountProviders(WidgetRef ref) {
  ref.invalidate(studentProfileProvider);
  ref.invalidate(attemptHistoryProvider);
  ref.invalidate(testAttemptProvider);
  ref.invalidate(testSolutionsProvider);
  ref.invalidate(rankingSummaryProvider);
  ref.invalidate(rankPreviewProvider);
  ref.invalidate(studentSubscriptionProvider);
  ref.invalidate(studentTicketsProvider);
}

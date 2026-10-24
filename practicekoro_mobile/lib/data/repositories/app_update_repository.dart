import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_build.dart';
import 'auth_repository.dart';

const defaultUpdateUrl = 'https://practicekoro.online';

class AppUpdateStatus {
  final bool required;
  final String updateUrl;

  const AppUpdateStatus({
    this.required = false,
    this.updateUrl = defaultUpdateUrl,
  });
}

/// Whether this build is older than `app_settings.mobile_min_build_number`.
final appUpdateProvider = FutureProvider<AppUpdateStatus>((ref) {
  return const AppUpdateRepository().check();
});

class AppUpdateRepository {
  const AppUpdateRepository();

  /// Never blocks on missing settings or network errors: an outage must not lock
  /// students out of the app.
  Future<AppUpdateStatus> check() async {
    final client = supabaseClient;
    if (client == null) return const AppUpdateStatus();
    try {
      final rows = await client
          .from('app_settings')
          .select('id, value')
          .inFilter('id', ['mobile_min_build_number', 'mobile_update_url'])
          .timeout(const Duration(seconds: 10));
      final values = {
        for (final row in rows) row['id'].toString(): _unwrap(row['value']),
      };
      return evaluate(
        minBuild: values['mobile_min_build_number'],
        updateUrl: values['mobile_update_url'],
      );
    } catch (e) {
      debugPrint('App update check skipped: $e');
      return const AppUpdateStatus();
    }
  }

  /// [minBuild] and [updateUrl] are the raw setting values (number or string).
  @visibleForTesting
  static AppUpdateStatus evaluate({
    Object? minBuild,
    Object? updateUrl,
    int currentBuild = appBuildNumber,
  }) {
    final min = minBuild is num
        ? minBuild.toInt()
        : int.tryParse('${minBuild ?? ''}'.trim());
    final url = '${updateUrl ?? ''}'.trim();
    final validUrl = Uri.tryParse(url)?.scheme == 'https'
        ? url
        : defaultUpdateUrl;
    return AppUpdateStatus(
      required: min != null && currentBuild < min,
      updateUrl: validUrl,
    );
  }

  // app_settings.value is jsonb; the admin panel may store "3" or 3 or "\"3\"".
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

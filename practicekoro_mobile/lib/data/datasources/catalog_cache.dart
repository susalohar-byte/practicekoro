import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Keeps public catalog rows (exams, subjects, topics, tests, live tests) on
/// the phone, so reopening the app does not download them from Supabase again.
///
/// Only the public catalog goes here, never student data. Each entry carries
/// the time it was saved: callers decide how old is still fresh, and an older
/// copy can still be shown while the phone is offline.
class CatalogDiskCache {
  CatalogDiskCache._();

  /// Bump to drop every saved entry after a catalog format change.
  static const _prefix = 'catalog_cache_v1:';

  /// Entries bigger than this are not saved (they would bloat preferences).
  static const maxBytes = 256 * 1024;

  /// How old a copy may be and still stand in when the server is unreachable.
  static const maxStale = Duration(days: 7);

  // remove()/clear() take effect at once, even before the disk write finishes:
  // entries saved at or before these times are ignored.
  static final Map<String, int> _removedAt = {};
  static int _clearedAt = 0;

  /// Saved rows for [key] if they are younger than [maxAge], else null.
  static Future<List<Map<String, dynamic>>?> read(
    String key, {
    required Duration maxAge,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('$_prefix$key');
      if (raw == null) return null;
      final decoded = jsonDecode(raw);
      if (decoded is! Map) return null;
      final savedMs = (decoded['t'] as num?)?.toInt() ?? 0;
      if (savedMs <= _clearedAt || savedMs <= (_removedAt[key] ?? 0)) {
        return null;
      }
      final savedAt = DateTime.fromMillisecondsSinceEpoch(savedMs);
      final age = DateTime.now().difference(savedAt);
      if (age.isNegative || age > maxAge) return null;
      final rows = decoded['rows'];
      if (rows is! List) return null;
      return rows
          .whereType<Map>()
          .map((m) => Map<String, dynamic>.from(m))
          .toList();
    } catch (e) {
      debugPrint('Catalog cache read failed for $key: $e');
      return null;
    }
  }

  static Future<void> write(String key, List<Map<String, dynamic>> rows) async {
    try {
      final encoded = jsonEncode({
        't': DateTime.now().millisecondsSinceEpoch,
        'rows': rows,
      });
      if (encoded.length > maxBytes) return;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('$_prefix$key', encoded);
    } catch (e) {
      debugPrint('Catalog cache write failed for $key: $e');
    }
  }

  static Future<void> remove(String key) async {
    _removedAt[key] = DateTime.now().millisecondsSinceEpoch;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('$_prefix$key');
  }

  static Future<void> clear() async {
    _clearedAt = DateTime.now().millisecondsSinceEpoch;
    _removedAt.clear();
    final prefs = await SharedPreferences.getInstance();
    for (final key in prefs.getKeys().toList()) {
      if (key.startsWith(_prefix)) await prefs.remove(key);
    }
  }
}

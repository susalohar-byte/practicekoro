import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  LocalStorageService._();

  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  static String getUserName() {
    return _prefs?.getString('user_name') ?? '';
  }

  static Future<void> setUserName(String name) async {
    await _prefs?.setString('user_name', name);
  }

  static String getUserEmail() {
    return _prefs?.getString('user_email') ?? '';
  }

  static Future<void> setUserEmail(String email) async {
    await _prefs?.setString('user_email', email);
  }

  static String? getUserAvatar() {
    return _prefs?.getString('user_avatar');
  }

  static Future<void> setUserAvatar(String? url) async {
    if (url == null) {
      await _prefs?.remove('user_avatar');
    } else {
      await _prefs?.setString('user_avatar', url);
    }
  }

  static String? getUserCustomAvatar() {
    return _prefs?.getString('user_custom_avatar');
  }

  static Future<void> setUserCustomAvatar(String? url) async {
    if (url == null) {
      await _prefs?.remove('user_custom_avatar');
    } else {
      await _prefs?.setString('user_custom_avatar', url);
    }
  }

  static String? getUserGoogleAvatar() {
    return _prefs?.getString('user_google_avatar');
  }

  static Future<void> setUserGoogleAvatar(String? url) async {
    if (url == null) {
      await _prefs?.remove('user_google_avatar');
    } else {
      await _prefs?.setString('user_google_avatar', url);
    }
  }

  static String getUserDistrict() {
    return _prefs?.getString('user_district') ?? '';
  }

  static Future<void> setUserDistrict(String district) async {
    await _prefs?.setString('user_district', district);
  }

  static String getUserCaste() {
    return _prefs?.getString('user_caste') ?? '';
  }

  static Future<void> setUserCaste(String caste) async {
    await _prefs?.setString('user_caste', caste);
  }

  static String getUserDob() {
    return _prefs?.getString('user_dob') ?? '';
  }

  static Future<void> setUserDob(String dob) async {
    await _prefs?.setString('user_dob', dob);
  }

  static bool getIsPro() {
    return _prefs?.getBool('is_pro') ??
        _prefs?.getBool('practicekoro_is_pro') ??
        false;
  }

  static Future<void> setIsPro(bool isPro) async {
    await _prefs?.setBool('is_pro', isPro);
    await _prefs?.setBool('practicekoro_is_pro', isPro);
  }

  /// Saved student profile (same keys as `public.profiles`), or null if none.
  /// Falls back to a name/email the user saved earlier, never to demo values.
  static Map<String, dynamic>? getProfileJson() {
    final raw = _prefs?.getString('student_profile');
    if (raw != null) {
      try {
        return jsonDecode(raw) as Map<String, dynamic>;
      } catch (_) {}
    }
    final name = _prefs?.getString('user_name');
    final email = _prefs?.getString('user_email');
    if (name == null && email == null) return null;
    return {
      'full_name': name ?? '',
      'email': email ?? '',
      'avatar_url': _prefs?.getString('user_avatar'),
      'custom_avatar_url': getUserCustomAvatar(),
      'google_avatar_url': getUserGoogleAvatar(),
      'district': getUserDistrict(),
      'caste': getUserCaste(),
      'birth_date': getUserDob(),
      'is_pro': getIsPro(),
    };
  }

  /// Saves the profile and keeps the older name/email/avatar keys in sync,
  /// since other screens still read them.
  static Future<void> saveProfileJson(Map<String, dynamic> profile) async {
    await _prefs?.setString('student_profile', jsonEncode(profile));
    final name = profile['full_name']?.toString() ?? '';
    final email = profile['email']?.toString() ?? '';
    final district = profile['district']?.toString() ?? '';
    final caste =
        profile['caste']?.toString() ?? profile['category']?.toString() ?? '';
    final dob =
        profile['birth_date']?.toString() ??
        profile['date_of_birth']?.toString() ??
        profile['dob']?.toString() ??
        '';

    if (name.isNotEmpty) await setUserName(name);
    if (email.isNotEmpty) await setUserEmail(email);
    if (district.isNotEmpty) await setUserDistrict(district);
    if (caste.isNotEmpty) await setUserCaste(caste);
    if (dob.isNotEmpty) await setUserDob(dob);
    if (profile.containsKey('is_pro') && profile['is_pro'] is bool) {
      await setIsPro(profile['is_pro'] as bool);
    }
    await setUserAvatar(profile['avatar_url']?.toString());
    if (profile['custom_avatar_url'] != null) {
      await setUserCustomAvatar(profile['custom_avatar_url'].toString());
    } else if (profile.containsKey('custom_avatar_url') && profile['custom_avatar_url'] == null) {
      await setUserCustomAvatar(null);
    }
    if (profile['google_avatar_url'] != null) {
      await setUserGoogleAvatar(profile['google_avatar_url'].toString());
    }
  }

  /// Server-assigned rank; 0 (unknown) until one is saved. Never a demo value.
  static int getUserRank() {
    return _prefs?.getInt('user_rank') ?? 0;
  }

  static List<String> getBookmarks() {
    return _prefs?.getStringList('bookmarks') ?? [];
  }

  static Future<void> toggleBookmark(
    String questionId, {
    Map<String, dynamic>? questionData,
  }) async {
    final list = getBookmarks();
    if (list.contains(questionId)) {
      list.remove(questionId);
      await _prefs?.remove('saved_q_$questionId');
    } else {
      list.add(questionId);
      if (questionData != null) {
        await _prefs?.setString(
          'saved_q_$questionId',
          jsonEncode(questionData),
        );
      }
    }
    await _prefs?.setStringList('bookmarks', list);
  }

  static Future<void> saveQuestion(
    String questionId,
    Map<String, dynamic> data,
  ) async {
    final list = getBookmarks();
    if (!list.contains(questionId)) {
      list.add(questionId);
      await _prefs?.setStringList('bookmarks', list);
    }
    await _prefs?.setString('saved_q_$questionId', jsonEncode(data));
  }

  static Future<void> removeBookmark(String questionId) async {
    final list = getBookmarks();
    list.remove(questionId);
    await _prefs?.setStringList('bookmarks', list);
    await _prefs?.remove('saved_q_$questionId');
  }

  static bool isBookmarked(String questionId) {
    return getBookmarks().contains(questionId);
  }

  static List<Map<String, dynamic>> getSavedQuestionsData() {
    final ids = getBookmarks();
    final List<Map<String, dynamic>> res = [];
    for (final id in ids) {
      final raw = _prefs?.getString('saved_q_$id');
      if (raw != null) {
        try {
          res.add(jsonDecode(raw) as Map<String, dynamic>);
        } catch (_) {}
      }
    }
    return res;
  }

  static Map<String, dynamic>? getSavedAttempt(String attemptId) {
    final raw = _prefs?.getString('attempt_$attemptId');
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  static Future<void> saveAttempt(
    String attemptId,
    Map<String, dynamic> data,
  ) async {
    await _prefs?.setString('attempt_$attemptId', jsonEncode(data));
  }

  static Map<String, dynamic>? getSubscriptionDetails() {
    final raw = _prefs?.getString('subscription_details');
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  static Future<void> saveSubscriptionDetails(
    Map<String, dynamic> details,
  ) async {
    await _prefs?.setString('subscription_details', jsonEncode(details));
  }

  static List<Map<String, dynamic>>? getCachedPlans() {
    final raw = _prefs?.getString('cached_subscription_plans');
    if (raw == null) return null;
    try {
      final list = jsonDecode(raw) as List;
      return list.cast<Map<String, dynamic>>();
    } catch (_) {
      return null;
    }
  }

  static Future<void> saveCachedPlans(
    List<Map<String, dynamic>> plans,
  ) async {
    await _prefs?.setString('cached_subscription_plans', jsonEncode(plans));
  }

  static List<Map<String, dynamic>> getSavedTickets() {
    final raw = _prefs?.getString('saved_support_tickets');
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveTicketLocally(Map<String, dynamic> ticket) async {
    final list = getSavedTickets();
    list.removeWhere((t) => t['id'] == ticket['id']);
    list.insert(0, ticket);
    await _prefs?.setString('saved_support_tickets', jsonEncode(list));
  }

  static Future<void> saveAllTicketsLocally(
    List<Map<String, dynamic>> tickets,
  ) async {
    await _prefs?.setString('saved_support_tickets', jsonEncode(tickets));
  }

  /// Removes everything tied to the signed-in student (profile, cached
  /// results, bookmarks) so the next account on this phone starts clean.
  static Future<void> clearAccountData() async {
    final prefs = _prefs;
    if (prefs == null) return;
    const keys = {
      'student_profile',
      'user_name',
      'user_email',
      'user_district',
      'user_caste',
      'user_dob',
      'user_avatar',
      'user_rank',
      'bookmarks',
      'is_pro',
      'practicekoro_is_pro',
      'subscription_details',
      'cached_subscription_plans',
    };
    for (final key in prefs.getKeys().toList()) {
      if (keys.contains(key) ||
          key.startsWith('attempt_') ||
          key.startsWith('saved_q_')) {
        await prefs.remove(key);
      }
    }
  }
}

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../datasources/local_storage.dart';

/// Supabase URL comes from `--dart-define-from-file=config/supabase.json` or defaults.
const _defaultSupabaseUrl = 'https://prycanbnxuihxhskallw.supabase.co';

const _supabaseUrl = String.fromEnvironment('SUPABASE_URL', defaultValue: _defaultSupabaseUrl);

/// False when the app was built without Supabase config; sign-in cannot work.
bool get backendConfigured => _supabaseUrl.startsWith('https://');

SupabaseClient? get supabaseClient {
  if (!backendConfigured) return null;
  try {
    return Supabase.instance.client;
  } catch (_) {
    return null;
  }
}

/// Columns of `public.profiles` a student may edit (role/status are server-owned).
const _editableProfileColumns = {
  'full_name',
  'phone',
  'avatar_url',
  'custom_avatar_url',
  'target_exam_id',
  'target_exam_title',
  'state',
  'district',
  'block',
  'gender',
  'category',
  'dob',
  'preparation_status',
  'preferred_subjects',
};

class AuthRepository {
  const AuthRepository();

  /// Test hook: forces the signed-in state (widget tests have no backend).
  @visibleForTesting
  static bool? signedInOverride;

  GoTrueClient? get _auth => supabaseClient?.auth;

  Session? get session => _auth?.currentSession;
  User? get user => _auth?.currentUser;
  bool get isSignedIn => signedInOverride ?? session != null;

  Stream<AuthState> get changes =>
      _auth?.onAuthStateChange ?? const Stream.empty();

  GoTrueClient _require() {
    final auth = _auth;
    if (auth == null) {
      throw const AuthFailure(
        'The app is not connected to the PracticeKoro server. Please update the app.',
      );
    }
    return auth;
  }

  /// 1-Click Google Sign-In via Supabase OAuth
  Future<bool> signInWithGoogle({String? redirectTo}) => _guard(() async {
    final auth = _require();
    final defaultRedirect = kIsWeb
        ? null
        : 'com.practicekoro://login-callback';

    return await auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: redirectTo ?? defaultRedirect,
      authScreenLaunchMode: kIsWeb
          ? LaunchMode.platformDefault
          : LaunchMode.externalApplication,
    );
  });

  Future<void> signIn({required String email, required String password}) =>
      _guard(() async {
        await _require().signInWithPassword(
          email: email.trim(),
          password: password,
        );
        await syncProfileFromServer();
      });

  /// Returns true when the project requires email confirmation first.
  Future<bool> signUp({
    required String fullName,
    required String email,
    required String password,
  }) => _guard(() async {
    final res = await _require().signUp(
      email: email.trim(),
      password: password,
      // Read by the `handle_new_user` trigger to create the profile row.
      data: {'full_name': fullName.trim()},
    );
    if (res.session == null) return true;
    await syncProfileFromServer();
    return false;
  });

  Future<void> sendPasswordReset(String email) => _guard(
    () => _require().resetPasswordForEmail(
      email.trim(),
      redirectTo: 'com.practicekoro://login-callback',
    ),
  );

  Future<void> updatePassword(String password) =>
      _guard(() => _require().updateUser(UserAttributes(password: password)));

  Future<void> signOut() async {
    try {
      await _auth?.signOut();
    } finally {
      // The next student on this phone must not see this student's details.
      await LocalStorageService.clearAccountData();
    }
  }

  /// Permanently deletes the signed-in student's account through the `delete_own_account`
  /// RPC, then signs out. Practice data is deleted with the account; payment records stay
  /// on the server without a link to the student. Throws when the server refuses, so the
  /// student is never told the account is gone while it still exists.
  Future<void> deleteAccount() async {
    final client = supabaseClient;
    final uid = client?.auth.currentUser?.id;
    if (client == null || uid == null) {
      throw const AccountDeletionException('Please sign in again, then try deleting your account.');
    }

    // Profile pictures live in storage under {uid}/, which the database cascade cannot reach
    try {
      final files = await client.storage.from('avatars').list(path: uid);
      if (files.isNotEmpty) {
        await client.storage.from('avatars').remove([for (final f in files) '$uid/${f.name}']);
      }
    } catch (e) {
      debugPrint('Avatar cleanup before account deletion failed: $e');
    }

    try {
      await client.rpc('delete_own_account');
    } on PostgrestException catch (e) {
      debugPrint('delete_own_account failed: ${e.message}');
      throw AccountDeletionException(
        e.code == '42501'
            ? e.message
            : 'Your account could not be deleted. Please try again, or email support@practicekoro.online.',
      );
    }

    await signOut();
  }

  /// Copies the student's `profiles` row & auth metadata into the on-device profile.
  Future<void> syncProfileFromServer() async {
    final client = supabaseClient;
    final currentUser = client?.auth.currentUser;
    final uid = currentUser?.id;
    if (client == null || uid == null || currentUser == null) return;
    try {
      final row = await client
          .from('profiles')
          .select()
          .eq('id', uid)
          .maybeSingle();

      final local = LocalStorageService.getProfileJson() ?? {};
      final meta = currentUser.userMetadata ?? {};

      final merged = <String, dynamic>{
        ...local,
        'email': currentUser.email ?? local['email'] ?? '',
      };

      // 1. Incorporate User Metadata from Auth (synced across Web & Mobile)
      if (meta['full_name'] != null &&
          meta['full_name'].toString().trim().isNotEmpty) {
        merged['full_name'] = meta['full_name'];
      }
      final googleAvatar = (meta['avatar_url'] ?? meta['picture'])?.toString().trim();
      final customAvatar = meta['custom_avatar_url']?.toString().trim();

      if (googleAvatar != null && googleAvatar.isNotEmpty) {
        merged['google_avatar_url'] = googleAvatar;
      }
      if (customAvatar != null && customAvatar.isNotEmpty) {
        merged['custom_avatar_url'] = customAvatar;
      }
      if (customAvatar != null && customAvatar.isNotEmpty) {
        merged['avatar_url'] = customAvatar;
      } else if (googleAvatar != null && googleAvatar.isNotEmpty) {
        merged['avatar_url'] = googleAvatar;
      }
      if (meta['district'] != null &&
          meta['district'].toString().trim().isNotEmpty) {
        merged['district'] = meta['district'];
      }
      if (meta['block'] != null &&
          meta['block'].toString().trim().isNotEmpty) {
        merged['block'] = meta['block'];
      }
      if (meta['state'] != null) merged['state'] = meta['state'];
      if (meta['gender'] != null) merged['gender'] = meta['gender'];
      if (meta['category'] != null) {
        merged['category'] = meta['category'];
        merged['caste'] = meta['category'];
      } else if (meta['caste'] != null) {
        merged['category'] = meta['caste'];
        merged['caste'] = meta['caste'];
      }
      if (meta['dob'] != null) {
        merged['dob'] = meta['dob'];
        merged['birth_date'] = meta['dob'];
      }
      if (meta['target_exam_id'] != null) {
        merged['target_exam_id'] = meta['target_exam_id'];
      }
      if (meta['target_exam_title'] != null) {
        merged['target_exam_title'] = meta['target_exam_title'];
      }
      if (meta['preparation_status'] != null) {
        merged['preparation_status'] = meta['preparation_status'];
      }
      if (meta['preferred_subjects'] != null) {
        merged['preferred_subjects'] = meta['preferred_subjects'];
      }

      // 2. Incorporate public.profiles database row if available
      if (row != null) {
        for (final e in row.entries) {
          if (e.value != null && e.value.toString().trim().isNotEmpty) {
            merged[e.key] = e.value;
          }
        }
        if (row['dob'] != null) {
          merged['birth_date'] = row['dob'];
          merged['dob'] = row['dob'];
        }
        if (row['email'] != null && row['email'].toString().isNotEmpty) {
          merged['email'] = row['email'];
        }
      }

      await LocalStorageService.saveProfileJson(merged);
    } catch (e) {
      debugPrint('Profile sync failed: $e');
    }
  }

  /// Saves the editable profile fields to `public.profiles` with resilient fallback,
  /// and mirrors demographic data into `auth.users` metadata for cross-platform reliability.
  Future<void> pushProfileToServer(Map<String, dynamic> profile) async {
    final client = supabaseClient;
    final uid = client?.auth.currentUser?.id;
    if (client == null || uid == null) return;

    final update = <String, dynamic>{};
    for (final e in profile.entries) {
      if (_editableProfileColumns.contains(e.key) && e.value != null) {
        update[e.key] = e.value;
      }
    }

    if (update.isNotEmpty) {
      try {
        await client.from('profiles').update(update).eq('id', uid);
      } catch (err) {
        debugPrint(
          'Full profile update warning: $err. Retrying with basic fields.',
        );
        try {
          final basicUpdate = <String, dynamic>{
            'full_name': profile['full_name'] ?? '',
          };
          if (profile['phone'] != null) basicUpdate['phone'] = profile['phone'];
          if (profile['avatar_url'] != null) {
            basicUpdate['avatar_url'] = profile['avatar_url'];
          }
          if (profile['district'] != null) {
            basicUpdate['district'] = profile['district'];
          }
          if (profile['block'] != null) {
            basicUpdate['block'] = profile['block'];
          }
          await client.from('profiles').update(basicUpdate).eq('id', uid);
        } catch (basicErr) {
          debugPrint('Basic profile update error: $basicErr');
        }
      }
    }

    // Always mirror full profile into Supabase Auth user metadata
    try {
      await client.auth.updateUser(
        UserAttributes(
          data: {
            'full_name': profile['full_name'],
            'phone': profile['phone'],
            'avatar_url': profile['avatar_url'],
            'custom_avatar_url': profile['custom_avatar_url'],
            'google_avatar_url': profile['google_avatar_url'],
            'district': profile['district'],
            'block': profile['block'],
            'state': profile['state'] ?? 'West Bengal',
            'gender': profile['gender'],
            'category': profile['category'],
            'caste': profile['category'],
            'dob': profile['dob'] ?? profile['birth_date'],
            'target_exam_id': profile['target_exam_id'],
            'target_exam_title': profile['target_exam_title'],
            'preparation_status': profile['preparation_status'],
            'preferred_subjects': profile['preferred_subjects'],
          },
        ),
      );
    } catch (authErr) {
      debugPrint('Could not sync user_metadata in auth: $authErr');
    }
  }

  Future<T> _guard<T>(Future<T> Function() run) async {
    try {
      return await run();
    } on AuthFailure {
      rethrow;
    } on AuthException catch (e) {
      throw AuthFailure(_friendly(e.message));
    } on TimeoutException {
      throw const AuthFailure('The server took too long. Please try again.');
    } catch (e) {
      throw AuthFailure(
        e.toString().contains('SocketException')
            ? 'No internet connection. Please check your network.'
            : 'Something went wrong. Please try again.',
      );
    }
  }

  static String _friendly(String message) {
    final m = message.toLowerCase();
    if (m.contains('invalid login')) return 'Incorrect email or password.';
    if (m.contains('email not confirmed')) {
      return 'Please confirm your email first. Check your inbox for the link.';
    }
    if (m.contains('already registered') ||
        m.contains('already been registered')) {
      return 'An account with this email already exists. Please log in.';
    }
    if (m.contains('password should be')) {
      return 'Password must be at least 6 characters.';
    }
    if (m.contains('rate limit')) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    return message;
  }
}

class AuthFailure implements Exception {
  final String message;
  const AuthFailure(this.message);
  @override
  String toString() => message;
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => const AuthRepository(),
);

/// Notifies the router whenever the student signs in or out.
class AuthChangeNotifier extends ChangeNotifier {
  AuthChangeNotifier(AuthRepository repo) {
    _sub = repo.changes.listen((state) {
      if (state.event == AuthChangeEvent.passwordRecovery) {
        passwordRecoveryPending = true;
      }
      if (state.event == AuthChangeEvent.signedIn ||
          state.event == AuthChangeEvent.tokenRefreshed) {
        unawaited(repo.syncProfileFromServer());
      }
      notifyListeners();
    });
  }

  late final StreamSubscription<AuthState> _sub;

  /// Set when the student opened a password-reset link.
  bool passwordRecoveryPending = false;

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}

/// App-wide auth listener used by the router (created on first use, after
/// Supabase has been initialised in main()).
final authChanges = AuthChangeNotifier(const AuthRepository());

/// Shown to the student when account deletion did not go through.
class AccountDeletionException implements Exception {
  const AccountDeletionException(this.message);
  final String message;

  @override
  String toString() => message;
}

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../datasources/local_storage.dart';
import '../models/student_profile_model.dart';
import 'auth_repository.dart';

/// The signed-in student's profile: `public.profiles`, cached on the phone.
final studentProfileProvider =
    NotifierProvider<StudentProfileNotifier, StudentProfileModel>(
      StudentProfileNotifier.new,
    );

class StudentProfileNotifier extends Notifier<StudentProfileModel> {
  @override
  StudentProfileModel build() {
    return _loadFromStorageAndAuth();
  }

  StudentProfileModel _loadFromStorageAndAuth() {
    final json = LocalStorageService.getProfileJson();
    var profile = json == null
        ? const StudentProfileModel()
        : StudentProfileModel.fromJson(json);

    // If local storage didn't have user name or email yet, hydrate from Supabase Auth
    final client = supabaseClient;
    final currentUser = client?.auth.currentUser;
    if (currentUser != null) {
      final meta = currentUser.userMetadata ?? {};
      final authName = meta['full_name']?.toString() ??
          meta['name']?.toString() ??
          currentUser.email?.split('@').first;
      final authEmail = currentUser.email;
      final authDistrict = meta['district']?.toString();
      final authBlock = meta['block']?.toString();
      final authCategory =
          meta['category']?.toString() ?? meta['caste']?.toString();

      final googleAvatar =
          (meta['avatar_url'] ?? meta['picture'])?.toString().trim();
      final customAvatar = meta['custom_avatar_url']?.toString().trim() ??
          profile.customAvatarUrl;

      if (profile.fullName.isEmpty && authName != null && authName.isNotEmpty) {
        profile = profile.copyWith(fullName: authName);
      }
      if (profile.email.isEmpty && authEmail != null && authEmail.isNotEmpty) {
        profile = profile.copyWith(email: authEmail);
      }
      if ((profile.district == null || profile.district!.isEmpty) &&
          authDistrict != null &&
          authDistrict.isNotEmpty) {
        profile = profile.copyWith(district: authDistrict);
      }
      if ((profile.block == null || profile.block!.isEmpty) &&
          authBlock != null &&
          authBlock.isNotEmpty) {
        profile = profile.copyWith(block: authBlock);
      }
      if ((profile.category == 'NOT_SPECIFIED' || profile.category.isEmpty) &&
          authCategory != null &&
          authCategory.isNotEmpty) {
        profile = profile.copyWith(category: authCategory);
      }
      final isProUser = meta['is_pro'] == true ||
          meta['plan']?.toString().toLowerCase() == 'pro' ||
          meta['isPro'] == true;
      if (isProUser && !profile.isPro) {
        profile = profile.copyWith(isPro: true);
      }
      if (profile.createdAt == null && currentUser.createdAt.isNotEmpty) {
        profile = profile.copyWith(
          createdAt: DateTime.tryParse(currentUser.createdAt),
        );
      }

      if (googleAvatar != null && googleAvatar.isNotEmpty) {
        profile = profile.copyWith(googleAvatarUrl: googleAvatar);
      }
      if (customAvatar != null && customAvatar.isNotEmpty) {
        profile = profile.copyWith(customAvatarUrl: customAvatar);
      }
      if (profile.avatarUrl == null || profile.avatarUrl!.isEmpty) {
        final effective = (customAvatar != null && customAvatar.isNotEmpty)
            ? customAvatar
            : googleAvatar;
        if (effective != null && effective.isNotEmpty) {
          profile = profile.copyWith(avatarUrl: effective);
        }
      }
    }
    return profile;
  }

  void reload() {
    state = _loadFromStorageAndAuth();
  }

  /// Saves locally on the device immediately and syncs with Supabase in the background.
  Future<void> save(StudentProfileModel profile) async {
    final json = profile.toJson();
    // 1. Immediately persist on the phone & update Riverpod state
    await LocalStorageService.saveProfileJson(json);
    state = profile;

    // 2. Sync to Supabase server & auth user metadata in background
    try {
      await const AuthRepository().pushProfileToServer(json);
    } catch (e) {
      debugPrint('Background profile sync warning: $e');
    }
  }

  /// Picks an image from camera or gallery, uploads to Supabase storage 'avatars' bucket,
  /// saves in local storage and database, and updates profile.
  Future<String?> pickAndUploadAvatar({required ImageSource source}) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (pickedFile == null) return null;

      final bytes = await pickedFile.readAsBytes();
      if (bytes.isEmpty) return null;

      final ext = pickedFile.name.split('.').last.toLowerCase();
      final cleanExt =
          (ext == 'png' || ext == 'webp' || ext == 'gif') ? ext : 'jpg';

      final client = supabaseClient;
      final currentUser = client?.auth.currentUser;
      String? publicUrl;

      if (client != null && currentUser != null) {
        try {
          final uid = currentUser.id;
          final path =
              '$uid/avatar_${DateTime.now().millisecondsSinceEpoch}.$cleanExt';
          await client.storage.from('avatars').uploadBinary(
                path,
                bytes,
                fileOptions: FileOptions(
                  contentType: 'image/$cleanExt',
                  upsert: true,
                ),
              );
          publicUrl = client.storage.from('avatars').getPublicUrl(path);
        } catch (storageErr) {
          // Never sync the photo inline as a data URI: it would be stored in
          // the profile row and downloaded with it on every read.
          debugPrint('Supabase storage upload error: $storageErr');
          rethrow;
        }
      }

      // Guest / offline only: the data URI stays on this device.
      publicUrl ??= 'data:image/$cleanExt;base64,${base64Encode(bytes)}';

      final updatedProfile = state.copyWith(
        customAvatarUrl: publicUrl,
        avatarUrl: publicUrl,
      );
      await save(updatedProfile);
      return publicUrl;
    } catch (e) {
      debugPrint('pickAndUploadAvatar failed: $e');
      rethrow;
    }
  }

  /// Removes custom uploaded picture and restores Google picture or default avatar.
  Future<void> removeCustomAvatar() async {
    final updatedProfile = state.copyWith(
      clearCustomAvatar: true,
      avatarUrl: state.googleAvatarUrl,
    );
    await save(updatedProfile);
  }
}

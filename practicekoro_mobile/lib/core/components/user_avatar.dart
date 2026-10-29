import 'dart:convert';
import 'dart:typed_data';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../data/repositories/profile_repository.dart';
import 'ui.dart';

/// Reusable user avatar widget supporting custom pictures, Google OAuth photos,
/// and default illustration/initial fallbacks.
class UserAvatar extends ConsumerWidget {
  final double size;
  final String? avatarUrl;
  final String? displayName;
  final VoidCallback? onTap;
  final bool showEditBadge;
  final VoidCallback? onEdit;
  final bool isLoading;
  final Color? borderColor;
  final double borderWidth;

  const UserAvatar({
    super.key,
    this.size = 40,
    this.avatarUrl,
    this.displayName,
    this.onTap,
    this.showEditBadge = false,
    this.onEdit,
    this.isLoading = false,
    this.borderColor,
    this.borderWidth = 0,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(studentProfileProvider);
    final effectiveUrl = avatarUrl ?? profile.effectiveAvatarUrl;
    final name = displayName ?? profile.fullName;
    final initial = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : 'P';

    final badgeSize = (size * 0.32).clamp(20.0, 32.0);

    return GestureDetector(
      onTap: onEdit ?? onTap,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              border: borderWidth > 0
                  ? Border.all(
                      color: borderColor ?? UI.primary.withValues(alpha: 0.25),
                      width: borderWidth,
                    )
                  : null,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ClipOval(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _buildImageContent(effectiveUrl, initial),
                  if (isLoading)
                    Container(
                      color: Colors.black.withValues(alpha: 0.45),
                      alignment: Alignment.center,
                      child: SizedBox(
                        width: size * 0.4,
                        height: size * 0.4,
                        child: const CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (showEditBadge)
            Positioned(
              right: -2,
              bottom: -2,
              child: GestureDetector(
                onTap: onEdit ?? () => showAvatarPickerSheet(context, ref),
                child: Container(
                  width: badgeSize,
                  height: badgeSize,
                  decoration: BoxDecoration(
                    color: UI.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.18),
                        blurRadius: 3,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.camera_alt_rounded,
                    color: Colors.white,
                    size: badgeSize * 0.54,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildImageContent(String? url, String initial) {
    if (url != null && url.isNotEmpty) {
      // 1. Base64 Data URI
      if (url.startsWith('data:image/')) {
        try {
          final commaIndex = url.indexOf(',');
          if (commaIndex != -1) {
            final base64Data = url.substring(commaIndex + 1);
            final Uint8List bytes = base64Decode(base64Data);
            return Image.memory(
              bytes,
              fit: BoxFit.cover,
              width: size,
              height: size,
              errorBuilder: (_, _, _) => _buildFallback(initial),
            );
          }
        } catch (_) {
          return _buildFallback(initial);
        }
      }

      // 2. Network URL (Google avatar or Supabase storage public URL)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // Saved on the phone's disk, so the photo is not downloaded each time.
        return CachedNetworkImage(
          imageUrl: url,
          fit: BoxFit.cover,
          width: size,
          height: size,
          errorWidget: (_, _, _) => _buildFallback(initial),
          progressIndicatorBuilder: (context, _, progress) {
            // The upload overlay already shows its own spinner.
            if (isLoading) return Container(color: UI.primarySoft);
            return Container(
              color: UI.primarySoft,
              alignment: Alignment.center,
              child: SizedBox(
                width: size * 0.35,
                height: size * 0.35,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  value: progress.progress,
                  valueColor: const AlwaysStoppedAnimation<Color>(UI.primary),
                ),
              ),
            );
          },
        );
      }

      // 3. Asset image
      if (url.startsWith('assets/')) {
        return Image.asset(
          url,
          fit: BoxFit.cover,
          width: size,
          height: size,
          errorBuilder: (_, _, _) => _buildFallback(initial),
        );
      }
    }

    return _buildFallback(initial);
  }

  Widget _buildFallback(String initial) {
    return Image.asset(
      'assets/images/logo-circle.webp',
      fit: BoxFit.cover,
      width: size,
      height: size,
      errorBuilder: (_, _, _) => Container(
        color: const Color(0xFFEFF6FF),
        alignment: Alignment.center,
        child: Text(
          initial,
          style: TextStyle(
            fontSize: size * 0.42,
            fontWeight: FontWeight.bold,
            color: UI.primary,
          ),
        ),
      ),
    );
  }
}

/// Displays the bottom modal sheet to take a photo, choose from gallery,
/// or revert back to the Google profile picture / default avatar.
Future<void> showAvatarPickerSheet(BuildContext context, WidgetRef ref) async {
  final profile = ref.read(studentProfileProvider);
  final hasCustom = (profile.customAvatarUrl ?? '').isNotEmpty;
  final hasGoogle = (profile.googleAvatarUrl ?? '').isNotEmpty;

  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (ctx) {
      return Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Change Profile Picture',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: UI.text,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Choose an image to represent your account',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: UI.primarySoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.camera_alt_rounded,
                    color: UI.primary,
                    size: 22,
                  ),
                ),
                title: const Text(
                  'Take Photo',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                ),
                subtitle: const Text('Capture using phone camera'),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                onTap: () async {
                  Navigator.of(ctx).pop();
                  await _handleAvatarUpload(context, ref, ImageSource.camera);
                },
              ),
              const SizedBox(height: 6),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3E8FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.photo_library_rounded,
                    color: UI.purple,
                    size: 22,
                  ),
                ),
                title: const Text(
                  'Choose from Gallery',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                ),
                subtitle: const Text('Select from saved pictures'),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                onTap: () async {
                  Navigator.of(ctx).pop();
                  await _handleAvatarUpload(context, ref, ImageSource.gallery);
                },
              ),
              if (hasCustom) ...[
                const SizedBox(height: 6),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: UI.dangerSoft,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.delete_outline_rounded,
                      color: UI.danger,
                      size: 22,
                    ),
                  ),
                  title: Text(
                    hasGoogle
                        ? 'Restore Google Picture'
                        : 'Remove Custom Picture',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: UI.danger,
                    ),
                  ),
                  subtitle: Text(
                    hasGoogle
                        ? 'Revert to your Google profile photo'
                        : 'Use PracticeKoro logo avatar',
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  onTap: () async {
                    Navigator.of(ctx).pop();
                    await _handleRemoveCustomAvatar(context, ref);
                  },
                ),
              ],
            ],
          ),
        ),
      );
    },
  );
}

Future<void> _handleAvatarUpload(
  BuildContext context,
  WidgetRef ref,
  ImageSource source,
) async {
  try {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
            SizedBox(width: 12),
            Text('Uploading profile picture...'),
          ],
        ),
        duration: Duration(seconds: 4),
        behavior: SnackBarBehavior.floating,
      ),
    );

    final result = await ref
        .read(studentProfileProvider.notifier)
        .pickAndUploadAvatar(source: source);

    if (result != null && context.mounted) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile picture updated successfully!'),
          backgroundColor: UI.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to update picture: $e'),
          backgroundColor: UI.danger,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}

Future<void> _handleRemoveCustomAvatar(
  BuildContext context,
  WidgetRef ref,
) async {
  try {
    await ref.read(studentProfileProvider.notifier).removeCustomAvatar();
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Custom picture removed successfully!'),
          backgroundColor: UI.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to remove custom picture: $e'),
          backgroundColor: UI.danger,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}

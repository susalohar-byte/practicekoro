import 'dart:convert';
import 'package:flutter/foundation.dart';

/// Model representing a promotional or announcement Hero Banner managed
/// by the Admin Panel in Supabase (`public.hero_banners`).
@immutable
class HeroBannerModel {
  final String id;
  final String title;
  final String subtitle;
  final String? badgeText;
  final String? highlightWord;
  final String imageUrl;
  final String? mobileImageUrl;
  final String bannerType; // 'full_image' | 'text_overlay'
  final bool showTextOverlay;
  final String themeGradient;
  final String primaryCtaText;
  final String primaryCtaLink;
  final String? secondaryCtaText;
  final String? secondaryCtaLink;
  final List<String> featurePills;
  final String targetAudience; // 'all' | 'free' | 'pro'
  final String placement; // 'home_hero' | 'catalog' | 'all'
  final DateTime? startsAt;
  final DateTime? expiresAt;
  final int clickCount;
  final bool isActive;
  final int displayOrder;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const HeroBannerModel({
    required this.id,
    required this.title,
    this.subtitle = '',
    this.badgeText,
    this.highlightWord,
    required this.imageUrl,
    this.mobileImageUrl,
    this.bannerType = 'full_image',
    this.showTextOverlay = false,
    this.themeGradient = 'blue',
    this.primaryCtaText = 'Start Now',
    this.primaryCtaLink = '/exams',
    this.secondaryCtaText,
    this.secondaryCtaLink,
    this.featurePills = const [],
    this.targetAudience = 'all',
    this.placement = 'home_hero',
    this.startsAt,
    this.expiresAt,
    this.clickCount = 0,
    this.isActive = true,
    this.displayOrder = 1,
    this.createdAt,
    this.updatedAt,
  });

  /// The effective image URL to display: prioritizes mobileImageUrl if present,
  /// otherwise falls back to imageUrl.
  String get effectiveImageUrl {
    if (mobileImageUrl != null && mobileImageUrl!.trim().isNotEmpty) {
      return mobileImageUrl!.trim();
    }
    return imageUrl.trim();
  }

  /// Whether the effective image is an HTTP/HTTPS remote URL.
  bool get isNetworkImage {
    final url = effectiveImageUrl.toLowerCase();
    return url.startsWith('http://') || url.startsWith('https://');
  }

  /// Whether the effective image is an inline Base64 data URI (data:image/...;base64,...).
  bool get isBase64Image {
    final url = effectiveImageUrl.toLowerCase();
    return url.startsWith('data:image/') && url.contains(';base64,');
  }

  /// Decoded bytes if this banner contains an inline Base64 image.
  Uint8List? get base64Bytes {
    if (!isBase64Image) return null;
    try {
      final index = effectiveImageUrl.indexOf(';base64,');
      if (index == -1) return null;
      final raw = effectiveImageUrl.substring(index + 8).trim();
      return base64Decode(raw);
    } catch (e) {
      debugPrint('Error decoding base64 banner: $e');
      return null;
    }
  }

  /// Whether the banner is currently live according to isActive and schedule dates.
  bool get isCurrentlyLive {
    if (!isActive) return false;
    final now = DateTime.now();
    if (startsAt != null && startsAt!.isAfter(now)) return false;
    if (expiresAt != null && expiresAt!.isBefore(now)) return false;
    return true;
  }

  static DateTime? _parseDate(dynamic date) {
    if (date == null) return null;
    if (date is DateTime) return date;
    final str = date.toString().trim();
    if (str.isEmpty) return null;
    try {
      return DateTime.parse(str);
    } catch (_) {
      return null;
    }
  }

  factory HeroBannerModel.fromJson(Map<String, dynamic> json) {
    final id = json['id']?.toString() ?? 'banner-${DateTime.now().millisecondsSinceEpoch}';
    final title = json['title']?.toString() ?? '';
    final subtitle = json['subtitle']?.toString() ?? '';
    final badgeText = json['badgeText']?.toString() ?? json['badge_text']?.toString();
    final highlightWord = json['highlightWord']?.toString() ?? json['highlight_word']?.toString();
    final rawImg = json['imageUrl']?.toString().trim() ?? json['image_url']?.toString().trim();
    final imageUrl = (rawImg != null && rawImg.isNotEmpty) ? rawImg : 'assets/images/hero_banner_hd.webp';
    final mobileImageUrl = json['mobileImageUrl']?.toString().trim() ?? json['mobile_image_url']?.toString().trim();
    final bannerType = json['bannerType']?.toString() ?? json['banner_type']?.toString() ?? 'full_image';
    final showOverlay = json['showTextOverlay'] == true ||
        json['show_text_overlay'] == true ||
        bannerType == 'text_overlay';
    final themeGradient = json['themeGradient']?.toString() ?? json['theme_gradient']?.toString() ?? 'blue';
    final primaryCtaText = json['primaryCtaText']?.toString() ??
        json['primary_cta_text']?.toString() ??
        'Start Now';
    final primaryCtaLink = json['primaryCtaLink']?.toString() ??
        json['primary_cta_link']?.toString() ??
        '/exams';
    final secondaryCtaText = json['secondaryCtaText']?.toString() ?? json['secondary_cta_text']?.toString();
    final secondaryCtaLink = json['secondaryCtaLink']?.toString() ?? json['secondary_cta_link']?.toString();

    List<String> pills = const [];
    final rawPills = json['featurePills'] ?? json['feature_pills'];
    if (rawPills is List) {
      pills = rawPills.map((e) => e.toString()).toList();
    }

    final targetAudience = json['targetAudience']?.toString() ?? json['target_audience']?.toString() ?? 'all';
    final rawPlacement = json['placement']?.toString().trim();
    final placement = (rawPlacement != null && rawPlacement.isNotEmpty && rawPlacement != 'undefined')
        ? rawPlacement
        : 'home_hero';
    final startsAt = _parseDate(json['startsAt'] ?? json['starts_at']);
    final expiresAt = _parseDate(json['expiresAt'] ?? json['expires_at']);
    final clickCount = int.tryParse(json['clickCount']?.toString() ?? json['click_count']?.toString() ?? '0') ?? 0;
    final isActive = json['isActive'] != null
        ? json['isActive'] == true
        : (json['is_active'] != null ? json['is_active'] == true : true);
    final displayOrder = int.tryParse(json['displayOrder']?.toString() ?? json['display_order']?.toString() ?? '1') ?? 1;
    final createdAt = _parseDate(json['createdAt'] ?? json['created_at']);
    final updatedAt = _parseDate(json['updatedAt'] ?? json['updated_at']);

    return HeroBannerModel(
      id: id,
      title: title,
      subtitle: subtitle,
      badgeText: badgeText,
      highlightWord: highlightWord,
      imageUrl: imageUrl,
      mobileImageUrl: mobileImageUrl,
      bannerType: bannerType,
      showTextOverlay: showOverlay,
      themeGradient: themeGradient,
      primaryCtaText: primaryCtaText,
      primaryCtaLink: primaryCtaLink,
      secondaryCtaText: secondaryCtaText,
      secondaryCtaLink: secondaryCtaLink,
      featurePills: pills,
      targetAudience: targetAudience,
      placement: placement,
      startsAt: startsAt,
      expiresAt: expiresAt,
      clickCount: clickCount,
      isActive: isActive,
      displayOrder: displayOrder,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
      'badgeText': badgeText,
      'highlightWord': highlightWord,
      'imageUrl': imageUrl,
      'mobileImageUrl': mobileImageUrl,
      'bannerType': bannerType,
      'showTextOverlay': showTextOverlay,
      'themeGradient': themeGradient,
      'primaryCtaText': primaryCtaText,
      'primaryCtaLink': primaryCtaLink,
      'secondaryCtaText': secondaryCtaText,
      'secondaryCtaLink': secondaryCtaLink,
      'featurePills': featurePills,
      'targetAudience': targetAudience,
      'placement': placement,
      'startsAt': startsAt?.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
      'clickCount': clickCount,
      'isActive': isActive,
      'displayOrder': displayOrder,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  /// Default PracticeKoro HD Hero Banner matching the design reference
  static const defaultBanner = HeroBannerModel(
    id: 'default_hero_banner',
    title: 'PracticeKoro Exam Preparation',
    subtitle: 'Prepare with authentic mock tests, previous years questions and live tests',
    imageUrl: 'assets/images/hero_banner_hd.webp',
    bannerType: 'full_image',
    showTextOverlay: false,
    themeGradient: 'blue',
    primaryCtaText: 'Start Now',
    primaryCtaLink: '/exams',
    targetAudience: 'all',
    placement: 'home_hero',
    isActive: true,
    displayOrder: 1,
  );
}

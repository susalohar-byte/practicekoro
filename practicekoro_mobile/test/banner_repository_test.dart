import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/models/hero_banner_model.dart';
import 'package:practicekoro_mobile/data/repositories/banner_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  group('HeroBannerModel Tests', () {
    test('parses authentic Supabase app_settings payload accurately', () {
      final json = {
        'id': 'db56c2fd-eead-4daf-a157-1e11fe44c5f5',
        'title': 'ClerkShip Exan Banner',
        'imageUrl':
            'https://prycanbnxuihxhskallw.supabase.co/storage/v1/object/public/banners/1d4dfd0d-d883-477e-a9f6-1cc88fea953c/5301f5f3-bc37-44c7-997d-f473187b918d.png',
        'isActive': true,
        'startsAt': '',
        'subtitle': 'ClerkShip Exan Banner',
        'createdAt': '2026-10-12 09:24:28.595044+00',
        'expiresAt': '',
        'updatedAt': '2026-10-12 09:26:17.112317+00',
        'displayOrder': 1,
        'primaryCtaLink': '/test-series',
      };

      final banner = HeroBannerModel.fromJson(json);

      expect(banner.id, 'db56c2fd-eead-4daf-a157-1e11fe44c5f5');
      expect(banner.title, 'ClerkShip Exan Banner');
      expect(banner.subtitle, 'ClerkShip Exan Banner');
      expect(banner.imageUrl, contains('banners/1d4dfd0d-d883-477e-a9f6-1cc88fea953c'));
      expect(banner.isNetworkImage, isTrue);
      expect(banner.effectiveImageUrl, banner.imageUrl);
      expect(banner.isActive, isTrue);
      expect(banner.isCurrentlyLive, isTrue);
      expect(banner.displayOrder, 1);
      expect(banner.primaryCtaLink, '/test-series');
    });

    test('parses snake_case DB fields correctly', () {
      final json = {
        'id': 'banner-wb-police',
        'title': 'WB Police Mock Test',
        'subtitle': 'Special live test series',
        'image_url': 'https://example.com/wbp.png',
        'mobile_image_url': 'https://example.com/wbp-mobile.png',
        'banner_type': 'text_overlay',
        'show_text_overlay': true,
        'badge_text': 'SPECIAL',
        'primary_cta_text': 'Enroll Now',
        'primary_cta_link': '/exams',
        'is_active': true,
        'display_order': 2,
        'target_audience': 'pro',
        'placement': 'home_hero',
      };

      final banner = HeroBannerModel.fromJson(json);

      expect(banner.id, 'banner-wb-police');
      expect(banner.title, 'WB Police Mock Test');
      expect(banner.badgeText, 'SPECIAL');
      expect(banner.showTextOverlay, isTrue);
      expect(banner.effectiveImageUrl, 'https://example.com/wbp-mobile.png');
      expect(banner.primaryCtaText, 'Enroll Now');
      expect(banner.targetAudience, 'pro');
      expect(banner.displayOrder, 2);
    });

    test('isCurrentlyLive honors start and expiry schedules', () {
      final now = DateTime.now();

      // Future start date -> Not live yet
      final futureBanner = HeroBannerModel(
        id: 'future',
        title: 'Upcoming Mock',
        imageUrl: 'https://example.com/img.png',
        startsAt: now.add(const Duration(days: 2)),
        isActive: true,
      );
      expect(futureBanner.isCurrentlyLive, isFalse);

      // Past expiry date -> Expired, not live
      final expiredBanner = HeroBannerModel(
        id: 'expired',
        title: 'Old Mock',
        imageUrl: 'https://example.com/img.png',
        expiresAt: now.subtract(const Duration(hours: 1)),
        isActive: true,
      );
      expect(expiredBanner.isCurrentlyLive, isFalse);

      // Inactive flag -> Not live
      final inactiveBanner = HeroBannerModel(
        id: 'inactive',
        title: 'Draft Mock',
        imageUrl: 'https://example.com/img.png',
        isActive: false,
      );
      expect(inactiveBanner.isCurrentlyLive, isFalse);

      // Valid active live banner
      final liveBanner = HeroBannerModel(
        id: 'live',
        title: 'Active Mock',
        imageUrl: 'https://example.com/img.png',
        startsAt: now.subtract(const Duration(days: 1)),
        expiresAt: now.add(const Duration(days: 10)),
        isActive: true,
      );
      expect(liveBanner.isCurrentlyLive, isTrue);
    });

    test('parses and decodes base64 data URI image correctly', () {
      // 1x1 transparent PNG
      const base64Png =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      final json = {
        'id': 'test-base64-banner',
        'title': 'Test Base64 Banner',
        'imageUrl': base64Png,
        'isActive': true,
      };

      final banner = HeroBannerModel.fromJson(json);

      expect(banner.id, 'test-base64-banner');
      expect(banner.isNetworkImage, isFalse);
      expect(banner.isBase64Image, isTrue);
      expect(banner.base64Bytes, isNotNull);
      expect(banner.base64Bytes!.length, greaterThan(10));
      expect(banner.placement, 'home_hero');
      expect(banner.isCurrentlyLive, isTrue);
    });

    test('defaultBanner provides authentic PracticeKoro HD banner', () {
      const banner = HeroBannerModel.defaultBanner;
      expect(banner.id, 'default_hero_banner');
      expect(banner.imageUrl, 'assets/images/hero_banner_hd.webp');
      expect(banner.isNetworkImage, isFalse);
      expect(banner.isActive, isTrue);
      expect(banner.isCurrentlyLive, isTrue);
    });
  });

  group('BannerRepository Fallback Tests', () {
    test('returns default banner list when Supabase is not configured or offline', () async {
      final repo = BannerRepository();
      final banners = await repo.getActiveHomeBanners();
      expect(banners, isNotEmpty);
      expect(banners.first.id, 'default_hero_banner');
      expect(banners.first.imageUrl, 'assets/images/hero_banner_hd.webp');
    });
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/core/components/user_avatar.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/data/models/student_profile_model.dart';
import 'package:practicekoro_mobile/data/repositories/profile_repository.dart';
import 'package:practicekoro_mobile/features/profile/profile_screen.dart';

class _FakeStudentProfileNotifier extends StudentProfileNotifier {
  final StudentProfileModel _initial;
  _FakeStudentProfileNotifier(this._initial);

  @override
  StudentProfileModel build() => _initial;
}

void main() {
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await LocalStorageService.init();
  });

  group('StudentProfileModel Avatar Priority & Serialization', () {
    test('effectiveAvatarUrl prioritizes custom uploaded picture over Google picture', () {
      const profile = StudentProfileModel(
        fullName: 'Test Student',
        googleAvatarUrl: 'https://lh3.googleusercontent.com/google_photo.jpg',
        customAvatarUrl: 'https://prycanbnxuihxhskallw.supabase.co/storage/v1/object/public/avatars/user/custom.jpg',
      );

      expect(
        profile.effectiveAvatarUrl,
        'https://prycanbnxuihxhskallw.supabase.co/storage/v1/object/public/avatars/user/custom.jpg',
      );
    });

    test('effectiveAvatarUrl falls back to Google picture if custom avatar is not set', () {
      const profile = StudentProfileModel(
        fullName: 'Test Student',
        googleAvatarUrl: 'https://lh3.googleusercontent.com/google_photo.jpg',
      );

      expect(
        profile.effectiveAvatarUrl,
        'https://lh3.googleusercontent.com/google_photo.jpg',
      );
    });

    test('effectiveAvatarUrl falls back to avatarUrl if custom and google are empty', () {
      const profile = StudentProfileModel(
        fullName: 'Test Student',
        avatarUrl: 'https://example.com/avatar.jpg',
      );

      expect(profile.effectiveAvatarUrl, 'https://example.com/avatar.jpg');
    });

    test('effectiveAvatarUrl returns null if all avatars are missing', () {
      const profile = StudentProfileModel(fullName: 'Test Student');
      expect(profile.effectiveAvatarUrl, isNull);
    });

    test('fromJson and toJson round-trip preserves custom and Google avatar URLs', () {
      final json = {
        'full_name': 'Subrata Sen',
        'email': 'subrata@example.com',
        'phone': '9876543210',
        'avatar_url': 'https://storage.supabase.co/avatars/custom.png',
        'custom_avatar_url': 'https://storage.supabase.co/avatars/custom.png',
        'google_avatar_url': 'https://lh3.googleusercontent.com/photo.png',
        'district': 'Kolkata',
        'category': 'GEN',
      };

      final profile = StudentProfileModel.fromJson(json);
      expect(profile.customAvatarUrl, 'https://storage.supabase.co/avatars/custom.png');
      expect(profile.googleAvatarUrl, 'https://lh3.googleusercontent.com/photo.png');
      expect(profile.effectiveAvatarUrl, 'https://storage.supabase.co/avatars/custom.png');

      final serialized = profile.toJson();
      expect(serialized['avatar_url'], 'https://storage.supabase.co/avatars/custom.png');
      expect(serialized['custom_avatar_url'], 'https://storage.supabase.co/avatars/custom.png');
      expect(serialized['google_avatar_url'], 'https://lh3.googleusercontent.com/photo.png');
    });

    test('copyWith clearCustomAvatar restores fallback to Google avatar', () {
      const initial = StudentProfileModel(
        fullName: 'Riya Roy',
        googleAvatarUrl: 'https://lh3.googleusercontent.com/riya.jpg',
        customAvatarUrl: 'https://storage.supabase.co/avatars/custom_riya.jpg',
      );

      expect(initial.effectiveAvatarUrl, 'https://storage.supabase.co/avatars/custom_riya.jpg');

      final cleared = initial.copyWith(clearCustomAvatar: true);
      expect(cleared.customAvatarUrl, isNull);
      expect(cleared.googleAvatarUrl, 'https://lh3.googleusercontent.com/riya.jpg');
      expect(cleared.effectiveAvatarUrl, 'https://lh3.googleusercontent.com/riya.jpg');
    });
  });

  group('LocalStorageService Avatar Persistence', () {
    test('Stores and retrieves custom and google avatars correctly', () async {
      await LocalStorageService.setUserCustomAvatar('https://storage.com/custom.png');
      await LocalStorageService.setUserGoogleAvatar('https://google.com/photo.png');

      expect(LocalStorageService.getUserCustomAvatar(), 'https://storage.com/custom.png');
      expect(LocalStorageService.getUserGoogleAvatar(), 'https://google.com/photo.png');

      await LocalStorageService.setUserCustomAvatar(null);
      expect(LocalStorageService.getUserCustomAvatar(), isNull);
      expect(LocalStorageService.getUserGoogleAvatar(), 'https://google.com/photo.png');
    });

    test('saveProfileJson and getProfileJson maintain avatar fields', () async {
      await LocalStorageService.saveProfileJson({
        'full_name': 'Amit Kumar',
        'email': 'amit@test.com',
        'avatar_url': 'https://storage.com/amit.png',
        'custom_avatar_url': 'https://storage.com/amit.png',
        'google_avatar_url': 'https://google.com/amit.png',
      });

      final loaded = LocalStorageService.getProfileJson();
      expect(loaded, isNotNull);
      expect(loaded!['custom_avatar_url'], 'https://storage.com/amit.png');
      expect(loaded['google_avatar_url'], 'https://google.com/amit.png');
    });
  });

  group('UserAvatar Widget Rendering', () {
    testWidgets('renders default avatar and responds to tap', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: UserAvatar(
                size: 60,
                displayName: 'Rahul',
                onTap: () => tapped = true,
              ),
            ),
          ),
        ),
      );

      expect(find.byType(UserAvatar), findsOneWidget);
      await tester.tap(find.byType(UserAvatar));
      await tester.pump();
      expect(tapped, isTrue);
    });

    testWidgets('renders edit badge when showEditBadge is true and triggers onEdit', (tester) async {
      var editTapped = false;
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: UserAvatar(
                size: 80,
                showEditBadge: true,
                onEdit: () => editTapped = true,
              ),
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.camera_alt_rounded), findsOneWidget);
      await tester.tap(find.byIcon(Icons.camera_alt_rounded));
      await tester.pump();
      expect(editTapped, isTrue);
    });

    testWidgets('shows loading indicator when isLoading is true', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: UserAvatar(
                size: 80,
                isLoading: true,
              ),
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders base64 data URI avatar without error', (tester) async {
      // 1x1 transparent PNG base64
      const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: UserAvatar(
                size: 60,
                avatarUrl: tinyPng,
              ),
            ),
          ),
        ),
      );

      expect(find.byType(Image), findsOneWidget);
    });
  });

  group('ProfileScreen English Labels and Member Since Date Tests', () {
    test('StudentProfileModel copyWith updates createdAt correctly', () {
      final initial = StudentProfileModel(
        fullName: 'Susanta Lohar',
        createdAt: DateTime(2026, 9, 1),
      );
      final updated = initial.copyWith(createdAt: DateTime(2026, 9, 18));
      expect(updated.createdAt, DateTime(2026, 9, 18));
    });

    testWidgets('renders English labels and full date Member since without Bangla text', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final router = GoRouter(
        initialLocation: '/profile',
        routes: [
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            studentProfileProvider.overrideWith(
              () => _FakeStudentProfileNotifier(
                StudentProfileModel(
                  fullName: 'Susanta Lohar',
                  email: 'susanta@example.com',
                  dob: DateTime(2000, 8, 15),
                  district: 'Kolkata',
                  category: 'GEN',
                  createdAt: DateTime(2026, 9, 18),
                ),
              ),
            ),
          ],
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify clean English labels are present
      expect(find.text('Date of Birth'), findsOneWidget);
      expect(find.text('District'), findsOneWidget);
      expect(find.text('Caste'), findsOneWidget);

      // Verify Bangla text in brackets is completely removed
      expect(find.textContaining('জন্মতারিখ'), findsNothing);
      expect(find.textContaining('জন্ম তারিখ'), findsNothing);
      expect(find.textContaining('(জেলা)'), findsNothing);
      expect(find.textContaining('(জাতি)'), findsNothing);

      // Verify Member since includes the full date (day, month, year)
      await tester.scrollUntilVisible(find.text('Member since'), 100);
      expect(find.text('Member since'), findsOneWidget);
      expect(find.text('18 September 2026'), findsOneWidget);
    });
  });

  group('ProfileHeaderCard Tests', () {
    test('StudentProfileModel isPro serialization, deserialization, and copyWith', () {
      const model = StudentProfileModel(
        fullName: 'Susanta Lohar',
        isPro: true,
      );
      expect(model.isPro, isTrue);

      final json = model.toJson();
      expect(json['is_pro'], isTrue);

      final fromJson = StudentProfileModel.fromJson(json);
      expect(fromJson.isPro, isTrue);

      final updated = model.copyWith(isPro: false);
      expect(updated.isPro, isFalse);
    });

    test('LocalStorageService persists and retrieves isPro correctly', () async {
      expect(LocalStorageService.getIsPro(), isFalse);
      await LocalStorageService.setIsPro(true);
      expect(LocalStorageService.getIsPro(), isTrue);
      await LocalStorageService.setIsPro(false);
      expect(LocalStorageService.getIsPro(), isFalse);
    });

    testWidgets('renders Profile Header Card with name, Pro badge, Profile Complete pill, and 3 info chips', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final router = GoRouter(
        initialLocation: '/profile',
        routes: [
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            studentProfileProvider.overrideWith(
              () => _FakeStudentProfileNotifier(
                StudentProfileModel(
                  fullName: 'Susanta Lohar',
                  email: 'susanta@example.com',
                  dob: DateTime(2000, 8, 15),
                  targetExamId: 'exam_wbpsc',
                  targetExamTitle: 'WBPSC',
                  district: 'Bankura',
                  category: 'SC',
                  createdAt: DateTime(2026, 9, 18),
                  isPro: true,
                ),
              ),
            ),
          ],
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // 1. Prominently displays user's name in ProfileHeader
      expect(find.descendant(of: find.byType(ProfileHeader), matching: find.text('Susanta Lohar')), findsOneWidget);

      // 2. Email address is deliberately NOT displayed in the header card
      // (The Personal Details section further down may have email, but let's check top header)
      expect(find.widgetWithText(ProfileHeader, 'susanta@example.com'), findsNothing);

      // 3. Gold Pro badge with crown icon is displayed beside name
      expect(find.text('Pro'), findsOneWidget);
      expect(find.byType(CrownIcon), findsOneWidget);

      // 4. Compact Profile Complete status pill
      expect(find.text('Profile Complete'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle_rounded), findsOneWidget);

      // 5. Small Edit Profile icon button in card's top-right corner
      expect(find.byIcon(Icons.edit_rounded), findsOneWidget);

      // 6. Centered avatar with camera change-photo button
      expect(find.byIcon(Icons.camera_alt_rounded), findsOneWidget);

      // 7. Three compact information chips for exam, district, and category
      expect(find.descendant(of: find.byType(ProfileHeader), matching: find.text('WBPSC')), findsOneWidget);
      expect(find.byIcon(Icons.school_rounded), findsOneWidget);

      expect(find.descendant(of: find.byType(ProfileHeader), matching: find.text('Bankura')), findsOneWidget);
      expect(find.byIcon(Icons.location_on_rounded), findsWidgets);

      expect(find.descendant(of: find.byType(ProfileHeader), matching: find.text('SC')), findsOneWidget);
      expect(find.byIcon(Icons.people_alt_rounded), findsOneWidget);
    });

    testWidgets('omits Pro badge when user is not Pro', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final router = GoRouter(
        initialLocation: '/profile',
        routes: [
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            studentProfileProvider.overrideWith(
              () => _FakeStudentProfileNotifier(
                StudentProfileModel(
                  fullName: 'Non Pro User',
                  email: 'nonpro@example.com',
                  isPro: false,
                ),
              ),
            ),
          ],
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.descendant(of: find.byType(ProfileHeader), matching: find.text('Non Pro User')), findsOneWidget);
      expect(find.text('Pro'), findsNothing);
      expect(find.byType(CrownIcon), findsNothing);
    });

    testWidgets('handles missing profile fields gracefully with fallback chip text', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final router = GoRouter(
        initialLocation: '/profile',
        routes: [
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            studentProfileProvider.overrideWith(
              () => _FakeStudentProfileNotifier(
                const StudentProfileModel(
                  fullName: 'New Student',
                  targetExamTitle: null,
                  district: null,
                  category: 'NOT_SPECIFIED',
                ),
              ),
            ),
          ],
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.descendant(of: find.byType(ProfileHeader), matching: find.text('New Student')), findsOneWidget);
      expect(find.text('Add Exam'), findsOneWidget);
      expect(find.text('Add District'), findsOneWidget);
      expect(find.text('Add Caste'), findsOneWidget);
    });
  });
}

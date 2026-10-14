import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/core/utils/image_url_helper.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/data/models/exam_model.dart';
import 'package:practicekoro_mobile/data/models/test_series_model.dart';
import 'package:practicekoro_mobile/data/repositories/catalog_repository.dart';
import 'package:practicekoro_mobile/features/home/home_screen.dart';

class _Repo extends CatalogRepository {}

const _exams = [
  ExamModel(id: 'exam-wbp', title: 'WBP Constable', slug: 'wbp-constable', category: 'x', orderIndex: 2,
      iconName: 'https://cdn.example.com/banners/wbp-logo.png'),
  ExamModel(id: 'exam-ntpc', title: 'Railway NTPC', slug: 'railway-ntpc', category: 'x', orderIndex: 1, totalTests: 40),
  ExamModel(id: 'exam-draft', title: 'Draft Exam', slug: 'draft', category: 'x', orderIndex: 3, isActive: false),
];

Widget _app(GoRouter router) => ProviderScope(
      overrides: [
        catalogRepositoryProvider.overrideWithValue(_Repo()),
        examsProvider.overrideWith((ref) async => _exams),
        popularExamsProvider.overrideWith((ref) async => const <Map<String, dynamic>>[]),
        popularTestSeriesProvider.overrideWith((ref) async => const <TestSeriesModel>[]),
        heroBannersProvider.overrideWith((ref) async => const <Map<String, dynamic>>[]),
        activeLiveTestProvider.overrideWith((ref) async => null),
      ],
      child: MaterialApp.router(routerConfig: router),
    );

GoRouter _router() => GoRouter(
      initialLocation: '/home',
      routes: [
        GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
        GoRoute(path: '/exams', builder: (_, _) => const Text('ALL EXAMS PAGE')),
        GoRoute(
          path: '/exams/:examId',
          builder: (_, state) => Text('EXAM ${state.pathParameters['examId']}'),
        ),
      ],
    );

void main() {
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await LocalStorageService.init();
  });

  testWidgets('Exams row: published exams only, admin logo, no metadata, circular layout', (tester) async {
    tester.view.physicalSize = const Size(420, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(_app(_router()));
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Exams for You'), findsOneWidget);
    // Admin order, drafts hidden.
    final ntpc = tester.getTopLeft(find.text('Railway NTPC'));
    final wbp = tester.getTopLeft(find.text('WBP Constable'));
    expect(ntpc.dx, lessThan(wbp.dx));
    expect(ntpc.dy, wbp.dy); // single horizontal row
    expect(find.text('Draft Exam'), findsNothing);
    // No counts or other metadata under the names.
    expect(find.text('40 Tests'), findsNothing);
    // The admin-uploaded logo (stored in icon_name) is the image source.
    final logos = tester.widgetList<PkAdminImage>(find.byType(PkAdminImage)).map((w) => w.imageUrl);
    expect(logos, contains('https://cdn.example.com/banners/wbp-logo.png'));
    // No left/right arrow buttons around the row.
    expect(find.byIcon(Icons.chevron_left_rounded), findsNothing);
    expect(find.byIcon(Icons.arrow_back_ios_rounded), findsNothing);
  });

  testWidgets('tapping an exam opens it by ID; View All opens the exams listing', (tester) async {
    tester.view.physicalSize = const Size(420, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    final router = _router();
    await tester.pumpWidget(_app(router));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.tap(find.text('WBP Constable'));
    await tester.pumpAndSettle();
    expect(find.text('EXAM exam-wbp'), findsOneWidget);

    router.go('/home');
    await tester.pumpAndSettle();
    final viewAll = find.descendant(
      of: find.ancestor(of: find.text('Exams for You'), matching: find.byType(Row)).first,
      matching: find.text('View All'),
    );
    await tester.tap(viewAll);
    await tester.pumpAndSettle();
    expect(find.text('ALL EXAMS PAGE'), findsOneWidget);
  });
}

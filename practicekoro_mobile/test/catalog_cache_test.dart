import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/datasources/catalog_cache.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  final rows = [
    {
      'id': 'e1',
      'title': 'WBP Constable',
      'tests': [
        {'count': 3},
      ],
    },
  ];

  test('returns saved rows while they are fresh', () async {
    await CatalogDiskCache.write('exams', rows);
    final read = await CatalogDiskCache.read(
      'exams',
      maxAge: const Duration(hours: 1),
    );
    expect(read, rows);
  });

  test('treats an old copy as missing', () async {
    final old = DateTime.now().subtract(const Duration(hours: 2));
    SharedPreferences.setMockInitialValues({
      'catalog_cache_v1:exams':
          '{"t":${old.millisecondsSinceEpoch},"rows":[{"id":"e1"}]}',
    });
    expect(
      await CatalogDiskCache.read('exams', maxAge: const Duration(hours: 1)),
      isNull,
    );
    expect(
      await CatalogDiskCache.read('exams', maxAge: CatalogDiskCache.maxStale),
      isNotNull,
    );
  });

  test('remove and clear take effect at once', () async {
    await CatalogDiskCache.write('exams', rows);
    await CatalogDiskCache.write('subjects', rows);
    await Future<void>.delayed(const Duration(milliseconds: 2));

    final removing = CatalogDiskCache.remove('exams');
    expect(
      await CatalogDiskCache.read('exams', maxAge: const Duration(hours: 1)),
      isNull,
    );
    await removing;
    expect(
      await CatalogDiskCache.read('subjects', maxAge: const Duration(hours: 1)),
      isNotNull,
    );

    await CatalogDiskCache.clear();
    expect(
      await CatalogDiskCache.read('subjects', maxAge: const Duration(hours: 1)),
      isNull,
    );
  });

  test('does not save entries over the size limit', () async {
    final big = [
      {'icon': 'x' * (CatalogDiskCache.maxBytes + 1)},
    ];
    await CatalogDiskCache.write('exams', big);
    expect(
      await CatalogDiskCache.read('exams', maxAge: const Duration(hours: 1)),
      isNull,
    );
  });
}

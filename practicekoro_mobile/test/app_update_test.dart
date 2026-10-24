import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/core/app_build.dart';
import 'package:practicekoro_mobile/data/repositories/app_update_repository.dart';

void main() {
  test('appBuildNumber matches the pubspec build number', () {
    final version = RegExp(
      r'^version:\s*\S+\+(\d+)\s*$',
      multiLine: true,
    ).firstMatch(File('pubspec.yaml').readAsStringSync());
    expect(version, isNotNull);
    expect(appBuildNumber, int.parse(version!.group(1)!));
  });

  group('AppUpdateRepository.evaluate', () {
    test('no minimum set never blocks', () {
      expect(AppUpdateRepository.evaluate(currentBuild: 2).required, isFalse);
    });

    test('blocks only builds below the minimum', () {
      expect(
        AppUpdateRepository.evaluate(minBuild: 3, currentBuild: 2).required,
        isTrue,
      );
      expect(
        AppUpdateRepository.evaluate(minBuild: 2, currentBuild: 2).required,
        isFalse,
      );
      expect(
        AppUpdateRepository.evaluate(minBuild: '3', currentBuild: 2).required,
        isTrue,
      );
      expect(
        AppUpdateRepository.evaluate(
          minBuild: 'junk',
          currentBuild: 2,
        ).required,
        isFalse,
      );
    });

    test('only https update links are used', () {
      expect(
        AppUpdateRepository.evaluate(
          updateUrl: 'https://example.com/app.apk',
        ).updateUrl,
        'https://example.com/app.apk',
      );
      expect(
        AppUpdateRepository.evaluate(
          updateUrl: 'javascript:alert(1)',
        ).updateUrl,
        defaultUpdateUrl,
      );
    });
  });
}

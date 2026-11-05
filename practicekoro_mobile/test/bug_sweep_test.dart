import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';
import 'package:practicekoro_mobile/data/models/attempt_model.dart';
import 'package:practicekoro_mobile/data/models/live_test_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

LiveTestModel _live(String status, DateTime start, {int minutes = 60}) =>
    LiveTestModel(
      id: 'l',
      testId: 't',
      title: 'Live',
      status: status,
      startAt: start,
      durationMinutes: minutes,
    );

void main() {
  group('Live test window', () {
    final now = DateTime.now();

    test('a finished test is neither live nor upcoming, whatever its status', () {
      final yesterday = now.subtract(const Duration(days: 1));
      for (final s in ['upcoming', 'live']) {
        final t = _live(s, yesterday, minutes: 90);
        expect(t.isLive, isFalse, reason: s);
        expect(t.isUpcoming, isFalse, reason: s);
      }
    });

    test('an open window is live even when the status still says upcoming', () {
      final t = _live('upcoming', now.subtract(const Duration(minutes: 10)));
      expect(t.isLive, isTrue);
      expect(t.isUpcoming, isFalse);
    });

    test('a future test is upcoming; Start Live Now makes it live', () {
      final later = now.add(const Duration(hours: 2));
      expect(_live('upcoming', later).isUpcoming, isTrue);
      expect(_live('live', later).isLive, isTrue);
      expect(_live('cancelled', later).isUpcoming, isFalse);
    });

    test('times show in local time', () {
      final utc = DateTime.utc(2030, 1, 5, 4, 30);
      final local = utc.toLocal();
      final label = _live('upcoming', utc).formattedTime;
      final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
      final minute = local.minute.toString().padLeft(2, '0');
      expect(label, contains('$hour:$minute'));
    });
  });

  test('server completion times are shown in local time', () {
    final a = TestAttemptModel.fromJson({
      'id': 'a',
      'test_id': 't',
      'completed_at': '2030-01-05T18:20:00+00:00',
    });
    expect(a.completedAt.isUtc, isFalse);
    expect(a.completedAt, DateTime.utc(2030, 1, 5, 18, 20).toLocal());
  });

  group('Unfinished attempt answers', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      await LocalStorageService.init();
    });

    test('are kept per attempt and removed on sign-out', () async {
      await LocalStorageService.saveRunnerAnswers('att1', {'q1': 'A', 'q2': 'C'});
      expect(LocalStorageService.getRunnerAnswers('att1'), {'q1': 'A', 'q2': 'C'});
      expect(LocalStorageService.getRunnerAnswers('att2'), isEmpty);
      await LocalStorageService.clearAccountData();
      expect(LocalStorageService.getRunnerAnswers('att1'), isEmpty);
    });
  });
}

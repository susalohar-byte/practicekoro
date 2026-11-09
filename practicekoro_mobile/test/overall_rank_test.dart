import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/models/ranking_model.dart';

void main() {
  test('overall rank rows carry how many tests are counted', () {
    final row = StudentRankItem.fromJson({
      'rank': 4,
      'user_id': 'me',
      'student_name': 'Dipa',
      'score': 10,
      'total_marks': 50,
      'percentage': 20,
      'is_current_user': true,
      'tests_attempted': 3,
    });
    expect(row.rank, 4);
    expect(row.testsAttempted, 3);
    expect(row.scoreDisplay, '10 / 50');

    // A per-test row (no tests_attempted) is unchanged
    final perTest = StudentRankItem.fromJson({'rank': 1, 'score': 45, 'total_marks': 50});
    expect(perTest.testsAttempted, isNull);
  });
}

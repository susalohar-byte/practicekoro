import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/models/question_model.dart';
import 'package:practicekoro_mobile/data/repositories/attempt_repository.dart';

void main() {
  group('MCQ option images', () {
    test('maps option images from the server row; text-only options have none', () {
      final q = AttemptRepository.questionFromRow(
        {
          'id': 'q1',
          'questionText': 'Which figure completes the pattern?',
          'optionA': '',
          'optionB': 'Figure 2',
          'optionC': 'Figure 3',
          'optionD': 'Figure 4',
          'optionAImageUrl': 'https://img/a.png',
          'optionBImageUrl': 'https://img/b.png',
          'optionCImageUrl': null,
          'optionDImageUrl': '  ',
          'correctOption': 'A',
        },
        't1',
        0,
        withAnswers: true,
      );
      expect(q.options.map((o) => o.label), ['A', 'B', 'C', 'D']);
      expect(q.options[0].text, '');
      expect(q.options[0].imageUrl, 'https://img/a.png');
      expect(q.options[0].hasImage, isTrue);
      expect(q.options[0].isCorrect, isTrue);
      expect(q.options[1].imageUrl, 'https://img/b.png');
      expect(q.options[2].hasImage, isFalse);
      expect(q.options[3].hasImage, isFalse);
    });

    test('a text-only question (older server) works exactly as before', () {
      final q = AttemptRepository.questionFromRow(
        {'id': 'q2', 'questionText': 'Capital?', 'optionA': 'Delhi', 'optionB': 'Kolkata'},
        't1',
        0,
        withAnswers: false,
      );
      expect(q.options.every((o) => !o.hasImage && o.imageUrl == null), isTrue);
      expect(q.options[0].text, 'Delhi');
    });

    test('maps the question image; a figure-only question can have no text', () {
      final q = AttemptRepository.questionFromRow(
        {
          'id': 'q3',
          'questionText': '',
          'imageUrl': 'https://img/grid.png',
          'optionA': '12',
          'optionB': '18',
          'optionC': '20',
          'optionD': '16',
        },
        't1',
        0,
        withAnswers: false,
      );
      expect(q.hasImage, isTrue);
      expect(q.imageUrl, 'https://img/grid.png');
      expect(q.textEnglish, '');

      final back = QuestionModel.fromJson(q.toJson());
      expect(back.imageUrl, 'https://img/grid.png');

      final plain = AttemptRepository.questionFromRow(
        {'id': 'q4', 'questionText': 'Capital?', 'optionA': 'Delhi'},
        't1',
        0,
        withAnswers: false,
      );
      expect(plain.hasImage, isFalse);
      expect(plain.toJson().containsKey('image_url'), isFalse);
    });

    test('saved questions keep option images through toJson / fromJson', () {
      const opt = OptionModel(id: 'A', label: 'A', text: '', imageUrl: 'https://img/a.png');
      final back = OptionModel.fromJson(opt.toJson(), 0);
      expect(back.imageUrl, 'https://img/a.png');
      const plain = OptionModel(id: 'B', label: 'B', text: 'x');
      expect(plain.toJson().containsKey('image_url'), isFalse);
      expect(OptionModel.fromJson(plain.toJson(), 1).imageUrl, isNull);
    });
  });
}

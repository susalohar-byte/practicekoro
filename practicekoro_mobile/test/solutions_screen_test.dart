import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/data/models/attempt_model.dart';
import 'package:practicekoro_mobile/data/models/question_model.dart';
import 'package:practicekoro_mobile/data/repositories/catalog_repository.dart';
import 'package:practicekoro_mobile/features/result_analytics/solutions_screen.dart';

void main() {
  group('SolutionsScreen View Answer UI and Red/Green States', () {
    final mockQuestions = [
      const QuestionModel(
        id: 'q_test_1',
        questionNumber: 1,
        subjectName: 'General Knowledge',
        textBengali: 'ভারতের জাতীয় পাখি কোনটি?',
        textEnglish: 'Which is the national bird of India?',
        options: [
          OptionModel(
            id: 'opt_1_a',
            label: 'A',
            text: 'Peacock',
            textBengali: 'ময়ূর',
            isCorrect: true,
          ),
          OptionModel(
            id: 'opt_1_b',
            label: 'B',
            text: 'Parrot',
            textBengali: 'টিয়া',
          ),
          OptionModel(
            id: 'opt_1_c',
            label: 'C',
            text: 'Pigeon',
            textBengali: 'পায়রা',
          ),
          OptionModel(
            id: 'opt_1_d',
            label: 'D',
            text: 'Crow',
            textBengali: 'কাক',
          ),
        ],
        explanationBengali:
            'ময়ূর ভারতের জাতীয় পাখি। ১৯৬৩ সালে এটিকে স্বীকৃতি দেওয়া হয়।',
        explanationEnglish: 'The Indian peacock is the national bird of India.',
        marks: 2.0,
        negativeMarks: 0.5,
      ),
      const QuestionModel(
        id: 'q_test_2',
        questionNumber: 2,
        subjectName: 'History',
        textBengali: 'পলাশীর যুদ্ধ কত সালে হয়েছিল?',
        textEnglish: 'In which year did the Battle of Plassey take place?',
        options: [
          OptionModel(
            id: 'opt_2_a',
            label: 'A',
            text: '1757',
            textBengali: '১৭৫৭',
            isCorrect: true,
          ),
          OptionModel(
            id: 'opt_2_b',
            label: 'B',
            text: '1764',
            textBengali: '১৭৬৪',
          ),
          OptionModel(
            id: 'opt_2_c',
            label: 'C',
            text: '1857',
            textBengali: '১৮৫৭',
          ),
          OptionModel(
            id: 'opt_2_d',
            label: 'D',
            text: '1947',
            textBengali: '১৯৪৭',
          ),
        ],
        explanationBengali: '১৭৫৭ সালের ২৩ জুন পলাশীর যুদ্ধ সংঘটিত হয়েছিল।',
        explanationEnglish:
            'The Battle of Plassey took place on 23 June 1757.',
        marks: 2.0,
        negativeMarks: 0.5,
      ),
      const QuestionModel(
        id: 'q_test_3',
        questionNumber: 3,
        subjectName: 'Geography',
        textBengali: 'ভারতের দীর্ঘতম নদী কোনটি?',
        textEnglish: 'Which is the longest river in India?',
        options: [
          OptionModel(
            id: 'opt_3_a',
            label: 'A',
            text: 'Ganga',
            textBengali: 'গঙ্গা',
            isCorrect: true,
          ),
          OptionModel(
            id: 'opt_3_b',
            label: 'B',
            text: 'Yamuna',
            textBengali: 'যমুনা',
          ),
          OptionModel(
            id: 'opt_3_c',
            label: 'C',
            text: 'Godavari',
            textBengali: 'গোদাবরী',
          ),
          OptionModel(
            id: 'opt_3_d',
            label: 'D',
            text: 'Brahmaputra',
            textBengali: 'ব্রহ্মপুত্র',
          ),
        ],
        explanationBengali:
            'গঙ্গা ভারতের দীর্ঘতম নদী (দৈর্ঘ্য প্রায় ২৫২৫ কিমি)।',
        explanationEnglish:
            'The Ganges is the longest river in India (2525 km).',
        marks: 2.0,
        negativeMarks: 0.5,
      ),
    ];

    // Attempt:
    // Q1: User picked 'opt_1_a' (CORRECT)
    // Q2: User picked 'opt_2_b' (WRONG - correct is opt_2_a)
    // Q3: Skipped (no answer)
    final testAttempt = TestAttemptModel(
      id: 'att_dynamic_test_01',
      testId: 'test_dynamic_01',
      testTitle: 'Dynamic Test Solutions Mock',
      score: 1.5,
      totalMarks: 6.0,
      accuracy: 50.0,
      percentage: 25.0,
      rank: 1,
      totalParticipants: 10,
      correctCount: 1,
      wrongCount: 1,
      skippedCount: 1,
      timeSpentSeconds: 120,
      completedAt: DateTime.now(),
      userAnswers: const {
        'q_test_1': 'opt_1_a',
        'q_test_2': 'opt_2_b',
      },
    );

    testWidgets(
        'renders dynamic student answers: correct in green, wrong in red, skipped properly',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            testAttemptProvider('att_dynamic_test_01').overrideWith(
              (ref) async => testAttempt,
            ),
            testSolutionsProvider(
              (attemptId: 'att_dynamic_test_01', testId: 'test_dynamic_01'),
            ).overrideWith(
              (ref) async => (mockQuestions, const <String, String>{}),
            ),
          ],
          child: const MaterialApp(
            home: SolutionsScreen(attemptId: 'att_dynamic_test_01'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Top Header & Question Navigator
      expect(find.text('View Answer'), findsOneWidget);
      expect(find.text('Select Question'), findsOneWidget);
      expect(find.textContaining('1 Correct'), findsWidgets);
      expect(find.textContaining('1 Wrong'), findsWidgets);
      expect(find.textContaining('1 Skipped'), findsWidgets);

      // QUESTION 1: Student answered CORRECTLY (Option A: Peacock / ময়ূর)
      expect(find.text('ভারতের জাতীয় পাখি কোনটি?'), findsOneWidget);
      expect(find.text('Correct Answer'), findsOneWidget);
      expect(find.text('Your Answer'), findsOneWidget);
      expect(find.byIcon(Icons.check_rounded), findsWidgets);

      // Tap NEXT to go to Question 2
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      // QUESTION 2: Student answered WRONGLY (Student picked Option B: 1764, Correct is Option A: 1757)
      expect(find.text('পলাশীর যুদ্ধ কত সালে হয়েছিল?'), findsOneWidget);
      // Both options visible simultaneously:
      // Option B has 'Your Answer' and red indicator
      expect(find.text('Your Answer'), findsOneWidget);
      // Option A has 'Correct Answer' and green check indicator
      expect(find.text('Correct Answer'), findsOneWidget);
      expect(find.byIcon(Icons.check_rounded), findsWidgets);

      // Tap NEXT to go to Question 3
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      // QUESTION 3: Student SKIPPED (Not Attempted)
      expect(find.text('ভারতের দীর্ঘতম নদী কোনটি?'), findsOneWidget);
      // In skipped question: no 'Your Answer'
      expect(find.text('Your Answer'), findsNothing);
      // Correct answer is displayed in green box with 'Correct Answer' and checkmark
      expect(find.text('Correct Answer'), findsOneWidget);
      expect(find.byIcon(Icons.check_rounded), findsWidgets);
      expect(find.text('Explanation'), findsOneWidget);
    });

    testWidgets('Explanation card is open by default and can be collapsed on tap',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            testAttemptProvider('att_dynamic_test_01').overrideWith(
              (ref) async => testAttempt,
            ),
            testSolutionsProvider(
              (attemptId: 'att_dynamic_test_01', testId: 'test_dynamic_01'),
            ).overrideWith(
              (ref) async => (mockQuestions, const <String, String>{}),
            ),
          ],
          child: const MaterialApp(
            home: SolutionsScreen(attemptId: 'att_dynamic_test_01'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Explanation title & dropdown icon are present
      expect(find.text('Explanation'), findsOneWidget);
      expect(find.byIcon(Icons.keyboard_arrow_down_rounded), findsOneWidget);

      // OPEN by default: explanation body text and arrow bullet SVG are visible!
      expect(
        find.textContaining('ময়ূর ভারতের জাতীয় পাখি।'),
        findsOneWidget,
      );
      expect(find.byType(SvgPicture), findsWidgets);

      // Tap Explanation header to collapse / close
      await tester.tap(find.text('Explanation'));
      await tester.pumpAndSettle();

      // Now closed: explanation body text should be hidden
      expect(
        find.textContaining('ময়ূর ভারতের জাতীয় পাখি।'),
        findsNothing,
      );

      // Tap Explanation header again to reopen
      await tester.tap(find.text('Explanation'));
      await tester.pumpAndSettle();

      // Now reopened: explanation body text is visible again
      expect(
        find.textContaining('ময়ূর ভারতের জাতীয় পাখি।'),
        findsOneWidget,
      );
      expect(find.byType(SvgPicture), findsWidgets);
    });
  });
}

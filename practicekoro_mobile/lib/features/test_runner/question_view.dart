import 'package:flutter/material.dart';
import '../../core/components/ui.dart';
import '../../data/models/question_model.dart';

/// Question text in Bengali with the English version underneath.
class QuestionText extends StatelessWidget {
  final QuestionModel question;

  const QuestionText(this.question, {super.key});

  @override
  Widget build(BuildContext context) {
    final bengali = question.textBengali.trim();
    final english = question.textEnglish.trim();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          bengali.isNotEmpty ? bengali : english,
          style: UI.question,
        ),
        if (bengali.isNotEmpty && english.isNotEmpty && english != bengali) ...[
          const SizedBox(height: 6),
          Text(english, style: UI.caption.copyWith(fontSize: 13, height: 1.45)),
        ],
      ],
    );
  }
}

/// One answer option, Bengali first with English underneath.
class QuestionOption extends StatelessWidget {
  final OptionModel option;
  final UIOptionState state;
  final String? stateLabel;
  final VoidCallback? onTap;

  const QuestionOption({
    super.key,
    required this.option,
    this.state = UIOptionState.normal,
    this.stateLabel,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bengali = option.textBengali?.trim() ?? '';
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: UIOptionTile(
        letter: option.label,
        text: bengali.isNotEmpty ? bengali : option.text,
        secondaryText: bengali.isNotEmpty ? option.text : null,
        state: state,
        stateLabel: stateLabel,
        onTap: onTap,
      ),
    );
  }
}

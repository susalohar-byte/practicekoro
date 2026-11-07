import 'dart:convert';

import '../data/models/question_model.dart';

final _leadingBullet = RegExp(
  r'^(?:[••●○*✓✔▪▫■□►▸▶◆◇\-–]|📌|🔹|🔸|➡️|👉|\s)+',
  unicode: true,
);

/// Splits an explanation as stored in the question bank into display lines.
///
/// Admin uploads store explanations in several shapes: real line breaks,
/// escaped "\n" sequences, HTML (`<br>`, `<p>`, `<li>`) or a JSON list of
/// notes. Every shape becomes one clean line per point, so nothing shows up
/// as raw markup and no line is dropped.
List<String> explanationLines(String? raw) {
  final text = raw?.trim() ?? '';
  if (text.isEmpty) return const [];

  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      final list = jsonDecode(text);
      if (list is List && list.isNotEmpty) {
        return [
          for (final item in list)
            if (item != null && item.toString().trim().isNotEmpty)
              item.toString().trim().replaceFirst(_leadingBullet, '').trim(),
        ].where((l) => l.isNotEmpty).toList();
      }
    } catch (_) {
      // Not JSON after all: read it as plain text.
    }
  }

  final normalized = text
      .replaceAll(r'\r\n', '\n')
      .replaceAll(r'\n', '\n')
      .replaceAll(r'\r', '\n')
      .replaceAll('\r\n', '\n')
      .replaceAll('\r', '\n')
      .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'</(?:p|li|div)>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'<[^>]+>'), '')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&');

  return normalized
      .split('\n')
      .map((l) => l.trim().replaceFirst(_leadingBullet, '').trim())
      .where((l) => l.isNotEmpty)
      .toList();
}

/// Every explanation saved for [q], original first.
///
/// `explanation` is the original explanation from the question bank and
/// `explanation_bengali` holds the Bengali short notes. Both are shown; the
/// second is skipped only when it repeats the first.
List<List<String>> explanationSections(QuestionModel q) {
  final sections = <List<String>>[];
  for (final raw in [q.explanationEnglish, q.explanationBengali]) {
    final lines = explanationLines(raw);
    if (lines.isEmpty) continue;
    final key = lines.join(' ');
    if (sections.any((s) => s.join(' ') == key)) continue;
    sections.add(lines);
  }
  return sections;
}

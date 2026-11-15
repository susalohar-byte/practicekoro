import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'chem_text.dart';

/// A piece of question text: plain [text], LaTeX [tex] to typeset, or a plain-text fraction
/// ([whole] [numerator]/[denominator]) drawn in the question's own font.
class MathSegment {
  final String? text;
  final String? tex;
  final bool display;
  final String? whole;
  final String? numerator;
  final String? denominator;
  final String raw;

  const MathSegment.text(String this.text)
    : tex = null,
      display = false,
      whole = null,
      numerator = null,
      denominator = null,
      raw = text;
  const MathSegment.math(String this.tex, this.raw, {this.display = false})
    : text = null,
      whole = null,
      numerator = null,
      denominator = null;
  const MathSegment.fraction(
    this.whole,
    String this.numerator,
    String this.denominator,
    this.raw,
  ) : text = null,
      tex = null,
      display = false;

  bool get isText => text != null;

  @override
  bool operator ==(Object other) =>
      other is MathSegment &&
      other.text == text &&
      other.tex == tex &&
      other.display == display &&
      other.whole == whole &&
      other.numerator == numerator &&
      other.denominator == denominator &&
      other.raw == raw;

  @override
  int get hashCode =>
      Object.hash(text, tex, display, whole, numerator, denominator, raw);

  @override
  String toString() => text != null
      ? 'text($text)'
      : tex != null
      ? 'tex($tex)'
      : 'fraction($raw)';
}

// Same rules as the website's MathText (student-web/src/components/ui/MathText.tsx).
// LaTeX in $...$, $$...$$, \(...\) or \[...\]; an inline $ must hug its content and not be
// followed by a digit, so prices such as "$5 and $10" stay text.
final _delimited = RegExp(
  r'(\$\$[\s\S]+?\$\$|\$(?=\S)(?:\\.|[^$\n])+?(?<=\S)\$(?!\d)|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))',
);

// Plain-text fractions typed without LaTeX: "6 1/3" (mixed) and "2/3", in ASCII or Bengali
// digits. Dates such as 15/08/2024 and decimals such as 1.5/2 are left alone.
final _plainFraction = RegExp(
  r'(?<![0-9০-৯/.])(?:([0-9০-৯]{1,3})[ \t]+)?([0-9০-৯]{1,3})/([0-9০-৯]{1,3})(?![0-9০-৯/.])',
);

void _splitFractions(String value, List<MathSegment> out) {
  var cursor = 0;
  for (final m in _plainFraction.allMatches(value)) {
    if (m.start > cursor) {
      out.add(MathSegment.text(prettyChem(value.substring(cursor, m.start))));
    }
    out.add(
      MathSegment.fraction(m.group(1), m.group(2)!, m.group(3)!, m.group(0)!),
    );
    cursor = m.end;
  }
  if (cursor < value.length) {
    out.add(MathSegment.text(prettyChem(value.substring(cursor))));
  }
}

/// Splits [value] into plain text and math segments.
List<MathSegment> splitMath(String value) {
  final out = <MathSegment>[];
  var cursor = 0;
  for (final m in _delimited.allMatches(value)) {
    if (m.start > cursor) {
      _splitFractions(value.substring(cursor, m.start), out);
    }
    final raw = m.group(0)!;
    final wide =
        raw.startsWith(r'$$') || raw.startsWith(r'\[') || raw.startsWith(r'\(');
    out.add(
      MathSegment.math(
        wide
            ? raw.substring(2, raw.length - 2)
            : raw.substring(1, raw.length - 1),
        raw,
        display: raw.startsWith(r'$$') || raw.startsWith(r'\['),
      ),
    );
    cursor = m.end;
  }
  if (cursor < value.length) _splitFractions(value.substring(cursor), out);
  return out;
}

// \AA (ångström), which the website's KaTeX knows and flutter_math lacks.
final _angstrom = RegExp(r'\\AA(?![a-zA-Z])');

// Full-size fractions inline too, as printed in exam papers.
final _frac = RegExp(r'\\frac(?![a-zA-Z])');

/// Drop-in for [Text] on question, option and explanation strings: typesets LaTeX math and
/// plain fractions such as "6 1/3" as stacked fractions; other text renders exactly as [Text].
class MathText extends StatelessWidget {
  final String data;
  final TextStyle? style;
  final int? maxLines;
  final TextOverflow? overflow;

  const MathText(
    this.data, {
    super.key,
    this.style,
    this.maxLines,
    this.overflow,
  });

  @override
  Widget build(BuildContext context) {
    final segments = splitMath(data);
    if (segments.every((s) => s.isText)) {
      return Text(
        segments.map((s) => s.text).join(),
        style: style,
        maxLines: maxLines,
        overflow: overflow,
      );
    }
    final base = DefaultTextStyle.of(context).style.merge(style);
    return Text.rich(
      TextSpan(
        children: [
          for (final s in segments)
            if (s.isText)
              TextSpan(text: s.text)
            else if (s.tex == null)
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: _Fraction(s, base),
              )
            else
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Math.tex(
                    expandMhchem(s.tex!)
                        .replaceAll(_frac, r'\dfrac')
                        .replaceAll(_angstrom, r'\mathring{A}'),
                    mathStyle: s.display ? MathStyle.display : MathStyle.text,
                    // Math in its normal weight even inside a bold question, as on the website.
                    textStyle: base.copyWith(
                      height: 1,
                      fontWeight: FontWeight.w400,
                    ),
                    onErrorFallback: (_) => Text(s.raw, style: base),
                  ),
                ),
              ),
        ],
      ),
      style: style,
      maxLines: maxLines,
      overflow: overflow,
    );
  }
}

/// "6 1/3" as a whole number beside a stacked fraction, in the surrounding text style, so
/// Bengali digits (৬ ১/৩) render in the app's Bengali font.
class _Fraction extends StatelessWidget {
  final MathSegment segment;
  final TextStyle style;

  const _Fraction(this.segment, this.style);

  @override
  Widget build(BuildContext context) {
    final part = style.copyWith(
      fontSize: (style.fontSize ?? 14) * 0.92,
      height: 1.2,
    );
    return Semantics(
      label: segment.raw,
      excludeSemantics: true,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (segment.whole != null)
              Text('${segment.whole}', style: style.copyWith(height: 1)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: IntrinsicWidth(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      segment.numerator!,
                      style: part,
                      textAlign: TextAlign.center,
                    ),
                    Container(
                      height: 1.2,
                      margin: const EdgeInsets.symmetric(vertical: 1.5),
                      color:
                          style.color ??
                          DefaultTextStyle.of(context).style.color,
                    ),
                    Text(
                      segment.denominator!,
                      style: part,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

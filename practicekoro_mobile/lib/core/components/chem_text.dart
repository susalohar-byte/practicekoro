// Chemistry in question text, for MathText.
//
// * Plain formulas typed without LaTeX: "H2SO4" → "H₂SO₄", "2H2 + O2 -> 2H2O" → "2H₂ + O₂ → 2H₂O"
//   (kept in step with the website's student-web/src/components/ui/chemText.ts).
// * \ce{...} and \pu{...} (mhchem, which the website's KaTeX has) rewritten into plain LaTeX,
//   since flutter_math has no mhchem.

const _elements = {
  'H',
  'He',
  'Li',
  'Be',
  'B',
  'C',
  'N',
  'O',
  'F',
  'Ne',
  'Na',
  'Mg',
  'Al',
  'Si',
  'P',
  'S', //
  'Cl',
  'Ar',
  'K',
  'Ca',
  'Sc',
  'Ti',
  'V',
  'Cr',
  'Mn',
  'Fe',
  'Co',
  'Ni',
  'Cu',
  'Zn',
  'Ga', //
  'Ge',
  'As',
  'Se',
  'Br',
  'Kr',
  'Rb',
  'Sr',
  'Y',
  'Zr',
  'Nb',
  'Mo',
  'Tc',
  'Ru',
  'Rh',
  'Pd', //
  'Ag',
  'Cd',
  'In',
  'Sn',
  'Sb',
  'Te',
  'I',
  'Xe',
  'Cs',
  'Ba',
  'La',
  'Ce',
  'Pr',
  'Nd',
  'Pm', //
  'Sm',
  'Eu',
  'Gd',
  'Tb',
  'Dy',
  'Ho',
  'Er',
  'Tm',
  'Yb',
  'Lu',
  'Hf',
  'Ta',
  'W',
  'Re',
  'Os', //
  'Ir',
  'Pt',
  'Au',
  'Hg',
  'Tl',
  'Pb',
  'Bi',
  'Po',
  'At',
  'Rn',
  'Fr',
  'Ra',
  'Ac',
  'Th',
  'Pa', //
  'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr',
};

// Single-element molecules written with a count; anything else needs two or more elements,
// so "B12" (vitamin) or "A4" (paper) never change.
const _molecules = {
  'H2',
  'O2',
  'O3',
  'N2',
  'F2',
  'Cl2',
  'Br2',
  'I2',
  'P4',
  'S8',
};

const _subscript = '₀₁₂₃₄₅₆₇₈₉';

final _formula = RegExp(
  r'(?<![A-Za-z0-9])(\d{0,2})((?:[A-Z][a-z]?\d{0,2}|\((?:[A-Z][a-z]?\d{0,2})+\)\d{0,2})+)(?![A-Za-z0-9])',
);
final _symbol = RegExp(r'[A-Z][a-z]?');
final _count = RegExp(r'([A-Za-z)])(\d{1,2})');

bool _isFormula(String body) {
  if (!body.contains(RegExp(r'\d'))) return false;
  final symbols = _symbol.allMatches(body).map((m) => m.group(0)!).toList();
  if (!symbols.every(_elements.contains)) return false;
  return symbols.length >= 2 || _molecules.contains(body);
}

/// Plain text with chemical formula counts as subscripts and -> / <=> as arrows.
String prettyChem(String text) {
  if (!text.contains(RegExp(r'[A-Z]')) && !text.contains(RegExp(r'->|<=>'))) {
    return text;
  }
  return text
      .replaceAllMapped(_formula, (m) {
        final body = m.group(2)!;
        if (!_isFormula(body)) return m.group(0)!;
        return m.group(1)! +
            body.replaceAllMapped(
              _count,
              (c) =>
                  c.group(1)! +
                  c
                      .group(2)!
                      .split('')
                      .map((d) => _subscript[int.parse(d)])
                      .join(),
            );
      })
      .replaceAll('<=>', '⇌')
      .replaceAll('->', '→');
}

final _arrow = RegExp(r'^(<=>|<->|->|<-)(?:\[([^\]]*)\])?');
final _charge = RegExp(r'^\^(\{[^}]*\}|\d*[+-]|\d+)');
final _state = RegExp(r'^\((s|l|g|aq)\)');
final _letters = RegExp(r'^[A-Za-z]+');
final _digits = RegExp(r'^\d+');

const _arrowTex = {
  '<=>': r'\rightleftharpoons',
  '<->': r'\leftrightarrow',
  '->': r'\rightarrow',
  '<-': r'\leftarrow',
};

/// mhchem \ce{...} content as plain LaTeX: "2H2 + O2 ->[\Delta] 2H2O", "SO4^2-", "Na+",
/// "CuSO4.5H2O", "(aq)".
String ceToTex(String ce) {
  final out = StringBuffer();
  var i = 0;
  var afterFormula =
      false; // last token was an element symbol or ')', so digits are counts
  while (i < ce.length) {
    final rest = ce.substring(i);
    final arrow = _arrow.firstMatch(rest);
    if (arrow != null) {
      final cmd = _arrowTex[arrow.group(1)]!;
      final label = arrow.group(2);
      final op = arrow.group(1);
      out.write(
        label == null
            ? ' $cmd '
            : op == '->'
            ? r' \xrightarrow{'
                  '$label} '
            : op == '<-'
            ? r' \xleftarrow{'
                  '$label} '
            : r' \mathrel{\overset{'
                  '$label}{$cmd}} ',
      );
      i += arrow.group(0)!.length;
      afterFormula = false;
      continue;
    }
    final charge = _charge.firstMatch(rest);
    if (charge != null) {
      var c = charge.group(1)!;
      if (c.startsWith('{')) c = c.substring(1, c.length - 1);
      out.write('^{$c}');
      i += charge.group(0)!.length;
      afterFormula = false;
      continue;
    }
    final state = _state.firstMatch(rest);
    if (state != null) {
      out.write(
        r'\mathrm{'
        '${state.group(0)}}',
      );
      i += state.group(0)!.length;
      afterFormula = false;
      continue;
    }
    final letters = _letters.firstMatch(rest);
    if (letters != null) {
      out.write(
        r'\mathrm{'
        '${letters.group(0)}}',
      );
      i += letters.group(0)!.length;
      afterFormula = true;
      continue;
    }
    final digits = _digits.firstMatch(rest);
    if (digits != null) {
      out.write(afterFormula ? '_{${digits.group(0)}}' : digits.group(0));
      i += digits.group(0)!.length;
      afterFormula = false;
      continue;
    }
    final ch = ce[i];
    final next = i + 1 < ce.length ? ce[i + 1] : ' ';
    if (afterFormula &&
        (ch == '+' || ch == '-') &&
        (next == ' ' || next == ')')) {
      out.write('^{$ch}'); // ion charge written without ^, as in Na+ or Cl-
    } else if (ch == '.' || ch == '*') {
      out.write(r'\cdot ');
    } else if (ch == '{' || ch == '}') {
      // grouping braces carry no meaning here
    } else {
      out.write(ch);
    }
    afterFormula = ch == ')';
    i++;
  }
  return out.toString();
}

/// mhchem \pu{...} content as plain LaTeX: "10 m s-1" → 10\,\mathrm{m}\,\mathrm{s}^{-1},
/// "6.02e23 mol-1", "25 °C".
String puToTex(String pu) {
  return pu
      .trim()
      .split(RegExp(r'\s+'))
      .map((part) {
        final sci = RegExp(r'^(-?[\d.]+)[eE](-?\d+)$').firstMatch(part);
        if (sci != null) return '${sci.group(1)}\\times 10^{${sci.group(2)}}';
        if (RegExp(r'^-?[\d.,]+$').hasMatch(part)) return part;
        return part
            .replaceAllMapped(
              RegExp(r'([^\d\s.*/^-]+)(\^?)(-?\d+)?'),
              (m) =>
                  '\\mathrm{${m.group(1)}}${m.group(3) == null ? '' : '^{${m.group(3)}}'}',
            )
            .replaceAll(RegExp(r'[.*]'), r'\cdot ');
      })
      .join(r'\,');
}

/// [tex] with every \ce{...} and \pu{...} rewritten by [ceToTex] / [puToTex].
String expandMhchem(String tex) {
  if (!tex.contains(r'\ce') && !tex.contains(r'\pu')) return tex;
  final out = StringBuffer();
  var i = 0;
  while (i < tex.length) {
    final m = RegExp(r'\\(ce|pu)\s*\{').matchAsPrefix(tex, i);
    if (m == null) {
      out.write(tex[i]);
      i++;
      continue;
    }
    var depth = 1;
    var j = m.end;
    while (j < tex.length && depth > 0) {
      if (tex[j] == '{') depth++;
      if (tex[j] == '}') depth--;
      j++;
    }
    final body = tex.substring(m.end, depth == 0 ? j - 1 : j);
    out.write('{${m.group(1) == 'ce' ? ceToTex(body) : puToTex(body)}}');
    i = j;
  }
  return out.toString();
}

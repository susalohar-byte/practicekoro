import 'package:flutter_math_fork/flutter_math.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:practicekoro_mobile/core/components/chem_text.dart';

void main() {
  group('prettyChem', () {
    test('writes formula counts as subscripts', () {
      expect(prettyChem('H2SO4 একটি অ্যাসিড'), 'H₂SO₄ একটি অ্যাসিড');
      expect(
        prettyChem('CaCO3, Fe2O3, Ca(OH)2, CuSO4.5H2O'),
        'CaCO₃, Fe₂O₃, Ca(OH)₂, CuSO₄.5H₂O',
      );
      expect(prettyChem('2H2 + O2 -> 2H2O'), '2H₂ + O₂ → 2H₂O');
      expect(prettyChem('N2 + 3H2 <=> 2NH3'), 'N₂ + 3H₂ ⇌ 2NH₃');
    });

    test('leaves non-formulas alone', () {
      for (final s in [
        'Vitamin B12', 'A4 কাগজ', 'WBP 2024', 'KP SI', 'NaCl', 'Q1', 'G20', //
        'MP3', 'Class10',
      ]) {
        expect(prettyChem(s), s);
      }
    });
  });

  group('expandMhchem', () {
    test('rewrites \\ce and \\pu into LaTeX flutter_math can parse', () {
      const inputs = [
        r'\ce{2H2 + O2 -> 2H2O}',
        r'\ce{N2 + 3H2 <=> 2NH3}',
        r'\ce{N2 + 3H2 <=>[Fe] 2NH3}',
        r'\ce{CaCO3 ->[\Delta] CaO + CO2}',
        r'\ce{SO4^2-}',
        r'\ce{Na+ + Cl- -> NaCl}',
        r'\ce{CuSO4.5H2O}',
        r'\ce{NaCl(aq)}',
        r'\ce{Fe^{3+}}',
        r'\pu{10 m s-1}',
        r'\pu{6.02e23 mol-1}',
        r'v = \pu{3e8 m/s}',
      ];
      for (final tex in inputs) {
        final out = expandMhchem(tex);
        expect(out, isNot(contains(r'\ce')), reason: tex);
        expect(Math.tex(out).parseError, isNull, reason: '$tex -> $out');
      }
    });

    test('subscripts counts and keeps coefficients', () {
      expect(expandMhchem(r'\ce{2H2O}'), r'{2\mathrm{H}_{2}\mathrm{O}}');
      expect(expandMhchem(r'\ce{SO4^2-}'), r'{\mathrm{SO}_{4}^{2-}}');
    });
  });
}

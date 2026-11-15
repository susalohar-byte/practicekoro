import { describe, expect, it } from 'vitest';
import { chemParts } from './chemText';

describe('chemParts', () => {
  it('splits formula counts out as subscripts', () => {
    expect(chemParts('H2SO4 একটি অ্যাসিড')).toEqual(['H', { sub: '2' }, 'SO', { sub: '4' }, ' একটি অ্যাসিড']);
    expect(chemParts('Ca(OH)2')).toEqual(['Ca(OH)', { sub: '2' }]);
    expect(chemParts('2H2 + O2 -> 2H2O')).toEqual(['2H', { sub: '2' }, ' + O', { sub: '2' }, ' → 2H', { sub: '2' }, 'O']);
    expect(chemParts('N2 + 3H2 <=> 2NH3')).toEqual(['N', { sub: '2' }, ' + 3H', { sub: '2' }, ' ⇌ 2NH', { sub: '3' }]);
    expect(chemParts('CuSO4.5H2O')).toEqual(['CuSO', { sub: '4' }, '.5H', { sub: '2' }, 'O']);
  });

  it('leaves non-formulas alone', () => {
    for (const s of ['Vitamin B12', 'A4 কাগজ', 'WBP 2024', 'KP SI', 'NaCl', 'Q1', 'G20', 'MP3', 'Class10']) {
      expect(chemParts(s)).toEqual([s]);
    }
  });
});

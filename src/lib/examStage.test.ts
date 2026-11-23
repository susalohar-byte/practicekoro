import { describe, expect, it } from 'vitest';
import { hasExamStage, stagePaperUpdate, testStage, withStage } from './examStage';

describe('examStage', () => {
  it('reads the paper from paper name, then title (same rule as the apps)', () => {
    expect(testStage({ title: 'WBCS Preliminary Mock' })).toBe('Prelims');
    expect(testStage({ title: 'Mock 1', paperName: 'Mains' })).toBe('Mains');
    expect(testStage({ title: 'WBP মেইন পরীক্ষা' })).toBe('Mains');
    expect(testStage({ title: 'WBP Constable Final Written 2019 Question Paper' })).toBe('Mains');
    expect(testStage({ title: 'WBP Constable Final (Main) Written 2018' })).toBe('Mains');
    expect(testStage({ title: 'Grand Final Mock Test' })).toBeNull();
    expect(testStage({ title: 'Domain knowledge test' })).toBeNull();
    expect(testStage({ title: 'Prelims + Mains combined' })).toBeNull();
  });

  it('swaps only the Prelims / Mains word and keeps the rest', () => {
    expect(withStage('Prelims Shift 1', 'Mains')).toBe('Mains Shift 1');
    expect(withStage('Official Preliminary', 'Mains')).toBe('Mains Official');
    expect(withStage('Shift 2', 'Prelims')).toBe('Prelims Shift 2');
    expect(withStage('Prelims', null)).toBeUndefined();
    expect(withStage(undefined, 'Mains')).toBe('Mains');
  });

  it('saves a paper change only when the paper really changed', () => {
    expect(stagePaperUpdate({ title: 'Mock', paperName: 'Prelims' }, 'Prelims')).toBeUndefined();
    expect(stagePaperUpdate({ title: 'Mock', paperName: 'Prelims Shift 1' }, 'Mains')).toBe(
      'Mains Shift 1'
    );
    expect(stagePaperUpdate({ title: 'Mock', paperName: 'Prelims' }, null)).toBe('');
    expect(stagePaperUpdate({ title: 'Mock 1' }, 'Mains')).toBe('Mains');
  });

  it('applies to Full Mock and PYQ only', () => {
    expect(hasExamStage('full_mock')).toBe(true);
    expect(hasExamStage('pyq')).toBe(true);
    expect(hasExamStage('topic')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MathText, splitMath } from './MathText';

describe('splitMath', () => {
  it('finds inline and display LaTeX', () => {
    expect(splitMath('উত্তর $6\\frac{1}{3}$ দিন')).toEqual([
      { text: 'উত্তর ' },
      { tex: '6\\frac{1}{3}', display: false, raw: '$6\\frac{1}{3}$' },
      { text: ' দিন' },
    ]);
    expect(splitMath('$$x^2$$')).toEqual([{ tex: 'x^2', display: true, raw: '$$x^2$$' }]);
    expect(splitMath('\\(a+b\\)')).toEqual([{ tex: 'a+b', display: false, raw: '\\(a+b\\)' }]);
  });

  it('leaves prices and plain text alone', () => {
    expect(splitMath('costs $5 and $10')).toEqual([{ text: 'costs $5 and $10' }]);
    expect(splitMath('10 জন পুরুষ 15 দিনে')).toEqual([{ text: '10 জন পুরুষ 15 দিনে' }]);
    expect(splitMath('তারিখ 15/08/2024, অনুপাত 1.5/2')).toEqual([{ text: 'তারিখ 15/08/2024, অনুপাত 1.5/2' }]);
  });

  it('turns plain-text fractions into LaTeX', () => {
    expect(splitMath('6 1/3 দিন')).toEqual([
      { tex: '6\\frac{1}{3}', display: false, raw: '6 1/3' },
      { text: ' দিন' },
    ]);
    expect(splitMath('কাজের 2/3 অংশ')).toEqual([
      { text: 'কাজের ' },
      { tex: '\\frac{2}{3}', display: false, raw: '2/3' },
      { text: ' অংশ' },
    ]);
    expect(splitMath('৬ ১/৩')).toEqual([
      { tex: '\\text{৬}\\frac{\\text{১}}{\\text{৩}}', display: false, raw: '৬ ১/৩' },
    ]);
  });
});

describe('MathText', () => {
  it('renders plain text unchanged', () => {
    const { container } = render(<MathText>{'6 দিন'}</MathText>);
    expect(container.textContent).toBe('6 দিন');
  });

  it('typesets a mixed fraction with KaTeX', async () => {
    const { container } = render(<MathText>{'$6\\frac{1}{3}$ দিন'}</MathText>);
    await waitFor(() => expect(container.querySelector('.katex .mfrac')).toBeTruthy());
    expect(container.textContent).toContain('দিন');
  });
});

import { describe, expect, it } from 'vitest';
import { buildRules } from './TestDetailsPage';
import { explanationLines } from '@/features/results/SolutionsPage';

describe('test instructions', () => {
  it('builds rules from the real marks and negative marking', () => {
    const rules = buildRules({ totalQuestions: 100, durationMinutes: 90, totalMarks: 100, negativeMarking: 0.25 });
    expect(rules).toContain('Each correct answer carries 1 mark.');
    expect(rules).toContain('Negative marking of 0.25 marks will be deducted for each wrong answer.');
    const none = buildRules({ totalQuestions: 50, durationMinutes: 45, totalMarks: 100, negativeMarking: 0 });
    expect(none).toContain('Each correct answer carries 2 marks.');
    expect(none).toContain('There is no negative marking for wrong answers.');
  });

  it('splits explanations into bullet lines', () => {
    expect(explanationLines('• One\n- Two\n\nThree')).toEqual(['One', 'Two', 'Three']);
  });
});

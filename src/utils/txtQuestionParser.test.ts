import { describe, it, expect } from 'vitest';
import {
  parseQuestionsTxt,
  SAMPLE_TXT_CONTENT,
  normalizeBengaliNumerals,
} from './txtQuestionParser';

describe('txtQuestionParser', () => {
  it('correctly normalizes Bengali numerals', () => {
    expect(normalizeBengaliNumerals('১২৩৪৫')).toBe('12345');
    expect(normalizeBengaliNumerals('০৬৭৮৯')).toBe('06789');
  });

  it('parses the sample Bengali TXT content with 100% validity', () => {
    const result = parseQuestionsTxt(SAMPLE_TXT_CONTENT);
    expect(result.totalDetected).toBe(3);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toHaveLength(3);

    const q1 = result.valid[0];
    expect(q1.questionNumber).toBe(1);
    expect(q1.questionText).toContain('ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?');
    expect(q1.optionA).toBe('ড. রাজেন্দ্র প্রসাদ');
    expect(q1.optionB).toBe('জওহরলাল নেহরু');
    expect(q1.optionC).toBe('সর্বপল্লী রাধাকৃষ্ণন');
    expect(q1.optionD).toBe('ড. বি. আর. আম্বেদকর');
    expect(q1.correctOption).toBe('A');
    expect(q1.explanation).toContain('ড. রাজেন্দ্র প্রসাদ ছিলেন স্বাধীন ভারতের প্রথম রাষ্ট্রপতি');

    const q2 = result.valid[1];
    expect(q2.questionNumber).toBe(2);
    expect(q2.questionText).toContain('মানবদেহের বৃহত্তম অঙ্গ কোনটি?');
    expect(q2.optionB).toBe('ত্বক (Skin)');
    expect(q2.correctOption).toBe('B');

    const q3 = result.valid[2];
    expect(q3.questionNumber).toBe(3);
    expect(q3.questionText).toContain('প্রদত্ত চিত্রটিতে মোট কয়টি ত্রিভুজ আছে?');
    expect(q3.imageUrl).toBe('https://practicekoro.online/images/triangle_reasoning_sample.png');
    expect(q3.optionB).toBe('১৬টি');
    expect(q3.correctOption).toBe('B');
  });

  it('parses English questions with bullet point explanations', () => {
    const englishSample = `1. What is the capital of West Bengal?
(a) Siliguri
(b) Kolkata
(c) Asansol
(d) Durgapur

Answer: (b) Kolkata

Explanation:
- Kolkata is the capital city of West Bengal.
- It is located on the eastern bank of the Hooghly River.`;

    const result = parseQuestionsTxt(englishSample);
    expect(result.totalDetected).toBe(1);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(0);

    const q = result.valid[0];
    expect(q.correctOption).toBe('B');
    expect(q.optionA).toBe('Siliguri');
    expect(q.optionB).toBe('Kolkata');
    expect(q.explanation).toContain('Kolkata is the capital city of West Bengal.');
  });

  it('detects errors when a question has only 3 options', () => {
    const incompleteSample = `1. Incomplete question
(a) Option A
(b) Option B
(c) Option C

সঠিক উত্তর: (a) Option A`;

    const result = parseQuestionsTxt(incompleteSample);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toContain('Missing: (d)');
  });

  it('detects errors when correct answer is missing', () => {
    const missingAnswerSample = `1. Question without answer
(a) Option A
(b) Option B
(c) Option C
(d) Option D

Explanation:
Some explanation`;

    const result = parseQuestionsTxt(missingAnswerSample);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toContain('Missing or undetectable correct answer');
  });

  it('handles Bengali numerals in question numbering with uppercase options', () => {
    const sample = `১. পশ্চিমবঙ্গের জাতীয় পশু কোনটি?
(A) বাঘ
(B) মেছো বিড়াল
(C) হাতি
(D) গণ্ডার

সঠিক উত্তর: (B) মেছো বিড়াল

ব্যাখ্যা:
- পশ্চিমবঙ্গের রাজ্য পশু হলো মেছো বিড়াল (Fishing Cat)।
- এটি মেছো বাঘ নামেও পরিচিত।`;

    const result = parseQuestionsTxt(sample);
    expect(result.totalDetected).toBe(1);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].questionNumber).toBe(1);
    expect(result.valid[0].correctOption).toBe('B');
    expect(result.valid[0].explanation).toContain('Fishing Cat');
  });

  it('handles empty or whitespace-only inputs gracefully', () => {
    const result = parseQuestionsTxt('   \n\n  ');
    expect(result.totalDetected).toBe(0);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('correctly extracts figure and image URLs from standalone and inline tags', () => {
    const textWithImages = `1. Look at the circuit diagram below and find the equivalent resistance:
Figure: https://example.com/circuits/q1.png
(a) 10 Ohm
(b) 20 Ohm
(c) 30 Ohm
(d) 40 Ohm
Answer: (b) 20 Ohm

2. নিচের জ্যামিতিক চিত্রটি লক্ষ্য করুন: [চিত্র: https://example.com/geometry/angle.webp]
(a) 45°
(b) 60°
(c) 90°
(d) 120°
সঠিক উত্তর: (c) 90°`;

    const result = parseQuestionsTxt(textWithImages);
    expect(result.totalDetected).toBe(2);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0].imageUrl).toBe('https://example.com/circuits/q1.png');
    expect(result.valid[1].imageUrl).toBe('https://example.com/geometry/angle.webp');
    expect(result.valid[1].questionText).toBe('নিচের জ্যামিতিক চিত্রটি লক্ষ্য করুন:');
  });

  it('does not read the first letter of a word answer as an option letter', () => {
    const result = parseQuestionsTxt(`1. What is the capital of India?
(a) Mumbai
(b) Kolkata
(c) Chennai
(d) Delhi

Answer: Delhi`);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toMatch(/correct answer/i);
  });

  it('still accepts standalone answer letters with trailing option text', () => {
    const result = parseQuestionsTxt(`1. What is the capital of India?
(a) Mumbai
(b) Kolkata
(c) Chennai
(d) Delhi

Answer: d) Delhi`);
    expect(result.errors).toHaveLength(0);
    expect(result.valid[0].correctOption).toBe('D');

    const bare = parseQuestionsTxt(`1. 2 + 2 = ?
(a) 3
(b) 4
(c) 5
(d) 6
Ans: B`);
    expect(bare.valid[0].correctOption).toBe('B');
  });

  it('keeps question lines that start with "Note" in the question text', () => {
    const result = parseQuestionsTxt(`1. Read carefully.
Note that x = 5 and y = 2. Find x + y.
(a) 6
(b) 7
(c) 8
(d) 9

Answer: (b)

Notes: x + y = 7`);
    expect(result.errors).toHaveLength(0);
    const q = result.valid[0];
    expect(q.questionText).toContain('Note that x = 5 and y = 2. Find x + y.');
    expect(q.correctOption).toBe('B');
    expect(q.explanation).toBe('x + y = 7');
  });

  it('accepts a bare explanation heading line', () => {
    const result = parseQuestionsTxt(`1. 2 + 2 = ?
(a) 3
(b) 4
(c) 5
(d) 6
Answer: (b)
Explanation
Two plus two is four.`);
    expect(result.valid[0].explanation).toBe('Two plus two is four.');
  });
});

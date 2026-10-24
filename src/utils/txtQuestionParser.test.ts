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

  it('keeps option-like and numbered lines inside an explanation as explanation text', () => {
    const result = parseQuestionsTxt(`1. Who chaired the Drafting Committee?
(a) Jawaharlal Nehru
(b) B. R. Ambedkar
(c) Rajendra Prasad
(d) Sardar Patel
Answer: (b)
Explanation:
B. R. Ambedkar was the chairman.
1947: Committee formed.
A. K. Ayyar was a member.

2. 2 + 2 = ?
(a) 3
(b) 4
(c) 5
(d) 6
Answer: (b)`);
    expect(result.totalDetected).toBe(2);
    expect(result.errors).toHaveLength(0);
    const [q1, q2] = result.valid;
    expect(q1.optionA).toBe('Jawaharlal Nehru');
    expect(q1.optionB).toBe('B. R. Ambedkar');
    expect(q1.correctOption).toBe('B');
    expect(q1.explanation).toContain('B. R. Ambedkar was the chairman.');
    expect(q1.explanation).toContain('1947: Committee formed.');
    expect(q1.explanation).toContain('A. K. Ayyar was a member.');
    expect(q2.questionText).toBe('2 + 2 = ?');
    expect(q2.correctOption).toBe('B');
  });

  it('parses the user provided bulk question format perfectly', () => {
    const userText = `1. ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?
(a) ড. রাজেন্দ্র প্রসাদ
(b) জওহরলাল নেহরু
(c) সর্বপল্লী রাধাকৃষ্ণন
(d) ড. বি. আর. আম্বেদকর
সঠিক উত্তর: (a) ড. রাজেন্দ্র প্রসাদ
Explanation:
• ড. রাজেন্দ্র প্রসাদ ছিলেন স্বাধীন ভারতের প্রথম রাষ্ট্রপতি (১৯৫০-১৯৬২)।
• তিনি ভারতের একমাত্র রাষ্ট্রপতি যিনি টানা দুইবার এই সম্মানজনক পদে আসীন ছিলেন।
• ১৯৪৬ সালে তিনি ভারতীয় গণপরিষদের (Constituent Assembly) স্থায়ী সভাপতি নির্বাচিত হন।
• ১৯৬২ সালে দেশসেবার স্বীকৃতি হিসেবে তাঁকে ভারতের সর্বোচ্চ নাগরিক সম্মান 'ভারতরত্ন' প্রদান করা হয়।
• তাঁর রচিত বিখ্যাত ঐতিহাসিক গ্রন্থের মধ্যে অন্যতম হলো 'ইন্ডিয়া ডিভাইডেড' (India Divided)।

2. মানবদেহের বৃহত্তম অঙ্গ কোনটি?
(a) যকৃৎ (Liver)
(b) ত্বক (Skin)
(c) ফুসফুস (Lungs)
(d) বৃক্ক (Kidney)
সঠিক উত্তর: (b) ত্বক (Skin)
Explanation:
• ত্বক (Integumentary system) হলো মানবদেহের বৃহত্তম বাহ্যিক অঙ্গ এবং সুরক্ষামূলক আবরণ।
• মানবদেহের বৃহত্তম অভ্যন্তরীণ অঙ্গ ও বৃহত্তম গ্রন্থি হলো যকৃৎ (Liver)।
• ত্বকের প্রধান কাজ হলো শরীরকে বাইরের আঘাত, জীবাণু সংক্রমণ এবং অতিবেগুনি রশ্মি থেকে রক্ষা করা।
• মানবদেহের তাপমাত্রা নিয়ন্ত্রণ এবং ঘামের মাধ্যমে বর্জ্য নিষ্কাশনে ত্বক মুখ্য ভূমিকা পালন করে।
• ত্বকের এপিডার্মিসে অবস্থিত মেলানিন রঞ্জক আমাদের ত্বকের বর্ণ নির্ধারণ করে।`;

    const result = parseQuestionsTxt(userText);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0].questionText).toBe('ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?');
    expect(result.valid[0].optionA).toBe('ড. রাজেন্দ্র প্রসাদ');
    expect(result.valid[0].correctOption).toBe('A');
    expect(result.valid[1].questionText).toBe('মানবদেহের বৃহত্তম অঙ্গ কোনটি?');
    expect(result.valid[1].optionB).toBe('ত্বক (Skin)');
    expect(result.valid[1].correctOption).toBe('B');
  });
});

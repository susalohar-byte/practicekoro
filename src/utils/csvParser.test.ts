import { describe, expect, it } from 'vitest';
import { parseCsvRaw, parseQuestionsCsv, parseQuestionsText } from './csvParser';

describe('parseCsvRaw', () => {
  it('supports quoted commas and escaped quotes', () => {
    expect(parseCsvRaw('question,answer\n"Who said ""Do or die"", and when?",A')).toEqual([
      ['question', 'answer'],
      ['Who said "Do or die", and when?', 'A'],
    ]);
  });
  it('strips a UTF-8 byte-order mark from the first header', () => {
    expect(parseCsvRaw('\uFEFFtitle,testType\r\nMock 01,full_mock\r\n')).toEqual([
      ['title', 'testType'],
      ['Mock 01', 'full_mock'],
    ]);
  });
});

describe('parseQuestionsCsv', () => {
  const headers = 'question_text,option_a,option_b,option_c,option_d,correct_option,marks';

  it('parses a valid question with marks and no question-level negative marks', () => {
    const result = parseQuestionsCsv(
      `${headers}\nCapital of West Bengal?,Kolkata,Delhi,Mumbai,Chennai,A,2`
    );

    expect(result.validCount).toBe(1);
    expect(result.questions[0]).toMatchObject({
      questionText: 'Capital of West Bengal?',
      correctOption: 'A',
      defaultMarks: 2,
      // Questions never carry negative marks (test-level policy).
      defaultNegativeMarks: 0,
    });
  });

  it('ignores a legacy negative_marks column', () => {
    const result = parseQuestionsCsv(
      `${headers},negative_marks\nCapital of West Bengal?,Kolkata,Delhi,Mumbai,Chennai,A,2,0.5`
    );

    expect(result.validCount).toBe(1);
    expect(result.questions[0]).toMatchObject({
      defaultMarks: 2,
      defaultNegativeMarks: 0,
    });
  });

  it('rejects missing required columns', () => {
    const result = parseQuestionsCsv('question_text,option_a\nQuestion,A');

    expect(result.validCount).toBe(0);
    expect(result.errors).toContain(
      'Missing one or more required option columns: "option_a", "option_b", "option_c", "option_d"'
    );
  });

  it('rejects invalid answer options', () => {
    const result = parseQuestionsCsv(`${headers}\nQuestion,A,B,C,D,X,1`);

    expect(result.invalidCount).toBe(1);
    expect(result.parsedRows[0].errors[0]).toContain('Invalid correct option');
  });
});

describe('parseQuestionsText (formatted text blocks)', () => {
  const sampleText = `1. সিন্ধু সভ্যতার কোন নগরটি তার উন্নত জল নিষ্কাশন ব্যবস্থার জন্য বিশেষভাবে পরিচিত?
(a) হরপ্পা
(b) মহেঞ্জোদারো
(c) লোথাল
(d) কালীবঙ্গান
সঠিক উত্তর: (b) মহেঞ্জোদারো

Explanation:
• মহেঞ্জোদারো সিন্ধু সভ্যতার অন্যতম গুরুত্বপূর্ণ নগরকেন্দ্র ছিল।
• এখানে উন্নত পয়ঃনিষ্কাশন ও নিকাশি নালার ব্যবস্থা ছিল।
• ১৯২২ সালে রাখালদাস বন্দ্যোপাধ্যায় সিন্ধুর লারকানা জেলায় এটি আবিষ্কার করেন।
• মহেঞ্জোদারোয় বিখ্যাত স্নানাগার ও ব্রোঞ্জের তৈরি নর্তকী মূর্তি পাওয়া গেছে।
• সিন্ধু ভাষায় মহেঞ্জোদারো শব্দের অর্থ হলো মৃতের স্তূপ।

2. Which Harappan site had an artificial tidal dockyard?
a) Harappa
b) Lothal
c) Mohenjodaro
d) Kalibangan
Answer: b

Explanation:
• Lothal in Gujarat had the world's earliest known tidal dockyard.
• It was a vital ancient trading port connected to the Arabian Sea.
• S.R. Rao discovered this maritime trade center in 1954.
• Rice husk remains and dock structures were excavated here.
• Lothal traded extensively with Mesopotamia and Persian Gulf.`;

  it('parses Bengali and English blocks with answer and explanation', () => {
    const result = parseQuestionsText(sampleText);

    expect(result.totalRows).toBe(2);
    expect(result.validCount).toBe(2);
    expect(result.questions[0].questionText).toContain('সিন্ধু সভ্যতার কোন নগরটি');
    expect(result.questions[0].optionB).toBe('মহেঞ্জোদারো');
    expect(result.questions[0].correctOption).toBe('B');
    expect(result.questions[0].explanation).toContain('পয়ঃনিষ্কাশন');
    expect(result.questions[1].correctOption).toBe('B');
    expect(result.questions[1].explanation).toContain('tidal dockyard');
  });

  it('applies default subject/chapter', () => {
    const result = parseQuestionsText('Q?\n(a) 1\n(b) 2\n(c) 3\n(d) 4\nAnswer: a', {
      defaultSubjectId: 'subj-1',
      defaultChapterId: 'ch-1',
    });

    expect(result.questions[0].subjectId).toBe('subj-1');
    expect(result.questions[0].chapterId).toBe('ch-1');
  });

  it('flags blocks with missing answers', () => {
    const result = parseQuestionsText('Q without answer?\n(a) 1\n(b) 2\n(c) 3\n(d) 4');

    expect(result.validCount).toBe(0);
    expect(result.parsedRows[0].errors[0]).toContain('Correct answer missing');
  });

  it('rejects non-math questions with forbidden phrases in Short Notes', () => {
    const badText = `1. হরিয়ানায় অবস্থিত হরপ্পা প্রত্নস্থল কোনটি?
(a) রাখিগড়ি
(b) লোথাল
(c) ধোলাভিরা
(d) কালীবঙ্গান
সঠিক উত্তর: (a) রাখিগড়ি

Explanation:
• সঠিক উত্তর: রাখিগড়ি।
• Option A সঠিক।
• Option B ভুল কারণ লোথাল গুজরাটে অবস্থিত।
• ধোলাভিরা গুজরাটে অবস্থিত।`;

    const result = parseQuestionsText(badText);
    expect(result.validCount).toBe(0);
    expect(result.parsedRows[0].errors.some((e) => e.includes('"সঠিক উত্তর:"'))).toBe(true);
  });
});

describe('parseQuestionsText answer letters', () => {
  const block = (answer: string) => `Q?\n(a) 1\n(b) 2\n(c) 3\n(d) 4\n${answer}`;

  it('reads a bare answer letter', () => {
    expect(parseQuestionsText(block('Answer: B')).questions[0].correctOption).toBe('B');
    expect(parseQuestionsText(block('Answer - c')).questions[0].correctOption).toBe('C');
  });

  it('does not read the last letter of an answer word as the option', () => {
    for (const answer of ['Answer: Kerala', 'উত্তর: Kolkata']) {
      const result = parseQuestionsText(block(answer));
      expect(result.validCount).toBe(0);
      expect(result.parsedRows[0].errors.join(' ')).toContain('Could not read the correct answer');
    }
  });
});

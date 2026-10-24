/**
 * PracticeKoro 2.0 — Defined TXT Question Parser
 *
 * Implements the exact question structure specified in Section 8:
 *
 * 1. Question text (English/Bengali)
 * (a) Option A
 * (b) Option B
 * (c) Option C
 * (d) Option D
 *
 * সঠিক উত্তর: (a) Option text / Ans: (a)
 *
 * Explanation:
 * - Point 1
 * - Point 2
 */

export interface ParsedTxtQuestion {
  questionNumber: number;
  questionText: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  rawText: string;
}

export interface TxtParseError {
  questionNumber: number;
  reason: string;
  rawText: string;
}

export interface TxtParseResult {
  totalDetected: number;
  valid: ParsedTxtQuestion[];
  errors: TxtParseError[];
}

import { isMathematicsSubject, validateShortNotes } from './shortNotes';

/**
 * Standard Sample TXT content provided for Admins to view or download.
 * Conforms strictly to PracticeKoro Short Notes rules:
 * - 4-5 bullets starting with • on separate lines
 * - Direct exam-relevant facts
 * - No forbidden answer declarations
 */
export const SAMPLE_TXT_CONTENT = `1. ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?
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
• ত্বকের এপিডার্মিসে অবস্থিত মেলানিন রঞ্জক আমাদের ত্বকের বর্ণ নির্ধারণ করে।

3. প্রদত্ত চিত্রটিতে মোট কয়টি ত্রিভুজ আছে? (চিত্রভিত্তিক প্রশ্ন নমুনা)
[Image: https://practicekoro.online/images/triangle_reasoning_sample.png]
(a) ১২টি
(b) ১৬টি
(c) ১৮টি
(d) ২০টি

সঠিক উত্তর: (b) ১৬টি

Explanation:
• এই ধরণের প্রতিসম ত্রিভুজে অভ্যন্তরীণ খণ্ডের সূত্রের সাহায্যে দ্রুত গণনা করা যায়।
• কেন্দ্রীয় বিন্দু থেকে বিভক্ত প্রতিটি অংশে ৪টি করে ছোট ত্রিভুজ গঠিত হয়।
• সর্বমোট ত্রিভুজ সংখ্যা = ৪ × ৪ = ১৬টি।
• সময় বাঁচাতে পরীক্ষার ক্ষেত্রে এই শর্টকাট কৌশলটি অত্যন্ত কার্যকর।`;

/**
 * Helper to trigger browser download of sample TXT template.
 */
export function downloadSampleTxt(filename = 'practicekoro_question_template.txt'): void {
  const blob = new Blob([SAMPLE_TXT_CONTENT], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Normalizes Bengali numerals (০-৯) to standard Arabic numerals (0-9)
 */
export function normalizeBengaliNumerals(input: string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return input.replace(/[০-৯]/g, (digit) => String(bengaliDigits.indexOf(digit)));
}

/**
 * Parses raw TXT content into structured questions with granular error tracking.
 */
export function parseQuestionsTxt(
  content: string,
  parseOptions?: { isMathematics?: boolean; subjectId?: string; enforceShortNotes?: boolean }
): TxtParseResult {
  if (!content || !content.trim()) {
    return { totalDetected: 0, valid: [], errors: [] };
  }

  const isMath = Boolean(
    parseOptions?.isMathematics ??
    (parseOptions?.subjectId ? isMathematicsSubject(parseOptions.subjectId) : false)
  );
  const shouldEnforceShortNotes = Boolean(
    parseOptions?.enforceShortNotes ??
    (parseOptions?.subjectId ? !isMath : parseOptions?.isMathematics === false)
  );

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // Strategy to detect individual question blocks:
  // A question block typically starts with a number followed by dot/parenthesis/colon
  // e.g., "1.", "1)", "১.", "Q1.", "Question 1:" at the start of a line
  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  const startRegex = /^(?:(?:Q(?:uestion)?\s*)?[0-9০-৯]+[-.:)]\s*)/i;
  const blockOptionRegex = /^\s*(?:\(([a-dA-D])\)|([a-dA-D])[.)])\s*(.*)$/;
  const blockExplanationRegex =
    /^\s*(?:Explanation|ব্যাখ্যা|Short\s*Notes|শর্ট\s*নোটস|Notes?)\s*(?:[:\-–—]\s*(.*))?$/i;

  // Inside an explanation, a numbered line ("1947: Committee formed.") only starts a new
  // question when it is followed by option lines (at least two distinct letters) before the
  // next numbered line.
  const startsQuestionWithOptions = (from: number): boolean => {
    const letters = new Set<string>();
    for (let j = from + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (startRegex.test(next)) break;
      const opt = next.match(blockOptionRegex);
      if (opt) letters.add((opt[1] || opt[2]).toUpperCase());
      if (letters.size >= 2) return true;
    }
    return false;
  };

  let inExplanation = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isNewQuestionStart =
      startRegex.test(line.trim()) && (!inExplanation || startsQuestionWithOptions(i));

    if (isNewQuestionStart) inExplanation = false;
    else if (blockExplanationRegex.test(line.trim())) inExplanation = true;

    if (isNewQuestionStart && currentBlock.length > 0) {
      // Check if previous block has content before pushing
      const joined = currentBlock.join('\n').trim();
      if (joined) {
        blocks.push(joined);
      }
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    const joined = currentBlock.join('\n').trim();
    if (joined) {
      blocks.push(joined);
    }
  }

  // Fallback: If no numbering was found in any line, split by double empty lines
  const hasAnyNumbering = lines.some((l) => startRegex.test(l.trim()));
  if (!hasAnyNumbering && normalized.includes('\n\n')) {
    const paragraphs = normalized.split(/\n\s*\n+/);
    if (paragraphs.length > 0) {
      blocks.length = 0;
      for (const p of paragraphs) {
        if (p.trim()) blocks.push(p.trim());
      }
    }
  }

  const valid: ParsedTxtQuestion[] = [];
  const errors: TxtParseError[] = [];

  blocks.forEach((block, index) => {
    const questionNumber = index + 1;
    const blockLines = block.split('\n');

    // Extract Question Number if present in text
    const firstLine = blockLines[0]?.trim() || '';
    const numMatch = firstLine.match(/^(?:(?:Q(?:uestion)?\s*)?([0-9০-৯]+)[-.:)]\s*)/i);
    const parsedNumber = numMatch
      ? parseInt(normalizeBengaliNumerals(numMatch[1]), 10)
      : questionNumber;

    // Remove the leading number prefix from question statement line
    let questionFirstLine = firstLine;
    if (numMatch) {
      questionFirstLine = firstLine.substring(numMatch[0].length).trim();
    }

    // Extract Question Text, Options, Answer, and Explanation
    // Options pattern: (a), (b), (c), (d) or a), b), c), d) or A., B., C., D.
    const optionRegex = /^\s*(?:\(([a-dA-D])\)|([a-dA-D])[.)])\s*(.*)$/;

    // Answer pattern:
    // "সঠিক উত্তর: (a) ..." or "সঠিক উত্তর : a" or "Ans: (a)" or "Answer: a" or "Correct: (a)"
    // The bare letter must stand alone ("Answer: Delhi" must not read as D).
    const answerRegex =
      /^\s*(?:সঠিক\s*উত্তর|উত্তর|Answer|Ans|Correct\s*Answer|Correct\s*Option)\s*[:\-–—]\s*(?:\(([a-dA-D])\)|([a-dA-D])(?![A-Za-z0-9\u0980-\u09FF]))/i;
    // Explanation pattern:
    // "Explanation:" or "ব্যাখ্যা:" or "ব্যাখ্যা : " or "Short Notes:" or "শর্ট নোটস:"
    // Either a bare heading line ("Explanation") or heading + separator ("Note: ...");
    // a question line that merely starts with "Note"/"Notes" is not a heading.
    const explanationRegex =
      /^\s*(?:Explanation|ব্যাখ্যা|Short\s*Notes|শর্ট\s*নোটস|Notes?)\s*(?:[:\-–—]\s*(.*))?$/i;

    // Image/Diagram/Figure pattern:
    // "[Image: https://...]" or "Image: https://..." or "Figure: https://..." or "Diagram: https://..." or "ছবি: https://..." or "চিত্র: https://..."
    const imageRegex =
      /^\s*(?:\[?\s*(?:Image|ছবি|Diagram|চিত্র|Figure|Fig|Photo)\s*[:\-–—]\s*(https?:\/\/[^\s\]]+)\s*\]?)\s*$/i;

    let imageUrl: string | undefined = undefined;

    // Check if the question first line itself contains an inline image tag e.g. [image: https://...]
    const inlineTagInFirstLine = questionFirstLine.match(
      /\[(?:Image|ছবি|Diagram|চিত্র|Figure|Fig|Photo)\s*[:\-–—]\s*(https?:\/\/[^\]\s]+)\]/i
    );
    if (inlineTagInFirstLine) {
      imageUrl = inlineTagInFirstLine[1];
      questionFirstLine = questionFirstLine.replace(inlineTagInFirstLine[0], '').trim();
    }

    // Check if the question first line itself is a standalone image tag
    const firstLineImgMatch = questionFirstLine.match(imageRegex);
    let initialQuestionLines: string[] = [];
    if (firstLineImgMatch) {
      imageUrl = firstLineImgMatch[1];
    } else {
      initialQuestionLines = [questionFirstLine];
    }

    const questionLines: string[] = initialQuestionLines;
    const options: Record<'A' | 'B' | 'C' | 'D', string> = {
      A: '',
      B: '',
      C: '',
      D: '',
    };
    let correctOption: 'A' | 'B' | 'C' | 'D' | null = null;
    const explanationLines: string[] = [];

    let currentSection: 'question' | 'option' | 'answer' | 'explanation' = 'question';
    let currentOptionKey: 'A' | 'B' | 'C' | 'D' | null = null;

    for (let l = 1; l < blockLines.length; l++) {
      const rawLine = blockLines[l];
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      // Check for standalone image URL tag in question section
      const imgMatch = trimmed.match(imageRegex);
      if (imgMatch) {
        imageUrl = imgMatch[1];
        continue;
      }

      // Explanation text is free-form: "B. R. Ambedkar ..." is not option B, and an answer
      // line is only read there if none was given before the explanation.
      const inExplanationSection = currentSection === 'explanation';

      // Check for Answer line
      const ansMatch = inExplanationSection && correctOption ? null : trimmed.match(answerRegex);
      if (ansMatch) {
        const letter = (ansMatch[1] || ansMatch[2]).toUpperCase() as 'A' | 'B' | 'C' | 'D';
        correctOption = letter;
        currentSection = 'answer';
        continue;
      }

      // Check for Explanation line
      const expMatch = trimmed.match(explanationRegex);
      if (expMatch) {
        currentSection = 'explanation';
        if (expMatch[1] && expMatch[1].trim()) {
          explanationLines.push(expMatch[1].trim());
        }
        continue;
      }

      // Check for Option line
      const optMatch = inExplanationSection ? null : trimmed.match(optionRegex);
      if (optMatch) {
        const letter = (optMatch[1] || optMatch[2]).toUpperCase() as 'A' | 'B' | 'C' | 'D';
        currentOptionKey = letter;
        options[letter] = optMatch[3].trim();
        currentSection = 'option';
        continue;
      }

      // Continuation of current section
      if (currentSection === 'question') {
        questionLines.push(trimmed);
      } else if (currentSection === 'option' && currentOptionKey) {
        // Multi-line option text
        options[currentOptionKey] += (options[currentOptionKey] ? ' ' : '') + trimmed;
      } else if (currentSection === 'explanation') {
        explanationLines.push(trimmed);
      }
    }

    let fullQuestionText = questionLines.join('\n').trim();

    // Secondary search for inline image tag in question text if not detected earlier
    if (!imageUrl) {
      const inlineTagMatch = fullQuestionText.match(
        /\[(?:Image|ছবি|Diagram|চিত্র|Figure|Fig|Photo)\s*[:\-–—]\s*(https?:\/\/[^\]\s]+)\]/i
      );
      if (inlineTagMatch) {
        imageUrl = inlineTagMatch[1];
        fullQuestionText = fullQuestionText.replace(inlineTagMatch[0], '').trim();
      }
    }

    // Secondary search for Answer if not caught by line-start regex
    if (!correctOption) {
      const inlineAnsMatch = block.match(
        /(?:সঠিক\s*উত্তর|উত্তর|Answer|Ans|Correct)\s*[:\-–—]\s*(?:\(([a-dA-D])\)|([a-dA-D])(?![A-Za-z0-9\u0980-\u09FF]))/i
      );
      if (inlineAnsMatch) {
        correctOption = (inlineAnsMatch[1] || inlineAnsMatch[2]).toUpperCase() as
          'A' | 'B' | 'C' | 'D';
      }
    }

    // Validation checks
    if (!fullQuestionText) {
      errors.push({
        questionNumber: parsedNumber,
        reason: 'Question text is missing or empty.',
        rawText: block,
      });
      return;
    }

    const missingOptions: string[] = [];
    if (!options.A) missingOptions.push('(a)');
    if (!options.B) missingOptions.push('(b)');
    if (!options.C) missingOptions.push('(c)');
    if (!options.D) missingOptions.push('(d)');

    if (missingOptions.length > 0) {
      errors.push({
        questionNumber: parsedNumber,
        reason: `Incomplete options detected. Missing: ${missingOptions.join(', ')} (${4 - missingOptions.length} of 4 options found).`,
        rawText: block,
      });
      return;
    }

    if (!correctOption) {
      errors.push({
        questionNumber: parsedNumber,
        reason: 'Missing or undetectable correct answer (e.g. "সঠিক উত্তর: (a)" or "Answer: (a)").',
        rawText: block,
      });
      return;
    }

    // When explicitly validating for non-mathematics subjects, enforce Short Notes rules
    if (shouldEnforceShortNotes) {
      const expText = explanationLines.join('\n');
      if (!expText.trim()) {
        errors.push({
          questionNumber: parsedNumber,
          reason: 'শর্ট নোটস (Short Notes) প্রদান করা আবশ্যক। ৪–৫টি বুলেট পয়েন্ট দিন।',
          rawText: block,
        });
        return;
      }
      const shortNotesErrors = validateShortNotes(expText, false);
      if (shortNotesErrors.length > 0) {
        errors.push({
          questionNumber: parsedNumber,
          reason: shortNotesErrors.join(' '),
          rawText: block,
        });
        return;
      }
    }

    // Valid question block
    valid.push({
      questionNumber: parsedNumber,
      questionText: fullQuestionText,
      optionA: options.A,
      optionB: options.B,
      optionC: options.C,
      optionD: options.D,
      correctOption,
      explanation: explanationLines.length > 0 ? explanationLines.join('\n') : undefined,
      imageUrl,
      rawText: block,
    });
  });

  return {
    totalDetected: blocks.length,
    valid,
    errors,
  };
}

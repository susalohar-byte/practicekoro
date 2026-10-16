import type { Question } from '../types/index.ts';
import { isMathematicsSubject, validateShortNotes, normalizeShortNotes } from './shortNotes';

export interface ParsedCsvQuestion {
  rowNumber: number;
  data: Omit<Question, 'id'>;
  isValid: boolean;
  errors: string[];
}

export interface CsvParseResult {
  questions: Omit<Question, 'id'>[];
  parsedRows: ParsedCsvQuestion[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  errors: string[];
}

export type QuestionImportFormat = 'csv' | 'text';

/**
 * Normalizes an explanation into a consistent bullet-point format.
 * It only formats the supplied content; it never invents new facts.
 */
export function normalizeExplanationBullets(value: string | undefined | null): string {
  if (!value?.trim()) return '';

  const lines = value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const cleaned = lines
    .map((line) => line.replace(/^\s*(?:[-•*▪◦]\s*|\d+[.)]\s*)/, '').trim())
    .filter(Boolean);

  if (cleaned.length === 0) return '';

  return cleaned
    .slice(0, 5)
    .map((line) => `• ${line}`)
    .join('\n');
}

/**
 * Validates a supplied explanation. Explanations are optional for backwards
 * compatibility, but when present they must contain 2-5 meaningful bullets.
 */
export function validateExplanationBullets(value: string | undefined | null): string[] {
  if (!value?.trim()) return [];

  const normalized = normalizeExplanationBullets(value);
  const bullets = normalized.split('\n').filter(Boolean);
  const errors: string[] = [];

  if (bullets.length < 2) {
    errors.push(
      'Explanation must contain at least 2 bullet points. Add important facts related to the question, correct answer, or confusing options.'
    );
  }
  if (bullets.length > 5) {
    errors.push('Explanation must contain no more than 5 bullet points.');
  }

  return errors;
}

/**
 * Parses raw CSV text handling RFC 4180 quotes, commas, and newlines inside fields.
 */
export function parseCsvRaw(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  // Strip a UTF-8 byte-order mark (Excel "CSV UTF-8") so the first header is read correctly.
  const text = csvText
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped double quote
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentField.trim());
      // Only push non-empty rows
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Handle final field/row if not followed by newline
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes header string to lowercase alphanumeric representation
 */
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Validates and maps CSV rows into Question objects
 */
export function parseQuestionsCsv(
  csvContent: string,
  defaults?: { defaultSubjectId?: string; defaultChapterId?: string }
): CsvParseResult {
  const rawRows = parseCsvRaw(csvContent);

  if (rawRows.length === 0) {
    return {
      questions: [],
      parsedRows: [],
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      errors: ['The CSV file is empty.'],
    };
  }

  const rawHeaders = rawRows[0];
  const headerMap = new Map<string, number>();

  rawHeaders.forEach((h, index) => {
    headerMap.set(normalizeHeader(h), index);
  });

  // Find column index helper
  const getCol = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const norm = normalizeHeader(name);
      if (headerMap.has(norm)) {
        return headerMap.get(norm)!;
      }
    }
    return -1;
  };

  const colQuestionText = getCol(['question_text', 'question', 'questiontext']);
  const colQuestionBengali = getCol([
    'question_bengali_text',
    'bengali_question',
    'questionbengali',
    'questionbengalitext',
  ]);
  const colOptA = getCol(['option_a', 'optiona', 'a']);
  const colOptB = getCol(['option_b', 'optionb', 'b']);
  const colOptC = getCol(['option_c', 'optionc', 'c']);
  const colOptD = getCol(['option_d', 'optiond', 'd']);
  const colCorrect = getCol(['correct_option', 'correctoption', 'answer', 'correct_answer']);
  const colExplanation = getCol(['explanation', 'explanation_text']);
  const colExplanationBengali = getCol(['explanation_bengali', 'explanationbengali']);
  const colMarks = getCol(['marks', 'default_marks', 'defaultmarks']);
  // NOTE: questions never carry negative marks (test-level policy for Full
  // Mock / PYQ only). A legacy `negative_marks` column, if present, is ignored.
  const colSubjectId = getCol(['subject_id', 'subjectid']);
  const colChapterId = getCol(['chapter_id', 'chapterid']);
  const colImageUrl = getCol([
    'image_url',
    'image',
    'diagram_url',
    'diagram',
    'imageurl',
    'diagramurl',
  ]);

  const errors: string[] = [];

  if (colQuestionText === -1) {
    errors.push('Missing required column: "question_text"');
  }
  if (colOptA === -1 || colOptB === -1 || colOptC === -1 || colOptD === -1) {
    errors.push(
      'Missing one or more required option columns: "option_a", "option_b", "option_c", "option_d"'
    );
  }
  if (colCorrect === -1) {
    errors.push('Missing required column: "correct_option"');
  }

  if (errors.length > 0) {
    return {
      questions: [],
      parsedRows: [],
      totalRows: rawRows.length - 1,
      validCount: 0,
      invalidCount: rawRows.length - 1,
      errors,
    };
  }

  const parsedRows: ParsedCsvQuestion[] = [];
  const validQuestions: Omit<Question, 'id'>[] = [];

  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    const rowErrors: string[] = [];

    const getVal = (colIndex: number): string => {
      return colIndex >= 0 && colIndex < row.length ? row[colIndex].trim() : '';
    };

    const questionText = getVal(colQuestionText);
    const questionBengali = getVal(colQuestionBengali);
    const optionA = getVal(colOptA);
    const optionB = getVal(colOptB);
    const optionC = getVal(colOptC);
    const optionD = getVal(colOptD);
    const rawCorrect = getVal(colCorrect).toUpperCase();
    const explanation = normalizeExplanationBullets(getVal(colExplanation));
    const explanationBengali = normalizeExplanationBullets(getVal(colExplanationBengali));
    const rawMarks = getVal(colMarks);
    const rowSubjectId = getVal(colSubjectId) || defaults?.defaultSubjectId;
    const rowChapterId = getVal(colChapterId) || defaults?.defaultChapterId;
    const imageUrl = getVal(colImageUrl) || undefined;

    if (!questionText) {
      rowErrors.push('Question text is empty');
    }
    if (!optionA) rowErrors.push('Option A is empty');
    if (!optionB) rowErrors.push('Option B is empty');
    if (!optionC) rowErrors.push('Option C is empty');
    if (!optionD) rowErrors.push('Option D is empty');

    let correctOption: 'A' | 'B' | 'C' | 'D' = 'A';
    if (!['A', 'B', 'C', 'D'].includes(rawCorrect)) {
      rowErrors.push(`Invalid correct option "${rawCorrect}". Must be A, B, C, or D`);
    } else {
      correctOption = rawCorrect as 'A' | 'B' | 'C' | 'D';
    }

    const rowSubject = rowSubjectId || defaults?.defaultSubjectId;
    const isMath = isMathematicsSubject(rowSubject, { chapterName: rowChapterId });
    const rawExp = getVal(colExplanation);
    const rawExpBn = getVal(colExplanationBengali);

    let finalExplanation: string | undefined = explanation || undefined;
    let finalExplanationBengali: string | undefined = explanationBengali || undefined;

    if (isMath) {
      if (explanation) rowErrors.push(...validateExplanationBullets(explanation));
      if (explanationBengali) rowErrors.push(...validateExplanationBullets(explanationBengali));
    } else {
      // Non-mathematics: validate Short Notes
      const notesRaw = rawExpBn || rawExp;
      if (colExplanationBengali >= 0) {
        if (!rawExpBn.trim()) {
          rowErrors.push(
            'Short Notes (explanation_bengali) is required for non-Mathematics questions.'
          );
        } else {
          const notesErrors = validateShortNotes(rawExpBn, false);
          if (notesErrors.length > 0) {
            rowErrors.push(...notesErrors);
          } else {
            const normalized = normalizeShortNotes(rawExpBn);
            finalExplanation = normalized;
            finalExplanationBengali = normalized;
          }
        }
      } else if (notesRaw.trim()) {
        const notesErrors = validateShortNotes(notesRaw, false);
        if (notesErrors.length > 0) {
          rowErrors.push(...notesErrors);
        } else {
          const normalized = normalizeShortNotes(notesRaw);
          finalExplanation = normalized;
          finalExplanationBengali = normalized;
        }
      }
    }

    const marks = rawMarks ? parseFloat(rawMarks) || 1.0 : 1.0;

    const data: Omit<Question, 'id'> = {
      subjectId: rowSubjectId || undefined,
      chapterId: rowChapterId || undefined,
      questionText,
      questionBengaliText: questionBengali || undefined,
      imageUrl,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation: finalExplanation,
      explanationBengali: finalExplanationBengali,
      defaultMarks: marks,
      // Questions never carry negative marks — scoring uses the test-level scheme.
      defaultNegativeMarks: 0,
      isActive: true,
      status: 'active',
    };

    const isValid = rowErrors.length === 0;

    parsedRows.push({
      rowNumber: r + 1,
      data,
      isValid,
      errors: rowErrors,
    });

    if (isValid) {
      validQuestions.push(data);
    }
  }

  const validCount = parsedRows.filter((p) => p.isValid).length;
  const invalidCount = parsedRows.filter((p) => !p.isValid).length;

  return {
    questions: validQuestions,
    parsedRows,
    totalRows: parsedRows.length,
    validCount,
    invalidCount,
    errors:
      invalidCount > 0
        ? [`${invalidCount} out of ${parsedRows.length} rows have validation errors.`]
        : [],
  };
}

/**
 * Parses "formatted text" question blocks — the common study-material style:
 *
 *   1. প্রশ্ন টেক্সট?
 *   (a) Option 1
 *   (b) Option 2
 *   (c) Option 3
 *   (d) Option 4
 *   সঠিক উত্তর: (b)
 *
 *   Explanation:
 *   - line one
 *   - line two
 *
 * Rules:
 *  - Blocks are separated by one or more blank lines.
 *  - Option lines: (a)/(b)/(c)/(d) with ). or : separators, case-insensitive.
 *  - Answer line: contains "সঠিক উত্তর", "উত্তর", "correct answer" or "answer"
 *    with the letter inside (x) or after a separator.
 *  - Explanation: everything after an "Explanation"/"ব্যাখ্যা" marker line.
 *  - Leading question numbering ("1.", "12)") is stripped.
 */
export function parseQuestionsText(
  text: string,
  defaults?: { defaultSubjectId?: string; defaultChapterId?: string }
): CsvParseResult {
  const rawBlocks = text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  // If a block starts with an explanation header, merge it into the preceding question block.
  // Accepted headers: "Explanation:", "ব্যাখ্যা:", "Short Notes:", "শর্ট নোটস:"
  const blocks: string[] = [];
  for (const b of rawBlocks) {
    if (blocks.length > 0 && /^(explanation|ব্যাখ্যা|short\s*notes|শর্ট\s*নোটস)/i.test(b)) {
      blocks[blocks.length - 1] += '\n\n' + b;
    } else {
      blocks.push(b);
    }
  }

  const parsedRows: ParsedCsvQuestion[] = [];
  const validQuestions: Omit<Question, 'id'>[] = [];
  const globalErrors: string[] = [];

  blocks.forEach((block, blockIdx) => {
    const lines = block.split('\n').map((l) => l.trim());
    const rowErrors: string[] = [];

    const questionLines: string[] = [];
    const options: Record<'A' | 'B' | 'C' | 'D', string> = { A: '', B: '', C: '', D: '' };
    let correctOption: 'A' | 'B' | 'C' | 'D' | null = null;
    const explanationLines: string[] = [];
    let inExplanation = false;
    const seenOptions = new Set<string>();

    const optionRegex = /^\(?([a-dA-D])\s*[).:-]\s*(.*)$/;
    const answerRegex = /^\s*(সঠিক\s*উত্তর|উত্তর|correct\s*answer|ans\b|answer\b)\s*[:\-–\s]/i;

    for (const line of lines) {
      if (!line) continue;

      // Explanation marker line ("Explanation:", "ব্যাখ্যা:", "Short Notes:", "শর্ট নোটস:")
      if (
        /^(explanation|ব্যাখ্যা|short\s*notes|শর্ট\s*নোটস)\s*[:-]?$/i.test(line) ||
        /^(explanation|ব্যাখ্যা|short\s*notes|শর্ট\s*নোটস)\s*[:-]/i.test(line)
      ) {
        inExplanation = true;
        const inline = line
          .replace(/^(explanation|ব্যাখ্যা|short\s*notes|শর্ট\s*নোটস)\s*[:-]?\s*/i, '')
          .trim();
        if (inline) explanationLines.push(inline);
        continue;
      }

      // Answer line
      const answerMatch = line.match(answerRegex);
      if (answerMatch && !inExplanation) {
        const letterMatch =
          line.match(/\(\s*([a-dA-D])\s*\)/) ||
          line.match(/[:\-–\s]\s*\(?([a-dA-D])\s*\)?\s*$/) ||
          line.match(/([a-dA-D])\s*[).]\s*$/);
        if (letterMatch) {
          correctOption = letterMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        } else {
          rowErrors.push(`Could not read the correct answer from: "${line.slice(0, 40)}"`);
        }
        continue;
      }

      // Option line
      const optionMatch = line.match(optionRegex);
      if (optionMatch && !inExplanation) {
        const key = optionMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        if (seenOptions.has(key)) {
          rowErrors.push(`Duplicate option "${key}"`);
        }
        seenOptions.add(key);
        options[key] = optionMatch[2].trim();
        continue;
      }

      if (inExplanation) {
        const bulletLine = line.startsWith('•') ? line : `• ${line.replace(/^[-*•]\s*/, '')}`;
        explanationLines.push(bulletLine);
      } else {
        questionLines.push(line);
      }
    }

    // Join question text and strip leading numbering ("1." / "12)")
    const questionText = questionLines
      .join(' ')
      .replace(/^\s*\d+\s*[.)]\s*/, '')
      .trim();

    // Validation
    if (!questionText) {
      rowErrors.push('Question text is empty');
    }
    (['A', 'B', 'C', 'D'] as const).forEach((k) => {
      if (!options[k]) rowErrors.push(`Option ${k} is empty`);
    });
    if (!correctOption) {
      rowErrors.push('Correct answer missing — add a line like "সঠিক উত্তর: (b)"');
    }

    // Duplicate-block safety: identical question text in the same paste
    if (questionText && validQuestions.some((q) => q.questionText === questionText)) {
      rowErrors.push('Duplicate question text within this import');
    }

    const isMath = isMathematicsSubject(defaults?.defaultSubjectId, {
      chapterName: defaults?.defaultChapterId,
    });
    const rawExpStr = explanationLines.join('\n');
    let finalExplanation = normalizeExplanationBullets(rawExpStr);
    let finalExplanationBengali: string | undefined = undefined;

    if (isMath) {
      if (finalExplanation) rowErrors.push(...validateExplanationBullets(finalExplanation));
    } else if (rawExpStr.trim()) {
      const notesErrors = validateShortNotes(rawExpStr, false);
      if (notesErrors.length > 0) {
        rowErrors.push(...notesErrors);
      } else {
        const normalized = normalizeShortNotes(rawExpStr);
        finalExplanation = normalized;
        finalExplanationBengali = normalized;
      }
    }

    const data: Omit<Question, 'id'> = {
      subjectId: defaults?.defaultSubjectId || undefined,
      chapterId: defaults?.defaultChapterId || undefined,
      questionText,
      optionA: options.A,
      optionB: options.B,
      optionC: options.C,
      optionD: options.D,
      correctOption: (correctOption || 'A') as 'A' | 'B' | 'C' | 'D',
      explanation: finalExplanation || undefined,
      explanationBengali: finalExplanationBengali || finalExplanation || undefined,
      defaultMarks: 1.0,
      // Questions never carry negative marks — scoring uses the test-level scheme.
      defaultNegativeMarks: 0,
      isActive: true,
      status: 'active',
    };

    const isValid = rowErrors.length === 0;
    parsedRows.push({
      rowNumber: blockIdx + 1,
      data,
      isValid,
      errors: rowErrors,
    });
    if (isValid) validQuestions.push(data);
  });

  if (blocks.length === 0) {
    globalErrors.push('No question blocks found. Separate each question with a blank line.');
  }

  const validCount = parsedRows.filter((p) => p.isValid).length;
  const invalidCount = parsedRows.filter((p) => !p.isValid).length;

  return {
    questions: validQuestions,
    parsedRows,
    totalRows: parsedRows.length,
    validCount,
    invalidCount,
    errors: [
      ...globalErrors,
      ...(invalidCount > 0
        ? [`${invalidCount} out of ${parsedRows.length} blocks have validation errors.`]
        : []),
    ],
  };
}

/**
 * Generates standard UTF-8 BOM CSV template with sample questions (including diagram/image example).
 */
export function generateSampleCsvContent(): string {
  const headers = [
    'question_text',
    'question_bengali_text',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_option',
    'explanation',
    'marks',
    'image_url',
  ];

  const rows = [
    [
      'Who was the first President of Independent India?',
      'স্বাধীন ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?',
      'Dr. Rajendra Prasad',
      'Jawaharlal Nehru',
      'Dr. S. Radhakrishnan',
      'Dr. B. R. Ambedkar',
      'A',
      '• ড. রাজেন্দ্র প্রসাদ ছিলেন স্বাধীন ভারতের প্রথম রাষ্ট্রপতি (১৯৫০-১৯৬২)।\n• তিনি ভারতের একমাত্র রাষ্ট্রপতি যিনি টানা দুইবার এই সম্মানজনক পদে আসীন ছিলেন।\n• ১৯৬২ সালে দেশসেবার স্বীকৃতি হিসেবে তাঁকে ভারতরত্ন প্রদান করা হয়।',
      '1.0',
      '',
    ],
    [
      'In the given Venn diagram, which region represents students who play both football and cricket?',
      'প্রদত্ত ভেন চিত্রে কোন অঞ্চলটি ফুটবল ও ক্রিকেট উভয় খেলা শিক্ষার্থীদের নির্দেশ করে?',
      'Region A',
      'Region B',
      'Region C',
      'Region D',
      'B',
      '• Region B lies strictly in the mutual intersection.\n• Represents aspirants engaged in both sports simultaneously.',
      '1.0',
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600',
    ],
    [
      'What is the capital of West Bengal?',
      'পশ্চিমবঙ্গের রাজধানী কী?',
      'Kolkata',
      'Siliguri',
      'Asansol',
      'Durgapur',
      'A',
      '• Kolkata is the principal educational and cultural center of West Bengal.\n• Situated on the eastern bank of the Hooghly River.',
      '1.0',
      '',
    ],
  ];

  const csvLines = [headers.join(',')];
  for (const row of rows) {
    const escaped = row.map((field) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    });
    csvLines.push(escaped.join(','));
  }

  // Prepend UTF-8 BOM so Microsoft Excel correctly renders Bengali unicode characters
  return '\uFEFF' + csvLines.join('\r\n');
}

/**
 * Triggers client-side download of the sample CSV template.
 */
export function downloadSampleCsvFile(fileName = 'practicekoro_question_template.csv'): void {
  const content = generateSampleCsvContent();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { UploadMode } from './questionBankUtils';
import { downloadSampleTxt } from '@/utils/txtQuestionParser';

// Column index of each field in the By Exam / By Subject CSV templates.
export const modeIdx = (mode: UploadMode, field: string) => {
  if (mode === 'exam') {
    switch (field) {
      case 'question':
        return 4;
      case 'optA':
        return 5;
      case 'optB':
        return 6;
      case 'optC':
        return 7;
      case 'optD':
        return 8;
      case 'correct':
        return 9;
      case 'marks':
        return 10;
      case 'negativeMarks':
        return 11;
      case 'tags':
        return 15;
      case 'explanation':
        return 12;
      case 'shortNotes':
        return 13;
      default:
        return 0;
    }
  } else {
    switch (field) {
      case 'question':
        return 3;
      case 'optA':
        return 4;
      case 'optB':
        return 5;
      case 'optC':
        return 6;
      case 'optD':
        return 7;
      case 'correct':
        return 8;
      case 'marks':
        return 9;
      case 'negativeMarks':
        return 10;
      case 'tags':
        return 14;
      case 'explanation':
        return 11;
      case 'shortNotes':
        return 12;
      default:
        return 0;
    }
  }
};

// Download Templates (.CSV) with UTF-8 BOM for Bengali support
export const downloadQuestionTemplate = (
  mode: UploadMode,
  format: 'csv' | 'txt',
  showToast: (msg: string) => void
) => {
  if (format === 'txt') {
    downloadSampleTxt(`practicekoro_questions_${mode}_template.txt`);
    showToast(`Downloaded ${mode === 'exam' ? 'Exam' : 'Subject'} TXT Template.`);
    return;
  }

  let headers: string[] = [];
  let sampleRow: string[] = [];

  if (mode === 'exam') {
    headers = [
      'exam',
      'question_type',
      'year',
      'paper',
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_answer',
      'marks',
      'negative_marks',
      'explanation',
      'short_notes',
      'source',
      'tags',
    ];
    sampleRow = [
      'WBP Constable',
      'Official PYQ',
      '2025',
      'Set A',
      'ভারতের প্রথম গভর্নর-জেনারেল কে ছিলেন?',
      'Warren Hastings',
      'Lord Cornwallis',
      'Lord Wellesley',
      'Lord Canning',
      'A',
      '1.0',
      '0.25',
      '১৭৭৩ সালের রেগুলেটিং অ্যাক্টের মাধ্যমে ওয়ারেন হেস্টিংস গভর্নর-জেনারেল হন।',
      '• ১৭৭৩: রেগুলেটিং অ্যাক্ট\n• ওয়ারেন হেস্টিংস প্রথম গভর্নর-জেনারেল',
      'Official PYQ',
      'WBP;Modern India',
    ];
  } else {
    headers = [
      'subject',
      'topic',
      'subtopic',
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_answer',
      'marks',
      'negative_marks',
      'explanation',
      'short_notes',
      'source',
      'tags',
    ];
    sampleRow = [
      'General Science',
      'Chemical Reactions',
      'Water Chemistry',
      'H₂O এর রাসায়নিক নাম কি?',
      'Hydrogen Peroxide',
      'Dihydrogen Monoxide',
      'Hydrogen Dioxide',
      'Hydroxide Ion',
      'B',
      '1.0',
      '0.25',
      'জলের রাসায়নিক নাম হলো ডাইহাইড্রোজেন মনোক্সাইড।',
      '• সংকেত: H₂O\n• মোলার ভর: ১৮ গ্রাম',
      'Original',
      'Science;Chemistry',
    ];
  }

  const csvContent =
    '\uFEFF' +
    headers.join(',') +
    '\n' +
    sampleRow.map((v) => `"${v.replace(/"/g, '""')}"`).join(',');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `practicekoro_questions_${mode}_template.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Downloaded ${mode === 'exam' ? 'Exam' : 'Subject'} CSV Template.`);
};

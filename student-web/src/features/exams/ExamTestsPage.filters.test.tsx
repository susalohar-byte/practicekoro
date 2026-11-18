import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { MockTest, Subject, Topic } from '@/types/models';
import { testStage } from './testFilters';

const mk = (over: Partial<MockTest>): MockTest => ({
  id: 'x',
  examId: 'wbcs',
  subjectId: null,
  chapterId: null,
  testSeriesId: null,
  title: 'Test',
  description: null,
  totalQuestions: 50,
  durationMinutes: 60,
  totalMarks: 50,
  negativeMarking: 0.25,
  passingMarks: null,
  isPro: false,
  category: 'Topic Test',
  year: null,
  paperName: null,
  shift: null,
  examDate: null,
  iconUrl: null,
  orderIndex: 0,
  createdAt: null,
  isLiveOnly: false,
  ...over,
});

const subjects: Subject[] = [
  { id: 'history', examId: null, nameEnglish: 'History', nameBengali: 'ইতিহাস', slug: 'history', iconName: null, chapterCount: 2, totalTests: 0, orderIndex: 1 },
  { id: 'geo', examId: null, nameEnglish: 'Geography', nameBengali: 'ভূগোল', slug: 'geo', iconName: null, chapterCount: 1, totalTests: 0, orderIndex: 2 },
];
const topics: Topic[] = [
  { id: 'mughal', subjectId: 'history', title: 'Mughal Empire', titleBengali: null, slug: 'mughal', totalTests: 1 },
  { id: 'freedom', subjectId: 'history', title: 'Freedom Struggle', titleBengali: null, slug: 'freedom', totalTests: 1 },
  { id: 'rivers', subjectId: 'geo', title: 'Rivers', titleBengali: null, slug: 'rivers', totalTests: 1 },
];
const tests: MockTest[] = [
  mk({ id: 't1', title: 'Mughal Test 1', chapterId: 'mughal' }),
  mk({ id: 't2', title: 'Freedom Test 1', subjectId: 'history', chapterId: 'freedom' }),
  mk({ id: 't3', title: 'Rivers Test 1', chapterId: 'rivers' }),
  mk({ id: 'f1', title: 'WBCS Prelims Mock 1', category: 'Full Test' }),
  mk({ id: 'f2', title: 'WBCS Mains Mock 1', category: 'Full Test' }),
  mk({ id: 'p1', title: 'WBCS 2023 Prelims Paper', category: 'PYQ' }),
];

const ok = (data: unknown) => ({ isLoading: false, isError: false, data, error: null, refetch: vi.fn() });
vi.mock('@/hooks/queries', () => ({
  useExam: () => ok({ id: 'wbcs', title: 'WBCS', description: null, subtitle: null, category: null, iconUrl: null }),
  useExamTests: () => ok(tests),
  useIsPro: () => true,
  useSubjects: () => ok(subjects),
  useTopics: () => ok(topics),
}));
vi.mock('./TestCard', () => ({ TestCard: ({ test }: { test: MockTest }) => <p data-testid="card">{test.title}</p> }));
vi.mock('@/components/domain/ProDialog', () => ({ ProDialog: () => null }));

import ExamTestsPage from './ExamTestsPage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/exams/wbcs']}>
      <Routes>
        <Route path="/exams/:examId" element={<ExamTestsPage />} />
      </Routes>
    </MemoryRouter>
  );
const cards = () => screen.queryAllByTestId('card').map((c) => c.textContent);
const tab = (name: RegExp) => fireEvent.click(screen.getByRole('tab', { name }));
const chip = (group: string, name: RegExp) =>
  fireEvent.click(within(screen.getByRole('group', { name: `Filter by ${group}` })).getByRole('button', { name }));

afterEach(cleanup);

describe('ExamTestsPage filters', () => {
  it('filters Topic Tests by subject, then topic, and resets on tab change', () => {
    renderPage();
    tab(/^Topic Test/);
    expect(cards()).toEqual(['Mughal Test 1', 'Freedom Test 1', 'Rivers Test 1']);
    expect(screen.queryByRole('group', { name: 'Filter by topic' })).toBeNull();

    chip('subject', /^History/);
    expect(cards()).toEqual(['Mughal Test 1', 'Freedom Test 1']);

    chip('topic', /^Freedom Struggle/);
    expect(cards()).toEqual(['Freedom Test 1']);

    tab(/^Full Test/);
    tab(/^Topic Test/);
    expect(cards()).toHaveLength(3);
  });

  it('offers Prelims / Mains only where both papers exist', () => {
    renderPage();
    tab(/^Full Test/);
    chip('paper', /^Mains/);
    expect(cards()).toEqual(['WBCS Mains Mock 1']);

    tab(/^PYQ/); // PYQ has only a Prelims paper
    expect(screen.queryByRole('group', { name: 'Filter by paper' })).toBeNull();
    expect(cards()).toEqual(['WBCS 2023 Prelims Paper']);

    tab(/^All Tests/);
    expect(screen.queryByRole('group')).toBeNull();
  });
});

describe('testStage', () => {
  it('matches the mobile app rule', () => {
    expect(testStage({ title: 'WBP Constable 2024 Prelims Official Paper', paperName: null })).toBe('Prelims');
    expect(testStage({ title: 'WBCS Preliminary Mock', paperName: null })).toBe('Prelims');
    expect(testStage({ title: 'Mock 1', paperName: 'Mains' })).toBe('Mains');
    expect(testStage({ title: 'WBP মেইন পরীক্ষা', paperName: null })).toBe('Mains');
    expect(testStage({ title: 'Domain knowledge test', paperName: null })).toBeNull();
    expect(testStage({ title: 'Prelims + Mains combined', paperName: null })).toBeNull();
  });
});

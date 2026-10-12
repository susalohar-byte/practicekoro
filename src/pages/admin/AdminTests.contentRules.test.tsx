import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminTests } from './AdminTests';
import { api } from '@/services/api';
import type { MockTest } from '@/types';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));
vi.mock('@/lib/supabase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/supabase')>()),
  isSupabaseConfigured: true,
}));

const base = {
  slug: 's',
  durationMinutes: 30,
  totalQuestions: 0,
  totalMarks: 25,
  passingMarks: 10,
  negativeMarking: 0,
  isPremium: false,
  orderIndex: 0,
  isActive: true,
  status: 'draft' as const,
};
const tests: MockTest[] = [
  { ...base, id: 'a', title: 'Full A', testType: 'full_mock', examTitle: 'WBP' },
  { ...base, id: 'b', title: 'Full B', testType: 'full_mock', examTitle: 'WBP' },
  { ...base, id: 'c', title: 'Topic C', testType: 'topic', subjectName: 'Science' },
  { ...base, id: 'd', title: 'PYQ D', testType: 'pyq', examTitle: 'WBP', isPremium: true },
  { ...base, id: 'e', title: 'Legacy E', testType: 'chapter_mock' },
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api, 'getAllAdminTests').mockResolvedValue(tests);
  vi.spyOn(api, 'getAllAdminChapters').mockResolvedValue([]);
});

describe('AdminTests content rules', () => {
  it('loads exams and subjects through the admin reads and shows real tab counts', async () => {
    const adminExams = vi.spyOn(api, 'getAllAdminExams').mockResolvedValue([]);
    const adminSubjects = vi.spyOn(api, 'getAllAdminSubjects').mockResolvedValue([]);
    const studentExams = vi.spyOn(api, 'getExams');
    const studentSubjects = vi.spyOn(api, 'getSubjects');
    render(
      <MemoryRouter>
        <AdminTests />
      </MemoryRouter>
    );
    expect(await screen.findByText('All Tests (5)')).toBeInTheDocument();
    expect(screen.getByText('Full Mock (2)')).toBeInTheDocument();
    expect(screen.getByText('Topic Test (1)')).toBeInTheDocument();
    expect(screen.getByText('Official PYQ (1)')).toBeInTheDocument();
    expect(screen.queryByText(/\(248\)|\(85\)/)).toBeNull();
    expect(adminExams).toHaveBeenCalled();
    expect(adminSubjects).toHaveBeenCalled();
    expect(studentExams).not.toHaveBeenCalled();
    expect(studentSubjects).not.toHaveBeenCalled();
    // Legacy rows are labelled as such, never as Official PYQ.
    expect(screen.getAllByText('Topic Test (legacy)').length).toBeGreaterThan(0);
    // No fabricated trend badges.
    expect(screen.queryByText(/↑ \d+%/)).toBeNull();
  });

  it('labels access as Free / Paid in the edit drawer', async () => {
    vi.spyOn(api, 'getAllAdminExams').mockResolvedValue([]);
    vi.spyOn(api, 'getAllAdminSubjects').mockResolvedValue([]);
    render(
      <MemoryRouter>
        <AdminTests />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByText('PYQ D'));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    const select = screen.getByDisplayValue('Paid') as HTMLSelectElement;
    expect(within(select).getByRole('option', { name: 'Free' })).toBeInTheDocument();
    expect(screen.queryByText(/PRO Members/i)).toBeNull();
  });
});

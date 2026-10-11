import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDistrictRankings, rankDistricts } from './AdminDistrictRankings';

const m = vi.hoisted(() => ({
  rankings: vi.fn(),
  exams: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: { getAllAdminExams: m.exams },
}));
vi.mock('@/services/domains/admin.analytics', () => ({
  getAdminDistrictRankings: m.rankings,
}));

const row = (district: string, avg: number | null, attempts = 2) => ({
  district,
  studentCount: 1,
  attemptsCount: attempts,
  avgPercentage: avg,
  topStudentName: avg === null ? null : `${district} Topper`,
  topStudentScore: avg,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminDistrictRankings />
    </MemoryRouter>
  );

describe('AdminDistrictRankings - real district aggregates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.exams.mockResolvedValue([{ id: 'exam-1', title: 'WBP Constable' }]);
  });

  it('ranks only real rows and keeps the Not specified bucket unranked', () => {
    const ranked = rankDistricts([
      row('Not specified', 99),
      row('Howrah', 40),
      row('Kolkata', 80),
      row('Nadia', null),
    ]);
    expect(ranked.map((r) => [r.district, r.rank])).toEqual([
      ['Kolkata', 1],
      ['Howrah', 2],
      ['Not specified', null],
      ['Nadia', null],
    ]);
  });

  it('renders server rows with no invented districts and paginates them', async () => {
    m.rankings.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => row(`District ${i + 1}`, 90 - i))
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Showing 1–10 of 12 districts')).toBeInTheDocument()
    );
    const table = screen.getAllByRole('table')[0];
    expect(within(table).getByText('District 1')).toBeInTheDocument();
    expect(within(table).queryByText('Purulia')).not.toBeInTheDocument();
    expect(within(table).queryByText('District 11')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(screen.getByText('Showing 11–12 of 12 districts')).toBeInTheDocument();
    expect(within(table).getByText('District 11')).toBeInTheDocument();
  });

  it('shows an empty state when there are no completed attempts', async () => {
    m.rankings.mockResolvedValue([]);
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByText('No completed student attempts found for these filters.')
      ).toBeInTheDocument()
    );
  });

  it('shows an error state with retry instead of fake rows', async () => {
    m.rankings.mockRejectedValueOnce(new Error('Insufficient active staff permissions'));
    m.rankings.mockResolvedValue([row('Kolkata', 70)]);
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Insufficient'));
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    await waitFor(() =>
      expect(within(screen.getAllByRole('table')[0]).getByText('Kolkata')).toBeInTheDocument()
    );
  });

  it('passes the exam and time period filters to the server aggregation', async () => {
    m.rankings.mockResolvedValue([row('Kolkata', 70)]);
    renderPage();
    await waitFor(() => expect(screen.getByLabelText('Select Exam')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('option', { name: 'WBP Constable' })).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Select Exam'), { target: { value: 'exam-1' } });
    await waitFor(() =>
      expect(m.rankings).toHaveBeenLastCalledWith(
        expect.objectContaining({ examId: 'exam-1', fromIso: expect.any(String) })
      )
    );
    await waitFor(() => expect(screen.getByLabelText('Time Period')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Time Period'), { target: { value: 'All Time' } });
    await waitFor(() =>
      expect(m.rankings).toHaveBeenLastCalledWith({
        examId: 'exam-1',
        fromIso: null,
        toIso: null,
      })
    );
  });

  it('filters by district', async () => {
    m.rankings.mockResolvedValue([row('Kolkata', 70), row('Howrah', 60)]);
    renderPage();
    await waitFor(() => expect(screen.getByLabelText('Select District')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('option', { name: 'Kolkata' })).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Select District'), { target: { value: 'Kolkata' } });
    const table = screen.getAllByRole('table')[0];
    expect(screen.getByText('Showing 1–1 of 1 districts')).toBeInTheDocument();
    expect(within(table).queryByText('Howrah')).not.toBeInTheDocument();
  });
});

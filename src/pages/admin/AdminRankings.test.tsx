import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminRankings } from './AdminRankings';
import { api } from '@/services/api';

vi.mock('@/services/api', () => ({
  api: {
    getAllAdminExams: vi.fn().mockResolvedValue([]),
    getAllAdminSubjects: vi.fn().mockResolvedValue([]),
    getAdminRankings: vi.fn(),
  },
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminRankings />
    </MemoryRouter>
  );

describe('AdminRankings real data states', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows an empty state, not seeded sample students, when nothing matches', async () => {
    vi.mocked(api.getAdminRankings).mockResolvedValue([]);
    renderPage();
    expect(
      await screen.findByText('No completed attempts match these filters.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Rohit Kumar')).not.toBeInTheDocument();
  });

  it('shows an error state with retry when rankings fail to load', async () => {
    vi.mocked(api.getAdminRankings).mockRejectedValue(new Error('permission denied'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('permission denied');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});

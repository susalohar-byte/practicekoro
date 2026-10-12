import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const user = { id: 'u' };
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user }) }));
vi.mock('@/context/MaintenanceContext', () => ({
  useContentLanguage: () => ({ isBilingualEnabled: false }),
}));
vi.mock('@/hooks/usePracticeRevision', () => ({
  usePracticeRevision: () => ({
    data: { mistakes: [], bookmarks: [] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useRemoveBookmark: () => ({ mutateAsync: vi.fn() }),
  useResolveMistake: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/pages/student/TopicTests', async () => {
  const { useLocation } = await import('react-router-dom');
  return {
    TopicTests: () => <div data-testid="topic-tests">{useLocation().search}</div>,
  };
});
vi.mock('@/services/api', () => ({
  api: {
    getSubjects: vi.fn(async () => [{ id: 'sub-1', name: 'Arithmetic' }]),
    getAllChapters: vi.fn(async () => [{ id: 'ch-1', subjectId: 'sub-1', name: 'Percentage' }]),
    getTests: vi.fn(async () => []),
    getUserAttempts: vi.fn(async () => []),
  },
}));

import { api } from '@/services/api';
import { Practice } from './Practice';

describe('Practice topic-based discovery', () => {
  it('does not fetch the unpaginated test list and opens topic tests for a subject', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/practice']}>
          <Practice />
        </MemoryRouter>
      </QueryClientProvider>
    );
    fireEvent.click(await screen.findByRole('button', { name: /Arithmetic\s*1 Chapters/ }));
    const topicTests = await screen.findByTestId('topic-tests');
    expect(topicTests.textContent).toContain('tab=topics');
    expect(topicTests.textContent).toContain('subjectId=sub-1');
    expect(api.getTests).not.toHaveBeenCalled();
  });
});

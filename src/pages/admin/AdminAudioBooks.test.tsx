import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminAudioBooks } from './AdminAudioBooks';
import { audioBookAdminApi } from '@/services/domains/audiobooks';

vi.mock('@/components/audiobooks/YouTubeAudioPlayer', () => ({
  YouTubeAudioPlayer: ({ videoId }: { videoId: string }) => <div data-testid="yt">{videoId}</div>,
}));

vi.mock('@/services/domains/audiobooks', () => ({
  AUDIOBOOK_THUMBNAIL_MAX_BYTES: 2 * 1024 * 1024,
  audioBookAdminApi: {
    getTaxonomy: vi.fn(),
    getUsage: vi.fn(),
    getStats: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    delete: vi.fn(),
    uploadThumbnail: vi.fn(),
  },
}));

const api = vi.mocked(audioBookAdminApi);
const taxonomy = {
  categories: [{ id: 'c1', name: 'History', description: null, displayOrder: 0 }],
  subjects: [{ id: 's1', categoryId: 'c1', name: 'Ancient Indian History', displayOrder: 0 }],
  topics: [{ id: 't1', subjectId: 's1', name: 'Mauryan Empire', displayOrder: 0 }],
};
const book = {
  id: 'b1',
  title: 'Emperor Ashoka',
  description: null,
  narrator: 'PracticeKoro',
  categoryId: 'c1',
  subjectId: 's1',
  topicId: 't1',
  thumbnailUrl: null,
  youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  youtubeVideoId: 'dQw4w9WgXcQ',
  durationSeconds: 3504,
  status: 'draft' as const,
  publishedAt: null,
  createdAt: '2026-09-12T10:00:00Z',
  updatedAt: '2026-09-12T10:00:00Z',
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminAudioBooks />
    </MemoryRouter>
  );

describe('AdminAudioBooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTaxonomy.mockResolvedValue(taxonomy);
    api.getUsage.mockResolvedValue({
      byCategory: { c1: 1 },
      bySubject: { s1: 1 },
      byTopic: { t1: 1 },
    });
    api.getStats.mockResolvedValue({
      total: 1,
      published: 0,
      drafts: 1,
      totalDurationSeconds: 3504,
      timedCount: 1,
      totalListens: 0,
    });
    api.list.mockResolvedValue({ items: [book], total: 1 });
    api.setStatus.mockResolvedValue(undefined);
  });

  it('renders database stats and rows with taxonomy names', async () => {
    renderPage();
    expect(await screen.findByText('Emperor Ashoka')).toBeInTheDocument();
    expect(screen.getByText('58m')).toBeInTheDocument();
    expect(screen.getByText('Mauryan Empire')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Ancient Indian History' })).toBeInTheDocument();
    expect(screen.getByText('58:24')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 to 1 of 1 audio book')).toBeInTheDocument();
  });

  it('publishes from the row menu', async () => {
    renderPage();
    fireEvent.click(await screen.findByLabelText('More actions for Emperor Ashoka'));
    fireEvent.click(screen.getByRole('menuitem', { name: /publish/i }));
    await waitFor(() => expect(api.setStatus).toHaveBeenCalledWith(['b1'], 'published'));
  });

  it('passes filters to the query and shows a no-match state', async () => {
    renderPage();
    await screen.findByText('Emperor Ashoka');
    api.list.mockResolvedValue({ items: [], total: 0 });
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'published' } });
    expect(await screen.findByText('No audio books match these filters')).toBeInTheDocument();
    expect(api.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'published', page: 1 }),
      taxonomy
    );
  });

  it('rejects a non-YouTube link in the form without saving', async () => {
    renderPage();
    await screen.findByText('Emperor Ashoka');
    fireEvent.click(screen.getByRole('button', { name: /add audio book/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/^Title/), { target: { value: 'New book' } });
    fireEvent.change(within(dialog).getByLabelText(/^Category/), { target: { value: 'c1' } });
    fireEvent.change(within(dialog).getByLabelText(/^Subject/), { target: { value: 's1' } });
    fireEvent.change(within(dialog).getByLabelText(/^YouTube Video URL/), {
      target: { value: 'https://vimeo.com/123' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /save audio book/i }));
    expect(await within(dialog).findByText(/valid YouTube video link/)).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('saves a valid YouTube book with normalized id and parsed duration', async () => {
    api.create.mockResolvedValue({ ...book, id: 'b2', title: 'New book' });
    renderPage();
    await screen.findByText('Emperor Ashoka');
    fireEvent.click(screen.getByRole('button', { name: /add audio book/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/^Title/), { target: { value: 'New book' } });
    fireEvent.change(within(dialog).getByLabelText(/^Category/), { target: { value: 'c1' } });
    fireEvent.change(within(dialog).getByLabelText(/^Subject/), { target: { value: 's1' } });
    fireEvent.change(within(dialog).getByLabelText(/^YouTube Video URL/), {
      target: { value: 'youtu.be/dQw4w9WgXcQ' },
    });
    fireEvent.change(within(dialog).getByLabelText('Duration'), { target: { value: '45:20' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /save audio book/i }));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith(
        expect.objectContaining({
          youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
          youtubeVideoId: 'dQw4w9WgXcQ',
          durationSeconds: 2720,
          status: 'draft',
          thumbnailUrl: null,
        })
      )
    );
  });
});

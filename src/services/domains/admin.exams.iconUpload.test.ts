import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  uploadValidatedImage: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { storage: { from: mocks.storageFrom } },
}));
vi.mock('@/lib/rasterUploads', async (orig) => ({
  ...(await orig<typeof import('@/lib/rasterUploads')>()),
  uploadValidatedImage: mocks.uploadValidatedImage,
}));

import { uploadExamIcon } from './admin.exams';

beforeEach(() => vi.clearAllMocks());

describe('uploadExamIcon', () => {
  it('uploads through the validated Storage function, never a direct bucket write', async () => {
    mocks.uploadValidatedImage.mockResolvedValue(
      'https://x.supabase.co/storage/v1/object/public/banners/raster.png'
    );
    const file = new File([new Uint8Array([1, 2, 3])], 'wbpsc.png', { type: 'image/png' });

    await expect(uploadExamIcon(file)).resolves.toContain('/storage/v1/object/public/banners/');
    expect(mocks.uploadValidatedImage).toHaveBeenCalledWith(file, 'banners');
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it('rejects files that are not images before uploading', async () => {
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
    await expect(uploadExamIcon(file)).rejects.toThrow();
    expect(mocks.uploadValidatedImage).not.toHaveBeenCalled();
  });
});

import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';
import { invalidateApiCache } from '@/services/apiCache';

// The API cache is module-level state: reset it so every test reads its own backend fixtures.
beforeEach(() => {
  invalidateApiCache();
});

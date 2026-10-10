import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isChunkLoadError, clearChunkReloadGuard, CHUNK_RELOAD_KEY } from './lazyWithRetry';

describe('lazyWithRetry utility', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('isChunkLoadError', () => {
    it('detects Vite dynamic module fetch failure', () => {
      const err = new Error(
        'Failed to fetch dynamically imported module: https://practicekoro.online/assets/AdminAuditLogs-kvKsmdbx.js'
      );
      expect(isChunkLoadError(err)).toBe(true);
    });

    it('detects generic module script loading failure', () => {
      expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
      expect(isChunkLoadError('error loading dynamically imported module')).toBe(true);
      expect(isChunkLoadError('Failed to load module script')).toBe(true);
    });

    it('detects chunk index failure', () => {
      expect(isChunkLoadError(new Error('Loading chunk 42 failed.'))).toBe(true);
      expect(isChunkLoadError('Loading CSS chunk 5 failed.')).toBe(true);
    });

    it('returns false for general exceptions', () => {
      expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
      expect(isChunkLoadError(new Error('Network request timeout'))).toBe(false);
      expect(isChunkLoadError(null)).toBe(false);
      expect(isChunkLoadError(undefined)).toBe(false);
      expect(isChunkLoadError(123)).toBe(false);
    });
  });

  describe('clearChunkReloadGuard', () => {
    it('clears reload flag in sessionStorage', () => {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, 'true');
      expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBe('true');
      clearChunkReloadGuard();
      expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBeNull();
    });
  });
});

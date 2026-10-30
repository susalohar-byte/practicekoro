import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { STORAGE_KEY, PARTICIPANTS_STORAGE_KEY } from './admin.liveTests.store';

/**
 * Subscribe to real-time Live Test updates across tabs and Supabase channels
 */
export function subscribeToLiveTestUpdates(callback: () => void): () => void {
  const handleLocal = () => callback();
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === PARTICIPANTS_STORAGE_KEY) {
      callback();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pk_live_tests_updated', handleLocal);
    window.addEventListener('storage', handleStorage);
  }

  let broadcastChannel: RealtimeChannel | null = null;

  if (isSupabaseConfigured) {
    try {
      broadcastChannel = supabase
        .channel('live_tests_sync_channel')
        .on('broadcast', { event: 'live_tests_updated' }, () => {
          callback();
        })
        .subscribe();
    } catch {
      // Ignore realtime subscription errors
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pk_live_tests_updated', handleLocal);
      window.removeEventListener('storage', handleStorage);
    }
    if (broadcastChannel && isSupabaseConfigured) {
      try {
        supabase.removeChannel(broadcastChannel);
      } catch {
        // ignore
      }
    }
  };
}

import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  STORAGE_KEY,
  PARTICIPANTS_STORAGE_KEY,
  APP_SETTINGS_LIVE_TESTS_ID,
} from './admin.liveTests.store';

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

  let broadcastChannel: any = null;
  let postgresChannel: any = null;

  if (isSupabaseConfigured) {
    try {
      broadcastChannel = supabase
        .channel('live_tests_sync_channel')
        .on('broadcast', { event: 'live_tests_updated' }, () => {
          callback();
        })
        .subscribe();

      postgresChannel = supabase
        .channel('realtime:live_tests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'app_settings',
            filter: `id=eq.${APP_SETTINGS_LIVE_TESTS_ID}`,
          },
          () => {
            callback();
          }
        )
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
    if (postgresChannel && isSupabaseConfigured) {
      try {
        supabase.removeChannel(postgresChannel);
      } catch {
        // ignore
      }
    }
  };
}

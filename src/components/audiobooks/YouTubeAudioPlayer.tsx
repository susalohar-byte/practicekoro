import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  describeYouTubeError,
  formatDuration,
  loadYouTubeIframeApi,
  type YTPlayer,
} from '@/lib/youtube';

type PlayerStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';

interface YouTubeAudioPlayerProps {
  videoId: string;
  title: string;
  /** Fires whenever YouTube reports a positive duration (seconds). */
  onDuration?: (seconds: number) => void;
  /** Fires once per video, the first time playback actually starts. */
  onFirstPlay?: () => void;
  /** Fires when YouTube refuses the video (private, removed, embedding disabled...). */
  onUnavailable?: (message: string) => void;
  autoPlay?: boolean;
  className?: string;
}

/**
 * Official YouTube IFrame player with compact audio-style controls. The video
 * frame stays visible (YouTube requires it); nothing is downloaded or extracted.
 */
export const YouTubeAudioPlayer: React.FC<YouTubeAudioPlayerProps> = ({
  videoId,
  title,
  onDuration,
  onFirstPlay,
  onUnavailable,
  autoPlay = false,
  className,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const callbacks = useRef({ onDuration, onFirstPlay, onUnavailable });
  callbacks.current = { onDuration, onFirstPlay, onUnavailable };
  const [status, setStatus] = useState<PlayerStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let started = false;
    setStatus('loading');
    setError(null);
    setDuration(0);
    setCurrent(0);

    const reportDuration = (player: YTPlayer) => {
      const d = player.getDuration();
      if (d > 0) {
        setDuration(d);
        callbacks.current.onDuration?.(Math.round(d));
      }
    };
    const fail = (message: string) => {
      setStatus('error');
      setError(message);
      callbacks.current.onUnavailable?.(message);
    };

    // The API replaces this node with the iframe, so give it a disposable child.
    const mount = document.createElement('div');
    host.replaceChildren(mount);
    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(mount, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            playsinline: 1,
            rel: 0,
            autoplay: autoPlay ? 1 : 0,
            origin: window.location.origin,
          },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              setStatus('ready');
              reportDuration(target);
            },
            onStateChange: ({ data, target }) => {
              if (cancelled) return;
              if (data === YT.PlayerState.PLAYING) {
                setStatus('playing');
                reportDuration(target);
                if (!started) {
                  started = true;
                  callbacks.current.onFirstPlay?.();
                }
              } else if (data === YT.PlayerState.PAUSED) setStatus('paused');
              else if (data === YT.PlayerState.BUFFERING) setStatus('buffering');
              else if (data === YT.PlayerState.ENDED) setStatus('ended');
            },
            onError: ({ data }) => {
              if (!cancelled) fail(describeYouTubeError(data));
            },
          },
        });
      })
      .catch((err: Error) => {
        if (!cancelled) fail(err.message);
      });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // player may already be torn down
      }
      playerRef.current = null;
      host.replaceChildren();
    };
  }, [videoId, autoPlay, attempt]);

  // Progress polling only while playing.
  useEffect(() => {
    if (status !== 'playing') return;
    const timer = window.setInterval(() => {
      const t = playerRef.current?.getCurrentTime();
      if (typeof t === 'number') setCurrent(t);
    }, 500);
    return () => window.clearInterval(timer);
  }, [status]);

  const isPlaying = status === 'playing' || status === 'buffering';
  const canControl = status !== 'loading' && status !== 'error';

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) p.pauseVideo();
    else p.playVideo();
  }, [isPlaying]);

  const seekBy = (delta: number) => {
    const p = playerRef.current;
    if (!p) return;
    const next = Math.max(0, Math.min(duration || Infinity, p.getCurrentTime() + delta));
    p.seekTo(next, true);
    setCurrent(next);
  };

  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    playerRef.current?.seekTo(next, true);
    setCurrent(next);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
        <div ref={hostRef} className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full" />
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            <span className="text-xs font-medium">Loading player…</span>
          </div>
        )}
        {status === 'error' && (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 px-6 text-center text-slate-200"
          >
            <AlertTriangle className="h-6 w-6 text-amber-400" aria-hidden="true" />
            <p className="text-sm font-semibold">Playback unavailable</p>
            <p className="max-w-xs text-xs text-slate-400">{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-1 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => seekBy(-10)}
          disabled={!canControl}
          aria-label="Back 10 seconds"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={toggle}
          disabled={!canControl}
          aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/25 transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'buffering' ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={() => seekBy(10)}
          disabled={!canControl}
          aria-label="Forward 10 seconds"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {formatDuration(current) || '0:00'}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.round(duration))}
          step={1}
          value={Math.min(current, duration || 0)}
          onChange={onScrub}
          disabled={!canControl || duration <= 0}
          aria-label="Seek"
          className="h-1.5 min-w-0 flex-1 cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
        />
        <span className="w-12 shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {formatDuration(duration) || '--:--'}
        </span>
      </div>
    </div>
  );
};

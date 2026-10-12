/**
 * YouTube helpers for the Audio Book module. Playback always goes through the
 * official IFrame Player API; nothing here downloads or extracts media.
 */

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
]);
const PATH_PREFIXES = ['embed', 'shorts', 'live', 'v'];

export interface ParsedYouTubeUrl {
  /** The admin's link, trimmed and forced to https. */
  url: string;
  videoId: string;
}

/** Accepts watch, youtu.be, embed, shorts and live links; returns null for anything else. */
export function parseYouTubeUrl(input: string): ParsedYouTubeUrl | null {
  const raw = input.trim();
  if (!raw || raw.length > 500) return null;
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  if (!HOSTS.has(host)) return null;
  parsed.protocol = 'https:';

  const segments = parsed.pathname.split('/').filter(Boolean);
  let videoId: string | null = null;
  if (host === 'youtu.be') {
    videoId = segments[0] ?? null;
  } else if (segments[0] === 'watch') {
    videoId = parsed.searchParams.get('v');
  } else if (PATH_PREFIXES.includes(segments[0] ?? '')) {
    videoId = segments[1] ?? null;
  }
  if (!videoId || !VIDEO_ID.test(videoId)) return null;
  return { url: parsed.toString(), videoId };
}

export function youTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** 2720 -> "45:20", 3725 -> "1:02:05". */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (!totalSeconds || totalSeconds <= 0 || !Number.isFinite(totalSeconds)) return '';
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** 9840 -> "2h 44m", 125 -> "2m". Used for aggregate totals. */
export function formatTotalDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Parses "mm:ss" or "hh:mm:ss". Returns null for empty input, NaN for invalid input.
 */
export function parseDurationInput(input: string): number | null {
  const value = input.trim();
  if (!value) return null;
  if (!/^\d{1,3}(:\d{1,2}){1,2}$/.test(value)) return Number.NaN;
  const parts = value.split(':').map(Number);
  const [h, m, s] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  if (s > 59 || (parts.length === 3 && m > 59)) return Number.NaN;
  const total = h * 3600 + m * 60 + s;
  return total > 0 && total <= 86400 ? total : Number.NaN;
}

/* -------------------------------------------------------------------------- */
/* IFrame Player API                                                          */
/* -------------------------------------------------------------------------- */

export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getDuration(): number;
  getCurrentTime(): number;
  destroy(): void;
}

interface YTPlayerOptions {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
    onError?: (event: { data: number }) => void;
  };
}

export interface YTNamespace {
  Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
  PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

export function loadYouTubeIframeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const fail = () => {
      apiPromise = null;
      reject(new Error('The YouTube player could not be loaded. Check your connection.'));
    };
    const timer = window.setTimeout(fail, 15000);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      window.clearTimeout(timer);
      if (window.YT?.Player) resolve(window.YT);
      else fail();
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timer);
      script.remove();
      fail();
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

/** Human message for IFrame API error codes. */
export function describeYouTubeError(code: number): string {
  switch (code) {
    case 2:
      return 'This YouTube link is not valid.';
    case 5:
      return 'This video cannot be played in this browser.';
    case 100:
      return 'This video is unavailable. It may be private or removed.';
    case 101:
    case 150:
      return 'The owner of this video does not allow it to be played outside YouTube.';
    case 153:
      return 'YouTube could not verify this site for playback. Try again later.';
    default:
      return 'This video could not be played right now.';
  }
}

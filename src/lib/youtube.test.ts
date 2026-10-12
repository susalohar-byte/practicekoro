import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatTotalDuration,
  parseDurationInput,
  parseYouTubeUrl,
} from './youtube';

describe('parseYouTubeUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'dQw4w9WgXcQ'],
    ['m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['http://www.youtube.com/live/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('accepts %s', (input, id) => {
    const parsed = parseYouTubeUrl(input);
    expect(parsed?.videoId).toBe(id);
    expect(parsed?.url.startsWith('https://')).toBe(true);
    expect(parsed?.url).toContain(id);
  });

  it.each([
    '',
    'not a url',
    'https://vimeo.com/123456',
    'https://evil.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/channel/UC123',
    'https://www.youtube.com/playlist?list=PL123',
  ])('rejects %s', (input) => {
    expect(parseYouTubeUrl(input)).toBeNull();
  });
});

describe('durations', () => {
  it('formats and parses round-trip', () => {
    expect(formatDuration(2720)).toBe('45:20');
    expect(formatDuration(3725)).toBe('1:02:05');
    expect(formatDuration(null)).toBe('');
    expect(parseDurationInput('45:20')).toBe(2720);
    expect(parseDurationInput('1:02:05')).toBe(3725);
    expect(parseDurationInput('')).toBeNull();
  });

  it('rejects invalid input instead of guessing', () => {
    expect(parseDurationInput('45')).toBeNaN();
    expect(parseDurationInput('10:75')).toBeNaN();
    expect(parseDurationInput('0:00')).toBeNaN();
    expect(parseDurationInput('abc')).toBeNaN();
  });

  it('formats totals', () => {
    expect(formatTotalDuration(66240)).toBe('18h 24m');
    expect(formatTotalDuration(120)).toBe('2m');
  });
});

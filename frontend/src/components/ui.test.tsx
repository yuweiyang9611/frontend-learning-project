import { describe, expect, it, vi } from 'vitest';
import { formatBytes, formatRelative } from './ui';

describe('UI formatters', () => {
  it('formats byte counts at useful scales', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1_536)).toBe('1.5 KB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('formats recent timestamps relatively', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-27T12:00:00Z').getTime());
    expect(formatRelative('2026-08-27T11:58:00Z')).toBe('2 minutes ago');
  });
});

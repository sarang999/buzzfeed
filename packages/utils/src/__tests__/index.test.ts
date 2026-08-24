import { formatRelativeTime, formatCount, buildShareUrl, countryCodeToFlag } from '../index';

describe('formatRelativeTime', () => {
  const freeze = (offsetMs: number) =>
    new Date(Date.now() - offsetMs).toISOString();

  it('returns "just now" for < 60s', () => {
    expect(formatRelativeTime(freeze(30_000))).toBe('just now');
  });

  it('returns minutes for 1–59 minutes ago', () => {
    expect(formatRelativeTime(freeze(3 * 60_000))).toBe('3m ago');
    expect(formatRelativeTime(freeze(59 * 60_000))).toBe('59m ago');
  });

  it('returns hours for 1–23 hours ago', () => {
    expect(formatRelativeTime(freeze(2 * 3600_000))).toBe('2h ago');
  });

  it('returns days for 1–29 days ago', () => {
    expect(formatRelativeTime(freeze(5 * 86400_000))).toBe('5d ago');
  });

  it('returns months for 1–11 months ago', () => {
    expect(formatRelativeTime(freeze(45 * 86400_000))).toBe('1mo ago');
  });

  it('returns years for ≥ 1 year ago', () => {
    expect(formatRelativeTime(freeze(400 * 86400_000))).toBe('1y ago');
  });
});

describe('formatCount', () => {
  it('returns plain number for < 1000', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(999)).toBe('999');
  });

  it('formats thousands with K suffix', () => {
    expect(formatCount(1000)).toBe('1K');
    expect(formatCount(1500)).toBe('1.5K');
    expect(formatCount(12_300)).toBe('12.3K');
  });

  it('strips trailing .0 from K', () => {
    expect(formatCount(2000)).toBe('2K');
  });

  it('formats millions with M suffix', () => {
    expect(formatCount(1_000_000)).toBe('1M');
    expect(formatCount(2_400_000)).toBe('2.4M');
  });
});

describe('buildShareUrl', () => {
  it('builds default URL', () => {
    expect(buildShareUrl('post-001')).toBe('https://buzzfeed.app/post/post-001');
  });

  it('uses custom base URL', () => {
    expect(buildShareUrl('post-001', 'https://example.com')).toBe(
      'https://example.com/post/post-001',
    );
  });
});

describe('countryCodeToFlag', () => {
  it('converts JP to Japanese flag emoji', () => {
    expect(countryCodeToFlag('JP')).toBe('🇯🇵');
  });

  it('handles lowercase input', () => {
    expect(countryCodeToFlag('us')).toBe('🇺🇸');
  });

  it('converts GR to Greek flag emoji', () => {
    expect(countryCodeToFlag('GR')).toBe('🇬🇷');
  });
});

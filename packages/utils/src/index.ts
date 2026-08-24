/**
 * Returns human-readable relative time: "just now", "3h ago", "4d ago".
 * Avoids Intl.RelativeTimeFormat for RN compatibility.
 */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)}d ago`;
  if (diffSec < 31536000) return `${Math.floor(diffSec / 2592000)}mo ago`;
  return `${Math.floor(diffSec / 31536000)}y ago`;
}

/**
 * Compact count formatting: 1234 → "1.2K", 1200000 → "1.2M".
 */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace('.0', '')}K`;
  return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
}

/**
 * Builds a canonical shareable post URL.
 */
export function buildShareUrl(postId: string, baseUrl = 'https://buzzfeed.app'): string {
  return `${baseUrl}/post/${postId}`;
}

/**
 * Extracts a flag emoji from a two-letter ISO country code.
 * Works on iOS, Android, and modern web.
 */
export function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join('');
}

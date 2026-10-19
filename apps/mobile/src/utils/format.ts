import type { ItemStatus, SourcePlatform } from '@magpie/shared';

import type { IconName } from '../components/Icon';

export const platformLabel: Record<SourcePlatform, string> = {
  instagram: 'IG',
  youtube: 'YT',
  threads: 'TH',
  other: 'WEB',
};

/** Every status pairs one of these SVG icons with its translated text, never colour alone. */
export const statusIcon: Record<ItemStatus, IconName> = {
  queued: 'clock',
  processing: 'loader',
  done: 'check',
  needs_media: 'film',
  failed: 'close',
};

export type ConfidenceLevel = 'high' | 'mid' | 'low';

/** >=80 high, 50-79 mid, <50 low (matches the brief). */
export function confidenceLevel(percent: number): ConfidenceLevel {
  if (percent >= 80) return 'high';
  return percent >= 50 ? 'mid' : 'low';
}

// Exact registrable domains; subdomains (www., m.) are allowed, lookalikes are not.
const platformHosts: readonly [SourcePlatform, readonly string[]][] = [
  ['instagram', ['instagram.com', 'instagr.am']],
  ['youtube', ['youtube.com', 'youtu.be']],
  ['threads', ['threads.net', 'threads.com']],
];

/** Matches on the parsed hostname, so `evil.com/?u=instagram.com` is rejected. */
export function detectPlatform(url: string): SourcePlatform | null {
  let host: string;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    host = u.hostname.toLowerCase();
  } catch {
    return null;
  }
  return platformHosts.find(([, domains]) => domains.some((d) => host === d || host.endsWith(`.${d}`)))?.[0] ?? null;
}

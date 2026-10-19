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

export function detectPlatform(url: string): SourcePlatform | null {
  if (/instagram\.com|instagr\.am/i.test(url)) return 'instagram';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/threads\.(net|com)/i.test(url)) return 'threads';
  return null;
}

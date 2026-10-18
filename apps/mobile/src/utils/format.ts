import type { ContentType, ItemStatus, SourcePlatform } from '@magpie/shared';

export const platformLabel: Record<SourcePlatform, string> = {
  instagram: 'IG',
  youtube: 'YT',
  threads: 'TH',
  other: 'WEB',
};

export const contentLabel: Record<ContentType, string> = {
  recipe: '食譜',
  place: '地點',
  media: '影視',
  generic: '其他',
};

/** Every status carries an icon AND text, never colour alone. */
export const statusLabel: Record<ItemStatus, { icon: string; text: string }> = {
  queued: { icon: '⏳', text: '排隊中' },
  processing: { icon: '◔', text: '處理中' },
  done: { icon: '✓', text: '已完成' },
  needs_media: { icon: '🎞', text: '需要錄影' },
  failed: { icon: '✕', text: '失敗' },
};

export type ConfidenceLevel = 'high' | 'mid' | 'low';

/** >=80 high, 50-79 mid, <50 low (matches the brief). */
export function confidenceLevel(percent: number): ConfidenceLevel {
  if (percent >= 80) return 'high';
  return percent >= 50 ? 'mid' : 'low';
}

/** Spoken form for screen readers: the review flag is part of the sentence. */
export function confidenceSpeech(percent: number): string {
  return `信心 ${percent}%${percent < 50 ? '，請核對' : ''}`;
}

export function detectPlatform(url: string): SourcePlatform | null {
  if (/instagram\.com|instagr\.am/i.test(url)) return 'instagram';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/threads\.(net|com)/i.test(url)) return 'threads';
  return null;
}

import type { SavedItem } from '@magpie/shared';
import { describe, expect, it } from 'vitest';

import { strings } from '../i18n/strings';
import { toUiItem } from './item-mapper';

const saved: SavedItem = {
  id: 'item-1',
  userId: 'user-1',
  sourceUrl: 'https://www.instagram.com/reel/abc/',
  sourcePlatform: 'instagram',
  contentType: 'place',
  title: 'TST Omakase',
  caption: 'caption',
  highlights: ['尖沙咀', 42],
  labels: ['food'],
  status: 'done',
  transcriptStatus: 'processed',
  createdAt: '2026-11-10T00:00:00.000Z',
  updatedAt: '2026-11-10T00:00:00.000Z',
  statusReason: null,
  captureState: null,
};

describe('toUiItem', () => {
  it('maps the API model to the Home list model', () => {
    expect(toUiItem(saved)).toMatchObject({
      id: 'item-1',
      title: 'TST Omakase',
      platform: 'instagram',
      contentType: 'place',
      status: 'done',
      transcriptStatus: 'processed',
      url: saved.sourceUrl,
      meta: { zh: '地點', en: 'Place' },
      highlights: ['尖沙咀'],
      fields: [],
      transcript: [],
      saved: true,
    });
  });

  it('falls back to the source URL when the title is missing', () => {
    expect(toUiItem({ ...saved, title: null }).title).toBe(saved.sourceUrl);
  });

  it('surfaces a failed item status reason with a localized next step', () => {
    const mapped = toUiItem({ ...saved, status: 'failed', statusReason: 'The link is dead.' });

    expect(mapped.failure).toEqual({
      reason: { zh: 'The link is dead.', en: 'The link is dead.' },
      next: {
        zh: strings.zh.failedNextFallback,
        en: strings.en.failedNextFallback,
      },
    });
  });

  it('keeps a nonblank status reason exactly as stored', () => {
    const stored = '  Link moved.\nRetry later.  ';
    const mapped = toUiItem({ ...saved, status: 'failed', statusReason: stored });

    expect(mapped.failure?.reason).toEqual({ zh: stored, en: stored });
  });

  it('uses the localized fallback when a status reason is only whitespace', () => {
    const mapped = toUiItem({ ...saved, status: 'needs_media', statusReason: ' \n\t ' });

    expect(mapped.failure).toEqual({
      reason: {
        zh: strings.zh.needsMediaReasonFallback,
        en: strings.en.needsMediaReasonFallback,
      },
      next: {
        zh: strings.zh.needsMediaNextFallback,
        en: strings.en.needsMediaNextFallback,
      },
    });
  });

  it('uses localized fallbacks when a needs_media item has no status reason', () => {
    const mapped = toUiItem({ ...saved, status: 'needs_media', statusReason: null });

    expect(mapped.failure).toEqual({
      reason: {
        zh: strings.zh.needsMediaReasonFallback,
        en: strings.en.needsMediaReasonFallback,
      },
      next: {
        zh: strings.zh.needsMediaNextFallback,
        en: strings.en.needsMediaNextFallback,
      },
    });
  });

  it('does not show a failure for a finished item that carries a status reason', () => {
    const mapped = toUiItem({ ...saved, status: 'done', statusReason: 'internal note' });

    expect(mapped.failure).toBeUndefined();
  });
});

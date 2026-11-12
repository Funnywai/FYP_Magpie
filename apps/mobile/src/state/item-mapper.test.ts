import type { SavedItem } from '@magpie/shared';
import { describe, expect, it } from 'vitest';

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
      meta: { zh: '已儲存', en: 'Saved' },
      highlights: ['尖沙咀'],
      fields: [],
      transcript: [],
      saved: false,
    });
  });

  it('falls back to the source URL when the title is missing', () => {
    expect(toUiItem({ ...saved, title: null }).title).toBe(saved.sourceUrl);
  });
});

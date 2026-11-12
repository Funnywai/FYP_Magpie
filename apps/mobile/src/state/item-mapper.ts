import type { SavedItem } from '@magpie/shared';

import { strings } from '../i18n/strings';
import type { Item } from '../mocks/items';

/**
 * Adapter between the API model (`SavedItem`) and the rich UI model (`Item`).
 * The list endpoint does not return per-field values or transcript segments,
 * so those stay empty until the detail endpoint fills them in later.
 */
export function toUiItem(saved: SavedItem): Item {
  const highlights = saved.highlights.filter((value): value is string => typeof value === 'string');

  return {
    id: saved.id,
    title: saved.title ?? saved.sourceUrl,
    platform: saved.sourcePlatform,
    contentType: saved.contentType,
    status: saved.status,
    transcriptStatus: saved.transcriptStatus,
    meta: { zh: strings.zh.itemMetaSaved, en: strings.en.itemMetaSaved },
    url: saved.sourceUrl,
    art: 'link',
    gradient: 0,
    relevance: 0,
    highlights,
    fields: [],
    transcript: [],
    saved: false,
  };
}

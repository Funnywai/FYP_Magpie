import type { SavedItem } from '@magpie/shared';

import { strings } from '../i18n/strings';
import type { Item } from '../mocks/items';

type Failure = NonNullable<Item['failure']>;

/**
 * Terminal non-done statuses must never look successful: surface the stored
 * reason and always offer a localized next step. The stored reason is already
 * user-facing, so it is shown verbatim in both languages rather than guessed at.
 */
function failureFor(saved: SavedItem): Failure | undefined {
  if (saved.status !== 'failed' && saved.status !== 'needs_media') return undefined;

  const fallback: Failure =
    saved.status === 'failed'
      ? {
          reason: { zh: strings.zh.failedReasonFallback, en: strings.en.failedReasonFallback },
          next: { zh: strings.zh.failedNextFallback, en: strings.en.failedNextFallback },
        }
      : {
          reason: { zh: strings.zh.needsMediaReasonFallback, en: strings.en.needsMediaReasonFallback },
          next: { zh: strings.zh.needsMediaNextFallback, en: strings.en.needsMediaNextFallback },
        };

  const reason = saved.statusReason?.trim();
  return reason ? { reason: { zh: reason, en: reason }, next: fallback.next } : fallback;
}

/**
 * Adapter between the API model (`SavedItem`) and the rich UI model (`Item`).
 * The list endpoint does not return per-field values or transcript segments,
 * so those stay empty until the detail endpoint fills them in later.
 */
export function toUiItem(saved: SavedItem): Item {
  const highlights = saved.highlights.filter((value): value is string => typeof value === 'string');
  const failure = failureFor(saved);

  return {
    id: saved.id,
    title: saved.title ?? saved.sourceUrl,
    platform: saved.sourcePlatform,
    contentType: saved.contentType,
    status: saved.status,
    transcriptStatus: saved.transcriptStatus,
    meta: {
      zh: strings.zh.contentLabel[saved.contentType],
      en: strings.en.contentLabel[saved.contentType],
    },
    url: saved.sourceUrl,
    art: 'link',
    gradient: 0,
    relevance: 0,
    highlights,
    fields: [],
    transcript: [],
    ...(failure ? { failure } : {}),
    saved: true,
  };
}

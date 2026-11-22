import type {
  ContentType,
  ItemStatus,
  SavedItem,
  SourcePlatform,
  TranscriptStatus,
} from '@magpie/shared';

import { createUserClient } from './client.js';

const ITEM_COLUMNS = [
  'id',
  'user_id',
  'source_url',
  'source_platform',
  'content_type',
  'title',
  'caption',
  'highlights',
  'labels',
  'status',
  'transcript_status',
  'created_at',
  'updated_at',
  'status_reason',
  'capture_state',
].join(',');

interface SavedItemRow {
  id: string;
  user_id: string;
  source_url: string;
  source_platform: SourcePlatform;
  content_type: ContentType;
  title: string | null;
  caption: string | null;
  highlights: unknown;
  labels: string[];
  status: ItemStatus;
  transcript_status: TranscriptStatus;
  created_at: string;
  updated_at: string;
  status_reason: string | null;
  capture_state: unknown;
}

function toSavedItem(row: SavedItemRow): SavedItem {
  return {
    id: row.id,
    userId: row.user_id,
    sourceUrl: row.source_url,
    sourcePlatform: row.source_platform,
    contentType: row.content_type,
    title: row.title,
    caption: row.caption,
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    labels: row.labels ?? [],
    status: row.status,
    transcriptStatus: row.transcript_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    statusReason: row.status_reason,
    captureState: (row.capture_state as SavedItem['captureState']) ?? null,
  };
}

const PAGE_SIZE = 20;
/** Fetch one past the page so `hasMore` needs no second query or COUNT. */
const PROBE_LIMIT = PAGE_SIZE + 1;

export interface ItemsPage {
  items: SavedItem[];
  hasMore: boolean;
}

/** First page of the user's items, newest first. Cursor pagination arrives with search (Step 6). */
export async function listItemsForUser(accessToken: string): Promise<ItemsPage> {
  const db = createUserClient(accessToken);

  const { data, error } = await db
    .from('saved_items')
    .select(ITEM_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(PROBE_LIMIT)
    .returns<SavedItemRow[]>();

  if (error) throw Object.assign(new Error(error.message), { code: error.code });

  const rows = data ?? [];

  return {
    items: rows.slice(0, PAGE_SIZE).map(toSavedItem),
    hasMore: rows.length > PAGE_SIZE,
  };
}

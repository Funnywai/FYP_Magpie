/**
 * API contract types — mirror the surface in docs/SPEC.md §5.
 *
 * These are intentionally *different shapes* from the domain types: an
 * endpoint receives exactly what the client can provide and returns exactly
 * what the client needs — not a whole entity.
 *
 * Convention (SPEC §5): errors are always `{ error: { code, message } }`.
 */

import type {
  Collection,
  ContentType,
  ExtractedField,
  ItemStatus,
  SavedItem,
  Uuid,
} from './domain.js';

export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'INTERNAL';

/** Shared error envelope (SPEC §5). */
export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

/** GET /api/health */
export interface HealthResponse {
  status: 'ok';
}

/** POST /api/capture — request carries only the shared URL. */
export interface CaptureRequest {
  url: string;
}

/** POST /api/capture — returns immediately; client polls GET /items/:id. */
export interface CaptureResponse {
  itemId: Uuid;
  status: ItemStatus;
}

/** GET /api/items — query is encoded in the URL; this is the response. */
export interface ListItemsResponse {
  items: SavedItem[];
  /** True when more items exist beyond this page. */
  hasMore: boolean;
  nextCursor: string | null;
}

/** GET /api/items/:id */
export interface ItemDetailResponse {
  item: SavedItem;
  fields: ExtractedField[];
}

/** PATCH /api/items/:id/fields/:fieldId */
export interface CorrectFieldRequest {
  value: string;
}

export interface CorrectFieldResponse {
  field: ExtractedField;
}

/** GET /api/search */
export interface SearchQuery {
  q: string;
  contentType?: ContentType;
  labels?: string[];
  from?: string;
  to?: string;
  status?: ItemStatus;
}

export interface SearchResult {
  item: SavedItem;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
}

/** POST /api/interactions */
export interface RecordInteractionRequest {
  itemId: Uuid;
  interactionType: 'like' | 'dislike' | 'view' | 'save';
}

export interface RecordInteractionResponse {
  ok: true;
}

/** GET/POST /api/collections */
export interface CreateCollectionRequest {
  name: string;
  description?: string;
  parentId?: Uuid;
}

export interface ListCollectionsResponse {
  collections: Collection[];
}

/** POST /api/itineraries */
export interface GenerateItineraryRequest {
  itemIds: Uuid[];
  startPoint: string;
  endPoint: string;
  startDate: string;
  endDate: string;
}

export interface GenerateItineraryResponse {
  planId: Uuid;
  status: 'draft';
}

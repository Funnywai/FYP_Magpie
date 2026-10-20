/**
 * Domain types — mirror the data model in docs/SPEC.md §3.
 *
 * These describe *what an entity is* as stored and returned. They are the
 * compile-time shape only; runtime validation lives in `schemas.ts`.
 *
 * Convention: all ids are UUID strings; timestamps are ISO 8601 strings.
 */

export type Uuid = string;
export type IsoTimestamp = string;

/** SPEC §3.3 */
export type SourcePlatform = 'instagram' | 'youtube' | 'threads' | 'other';
export type ContentType = 'recipe' | 'place' | 'media' | 'generic';
export type ItemStatus = 'queued' | 'processing' | 'done' | 'needs_media' | 'failed';

export interface CaptureState {
  completedSteps: string[];
  failureReason: string | null;
}

/** SPEC §3.3 */
export interface SavedItem {
  id: Uuid;
  userId: Uuid;
  sourceUrl: string;
  sourcePlatform: SourcePlatform;
  contentType: ContentType;
  title: string | null;
  caption: string | null;
  highlights: unknown[];
  category: string;
  status: ItemStatus;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  statusReason: string | null;
  captureState: CaptureState | null;
}

/** SPEC §3.4 — `audio` is user-provided only; extracted platform audio is never persisted. */
export type MediaAssetType = 'thumbnail' | 'audio' | 'frame';

export interface MediaAsset {
  id: Uuid;
  itemId: Uuid;
  assetType: MediaAssetType;
  storagePath: string;
  timestampSeconds: number | null;
  ocrText: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** SPEC §3.5 */
export type Language = 'yue' | 'zh' | 'en';

export interface TranscriptSegment {
  id: Uuid;
  itemId: Uuid;
  startSeconds: number;
  endSeconds: number;
  text: string;
  language: Language;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** SPEC §3.6 */
export type EvidenceSource = 'asr' | 'ocr' | 'caption' | 'visual';

export interface ExtractedField {
  id: Uuid;
  itemId: Uuid;
  fieldName: string;
  fieldValue: string | null;
  confidence: number;
  evidenceSource: EvidenceSource;
  evidenceRef: string;
  verified: boolean;
  userCorrected: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** SPEC §3.7 */
export type ChunkType = 'structured_card' | 'transcript' | 'ocr';

export interface EmbeddingChunk {
  id: Uuid;
  itemId: Uuid;
  chunkType: ChunkType;
  chunkText: string;
  tokenCount: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** SPEC §3.8 */
export interface Collection {
  id: Uuid;
  ownerId: Uuid;
  name: string;
  description: string | null;
  isShared: boolean;
  parentId: Uuid | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** SPEC §3.9 */
export interface CollectionItem {
  id: Uuid;
  collectionId: Uuid;
  itemId: Uuid;
  addedBy: Uuid;
  orderIndex: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** SPEC §3.10 */
export type InteractionType = 'like' | 'dislike' | 'view' | 'save';

export interface Interaction {
  id: Uuid;
  userId: Uuid;
  itemId: Uuid;
  interactionType: InteractionType;
  timestamp: IsoTimestamp;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** SPEC §3.11 */
export type ItineraryStatus = 'draft' | 'active' | 'completed';

export interface ItineraryPlan {
  id: Uuid;
  userId: Uuid;
  startPoint: string;
  endPoint: string;
  startDate: string;
  endDate: string;
  status: ItineraryStatus;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** SPEC §3.12 */
export type IndoorOutdoor = 'indoor' | 'outdoor' | 'mixed';

export interface ItineraryStop {
  id: Uuid;
  planId: Uuid;
  dayNumber: number;
  itemId: Uuid;
  placeId: string;
  startTime: string;
  endTime: string;
  indoorOutdoor: IndoorOutdoor;
  orderIndex: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** SPEC §3.1 */
export interface User {
  id: Uuid;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  authProvider: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** SPEC §3.2 */
export interface PreferenceProfile {
  id: Uuid;
  userId: Uuid;
  preferredCategories: string[];
  preferredTags: string[];
  languagePreference: Language[];
  rankingWeights: Record<string, number>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

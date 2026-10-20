/**
 * Zod runtime schemas (SPEC §2: "All model output is validated against a
 * schema before use").
 *
 * TypeScript types vanish at runtime. When the AI provider returns JSON, the
 * only thing standing between plausible-looking data and a poisoned database
 * is a runtime check. These schemas are that check.
 *
 * Step 1 defines them so later steps can import them; no model is called yet.
 */

import { z } from 'zod';

export const sourcePlatformSchema = z.enum(['instagram', 'youtube', 'threads', 'other']);
export const contentTypeSchema = z.enum(['recipe', 'place', 'media', 'generic']);
export const itemStatusSchema = z.enum([
  'queued',
  'processing',
  'done',
  'needs_media',
  'failed',
]);
export const languageSchema = z.enum(['yue', 'zh', 'en']);
export const evidenceSourceSchema = z.enum(['asr', 'ocr', 'caption', 'visual']);
export const chunkTypeSchema = z.enum(['structured_card', 'transcript', 'ocr']);
export const interactionTypeSchema = z.enum(['like', 'dislike', 'view', 'save']);
export const indoorOutdoorSchema = z.enum(['indoor', 'outdoor', 'mixed']);

/**
 * A single extracted field. `fieldValue` is nullable by design: null means
 * "not found" — the model must never guess (SPEC §3.6, §4.6).
 */
export const extractedFieldSchema = z.object({
  fieldName: z.string().min(1),
  fieldValue: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  evidenceSource: evidenceSourceSchema,
  evidenceRef: z.string().min(1),
});

/**
 * The structured output expected from the representation/extraction stage
 * (SPEC §4.2–4.3). Every non-null field carries evidence.
 */
export const extractionResultSchema = z.object({
  contentType: contentTypeSchema,
  labels: z.array(z.string()),
  highlights: z.array(z.string()),
  fields: z.array(extractedFieldSchema),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;
export type ExtractedFieldOutput = z.infer<typeof extractedFieldSchema>;

/** Minimal capture-request validation for the API boundary. */
export const captureRequestSchema = z.object({
  url: z.string().url(),
});

export type CaptureRequestInput = z.infer<typeof captureRequestSchema>;

import { describe, expect, it } from 'vitest';

import { extractionResultSchema } from './schemas.js';

describe('extractionResultSchema', () => {
  it('accepts a well-formed extraction result', () => {
    const result = extractionResultSchema.parse({
      contentType: 'recipe',
      labels: ['food', 'cantonese'],
      highlights: ['boil water', 'add noodles'],
      fields: [
        {
          fieldName: 'ingredient',
          fieldValue: 'noodles',
          confidence: 0.9,
          evidenceSource: 'asr',
          evidenceRef: '12.4s',
        },
      ],
    });

    expect(result.contentType).toBe('recipe');
    expect(result.fields).toHaveLength(1);
  });

  it('rejects a confidence outside 0..1', () => {
    const invalid = {
      contentType: 'recipe',
      labels: [],
      highlights: [],
      fields: [
        {
          fieldName: 'ingredient',
          fieldValue: 'noodles',
          confidence: 1.5,
          evidenceSource: 'asr',
          evidenceRef: '12.4s',
        },
      ],
    };

    expect(() => extractionResultSchema.parse(invalid)).toThrow();
  });

  it('allows a null fieldValue (meaning "not found")', () => {
    const result = extractionResultSchema.parse({
      contentType: 'place',
      labels: [],
      highlights: [],
      fields: [
        {
          fieldName: 'address',
          fieldValue: null,
          confidence: 0,
          evidenceSource: 'visual',
          evidenceRef: 'frame-0',
        },
      ],
    });

    expect(result.fields[0]?.fieldValue).toBeNull();
  });
});

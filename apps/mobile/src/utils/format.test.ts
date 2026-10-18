import { expect, it } from 'vitest';

import { confidenceLevel, confidenceSpeech, detectPlatform } from './format';

it('confidence thresholds', () => {
  expect([98, 80, 79, 50, 49, 30].map(confidenceLevel)).toEqual(['high', 'high', 'mid', 'mid', 'low', 'low']);
  expect(confidenceSpeech(46)).toBe('信心 46%，請核對');
  expect(confidenceSpeech(80)).toBe('信心 80%');
});

it('platform detection', () => {
  expect(detectPlatform('https://www.instagram.com/reel/abc')).toBe('instagram');
  expect(detectPlatform('https://youtu.be/xyz')).toBe('youtube');
  expect(detectPlatform('https://www.threads.net/@a/post/1')).toBe('threads');
  expect(detectPlatform('https://example.com')).toBeNull();
});

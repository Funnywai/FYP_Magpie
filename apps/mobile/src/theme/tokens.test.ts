import { describe, expect, it } from 'vitest';

import { breakpointFor, darkColors, lightColors, type ColorTokens } from './tokens';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, min ratio]
const pairs = (c: ColorTokens): [string, string, number][] => [
  [c.text, c.background, 4.5],
  [c.text, c.surface, 4.5],
  [c.textSecondary, c.background, 4.5],
  [c.textSecondary, c.surface, 4.5],
  [c.onAccent, c.accent, 4.5],
  [c.onTag, c.tag, 4.5],
  [c.accentText, c.surface, 4.5],
  [c.accentText, c.background, 4.5],
  [c.successText, c.surface, 4.5],
  [c.warningText, c.surface, 4.5],
  [c.dangerText, c.surface, 4.5],
  [c.onSuccess, c.success, 4.5],
  [c.onWarning, c.warning, 4.5],
  [c.onDanger, c.danger, 4.5],
  // graphics / borders
  [c.ink, c.background, 3],
  [c.ink, c.surface, 3],
  // ink vs accent is intentionally not checked: the border's outer edge meets background
  // (checked above); the accent fill never needs to be distinguished from its own border.
];

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
])('%s contrast', (_name, c) => {
  it.each(pairs(c))('%s on %s >= %f', (fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});

it('raw brand accent fails on dark surface (why accentText exists)', () => {
  expect(contrast(darkColors.accent, darkColors.surface)).toBeLessThan(3);
});

it('breakpoints', () => {
  expect([360, 599, 600, 744, 820, 839, 840].map(breakpointFor)).toEqual([
    'compact', 'compact', 'medium', 'medium', 'medium', 'medium', 'expanded',
  ]);
});

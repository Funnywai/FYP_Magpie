/**
 * Design tokens — the ONLY place colours may be hard-coded.
 *
 * Contrast notes (checked in tokens.test.ts):
 * - `accent` on `surface` fails 3:1 in dark mode (#B3362C on #2A231B ≈ 2.6:1),
 *   so text/icons/focus rings that sit on a surface use `accentText`, a lighter
 *   dark-mode variant. `accent` itself stays as FILL (button, active chip, FAB).
 * - Semantic colours (success/warning/danger) are fills. Text sitting on those
 *   fills uses `onSuccess/onWarning/onDanger`; text sitting on a surface uses
 *   `successText/warningText/dangerText`.
 */

export type ColorTokens = {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  /** Ink: borders, hard shadows, solid icons. */
  ink: string;
  accent: string;
  onAccent: string;
  /** Accent usable as text/icon/focus ring on background or surface. */
  accentText: string;
  tag: string;
  onTag: string;
  sage: string;
  success: string;
  warning: string;
  danger: string;
  onSuccess: string;
  onWarning: string;
  onDanger: string;
  successText: string;
  warningText: string;
  dangerText: string;
  tile: string;
  /** Sheet backdrop. */
  scrim: string;
};

export const lightColors: ColorTokens = {
  background: '#F6F0E4',
  surface: '#FFFAF0',
  text: '#2B2118',
  textSecondary: '#8B5E3C',
  ink: '#2B2118',
  accent: '#B3362C',
  onAccent: '#FFFFFF',
  accentText: '#B3362C',
  tag: '#F4C542',
  onTag: '#2B2118',
  sage: '#BFD3BF',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#B91C1C',
  onSuccess: '#2B2118',
  onWarning: '#2B2118',
  onDanger: '#FFFFFF',
  successText: '#15803D',
  warningText: '#B45309',
  dangerText: '#B91C1C',
  tile: 'rgba(179,54,44,0.20)',
  scrim: 'rgba(43,33,24,0.45)',
} as const;

export const darkColors: ColorTokens = {
  background: '#1F1A14',
  surface: '#2A231B',
  text: '#F1E8D8',
  textSecondary: '#D1A77C',
  ink: '#F1E8D8',
  accent: '#B3362C',
  onAccent: '#FFFFFF',
  accentText: '#E5675C',
  tag: '#F4C542',
  onTag: '#1A120A',
  sage: '#BFD3BF',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#B91C1C',
  onSuccess: '#1A120A',
  onWarning: '#1A120A',
  onDanger: '#FFFFFF',
  successText: '#4ADE80',
  warningText: '#FBBF24',
  dangerText: '#F87171',
  tile: 'rgba(179,54,44,0.30)',
  scrim: 'rgba(0,0,0,0.60)',
} as const;

/** Thumbnail placeholder gradients (mock data indexes into this; colours live here only). */
export const thumbGradients = [
  ['#F4C542', '#B3362C'],
  ['#BFD3BF', '#16A34A'],
  ['#F4C542', '#D97706'],
  ['#E8B4A0', '#B3362C'],
  ['#BFD3BF', '#F4C542'],
  ['#D1A77C', '#8B5E3C'],
] as const;

export const colors = { light: lightColors, dark: darkColors } as const;

/** Font family keys as registered with expo-font (see ThemeProvider). */
export const fonts = {
  serifBlack: 'NotoSerifTC_900Black',
  sans: 'NotoSansTC_400Regular',
  sansMedium: 'NotoSansTC_500Medium',
  sansBold: 'NotoSansTC_700Bold',
  /** Latin-only UI bits (platform marks, digits in badges). */
  latin: 'Inter_400Regular',
  latinMedium: 'Inter_500Medium',
  latinBold: 'Inter_700Bold',
} as const;

/** System monospace for timestamps / evidence. Platform-specific, so resolved in ThemeProvider. */
export const monoFamily = { ios: 'Menlo', android: 'monospace', web: 'ui-monospace, Menlo, monospace' } as const;

export type TypeRole = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'micro';

export type TypeStyle = {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
};

/** Sizes in sp. Line heights are the brief's Latin values (34/28/24/22/16/14) +2 for Chinese. */
export const typography: Record<TypeRole, TypeStyle> = {
  display: { fontSize: 28, lineHeight: 36, fontFamily: fonts.serifBlack },
  title: { fontSize: 22, lineHeight: 30, fontFamily: fonts.serifBlack },
  heading: { fontSize: 17, lineHeight: 26, fontFamily: fonts.sansBold },
  body: { fontSize: 15, lineHeight: 24, fontFamily: fonts.sans },
  caption: { fontSize: 12, lineHeight: 18, fontFamily: fonts.sans },
  micro: { fontSize: 11, lineHeight: 16, fontFamily: fonts.sansMedium },
} as const;

/** Dynamic type caps. Tab labels stop growing at 1.4x; everything else follows the OS. */
export const fontScale = { tabLabelMax: 1.4 } as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Screen side margin: phone 16, tablet 24. */
export const gutter = { compact: 16, medium: 24, expanded: 24 } as const;

export const radius = {
  card: 8,
  tag: 6,
  button: 8,
  input: 8,
  sheet: 16,
  logo: 4,
  full: 9999,
} as const;

export const border = {
  width: 2,
  focusWidth: 3,
  focusOffset: 2,
} as const;

/** Hard shadow: offset only, no blur, no opacity. Drawn as a View, never RN shadow props. */
export const hardShadow = {
  rest: { x: 4, y: 4 },
  pressed: { x: 1, y: 1 },
  /** Pressed content translation: 3px right/down. */
  pressTranslate: { x: 3, y: 3 },
} as const;

export const motion = {
  press: 90,
  transition: 180,
  /** No animation may exceed this. */
  max: 250,
} as const;

/** Minimum touch targets and spacing between targets. */
export const touch = { ios: 44, android: 48, gap: 8, button: 48 } as const;

export const breakpoints = { medium: 600, expanded: 840 } as const;
export type Breakpoint = 'compact' | 'medium' | 'expanded';

/** Pure (no RN import) so it is unit-testable: compact <600, medium 600–839, expanded >=840. */
export function breakpointFor(width: number): Breakpoint {
  if (width >= breakpoints.expanded) return 'expanded';
  if (width >= breakpoints.medium) return 'medium';
  return 'compact';
}

export const layout = {
  sidebarWidth: 88,
  modalWidth: 480,
  tabBarHeight: 64,
  fab: 56,
  fabRaise: 8,
  smallPhoneWidth: 360,
  thumbRow: 112,
  thumbRowSmall: 88,
} as const;

export type ThemeMode = 'light' | 'dark';
export type ThemeModePreference = ThemeMode | 'system';

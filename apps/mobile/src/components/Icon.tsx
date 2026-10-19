import Svg, { Path } from 'react-native-svg';

import type { ColorTokens } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

/** 24x24 line icons, 2px stroke to match the border weight. */
export const iconPaths = {
  book: 'M5 3h14v18H8a3 3 0 0 1-3-3z M9 8h6',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z',
  route: 'M7 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M17 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M10 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h4',
  sliders: 'M4 7h9 M19 7h1 M4 17h1 M11 17h9 M16 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M8 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  plus: 'M12 5v14 M5 12h14',
  search: 'M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M15 15l5 5',
  alert: 'M12 4L2.5 20h19z M12 10v5 M12 17.5v.5',
  close: 'M6 6l12 12 M18 6L6 18',
  back: 'M15 5l-7 7 7 7',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5L19 19 M5 19l1.5-1.5 M17.5 6.5L19 5',
  cloud: 'M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5 4.8 4.8 0 0 1 17 18z',
  rain: 'M7 14a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 4.5 4.8 4.8 0 0 1 17 14z M8 17l-1 3 M12 17l-1 3 M16 17l-1 3',
  home: 'M4 11l8-7 8 7v9H4z',
  mountain: 'M2 20l7-12 4 7 3-4 6 9z',
  thumbUp: 'M7 11v9H4v-9z M7 11l4-8a2 2 0 0 1 2 2v4h6a2 2 0 0 1 2 2l-1.5 7a2 2 0 0 1-2 1.5H7',
  thumbDown: 'M7 13V4H4v9z M7 13l4 8a2 2 0 0 0 2-2v-4h6a2 2 0 0 0 2-2l-1.5-7A2 2 0 0 0 17.5 4H7',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 8v4l3 2',
  loader: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M5.6 5.6l2.8 2.8 M15.6 15.6l2.8 2.8 M18.4 5.6l-2.8 2.8 M8.4 15.6l-2.8 2.8',
  check: 'M5 12l5 5 9-10',
  film: 'M4 5h16v14H4z M8 5v14 M16 5v14 M4 9h4 M4 15h4 M16 9h4 M16 15h4',
  bowl: 'M3 11h18a9 9 0 0 1-18 0z M8 3c0 2 2 2 2 4 M13 3c0 2 2 2 2 4',
  pin: 'M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
} as const;

// Keys double as the public icon vocabulary; add a path above to add an icon.
export type IconName = keyof typeof iconPaths;

type Props = { name: IconName; size?: number; color?: keyof ColorTokens; filled?: boolean };

/** Decorative by default: the parent control carries the accessibility label. */
export function Icon({ name, size = 24, color = 'ink', filled = false }: Props) {
  const { colors } = useTheme();
  // Resolved from tokens so icons follow light/dark without extra props.
  const c = colors[color];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <Path d={iconPaths[name]} stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={filled ? c : 'none'} />
    </Svg>
  );
}

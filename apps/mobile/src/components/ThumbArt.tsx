import type { ReactElement } from 'react';
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';

import type { ThumbArtName } from '../mocks/items';
import { useTheme } from '../theme/useTheme';

type Props = { name: ThumbArtName };

/** Flat sticker illustrations (64x64) that replace emoji on thumbnails. Colours come from the theme. */
export function ThumbArt({ name }: Props) {
  const { colors: c } = useTheme();
  // Shared outline so every drawing carries the same ink weight as the UI borders.
  const o = { stroke: c.ink, strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const art = {
    // Nigiri: rice block, salmon slice on top, three light fat lines.
    sushi: (
      <>
        <Rect x={8} y={34} width={48} height={16} rx={8} fill={c.surface} {...o} />
        <Path d="M6 36 Q32 8 58 36 Z" fill={c.accent} {...o} />
        <Path d="M22 26 L20 35 M32 22 L32 35 M42 26 L44 35" fill="none" stroke={c.surface} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
    // Plate, sauce mound, twirled noodle lines and a tomato.
    pasta: (
      <>
        <Ellipse cx={32} cy={42} rx={26} ry={10} fill={c.surface} {...o} />
        <Path d="M12 40 Q32 6 52 40 Z" fill={c.tag} {...o} />
        <Path d="M20 36 Q32 22 44 36 M24 30 Q32 20 40 30" fill="none" {...o} />
        <Circle cx={32} cy={18} r={4} fill={c.accent} {...o} />
      </>
    ),
    // Sun, a snow-capped mountain and a green hill in front.
    hike: (
      <>
        <Circle cx={48} cy={16} r={6} fill={c.tag} {...o} />
        <Polygon points="4,52 24,16 44,52" fill={c.surface} {...o} />
        <Polygon points="30,52 46,28 62,52" fill={c.sage} {...o} />
        <Path d="M24 16 L19 25 L24 23 L29 25 Z" fill={c.ink} />
      </>
    ),
    // Shaved-ice bowl with two scoops and a spoon.
    dessert: (
      <>
        <Path d="M8 30 H56 A24 22 0 0 1 8 30 Z" fill={c.surface} {...o} />
        <Circle cx={24} cy={24} r={7} fill={c.tag} {...o} />
        <Circle cx={38} cy={22} r={7} fill={c.sage} {...o} />
        <Path d="M42 18 L54 6" fill="none" {...o} />
        <Path d="M22 56 H42" fill="none" {...o} />
      </>
    ),
    // Clapperboard with a play triangle.
    film: (
      <>
        <Rect x={8} y={24} width={48} height={30} rx={3} fill={c.surface} {...o} />
        <Path d="M8 24 L10 12 L56 16 L56 24 Z" fill={c.ink} {...o} />
        <Path d="M20 14 L16 24 M32 15 L28 24 M44 16 L40 24" fill="none" stroke={c.surface} strokeWidth={3} />
        <Polygon points="27,31 27,47 41,39" fill={c.accent} {...o} />
      </>
    ),
    // Hot pot with steam lines and a lid line.
    pot: (
      <>
        <Path d="M10 28 H54 V42 A10 10 0 0 1 44 52 H20 A10 10 0 0 1 10 42 Z" fill={c.accent} {...o} />
        <Path d="M8 28 H56" fill="none" {...o} />
        <Path d="M10 34 H4 M54 34 H60" fill="none" {...o} />
        <Path d="M22 20 Q18 14 22 8 M32 20 Q28 14 32 8 M42 20 Q38 14 42 8" fill="none" {...o} />
        <Circle cx={32} cy={40} r={4} fill={c.tag} {...o} />
      </>
    ),
    // Two interlocked chain links.
    link: (
      <>
        <Rect x={6} y={24} width={32} height={18} rx={9} fill="none" {...o} strokeWidth={5} />
        <Rect x={26} y={24} width={32} height={18} rx={9} fill="none" {...o} strokeWidth={5} />
        <Path d="M24 33 H40" fill="none" stroke={c.accent} strokeWidth={4} strokeLinecap="round" />
      </>
    ),
    // Sneaker with a dark sole and accent laces.
    shoe: (
      <>
        <Path d="M6 42 V28 Q20 30 26 20 L32 26 L46 28 Q60 30 60 44 V48 H6 Z" fill={c.surface} {...o} />
        <Rect x={6} y={46} width={54} height={8} rx={3} fill={c.ink} />
        <Path d="M32 26 L40 38 M26 20 L34 34" fill="none" stroke={c.accent} strokeWidth={3} strokeLinecap="round" />
      </>
    ),
    // Four-point star, used for newly saved clips.
    sparkle: <Path d="M32 6 L38 26 L58 32 L38 38 L32 58 L26 38 L6 32 L26 26 Z" fill={c.tag} {...o} />,
  } satisfies Record<ThumbArtName, ReactElement>;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64" aria-hidden>
      {art[name]}
    </Svg>
  );
}

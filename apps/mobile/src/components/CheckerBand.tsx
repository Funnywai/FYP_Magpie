import { useId, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { useTheme } from '../theme/useTheme';

const CELL = 22;

type Props = { children: ReactNode; style?: StyleProp<ViewStyle> };

/** Cha-chaan-teng floor tiles: 22x22 alternating squares. Header only, never behind body text. */
export function CheckerBand({ children, style }: Props) {
  const { colors } = useTheme();
  // Unique pattern id per instance; duplicate SVG ids collide on web.
  const id = `checker${useId().replace(/\W/g, '')}`;
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" aria-hidden>
        <Defs>
          {/* One 44x44 tile holds two diagonal 22px squares, which repeat into a checkerboard. */}
          <Pattern id={id} width={CELL * 2} height={CELL * 2} patternUnits="userSpaceOnUse">
            <Rect x={0} y={0} width={CELL} height={CELL} fill={colors.tile} />
            <Rect x={CELL} y={CELL} width={CELL} height={CELL} fill={colors.tile} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

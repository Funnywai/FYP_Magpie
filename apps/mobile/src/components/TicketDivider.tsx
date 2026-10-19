import { View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { border } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const W = 16;
const R = 7;

/**
 * Vertical perforation: an SVG dashed line (not a dashed border, which renders differently
 * on iOS/Android) with half-circle notches in the page colour biting into the card edges.
 */
export function TicketDivider() {
  const { colors } = useTheme();
  // Same 2px as every other ink line.
  const w = border.width;
  return (
    // -2 margins let the notches cover the card's own 2px top/bottom border.
    <View style={{ width: W, alignSelf: 'stretch', marginVertical: -w, overflow: 'hidden' }} aria-hidden>
      <Svg width={W} height="100%">
        {/* Dash pattern 6 on / 4 off, drawn by SVG so iOS and Android match. */}
        <Line x1={W / 2} y1={R} x2={W / 2} y2="100%" stroke={colors.ink} strokeWidth={w} strokeDasharray="6 4" />
        <Circle cx={W / 2} cy={0} r={R} fill={colors.background} stroke={colors.ink} strokeWidth={w} />
        <Circle cx={W / 2} cy="100%" r={R} fill={colors.background} stroke={colors.ink} strokeWidth={w} />
      </Svg>
    </View>
  );
}

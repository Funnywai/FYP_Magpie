import { View } from 'react-native';

import { border, radius } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Txt } from './Txt';

type Props = { children: string; sparkle?: boolean; tilt?: boolean };

/** Yellow sticker. `tilt` = -2deg; keep to one tilted sticker per card. */
export function Tag({ children, sparkle, tilt }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        // Shrink-wrap: a sticker is only as wide as its text.
        alignSelf: 'flex-start',
        backgroundColor: colors.tag,
        borderWidth: border.width,
        borderColor: colors.ink,
        borderRadius: radius.tag,
        paddingHorizontal: 8,
        paddingVertical: 2,
        transform: tilt ? [{ rotate: '-2deg' }] : undefined,
      }}
    >
      <Txt type="caption" bold color="onTag">
        {sparkle ? `✦ ${children}` : children}
      </Txt>
    </View>
  );
}

import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import type { Item } from '../mocks/items';
import { border, radius, thumbGradients } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { platformLabel } from '../utils/format';
import { ThumbArt } from './ThumbArt';
import { Txt } from './Txt';

type Props = { item: Item; ratio: number };

/** Gradient + SVG illustration stand-in for a video thumbnail; the ratio is fixed so it never distorts. */
export function Thumb({ item, ratio }: Props) {
  const { colors } = useTheme();
  // Modulo keeps any gradient index valid, including items added at runtime.
  const g = thumbGradients[item.gradient % thumbGradients.length] ?? thumbGradients[0];
  return (
    <View style={{ borderWidth: border.width, borderColor: colors.ink, borderRadius: radius.tag, overflow: 'hidden', aspectRatio: ratio }}>
      <LinearGradient colors={g} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Artwork is 56% of the width and keeps 1:1, so it never distorts in any ratio. */}
        <View style={{ width: '56%', aspectRatio: 1, maxHeight: '86%' }}>
          <ThumbArt name={item.art} />
        </View>
      </LinearGradient>
      {/* Platform mark sits on the thumbnail corner, fixed size so it never wraps. */}
      <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: colors.ink, borderRadius: 3, paddingHorizontal: 4 }}>
        <Txt type="micro" latin bold color="background" allowFontScaling={false}>
          {platformLabel[item.platform]}
        </Txt>
      </View>
    </View>
  );
}

import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Polygon } from 'react-native-svg';

import { useTheme } from '../theme/useTheme';
import { Button } from './Button';
import { Txt } from './Txt';

type Props = { title: string; hint: string; actionLabel?: string; onAction?: () => void };

/** Sticker-style magpie carrying a basket. Illustration lives only here and in the header. */
function Magpie() {
  const { colors } = useTheme();
  // Shared stroke so every shape carries the same 2px ink outline.
  const line = { stroke: colors.ink, strokeWidth: 2, strokeLinejoin: 'round' as const };
  return (
    <Svg width={160} height={140} viewBox="0 0 160 140" aria-hidden>
      <Polygon points="30,70 4,100 12,104 40,84" fill={colors.ink} {...line} />
      {/* Body, belly and wing. */}
      <Ellipse cx={64} cy={72} rx={38} ry={26} fill={colors.ink} {...line} />
      <Ellipse cx={68} cy={80} rx={22} ry={15} fill={colors.surface} {...line} />
      <Path d="M44 62 Q62 44 86 66 Q66 76 44 62z" fill={colors.sage} {...line} />
      {/* Head, eye and beak. */}
      <Circle cx={100} cy={44} r={17} fill={colors.ink} {...line} />
      <Circle cx={104} cy={41} r={3.5} fill={colors.surface} />
      <Polygon points="114,42 130,48 114,54" fill={colors.tag} {...line} />
      <Path d="M122 52 Q136 80 128 98" fill="none" {...line} />
      {/* Basket held from the beak by its handle. */}
      <Path d="M100 108 L156 108 L148 136 L108 136 Z" fill={colors.tag} {...line} />
      <Path d="M108 118 H148 M110 127 H146" fill="none" {...line} />
      <Path d="M64 98 L64 112 M78 98 L78 112" fill="none" {...line} />
      <Circle cx={130} cy={104} r={5} fill={colors.accent} {...line} />
    </Svg>
  );
}

export function EmptyState({ title, hint, actionLabel, onAction }: Props) {
  return (
    <View accessible={false} style={{ alignItems: 'center', gap: 12, paddingVertical: 24, paddingHorizontal: 16 }}>
      <Magpie />
      <Txt type="title" style={{ textAlign: 'center' }} accessibilityRole="header">
        {title}
      </Txt>
      <Txt type="body" color="textSecondary" style={{ textAlign: 'center' }}>
        {hint}
      </Txt>
      {actionLabel && onAction && <Button label={actionLabel} onPress={onAction} />}
    </View>
  );
}

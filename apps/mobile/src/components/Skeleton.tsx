import { useEffect, useRef } from 'react';
import { Animated, View, type DimensionValue } from 'react-native';

import { useLang } from '../i18n/LangProvider';
import { border, motion, radius } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type Props = { height: number; width?: DimensionValue };

/** Ink-outlined placeholder. Pulses gently; static when Reduce Motion is on. */
export function Skeleton({ height, width = '100%' }: Props) {
  const { colors, reduceMotion } = useTheme();
  const o = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) return;
    // Two legs of 250ms: the longest any animation is allowed to run.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 0.55, duration: motion.max, useNativeDriver: true }),
        Animated.timing(o, { toValue: 1, duration: motion.max, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [o, reduceMotion]);

  return (
    <Animated.View aria-hidden
      style={{ height, width, opacity: o, backgroundColor: colors.sage, borderWidth: border.width, borderColor: colors.ink, borderRadius: radius.tag }}
    />
  );
}

/** Card-shaped skeleton used by list loading states. */
export function SkeletonCard() {
  const { s } = useLang();
  return (
    <View accessible accessibilityLabel={s.loading} style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
      <Skeleton height={96} width={96} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton height={20} />
        <Skeleton height={14} width="60%" />
        <Skeleton height={24} width="40%" />
      </View>
    </View>
  );
}

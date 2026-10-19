import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';

import { hardShadow, motion, radius as r } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type Props = {
  children: ReactNode;
  /** Pressed: the content sinks onto the (stationary) shadow. */
  pressed?: boolean;
  radius?: number;
  shadow?: boolean;
  /** Stretch to fill a taller parent (grid cards). Off for fixed-size things like the FAB. */
  grow?: boolean;
  style?: StyleProp<ViewStyle>;
};

const { x: sx, y: sy } = hardShadow.rest;

/**
 * Neo-brutalist shadow drawn as a sibling View, never RN shadow props (those blur on iOS and
 * become elevation on Android). The wrapper reserves the 4px so layouts never overflow.
 */
export function HardShadow({ children, pressed = false, radius = r.card, shadow = true, grow = true, style }: Props) {
  const { colors, reduceMotion } = useTheme();
  // 0 = rest, 1 = pressed. Native driver: translation only, so no layout work per frame.
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reduce Motion: no translation at all, the state change is still conveyed by the OS highlight.
    if (reduceMotion) return;
    Animated.timing(t, { toValue: pressed ? 1 : 0, duration: motion.press, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [pressed, reduceMotion, t]);

  // Content travels (3,3) onto a fixed shadow, which leaves the visible 1px offset.
  const { x, y } = hardShadow.pressTranslate;
  return (
    <View style={[{ marginRight: sx, marginBottom: sy, flexGrow: grow ? 1 : 0 }, style]}>
      {/* Disabled controls drop the shadow entirely (spec: no shadow at 40% opacity). */}
      {shadow && (
        <View pointerEvents="none" style={{ position: 'absolute', top: sy, left: sx, right: -sx, bottom: -sy, borderRadius: radius, backgroundColor: colors.ink }} />
      )}
      <Animated.View
        style={{
          flexGrow: grow ? 1 : 0,
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, shadow ? x : 0] }) },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, shadow ? y : 0] }) },
          ],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

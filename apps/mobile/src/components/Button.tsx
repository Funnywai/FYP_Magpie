import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { border, radius, touch } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { HardShadow } from './HardShadow';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

type Props = {
  label?: string;
  /** Optional SVG icon before the label; icon-only buttons must pass accessibilityLabel. */
  icon?: IconName;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  /** Toggle buttons (like / save) expose their on/off state. */
  selected?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, icon, onPress, variant = 'primary', disabled, selected, accessibilityLabel, accessibilityHint, style }: Props) {
  const { colors } = useTheme();
  // ghost = text-only: no border, no shadow, underlined so it still reads as a link.
  const ghost = variant === 'ghost';
  const fg = variant === 'primary' ? 'onAccent' : ghost ? 'accentText' : 'text';
  const bg = variant === 'primary' ? colors.accent : ghost ? 'transparent' : colors.surface;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      // Disabled: 40% opacity per spec; the shadow is removed below.
      // 48 satisfies both iOS 44pt and Android 48dp.
      style={[{ minHeight: touch.button, opacity: disabled ? 0.4 : 1 }, style]}
    >
      {({ pressed }) => (
        <HardShadow pressed={pressed} radius={radius.button} shadow={!ghost && !disabled}>
          <View
            style={{
              flexGrow: 1,
              minHeight: touch.button,
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: radius.button,
              borderWidth: ghost ? 0 : border.width,
              borderColor: colors.ink,
              backgroundColor: bg,
            }}
          >
            {icon && <Icon name={icon} size={20} color={fg} />}
            {label !== undefined && (
              <Txt type="body" bold color={fg} style={[{ textAlign: 'center' }, ghost ? { textDecorationLine: 'underline' } : null]}>
                {label}
              </Txt>
            )}
          </View>
        </HardShadow>
      )}
    </Pressable>
  );
}

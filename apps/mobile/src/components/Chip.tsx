import { Pressable, View } from 'react-native';

import { border, radius } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

type Props = { label: string; icon?: IconName; selected: boolean; onPress: () => void };

export function Chip({ label, icon, selected, onPress }: Props) {
  const { colors } = useTheme();
  return (
    // 44pt hit area around the 36pt visual chip.
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress} style={{ minHeight: 44, justifyContent: 'center' }}>
      <View
        style={{
          // minHeight, not height: the chip must grow with 200% text.
          minHeight: 36,
          justifyContent: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          borderWidth: border.width,
          borderColor: colors.ink,
          borderRadius: radius.button,
          backgroundColor: selected ? colors.accent : colors.surface,
        }}
      >
        {icon && <Icon name={icon} size={18} color={selected ? 'onAccent' : 'ink'} />}
        <Txt type="body" bold={selected} color={selected ? 'onAccent' : 'text'}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}

import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { useLang } from '../i18n/LangProvider';
import { border, fonts, hardShadow, radius, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { HardShadow } from './HardShadow';
import { Icon } from './Icon';

type Props = { value: string; onChangeText: (text: string) => void; placeholder: string };

// Focus ring: 3px accent, pushed 2px outside the bar.
const ring = border.focusWidth + border.focusOffset;

export function SearchBar({ value, onChangeText, placeholder }: Props) {
  const { colors } = useTheme();
  const { s } = useLang();
  // Focus is drawn as an extra ring, so the 2px border never changes size.
  const [focused, setFocused] = useState(false);
  return (
    // Extra bottom margin keeps the shadow clear of the next element.
    <HardShadow radius={radius.input} style={{ marginBottom: hardShadow.rest.y }}>
      <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, gap: 8, backgroundColor: colors.surface, borderWidth: border.width, borderColor: colors.ink, borderRadius: radius.input }}>
        {focused && (
          <View pointerEvents="none" style={{ position: 'absolute', top: -ring, left: -ring, right: -ring, bottom: -ring, borderWidth: border.focusWidth, borderColor: colors.accentText, borderRadius: radius.input + border.focusOffset }} />
        )}
        <Icon name="search" size={20} />
        <TextInput
          accessibilityLabel={s.searchLabel}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          maxFontSizeMultiplier={2}
          style={{ flex: 1, minHeight: 44, fontFamily: fonts.sans, fontSize: typography.body.fontSize, color: colors.text }}
        />
        {value.length > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel={s.clearSearch} onPress={() => onChangeText('')} hitSlop={4} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={20} />
          </Pressable>
        )}
      </View>
    </HardShadow>
  );
}

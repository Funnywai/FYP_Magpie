import { Pressable, View } from 'react-native';

import { border, radius } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Txt } from './Txt';

type Props<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
};

/** Segmented control exposed to screen readers as a radio group. */
// Generic over the option value so callers keep their literal types.
export function Segmented<T extends string>({ label, options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        // Selection is also shown with a leading ✓ so colour is never the only cue.
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on, checked: on }}
            onPress={() => onChange(o.value)}
            style={{ flexGrow: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, backgroundColor: on ? colors.accent : colors.surface, borderWidth: border.width, borderColor: colors.ink, borderRadius: radius.button }}
          >
            <Txt type="body" bold={on} color={on ? 'onAccent' : 'text'}>
              {on ? `✓ ${o.label}` : o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

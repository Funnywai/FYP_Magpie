import { View } from 'react-native';

import { border, radius, type ColorTokens } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { useLang } from '../i18n/LangProvider';
import { confidenceLevel, type ConfidenceLevel } from '../utils/format';
import { Txt } from './Txt';

const look: Record<ConfidenceLevel, { icon: string; bg: keyof ColorTokens; fg: keyof ColorTokens }> = {
  high: { icon: '✓', bg: 'success', fg: 'onSuccess' },
  mid: { icon: '!', bg: 'warning', fg: 'onWarning' },
  low: { icon: '⚠', bg: 'danger', fg: 'onDanger' },
};

/** Number + icon (never colour alone); read aloud as "Confidence 46%, please check". */
export function ConfidenceBadge({ value }: { value: number }) {
  const { colors } = useTheme();
  const { s } = useLang();
  // Thresholds live in confidenceLevel() so the badge and tests share one definition.
  const l = look[confidenceLevel(value)];
  return (
    <View
      accessible
      accessibilityLabel={s.confidence(value)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors[l.bg], borderWidth: border.width, borderColor: colors.ink, borderRadius: radius.tag, paddingHorizontal: 8, paddingVertical: 2 }}
    >
      <Txt type="caption" bold latin color={l.fg} aria-hidden>
        {`${l.icon} ${value}%`}
      </Txt>
    </View>
  );
}

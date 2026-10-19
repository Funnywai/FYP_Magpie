import { Pressable, View } from 'react-native';

import type { Field } from '../mocks/items';
import { border, radius } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { useLang } from '../i18n/LangProvider';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Icon } from './Icon';
import { Tag } from './Tag';
import { Txt } from './Txt';

type Props = { field: Field; onPress: () => void };

export function FieldRow({ field, onPress }: Props) {
  const { colors } = useTheme();
  const { s, loc } = useLang();
  // Below 50% the row gets a warning border plus an explicit text flag.
  const low = field.confidence < 50;
  return (
    <Pressable
      accessibilityRole="button"
      // One spoken sentence: label, value, confidence (with a review flag when low), evidence.
      accessibilityLabel={`${loc(field.label)}: ${field.value}. ${s.confidence(field.confidence)}. ${s.evidence}: ${field.evidence}${field.corrected ? `. ${s.corrected}` : ''}`}
      accessibilityHint={s.editHint}
      onPress={onPress}
      style={{
        minHeight: 48,
        padding: 12,
        gap: 4,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: border.width,
        borderColor: low ? colors.warningText : colors.ink,
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Txt type="caption" color="textSecondary">
          {loc(field.label)}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {field.corrected && <Tag>{s.corrected}</Tag>}
          {low && (
            // Sibling layout: SVG cannot be nested inside native <Text>.
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="alert" size={14} color="warningText" />
              <Txt type="caption" bold color="warningText">
                {s.needsReview}
              </Txt>
            </View>
          )}
          <ConfidenceBadge value={field.confidence} />
        </View>
      </View>
      <Txt type="body" bold>
        {field.value}
      </Txt>
      {/* Evidence is monospace so timestamps line up and read as citations. */}
      <Txt type="caption" mono color="textSecondary">
        {field.evidence}
      </Txt>
    </Pressable>
  );
}

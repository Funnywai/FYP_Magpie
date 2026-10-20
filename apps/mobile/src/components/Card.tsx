import { Platform, Pressable, View, useWindowDimensions, type TextStyle } from 'react-native';

import type { Item } from '../mocks/items';
import { border, layout, radius } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { useLang } from '../i18n/LangProvider';
import { platformLabel } from '../utils/format';
import { HardShadow } from './HardShadow';
import { Icon } from './Icon';
import { StatusPill } from './StatusPill';
import { Tag } from './Tag';
import { TicketDivider } from './TicketDivider';
import { Thumb } from './Thumb';
import { Txt } from './Txt';

const keepAll: TextStyle & { wordBreak?: 'keep-all' } = { wordBreak: 'keep-all' };

type Props = {
  item: Item;
  /** row: thumbnail left + ticket stub; stack: thumbnail on top. */
  variant: 'row' | 'stack';
  onPress: () => void;
  onLongPress?: () => void;
  /** At most one tilted sticker per card. */
  tilt?: boolean;
};

export function Card({ item, variant, onPress, onLongPress, tilt }: Props) {
  // Colours and width drive the thumbnail size and borders below.
  const { colors } = useTheme();
  const { s, loc } = useLang();
  const { width } = useWindowDimensions();
  // Row cards shrink the thumbnail to 88px on <=360px phones.
  // Variant flag: row = list layout, stack = grid layout.
  const row = variant === 'row';
  // Narrow row cards get a 15px title so CJK titles do not strand one character on line 2.
  const compactTitle = row && width < 420;
  const thumbW = width <= layout.smallPhoneWidth ? layout.thumbRowSmall : layout.thumbRow;
  // Local reaction/save state echoed on the card so long-press actions are visible.

  // Screen-reader summary: status, relevance, failure reason and the weakest confidence.
  const label = [
    item.title,
    `${platformLabel[item.platform]} ${s.contentLabel[item.contentType]}`,
    s.statusLabel[item.status],
    item.status === 'done' && item.relevance > 0 ? s.relevance(item.relevance) : '',
    item.failure ? `${loc(item.failure.reason)}, ${loc(item.failure.next)}` : '',
    item.fields.length ? s.lowestConf(s.confidence(Math.min(...item.fields.map((f) => f.confidence)))) : '',
  ]
    .filter(Boolean)
    .join(', ');

  // Only the title is truncated (2 lines); status and failure text always wrap in full.
  const body = (
    <View style={{ flex: 1, padding: 12, gap: 6, justifyContent: 'center' }}>
      <Txt
        type="heading"
        numberOfLines={2}
        lineBreakStrategyIOS="push-out"
        textBreakStrategy="balanced"
        style={[
          compactTitle ? { fontSize: 15, lineHeight: 22 } : null,
          Platform.OS === 'web' ? keepAll : null,
        ]}
      >
        {item.title}
      </Txt>
      <Txt type="caption" color="textSecondary">
        {loc(item.meta)}
      </Txt>
      {(item.reaction || item.saved) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {item.reaction === 'like' && <Icon name="thumbUp" size={16} />}
          {item.reaction === 'dislike' && <Icon name="thumbDown" size={16} />}
          {item.saved && <Icon name="star" size={16} filled color="accent" />}
          {item.saved && <Txt type="caption">{s.saved}</Txt>}
        </View>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {item.status === 'done' && item.relevance > 0 ? <Tag sparkle tilt={tilt}>{s.relevance(item.relevance)}</Tag> : <StatusPill status={item.status} />}
      </View>
      {item.failure && (
        <Txt type="caption">
          {loc(item.failure.reason)}
          {'\n'}
          <Txt type="caption" bold>
            {s.nextStep}{loc(item.failure.next)}
          </Txt>
        </Txt>
      )}
    </View>
  );

  return (
    // Whole card is one control; flexGrow lets grid neighbours share the tallest height.
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={s.cardHint} onPress={onPress} onLongPress={onLongPress} style={{ flexGrow: 1 }}>
      {({ pressed }) => (
        <HardShadow pressed={pressed}>
          <View
            style={{
              flexGrow: 1,
              flexDirection: row ? 'row' : 'column',
              backgroundColor: colors.surface,
              borderWidth: border.width,
              borderColor: colors.ink,
              borderRadius: radius.card,
              overflow: 'hidden',
            }}
          >
            <View style={{ padding: 8, width: row ? thumbW + 16 : undefined, alignSelf: row ? 'flex-start' : 'stretch' }}>
              <Thumb item={item} ratio={row ? 1 : 16 / 9} />
            </View>
            {row && <TicketDivider />}
            {body}
          </View>
        </HardShadow>
      )}
    </Pressable>
  );
}

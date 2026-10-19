import type { ItemStatus } from '@magpie/shared';
import { View } from 'react-native';

import { border, radius, type ColorTokens } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { useLang } from '../i18n/LangProvider';
import { statusIcon } from '../utils/format';
import { Icon } from './Icon';
import { Txt } from './Txt';

const palette: Record<ItemStatus, { bg: keyof ColorTokens; fg: keyof ColorTokens }> = {
  queued: { bg: 'sage', fg: 'onTag' },
  processing: { bg: 'tag', fg: 'onTag' },
  done: { bg: 'success', fg: 'onSuccess' },
  needs_media: { bg: 'warning', fg: 'onWarning' },
  failed: { bg: 'danger', fg: 'onDanger' },
};

/** Icon + text, so status never relies on colour alone. */
export function StatusPill({ status }: { status: ItemStatus }) {
  const { colors } = useTheme();
  const { s } = useLang();
  const text = s.statusLabel[status];
  // Each status owns a fill + an on-fill text colour that both clear 4.5:1.
  const p = palette[status];
  return (
    <View
      accessible
      // Read as one phrase; the inner icon glyph is hidden from the screen reader.
      accessibilityLabel={s.statusA11y(text)}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors[p.bg],
        borderWidth: border.width,
        borderColor: colors.ink,
        borderRadius: radius.tag,
        paddingHorizontal: 8,
        paddingVertical: 2,
      }}
    >
      <Icon name={statusIcon[status]} size={14} color={p.fg} />
      <Txt type="caption" bold color={p.fg}>
        {text}
      </Txt>
    </View>
  );
}

import { Text, type TextProps } from 'react-native';

import { fonts, typography, type ColorTokens, type TypeRole } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type Props = TextProps & {
  /** Type-scale role (not RN's ARIA `role`). */
  type?: TypeRole;
  color?: keyof ColorTokens;
  /** System monospace: timestamps and evidence only. */
  mono?: boolean;
  /** Latin-optimised Inter (digits, platform marks). */
  latin?: boolean;
  bold?: boolean;
};

/** The single text primitive: applies the type scale, theme colour, and dynamic-type cap. */
export function Txt({ type = 'body', color = 'text', mono, latin, bold, style, maxFontSizeMultiplier = 2, ...rest }: Props) {
  const { colors, mono: monoFamily, boldText } = useTheme();
  // Role gives size/line-height; colour always comes from the theme, never a literal.
  const base = typography[type];
  // OS Bold Text and the explicit `bold` prop both promote body-ish roles to the 700 weight.
  const heavy = bold || boldText;
  // Serif display/title are already 900, so they are left alone.
  let family: string = base.fontFamily;
  if (mono) family = monoFamily;
  else if (latin) family = heavy ? fonts.latinBold : fonts.latinMedium;
  else if (heavy && type !== 'display' && type !== 'title') family = fonts.sansBold;
  // maxFontSizeMultiplier 2 = the 200% dynamic-type layout target.
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[{ fontSize: base.fontSize, lineHeight: base.lineHeight, fontFamily: family, color: colors[color] }, mono && heavy ? { fontWeight: '700' } : null, style]}
      {...rest}
    />
  );
}

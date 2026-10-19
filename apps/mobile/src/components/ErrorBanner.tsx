import { View } from 'react-native';

import { useLang } from '../i18n/LangProvider';
import { border, radius } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Button } from './Button';
import { Icon } from './Icon';
import { Txt } from './Txt';

type Props = { message: string; onRetry: () => void };

/** Warning icon + words + a retry action: the error is never colour-only. */
export function ErrorBanner({ message, onRetry }: Props) {
  const { colors } = useTheme();
  const { s } = useLang();
  return (
    <View
      // role=alert makes screen readers announce it when it appears.
      accessibilityRole="alert"
      style={{ gap: 8, padding: 12, backgroundColor: colors.surface, borderWidth: border.width, borderColor: colors.dangerText, borderRadius: radius.card }}
    >
      <Txt type="body" bold color="dangerText">
        <Icon name="alert" size={18} color="dangerText" /> {message}
      </Txt>
      <Button label={s.retry} variant="secondary" onPress={onRetry} />
    </View>
  );
}

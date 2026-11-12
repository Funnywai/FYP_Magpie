import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AuthClientError } from '../../auth/AuthProvider';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { useLang } from '../../i18n/LangProvider';
import { border, layout, radius, spacing, touch } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

interface Props {
  mode: 'signIn' | 'signUp';
  title: string;
  submitLabel: string;
  switchLabel: string;
  onSwitch: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function AuthForm({ mode, title, submitLabel, switchLabel, onSwitch, onSubmit }: Props) {
  const { colors } = useTheme();
  const { s } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError(s.authMissingFields);
      return;
    }
    if (mode === 'signUp' && password.length < 8) {
      setError(s.authPasswordTooShort);
      return;
    }
    setBusy(true);
    try {
      await onSubmit(email.trim(), password);
    } catch (authError) {
      if (authError instanceof AuthClientError && authError.code === 'email_not_confirmed') {
        setError(s.authEmailNotConfirmed);
      } else if (authError instanceof AuthClientError && authError.code === 'invalid_credentials') {
        setError(s.authInvalidCredentials);
      } else {
        setError(s.authGenericError);
      }
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    minHeight: touch.button,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    borderWidth: border.width,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    color: colors.text,
  } as const;

  return (
    <Screen>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: spacing.xxl,
          gap: spacing.lg,
          width: '100%',
          maxWidth: layout.modalWidth,
          alignSelf: 'center',
        }}
      >
        <Txt type="display" accessibilityRole="header">
          {title}
        </Txt>

        <Txt type="caption">{s.authEmail}</Txt>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          accessibilityLabel={s.authEmail}
          placeholderTextColor={colors.textSecondary}
          style={inputStyle}
        />

        <Txt type="caption">{s.authPassword}</Txt>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          accessibilityLabel={s.authPassword}
          placeholderTextColor={colors.textSecondary}
          style={inputStyle}
        />

        {error !== null && (
          <Txt type="body" color="dangerText" accessibilityRole="alert">
            {error}
          </Txt>
        )}

        <Button label={submitLabel} onPress={() => void submit()} disabled={busy} />
        <Button label={switchLabel} variant="ghost" onPress={onSwitch} />
      </View>
    </Screen>
  );
}

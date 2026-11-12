import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { useLang } from '../../i18n/LangProvider';
import type { RootParamList } from '../../navigation/types';
import { spacing } from '../../theme/tokens';
import { AuthForm } from './AuthForm';

type Props = NativeStackScreenProps<RootParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const { s } = useLang();
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  if (needsConfirmation) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xxl, gap: spacing.lg }}>
          <Txt type="title" accessibilityRole="header">
            {s.authCheckEmail}
          </Txt>
          <Button label={s.authToSignIn} variant="secondary" onPress={() => navigation.navigate('Login')} />
        </View>
      </Screen>
    );
  }

  return (
    <AuthForm
      mode="signUp"
      title={s.authSignUpTitle}
      submitLabel={s.authSignUp}
      switchLabel={s.authToSignIn}
      onSwitch={() => navigation.navigate('Login')}
      onSubmit={async (email, password) => {
        const result = await signUp(email, password);
        setNeedsConfirmation(result.needsConfirmation);
      }}
    />
  );
}

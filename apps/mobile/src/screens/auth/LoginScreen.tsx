import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../auth/AuthProvider';
import { useLang } from '../../i18n/LangProvider';
import type { RootParamList } from '../../navigation/types';
import { AuthForm } from './AuthForm';

type Props = NativeStackScreenProps<RootParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const { s } = useLang();

  return (
    <AuthForm
      mode="signIn"
      title={s.authSignInTitle}
      submitLabel={s.authSignIn}
      switchLabel={s.authToSignUp}
      onSwitch={() => navigation.navigate('Signup')}
      onSubmit={signIn}
    />
  );
}

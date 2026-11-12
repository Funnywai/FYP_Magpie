import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './auth/AuthProvider';
import { LangProvider } from './i18n/LangProvider';
import { RootNavigator } from './navigation/RootNavigator';
import { ItemsProvider } from './state/ItemsProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import { useTheme } from './theme/useTheme';

function Shell() {
  const { mode } = useTheme();
  return (
    <>
      <RootNavigator />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

// Provider order: safe area -> theme (fonts) -> language -> data -> navigation.
export function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <ItemsProvider>
            <Shell />
          </ItemsProvider>
        </AuthProvider>
      </LangProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { DetailScreen } from '../screens/DetailScreen';
import { ShareScreen } from '../screens/ShareScreen';
import { motion } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { TabNavigator } from './TabNavigator';
import type { RootParamList } from './types';

const Stack = createNativeStackNavigator<RootParamList>();

export function RootNavigator() {
  const { colors, mode, reduceMotion } = useTheme();
  // Map our tokens onto React Navigation's theme so its containers never flash default colours.
  // Memoised so NavigationContainer does not re-theme on every render.
  const theme = useMemo<Theme>(
    () => ({ ...DefaultTheme, dark: mode === 'dark', colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.ink, primary: colors.accentText } }),
    [colors, mode],
  );
  return (
    <NavigationContainer theme={theme}>
      {/* Transitions use the 180ms token and switch off with Reduce Motion. */}
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'slide_from_right', animationDuration: motion.transition, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        {/* The sheet animates itself, so the route itself is transparent and instant. */}
        <Stack.Screen name="Share" component={ShareScreen} options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

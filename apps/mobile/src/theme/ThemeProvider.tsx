import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  NotoSansTC_400Regular,
  NotoSansTC_500Medium,
  NotoSansTC_700Bold,
} from '@expo-google-fonts/noto-sans-tc';
import { NotoSerifTC_900Black } from '@expo-google-fonts/noto-serif-tc';
import { useFonts } from 'expo-font';
import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Platform, useColorScheme } from 'react-native';

import {
  colors,
  monoFamily,
  type ColorTokens,
  type ThemeMode,
  type ThemeModePreference,
} from './tokens';

export type Theme = {
  mode: ThemeMode;
  preference: ThemeModePreference;
  setPreference: (next: ThemeModePreference) => void;
  colors: ColorTokens;
  /** System monospace family for timestamps and evidence. */
  mono: string;
  /** OS "Reduce Motion": disable translation/transitions, keep state changes. */
  reduceMotion: boolean;
  /** OS "Bold Text" (iOS). */
  boldText: boolean;
};

export const ThemeContext = createContext<Theme | null>(null);

const fontMap = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  NotoSansTC_400Regular,
  NotoSansTC_500Medium,
  NotoSansTC_700Bold,
  NotoSerifTC_900Black,
};

const mono = Platform.select({
  ios: monoFamily.ios,
  android: monoFamily.android,
  default: monoFamily.web,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<ThemeModePreference>('system');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [boldText, setBoldText] = useState(false);
  // Fonts are bundled via @expo-google-fonts, so this resolves without network access.
  const [fontsLoaded, fontError] = useFonts(fontMap);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const a = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    // Bold Text is an iOS-only setting; web has no such API and would throw.
    if (Platform.OS !== 'ios') return () => a.remove();
    void AccessibilityInfo.isBoldTextEnabled().then(setBoldText);
    const b = AccessibilityInfo.addEventListener('boldTextChanged', setBoldText);
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  const mode: ThemeMode = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<Theme>(
    () => ({ mode, preference, setPreference, colors: colors[mode], mono, reduceMotion, boldText }),
    [mode, preference, reduceMotion, boldText],
  );

  // ponytail: render nothing while fonts load (no splash dep allowed). A font error falls
  // through to system fonts rather than a blank screen.
  if (!fontsLoaded && !fontError) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

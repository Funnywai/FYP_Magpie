import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { Screen } from '../components/Screen';
import { Segmented } from '../components/Segmented';
import { Txt } from '../components/Txt';
import { useLang } from '../i18n/LangProvider';
import { border, radius } from '../theme/tokens';
import type { ThemeModePreference } from '../theme/tokens';
import { useLayout } from '../theme/useLayout';
import { useTheme } from '../theme/useTheme';

// Titled bordered group used by every settings row.
function Row({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        backgroundColor: colors.surface,
        borderWidth: border.width,
        borderColor: colors.ink,
        borderRadius: radius.card,
      }}
    >
      <Txt type="heading" accessibilityRole="header">
        {title}
      </Txt>
      {children}
    </View>
  );
}

export function SettingsScreen() {
  const { preference, setPreference } = useTheme();
  const { lang, setLang, s } = useLang();
  const L = useLayout();
  // `satisfies` checks the options against the real token types without widening them.
  const appearance = [
    { value: 'system', label: s.themeSystem },
    { value: 'light', label: s.themeLight },
    { value: 'dark', label: s.themeDark },
  ] as const satisfies readonly { value: ThemeModePreference; label: string }[];

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: L.padTop + 12,
          paddingLeft: L.padLeft,
          paddingRight: L.padRight,
          paddingBottom: L.padBottom + 24,
          gap: 16,
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
        }}
      >
        <Txt type="display" accessibilityRole="header">
          {s.settingsTitle}
        </Txt>
        <Row title={s.appearance}>
          {/* Writes straight to ThemeProvider, so the switch is real. */}
          <Segmented
            label={s.appearance}
            options={appearance}
            value={preference}
            onChange={setPreference}
          />
        </Row>
        <Row title={s.language}>
          <Segmented
            label={s.language}
            options={[
              { value: 'zh', label: s.langZh },
              { value: 'en', label: s.langEn },
            ]}
            value={lang}
            onChange={setLang}
          />
        </Row>
      </ScrollView>
    </Screen>
  );
}

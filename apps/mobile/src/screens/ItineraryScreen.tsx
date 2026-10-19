import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Chip } from '../components/Chip';
import { Icon, type IconName } from '../components/Icon';
import { Screen } from '../components/Screen';
import { ScreenGate } from '../components/ScreenGate';
import { Tag } from '../components/Tag';
import { Txt } from '../components/Txt';
import { useLang } from '../i18n/LangProvider';
import { mockDays, type Weather } from '../mocks/itinerary';
import { border, radius } from '../theme/tokens';
import { useLayout } from '../theme/useLayout';
import { useTheme } from '../theme/useTheme';

// Weather kind -> icon name.
const weatherIcon: Record<Weather['kind'], IconName> = { sun: 'sun', cloud: 'cloud', rain: 'rain' };
// Icon + word for indoor/outdoor so the cue is never icon-only.
const settingMeta = {
  indoor: { icon: 'home' },
  outdoor: { icon: 'mountain' },
  mixed: { icon: 'cloud' },
} as const;

/** Static placeholder: day tabs, weather strip, vertical timeline. */
export function ItineraryScreen() {
  const { colors } = useTheme();
  const { s, loc } = useLang();
  // Tab screen: the sidebar (if any) already consumes the left inset.
  const L = useLayout();
  // Day tabs only switch local state.
  const [day, setDay] = useState(0);
  // Fallback guard satisfies noUncheckedIndexedAccess.
  const d = mockDays[day] ?? mockDays[0];
  if (!d) return null;

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: L.padTop + 12,
          paddingLeft: L.padLeft,
          paddingRight: L.padRight,
          paddingBottom: L.padBottom + 24,
          gap: 12,
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
        }}
      >
        <Txt type="display" accessibilityRole="header">
          {s.itineraryTitle}
        </Txt>
        <ScreenGate emptyTitle={s.itineraryEmptyTitle} emptyHint={s.itineraryEmptyHint}>
          <View
            accessibilityRole="tablist"
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
          >
            {mockDays.map((m, i) => (
              <Chip key={m.label} label={m.label} selected={i === day} onPress={() => setDay(i)} />
            ))}
          </View>
          <View
            accessible
            accessibilityLabel={s.weatherA11y(loc(d.weather.label), d.weather.temp, !!d.adjusted)}
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              backgroundColor: colors.surface,
              borderWidth: border.width,
              borderColor: colors.ink,
              borderRadius: radius.card,
            }}
          >
            {/* Temperature and condition are text as well as an icon. */}
            <Icon name={weatherIcon[d.weather.kind]} size={28} />
            <Txt type="heading">
              {loc(d.weather.label)} · {d.weather.temp}
            </Txt>
            {d.adjusted && <Tag tilt>{s.rainAdjusted}</Tag>}
          </View>
          {/* Timeline: dot column + connecting ink line, content on the right. */}
          <View>
            {d.stops.map((stop, i) => {
              const meta = settingMeta[stop.setting];
              const setting = s[stop.setting];
              const last = i === d.stops.length - 1;
              return (
                <View
                  key={stop.time}
                  accessible
                  accessibilityLabel={`${stop.time}, ${stop.title}, ${setting}`}
                  style={{ flexDirection: 'row', gap: 12 }}
                >
                  <View style={{ width: 20, alignItems: 'center' }}>
                    <View
                      style={{
                        marginTop: 6,
                        width: 16,
                        height: 16,
                        borderRadius: radius.full,
                        backgroundColor: colors.accent,
                        borderWidth: border.width,
                        borderColor: colors.ink,
                      }}
                    />
                    {!last && (
                      <View style={{ flex: 1, width: border.width, backgroundColor: colors.ink }} />
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 4, paddingBottom: last ? 0 : 20 }}>
                    <Txt type="caption" mono color="textSecondary">
                      {stop.time}
                    </Txt>
                    <Txt type="heading">{stop.title}</Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon name={meta.icon} size={16} />
                      <Txt type="caption">{setting}</Txt>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScreenGate>
      </ScrollView>
    </Screen>
  );
}

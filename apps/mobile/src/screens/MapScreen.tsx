import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, View } from 'react-native';
import Svg, { Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { iconPaths } from '../components/Icon';
import { Screen } from '../components/Screen';
import { ScreenGate } from '../components/ScreenGate';
import { Txt } from '../components/Txt';
import { useLang } from '../i18n/LangProvider';
import type { RootNav } from '../navigation/types';
import { useItems } from '../state/ItemsProvider';
import { border, fonts, motion, radius } from '../theme/tokens';
import { useLayout } from '../theme/useLayout';
import { useTheme } from '../theme/useTheme';

// Pin hit area is 48px even though the glyph is smaller.
const PIN = 48;

/** Stylised paper map drawn with SVG: grid, sea, island, thick ink roads. No map SDK. */
function PaperMap() {
  const { colors } = useTheme();
  const { s } = useLang();
  // Light dotted grid lines every 10 units.
  const grid = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <Rect width={100} height={100} fill={colors.surface} />
      {grid.map((g) => (
        <G key={g}>
          <Line x1={g} y1={0} x2={g} y2={100} stroke={colors.textSecondary} strokeWidth={0.25} strokeDasharray="1 1.5" />
          <Line x1={0} y1={g} x2={100} y2={g} stroke={colors.textSecondary} strokeWidth={0.25} strokeDasharray="1 1.5" />
        </G>
      ))}
      {/* Harbour, island and Hong Kong Island shapes. */}
      <Path d="M0 54 L38 58 L66 56 L100 58 L100 64 L66 63 L40 66 L0 62 Z" fill={colors.sage} stroke={colors.ink} strokeWidth={0.8} />
      <Ellipse cx={14} cy={78} rx={14} ry={14} fill={colors.sage} stroke={colors.ink} strokeWidth={0.8} />
      <Polygon points="44,64 100,66 100,100 52,100" fill={colors.background} stroke={colors.ink} strokeWidth={0.8} />
      {/* Thick ink roads, widest for the main route. */}
      <Path d="M44 0 L50 20 L56 40 L58 54" stroke={colors.ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Path d="M6 30 L44 30 L84 26" stroke={colors.ink} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M54 18 L96 22" stroke={colors.ink} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Path d="M52 72 L74 72 L96 78" stroke={colors.ink} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M20 70 L8 84" stroke={colors.ink} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <SvgText x={70} y={61} fontSize={3.4} fontFamily={fonts.sansBold} fill={colors.ink}>
        {s.mapSea}
      </SvgText>
    </Svg>
  );
}

// Pin reuses the shared icon path, filled accent with an ink outline.
function PinGlyph({ big }: { big: boolean }) {
  const { colors } = useTheme();
  const s = big ? 40 : 30;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path d={iconPaths.pin} fill={colors.accent} stroke={colors.ink} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export function MapScreen() {
  const nav = useNavigation<RootNav>();
  const { colors, reduceMotion } = useTheme();
  const { s } = useLang();
  // Items come from shared state, so likes and saves show on the map card too.
  const { items } = useItems();
  const L = useLayout();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 0 = hidden, 1 = shown.
  const rise = useRef(new Animated.Value(0)).current;
  const selected = items.find((it) => it.id === selectedId);
  // Only items that carry map coordinates get a pin; the mock data has none yet (ponytail: add `pin` to items when real places exist).
  const pins = items.filter((it) => it.pin);

  // Card rises from the bottom (180ms); instant under Reduce Motion.
  useEffect(() => {
    Animated.timing(rise, { toValue: selected ? 1 : 0, duration: reduceMotion ? 0 : motion.transition, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [selected, reduceMotion, rise]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: L.padTop + 12, paddingLeft: L.padLeft, paddingRight: L.padRight, paddingBottom: 260, gap: 12 }}>
        <Txt type="display" accessibilityRole="header">
          {s.mapTitle}
        </Txt>
        <ScreenGate emptyTitle={s.mapEmptyTitle} emptyHint={s.mapEmptyHint}>
          <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', aspectRatio: 1, borderWidth: border.width, borderColor: colors.ink, borderRadius: radius.card, overflow: 'hidden' }}>
            {/* The map is decorative; pins carry the accessibility labels. */}
            <PaperMap />
            {pins.map((it) => {
              const on = it.id === selectedId;
              return (
                <Pressable
                  key={it.id}
                  accessibilityRole="button"
                  accessibilityLabel={s.mapPin(it.title)}
                  accessibilityState={{ selected: on }}
                  onPress={() => setSelectedId(it.id)}
                  // Anchor the pin's tip (bottom centre) on the coordinate.
                  style={{ position: 'absolute', left: `${it.pin?.x ?? 0}%`, top: `${it.pin?.y ?? 0}%`, width: PIN, height: PIN, marginLeft: -PIN / 2, marginTop: -PIN, alignItems: 'center', justifyContent: 'flex-end', zIndex: on ? 2 : 1 }}
                >
                  <PinGlyph big={on} />
                </Pressable>
              );
            })}
          </View>
          <Txt type="caption" color="textSecondary">
            {pins.length ? s.mapTapHint : s.mapNoPins}
          </Txt>
        </ScreenGate>
      </ScrollView>
      {/* Bottom card rises with the selection; tapping another pin swaps it. */}
      {selected && (
        <Animated.View
          style={{ position: 'absolute', left: L.padLeft, right: L.padRight, bottom: L.padBottom + L.insets.bottom * 0 + 12, maxWidth: 640, alignSelf: 'center', opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}
        >
          {/* The button is a sibling of the card: a button inside a button breaks the accessibility tree. */}
          <Card item={selected} variant="row" onPress={() => nav.navigate('Detail', { id: selected.id })} />
          <Button label={s.viewDetails} onPress={() => nav.navigate('Detail', { id: selected.id })} style={{ marginTop: 8 }} />
        </Animated.View>
      )}
    </Screen>
  );
}

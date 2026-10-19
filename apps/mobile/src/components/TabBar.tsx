import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { useLang } from '../i18n/LangProvider';
import { tabMeta, type RootNav, type TabParamList } from '../navigation/types';
import { border, fontScale, layout } from '../theme/tokens';
import { useLayout } from '../theme/useLayout';
import { useTheme } from '../theme/useTheme';
import { HardShadow } from './HardShadow';
import { Icon } from './Icon';
import { Txt } from './Txt';

/** Bottom bar on phones, 88px left rail on tablets/landscape. Centre "+" is a raised 56px FAB. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  // Root navigation is needed to open the Share modal from inside the tabs.
  const { colors } = useTheme();
  const { s } = useLang();
  const root = useNavigation<RootNav>();
  const { sidebar, insets } = useLayout();
  const { width } = useWindowDimensions();
  // 10sp labels on <=360px phones, 11sp otherwise; Txt caps growth at 1.4x.
  const labelSize = width <= layout.smallPhoneWidth ? 10 : 11;

  // One render path for both layouts; only the container differs.
  const items = state.routes.map((route, index) => {
    const name = route.name as keyof TabParamList;
    const meta = tabMeta[name];
    const label0 = s[meta.label];
    const focused = state.index === index;
    const onPress = () => {
      void Haptics.selectionAsync();
      // The + never changes tab: it opens the Share modal above everything.
      if (name === 'ShareTab') return root.navigate('Share');
      const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
    };
    // Shared label so both layouts always show text under the icon.
    const label = (
      <Txt type="micro" bold={focused} color="text" maxFontSizeMultiplier={fontScale.tabLabelMax} style={{ fontSize: labelSize, textAlign: 'center' }}>
        {label0}
      </Txt>
    );

    if (name === 'ShareTab') {
      return (
        <Pressable
          key={route.key}
          accessibilityRole="button"
          accessibilityLabel={s.shareA11y}
          onPress={onPress}
          style={{ flexGrow: sidebar ? 0 : 1, flexBasis: sidebar ? undefined : 0, minHeight: 48, alignItems: 'center', top: sidebar ? 0 : -layout.fabRaise }}
        >
          {({ pressed }) => (
            <>
              <HardShadow pressed={pressed} radius={layout.fab / 2} grow={false}>
                <View style={{ width: layout.fab, height: layout.fab, borderRadius: layout.fab / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderWidth: border.width, borderColor: colors.ink }}>
                  <Icon name="plus" size={28} color="onAccent" />
                </View>
              </HardShadow>
              {label}
            </>
          )}
        </Pressable>
      );
    }
    return (
      <Pressable
        key={route.key}
        // Tabs expose role + selected state; labels are always visible.
        accessibilityRole="tab"
        accessibilityLabel={label0}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        style={{ flexGrow: sidebar ? 0 : 1, flexBasis: sidebar ? undefined : 0, width: sidebar ? layout.sidebarWidth : undefined, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingTop: 6, gap: 2 }}
      >
        <Icon name={meta.icon} filled={focused} color="ink" />
        {label}
        {/* Selected underline: 3px accent, always reserved so labels do not jump. */}
        <View style={{ height: border.focusWidth, width: 28, backgroundColor: focused ? colors.accentText : 'transparent' }} />
      </Pressable>
    );
  });

  // Landscape / tablet: left rail, scrollable so 5 items fit short screens.
  if (sidebar) {
    return (
      <View accessibilityRole="tablist" style={{ width: layout.sidebarWidth + insets.left, paddingLeft: insets.left, backgroundColor: colors.surface, borderRightWidth: border.width, borderColor: colors.ink }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}>{items}</ScrollView>
      </View>
    );
  }
  return (
    <View
      accessibilityRole="tablist"
      style={{ alignSelf: 'stretch', flexGrow: 0, flexShrink: 0, flexDirection: 'row', alignItems: 'flex-start', minHeight: layout.tabBarHeight, paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: insets.bottom, backgroundColor: colors.surface, borderTopWidth: border.width, borderColor: colors.ink }}
    >
      {items}
    </View>
  );
}

import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import type { IconName } from '../components/Icon';
import { Card } from '../components/Card';
import { CheckerBand } from '../components/CheckerBand';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { Screen } from '../components/Screen';
import { SearchBar } from '../components/SearchBar';
import { SkeletonCard } from '../components/Skeleton';
import { Tag } from '../components/Tag';
import { Txt } from '../components/Txt';
import { useLang } from '../i18n/LangProvider';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import type { Item } from '../mocks/items';
import type { RootNav } from '../navigation/types';
import { useItems } from '../state/ItemsProvider';
import { border, radius } from '../theme/tokens';
import { useLayout } from '../theme/useLayout';
import { useTheme } from '../theme/useTheme';

type FilterKey = 'all' | 'recipe' | 'place' | 'media' | 'processing';

// Local filtering of the mock list; "processing" covers both queued and processing.
function matches(item: Item, key: FilterKey): boolean {
  if (key === 'all') return true;
  if (key === 'processing') return item.status === 'queued' || item.status === 'processing';
  return item.contentType === key;
}

export function HomeScreen() {
  // Typed against the root stack so navigate('Detail') is checked.
  const nav = useNavigation<RootNav>();
  const { colors } = useTheme();
  const { s } = useLang();
  // Chip icons are SVG; the processing chip covers both queued and processing items.
  const filters = [
    { key: 'all', label: s.filterAll },
    { key: 'recipe', label: s.filterRecipe, icon: 'bowl' },
    { key: 'place', label: s.filterPlace, icon: 'pin' },
    { key: 'media', label: s.filterMedia, icon: 'film' },
    { key: 'processing', label: s.filterProcessing, icon: 'clock' },
  ] as const satisfies readonly { key: FilterKey; label: string; icon?: IconName }[];
  const { items, demo, setDemo, react, toggleSave } = useItems();
  // Layout numbers: columns, gutters and safe-area padding for this breakpoint.
  const L = useLayout();
  // Keyboard height is added to the list padding so the last rows stay reachable.
  const kb = useKeyboardHeight();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [menu, setMenu] = useState<Item | null>(null);
  // Held in a ref so unmounting mid-refresh cancels the timer.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Pull to refresh: show skeletons for 1s, then restore (no network involved).
  const refresh = () => {
    setRefreshing(true);
    timer.current = setTimeout(() => setRefreshing(false), 1000);
  };

  // Skeleton shows for pull-to-refresh or the Settings preview.
  const loading = refreshing || demo === 'loading';
  // Empty preview shows no rows regardless of the filter.
  const shown = demo === 'empty' ? [] : items.filter((it) => matches(it, filter));
  // Pad the last row so a lone card keeps column width instead of stretching.
  // Rows are padded to a full multiple of the column count.
  const data: (Item | null)[] = [...shown];
  while (!loading && data.length % L.cols !== 0) data.push(null);

  // Header scrolls with the list so the title area does not eat landscape height.
  const header = (
    <View style={{ gap: 16, paddingBottom: 8 }}>
      {/* Tiles are confined to this title block; body content never sits on a pattern. */}
      <CheckerBand style={{ borderWidth: border.width, borderColor: colors.ink, borderRadius: radius.card, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ backgroundColor: colors.background, borderRadius: radius.logo, paddingHorizontal: 8, paddingVertical: 2, flexShrink: 1 }}>
            <Txt type="display" color="accentText" accessibilityRole="header">
              Magpie
            </Txt>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={s.profile}
            onPress={() => nav.navigate('Main', { screen: 'Settings' })}
            style={{ width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tag, borderWidth: border.width, borderColor: colors.ink }}
          >
            <Txt type="heading" color="onTag" allowFontScaling={false}>
              喜
            </Txt>
          </Pressable>
        </View>
      </CheckerBand>
      {/* The query is cosmetic: there is no real search in this phase. */}
      <SearchBar value={query} onChangeText={setQuery} placeholder={s.searchPlaceholder} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityRole="tablist">
        {filters.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            icon={'icon' in f ? f.icon : undefined}
            // Chip selection filters locally and gives a selection haptic.
            selected={filter === f.key}
            onPress={() => {
              void Haptics.selectionAsync();
              setFilter(f.key);
            }}
          />
        ))}
      </ScrollView>
      <View accessible accessibilityLabel={s.foundA11y(shown.length)} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <Tag sparkle>AI</Tag>
        <Txt type="body">{s.found(shown.length)}</Txt>
      </View>
      {demo === 'error' && <ErrorBanner message={s.staleError} onRetry={() => setDemo('ready')} />}
    </View>
  );

  // ListEmptyComponent doubles as the skeleton host while loading.
  const empty = loading ? (
    <View>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  ) : (
    <EmptyState
      title={s.emptyTitle}
      hint={s.emptyHint}
      actionLabel={s.showAll}
      onAction={() => {
        setFilter('all');
        setDemo('ready');
      }}
    />
  );

  return (
    <Screen>
      <FlatList
        // A new key forces FlatList to remount when numColumns changes (rotation / resize).
        key={L.cols}
        data={loading ? [] : data}
        numColumns={L.cols}
        keyExtractor={(it, i) => it?.id ?? `pad-${i}`}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accentText} colors={[colors.accentText]} />}
        columnWrapperStyle={L.cols > 1 ? { gap: 12 } : undefined}
        contentContainerStyle={{ paddingTop: L.padTop + 12, paddingBottom: L.padBottom + 24 + kb, paddingLeft: L.padLeft, paddingRight: L.padRight }}
        // null = padding cell so the final row keeps column widths.
        renderItem={({ item, index }) =>
          item ? (
            <View style={{ flex: 1, marginBottom: 12 }}>
              <Card
                item={item}
                variant={L.cols === 1 ? 'row' : 'stack'}
                tilt={index === 0}
                onPress={() => nav.navigate('Detail', { id: item.id })}
                // Long press opens the quick-action sheet with a light haptic.
                onLongPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMenu(item);
                }}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )
        }
      />
      {/* Quick actions only mutate local state, then close. */}
      <BottomSheet visible={menu !== null} onClose={() => setMenu(null)} title={s.quickActions}>
        {menu && (
          <>
            <Txt type="heading" numberOfLines={2}>
              {menu.title}
            </Txt>
            <Button icon="thumbUp" label={s.like} variant="secondary" selected={menu.reaction === 'like'} onPress={() => { react(menu.id, 'like'); setMenu(null); }} />
            <Button icon="thumbDown" label={s.dislike} variant="secondary" selected={menu.reaction === 'dislike'} onPress={() => { react(menu.id, 'dislike'); setMenu(null); }} />
            <Button icon="star" label={menu.saved ? s.saved : s.addSave} selected={menu.saved} onPress={() => { toggleSave(menu.id); setMenu(null); }} />
          </>
        )}
      </BottomSheet>
    </Screen>
  );
}

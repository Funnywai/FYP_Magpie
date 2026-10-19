import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';

import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { FieldRow } from '../components/FieldRow';
import { HardShadow } from '../components/HardShadow';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { Skeleton } from '../components/Skeleton';
import { StatusPill } from '../components/StatusPill';
import { Tag } from '../components/Tag';
import { Thumb } from '../components/Thumb';
import { Txt } from '../components/Txt';
import { useLang } from '../i18n/LangProvider';
import type { Field } from '../mocks/items';
import type { RootNav, RootParamList } from '../navigation/types';
import { useItems } from '../state/ItemsProvider';
import { border, fonts, radius, typography } from '../theme/tokens';
import { useLayout } from '../theme/useLayout';
import { useTheme } from '../theme/useTheme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Txt type="heading" accessibilityRole="header">
        {title}
      </Txt>
      {children}
    </View>
  );
}

export function DetailScreen() {
  const nav = useNavigation<RootNav>();
  const { id } = useRoute<RouteProp<RootParamList, 'Detail'>>().params;
  const { colors } = useTheme();
  const { s, loc } = useLang();
  const { items, demo, setDemo, react, toggleSave, correct } = useItems();
  // Stack screen: all four safe-area insets apply.
  const L = useLayout(false);
  // `editing` is the field being edited (null = sheet closed); `draft` is the text box value.
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState('');
  // Transcript starts expanded so the evidence is visible without an extra tap.
  const [openTranscript, setOpenTranscript] = useState(true);
  // Looked up by id so reactions and corrections show up instantly.
  const item = items.find((it) => it.id === id);

  // 48px bordered back control; the OS gesture / hardware back also works.
  const back = (
    <Pressable accessibilityRole="button" accessibilityLabel={s.back} onPress={() => nav.goBack()} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: border.width, borderColor: colors.ink, borderRadius: radius.button }}>
      <Icon name="back" />
    </Pressable>
  );

  // Pending items have no extracted data yet; show placeholders instead of empty sections.
  // Queued/processing items and the loading preview share the placeholder UI.
  const pending = item?.status === 'queued' || item?.status === 'processing' || demo === 'loading';

  // Body picks one of: not found, error, or the full detail.
  const body = () => {
    if (!item || demo === 'empty') return <EmptyState title={s.notFoundTitle} hint={s.notFoundHint} actionLabel={s.back} onAction={() => nav.goBack()} />;
    if (demo === 'error') return <ErrorBanner message={s.loadError} onRetry={() => setDemo('ready')} />;
    return (
      <>
        <HardShadow>
          {/* Hero keeps 16:9 on every width; the shadow wraps the border. */}
          <Thumb item={item} ratio={16 / 9} />
        </HardShadow>
        {/* Opening the original post is the one outward link, and it only calls the OS. */}
        <Button label={s.openOriginal} variant="ghost" accessibilityHint={s.openOriginalHint} onPress={() => void Linking.openURL(item.url).catch(() => undefined)} style={{ alignSelf: 'flex-start' }} />
        <Txt type="title" accessibilityRole="header">
          {item.title}
        </Txt>
        <Txt type="caption" color="textSecondary">
          {loc(item.meta)}
        </Txt>
        <StatusPill status={item.status} />
        {item.failure && (
          <View accessible style={{ gap: 4, padding: 12, backgroundColor: colors.surface, borderWidth: border.width, borderColor: colors.dangerText, borderRadius: radius.card }}>
            {/* Icon beside the text, never inside it (native <Text> cannot host SVG). */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <Icon name="alert" size={18} color="dangerText" />
              <Txt type="body" bold color="dangerText" style={{ flex: 1 }}>
                {loc(item.failure.reason)}
              </Txt>
            </View>
            <Txt type="body">{s.nextStep}{loc(item.failure.next)}</Txt>
          </View>
        )}
        {pending && (
          <View accessible accessibilityLabel={s.processingA11y} style={{ gap: 8 }}>
            <Skeleton height={20} />
            <Skeleton height={20} width="70%" />
            <Skeleton height={72} />
          </View>
        )}
        {!pending && item.highlights.length > 0 && (
          // Each highlight starts with an AI sticker so provenance is explicit.
          <Section title={s.highlights}>
            {item.highlights.map((h) => (
              <View key={h} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Tag sparkle>AI</Tag>
                <Txt type="body" style={{ flex: 1 }}>
                  {h}
                </Txt>
              </View>
            ))}
          </Section>
        )}
        {/* Tapping a field opens the edit sheet seeded with its current value. */}
        {!pending && item.fields.length > 0 && (
          <Section title={s.fields}>
            {item.fields.map((f) => (
              <FieldRow
                key={f.id}
                field={f}
                onPress={() => {
                  setDraft(f.value);
                  setEditing(f);
                }}
              />
            ))}
          </Section>
        )}
        {!pending && item.transcript.length > 0 && (
          // Collapsible; the expanded state is announced to screen readers.
          <Section title={s.transcript}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${openTranscript ? s.collapse : s.expand} ${s.transcript}`} accessibilityState={{ expanded: openTranscript }} onPress={() => setOpenTranscript((o) => !o)} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={openTranscript ? 'chevronDown' : 'chevronRight'} size={20} />
              <Txt type="body" bold>
                {openTranscript ? s.collapse : s.expand} ({s.segments(item.transcript.length)})
              </Txt>
            </Pressable>
            {openTranscript &&
              item.transcript.map((seg) => (
                <View key={seg.at} accessible accessibilityLabel={`${seg.at}, ${s.langTag[seg.lang]}: ${seg.text}`} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 }}>
                  <Txt type="caption" mono color="textSecondary">
                    {seg.at}
                  </Txt>
                  <Tag>{s.langTag[seg.lang]}</Tag>
                  <Txt type="body" style={{ flexBasis: 160, flexGrow: 1, flexShrink: 1 }}>
                    {seg.text}
                  </Txt>
                </View>
              ))}
          </Section>
        )}
      </>
    );
  };

  // Fixed layout: back row, scrolling body, pinned action bar.
  return (
    <Screen>
      <View style={{ paddingLeft: L.padLeft, paddingRight: L.padRight, paddingVertical: 8 }}>{back}</View>
      {/* Content is centred and capped at 720px on tablets. */}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingLeft: L.padLeft, paddingRight: L.padRight, paddingBottom: 24, gap: 16, width: '100%', maxWidth: 720 + L.gutter * 2, alignSelf: 'center' }}>
        {body()}
      </ScrollView>
      {item && demo === 'ready' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12, paddingHorizontal: L.gutter, paddingLeft: L.padLeft, paddingRight: L.padRight, paddingBottom: L.insets.bottom + 8, backgroundColor: colors.surface, borderTopWidth: border.width, borderColor: colors.ink }}>
          {/* Action bar wraps instead of overflowing at large text sizes. */}
          <Button icon="thumbUp" accessibilityLabel={s.like} variant="secondary" selected={item.reaction === 'like'} onPress={() => react(item.id, 'like')} style={{ flexGrow: 1, flexBasis: 72 }} />
          <Button icon="thumbDown" accessibilityLabel={s.dislike} variant="secondary" selected={item.reaction === 'dislike'} onPress={() => react(item.id, 'dislike')} style={{ flexGrow: 1, flexBasis: 72 }} />
          <Button icon="star" label={item.saved ? s.saved : s.addSave} selected={item.saved} onPress={() => toggleSave(item.id)} style={{ flexGrow: 3, flexBasis: 140 }} />
        </View>
      )}
      {/* Saving only touches local state: confidence becomes 100 and the Corrected tag appears. */}
      <BottomSheet visible={editing !== null} onClose={() => setEditing(null)} title={s.editTitle(editing ? loc(editing.label) : '')}>
        <Txt type="caption" color="textSecondary" mono>
          {editing?.evidence}
        </Txt>
        <TextInput
          accessibilityLabel={s.editInput(editing ? loc(editing.label) : '')}
          value={draft}
          onChangeText={setDraft}
          autoFocus
          multiline
          maxFontSizeMultiplier={2}
          style={{ minHeight: 48, padding: 12, fontFamily: fonts.sans, fontSize: typography.body.fontSize, color: colors.text, backgroundColor: colors.background, borderWidth: border.width, borderColor: colors.ink, borderRadius: radius.input }}
        />
        <Button
          label={s.save}
          disabled={draft.trim() === ''}
          onPress={() => {
            if (item && editing) correct(item.id, editing.id, draft.trim());
            setEditing(null);
          }}
        />
        <Button label={s.cancel} variant="secondary" onPress={() => setEditing(null)} />
      </BottomSheet>
    </Screen>
  );
}

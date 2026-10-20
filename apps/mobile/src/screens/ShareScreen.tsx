import type { ItemStatus } from '@magpie/shared';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { StatusPill } from '../components/StatusPill';
import { Tag } from '../components/Tag';
import { Txt } from '../components/Txt';
import { useLang } from '../i18n/LangProvider';
import { strings } from '../i18n/strings';
import type { Item } from '../mocks/items';
import type { RootNav } from '../navigation/types';
import { useItems } from '../state/ItemsProvider';
import { border, fonts, radius, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { detectPlatform, platformLabel } from '../utils/format';

const SAMPLE_URL = 'https://www.instagram.com/reel/Cx9mQ2vP1aZ/';
// 3 steps x 400ms = the 1.2s fake processing.
const STEP_MS = 400;

/** Transparent-modal route: the sheet is the screen. Fake pipeline: queued -> processing -> done (1.2s). */
export function ShareScreen() {
  const nav = useNavigation<RootNav>();
  const { colors } = useTheme();
  const { s } = useLang();
  // `add` prepends the fake item to the collection list.
  const { add, setStatus } = useItems();
  const [open, setOpen] = useState(true);
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<ItemStatus | null>(null);
  // All fake-pipeline timers live here so unmount clears them.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Platform tag updates as the user types or pastes.
  const platform = detectPlatform(url.trim());
  // Small helper that registers a cancellable timeout.
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
  // Pipeline timers are untracked on purpose: closing the sheet must not strand the item in `queued`.
  // ponytail: fake pipeline only; a real backend job replaces these timers.
  const run = (ms: number, fn: () => void) => void setTimeout(fn, ms);
  // Guards against the auto-close and a manual close both calling goBack().
  const closing = useRef(false);
  // Close = slide out first, then pop the route.
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setOpen(false);
    // Let the sheet slide out before the route is removed.
    later(250, () => nav.goBack());
  };

  // Builds a placeholder item; nothing leaves the device.
  const save = () => {
    const id = `new-${Date.now()}`;
    const item: Item = {
      id,
      title: s.newTitle,
      platform: platform ?? 'other',
      contentType: 'generic',
      status: 'queued',
      transcriptStatus: 'skipped',
      meta: { zh: strings.zh.newMeta, en: strings.en.newMeta },
      url: url.trim(),
      art: 'sparkle',
      gradient: Date.now() % 6,
      relevance: 0,
      highlights: [],
      fields: [],
      transcript: [],
      saved: false,
    };
    add(item);
    setPhase('queued');
    run(STEP_MS, () => {
      setStatus(id, 'processing');
      setPhase('processing');
    });
    run(STEP_MS * 2, () => {
      setStatus(id, 'done');
      setPhase('done');
    });
    run(STEP_MS * 3, () => {
      close();
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <BottomSheet visible={open} onClose={close} title={s.shareTitle} fullHeight>
        <Txt type="body" color="textSecondary">
          {s.shareIntro}
        </Txt>
        <TextInput
          accessibilityLabel={s.urlLabel}
          value={url}
          onChangeText={setUrl}
          placeholder="https://…"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={phase === null}
          maxFontSizeMultiplier={2}
          style={{ minHeight: 48, paddingHorizontal: 12, fontFamily: fonts.sans, fontSize: typography.body.fontSize, color: colors.text, backgroundColor: colors.background, borderWidth: border.width, borderColor: colors.ink, borderRadius: radius.input }}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {/* No clipboard dependency: paste inserts a sample link. */}
          <Button label={s.paste} variant="secondary" disabled={phase !== null} onPress={() => setUrl(SAMPLE_URL)} accessibilityHint={s.pasteHint} />
          {platform && <Tag>{s.detected(platformLabel[platform])}</Tag>}
        </View>
        {phase && (
          <View accessibilityLiveRegion="polite" style={{ gap: 4 }}>
            <Txt type="caption" color="textSecondary">
              {s.progress}
            </Txt>
            {/* Live region: assistive tech hears each status change. */}
            <StatusPill status={phase} />
          </View>
        )}
        {/* Disabled until a supported platform link is detected. */}
        <Button label={s.save} disabled={platform === null || phase !== null} onPress={save} />
        <Button label={s.uploadInstead} variant="secondary" disabled={phase !== null} onPress={() => setUrl('')} accessibilityHint={s.uploadHint} />
      </BottomSheet>
    </View>
  );
}

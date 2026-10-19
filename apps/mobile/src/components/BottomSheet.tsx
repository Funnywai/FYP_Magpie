import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, PanResponder, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { useLang } from '../i18n/LangProvider';
import { border, layout, motion, radius } from '../theme/tokens';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import { Icon } from './Icon';
import { Txt } from './Txt';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Full-height drawer (share flow) instead of fit-to-content. */
  fullHeight?: boolean;
  children: ReactNode;
};

const DISMISS_DRAG = 80;

/** Bottom drawer (compact/medium) or centred 480px modal (expanded). Drag handle, scrim tap, close button. */
export function BottomSheet({ visible, onClose, title, fullHeight, children }: Props) {
  const { colors, reduceMotion } = useTheme();
  const centered = useBreakpoint() === 'expanded';
  // Bottom inset keeps content above the home indicator.
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const kb = useKeyboardHeight();
  // Stay mounted until the exit animation ends, then unmount the Modal.
  const [mounted, setMounted] = useState(visible);
  const y = useRef(new Animated.Value(height)).current;
  // PanResponder is created once, so it reads the latest onClose through a ref.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // 220ms ease-out, under the 250ms ceiling; 0ms under Reduce Motion.
  const slide = (to: number, done?: () => void) =>
    Animated.timing(y, { toValue: to, duration: reduceMotion ? 0 : motion.max - 30, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(done);

  // Open/close reacts to the `visible` prop.
  useEffect(() => {
    if (visible) {
      setMounted(true);
      slide(0);
    } else if (mounted) {
      slide(height, () => setMounted(false));
    }
  }, [visible]);

  // Drag only the handle so inner scrolling is never hijacked.
  // Drag-to-dismiss on the handle only.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, g) => y.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > DISMISS_DRAG || g.vy > 0.8) closeRef.current();
        else Animated.timing(y, { toValue: 0, duration: motion.press, useNativeDriver: true }).start();
      },
    }),
  ).current;

  const { s } = useLang();
  // Space left above the keyboard and below the status bar.
  const room = height - kb - insets.top - 16;
  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: centered ? 'center' : 'flex-end', paddingBottom: kb }}>
        {/* Scrim: tapping outside dismisses. */}
        <Pressable accessibilityRole="button" accessibilityLabel={s.close} onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} />
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={{
            width: '100%',
            maxWidth: centered ? layout.modalWidth : 640,
            maxHeight: room,
            height: fullHeight ? room : undefined,
            backgroundColor: colors.surface,
            borderWidth: border.width,
            borderBottomWidth: centered ? border.width : 0,
            borderColor: colors.ink,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            borderBottomLeftRadius: centered ? radius.sheet : 0,
            borderBottomRightRadius: centered ? radius.sheet : 0,
            transform: [{ translateY: y }],
          }}
        >
          {/* Handle: drag down past 80px (or flick) to dismiss; also an accessible control. */}
          <View {...pan.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={s.dragHandle} style={{ height: 24, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: colors.ink }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16 }}>
            <Txt type="title" accessibilityRole="header" style={{ flex: 1 }}>
              {title}
            </Txt>
            <Pressable accessibilityRole="button" accessibilityLabel={s.close} onPress={onClose} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" />
            </Pressable>
          </View>
          {/* Padding follows the keyboard so inputs are never covered. */}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 16 + (kb > 0 ? 0 : insets.bottom) }}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

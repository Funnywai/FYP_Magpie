import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/useTheme';

/**
 * Page shell. The native SafeAreaView reads the top inset straight from UIKit/Android, so the
 * title area can never slide under the notch, Dynamic Island or status bar.
 */
// Used by every full-screen page so top-inset handling lives in exactly one place.
export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      {children}
    </SafeAreaView>
  );
}

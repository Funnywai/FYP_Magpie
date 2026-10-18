import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gutter } from './tokens';
import { useBreakpoint } from './useBreakpoint';

/**
 * Per-screen layout numbers. `inTabs` screens sit beside a sidebar on medium/expanded
 * (the sidebar already consumes the left inset); stack screens like Detail use all four insets.
 */
export function useLayout(inTabs = true) {
  const bp = useBreakpoint();
  const insets = useSafeAreaInsets();
  const sidebar = inTabs && bp !== 'compact';
  const g = gutter[bp];
  return {
    bp,
    insets,
    sidebar,
    gutter: g,
    // Columns by breakpoint: 1 list, 2 grid, 3 grid.
    cols: bp === 'compact' ? 1 : bp === 'medium' ? 2 : 3,
    padLeft: (sidebar ? 0 : insets.left) + g,
    padRight: insets.right + g,
    padTop: insets.top,
    // Bottom bar (compact) handles its own inset; the sidebar does not sit under content.
    padBottom: sidebar ? insets.bottom : 0,
  };
}

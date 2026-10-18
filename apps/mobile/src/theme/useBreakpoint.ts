import { useWindowDimensions } from 'react-native';

import { breakpointFor, type Breakpoint } from './tokens';

export function useBreakpoint(): Breakpoint {
  return breakpointFor(useWindowDimensions().width);
}

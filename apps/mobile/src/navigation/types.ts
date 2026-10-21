import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { IconName } from '../components/Icon';

export type TabParamList = {
  Collection: undefined;
  Map: undefined;
  ShareTab: undefined;
  Itinerary: undefined;
  Settings: undefined;
};

// Detail and Share sit above the tabs, so they live in the root stack.
export type RootParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Detail: { id: string };
  Share: undefined;
};

export type RootNav = NativeStackNavigationProp<RootParamList>;

/** Tab labels are always shown; `ShareTab` is the raised centre "+" and opens the Share modal. */
export type TabLabelKey = 'tabCollection' | 'tabMap' | 'tabShare' | 'tabItinerary' | 'tabSettings';

export const tabMeta: Record<keyof TabParamList, { label: TabLabelKey; icon: IconName }> = {
  Collection: { label: 'tabCollection', icon: 'book' },
  Map: { label: 'tabMap', icon: 'map' },
  ShareTab: { label: 'tabShare', icon: 'plus' },
  Itinerary: { label: 'tabItinerary', icon: 'route' },
  Settings: { label: 'tabSettings', icon: 'sliders' },
};

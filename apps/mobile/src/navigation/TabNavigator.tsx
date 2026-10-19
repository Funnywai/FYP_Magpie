import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';

import { TabBar } from '../components/TabBar';
import { HomeScreen } from '../screens/HomeScreen';
import { ItineraryScreen } from '../screens/ItineraryScreen';
import { MapScreen } from '../screens/MapScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

/** The "+" route never renders: TabBar intercepts it and opens the Share modal. */
function Nothing() {
  return <View />;
}

export function TabNavigator() {
  const { reduceMotion } = useTheme();
  // Tab bar position follows the breakpoint.
  const bp = useBreakpoint();
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      // Left rail from 600px up; bottom bar on phones.
      screenOptions={{ headerShown: false, tabBarPosition: bp === 'compact' ? 'bottom' : 'left', animation: reduceMotion ? 'none' : 'fade' }}
    >
      <Tab.Screen name="Collection" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="ShareTab" component={Nothing} />
      <Tab.Screen name="Itinerary" component={ItineraryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

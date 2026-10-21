import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from '../components/TabBar';
import { HomeScreen } from '../screens/HomeScreen';
import { ItineraryScreen } from '../screens/ItineraryScreen';
import { MapScreen } from '../screens/MapScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

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
      {/* Fallback avoids a blank screen if state restore or deep link lands on ShareTab. */}
      <Tab.Screen name="ShareTab" component={HomeScreen} />
      <Tab.Screen name="Itinerary" component={ItineraryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

/**
 * App shell. Step 1 is structure only — no navigation, no auth, no data.
 * The item list / share intake flow arrives in later steps.
 */
export function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Magpie</Text>
      <Text style={styles.subtitle}>Skeleton ready.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
});

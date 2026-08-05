import { Stack } from 'expo-router/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return <SafeAreaProvider><SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'bottom', 'left']}><Stack screenOptions={{ headerShown: false }} /></SafeAreaView></SafeAreaProvider>;
}

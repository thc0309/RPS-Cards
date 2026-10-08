import { Stack } from 'expo-router/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedbackProvider } from '../src/ui/feedback';

export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><FeedbackProvider><Stack screenOptions={{ headerShown: false }} /></FeedbackProvider></SafeAreaProvider></GestureHandlerRootView>;
}

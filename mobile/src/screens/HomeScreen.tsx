import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CustomizeSheet } from '../components/CustomizeSheet';
import { FolkButton } from '../components/FolkButton';
import { FolkSurface } from '../components/FolkSurface';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { folkAssets } from '../ui/folk-assets';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useFeedback } from '../ui/feedback';
import { useReducedMotion } from '../ui/motion';

export function HomeScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const feedback = useFeedback();
  const reducedMotion = useReducedMotion();
  const entrance = useSharedValue(0);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  const logoWidth = Math.min(width - 32, 380);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  useEffect(() => {
    if (!hasHydrated) return;
    feedback.welcome();
    return () => feedback.cancelScope('home-welcome');
  }, [feedback, hasHydrated]);
  useEffect(() => {
    cancelAnimation(entrance);
    entrance.value = reducedMotion || !hasHydrated ? 1 : 0;
    if (hasHydrated && !reducedMotion) entrance.value = withTiming(1, { duration: 220 });
    return () => cancelAnimation(entrance);
  }, [entrance, hasHydrated, reducedMotion]);
  const entranceStyle = useAnimatedStyle(() => ({ opacity: reducedMotion ? 1 : 0.85 + entrance.value * 0.15, transform: [{ translateY: reducedMotion ? 0 : (1 - entrance.value) * 8 }] }));

  if (!hasHydrated) {
    return <View style={styles.loading}><Text>{text('loading')}</Text></View>;
  }

  return (
    <FolkSurface background="village" contentStyle={styles.surfaceContent}>
      <StatusBar style="dark" />
      <Animated.ScrollView style={[styles.scroll, entranceStyle]} contentContainerStyle={[styles.container, { paddingTop: Math.min(height * 0.08, 64) }]} showsVerticalScrollIndicator={false}>
        <Image accessibilityRole="image" accessibilityLabel={text('homeTitle')} source={folkAssets.controls.logo} resizeMode="contain" style={{ width: logoWidth, height: logoWidth / 1.5 }} />
        <View style={styles.actions}>
          <FolkButton cue="paper-slide" icon={folkAssets.icons.bot} accessibilityLabel={text('playBot')} onPress={() => router.push('/draft')}>{text('playBot')}</FolkButton>
          <FolkButton cue="paper-slide" variant="blue" icon={folkAssets.icons.joinDoor} accessibilityLabel={text('onlineRooms')} onPress={() => router.push('/rooms')}>{text('onlineRooms')}</FolkButton>
        </View>
        <View style={styles.guestBadge}><Text style={styles.guestText}>{text('guest')}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={text('customize')} style={styles.customize} onPress={() => { feedback.play('ui-tap'); setCustomizeOpen(true); }}>
          <Text style={styles.customizeText}>{text('customize')} · {text('defaultTheme')}</Text>
        </Pressable>
      </Animated.ScrollView>
      <CustomizeSheet visible={customizeOpen} onClose={() => setCustomizeOpen(false)} />
    </FolkSurface>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', backgroundColor: '#F5E7C5', flex: 1, justifyContent: 'center' },
  surfaceContent: { backgroundColor: 'rgba(255, 245, 214, 0.06)' },
  scroll: { width: '100%' },
  container: { alignItems: 'center', flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  actions: { gap: 12, marginTop: 8, maxWidth: 340, width: '100%' },
  customize: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 12 },
  customizeText: { color: '#FFF0C6', fontSize: 14, fontWeight: '800', textAlign: 'center', textDecorationLine: 'underline', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 2 },
  guestBadge: { backgroundColor: '#E5B957', borderColor: '#6F3C1F', borderRadius: 14, borderWidth: 2, minHeight: 38, minWidth: 132, paddingHorizontal: 20, paddingVertical: 7 },
  guestText: { color: '#43291F', fontSize: 14, fontWeight: '900', textAlign: 'center' },
});

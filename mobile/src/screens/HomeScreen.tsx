import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CustomizeSheet } from '../components/CustomizeSheet';
import { HowToPlaySheet } from '../components/HowToPlaySheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FolkButton } from '../components/FolkButton';
import { FolkSurface } from '../components/FolkSurface';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { folkAssets } from '../ui/folk-assets';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useFeedback } from '../ui/feedback';
import { useReducedMotion } from '../ui/motion';

const HOW_TO_SEEN_KEY = 'rps-cards.how-to-seen';
export function HomeScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const feedback = useFeedback();
  const reducedMotion = useReducedMotion();
  const entrance = useSharedValue(0);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
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

  useEffect(() => {
    if (!hasHydrated) return;
    let active = true;
    // First launch explains the rules once; afterwards the button on Home reopens them.
    void AsyncStorage.getItem(HOW_TO_SEEN_KEY).then((seen) => {
      if (!active || seen) return;
      setHowToOpen(true);
      void AsyncStorage.setItem(HOW_TO_SEEN_KEY, '1').catch(() => undefined);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [hasHydrated]);
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
          <FolkButton cue="paper-slide" variant="blue" icon={folkAssets.icons.joinDoor} accessibilityLabel={text('lanPlay')} onPress={() => router.push('/lan')}>{text('lanPlay')}</FolkButton>
          {process.env.EXPO_PUBLIC_ONLINE_ENABLED === '1' ? <FolkButton cue="paper-slide" variant="blue" icon={folkAssets.icons.joinDoor} accessibilityLabel={text('onlineRooms')} onPress={() => router.push('/rooms')}>{text('onlineRooms')}</FolkButton> : null}
        </View>
        <View style={styles.secondary}>
          <Pressable testID="home-how-to-play" accessibilityRole="button" accessibilityLabel={text('howToPlay')} style={styles.pill} onPress={() => { feedback.play('ui-tap'); setHowToOpen(true); }}>
            <Text style={styles.pillText}>? {text('howToPlay')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={text('customize')} style={styles.pill} onPress={() => { feedback.play('ui-tap'); setCustomizeOpen(true); }}>
            <Text style={styles.pillText}>⚙ {text('settings')}</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>
      <CustomizeSheet visible={customizeOpen} onClose={() => setCustomizeOpen(false)} />
      <HowToPlaySheet visible={howToOpen} onClose={() => setHowToOpen(false)} />
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
  secondary: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 6, maxWidth: 340, width: '100%' },
  pill: { alignItems: 'center', backgroundColor: '#E5B957', borderColor: '#6F3C1F', borderRadius: 16, borderWidth: 2, flex: 1, justifyContent: 'center', minHeight: 50, paddingHorizontal: 10 },
  pillText: { color: '#43291F', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  guestBadge: { backgroundColor: '#E5B957', borderColor: '#6F3C1F', borderRadius: 14, borderWidth: 2, minHeight: 38, minWidth: 132, paddingHorizontal: 20, paddingVertical: 7 },
  guestText: { color: '#43291F', fontSize: 14, fontWeight: '900', textAlign: 'center' },
});

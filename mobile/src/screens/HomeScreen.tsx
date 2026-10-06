import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CustomizeSheet } from '../components/CustomizeSheet';
import { FolkButton } from '../components/FolkButton';
import { FolkSurface } from '../components/FolkSurface';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { folkAssets } from '../ui/folk-assets';

export function HomeScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  const logoWidth = Math.min(width - 32, 380);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  if (!hasHydrated) {
    return <View style={styles.loading}><Text>{text('loading')}</Text></View>;
  }

  return (
    <FolkSurface background="village" contentStyle={styles.surfaceContent}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, { paddingTop: Math.min(height * 0.08, 64) }]} showsVerticalScrollIndicator={false}>
        <Image accessibilityRole="image" accessibilityLabel={text('homeTitle')} source={folkAssets.controls.logo} resizeMode="contain" style={{ width: logoWidth, height: logoWidth / 1.5 }} />
        <View style={styles.actions}>
          <FolkButton icon={folkAssets.icons.bot} accessibilityLabel={text('playBot')} onPress={() => router.push('/draft')}>{text('playBot')}</FolkButton>
          <FolkButton variant="blue" icon={folkAssets.icons.joinDoor} accessibilityLabel={text('onlineRooms')} onPress={() => router.push('/rooms')}>{text('onlineRooms')}</FolkButton>
        </View>
        <View style={styles.guestBadge}><Text style={styles.guestText}>{text('guest')}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={text('customize')} style={styles.customize} onPress={() => setCustomizeOpen(true)}>
          <Text style={styles.customizeText}>{text('customize')} · {text('defaultTheme')}</Text>
        </Pressable>
      </ScrollView>
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

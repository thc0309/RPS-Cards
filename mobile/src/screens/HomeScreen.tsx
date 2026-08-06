import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  if (!hasHydrated) {
    return <View style={styles.loading}><Text>{text('loading')}</Text></View>;
  }

  return (
    <FolkSurface background="village" contentStyle={styles.surfaceContent}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Image accessibilityRole="image" accessibilityLabel={text('homeTitle')} source={folkAssets.controls.logo} resizeMode="contain" style={styles.logo} />
        <Text style={styles.subtitle}>{text('homeSubtitle')}</Text>
        <View style={styles.actions}>
          <FolkButton icon={folkAssets.icons.bot} accessibilityLabel={text('playBot')} onPress={() => router.push('/draft')}>{text('playBot')}</FolkButton>
          <FolkButton variant="blue" icon={folkAssets.icons.joinDoor} accessibilityLabel={text('onlineRooms')} onPress={() => router.push('/rooms')}>{text('onlineRooms')}</FolkButton>
        </View>
        <Pressable accessibilityRole="button" style={styles.customize} onPress={() => setCustomizeOpen(true)}>
          <Text style={styles.customizeText}>{text('customize')} · {text('defaultTheme')}</Text>
        </Pressable>
        <View style={styles.guestBadge}><Text style={styles.guestText}>{text('guest')}</Text></View>
      </ScrollView>
      <CustomizeSheet visible={customizeOpen} onClose={() => setCustomizeOpen(false)} />
    </FolkSurface>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', backgroundColor: '#F5E7C5', flex: 1, justifyContent: 'center' },
  surfaceContent: { backgroundColor: 'rgba(255, 245, 214, 0.12)' },
  container: { alignItems: 'center', flexGrow: 1, justifyContent: 'center', padding: 20 },
  logo: { height: 210, marginBottom: 4, maxWidth: 360, width: '100%' },
  subtitle: { color: '#FFF0C6', fontSize: 15, fontWeight: '700', marginBottom: 18, textAlign: 'center', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 3 },
  actions: { gap: 10, maxWidth: 360, width: '100%' },
  customize: { alignItems: 'center', minHeight: 48, justifyContent: 'center', marginTop: 6, paddingHorizontal: 12 },
  customizeText: { color: '#FFF0C6', fontSize: 15, fontWeight: '800', textDecorationLine: 'underline', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 2 },
  guestBadge: { backgroundColor: '#E5B957', borderColor: '#6F3C1F', borderRadius: 14, borderWidth: 2, marginTop: 6, minHeight: 42, minWidth: 132, paddingHorizontal: 20, paddingVertical: 8 },
  guestText: { color: '#43291F', fontSize: 14, fontWeight: '900', textAlign: 'center' },
});

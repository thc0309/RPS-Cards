import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CustomizeSheet } from '../components/CustomizeSheet';
import { translate } from '../i18n';
import { resolveCosmetic } from '../cosmetics/normalize';
import { useAppStore } from '../store/app-store';

export function HomeScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const uiThemeId = useAppStore((state) => state.uiThemeId);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const theme = resolveCosmetic(uiThemeId);

  if (!hasHydrated) {
    return <View style={styles.loading}><Text>{text('loading')}</Text></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <StatusBar style="dark" />
      <View style={styles.ornament} accessible={false}><Text style={styles.symbol}>✦</Text></View>
      <Text accessibilityRole="header" style={styles.title}>{text('homeTitle')}</Text>
      <Text style={styles.subtitle}>{text('homeSubtitle')}</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={[styles.primary, { backgroundColor: theme.accent }]} onPress={() => router.push('/draft')}>
          <Text style={styles.primaryText}>{text('playBot')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => router.push('/rooms')}>
          <Text style={styles.secondaryText}>{text('onlineRooms')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.customize} onPress={() => setCustomizeOpen(true)}>
          <Text style={styles.customizeText}>{text('customize')}</Text>
        </Pressable>
      </View>
      <Text style={styles.defaultLabel}>{text('defaultTheme')}</Text>
      <CustomizeSheet visible={customizeOpen} onClose={() => setCustomizeOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', backgroundColor: '#F5E7C5', flex: 1, justifyContent: 'center' },
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  ornament: { alignItems: 'center', backgroundColor: '#F0CF83', borderColor: '#A63D2F', borderRadius: 60, borderWidth: 2, height: 104, justifyContent: 'center', marginBottom: 20, width: 104 },
  symbol: { color: '#A63D2F', fontSize: 48 },
  title: { color: '#43291F', fontSize: 34, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#755846', fontSize: 16, marginTop: 8, textAlign: 'center' },
  actions: { gap: 12, marginTop: 36, width: '100%' },
  primary: { alignItems: 'center', borderRadius: 14, justifyContent: 'center', minHeight: 54, paddingHorizontal: 20 },
  primaryText: { color: '#FFF9EC', fontSize: 17, fontWeight: '800' },
  secondary: { alignItems: 'center', backgroundColor: '#FFF9EC', borderColor: '#A63D2F', borderRadius: 14, borderWidth: 2, justifyContent: 'center', minHeight: 54, paddingHorizontal: 20 },
  secondaryText: { color: '#A63D2F', fontSize: 17, fontWeight: '800' },
  customize: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  customizeText: { color: '#43291F', fontSize: 16, fontWeight: '700', textDecorationLine: 'underline' },
  defaultLabel: { color: '#755846', fontSize: 13, marginTop: 20 },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getLocalMatchAdapter, disposeLocalSession } from '../game/local-session';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';

export function ResultScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const adapter = getLocalMatchAdapter();
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const result = adapter?.getState().match.result;
  if (!adapter || !result) return null;
  const winner = result.winner === 'PLAYER_A' ? text('youWin') : text('botWins');
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>{text('result')}</Text>
      <Text style={styles.winner}>{winner}</Text>
      <Text style={styles.score}>{text('score')}: {result.scores.PLAYER_A} – {result.scores.PLAYER_B}</Text>
      <Pressable accessibilityRole="button" style={styles.primary} onPress={() => { adapter.rematch(); router.replace('/board'); }}>
        <Text style={styles.primaryText}>{text('rematch')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => { disposeLocalSession(); router.replace('/'); }}>
        <Text style={styles.secondaryText}>{text('home')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: '#F5E7C5', flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#43291F', fontSize: 30, fontWeight: '900' },
  winner: { color: '#A63D2F', fontSize: 24, fontWeight: '800', marginTop: 18 },
  score: { color: '#755846', fontSize: 18, marginTop: 10 },
  primary: { alignItems: 'center', backgroundColor: '#A63D2F', borderRadius: 14, justifyContent: 'center', marginTop: 36, minHeight: 52, minWidth: 220 },
  primaryText: { color: '#FFF9EC', fontWeight: '800' },
  secondary: { alignItems: 'center', borderColor: '#A63D2F', borderRadius: 14, borderWidth: 2, justifyContent: 'center', marginTop: 12, minHeight: 52, minWidth: 220 },
  secondaryText: { color: '#A63D2F', fontWeight: '800' },
});

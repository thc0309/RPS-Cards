import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { getLocalMatchAdapter, disposeLocalSession } from '../game/local-session';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { FolkButton } from '../components/FolkButton';
import { FolkPanel } from '../components/FolkPanel';
import { FolkSurface } from '../components/FolkSurface';

export function ResultScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const adapter = getLocalMatchAdapter();
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const result = adapter?.getState().match.result;
  if (!adapter || !result) return null;
  const winner = result.winner === 'PLAYER_A' ? text('youWin') : text('botWins');
  return (
    <FolkSurface background="village" contentStyle={styles.container}><FolkPanel style={styles.panel}><Text accessibilityRole="header" style={styles.title}>{text('result')}</Text><Text style={styles.winner}>{winner}</Text><Text style={styles.score}>{text('score')}: {result.scores.PLAYER_A} – {result.scores.PLAYER_B}</Text><FolkButton accessibilityLabel={text('rematch')} onPress={() => { adapter.rematch(); router.replace('/board'); }}>{text('rematch')}</FolkButton><FolkButton variant="blue" accessibilityLabel={text('home')} onPress={() => { disposeLocalSession(); router.replace('/'); }}>{text('home')}</FolkButton></FolkPanel></FolkSurface>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  panel: { maxWidth: 480, width: '100%' },
  title: { color: '#8A241A', fontSize: 30, fontWeight: '900', textAlign: 'center' },
  winner: { color: '#A63D2F', fontSize: 24, fontWeight: '800', marginTop: 18 },
  score: { color: '#755846', fontSize: 18, marginTop: 10 },
});

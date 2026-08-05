import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LocalBotDraftAdapter } from '../game/local-bot-adapter';
import { LocalMatchAdapter } from '../game/local-match-adapter';
import { setLocalDraftResult, setLocalMatchAdapter } from '../game/local-session';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { selectedLift, useReducedMotion } from '../ui/motion';

export function DraftScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const [adapter] = useState(() => new LocalBotDraftAdapter((max) => Math.floor(Math.random() * max)));
  const [snapshot, setSnapshot] = useState(() => adapter.getState());
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const reducedMotion = useReducedMotion();

  useEffect(() => adapter.subscribe(() => setSnapshot(adapter.getState())), [adapter]);
  useEffect(() => {
    if (snapshot.result) {
      setLocalDraftResult(snapshot.result);
      setLocalMatchAdapter(new LocalMatchAdapter(snapshot.result.hands, (max) => Math.floor(Math.random() * max)));
      router.replace('/board');
    }
  }, [router, snapshot.result]);
  useEffect(() => () => adapter.dispose(), [adapter]);

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>{text('draftTitle')}</Text>
      <Text style={styles.status}>{snapshot.status === 'WAITING' ? text('opponentHasPicked') : snapshot.status === 'COMPLETE' ? text('waiting') : text('available')}</Text>
      <View style={styles.positions}>
        {snapshot.view.availablePositions.map((item) => (
          <Pressable
            key={item.position}
            accessibilityRole="button"
            accessibilityLabel={`${text('draftTitle')} ${item.position + 1}`}
            accessibilityHint={snapshot.status === 'AVAILABLE' ? text('available') : text('disabled')}
            accessibilityState={{ disabled: snapshot.status !== 'AVAILABLE', selected: snapshot.selectedPosition === item.position }}
            disabled={snapshot.status !== 'AVAILABLE'}
            style={[styles.position, snapshot.selectedPosition === item.position && { borderColor: '#43291F', transform: [{ translateY: selectedLift(reducedMotion) }] }]}
            onPress={() => adapter.selectPlayerPosition(item.position)}
          >
            <Text style={styles.cardBack}>?</Text>
            <Text style={styles.positionLabel}>{item.position + 1}</Text>
          </Pressable>
        ))}
      </View>
      {snapshot.deadline && <Text style={styles.timer}>5s</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: '#F5E7C5', flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#43291F', fontSize: 28, fontWeight: '800', textAlign: 'center' },
  status: { color: '#755846', fontSize: 16, marginTop: 10 },
  positions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  position: { alignItems: 'center', backgroundColor: '#A63D2F', borderColor: '#F0CF83', borderRadius: 14, borderWidth: 3, height: 150, justifyContent: 'center', width: 96 },
  selected: { borderColor: '#43291F', transform: [{ translateY: -6 }] },
  cardBack: { color: '#FFF9EC', fontSize: 42, fontWeight: '900' },
  positionLabel: { color: '#F0CF83', fontSize: 14, marginTop: 4 },
  timer: { color: '#43291F', fontSize: 15, fontWeight: '700', marginTop: 20 },
});

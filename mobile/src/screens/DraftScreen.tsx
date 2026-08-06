import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LocalBotDraftAdapter } from '../game/local-bot-adapter';
import { LocalMatchAdapter } from '../game/local-match-adapter';
import { setLocalDraftResult, setLocalMatchAdapter } from '../game/local-session';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { selectedLift, useReducedMotion } from '../ui/motion';
import { FolkSurface } from '../components/FolkSurface';
import { folkAssets } from '../ui/folk-assets';

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
    <FolkSurface background="paper" contentStyle={styles.surface}>
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
            style={[styles.position, snapshot.selectedPosition === item.position && { borderColor: '#F0CF83', transform: [{ translateY: selectedLift(reducedMotion) }] }]}
            onPress={() => adapter.selectPlayerPosition(item.position)}
          >
            <Image source={folkAssets.cards.back} resizeMode="stretch" style={styles.cardBack} />
            <Text style={styles.positionLabel}>{item.position + 1}</Text>
          </Pressable>
        ))}
        </View>
        {snapshot.deadline && <Text style={styles.timer}>5s</Text>}
      </View>
    </FolkSurface>
  );
}

const styles = StyleSheet.create({
  surface: { padding: 20 },
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#8A241A', fontSize: 30, fontWeight: '900', textAlign: 'center', textShadowColor: '#F7E4A8', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 },
  status: { color: '#5A3521', fontSize: 16, marginTop: 10 },
  positions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  position: { alignItems: 'center', backgroundColor: '#8F1F17', borderColor: '#F0CF83', borderRadius: 14, borderWidth: 3, height: 164, justifyContent: 'center', overflow: 'hidden', width: 104 },
  cardBack: { height: 124, width: 82 },
  positionLabel: { color: '#F0CF83', fontSize: 14, marginTop: 4 },
  timer: { color: '#8A241A', fontSize: 15, fontWeight: '900', marginTop: 20 },
});

import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { RoomProjection } from '@rps-cards/game-core';
import { selectedLift, useReducedMotion } from '../ui/motion';

export function OnlineDraftScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const locale = useAppStore((state) => state.locale);
  const [snapshot, setSnapshot] = useState<RoomProjection | null>(null);
  const [busy, setBusy] = useState(false);
  const client = useMemo(() => createOnlineRoomClient(), []);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!params.roomCode || !params.sessionId) { router.replace('/rooms'); return; }
    let active = true;
    let polling = false;
  const poll = async () => { if (polling) return; polling = true; try { const next = await client.snapshot(params.roomCode!, params.sessionId!); if (active) setSnapshot(next); } catch { if (active) router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } finally { polling = false; } };
    void poll();
    const handle = setInterval(() => { void poll(); }, 500);
    return () => { active = false; clearInterval(handle); };
  }, [client, params.roomCode, params.sessionId, router]);
  useEffect(() => {
    if (snapshot?.phase === 'ROUND_SELECTION') router.replace({ pathname: '/board', params: { roomCode: params.roomCode, sessionId: params.sessionId } });
  }, [params.roomCode, params.sessionId, router, snapshot?.phase]);
  if (!snapshot) return <View style={styles.container}><Text>{text('loading')}</Text></View>;
  const draft = snapshot.own.draft && 'availablePositions' in snapshot.own.draft ? snapshot.own.draft : null;
  const active = draft?.activeSeat === snapshot.own.seat;
  const opponentHasPicked = Boolean(snapshot.own.draft && 'opponentHasPicked' in snapshot.own.draft && snapshot.own.draft.opponentHasPicked);
  const pick = async (position: number) => {
    if (!active || busy || !params.roomCode || !params.sessionId) return;
    setBusy(true);
    try { setSnapshot(await client.action(params.roomCode, params.sessionId, { type: 'DRAFT_PICK', operationId: `draft-${Date.now()}-${position}`, expectedPhase: snapshot.phase as 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B', expectedRound: 0, payload: { position } })); } catch { try { setSnapshot(await client.snapshot(params.roomCode, params.sessionId)); } catch { router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } } finally { setBusy(false); }
  };
  return (
  <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>{text('draftTitle')}</Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>{active ? text('available') : opponentHasPicked ? text('opponentHasPicked') : text('draftWaiting')}</Text>
      <View style={styles.positions}>{draft?.availablePositions.map((item) => <Pressable key={item.position} accessibilityRole="button" accessibilityLabel={`${text('draftTitle')} ${item.position + 1}`} accessibilityHint={active ? text('available') : text('disabled')} disabled={!active || busy} accessibilityState={{ disabled: !active || busy, selected: draft.selectedPosition === item.position }} style={[styles.position, draft.selectedPosition === item.position && { borderColor: '#43291F', transform: [{ translateY: selectedLift(reducedMotion) }] }]} onPress={() => void pick(item.position)}><Text style={styles.cardBack}>?</Text><Text style={styles.positionLabel}>{item.position + 1}</Text></Pressable>)}</View>
      <Text style={styles.timer}>{text('draftDeadline')}: {snapshot.deadlineAt ? Math.max(0, Math.ceil((snapshot.deadlineAt - Date.now()) / 1_000)) : 0}s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: '#F5E7C5', flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#43291F', fontSize: 28, fontWeight: '800', textAlign: 'center' },
  status: { color: '#755846', fontSize: 16, marginTop: 10 },
  positions: { flexDirection: 'row', gap: 8, marginTop: 32 },
  position: { alignItems: 'center', backgroundColor: '#A63D2F', borderColor: '#F0CF83', borderRadius: 14, borderWidth: 3, height: 132, justifyContent: 'center', width: 82 },
  selected: { borderColor: '#43291F', transform: [{ translateY: -6 }] },
  cardBack: { color: '#FFF9EC', fontSize: 42, fontWeight: '900' },
  positionLabel: { color: '#F0CF83', fontSize: 14, marginTop: 4 },
  timer: { color: '#43291F', fontSize: 15, fontWeight: '700', marginTop: 20 },
});

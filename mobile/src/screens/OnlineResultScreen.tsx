import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { RoomProjection } from '@rps-cards/game-core';
import { deleteReconnectCredential } from '../security/reconnect-credential';

export function OnlineResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const locale = useAppStore((state) => state.locale);
  const client = useMemo(() => createOnlineRoomClient(), []);
  const [snapshot, setSnapshot] = useState<RoomProjection | null>(null);
  const [busy, setBusy] = useState(false);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  useEffect(() => {
    if (!params.roomCode || !params.sessionId) { router.replace('/rooms'); return; }
    let active = true;
    const poll = async () => { try { const next = await client.snapshot(params.roomCode!, params.sessionId!); if (active) setSnapshot(next); } catch { if (active) router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } };
    void poll(); const handle = setInterval(() => { void poll(); }, 700);
    return () => { active = false; clearInterval(handle); };
  }, [client, params.roomCode, params.sessionId, router]);
  useEffect(() => {
    if (snapshot?.phase === 'DRAFT_PLAYER_A' || snapshot?.phase === 'DRAFT_PLAYER_B') router.replace({ pathname: '/draft', params: { roomCode: params.roomCode, sessionId: params.sessionId } });
  }, [params.roomCode, params.sessionId, router, snapshot?.phase]);
  if (!snapshot || !snapshot.result || !params.roomCode || !params.sessionId) return null;
  const winner = snapshot.result.winner === snapshot.own.seat ? text('youWin') : text('opponentWins');
  const rematch = async () => {
    setBusy(true);
    try { setSnapshot(await client.action(params.roomCode!, params.sessionId!, { type: 'REMATCH_READY', operationId: `rematch-${Date.now()}`, expectedPhase: 'MATCH_RESULT', expectedRound: 4, payload: { ready: true } })); } finally { setBusy(false); }
  };
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>{text('result')}</Text>
      <Text style={styles.winner}>{winner}</Text>
      <Text style={styles.score}>{text('score')}: {snapshot.result.scores.PLAYER_A} – {snapshot.result.scores.PLAYER_B}</Text>
      <Pressable accessibilityRole="button" disabled={busy} style={styles.primary} onPress={() => void rematch()}><Text style={styles.primaryText}>{snapshot.rematchReady?.includes(snapshot.own.seat) ? text('rematchWaiting') : text('rematch')}</Text></Pressable>
      <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => { void deleteReconnectCredential(); router.replace('/rooms'); }}><Text style={styles.secondaryText}>{text('leaveRoom')}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({ container: { alignItems: 'center', backgroundColor: '#F5E7C5', flex: 1, justifyContent: 'center', padding: 24 }, title: { color: '#43291F', fontSize: 30, fontWeight: '900' }, winner: { color: '#A63D2F', fontSize: 24, fontWeight: '800', marginTop: 18 }, score: { color: '#755846', fontSize: 18, marginTop: 10 }, primary: { alignItems: 'center', backgroundColor: '#A63D2F', borderRadius: 14, justifyContent: 'center', marginTop: 36, minHeight: 52, minWidth: 220, paddingHorizontal: 12 }, primaryText: { color: '#FFF9EC', fontWeight: '800', textAlign: 'center' }, secondary: { alignItems: 'center', borderColor: '#A63D2F', borderRadius: 14, borderWidth: 2, justifyContent: 'center', marginTop: 12, minHeight: 52, minWidth: 220 }, secondaryText: { color: '#A63D2F', fontWeight: '800' } });

import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { RoomProjection } from '@rps-cards/game-core';
import { deleteReconnectCredential } from '../security/reconnect-credential';
import { FolkButton } from '../components/FolkButton';
import { FolkPanel } from '../components/FolkPanel';
import { FolkSurface } from '../components/FolkSurface';

export function OnlineResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const locale = useAppStore((state) => state.locale);
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);
  const client = useMemo(() => createOnlineRoomClient(), []);
  const [snapshot, setSnapshot] = useState<RoomProjection | null>(null);
  const [busy, setBusy] = useState(false);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  useEffect(() => {
    if (!params.roomCode || !params.sessionId) { router.replace('/rooms'); return; }
    let active = true;
    let polling = false;
    const poll = async () => { if (polling) return; polling = true; try { const next = await client.snapshot(params.roomCode!, params.sessionId!); if (active) setSnapshot(next); } catch { if (active) router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } finally { polling = false; } };
    void poll(); const handle = setInterval(() => { void poll(); }, 700);
    return () => { active = false; clearInterval(handle); };
  }, [client, params.roomCode, params.sessionId, router]);
  useEffect(() => {
    if (snapshot?.phase === 'DRAFT_PLAYER_A' || snapshot?.phase === 'DRAFT_PLAYER_B') router.replace({ pathname: '/draft', params: { roomCode: params.roomCode, sessionId: params.sessionId } });
  }, [params.roomCode, params.sessionId, router, snapshot?.phase]);
  if (!snapshot || !snapshot.result || !params.roomCode || !params.sessionId) return <FolkSurface background="village" contentStyle={styles.container}><Text style={styles.loading}>{text('loading')}</Text></FolkSurface>;
  const winner = snapshot.result.winner === snapshot.own.seat ? text('youWin') : text('opponentWins');
  const rematchReady = snapshot.rematchReady?.includes(snapshot.own.seat) ?? false;
  const rematch = async () => {
    setBusy(true);
    try { setSnapshot(await client.action(params.roomCode!, params.sessionId!, { type: 'REMATCH_READY', operationId: `rematch-${Date.now()}`, expectedPhase: 'MATCH_RESULT', expectedRound: snapshot.round, payload: { ready: true } })); } catch { router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } finally { setBusy(false); }
  };
  const leave = async () => {
    try { await client.leave(params.roomCode!, params.sessionId!); } catch { /* heartbeat expiry closes an unreachable room */ }
    await deleteReconnectCredential();
    setActiveRoom(null);
    router.replace('/rooms');
  };
  return (
    <FolkSurface background="village" contentStyle={styles.container}><FolkPanel style={styles.panel}><Text accessibilityRole="header" style={styles.title}>{text('result')}</Text><Text style={styles.winner}>{winner}</Text><Text style={styles.score}>{text('score')}: {snapshot.result.scores.PLAYER_A} – {snapshot.result.scores.PLAYER_B}</Text><FolkButton accessibilityLabel={rematchReady ? text('rematchWaiting') : text('rematch')} disabled={busy || rematchReady} onPress={() => void rematch()}>{rematchReady ? text('rematchWaiting') : text('rematch')}</FolkButton><FolkButton variant="blue" accessibilityLabel={text('leaveRoom')} onPress={() => void leave()}>{text('leaveRoom')}</FolkButton></FolkPanel></FolkSurface>
  );
}

const styles = StyleSheet.create({ container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 }, panel: { maxWidth: 480, width: '100%' }, title: { color: '#8A241A', fontSize: 30, fontWeight: '900', textAlign: 'center' }, winner: { color: '#A63D2F', fontSize: 24, fontWeight: '800', marginTop: 18, textAlign: 'center' }, score: { color: '#755846', fontSize: 18, marginTop: 10, textAlign: 'center' }, disabled: { opacity: 0.55 }, loading: { color: '#FFF3CC' } });

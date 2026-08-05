import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { resolveBoardZones } from '../components/board-view';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { CardKind, RoomProjection } from '@rps-cards/game-core';
import { selectedLift, useReducedMotion } from '../ui/motion';

function label(kind: CardKind, locale: Parameters<typeof translate>[0]): string { return translate(locale, kind === 'ROCK' ? 'cardRock' : kind === 'PAPER' ? 'cardPaper' : 'cardScissors'); }

export function OnlineBoardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const locale = useAppStore((state) => state.locale);
  const boardThemeId = useAppStore((state) => state.boardThemeId);
  const client = useMemo(() => createOnlineRoomClient(), []);
  const [snapshot, setSnapshot] = useState<RoomProjection | null>(null);
  const [busy, setBusy] = useState(false);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const zones = resolveBoardZones(boardThemeId, 'folk_default');
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!params.roomCode || !params.sessionId) { router.replace('/rooms'); return; }
    let active = true;
  const poll = async () => { try { const next = await client.snapshot(params.roomCode!, params.sessionId!); if (active) setSnapshot(next); } catch { if (active) router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } };
    void poll(); const handle = setInterval(() => { void poll(); }, 500);
    return () => { active = false; clearInterval(handle); };
  }, [client, params.roomCode, params.sessionId, router]);
  useEffect(() => { if (snapshot?.phase === 'MATCH_RESULT') router.replace({ pathname: '/result', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); }, [params.roomCode, params.sessionId, router, snapshot?.phase]);
  if (!snapshot) return <View style={styles.container}><Text>{text('loading')}</Text></View>;
  const local = snapshot.own;
  const opponent = snapshot.players.find((player) => player.seat !== local.seat);
  const lock = async (cardId: string) => {
    if (busy || snapshot.phase !== 'ROUND_SELECTION' || !params.roomCode || !params.sessionId) return;
    setBusy(true);
    try { setSnapshot(await client.action(params.roomCode, params.sessionId, { type: 'LOCK_CARD', operationId: `lock-${snapshot.round}-${cardId}`, expectedPhase: 'ROUND_SELECTION', expectedRound: snapshot.round, payload: { cardId } })); } finally { setBusy(false); }
  };
  return (
    <View style={styles.container}>
      <View style={[styles.zone, styles.upper, { backgroundColor: zones[0].boardThemeId === 'folk_default' ? '#D8E0D0' : '#D8E0D0' }]}><Text style={styles.zoneLabel}>{text('onlineOpponent')} · {text('score')}: {opponent?.score ?? 0}</Text><Text style={styles.handBacks}>{'▣ '.repeat(opponent?.cardCount ?? 0)}</Text></View>
      <View style={styles.arena}><Text style={styles.arenaTitle}>{snapshot.lastRound ? `${label(snapshot.lastRound.playerA.kind as CardKind, locale)} · ${label(snapshot.lastRound.playerB.kind as CardKind, locale)}` : text('waiting')}</Text><Text style={styles.timer}>{snapshot.deadlineAt ? `${Math.max(0, Math.ceil((snapshot.deadlineAt - Date.now()) / 1_000))}s` : text('waiting')}</Text></View>
      <View style={[styles.zone, styles.lower, { backgroundColor: zones[1].boardThemeId === 'folk_default' ? '#F5E7C5' : '#F5E7C5' }]}><Text style={styles.zoneLabel}>{text('score')}: {local.score}</Text><View style={styles.hand}>{local.hand.map((card) => <Pressable key={card.id} accessibilityRole="button" accessibilityLabel={label(card.kind as CardKind, locale)} accessibilityHint={text('lockCard')} disabled={busy || local.locked} style={[styles.card, local.locked && styles.disabled, local.locked && { transform: [{ translateY: selectedLift(reducedMotion) }] }]} onPress={() => void lock(card.id)}><Text style={styles.cardSymbol}>{card.kind === 'ROCK' ? '●' : card.kind === 'PAPER' ? '■' : '▲'}</Text><Text style={styles.cardText}>{label(card.kind as CardKind, locale)}</Text></Pressable>)}</View></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#43291F', flex: 1 }, zone: { flex: 1, padding: 20 }, upper: { justifyContent: 'flex-start' }, lower: { justifyContent: 'flex-end' }, zoneLabel: { color: '#43291F', fontSize: 16, fontWeight: '800' }, handBacks: { color: '#A63D2F', fontSize: 24, marginTop: 18 }, arena: { alignItems: 'center', backgroundColor: '#FFF9EC', justifyContent: 'center', minHeight: 112, padding: 12 }, arenaTitle: { color: '#43291F', fontSize: 17, fontWeight: '800' }, timer: { color: '#755846', marginTop: 8 }, hand: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }, card: { alignItems: 'center', backgroundColor: '#FFF9EC', borderColor: '#D8B77C', borderRadius: 12, borderWidth: 2, minHeight: 88, padding: 8, width: 78 }, disabled: { opacity: 0.6 }, cardSymbol: { color: '#A63D2F', fontSize: 27 }, cardText: { color: '#43291F', fontSize: 12, fontWeight: '700', marginTop: 4 },
});

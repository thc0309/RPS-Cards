import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { CardKind, RoomProjection } from '@rps-cards/game-core';
import { selectedLift, useReducedMotion } from '../ui/motion';

function label(kind: CardKind, locale: Parameters<typeof translate>[0]): string { return translate(locale, kind === 'ROCK' ? 'cardRock' : kind === 'PAPER' ? 'cardPaper' : 'cardScissors'); }

export function OnlineBoardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const locale = useAppStore((state) => state.locale);
  const client = useMemo(() => createOnlineRoomClient(), []);
  const [snapshot, setSnapshot] = useState<RoomProjection | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!params.roomCode || !params.sessionId) { router.replace('/rooms'); return; }
    let active = true;
    let polling = false;
  const poll = async () => { if (polling) return; polling = true; try { const next = await client.snapshot(params.roomCode!, params.sessionId!); if (active) setSnapshot(next); } catch { if (active) router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } finally { polling = false; } };
    void poll(); const handle = setInterval(() => { void poll(); }, 500);
    return () => { active = false; clearInterval(handle); };
  }, [client, params.roomCode, params.sessionId, router]);
  useEffect(() => { if (snapshot?.phase === 'MATCH_RESULT') router.replace({ pathname: '/result', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); }, [params.roomCode, params.sessionId, router, snapshot?.phase]);
  useEffect(() => {
    if (selectedCardId && snapshot && !snapshot.own.hand.some((card) => card.id === selectedCardId && !card.used)) setSelectedCardId(null);
  }, [selectedCardId, snapshot]);
  if (!snapshot) return <View style={styles.container}><Text>{text('loading')}</Text></View>;
  const local = snapshot.own;
  const opponent = snapshot.players.find((player) => player.seat !== local.seat);
  const availableCards = local.hand.filter((card) => !card.used);
  const lock = async () => {
    if (!selectedCardId || busy || local.locked || snapshot.phase !== 'ROUND_SELECTION' || !params.roomCode || !params.sessionId) return;
    setBusy(true);
    try { setSnapshot(await client.action(params.roomCode, params.sessionId, { type: 'LOCK_CARD', operationId: `lock-${snapshot.round}-${selectedCardId}`, expectedPhase: 'ROUND_SELECTION', expectedRound: snapshot.round, payload: { cardId: selectedCardId } })); } catch { try { setSnapshot(await client.snapshot(params.roomCode, params.sessionId)); } catch { router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } } finally { setBusy(false); }
  };
  return (
    <View style={styles.container}>
      <View style={[styles.zone, styles.upper, styles.folkZone]}><Text style={styles.zoneLabel}>{text('onlineOpponent')} · {text('score')}: {opponent?.score ?? 0}</Text><Text style={styles.handBacks}>{'▣ '.repeat(opponent?.cardCount ?? 0)}</Text><Text style={styles.discards}>{opponent?.discards.map((card) => label(card.kind as CardKind, locale)).join(' · ')}</Text></View>
      <View style={styles.arena}><Text style={styles.arenaTitle}>{snapshot.lastRound ? `${label(snapshot.lastRound.playerA.kind as CardKind, locale)}  VS  ${label(snapshot.lastRound.playerB.kind as CardKind, locale)}` : `VS · ${text('waiting')}`}</Text></View>
      <View style={[styles.zone, styles.lower, styles.folkZone]}><Text style={styles.zoneLabel}>{text('score')}: {local.score}</Text><View style={styles.hand}>{availableCards.map((card) => <Pressable key={card.id} accessibilityRole="button" accessibilityLabel={label(card.kind as CardKind, locale)} accessibilityHint={text('selected')} accessibilityState={{ disabled: busy || local.locked, selected: selectedCardId === card.id }} disabled={busy || local.locked} style={[styles.card, selectedCardId === card.id && { borderColor: '#A63D2F', transform: [{ translateY: selectedLift(reducedMotion) }] }, local.locked && styles.disabled]} onPress={() => setSelectedCardId(card.id)}><Text style={styles.cardSymbol}>{card.kind === 'ROCK' ? '●' : card.kind === 'PAPER' ? '■' : '▲'}</Text><Text style={styles.cardText}>{label(card.kind as CardKind, locale)}</Text></Pressable>)}</View><Text accessibilityLiveRegion="polite" style={styles.discards}>{local.locked ? text('selected') : local.discards.map((card) => label(card.kind as CardKind, locale)).join(' · ')}</Text><Pressable accessibilityRole="button" accessibilityState={{ disabled: !selectedCardId || busy || local.locked }} disabled={!selectedCardId || busy || local.locked} style={[styles.lockButton, (!selectedCardId || busy || local.locked) && styles.disabled]} onPress={() => void lock()}><Text style={styles.lockText}>{text('lockCard')} · {snapshot.deadlineAt ? Math.max(0, Math.ceil((snapshot.deadlineAt - Date.now()) / 1_000)) : 0}s</Text></Pressable></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#43291F', flex: 1 }, zone: { flex: 1, padding: 12 }, folkZone: { backgroundColor: '#F5E7C5' }, upper: { justifyContent: 'flex-start' }, lower: { justifyContent: 'flex-end' }, zoneLabel: { color: '#43291F', fontSize: 16, fontWeight: '800' }, handBacks: { color: '#A63D2F', fontSize: 24, marginTop: 12 }, discards: { color: '#755846', minHeight: 20, marginTop: 4 }, arena: { alignItems: 'center', backgroundColor: '#FFF9EC', justifyContent: 'center', minHeight: 88, padding: 10 }, arenaTitle: { color: '#43291F', fontSize: 17, fontWeight: '800' }, hand: { flexDirection: 'row', gap: 8, marginTop: 8 }, card: { alignItems: 'center', backgroundColor: '#FFF9EC', borderColor: '#D8B77C', borderRadius: 12, borderWidth: 2, minHeight: 72, padding: 4, width: 62 }, disabled: { opacity: 0.6 }, cardSymbol: { color: '#A63D2F', fontSize: 27 }, cardText: { color: '#43291F', fontSize: 11, fontWeight: '700', marginTop: 3 }, lockButton: { alignItems: 'center', backgroundColor: '#A63D2F', borderRadius: 12, justifyContent: 'center', marginTop: 6, minHeight: 44 }, lockText: { color: '#FFF9EC', fontWeight: '900' },
});

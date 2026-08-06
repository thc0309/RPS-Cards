import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { CardKind, RoomProjection } from '@rps-cards/game-core';
import { selectedLift, useReducedMotion } from '../ui/motion';
import { FolkCard, FolkCardBack } from '../components/FolkCard';
import { FolkSurface } from '../components/FolkSurface';
import { folkAssets } from '../ui/folk-assets';

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
  if (!snapshot) return <FolkSurface background="village" contentStyle={styles.container}><Text style={styles.loading}>{text('loading')}</Text></FolkSurface>;
  const local = snapshot.own;
  const opponent = snapshot.players.find((player) => player.seat !== local.seat);
  const availableCards = local.hand.filter((card) => !card.used);
  const lock = async () => {
    if (!selectedCardId || busy || local.locked || snapshot.phase !== 'ROUND_SELECTION' || !params.roomCode || !params.sessionId) return;
    setBusy(true);
    try { setSnapshot(await client.action(params.roomCode, params.sessionId, { type: 'LOCK_CARD', operationId: `lock-${snapshot.round}-${selectedCardId}`, expectedPhase: 'ROUND_SELECTION', expectedRound: snapshot.round, payload: { cardId: selectedCardId } })); } catch { try { setSnapshot(await client.snapshot(params.roomCode, params.sessionId)); } catch { router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } } finally { setBusy(false); }
  };
  return (
    <FolkSurface background="village" contentStyle={styles.container}>
      <View style={[styles.zone, styles.upper, styles.folkZone]}><Text style={styles.zoneLabel}>{text('onlineOpponent')} · {text('score')}: {opponent?.score ?? 0}</Text><View style={styles.backRow}>{Array.from({ length: opponent?.cardCount ?? 0 }, (_, index) => <FolkCardBack key={index} label={text('cardBack')} />)}</View><Text style={styles.discards}>{opponent?.discards.map((card) => label(card.kind as CardKind, locale)).join(' · ')}</Text></View>
      <View style={styles.arena}><Image source={folkAssets.board.vs} style={styles.vs} accessibilityLabel="VS" /><Text style={styles.arenaTitle}>{snapshot.lastRound ? `${label(snapshot.lastRound.playerA.kind as CardKind, locale)}  VS  ${label(snapshot.lastRound.playerB.kind as CardKind, locale)}` : `VS · ${text('waiting')}`}</Text></View>
      <View style={[styles.zone, styles.lower, styles.folkZone]}><Text style={styles.zoneLabel}>{text('score')}: {local.score}</Text><View style={styles.hand}>{availableCards.map((card) => <FolkCard key={card.id} kind={card.kind as CardKind} label={label(card.kind as CardKind, locale)} selected={selectedCardId === card.id} disabled={busy || local.locked} onPress={() => setSelectedCardId(card.id)} style={selectedCardId === card.id ? { transform: [{ translateY: selectedLift(reducedMotion) }] } : undefined} />)}</View><Text accessibilityLiveRegion="polite" style={styles.discards}>{local.locked ? text('selected') : local.discards.map((card) => label(card.kind as CardKind, locale)).join(' · ')}</Text><Pressable accessibilityRole="button" accessibilityState={{ disabled: !selectedCardId || busy || local.locked }} disabled={!selectedCardId || busy || local.locked} style={[styles.lockButton, (!selectedCardId || busy || local.locked) && styles.disabled]} onPress={() => void lock()}><Text style={styles.lockText}>{text('lockCard')} · {snapshot.deadlineAt ? Math.max(0, Math.ceil((snapshot.deadlineAt - Date.now()) / 1_000)) : 0}s</Text></Pressable></View>
    </FolkSurface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, zone: { flex: 1, padding: 12 }, folkZone: { backgroundColor: 'rgba(247,230,176,0.92)', marginHorizontal: 8 }, upper: { justifyContent: 'flex-start' }, lower: { justifyContent: 'flex-end' }, zoneLabel: { color: '#43291F', fontSize: 16, fontWeight: '800' }, backRow: { flexDirection: 'row', gap: 4, marginTop: 12 }, discards: { color: '#755846', minHeight: 20, marginTop: 4 }, arena: { alignItems: 'center', backgroundColor: 'rgba(67,41,31,0.9)', justifyContent: 'center', minHeight: 128, padding: 10 }, vs: { height: 64, marginBottom: 3, width: 64 }, arenaTitle: { color: '#FFF3CC', fontSize: 17, fontWeight: '800' }, hand: { flexDirection: 'row', gap: 8, marginTop: 8 }, disabled: { opacity: 0.6 }, lockButton: { alignItems: 'center', backgroundColor: '#8A241A', borderRadius: 12, justifyContent: 'center', marginTop: 6, minHeight: 50 }, lockText: { color: '#FFF9EC', fontWeight: '900' }, loading: { color: '#FFF3CC', textAlign: 'center' },
});

import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LocalMatchAdapter } from '../game/local-match-adapter';
import { getLocalDraftResult, getLocalMatchAdapter, setLocalMatchAdapter } from '../game/local-session';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { CardKind } from '@rps-cards/game-core';
import { selectedLift, useReducedMotion } from '../ui/motion';
import { useCountdownSeconds } from '../ui/countdown';
import { FolkCard, FolkCardBack } from '../components/FolkCard';
import { FolkSurface } from '../components/FolkSurface';
import { folkAssets } from '../ui/folk-assets';

function cardLabel(kind: CardKind, locale: Parameters<typeof translate>[0]): string {
  return translate(locale, kind === 'ROCK' ? 'cardRock' : kind === 'PAPER' ? 'cardPaper' : 'cardScissors');
}

export function BoardScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const cardSkinId = useAppStore((state) => state.cardSkinId);
  const [adapter] = useState(() => {
    const current = getLocalMatchAdapter();
    if (current) return current;
    const draft = getLocalDraftResult();
    if (!draft) return null;
    const created = new LocalMatchAdapter(draft.hands, (max) => Math.floor(Math.random() * max));
    setLocalMatchAdapter(created);
    return created;
  });
  const [snapshot, setSnapshot] = useState(() => adapter?.getState() ?? null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const reducedMotion = useReducedMotion();
  const remaining = useCountdownSeconds(snapshot?.deadline?.deadlineAt);

  useEffect(() => {
    if (!adapter) { router.replace('/draft'); return; }
    return adapter.subscribe(() => setSnapshot(adapter.getState()));
  }, [adapter, router]);
  useEffect(() => {
    if (snapshot?.match.phase === 'MATCH_RESULT') router.replace('/result');
  }, [router, snapshot?.match.phase]);

  if (!adapter || !snapshot) return null;
  const localPlayer = snapshot.match.players.PLAYER_A;
  const availableCards = localPlayer.cards.filter((card) => !card.used);
  const lastRound = snapshot.match.lastRound;
  const playerDiscards = snapshot.match.discards.filter((card) => card.playerId === 'PLAYER_A');
  const botDiscards = snapshot.match.discards.filter((card) => card.playerId === 'PLAYER_B');

  return (
    <FolkSurface background="village" contentStyle={styles.container}>
      <View style={[styles.zone, styles.upper, styles.folkZone]}>
        <Text style={styles.zoneLabel}>BOT · {text('score')}: {snapshot.match.players.PLAYER_B.score}</Text>
        <View style={styles.backRow}>{snapshot.match.players.PLAYER_B.cards.filter((card) => !card.used).map((card) => <FolkCardBack key={card.id} label={text('cardBack')} />)}</View>
        <Text style={styles.discards}>{botDiscards.map((card) => cardLabel(card.kind, locale)).join(' · ')}</Text>
      </View>
      <View style={styles.arena}>
        <Image source={folkAssets.board.vs} style={styles.vs} accessibilityLabel="VS" />
        <Text style={styles.arenaTitle}>{lastRound ? `${cardLabel(lastRound.playerA.kind, locale)}  VS  ${cardLabel(lastRound.playerB.kind, locale)}` : `VS · ${text('waiting')}`}</Text>
      </View>
      <View style={[styles.zone, styles.lower, styles.folkZone]}>
        <Text style={styles.zoneLabel}>{text('you')} · {text('score')}: {localPlayer.score}</Text>
        <View style={styles.hand}>
          {availableCards.map((card) => (
            <FolkCard key={card.id} kind={card.kind} label={cardLabel(card.kind, locale)} selected={selectedCardId === card.id} onPress={() => setSelectedCardId(card.id)} style={{ transform: selectedCardId === card.id ? [{ translateY: selectedLift(reducedMotion) }] : undefined }} />
          ))}
        </View>
        <Text style={styles.discards}>{playerDiscards.map((card) => cardLabel(card.kind, locale)).join(' · ')}</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !selectedCardId }} disabled={!selectedCardId} style={[styles.lockButton, !selectedCardId && styles.disabled]} onPress={() => { if (selectedCardId) { adapter.lockPlayerCard(selectedCardId); setSelectedCardId(null); } }}><Text style={styles.lockText}>{text('lockCard')} · {remaining}s</Text></Pressable>
        <Text style={styles.skin}>{text('cardSkin')}: {cardSkinId}</Text>
      </View>
    </FolkSurface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  zone: { flex: 1, padding: 12 },
  folkZone: { backgroundColor: 'rgba(247,230,176,0.92)', marginHorizontal: 8 },
  upper: { justifyContent: 'flex-start' },
  lower: { justifyContent: 'flex-end' },
  zoneLabel: { color: '#43291F', fontSize: 16, fontWeight: '800' },
  backRow: { flexDirection: 'row', gap: 4, marginTop: 12 },
  discards: { color: '#755846', minHeight: 20, marginTop: 8 },
  arena: { alignItems: 'center', backgroundColor: 'rgba(67,41,31,0.9)', justifyContent: 'center', minHeight: 128, padding: 10 },
  vs: { height: 64, marginBottom: 3, width: 64 },
  arenaTitle: { color: '#43291F', fontSize: 17, fontWeight: '800' },
  hand: { flexDirection: 'row', gap: 8, marginTop: 8 },
  lockButton: { alignItems: 'center', backgroundColor: '#A63D2F', borderRadius: 12, justifyContent: 'center', marginTop: 6, minHeight: 44 },
  lockText: { color: '#FFF9EC', fontWeight: '900' },
  disabled: { opacity: 0.5 },
  skin: { color: '#755846', fontSize: 12, marginTop: 8 },
});

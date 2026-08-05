import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LocalMatchAdapter } from '../game/local-match-adapter';
import { getLocalDraftResult, getLocalMatchAdapter, setLocalMatchAdapter } from '../game/local-session';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { CardKind } from '@rps-cards/game-core';
import { selectedLift, useReducedMotion } from '../ui/motion';
import { useCountdownSeconds } from '../ui/countdown';

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
    <View style={styles.container}>
      <View style={[styles.zone, styles.upper, styles.folkZone]}>
        <Text style={styles.zoneLabel}>BOT · {text('score')}: {snapshot.match.players.PLAYER_B.score}</Text>
        <Text style={styles.handBacks}>{'▣ '.repeat(snapshot.match.players.PLAYER_B.cards.filter((card) => !card.used).length)}</Text>
        <Text style={styles.discards}>{botDiscards.map((card) => cardLabel(card.kind, locale)).join(' · ')}</Text>
      </View>
      <View style={styles.arena}>
        <Text style={styles.arenaTitle}>{lastRound ? `${cardLabel(lastRound.playerA.kind, locale)}  VS  ${cardLabel(lastRound.playerB.kind, locale)}` : `VS · ${text('waiting')}`}</Text>
      </View>
      <View style={[styles.zone, styles.lower, styles.folkZone]}>
        <Text style={styles.zoneLabel}>{text('you')} · {text('score')}: {localPlayer.score}</Text>
        <View style={styles.hand}>
          {availableCards.map((card) => (
            <Pressable key={card.id} accessibilityRole="button" accessibilityLabel={cardLabel(card.kind, locale)} accessibilityHint={text('selected')} accessibilityState={{ selected: selectedCardId === card.id }} style={[styles.card, selectedCardId === card.id && { borderColor: '#A63D2F', transform: [{ translateY: selectedLift(reducedMotion) }] }]} onPress={() => setSelectedCardId(card.id)}>
              <Text style={styles.cardSymbol}>{card.kind === 'ROCK' ? '●' : card.kind === 'PAPER' ? '■' : '▲'}</Text>
              <Text style={styles.cardText}>{cardLabel(card.kind, locale)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.discards}>{playerDiscards.map((card) => cardLabel(card.kind, locale)).join(' · ')}</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !selectedCardId }} disabled={!selectedCardId} style={[styles.lockButton, !selectedCardId && styles.disabled]} onPress={() => { if (selectedCardId) { adapter.lockPlayerCard(selectedCardId); setSelectedCardId(null); } }}><Text style={styles.lockText}>{text('lockCard')} · {remaining}s</Text></Pressable>
        <Text style={styles.skin}>{text('cardSkin')}: {cardSkinId}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#43291F', flex: 1 },
  zone: { flex: 1, padding: 12 },
  folkZone: { backgroundColor: '#F5E7C5' },
  upper: { justifyContent: 'flex-start' },
  lower: { justifyContent: 'flex-end' },
  zoneLabel: { color: '#43291F', fontSize: 16, fontWeight: '800' },
  handBacks: { color: '#A63D2F', fontSize: 24, marginTop: 18 },
  discards: { color: '#755846', minHeight: 20, marginTop: 8 },
  arena: { alignItems: 'center', backgroundColor: '#FFF9EC', justifyContent: 'center', minHeight: 88, padding: 10 },
  arenaTitle: { color: '#43291F', fontSize: 17, fontWeight: '800' },
  hand: { flexDirection: 'row', gap: 8, marginTop: 8 },
  card: { alignItems: 'center', backgroundColor: '#FFF9EC', borderColor: '#D8B77C', borderRadius: 12, borderWidth: 2, minHeight: 72, padding: 4, width: 62 },
  cardSymbol: { color: '#A63D2F', fontSize: 27 },
  cardText: { color: '#43291F', fontSize: 11, fontWeight: '700', marginTop: 3 },
  lockButton: { alignItems: 'center', backgroundColor: '#A63D2F', borderRadius: 12, justifyContent: 'center', marginTop: 6, minHeight: 44 },
  lockText: { color: '#FFF9EC', fontWeight: '900' },
  disabled: { opacity: 0.5 },
  skin: { color: '#755846', fontSize: 12, marginTop: 8 },
});

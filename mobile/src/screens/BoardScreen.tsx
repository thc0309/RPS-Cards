import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LocalMatchAdapter } from '../game/local-match-adapter';
import { getLocalDraftResult, getLocalMatchAdapter, setLocalMatchAdapter } from '../game/local-session';
import { resolveBoardZones } from '../components/board-view';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { CardKind } from '@rps-cards/game-core';
import { selectedLift, useReducedMotion } from '../ui/motion';

function cardLabel(kind: CardKind, locale: Parameters<typeof translate>[0]): string {
  return translate(locale, kind === 'ROCK' ? 'cardRock' : kind === 'PAPER' ? 'cardPaper' : 'cardScissors');
}

export function BoardScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const boardThemeId = useAppStore((state) => state.boardThemeId);
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
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const zones = resolveBoardZones(boardThemeId, 'folk_default');
  const reducedMotion = useReducedMotion();

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

  return (
    <View style={styles.container}>
      <View style={[styles.zone, styles.upper, { backgroundColor: zones[0].boardThemeId === 'folk_default' ? '#D8E0D0' : '#D8E0D0' }]}>
        <Text style={styles.zoneLabel}>BOT · {text('score')}: {snapshot.match.players.PLAYER_B.score}</Text>
        <Text style={styles.handBacks}>{'▣ '.repeat(snapshot.match.players.PLAYER_B.cards.filter((card) => !card.used).length)}</Text>
      </View>
      <View style={styles.arena}>
        <Text style={styles.arenaTitle}>{lastRound ? `${cardLabel(lastRound.playerA.kind, locale)} · ${cardLabel(lastRound.playerB.kind, locale)}` : text('waiting')}</Text>
        <Text style={styles.timer}>{snapshot.deadline ? '15s' : text('waiting')}</Text>
      </View>
      <View style={[styles.zone, styles.lower, { backgroundColor: zones[1].boardThemeId === 'folk_default' ? '#F5E7C5' : '#F5E7C5' }]}>
        <Text style={styles.zoneLabel}>{text('home')} · {text('score')}: {localPlayer.score}</Text>
        <View style={styles.hand}>
          {availableCards.map((card) => (
            <Pressable key={card.id} accessibilityRole="button" accessibilityLabel={cardLabel(card.kind, locale)} accessibilityHint={text('lockCard')} accessibilityState={{ selected: snapshot.selectedCardId === card.id }} style={[styles.card, snapshot.selectedCardId === card.id && { borderColor: '#A63D2F', transform: [{ translateY: selectedLift(reducedMotion) }] }]} onPress={() => adapter.lockPlayerCard(card.id)}>
              <Text style={styles.cardSymbol}>{card.kind === 'ROCK' ? '●' : card.kind === 'PAPER' ? '■' : '▲'}</Text>
              <Text style={styles.cardText}>{cardLabel(card.kind, locale)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.skin}>{text('cardSkin')}: {cardSkinId}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#43291F', flex: 1 },
  zone: { flex: 1, padding: 20 },
  upper: { justifyContent: 'flex-start' },
  lower: { justifyContent: 'flex-end' },
  zoneLabel: { color: '#43291F', fontSize: 16, fontWeight: '800' },
  handBacks: { color: '#A63D2F', fontSize: 24, marginTop: 18 },
  arena: { alignItems: 'center', backgroundColor: '#FFF9EC', justifyContent: 'center', minHeight: 112, padding: 12 },
  arenaTitle: { color: '#43291F', fontSize: 17, fontWeight: '800' },
  timer: { color: '#755846', marginTop: 8 },
  hand: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  card: { alignItems: 'center', backgroundColor: '#FFF9EC', borderColor: '#D8B77C', borderRadius: 12, borderWidth: 2, minHeight: 88, padding: 8, width: 78 },
  cardSelected: { borderColor: '#A63D2F', transform: [{ translateY: -5 }] },
  cardSymbol: { color: '#A63D2F', fontSize: 27 },
  cardText: { color: '#43291F', fontSize: 12, fontWeight: '700', marginTop: 4 },
  skin: { color: '#755846', fontSize: 12, marginTop: 8 },
});

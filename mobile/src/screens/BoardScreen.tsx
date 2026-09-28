import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import type { CardKind } from '@rps-cards/game-core';
import { FolkBoardView } from '../components/FolkGameViews';
import { LocalMatchAdapter } from '../game/local-match-adapter';
import { getLocalDraftResult, getLocalMatchAdapter, setLocalMatchAdapter } from '../game/local-session';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { useCountdownSeconds } from '../ui/countdown';
import { selectedLift, useReducedMotion } from '../ui/motion';

function cardLabel(kind: CardKind, locale: Parameters<typeof translate>[0]): string {
  return translate(locale, kind === 'ROCK' ? 'cardRock' : kind === 'PAPER' ? 'cardPaper' : 'cardScissors');
}

export function BoardScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const [adapter, setAdapter] = useState(() => getLocalMatchAdapter());
  const [snapshot, setSnapshot] = useState(() => adapter?.getState() ?? null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const reducedMotion = useReducedMotion();
  const remaining = useCountdownSeconds(snapshot?.deadline?.deadlineAt);

  useEffect(() => {
    if (!adapter) {
      const draft = getLocalDraftResult();
      if (!draft) { router.replace('/draft'); return; }
      const created = new LocalMatchAdapter(draft.hands, (max) => Math.floor(Math.random() * max));
      setLocalMatchAdapter(created);
      setAdapter(created);
      setSnapshot(created.getState());
      return;
    }
    setSnapshot(adapter.getState());
    return adapter.subscribe(() => setSnapshot(adapter.getState()));
  }, [adapter, router]);
  useEffect(() => {
    if (snapshot?.match.phase === 'MATCH_RESULT') router.replace('/result');
  }, [router, snapshot?.match.phase]);
  const lock = useCallback((cardId: string) => {
    if (!adapter) return;
    adapter.lockPlayerCard(cardId);
    setSelectedCardId(null);
  }, [adapter]);

  if (!adapter || !snapshot) return null;
  const player = snapshot.match.players.PLAYER_A;
  const opponent = snapshot.match.players.PLAYER_B;
  const playerDiscards = snapshot.match.discards.filter((card) => card.playerId === 'PLAYER_A');
  const opponentDiscards = snapshot.match.discards.filter((card) => card.playerId === 'PLAYER_B');
  const lastRound = snapshot.match.lastRound;

  return <FolkBoardView opponentName="BOT" playerName={text('you')} scoreLabel={text('available')} opponentScore={opponent.score} playerScore={player.score} opponentCardCount={opponent.cards.filter((card) => !card.used).length} opponentDiscards={opponentDiscards.map((card) => card.kind)} playerDiscards={playerDiscards.map((card) => card.kind)} cards={player.cards.filter((card) => !card.used)} selectedCardId={selectedCardId} lockedCardId={player.lockedCardId} canLock={snapshot.match.phase === 'ROUND_SELECTION'} busy={false} reducedMotion={reducedMotion} lastRound={lastRound ? { player: lastRound.playerA.kind, opponent: lastRound.playerB.kind } : null} remaining={remaining} cardBackLabel={text('cardBack')} discardLabel={text('discards')} lockLabel={text('lockCard')} waitingLabel={text('waiting')} selectedLabel={text('selected')} cardLabel={(kind) => cardLabel(kind, locale)} selectedLift={selectedLift(reducedMotion)} onSelect={setSelectedCardId} onLock={lock} />;
}

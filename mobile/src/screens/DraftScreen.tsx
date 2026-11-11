import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import type { CardKind } from '@rps-cards/game-core';
import { LocalBotDraftAdapter } from '../game/local-bot-adapter';
import { pickBotPersona } from '../game/bot-persona';
import { FolkLoadingView } from '../components/FolkLoadingView';
import { LocalMatchAdapter } from '../game/local-match-adapter';
import { setLocalDraftResult, setLocalMatchAdapter } from '../game/local-session';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { useCountdownSeconds } from '../ui/countdown';
import { FolkDraftView } from '../components/FolkGameViews';

export const DRAFT_REVEAL_MS = 1_200;
const cardKey = { ROCK: 'cardRock', PAPER: 'cardPaper', SCISSORS: 'cardScissors' } as const satisfies Record<CardKind, string>;
export function DraftScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const [adapter, setAdapter] = useState<LocalBotDraftAdapter | null>(null);
  const [snapshot, setSnapshot] = useState<ReturnType<LocalBotDraftAdapter['getState']> | null>(null);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const remaining = useCountdownSeconds(snapshot?.deadline?.deadlineAt);

  useEffect(() => {
    const created = new LocalBotDraftAdapter((max) => Math.floor(Math.random() * max));
    setAdapter(created);
    setSnapshot(created.getState());
    const unsubscribe = created.subscribe(() => setSnapshot(created.getState()));
    return () => { unsubscribe(); created.dispose(); };
  }, []);
  useEffect(() => {
    const result = snapshot?.result;
    if (!result) return;
    // Hold on the flipped extra card for a beat; the match (and its timer) starts afterwards.
    const handle = setTimeout(() => {
      const random = (max: number) => Math.floor(Math.random() * max);
      setLocalDraftResult(result);
      setLocalMatchAdapter(new LocalMatchAdapter(result.hands, random, { botPersona: pickBotPersona(random) }));
      router.replace('/board');
    }, DRAFT_REVEAL_MS);
    return () => clearTimeout(handle);
  }, [router, snapshot?.result]);

  if (!adapter || !snapshot) return <FolkLoadingView label={text('loading')} />;
  const extra = snapshot.result?.extraCards.PLAYER_A;
  return <FolkDraftView title={text('draftTitle')} status={snapshot.status === 'WAITING' ? text('draftOpponentTurn') : snapshot.status === 'COMPLETE' ? text('draftPicked') : text('draftYourTurn')} reveal={extra ? { kind: extra, label: text(cardKey[extra]), caption: text('draftReveal') } : null} instruction={text('draftInstruction')} timer={remaining} cardBackLabel={text('cardBack')} unavailableLabel={text('unavailable')} positions={snapshot.view.availablePositions.map((item) => item.position)} selectedPosition={snapshot.selectedPosition} disabled={snapshot.status !== 'AVAILABLE'} onPick={(position) => adapter.selectPlayerPosition(position)} />;
}

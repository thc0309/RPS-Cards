import { ROUND_FLIP_MS, ROUND_OUTCOME_MS, type CardKind, type PlayerId, type RoomProjection, type RoundTimeline, type RoundOutcome } from '@rps-cards/game-core';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

type PublicRound = NonNullable<RoomProjection['lastRound']>;
export interface BoardRoundPresentation {
  readonly stage: 'selection' | 'prepare' | 'flip' | 'outcome' | 'discard' | 'complete';
  readonly progress: number;
  readonly flipRemainingMs: number;
  readonly discardProgress: number;
  readonly discardRemainingMs: number;
  readonly facesVisible: boolean;
  readonly scoreVisible: boolean;
  readonly discardsVisible: boolean;
  readonly outcome: RoundOutcome | null;
  readonly cards: { readonly player: CardKind; readonly opponent: CardKind } | null;
  readonly key: string;
}

export function acceptBoardSnapshot(current: RoomProjection | null, next: RoomProjection): boolean {
  if (!current) return true;
  if (next.revision === undefined || current.revision === undefined) return current.revision === undefined;
  return next.revision > current.revision || (next.revision === current.revision && (next.serverNow ?? 0) >= (current.serverNow ?? 0));
}

export function getRoundPresentation(phase: RoomProjection['phase'], round: number, timeline: RoundTimeline | null | undefined, lastRound: PublicRound | null | undefined, now: number, seat: PlayerId): BoardRoundPresentation {
  const active = timeline?.round === round && (phase === 'ROUND_REVEAL' || phase === 'ROUND_RESULT');
  const revealed = active && phase === 'ROUND_RESULT' && lastRound?.round === round;
  const elapsed = timeline ? now - timeline.revealAt : 0;
  const progress = revealed ? Math.max(0, Math.min(1, elapsed / ROUND_FLIP_MS)) : 0;
  const stage = phase === 'ROUND_SELECTION' ? 'selection' : !active ? 'complete' : !revealed ? 'prepare' : elapsed < ROUND_FLIP_MS ? 'flip' : elapsed < ROUND_FLIP_MS + ROUND_OUTCOME_MS ? 'outcome' : now < timeline!.completeAt ? 'discard' : 'complete';
  const outcome = lastRound && (revealed || phase === 'ROUND_SELECTION') ? (seat === 'PLAYER_A' ? lastRound.outcomeForA : lastRound.outcomeForA === 'WIN' ? 'LOSS' : lastRound.outcomeForA === 'LOSS' ? 'WIN' : 'DRAW') : null;
  const mine = seat === 'PLAYER_A' ? lastRound?.playerA : lastRound?.playerB;
  const theirs = seat === 'PLAYER_A' ? lastRound?.playerB : lastRound?.playerA;
  return { stage, progress, flipRemainingMs: revealed ? Math.max(0, ROUND_FLIP_MS - elapsed) : 0, facesVisible: Boolean(revealed && progress >= .5), discardProgress: timeline ? Math.max(0, Math.min(1, (now - timeline.completeAt + 300) / 300)) : 0, discardRemainingMs: timeline ? Math.max(0, timeline.completeAt - now) : 0, scoreVisible: !active || stage === 'outcome' || stage === 'discard' || stage === 'complete', discardsVisible: !active || stage === 'complete', outcome, cards: revealed && stage !== 'complete' && mine && theirs ? { player: mine.kind as CardKind, opponent: theirs.kind as CardKind } : null, key: `${lastRound?.round ?? round}` };
}

// Wake only at presentation boundaries; Reanimated owns every flip frame.
export function useRoundPresentation(phase: RoomProjection['phase'], round: number, timeline: RoundTimeline | null | undefined, lastRound: PublicRound | null | undefined, seat: PlayerId, clockOffset = 0, matchId = 'legacy'): BoardRoundPresentation {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const wake = () => setTick((value) => value + 1);
    const boundaries = timeline ? [timeline.revealAt, timeline.revealAt + ROUND_FLIP_MS / 2, timeline.revealAt + ROUND_FLIP_MS, timeline.revealAt + ROUND_FLIP_MS + ROUND_OUTCOME_MS, timeline.completeAt] : [];
    const timers = boundaries.filter((at) => at > Date.now() + clockOffset).map((at) => setTimeout(wake, at - Date.now() - clockOffset));
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') wake(); });
    return () => { timers.forEach(clearTimeout); subscription.remove(); };
  }, [clockOffset, timeline, phase]);
  void tick;
  const presentation = getRoundPresentation(phase, round, timeline, lastRound, Date.now() + clockOffset, seat);
  return { ...presentation, key: `${matchId}:${presentation.key}` };
}

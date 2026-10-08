import { useEffect, useId, useMemo } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { ROUND_FLIP_MS, ROUND_OUTCOME_MS, ROUND_PREPARE_MS, type PlayerId, type RoomProjection, type RoundTimeline } from '@rps-cards/game-core';
import { feedbackCueDurationMs, useFeedback, type FeedbackCue, type FeedbackRuntime, type TerminalCue } from './feedback';

export type RoundFeedbackInput = {
  matchId: string; round: number; phase: string; lockedCardId: string | null; seat: PlayerId; synced: boolean;
  timeline?: RoundTimeline | null; lastRound?: RoomProjection['lastRound']; deadlineAt?: number; clockOffset?: number; terminalCue?: TerminalCue;
};
type BoardFeedback = Pick<FeedbackRuntime, 'play' | 'vibrate' | 'cancelScope' | 'observeMatch'>;

/** All events use the authority clock; late events disappear instead of becoming a replay queue. */
export function createRoundFeedbackController(feedback: BoardFeedback, scope: string) {
  let input: RoundFeedbackInput | null = null;
  let foreground = true;
  let screenReader = true;
  let needsSeed = true;
  let disposed = false;
  const handled = new Set<string>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  function clearTimers() { timers.forEach(clearTimeout); timers.clear(); }
  function reconcile(seed = false) {
    clearTimers();
    if (!input || disposed || !foreground || !input.synced) return;
    const snapshot = input;
    const offset = snapshot.clockOffset ?? 0;
    const now = Date.now() + offset;
    const schedule = (key: string, at: number, end: number, cue: FeedbackCue, allowed: () => boolean) => {
      if (handled.has(key)) return;
      if (at < now || (seed && at === now)) { handled.add(key); return; }
      const fire = () => {
        timers.delete(key); handled.add(key);
        if (disposed || !foreground || !input?.synced || !allowed()) return;
        const latestStart = end - offset - feedbackCueDurationMs(cue);
        if (Date.now() > latestStart) return;
        feedback.play(cue, { scope, matchId: snapshot.matchId, expiresAt: Math.min(latestStart + 1, Date.now() + 120) });
      };
      if (at === now) fire(); else timers.set(key, setTimeout(fire, at - now));
    };
    const timeline = snapshot.timeline;
    if (timeline?.round === snapshot.round && (snapshot.phase === 'ROUND_REVEAL' || snapshot.phase === 'ROUND_RESULT')) {
      [0, 260, 520].forEach((delta) => schedule(`prepare-${delta}`, timeline.revealAt - ROUND_PREPARE_MS + delta, timeline.revealAt, 'tick', () => input?.phase === 'ROUND_REVEAL'));
      const revealed = () => input?.phase === 'ROUND_RESULT' && input.lastRound?.round === snapshot.round;
      schedule('flip', timeline.revealAt + ROUND_FLIP_MS / 2, timeline.revealAt + ROUND_FLIP_MS, 'card-flip', revealed);
      if (snapshot.lastRound?.round === snapshot.round) {
        const outcome = snapshot.seat === 'PLAYER_A' ? snapshot.lastRound.outcomeForA : snapshot.lastRound.outcomeForA === 'WIN' ? 'LOSS' : snapshot.lastRound.outcomeForA === 'LOSS' ? 'WIN' : 'DRAW';
        schedule('outcome', timeline.revealAt + ROUND_FLIP_MS, timeline.revealAt + ROUND_FLIP_MS + ROUND_OUTCOME_MS, outcome === 'WIN' ? 'round-win' : outcome === 'LOSS' ? 'round-loss' : 'round-draw', revealed);
      }
      schedule('discard', timeline.revealAt + ROUND_FLIP_MS + ROUND_OUTCOME_MS, timeline.completeAt, 'paper-slide', revealed);
    }
    if (!screenReader && snapshot.phase === 'ROUND_SELECTION' && !snapshot.lockedCardId && snapshot.deadlineAt !== undefined) {
      [3, 2, 1].forEach((seconds) => schedule(`countdown-${seconds}`, snapshot.deadlineAt! - seconds * 1000, snapshot.deadlineAt! - seconds * 1000 + 120, 'tick', () => input?.phase === 'ROUND_SELECTION' && !input.lockedCardId && !screenReader));
    }
  }
  return {
    activate() { disposed = false; needsSeed = true; },
    update(next: RoundFeedbackInput) {
      if (disposed || (input?.matchId === next.matchId && next.round < input.round)) return;
      const previous = input;
      const seed = needsSeed || !previous || previous.matchId !== next.matchId;
      if (previous?.matchId !== next.matchId || previous.round !== next.round) { clearTimers(); handled.clear(); feedback.cancelScope(scope); }
      input = next;
      if (!foreground || !next.synced) { needsSeed = true; clearTimers(); feedback.cancelScope(scope); return; }
      needsSeed = false;
      feedback.observeMatch({ matchId: next.matchId, phase: next.phase, cue: next.terminalCue, synced: true, seed });
      if (!seed && previous?.round === next.round && next.lockedCardId && previous.lockedCardId !== next.lockedCardId && (next.phase === 'ROUND_SELECTION' || next.phase === 'ROUND_REVEAL')) {
        feedback.play('card-lock', { scope, matchId: next.matchId }); feedback.vibrate();
      }
      reconcile(seed);
    },
    setForeground(next: boolean) {
      if (foreground === next) return;
      foreground = next; needsSeed = true; clearTimers(); feedback.cancelScope(scope);
    },
    setScreenReaderEnabled(next: boolean) { screenReader = next; reconcile(true); },
    dispose() { disposed = true; needsSeed = true; clearTimers(); feedback.cancelScope(scope); },
  };
}

export function useRoundFeedback() {
  const feedback = useFeedback();
  const scope = useId();
  const controller = useMemo(() => createRoundFeedbackController(feedback, `board-${scope}`), [feedback, scope]);
  useEffect(() => {
    let alive = true;
    controller.activate();
    controller.setForeground(AppState.currentState === 'active');
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => { if (alive) controller.setScreenReaderEnabled(enabled); }).catch(() => {});
    const reader = AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => controller.setScreenReaderEnabled(enabled));
    const lifecycle = AppState.addEventListener('change', (state) => controller.setForeground(state === 'active'));
    return () => { alive = false; reader.remove(); lifecycle.remove(); controller.dispose(); };
  }, [controller]);
  return controller;
}

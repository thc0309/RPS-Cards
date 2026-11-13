import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { CardKind, RoomProjection } from '@rps-cards/game-core';
import { FolkResultLoadingView, FolkResultView } from '../components/FolkGameViews';
import { createRoomClient, roomEntryRoute } from '../game/room-client';
import { interstitialGate } from '../ads/interstitial-gate';
import { translate } from '../i18n';
import { deleteReconnectCredential } from '../security/reconnect-credential';
import { useAppStore } from '../store/app-store';
import { pairRoundHistory } from '../ui/round-history';
import { resultOutcome } from '../ui/result-outcome';
import { useFeedback, useTerminalFeedback } from '../ui/feedback';
import { acceptBoardSnapshot } from '../game/board-round-presentation';

function cardLabel(kind: CardKind, locale: Parameters<typeof translate>[0]): string {
  return translate(locale, kind === 'ROCK' ? 'cardRock' : kind === 'PAPER' ? 'cardPaper' : 'cardScissors');
}

export function OnlineResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const locale = useAppStore((state) => state.locale);
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);
  const client = useMemo(() => createRoomClient(), []);
  const [snapshot, setSnapshot] = useState<RoomProjection | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const snapshotRef = useRef<RoomProjection | null>(null);
  const previousPhase = useRef<RoomProjection['phase'] | null>(null);
  const draftRouted = useRef(false);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const feedback = useFeedback();
  const terminalCue = useTerminalFeedback(snapshot?.matchId);
  const receive = useCallback((next: RoomProjection) => {
    if (!acceptBoardSnapshot(snapshotRef.current, next)) return;
    snapshotRef.current = next; setSnapshot(next);
  }, []);

  useEffect(() => {
    if (!params.roomCode || !params.sessionId) { router.replace(roomEntryRoute()); return; }
    let active = true;
    let polling = false;
    const poll = async () => { if (polling) return; polling = true; try { const next = await client.snapshot(params.roomCode!, params.sessionId!); if (active) receive(next); } catch { if (active) router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } finally { polling = false; } };
    void poll();
    const handle = setInterval(() => { void poll(); }, 700);
    return () => { active = false; clearInterval(handle); };
  }, [client, params.roomCode, params.sessionId, receive, router]);
  useEffect(() => {
    const phase = snapshot?.phase;
    if (!phase) return;
    if ((phase === 'DRAFT_PLAYER_A' || phase === 'DRAFT_PLAYER_B') && !draftRouted.current) {
      draftRouted.current = true; feedback.setMatch(null);
      if (previousPhase.current === 'MATCH_RESULT') feedback.play('paper-slide');
      router.replace({ pathname: '/draft', params: { roomCode: params.roomCode, sessionId: params.sessionId } });
    }
    previousPhase.current = phase;
  }, [feedback, params.roomCode, params.sessionId, router, snapshot?.phase]);

  if (!snapshot?.result || !params.roomCode || !params.sessionId) return <FolkResultLoadingView label={text('loading')} />;
  const opponent = snapshot.players.find((player) => player.seat !== snapshot.own.seat);
  const playerScore = snapshot.result.scores[snapshot.own.seat];
  const opponentScore = opponent ? snapshot.result.scores[opponent.seat] : 0;
  const rematchReady = snapshot.rematchReady?.includes(snapshot.own.seat) ?? false;
  const opponentLeft = snapshot.opponentLeft === true;
  const history = pairRoundHistory(snapshot.own.discards.map((card) => card.kind as CardKind), opponent?.discards.map((card) => card.kind as CardKind) ?? []);
  const outcome = resultOutcome(playerScore, opponentScore, snapshot.result.winner === snapshot.own.seat, history.length);
  const rematch = async () => {
    if (busyRef.current || rematchReady || opponentLeft) return;
    busyRef.current = true;
    if (snapshot.matchId) feedback.leaveResult(snapshot.matchId);
    feedback.setMatch(null);
    setBusy(true);
    try { receive(await client.action(params.roomCode!, params.sessionId!, { type: 'REMATCH_READY', operationId: `rematch-${Date.now()}`, expectedPhase: 'MATCH_RESULT', expectedRound: snapshot.round, payload: { ready: true } })); } catch { router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } finally { busyRef.current = false; setBusy(false); }
  };
  const leave = async () => {
    if (snapshot.matchId) feedback.leaveResult(snapshot.matchId);
    feedback.setMatch(null);
    try { await client.leave(params.roomCode!, params.sessionId!); } catch { /* heartbeat expiry closes an unreachable room */ }
    await deleteReconnectCredential();
    setActiveRoom(null);
    // The ad sits after the match, never in front of entering a room.
    try { await interstitialGate.attemptInterstitial(); } catch { /* an ad failure never blocks leaving */ }
    feedback.play('paper-slide');
    router.replace('/');
  };

  return <FolkResultView celebrateWin={terminalCue === 'match-win'} title={text('result')} outcome={outcome === 'DRAW' ? text('draw') : outcome === 'FORFEIT_WIN' ? text('youWin') : outcome === 'WIN' ? text('youWin') : text('youLose')} scoreLabel={text('score')} playerScore={playerScore} opponentScore={opponentScore} roundLabel={text('round')} history={history} cardLabel={(kind) => cardLabel(kind, locale)} hint={outcome === 'FORFEIT_WIN' ? text('opponentLeft') : undefined} columnLabels={{ player: text('you'), opponent: text('onlineOpponent') }} roundMarks={{ win: text('roundBannerWin'), loss: text('roundBannerLoss'), draw: text('roundBannerDraw') }} primaryLabel={opponentLeft ? text('opponentLeft') : rematchReady ? text('rematchWaiting') : text('rematch')} secondaryLabel={text('home')} primaryDisabled={busy || rematchReady || opponentLeft} onPrimary={() => void rematch()} onSecondary={() => void leave()} />;
}

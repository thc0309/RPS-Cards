import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { AppState } from 'react-native';
import { acceptBoardSnapshot, useRoundPresentation } from '../game/board-round-presentation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { CardKind, RoomProjection } from '@rps-cards/game-core';
import { FolkBoardView } from '../components/FolkGameViews';
import { FolkSurface } from '../components/FolkSurface';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { useCountdownSeconds } from '../ui/countdown';
import { selectedLift, useReducedMotion } from '../ui/motion';

function label(kind: CardKind, locale: Parameters<typeof translate>[0]): string {
  return translate(locale, kind === 'ROCK' ? 'cardRock' : kind === 'PAPER' ? 'cardPaper' : 'cardScissors');
}

export function OnlineBoardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const roomCode = params.roomCode;
  const sessionId = params.sessionId;
  const locale = useAppStore((state) => state.locale);
  const client = useMemo(() => createOnlineRoomClient(), []);
  const [snapshot, setSnapshot] = useState<RoomProjection | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const snapshotRef = useRef<RoomProjection | null>(null);
  const busyRef = useRef(false);
  const lockAttemptRef = useRef(0);
  const operationNonce = useRef(randomUUID());
  const epoch = useRef(0);
  const mounted = useRef(false);
  const foreground = useRef(AppState.currentState === 'active');
  const [synced, setSynced] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const reducedMotion = useReducedMotion();
  const remaining = useCountdownSeconds(snapshot?.deadlineAt === undefined ? undefined : snapshot.deadlineAt - clockOffset);
  const presentation = useRoundPresentation(snapshot?.phase ?? 'ROUND_SELECTION', snapshot?.round ?? 1, snapshot?.timeline, snapshot?.lastRound, snapshot?.own.seat ?? 'PLAYER_A', clockOffset, snapshot?.matchId);
  const receive = useCallback((next: RoomProjection, requestEpoch: number, startedAt: number) => {
    if (!mounted.current || !foreground.current || requestEpoch !== epoch.current || !acceptBoardSnapshot(snapshotRef.current, next)) return;
    snapshotRef.current = next;
    setSnapshot(next);
    if (next.serverNow !== undefined) setClockOffset(next.serverNow - (startedAt + Date.now()) / 2);
    setSynced(true);
  }, []);

  useEffect(() => {
    if (!roomCode || !sessionId) { router.replace('/rooms'); return; }
    mounted.current = true;
    let pollingEpoch: number | null = null;
    const poll = async () => {
      if (!foreground.current || pollingEpoch === epoch.current) return;
      const requestEpoch = epoch.current;
      pollingEpoch = requestEpoch;
      const startedAt = Date.now();
      try { receive(await client.snapshot(roomCode, sessionId), requestEpoch, startedAt); }
      catch { if (mounted.current && foreground.current && requestEpoch === epoch.current) router.replace({ pathname: '/reconnecting', params: { roomCode, sessionId } }); }
      finally { if (pollingEpoch === requestEpoch) pollingEpoch = null; }
    };
    void poll();
    const handle = setInterval(() => { void poll(); }, 500);
    const subscription = AppState.addEventListener('change', (state) => {
      epoch.current += 1;
      foreground.current = state === 'active';
      setSynced(false);
      busyRef.current = false;
      setBusy(false);
      if (foreground.current) void poll();
    });
    return () => { mounted.current = false; epoch.current += 1; clearInterval(handle); subscription.remove(); };
  }, [client, receive, roomCode, router, sessionId]);
  useEffect(() => { if (snapshot?.phase === 'MATCH_RESULT') router.replace({ pathname: '/result', params: { roomCode, sessionId } }); }, [roomCode, router, sessionId, snapshot?.phase]);
  useEffect(() => {
    if (selectedCardId && snapshot && !snapshot.own.hand.some((card) => card.id === selectedCardId && !card.used)) setSelectedCardId(null);
  }, [selectedCardId, snapshot]);
  const lock = useCallback(async (cardId: string) => {
    const current = snapshotRef.current;
    if (!mounted.current || !foreground.current || !synced || !current || busyRef.current || current.phase !== 'ROUND_SELECTION' || !roomCode || !sessionId || !current.own.hand.some((card) => card.id === cardId && !card.used)) return;
    busyRef.current = true;
    setBusy(true);
    const operationId = `${operationNonce.current}-${current.round}-${++lockAttemptRef.current}`;
    const requestEpoch = epoch.current;
    const startedAt = Date.now();
    try {
      const next = await client.action(roomCode, sessionId, { type: 'LOCK_CARD', operationId, expectedPhase: 'ROUND_SELECTION', expectedRound: current.round, payload: { cardId } });
      receive(next, requestEpoch, startedAt);
      if (mounted.current && requestEpoch === epoch.current) setSelectedCardId(null);
    } catch {
      try {
        if (!mounted.current || !foreground.current || requestEpoch !== epoch.current) return;
        const recoveryStartedAt = Date.now();
        const next = await client.snapshot(roomCode, sessionId);
        receive(next, requestEpoch, recoveryStartedAt);
      } catch {
        if (mounted.current && foreground.current && requestEpoch === epoch.current) router.replace({ pathname: '/reconnecting', params: { roomCode, sessionId } });
      }
    } finally {
      if (mounted.current && requestEpoch === epoch.current) { busyRef.current = false; setBusy(false); }
    }
  }, [client, receive, roomCode, router, sessionId, synced]);

  if (!snapshot) return <FolkSurface background="woven">{null}</FolkSurface>;
  const player = snapshot.own;
  const opponent = snapshot.players.find((item) => item.seat !== player.seat);
  const lastRound = snapshot.lastRound;
  const activeResult = snapshot.phase === 'ROUND_RESULT' && lastRound?.round === snapshot.round;
  const ownPlayed = player.seat === 'PLAYER_A' ? lastRound?.playerA : lastRound?.playerB;
  const opponentPlayed = player.seat === 'PLAYER_A' ? lastRound?.playerB : lastRound?.playerA;
  const status = text(presentation.stage === 'prepare' ? 'roundPreparing' : presentation.stage === 'flip' ? 'roundFlipping' : (presentation.stage === 'outcome' || presentation.stage === 'complete') && presentation.outcome ? presentation.outcome === 'WIN' ? 'roundWin' : presentation.outcome === 'LOSS' ? 'roundLoss' : 'roundDraw' : presentation.stage === 'discard' ? 'roundDiscarding' : player.lockedCardId ? 'roundLocked' : opponent?.locked ? 'opponentLocked' : 'dragToLock');

  return <FolkBoardView opponentName={text('onlineOpponent')} playerName={text('you')} scoreLabel={text('available')} opponentScore={(opponent?.score ?? 0) - (activeResult && !presentation.scoreVisible && presentation.outcome === 'LOSS' ? 1 : 0)} playerScore={player.score - (activeResult && !presentation.scoreVisible && presentation.outcome === 'WIN' ? 1 : 0)} opponentCardCount={opponent?.cardCount ?? 0} opponentLocked={opponent?.locked ?? false} presentation={presentation} statusLabel={status} summaryLabel={presentation.stage === 'selection' && presentation.outcome ? `${text('round')} ${lastRound?.round}: ${text(presentation.outcome === 'WIN' ? 'roundWin' : presentation.outcome === 'LOSS' ? 'roundLoss' : 'roundDraw')}` : undefined} opponentDiscards={opponent?.discards.filter((card) => !(activeResult && !presentation.discardsVisible) || card.cardId !== opponentPlayed?.cardId).map((card) => card.kind as CardKind) ?? []} playerDiscards={player.discards.filter((card) => !(activeResult && !presentation.discardsVisible) || card.cardId !== ownPlayed?.cardId).map((card) => card.kind as CardKind)} cards={player.hand.filter((card) => !card.used).map((card) => ({ id: card.id, kind: card.kind as CardKind }))} selectedCardId={selectedCardId} lockedCardId={player.lockedCardId} canLock={synced && snapshot.phase === 'ROUND_SELECTION'} busy={busy} reducedMotion={reducedMotion} lastRound={presentation.cards} remaining={remaining} cardBackLabel={text('cardBack')} discardLabel={text('discards')} lockLabel={text('lockCard')} waitingLabel={text('waiting')} selectedLabel={text('selected')} cardLabel={(kind) => label(kind, locale)} selectedLift={selectedLift(reducedMotion)} onSelect={setSelectedCardId} onLock={lock} />;
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const reducedMotion = useReducedMotion();
  const remaining = useCountdownSeconds(snapshot?.deadlineAt);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);
  useEffect(() => {
    if (!roomCode || !sessionId) { router.replace('/rooms'); return; }
    let active = true;
    let polling = false;
    const poll = async () => { if (polling) return; polling = true; try { const next = await client.snapshot(roomCode, sessionId); if (active) setSnapshot(next); } catch { if (active) router.replace({ pathname: '/reconnecting', params: { roomCode, sessionId } }); } finally { polling = false; } };
    void poll();
    const handle = setInterval(() => { void poll(); }, 500);
    return () => { active = false; clearInterval(handle); };
  }, [client, roomCode, router, sessionId]);
  useEffect(() => { if (snapshot?.phase === 'MATCH_RESULT') router.replace({ pathname: '/result', params: { roomCode, sessionId } }); }, [roomCode, router, sessionId, snapshot?.phase]);
  useEffect(() => {
    if (selectedCardId && snapshot && !snapshot.own.hand.some((card) => card.id === selectedCardId && !card.used)) setSelectedCardId(null);
  }, [selectedCardId, snapshot]);
  const lock = useCallback(async (cardId: string) => {
    const current = snapshotRef.current;
    if (!current || busyRef.current || current.phase !== 'ROUND_SELECTION' || !roomCode || !sessionId || !current.own.hand.some((card) => card.id === cardId && !card.used)) return;
    busyRef.current = true;
    setBusy(true);
    const operationId = `lock-${current.round}-${cardId}-attempt-${++lockAttemptRef.current}`;
    try {
      const next = await client.action(roomCode, sessionId, { type: 'LOCK_CARD', operationId, expectedPhase: 'ROUND_SELECTION', expectedRound: current.round, payload: { cardId } });
      snapshotRef.current = next;
      setSnapshot(next);
      setSelectedCardId(null);
    } catch {
      try {
        const next = await client.snapshot(roomCode, sessionId);
        snapshotRef.current = next;
        setSnapshot(next);
      } catch {
        router.replace({ pathname: '/reconnecting', params: { roomCode, sessionId } });
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [client, roomCode, router, sessionId]);

  if (!snapshot) return <FolkSurface background="woven">{null}</FolkSurface>;
  const player = snapshot.own;
  const opponent = snapshot.players.find((item) => item.seat !== player.seat);
  const lastRound = snapshot.lastRound ? (player.seat === 'PLAYER_A' ? { player: snapshot.lastRound.playerA.kind as CardKind, opponent: snapshot.lastRound.playerB.kind as CardKind } : { player: snapshot.lastRound.playerB.kind as CardKind, opponent: snapshot.lastRound.playerA.kind as CardKind }) : null;

  return <FolkBoardView opponentName={text('onlineOpponent')} playerName={text('you')} scoreLabel={text('available')} opponentScore={opponent?.score ?? 0} playerScore={player.score} opponentCardCount={opponent?.cardCount ?? 0} opponentDiscards={opponent?.discards.map((card) => card.kind as CardKind) ?? []} playerDiscards={player.discards.map((card) => card.kind as CardKind)} cards={player.hand.filter((card) => !card.used).map((card) => ({ id: card.id, kind: card.kind as CardKind }))} selectedCardId={selectedCardId} lockedCardId={player.lockedCardId} canLock={snapshot.phase === 'ROUND_SELECTION'} busy={busy} reducedMotion={reducedMotion} lastRound={lastRound} remaining={remaining} cardBackLabel={text('cardBack')} discardLabel={text('discards')} lockLabel={text('lockCard')} waitingLabel={text('waiting')} selectedLabel={text('selected')} cardLabel={(kind) => label(kind, locale)} selectedLift={selectedLift(reducedMotion)} onSelect={setSelectedCardId} onLock={lock} />;
}

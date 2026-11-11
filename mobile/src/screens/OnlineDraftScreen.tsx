import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { CardKind, RoomProjection } from '@rps-cards/game-core';
import { FolkDraftView } from '../components/FolkGameViews';
import { FolkLoadingView } from '../components/FolkLoadingView';
import { acceptBoardSnapshot } from '../game/board-round-presentation';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { useCountdownSeconds } from '../ui/countdown';

export const ONLINE_DRAFT_REVEAL_MS = 1_000;
const cardKey = { ROCK: 'cardRock', PAPER: 'cardPaper', SCISSORS: 'cardScissors' } as const satisfies Record<CardKind, string>;

export function OnlineDraftScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const roomCode = params.roomCode;
  const sessionId = params.sessionId;
  const locale = useAppStore((state) => state.locale);
  const [snapshot, setSnapshot] = useState<RoomProjection | null>(null);
  const [busy, setBusy] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const snapshotRef = useRef<RoomProjection | null>(null);
  const pickedPosition = useRef<number | null>(null);
  const active = useRef(false);
  const client = useMemo(() => createOnlineRoomClient(), []);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const remaining = useCountdownSeconds(snapshot?.deadlineAt === undefined ? undefined : snapshot.deadlineAt - clockOffset);

  // Late poll responses must not overwrite a newer action response.
  const receive = (next: RoomProjection, startedAt: number) => {
    if (!active.current || !acceptBoardSnapshot(snapshotRef.current, next)) return;
    if (next.serverNow !== undefined) setClockOffset(next.serverNow - (startedAt + Date.now()) / 2);
    const draft = next.own.draft;
    if (draft && 'selectedPosition' in draft && draft.selectedPosition !== undefined) pickedPosition.current = draft.selectedPosition;
    snapshotRef.current = next;
    setSnapshot(next);
  };
  const receiveRef = useRef(receive);
  receiveRef.current = receive;

  useEffect(() => {
    if (!roomCode || !sessionId) { router.replace('/rooms'); return; }
    active.current = true;
    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      const startedAt = Date.now();
      try { receiveRef.current(await client.snapshot(roomCode, sessionId), startedAt); }
      catch { if (active.current) router.replace({ pathname: '/reconnecting', params: { roomCode, sessionId } }); }
      finally { polling = false; }
    };
    void poll();
    const handle = setInterval(() => { void poll(); }, 500);
    return () => { active.current = false; clearInterval(handle); };
  }, [client, roomCode, router, sessionId]);

  const phase = snapshot?.phase;
  useEffect(() => {
    if (!phase || phase === 'DRAFT_PLAYER_A' || phase === 'DRAFT_PLAYER_B' || phase === 'WAITING') return;
    // A forfeit during the draft ends the match; never leave the player on a dead draft.
    if (phase === 'MATCH_RESULT') { router.replace({ pathname: '/result', params: { roomCode, sessionId } }); return; }
    const toBoard = () => router.replace({ pathname: '/board', params: { roomCode, sessionId } });
    if (phase !== 'ROUND_SELECTION') { toBoard(); return; }
    const handle = setTimeout(toBoard, ONLINE_DRAFT_REVEAL_MS);
    return () => clearTimeout(handle);
  }, [phase, roomCode, router, sessionId]);

  if (!snapshot) return <FolkLoadingView label={text('loading')} />;
  const draft = snapshot.own.draft && 'availablePositions' in snapshot.own.draft ? snapshot.own.draft : null;
  const myTurn = draft?.activeSeat === snapshot.own.seat;
  const hasPicked = draft?.selectedPosition !== undefined;
  const extra = snapshot.phase === 'ROUND_SELECTION' ? snapshot.own.hand.find((card) => card.id.endsWith('-extra'))?.kind as CardKind | undefined : undefined;
  const pick = async (position: number) => {
    if (!myTurn || busy || !roomCode || !sessionId) return;
    setBusy(true);
    pickedPosition.current = position;
    const startedAt = Date.now();
    try {
      receive(await client.action(roomCode, sessionId, { type: 'DRAFT_PICK', operationId: `draft-${Date.now()}-${position}`, expectedPhase: snapshot.phase as 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B', expectedRound: 0, payload: { position } }), startedAt);
    } catch {
      try { const recoveryStartedAt = Date.now(); receive(await client.snapshot(roomCode, sessionId), recoveryStartedAt); }
      catch { if (active.current) router.replace({ pathname: '/reconnecting', params: { roomCode, sessionId } }); }
    } finally { if (active.current) setBusy(false); }
  };
  return <FolkDraftView
    title={text('draftTitle')}
    status={myTurn ? text('draftYourTurn') : hasPicked ? text('draftPicked') : text('draftOpponentTurn')}
    instruction={text('draftInstruction')}
    timer={remaining}
    cardBackLabel={text('cardBack')}
    unavailableLabel={text('unavailable')}
    positions={draft?.availablePositions.map((item) => item.position) ?? []}
    selectedPosition={extra ? pickedPosition.current : draft?.selectedPosition ?? null}
    disabled={!myTurn || busy}
    reveal={extra ? { kind: extra, label: text(cardKey[extra]), caption: text('draftReveal') } : null}
    onPick={(position) => void pick(position)}
  />;
}

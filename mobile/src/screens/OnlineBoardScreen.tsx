import { useEffect, useMemo, useState } from 'react';
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
  const locale = useAppStore((state) => state.locale);
  const client = useMemo(() => createOnlineRoomClient(), []);
  const [snapshot, setSnapshot] = useState<RoomProjection | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const reducedMotion = useReducedMotion();
  const remaining = useCountdownSeconds(snapshot?.deadlineAt);

  useEffect(() => {
    if (!params.roomCode || !params.sessionId) { router.replace('/rooms'); return; }
    let active = true;
    let polling = false;
    const poll = async () => { if (polling) return; polling = true; try { const next = await client.snapshot(params.roomCode!, params.sessionId!); if (active) setSnapshot(next); } catch { if (active) router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } finally { polling = false; } };
    void poll();
    const handle = setInterval(() => { void poll(); }, 500);
    return () => { active = false; clearInterval(handle); };
  }, [client, params.roomCode, params.sessionId, router]);
  useEffect(() => { if (snapshot?.phase === 'MATCH_RESULT') router.replace({ pathname: '/result', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); }, [params.roomCode, params.sessionId, router, snapshot?.phase]);
  useEffect(() => {
    if (selectedCardId && snapshot && !snapshot.own.hand.some((card) => card.id === selectedCardId && !card.used)) setSelectedCardId(null);
  }, [selectedCardId, snapshot]);

  if (!snapshot) return <FolkSurface background="woven">{null}</FolkSurface>;
  const player = snapshot.own;
  const opponent = snapshot.players.find((item) => item.seat !== player.seat);
  const lock = async () => {
    if (!selectedCardId || busy || player.locked || snapshot.phase !== 'ROUND_SELECTION' || !params.roomCode || !params.sessionId) return;
    setBusy(true);
    try { setSnapshot(await client.action(params.roomCode, params.sessionId, { type: 'LOCK_CARD', operationId: `lock-${snapshot.round}-${selectedCardId}`, expectedPhase: 'ROUND_SELECTION', expectedRound: snapshot.round, payload: { cardId: selectedCardId } })); } catch { try { setSnapshot(await client.snapshot(params.roomCode, params.sessionId)); } catch { router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } } finally { setBusy(false); }
  };
  const lastRound = snapshot.lastRound ? (player.seat === 'PLAYER_A' ? { player: snapshot.lastRound.playerA.kind as CardKind, opponent: snapshot.lastRound.playerB.kind as CardKind } : { player: snapshot.lastRound.playerB.kind as CardKind, opponent: snapshot.lastRound.playerA.kind as CardKind }) : null;

  return <FolkBoardView opponentName={text('onlineOpponent')} playerName={text('you')} scoreLabel={text('available')} opponentScore={opponent?.score ?? 0} playerScore={player.score} opponentCardCount={opponent?.cardCount ?? 0} opponentDiscards={opponent?.discards.map((card) => card.kind as CardKind) ?? []} playerDiscards={player.discards.map((card) => card.kind as CardKind)} cards={player.hand.filter((card) => !card.used).map((card) => ({ id: card.id, kind: card.kind as CardKind }))} selectedCardId={selectedCardId} locked={player.locked} busy={busy} lastRound={lastRound} remaining={remaining} cardBackLabel={text('cardBack')} lockLabel={text('lockCard')} waitingLabel={text('waiting')} selectedLabel={text('selected')} cardLabel={(kind) => label(kind, locale)} selectedLift={selectedLift(reducedMotion)} onSelect={setSelectedCardId} onLock={() => void lock()} />;
}

import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { RoomProjection } from '@rps-cards/game-core';
import { useCountdownSeconds } from '../ui/countdown';
import { FolkDraftView } from '../components/FolkGameViews';
import { FolkSurface } from '../components/FolkSurface';

export function OnlineDraftScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const locale = useAppStore((state) => state.locale);
  const [snapshot, setSnapshot] = useState<RoomProjection | null>(null);
  const [busy, setBusy] = useState(false);
  const client = useMemo(() => createOnlineRoomClient(), []);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
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
  useEffect(() => {
    if (snapshot?.phase === 'ROUND_SELECTION') router.replace({ pathname: '/board', params: { roomCode: params.roomCode, sessionId: params.sessionId } });
  }, [params.roomCode, params.sessionId, router, snapshot?.phase]);
  if (!snapshot) return <FolkSurface background="woven">{null}</FolkSurface>;
  const draft = snapshot.own.draft && 'availablePositions' in snapshot.own.draft ? snapshot.own.draft : null;
  const active = draft?.activeSeat === snapshot.own.seat;
  const opponentHasPicked = Boolean(snapshot.own.draft && 'opponentHasPicked' in snapshot.own.draft && snapshot.own.draft.opponentHasPicked);
  const pick = async (position: number) => {
    if (!active || busy || !params.roomCode || !params.sessionId) return;
    setBusy(true);
    try { setSnapshot(await client.action(params.roomCode, params.sessionId, { type: 'DRAFT_PICK', operationId: `draft-${Date.now()}-${position}`, expectedPhase: snapshot.phase as 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B', expectedRound: 0, payload: { position } })); } catch { try { setSnapshot(await client.snapshot(params.roomCode, params.sessionId)); } catch { router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); } } finally { setBusy(false); }
  };
  return <FolkDraftView title={text('draftTitle')} status={active ? text('available') : opponentHasPicked ? text('opponentHasPicked') : text('draftWaiting')} instruction={text('draftInstruction')} timer={remaining} cardBackLabel={text('cardBack')} unavailableLabel={text('unavailable')} positions={draft?.availablePositions.map((item) => item.position) ?? []} selectedPosition={draft?.selectedPosition ?? null} disabled={!active || busy} onPick={(position) => void pick(position)} />;
}

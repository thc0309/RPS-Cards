import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { deleteReconnectCredential, readReconnectCredential } from '../security/reconnect-credential';
import { useAppStore } from '../store/app-store';
import { FolkReconnectingView } from '../components/FolkGameViews';
import { useCountdownSeconds } from '../ui/countdown';

const RECONNECT_RESERVATION_MS = 25_000;
const RETRY_DELAYS_MS = [250, 500, 1_000, 2_000] as const;

export function ReconnectingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const locale = useAppStore((state) => state.locale);
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const [deadline] = useState(() => Date.now() + RECONNECT_RESERVATION_MS);
  const remaining = useCountdownSeconds(deadline);
  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let releaseWait: (() => void) | null = null;
    const waitForRetry = (delayMs: number) => new Promise<boolean>((resolve) => {
      releaseWait = () => {
        releaseWait = null;
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = null;
        resolve(false);
      };
      retryTimer = setTimeout(() => {
        retryTimer = null;
        releaseWait = null;
        resolve(active);
      }, delayMs);
    });
    const run = async () => {
      const credential = await readReconnectCredential();
      if (!active) return;
      if (!credential || (params.roomCode && credential.roomCode !== params.roomCode) || (params.sessionId && credential.sessionId !== params.sessionId)) {
        if (active) router.replace('/rooms');
        return;
      }
      const client = createOnlineRoomClient();
      let attempt = 0;
      while (active && Date.now() < deadline) {
        try {
          await client.reconnect(credential.roomCode, credential.sessionId, credential.reconnectToken);
          if (!active) return;
          const snapshot = await client.snapshot(credential.roomCode, credential.sessionId);
          if (!active) return;
          const route = snapshot.phase === 'MATCH_RESULT' ? '/result' : snapshot.phase === 'ROUND_SELECTION' || snapshot.phase === 'ROUND_REVEAL' || snapshot.phase === 'ROUND_RESULT' ? '/board' : snapshot.phase === 'WAITING' ? '/lobby' : '/draft';
          router.replace({ pathname: route, params: { roomCode: credential.roomCode, sessionId: credential.sessionId } });
          return;
        } catch (error) {
          if (String(error).includes('ROOM_EXPIRED')) {
            await deleteReconnectCredential();
            setActiveRoom(null);
            if (active) router.replace({ pathname: '/rooms', params: { error: 'ROOM_EXPIRED' } });
            return;
          }
        }
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0 || !await waitForRetry(Math.min(RETRY_DELAYS_MS[Math.min(attempt++, RETRY_DELAYS_MS.length - 1)], remainingMs))) return;
      }
      if (active) router.replace('/rooms');
    };
    void run();
    return () => {
      active = false;
      releaseWait?.();
    };
  }, [deadline, params.roomCode, params.sessionId, router, setActiveRoom]);
  return <FolkReconnectingView title={text('reconnecting')} body={text('reconnectingBody')} remaining={remaining} />;
}

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { deleteReconnectCredential, readReconnectCredential } from '../security/reconnect-credential';
import { useAppStore } from '../store/app-store';
import { FolkReconnectingView } from '../components/FolkGameViews';
import { useCountdownSeconds } from '../ui/countdown';
import { useFeedback } from '../ui/feedback';
import { useReducedMotion } from '../ui/motion';

const RECONNECT_RESERVATION_MS = 25_000;
const RETRY_DELAYS_MS = [250, 500, 1_000, 2_000] as const;

export function ReconnectingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const locale = useAppStore((state) => state.locale);
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);
  const feedback = useFeedback();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const statusStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const [deadline] = useState(() => Date.now() + RECONNECT_RESERVATION_MS);
  const remaining = useCountdownSeconds(deadline);
  useEffect(() => {
    const animate = (foreground: boolean) => {
      cancelAnimation(opacity); opacity.value = 1;
      const repeats = Math.floor((deadline - Date.now()) / 1400);
      if (foreground && !reducedMotion && repeats > 0) {
        // Finite pulse inside the existing reservation; no gameplay clock/timer.
        opacity.value = withRepeat(withSequence(withTiming(0.9, { duration: 700 }), withTiming(1, { duration: 700 })), repeats, false);
      }
    };
    animate(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => animate(state === 'active'));
    return () => { subscription.remove(); cancelAnimation(opacity); };
  }, [deadline, opacity, reducedMotion]);
  useEffect(() => {
    let active = true;
    let cueEligible = AppState.currentState === 'active';
    const entryExpiresAt = Date.now() + 300;
    const subscription = AppState.addEventListener('change', () => {
      cueEligible = false;
      feedback.cancelScope('reconnecting');
    });
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
      if (cueEligible && AppState.currentState === 'active') feedback.play('connection-lost', { scope: 'reconnecting', expiresAt: entryExpiresAt });
      const client = createOnlineRoomClient();
      let attempt = 0;
      while (active && Date.now() < deadline) {
        try {
          await client.reconnect(credential.roomCode, credential.sessionId, credential.reconnectToken);
          if (!active) return;
          const snapshot = await client.snapshot(credential.roomCode, credential.sessionId);
          if (!active) return;
          // Route transition confirmation remains bounded and survives source cleanup.
          if (cueEligible && AppState.currentState === 'active' && Date.now() < deadline) feedback.play('confirm', { expiresAt: Date.now() + 300 });
          const route = snapshot.phase === 'MATCH_RESULT' ? '/result' : snapshot.phase === 'ROUND_SELECTION' || snapshot.phase === 'ROUND_REVEAL' || snapshot.phase === 'ROUND_RESULT' ? '/board' : snapshot.phase === 'WAITING' ? '/lobby' : '/draft';
          router.replace({ pathname: route, params: { roomCode: credential.roomCode, sessionId: credential.sessionId } });
          return;
        } catch (error) {
          if (!active) return;
          if (String(error).includes('ROOM_EXPIRED')) {
            await deleteReconnectCredential();
            if (!active) return;
            setActiveRoom(null);
            router.replace({ pathname: '/rooms', params: { error: 'ROOM_EXPIRED' } });
            return;
          }
        }
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) break;
        if (!await waitForRetry(Math.min(RETRY_DELAYS_MS[Math.min(attempt++, RETRY_DELAYS_MS.length - 1)], remainingMs))) return;
      }
      if (active) router.replace('/rooms');
    };
    void run().catch(() => { if (active) router.replace('/rooms'); });
    return () => {
      active = false;
      releaseWait?.();
      subscription.remove();
      feedback.cancelScope('reconnecting');
    };
  }, [deadline, feedback, params.roomCode, params.sessionId, router, setActiveRoom]);
  return <FolkReconnectingView title={text('reconnecting')} body={text('reconnectingBody')} remaining={remaining} statusStyle={statusStyle} />;
}

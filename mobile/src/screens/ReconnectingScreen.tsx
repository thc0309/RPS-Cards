import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { deleteReconnectCredential, readReconnectCredential } from '../security/reconnect-credential';
import { useAppStore } from '../store/app-store';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ReconnectingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const locale = useAppStore((state) => state.locale);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  useEffect(() => {
    let active = true;
    const run = async () => {
      const credential = await readReconnectCredential();
      if (!credential || (params.roomCode && credential.roomCode !== params.roomCode) || (params.sessionId && credential.sessionId !== params.sessionId)) {
        if (active) router.replace('/rooms');
        return;
      }
      const client = createOnlineRoomClient();
      for (const delay of [0, 250, 500, 1_000]) {
        if (delay) await wait(delay);
        try {
          await client.reconnect(credential.roomCode, credential.sessionId, credential.reconnectToken);
          const snapshot = await client.snapshot(credential.roomCode, credential.sessionId);
          if (!active) return;
          const route = snapshot.phase === 'MATCH_RESULT' ? '/result' : snapshot.phase === 'ROUND_SELECTION' || snapshot.phase === 'ROUND_REVEAL' || snapshot.phase === 'ROUND_RESULT' ? '/board' : snapshot.phase === 'WAITING' ? '/lobby' : '/draft';
          router.replace({ pathname: route, params: { roomCode: credential.roomCode, sessionId: credential.sessionId } });
          return;
        } catch (error) {
          if (String(error).includes('ROOM_EXPIRED')) {
            await deleteReconnectCredential();
            if (active) router.replace({ pathname: '/rooms', params: { error: 'ROOM_EXPIRED' } });
            return;
          }
        }
      }
      if (active) router.replace('/rooms');
    };
    void run();
    return () => { active = false; };
  }, [params.roomCode, params.sessionId, router]);
  return <View style={styles.container}><Text accessibilityRole="header" style={styles.title}>{text('reconnecting')}</Text><Text style={styles.body}>{text('reconnectingBody')}</Text></View>;
}

const styles = StyleSheet.create({ container: { alignItems: 'center', backgroundColor: '#F5E7C5', flex: 1, justifyContent: 'center', padding: 24 }, title: { color: '#43291F', fontSize: 28, fontWeight: '900', textAlign: 'center' }, body: { color: '#755846', marginTop: 14, textAlign: 'center' } });

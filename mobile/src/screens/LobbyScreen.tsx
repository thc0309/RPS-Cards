import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { RoomProjection } from '@rps-cards/game-core';
import { deleteReconnectCredential } from '../security/reconnect-credential';

export function LobbyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  const locale = useAppStore((state) => state.locale);
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);
  const [snapshot, setSnapshot] = useState<RoomProjection | null>(null);
  const client = useMemo(() => createOnlineRoomClient(), []);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  useEffect(() => {
    if (!params.roomCode || !params.sessionId) { router.replace('/rooms'); return; }
    let active = true;
    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try { const next = await client.snapshot(params.roomCode!, params.sessionId!); if (active) setSnapshot(next); } catch { if (active) router.replace({ pathname: '/reconnecting', params: { roomCode: params.roomCode, sessionId: params.sessionId } }); }
      finally { polling = false; }
    };
    void poll();
    const handle = setInterval(() => { void poll(); }, 1_000);
    return () => { active = false; clearInterval(handle); };
  }, [client, params.roomCode, params.sessionId, router]);
  useEffect(() => {
    if (snapshot && snapshot.phase !== 'WAITING') router.replace({ pathname: '/draft', params: { roomCode: params.roomCode, sessionId: params.sessionId } });
  }, [params.roomCode, params.sessionId, router, snapshot]);
  if (!params.roomCode || !params.sessionId) return null;
  const leave = async () => {
    try { await client.leave(params.roomCode!, params.sessionId!); } catch { /* heartbeat expiry closes an unreachable room */ }
    await deleteReconnectCredential();
    setActiveRoom(null);
    router.replace('/rooms');
  };
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>{text('lobbyTitle')}</Text>
      <Text style={styles.label}>{text('roomCode')}</Text>
      <Text selectable style={styles.code}>{params.roomCode}</Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>{text('playersReady')}: {snapshot?.players.length ?? 1} / 2</Text>
      <Text style={styles.waiting}>{text('waitingOpponent')}</Text>
      <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => void leave()}><Text style={styles.secondaryText}>{text('leaveRoom')}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: '#F5E7C5', flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#43291F', fontSize: 30, fontWeight: '900' },
  label: { color: '#755846', fontSize: 14, marginTop: 28 },
  code: { color: '#A63D2F', fontSize: 36, fontWeight: '900', letterSpacing: 8, marginTop: 8 },
  status: { color: '#43291F', fontSize: 17, fontWeight: '700', marginTop: 28 },
  waiting: { color: '#755846', marginTop: 10 },
  secondary: { alignItems: 'center', borderColor: '#A63D2F', borderRadius: 14, borderWidth: 2, justifyContent: 'center', marginTop: 36, minHeight: 52, width: '100%' },
  secondaryText: { color: '#A63D2F', fontWeight: '800' },
});

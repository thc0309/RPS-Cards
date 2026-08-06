import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { RoomProjection } from '@rps-cards/game-core';
import { deleteReconnectCredential } from '../security/reconnect-credential';
import { FolkButton } from '../components/FolkButton';
import { FolkPanel } from '../components/FolkPanel';
import { FolkSurface } from '../components/FolkSurface';
import { folkAssets } from '../ui/folk-assets';

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
    <FolkSurface background="village" contentStyle={styles.surface}>
      <View style={styles.container}>
        <Image source={folkAssets.controls.redPlaque} resizeMode="stretch" style={styles.plaque} accessibilityLabel={text('lobbyTitle')} />
        <Text accessibilityRole="header" style={styles.title}>{text('lobbyTitle')}</Text>
        <FolkPanel style={styles.panel}>
          <Text style={styles.label}>{text('roomCode')}</Text>
          <Text selectable style={styles.code}>{params.roomCode}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={text('copyCode')} style={styles.copy} onPress={() => void Clipboard.setStringAsync(params.roomCode ?? '')}><Image source={folkAssets.icons.copy} style={styles.copyIcon} /><Text style={styles.copyText}>{text('copyCode')}</Text></Pressable>
          <Text accessibilityLiveRegion="polite" style={styles.status}>{text('playersReady')}: {snapshot?.players.length ?? 1} / 2</Text>
          <Text style={styles.waiting}>{text('waitingOpponent')}</Text>
          <FolkButton variant="blue" accessibilityLabel={text('leaveRoom')} onPress={() => void leave()}>{text('leaveRoom')}</FolkButton>
        </FolkPanel>
      </View>
    </FolkSurface>
  );
}

const styles = StyleSheet.create({
  surface: { padding: 20 },
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', maxWidth: 520, width: '100%' },
  plaque: { height: 112, marginBottom: -70, maxWidth: 480, width: '100%' },
  title: { color: '#FFF3CC', fontSize: 28, fontWeight: '900', marginTop: -46, textShadowColor: '#3A1D13', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 2 },
  panel: { marginTop: 28, width: '100%' },
  label: { color: '#5A3521', fontSize: 14, marginTop: 6, textAlign: 'center' },
  code: { color: '#A63D2F', fontSize: 36, fontWeight: '900', letterSpacing: 8, marginTop: 8, textAlign: 'center' },
  copy: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 8, marginTop: 12, minHeight: 44, padding: 6 },
  copyIcon: { height: 24, width: 24 },
  copyText: { color: '#24486B', fontWeight: '800' },
  status: { color: '#43291F', fontSize: 17, fontWeight: '700', marginTop: 28, textAlign: 'center' },
  waiting: { color: '#755846', marginBottom: 16, marginTop: 10, textAlign: 'center' },
});

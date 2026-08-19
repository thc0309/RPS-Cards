import { useEffect, useMemo, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import type { RoomProjection } from '@rps-cards/game-core';
import { deleteReconnectCredential } from '../security/reconnect-credential';
import { FolkButton } from '../components/FolkButton';
import { FolkSurface } from '../components/FolkSurface';
import { folkAssets } from '../ui/folk-assets';
import { FolkBackButton, FolkTitle } from '../components/FolkChrome';

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
      <View pointerEvents="none" style={styles.tint} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><FolkBackButton label={text('leaveRoom')} onPress={() => void leave()} style={styles.back} /><FolkTitle>{text('lobbyTitle')}</FolkTitle></View>
        <ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" style={styles.invitation}>
          <Text style={styles.label}>{text('roomCode')}</Text>
          <Text selectable adjustsFontSizeToFit numberOfLines={1} style={styles.code}>{params.roomCode}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={text('copyCode')} style={styles.copy} onPress={() => void Clipboard.setStringAsync(params.roomCode ?? '')}><Image source={folkAssets.icons.copy} style={styles.copyIcon} /><Text style={styles.copyText}>{text('copyCode')}</Text></Pressable>
        </ImageBackground>
        <View style={styles.players}>
          <ImageBackground source={folkAssets.controls.paperPanel} resizeMode="stretch" style={styles.playerPanel}>
            <Text style={styles.playerTitle}>{text('you')}</Text>
            <View style={styles.avatar}><Image source={folkAssets.decorations.lion} resizeMode="contain" style={styles.avatarArt} /></View>
            <Text style={styles.ready}>✓ {text('ready')}</Text>
          </ImageBackground>
          <View pointerEvents="none" style={styles.vs}><Text style={styles.vsText}>VS</Text></View>
          <ImageBackground source={folkAssets.controls.paperPanel} resizeMode="stretch" style={styles.playerPanel}>
            <Text style={styles.playerTitle}>{text('onlineOpponent')}</Text>
            <View style={[styles.avatar, styles.opponentAvatar]}><Text style={styles.silhouette}>{(snapshot?.players.length ?? 1) > 1 ? '●' : '?'}</Text></View>
            <Text accessibilityLiveRegion="polite" style={styles.waiting}>{(snapshot?.players.length ?? 1) > 1 ? `✓ ${text('ready')}` : text('waitingOpponent')}</Text>
          </ImageBackground>
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.status}>{text('playersReady')}: {snapshot?.players.length ?? 1} / 2</Text>
        <FolkButton accessibilityLabel={text('leaveRoom')} style={styles.leave} onPress={() => void leave()}>{text('leaveRoom')}</FolkButton>
      </ScrollView>
    </FolkSurface>
  );
}

const styles = StyleSheet.create({
  surface: { backgroundColor: 'rgba(42,23,12,0.26)' },
  tint: { backgroundColor: 'rgba(42,23,12,0.18)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  container: { alignItems: 'center', flexGrow: 1, paddingHorizontal: 14, paddingVertical: 10 },
  header: { alignItems: 'center', justifyContent: 'center', maxWidth: '100%', width: 332 },
  back: { left: 0, position: 'absolute', zIndex: 2 },
  invitation: { alignItems: 'center', height: 190, justifyContent: 'center', marginTop: -2, maxWidth: '100%', paddingHorizontal: 48, width: 320 },
  label: { color: '#8A241A', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  code: { color: '#A63D2F', fontSize: 34, fontWeight: '900', letterSpacing: 7, marginTop: 2, textAlign: 'center', width: '100%' },
  copy: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 44, paddingHorizontal: 12 },
  copyIcon: { height: 24, width: 24 },
  copyText: { color: '#8A241A', fontWeight: '800' },
  players: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: -4, maxWidth: '100%', width: 332 },
  playerPanel: { alignItems: 'center', flex: 1, height: 250, justifyContent: 'center', maxWidth: 220, paddingHorizontal: 20, paddingVertical: 28 },
  playerTitle: { color: '#8A241A', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  avatar: { alignItems: 'center', backgroundColor: '#E8C77B', borderColor: '#8C5A2C', borderRadius: 52, borderWidth: 3, height: 104, justifyContent: 'center', marginVertical: 6, overflow: 'hidden', width: 104 },
  opponentAvatar: { backgroundColor: '#D8C49B' },
  avatarArt: { height: 94, width: 94 },
  silhouette: { color: '#8D7755', fontSize: 42, fontWeight: '900' },
  ready: { color: '#3F6B35', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  waiting: { color: '#24486B', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  vs: { alignItems: 'center', backgroundColor: '#F1DDA8', borderColor: '#9C6737', borderRadius: 25, borderWidth: 2, height: 50, justifyContent: 'center', marginHorizontal: -12, width: 50, zIndex: 2 },
  vsText: { color: '#8A241A', fontSize: 18, fontStyle: 'italic', fontWeight: '900' },
  status: { color: '#FFF0C6', fontSize: 14, fontWeight: '800', marginTop: -8, textAlign: 'center', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 2 },
  leave: { marginTop: 4, maxWidth: '100%', width: 332 },
});

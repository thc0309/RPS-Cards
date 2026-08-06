import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { createInterstitialGate } from '../ads/interstitial-gate';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { createRoomEntryFlow, type RoomEntryError } from '../game/room-entry';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { readReconnectCredential, saveReconnectCredential, type ReconnectCredential } from '../security/reconnect-credential';
import { FolkButton } from '../components/FolkButton';
import { FolkPanel } from '../components/FolkPanel';
import { FolkSurface } from '../components/FolkSurface';
import { folkAssets } from '../ui/folk-assets';
import { Image } from 'react-native';

export function RoomsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ error?: RoomEntryError }>();
  const locale = useAppStore((state) => state.locale);
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);
  const [code, setCode] = useState('');
  const [error, setError] = useState<RoomEntryError | null>(params.error ?? null);
  const [busy, setBusy] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<ReconnectCredential | null>(null);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const flow = useMemo(() => createRoomEntryFlow(createOnlineRoomClient(), createInterstitialGate(), {
    saveCredential: (credential) => saveReconnectCredential(credential),
    openLobby: (roomCode, sessionId) => { setActiveRoom(roomCode); router.replace({ pathname: '/lobby', params: { roomCode, sessionId } }); },
  }), [router, setActiveRoom]);
  useEffect(() => {
    let active = true;
    void readReconnectCredential().then((credential) => { if (active) setCurrentRoom(credential); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const run = async (action: Promise<{ readonly ok: boolean; readonly code?: RoomEntryError }>) => {
    setBusy(true);
    const result = await action;
    setBusy(false);
    if (!result.ok) setError(result.code ?? 'ENTRY_FAILED');
  };
  const errorText = error === 'INVALID_CODE' ? text('invalidRoomCode') : error === 'ROOM_FULL' ? text('roomFull') : error === 'ROOM_EXPIRED' || error === 'ROOM_NOT_FOUND' ? text('roomExpired') : error ? text('entryFailed') : null;
  return (
    <FolkSurface background="paper" contentStyle={styles.surface}>
      <View style={styles.container}>
        <Pressable accessibilityRole="button" accessibilityLabel={text('home')} style={styles.back} onPress={() => router.replace('/')}><Text style={styles.backText}>‹</Text></Pressable>
        <Image source={folkAssets.controls.bluePlaque} resizeMode="stretch" style={styles.plaque} accessibilityLabel={text('roomsTitle')} />
        <Text accessibilityRole="header" style={styles.title}>{text('roomsTitle')}</Text>
        <FolkPanel style={styles.panel}>
          {currentRoom ? <Pressable accessibilityRole="button" accessibilityLabel={`${text('currentRoom')}: ${currentRoom.roomCode}`} style={styles.currentRoom} onPress={() => router.replace({ pathname: '/reconnecting', params: { roomCode: currentRoom.roomCode, sessionId: currentRoom.sessionId } })}><Text style={styles.currentRoomLabel}>{text('currentRoom')}</Text><Text style={styles.currentRoomCode}>{currentRoom.roomCode}</Text></Pressable> : <Text style={styles.empty}>{text('noCurrentRoom')}</Text>}
          <FolkButton accessibilityLabel={text('createRoom')} disabled={busy} onPress={() => { setError(null); void run(flow.createRoom()); }}>{text('createRoom')}</FolkButton>
          <TextInput accessibilityLabel={text('roomCodePlaceholder')} autoCapitalize="characters" maxLength={5} placeholder={text('roomCodePlaceholder')} placeholderTextColor="#805B3C" style={styles.input} value={code} onChangeText={(value) => { setCode(value.toUpperCase()); setError(null); }} />
          <FolkButton variant="blue" accessibilityLabel={text('joinRoom')} disabled={busy} onPress={() => { setError(null); void run(flow.joinRoom(code)); }}>{text('joinRoom')}</FolkButton>
          {errorText && <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text>}
        </FolkPanel>
      </View>
    </FolkSurface>
  );
}

const styles = StyleSheet.create({
  surface: { padding: 20 },
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', maxWidth: 520, width: '100%' },
  title: { color: '#FFF3CC', fontSize: 28, fontWeight: '900', marginTop: -10, textShadowColor: '#3A1D13', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 2 },
  plaque: { height: 112, marginBottom: -70, maxWidth: 480, width: '100%' },
  panel: { marginTop: 28, width: '100%' },
  empty: { color: '#5A3521', marginTop: 12, textAlign: 'center' },
  currentRoom: { alignItems: 'center', borderColor: '#A63D2F', borderRadius: 12, borderWidth: 2, marginBottom: 10, minHeight: 64, padding: 10, width: '100%' },
  currentRoomLabel: { color: '#755846', fontSize: 13 },
  currentRoomCode: { color: '#A63D2F', fontSize: 20, fontWeight: '900', letterSpacing: 4, marginTop: 2 },
  input: { backgroundColor: '#FFF9EC', borderColor: '#9C6737', borderRadius: 10, borderWidth: 2, color: '#43291F', fontSize: 20, letterSpacing: 4, marginTop: 14, minHeight: 58, paddingHorizontal: 16, textAlign: 'center', width: '100%' },
  error: { color: '#A63D2F', fontWeight: '700', marginTop: 16, textAlign: 'center' },
  back: { alignSelf: 'flex-start', minHeight: 44, padding: 4 },
  backText: { color: '#FFF3CC', fontSize: 38, fontWeight: '800', textShadowColor: '#3A1D13', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 2 },
});

import { useEffect, useMemo, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { createInterstitialGate } from '../ads/interstitial-gate';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { createRoomEntryFlow, type RoomEntryError } from '../game/room-entry';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { readReconnectCredential, saveReconnectCredential, type ReconnectCredential } from '../security/reconnect-credential';
import { FolkButton } from '../components/FolkButton';
import { FolkSurface } from '../components/FolkSurface';
import { folkAssets } from '../ui/folk-assets';
import { FolkBackButton, FolkTitle } from '../components/FolkChrome';

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
    try {
      const result = await action;
      if (!result.ok) setError(result.code ?? 'ENTRY_FAILED');
    } catch {
      setError('ENTRY_FAILED');
    } finally {
      setBusy(false);
    }
  };
  const errorText = error === 'INVALID_CODE' ? text('invalidRoomCode') : error === 'ROOM_FULL' ? text('roomFull') : error === 'ROOM_EXPIRED' || error === 'ROOM_NOT_FOUND' ? text('roomExpired') : error ? text('entryFailed') : null;
  return (
    <FolkSurface background="paper" contentStyle={styles.surface}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <FolkBackButton label={text('home')} onPress={() => router.replace('/')} style={styles.back} />
          <FolkTitle>{text('roomsTitle')}</FolkTitle>
        </View>
        <ImageBackground source={folkAssets.controls.paperPanel} resizeMode="stretch" style={styles.panel} imageStyle={styles.panelImage}>
          <Text style={styles.sectionTitle}>{text('currentRoom')}</Text>
          {currentRoom ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`${text('currentRoom')}: ${currentRoom.roomCode}`} style={styles.currentRoom} onPress={() => router.replace({ pathname: '/reconnecting', params: { roomCode: currentRoom.roomCode, sessionId: currentRoom.sessionId } })}>
              <Text style={styles.currentRoomLabel}>{text('currentRoom')}</Text><Text style={styles.currentRoomCode}>{currentRoom.roomCode}</Text>
            </Pressable>
          ) : (
            <View style={styles.emptyState}><Image source={folkAssets.decorations.gate} resizeMode="contain" style={styles.gate} /><Text style={styles.empty}>{text('noCurrentRoom')}</Text></View>
          )}
          <FolkButton icon={folkAssets.icons.plus} accessibilityLabel={text('createRoom')} disabled={busy} onPress={() => { setError(null); void run(flow.createRoom()); }}>{text('createRoom')}</FolkButton>
          <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>{text('or')}</Text><View style={styles.line} /></View>
          <Text style={styles.inputLabel}>{text('roomCode')}</Text>
          <ImageBackground source={folkAssets.controls.inputFrame} resizeMode="stretch" style={styles.inputFrame}>
            <TextInput accessibilityLabel={text('roomCodePlaceholder')} autoCapitalize="characters" maxLength={5} placeholder={text('roomCodePlaceholder')} placeholderTextColor="#805B3C" style={styles.input} value={code} onChangeText={(value) => { setCode(value.toUpperCase()); setError(null); }} />
          </ImageBackground>
          <FolkButton variant="blue" icon={folkAssets.icons.joinDoor} accessibilityLabel={text('joinRoom')} disabled={busy} onPress={() => { setError(null); void run(flow.joinRoom(code)); }}>{text('joinRoom')}</FolkButton>
          {errorText ? <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text> : <Text style={styles.hint}>{text('privateRoomHint')}</Text>}
        </ImageBackground>
      </ScrollView>
    </FolkSurface>
  );
}

const styles = StyleSheet.create({
  surface: { backgroundColor: 'rgba(255,245,214,0.12)' },
  container: { alignItems: 'center', flexGrow: 1, paddingHorizontal: 14, paddingVertical: 10 },
  header: { alignItems: 'center', justifyContent: 'center', maxWidth: '100%', width: 332 },
  back: { left: 0, position: 'absolute', zIndex: 2 },
  panel: { alignItems: 'center', justifyContent: 'center', marginTop: 4, maxWidth: '100%', minHeight: 560, paddingHorizontal: 28, paddingVertical: 34, width: 332 },
  panelImage: { opacity: 0.96 },
  sectionTitle: { color: '#8A241A', fontSize: 20, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  emptyState: { alignItems: 'center', minHeight: 132 },
  gate: { height: 82, opacity: 0.58, width: 132 },
  empty: { color: '#5A3521', fontSize: 15, fontWeight: '700', marginTop: -8, textAlign: 'center' },
  currentRoom: { alignItems: 'center', borderColor: '#A63D2F', borderRadius: 12, borderWidth: 2, marginBottom: 12, minHeight: 104, justifyContent: 'center', padding: 10, width: '100%' },
  currentRoomLabel: { color: '#755846', fontSize: 13 },
  currentRoomCode: { color: '#A63D2F', fontSize: 20, fontWeight: '900', letterSpacing: 4, marginTop: 2 },
  divider: { alignItems: 'center', flexDirection: 'row', gap: 10, marginVertical: 4, width: '100%' },
  line: { backgroundColor: '#8A6547', flex: 1, height: 1 },
  or: { color: '#6F452C', fontSize: 14, fontWeight: '900' },
  inputLabel: { alignSelf: 'flex-start', color: '#6F452C', fontSize: 13, fontWeight: '800', marginLeft: 18, marginBottom: -12, zIndex: 2 },
  inputFrame: { height: 74, justifyContent: 'center', marginBottom: 2, width: '100%' },
  input: { color: '#43291F', fontSize: 18, letterSpacing: 4, minHeight: 54, paddingHorizontal: 24, textAlign: 'center', width: '100%' },
  error: { color: '#A63D2F', fontWeight: '700', marginTop: 8, textAlign: 'center' },
  hint: { color: '#55733C', fontSize: 12, marginTop: 8, textAlign: 'center' },
});

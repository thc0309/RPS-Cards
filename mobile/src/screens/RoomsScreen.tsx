import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { createInterstitialGate } from '../ads/interstitial-gate';
import { createOnlineRoomClient } from '../game/colyseus-client';
import { createRoomEntryFlow, type RoomEntryError } from '../game/room-entry';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { saveReconnectCredential } from '../security/reconnect-credential';

export function RoomsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ error?: RoomEntryError }>();
  const locale = useAppStore((state) => state.locale);
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);
  const [code, setCode] = useState('');
  const [error, setError] = useState<RoomEntryError | null>(params.error ?? null);
  const [busy, setBusy] = useState(false);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const flow = useMemo(() => createRoomEntryFlow(createOnlineRoomClient(), createInterstitialGate(), {
    saveCredential: (credential) => saveReconnectCredential(credential),
    openLobby: (roomCode, sessionId) => { setActiveRoom(roomCode); router.replace({ pathname: '/lobby', params: { roomCode, sessionId } }); },
  }), [router, setActiveRoom]);
  const run = async (action: Promise<{ readonly ok: boolean; readonly code?: RoomEntryError }>) => {
    setBusy(true);
    const result = await action;
    setBusy(false);
    if (!result.ok) setError(result.code ?? 'ENTRY_FAILED');
  };
  const errorText = error === 'INVALID_CODE' ? text('invalidRoomCode') : error === 'ROOM_FULL' ? text('roomFull') : error === 'ROOM_EXPIRED' || error === 'ROOM_NOT_FOUND' ? text('roomExpired') : error ? text('entryFailed') : null;
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>{text('roomsTitle')}</Text>
      <Text style={styles.empty}>{text('noCurrentRoom')}</Text>
      <Pressable accessibilityRole="button" disabled={busy} style={styles.primary} onPress={() => { setError(null); void run(flow.createRoom()); }}>
        <Text style={styles.primaryText}>{text('createRoom')}</Text>
      </Pressable>
      <TextInput
        accessibilityLabel={text('roomCodePlaceholder')}
        autoCapitalize="characters"
        maxLength={5}
        placeholder={text('roomCodePlaceholder')}
        style={styles.input}
        value={code}
        onChangeText={(value) => { setCode(value.toUpperCase()); setError(null); }}
      />
      <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={() => { setError(null); void run(flow.joinRoom(code)); }}>
        <Text style={styles.secondaryText}>{text('joinRoom')}</Text>
      </Pressable>
      {errorText && <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text>}
      <Pressable accessibilityRole="button" style={styles.back} onPress={() => router.replace('/')}><Text>{text('home')}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: '#F5E7C5', flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#43291F', fontSize: 30, fontWeight: '900' },
  empty: { color: '#755846', marginTop: 12 },
  primary: { alignItems: 'center', backgroundColor: '#A63D2F', borderRadius: 14, justifyContent: 'center', marginTop: 28, minHeight: 54, width: '100%' },
  primaryText: { color: '#FFF9EC', fontWeight: '800' },
  input: { backgroundColor: '#FFF9EC', borderColor: '#D8B77C', borderRadius: 12, borderWidth: 2, color: '#43291F', fontSize: 20, letterSpacing: 4, marginTop: 20, minHeight: 54, paddingHorizontal: 16, textAlign: 'center', width: '100%' },
  secondary: { alignItems: 'center', borderColor: '#A63D2F', borderRadius: 14, borderWidth: 2, justifyContent: 'center', marginTop: 12, minHeight: 54, width: '100%' },
  secondaryText: { color: '#A63D2F', fontWeight: '800' },
  error: { color: '#A63D2F', fontWeight: '700', marginTop: 16, textAlign: 'center' },
  back: { marginTop: 24, minHeight: 44, padding: 12 },
});

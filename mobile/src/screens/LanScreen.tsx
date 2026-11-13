import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { FolkButton } from '../components/FolkButton';
import { FolkBackButton, FolkTitle } from '../components/FolkChrome';
import { FolkSurface } from '../components/FolkSurface';
import { translate, type TranslationKey } from '../i18n';
import { useAppStore } from '../store/app-store';
import { folkAssets } from '../ui/folk-assets';
import { decodeLanQr, parseLanAddress, type LanInvitation } from '../lan/address';
import { connectLanRoom, scanLanRooms, startLanHost, type DiscoveredRoom, type LanRoomHandle } from '../lan/native';
import { lanCamera } from '../lan/camera';
import { isRoomCode, normalizeRoomCode } from '../game/room-entry';
import { setLanRoom } from '../game/room-client';
import { readReconnectCredential, saveReconnectCredential, type ReconnectCredential } from '../security/reconnect-credential';

const errors: Record<string, TranslationKey> = {
  NO_LOCAL_IP: 'lanNoNetwork', HOST_UNREACHABLE: 'lanUnreachable', ROOM_FULL: 'roomFull', ROOM_EXPIRED: 'lanClosed',
  WRONG_CODE: 'lanWrongCode', INCOMPATIBLE_VERSION: 'lanIncompatible', INVALID_CODE: 'invalidRoomCode', INVALID_ADDRESS: 'lanInvalidAddress', INVALID_QR: 'lanInvalidQr',
};
export function LanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ error?: string }>();
  const locale = useAppStore((s) => s.locale);
  const setActiveRoom = useAppStore((s) => s.setActiveRoom);
  const text = (key: TranslationKey) => translate(locale, key);
  const [rooms, setRooms] = useState<DiscoveredRoom[]>([]);
  const [scanning, setScanning] = useState(false);
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(params.error ?? '');
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [saved, setSaved] = useState<ReconnectCredential | null>(null);
  const mounted = useRef(true);
  const joining = useRef(false);
  const scanned = useRef(false);
  const stopScan = useRef<() => void>(() => {});
  const scan = () => { stopScan.current(); stopScan.current = scanLanRooms(setRooms, setScanning); };
  useEffect(() => {
    mounted.current = true;
    scan();
    void readReconnectCredential().then((value) => { if (mounted.current && value?.transport === 'lan') setSaved(value); }).catch(() => undefined);
    return () => { mounted.current = false; stopScan.current(); };
  }, []);
  const enter = async (make: () => Promise<LanRoomHandle>) => {
    if (joining.current) return;
    joining.current = true; setBusy(true); setError(''); stopScan.current();
    let handle: LanRoomHandle | undefined;
    try {
      handle = await make();
      const session = handle.isHost ? await handle.client.createRoom('lan-create') : await handle.client.joinRoom(handle.invitation.roomCode, '', 'lan-join');
      if (!mounted.current) { handle.dispose(); return; }
      if (!session.reconnectToken) throw new Error('ENTRY_FAILED');
      await saveReconnectCredential({ roomCode: session.roomCode, sessionId: session.sessionId, reconnectToken: session.reconnectToken, transport: 'lan', address: `${handle.invitation.host}:${handle.invitation.port}`, isHost: handle.isHost });
      if (!mounted.current) { handle.dispose(); return; }
      setLanRoom(handle); setActiveRoom(session.roomCode);
      router.replace({ pathname: '/lobby', params: { roomCode: session.roomCode, sessionId: session.sessionId } });
    } catch (e) { handle?.dispose(); if (mounted.current) setError(e instanceof Error ? e.message.split(':')[0] : 'ENTRY_FAILED'); }
    finally { joining.current = false; if (mounted.current) setBusy(false); }
  };
  const join = (invitation: LanInvitation) => { void enter(() => connectLanRoom(invitation)); };
  const manual = () => {
    try {
      const roomCode = normalizeRoomCode(code);
      if (!isRoomCode(roomCode)) throw new Error('INVALID_CODE');
      join({ ...parseLanAddress(address), roomCode });
    } catch (e) { setError(e instanceof Error ? e.message : 'ENTRY_FAILED'); }
  };
  const openCamera = async () => {
    stopScan.current(); setError('');
    try {
      const permission = await lanCamera.request();
      if (!mounted.current) return;
      setPermissionDenied(!permission.granted); setCanAskAgain(permission.canAskAgain);
      if (permission.granted) { scanned.current = false; setCameraOpen(true); }
    } catch { if (mounted.current) setPermissionDenied(true); }
  };
  const receiveQr = ({ data }: { data: string }) => {
    if (scanned.current) return;
    try {
      const invitation = decodeLanQr(data);
      scanned.current = true; setCameraOpen(false); setError('');
      setAddress(`${invitation.host}:${invitation.port}`); setCode(invitation.roomCode); join(invitation);
    } catch (e) { setError(e instanceof Error ? e.message : 'INVALID_QR'); }
  };
  const Camera = lanCamera.View;
  return <FolkSurface background="paper"><KeyboardAvoidingView style={{ flex: 1, width: '100%' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
    <View style={styles.header}><FolkBackButton label={text('home')} onPress={() => { stopScan.current(); setCameraOpen(false); router.replace('/'); }} /><FolkTitle>{text('lanPlay')}</FolkTitle></View>
    <ImageBackground source={folkAssets.controls.paperPanel} resizeMode="stretch" style={styles.panel}><View style={styles.content}>
      {saved ? <FolkButton disabled={busy} accessibilityLabel={text('currentRoom')} onPress={() => router.replace({ pathname: '/reconnecting', params: { roomCode: saved.roomCode, sessionId: saved.sessionId } })}>{text('currentRoom')}: {saved.roomCode}</FolkButton> : null}
      <FolkButton disabled={busy} accessibilityLabel={text('lanCreate')} onPress={() => void enter(startLanHost)}>{text('lanCreate')}</FolkButton>
      <Text style={styles.title}>{text('lanFind')}</Text>
      {scanning ? <View accessibilityLiveRegion="polite"><ActivityIndicator /><Text style={styles.hint}>{text('lanScanning')}</Text></View> : null}
      {rooms.length === 0 ? <Text style={styles.hint}>{text('lanEmpty')}</Text> : rooms.map((room) => <FolkButton key={`${room.host}:${room.port}`} disabled={busy} accessibilityLabel={`${room.label} ${room.roomCode}`} onPress={() => join(room)}>{room.label} · {room.roomCode}</FolkButton>)}
      <Text style={styles.hint}>{text('lanWifiHint')}</Text>
      <FolkButton disabled={busy} accessibilityLabel={text('lanRescan')} onPress={scan}>{text('lanRescan')}</FolkButton>
      <FolkButton variant="blue" disabled={busy} accessibilityLabel={text('lanScanQr')} onPress={() => void openCamera()}>{text('lanScanQr')}</FolkButton>
      {permissionDenied ? <View><Text accessibilityRole="alert" style={styles.error}>{text('lanCameraDenied')}</Text>{!canAskAgain ? <FolkButton accessibilityLabel={text('lanOpenSettings')} onPress={() => void Linking.openSettings()}>{text('lanOpenSettings')}</FolkButton> : null}</View> : null}
      {cameraOpen ? <View><Camera testID="lan-camera" style={{ height: 240, width: 240 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={receiveQr} /><FolkButton accessibilityLabel={text('close')} onPress={() => setCameraOpen(false)}>{text('close')}</FolkButton></View> : null}
      <Text style={styles.title}>{text('lanManual')}</Text>
      <TextInput style={styles.input} accessibilityLabel={text('lanAddress')} placeholder={text('lanAddressPlaceholder')} placeholderTextColor="#805B3C" autoCapitalize="none" autoCorrect={false} value={address} onChangeText={setAddress} maxLength={21} keyboardType="numbers-and-punctuation" />
      <TextInput style={[styles.input, { letterSpacing: 3 }]} accessibilityLabel={text('roomCodePlaceholder')} placeholder={text('roomCodePlaceholder')} placeholderTextColor="#805B3C" autoCapitalize="characters" autoCorrect={false} maxLength={5} value={code} onChangeText={(value) => { setCode(value.toUpperCase()); setError(''); }} />
      <Pressable accessibilityRole="button" accessibilityLabel={text('paste')} style={styles.paste} onPress={() => void Clipboard.getStringAsync().then((value) => { if (mounted.current) setCode(value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)); }).catch(() => undefined)}><Text style={styles.title}>{text('paste')}</Text></Pressable>
      <FolkButton variant="blue" disabled={busy} accessibilityLabel={text('joinRoom')} onPress={manual}>{text('joinRoom')}</FolkButton>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{text(errors[error] ?? 'entryFailed')}</Text> : null}
    </View></ImageBackground>
  </ScrollView></KeyboardAvoidingView></FolkSurface>;
}
const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 12, paddingBottom: 24 },
  header: { alignItems: 'center', flexDirection: 'row', maxWidth: 360, width: '100%' },
  panel: { maxWidth: 380, width: '100%' },
  content: { alignItems: 'stretch', paddingHorizontal: 38, paddingVertical: 48, gap: 8 },
  title: { color: '#8A241A', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  hint: { color: '#5A3521', fontSize: 14, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#8C5A2C', borderRadius: 8, backgroundColor: '#FFF0C6', color: '#43291F', minHeight: 54, padding: 10, textAlign: 'center', fontSize: 16 },
  paste: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  error: { color: '#A63D2F', textAlign: 'center', fontSize: 14, fontWeight: '800' },
});
